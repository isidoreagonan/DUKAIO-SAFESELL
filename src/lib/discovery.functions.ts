/**
 * Découverte : lecture des publicités collectées (comptes connectés) et
 * lancement des collectes (administrateurs uniquement).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { estimateRevenue, toFcfa } from "@/lib/discovery-estimate";
import { discoveryRules, type DiscoveryPlanKey } from "@/lib/discovery-plan";


export type DiscoveryAd = Tables<"discovery_ads"> & { media_signed_url?: string | null };
export type DiscoveryStoreRow = Tables<"discovery_stores">;

type AuthedContext = {
  supabase: {
    from: (table: string) => any;
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }>;
  };
  userId: string;
  claims: Record<string, unknown>;
};

async function assertAdmin(context: unknown) {
  const ctx = context as unknown as AuthedContext;
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (data !== true) throw new Error("Accès réservé aux administrateurs.");
  return ctx;
}

/**
 * Formule effective du compte pour la Découverte. Les administrateurs et les
 * abonnés payants voient tout ; la formule gratuite reste sur un échantillon.
 */
async function discoveryPlanOf(ctx: AuthedContext): Promise<DiscoveryPlanKey> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: admin } = await supabaseAdmin.rpc("has_role", {
      _user_id: ctx.userId,
      _role: "admin",
    });
    if (admin === true) return "pro";
    const { data: tier } = await supabaseAdmin.rpc("best_plan_key", { _user_id: ctx.userId });
    const value = Number(tier ?? 0);
    if (value >= 2) return "pro";
    if (value >= 1) return "starter";
  } catch {
    return "free";
  }
  return "free";
}



/** Liens signés pour les copies durables des visuels (le stockage est privé). */
async function withSignedMedia(ads: DiscoveryAd[]): Promise<DiscoveryAd[]> {
  const paths = ads.map((ad) => ad.media_path).filter((value): value is string => !!value);
  if (paths.length === 0) return ads;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.storage.from("store-media").createSignedUrls(paths, 3600);
    const map = new Map((data ?? []).map((item) => [item.path ?? "", item.signedUrl]));
    return ads.map((ad) => ({
      ...ad,
      media_signed_url: ad.media_path ? map.get(ad.media_path) ?? null : null,
    }));
  } catch {
    return ads;
  }
}



/** Texte comparable : minuscules, sans accents ni ponctuation. */
function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Mots recherchés (tous doivent être présents). */
function searchTokens(term: string) {
  return normalizeText(term).split(" ").filter(Boolean);
}

function matchesTokens(haystack: string, tokens: string[]) {
  if (tokens.length === 0) return true;
  const text = normalizeText(haystack);
  return tokens.every((token) => text.includes(token));
}

/** Tout ce qui décrit un produit dans une publicité. */
function adSearchText(ad: DiscoveryAd) {
  return [
    ad.headline,
    ad.body,
    ad.keyword,
    ad.category,
    ad.cta_text,
    ad.page_name,
    ad.landing_domain,
    (ad.page_categories ?? []).join(" "),
  ]
    .filter(Boolean)
    .join(" ");
}

/** Titres des produits du catalogue d'une boutique repérée. */
function storeSearchText(store: DiscoveryStoreRow | null | undefined) {
  if (!store) return "";
  const products = Array.isArray(store.products) ? (store.products as unknown[]) : [];
  const titles = products
    .map((item) =>
      item && typeof item === "object"
        ? String((item as Record<string, unknown>)["title"] ?? (item as Record<string, unknown>)["name"] ?? "")
        : "",
    )
    .join(" ");
  return [store.name, store.domain, titles].filter(Boolean).join(" ");
}


/**
 * Formule gratuite : l'aperçu se limite aux boutiques les mieux notées de
 * l'échantillon imposé. Publicités et produits proviennent uniquement de ces
 * boutiques, jamais du reste de la base.
 */
async function freeSampleDomains(
  ctx: AuthedContext,
  rules: { stores: number; country: string | null; category: string | null },
): Promise<string[]> {
  let query = ctx.supabase
    .from("discovery_ads")
    .select("landing_domain, traction_score")
    .not("landing_domain", "is", null);
  if (rules.country) query = query.eq("country", rules.country);
  if (rules.category) query = query.eq("category", rules.category);
  const { data } = await query.order("traction_score", { ascending: false }).limit(2000);
  const domains: string[] = [];
  for (const row of (data ?? []) as { landing_domain: string | null }[]) {
    const domain = row.landing_domain;
    if (!domain || domains.includes(domain)) continue;
    domains.push(domain);
    if (domains.length >= rules.stores) break;
  }
  return domains;
}


const filters = z.object({
  country: z.string().max(4).optional(),
  countries: z.array(z.string().max(4)).max(12).optional(),
  category: z.string().max(60).optional(),
  media: z.enum(["all", "video", "image"]).default("all"),
  status: z.enum(["all", "active", "inactive"]).default("all"),
  platform: z.string().max(30).optional(),
  source: z.string().max(20).optional(),
  pixel: z.string().max(20).optional(),
  domain: z.string().max(120).optional(),
  pageId: z.string().max(60).optional(),
  minDays: z.number().int().min(0).max(365).default(0),
  maxDays: z.number().int().min(1).max(3650).optional(),
  minTraction: z.number().int().min(0).max(100).default(0),
  minVariations: z.number().int().min(1).max(100).optional(),
  search: z.string().max(120).optional(),
  sort: z.enum(["traction", "recent", "duration", "variations"]).default("traction"),
  limit: z.number().int().min(1).max(2000).default(60),
});

export type DiscoveryFilters = z.infer<typeof filters>;

/** Liste filtrée des publicités de la Découverte. */
export const listDiscoveryAds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => filters.parse(data ?? {}))
  .handler(async ({ data: input, context }) => {
    const ctx = context as unknown as AuthedContext;
    const rules = discoveryRules(await discoveryPlanOf(ctx));
    /* Formule gratuite : échantillon imposé (niche beauté, France), sans filtre. */
    const data: DiscoveryFilters = rules.filters
      ? { ...input, limit: Math.min(input.limit, rules.ads) }
      : {
          media: "all",
          status: "active",
          minDays: 0,
          minTraction: 0,
          sort: "traction",
          limit: rules.ads,
          ...(rules.country ? { country: rules.country } : {}),
          ...(rules.category ? { category: rules.category } : {}),
        };
    let query = ctx.supabase.from("discovery_ads").select("*");

    if (!rules.filters) {
      const domains = await freeSampleDomains(ctx, rules);
      if (domains.length === 0) return [];
      query = query.in("landing_domain", domains);
    }

    if (data.country) query = query.eq("country", data.country);
    if (data.countries?.length) query = query.in("country", data.countries);
    if (data.category) query = query.eq("category", data.category);
    if (data.media !== "all") query = query.eq("media_type", data.media);
    if (data.status !== "all") query = query.eq("is_active", data.status === "active");
    if (data.platform) query = query.contains("publisher_platforms", [data.platform]);
    if (data.source) query = query.eq("platform", data.source);
    /* Filtre pixel : domaines dont le HTML public expose réellement cet outil de suivi. */
    if (data.pixel) {
      const { data: tracked } = await ctx.supabase
        .from("discovery_stores")
        .select("domain")
        .contains("pixels", [data.pixel])
        .limit(2000);
      const domains = ((tracked ?? []) as { domain: string }[]).map((row) => row.domain);
      if (domains.length === 0) return [];
      query = query.in("landing_domain", domains);
    }
    if (data.domain) query = query.eq("landing_domain", data.domain);
    if (data.pageId) query = query.eq("page_id", data.pageId);
    if (data.minDays > 0) query = query.gte("active_days", data.minDays);
    if (data.maxDays) query = query.lte("active_days", data.maxDays);
    if (data.minTraction > 0) query = query.gte("traction_score", data.minTraction);
    if (data.minVariations) query = query.gte("variations_count", data.minVariations);
    const column =
      data.sort === "recent"
        ? "started_at"
        : data.sort === "duration"
          ? "active_days"
          : data.sort === "variations"
            ? "variations_count"
            : "traction_score";
    const { data: rows, error } = await query
      .order(column, { ascending: false, nullsFirst: false })
      .limit(data.search ? 1000 : data.limit);
    if (error) throw new Error(error.message);
    let list = (rows ?? []) as DiscoveryAd[];
    if (data.search) {
      const tokens = searchTokens(data.search);
      list = list.filter((ad) => matchesTokens(adSearchText(ad), tokens)).slice(0, data.limit);
    }
    return withSignedMedia(list);
  });


/** Options réellement présentes en base, pour que les filtres n'affichent jamais du vide. */
export const getDiscoveryFacets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as AuthedContext;
    const { data } = await ctx.supabase
      .from("discovery_ads")
      .select("country, category, landing_domain, publisher_platforms, platform, last_seen_at")
      .limit(2000);
    const rows = (data ?? []) as Pick<
      Tables<"discovery_ads">,
      "country" | "category" | "landing_domain" | "publisher_platforms" | "platform" | "last_seen_at"
    >[];
    const count = (values: (string | null)[]) => {
      const map = new Map<string, number>();
      for (const value of values) {
        if (!value) continue;
        map.set(value, (map.get(value) ?? 0) + 1);
      }
      return Array.from(map.entries())
        .map(([value, total]) => ({ value, total }))
        .sort((a, b) => b.total - a.total);
    };
    return {
      total: rows.length,
      countries: count(rows.map((row) => row.country)),
      categories: count(rows.map((row) => row.category)),
      domains: count(rows.map((row) => row.landing_domain)).slice(0, 40),
      platforms: count(rows.flatMap((row) => row.publisher_platforms ?? [])),
      sources: count(rows.map((row) => row.platform)),
      updatedAt: rows.map((row) => row.last_seen_at).sort().at(-1) ?? null,
    };
  });

/** Fiche « Analyser » : la publicité, les autres créations de l'annonceur, ses totaux. */
export const getDiscoveryAdDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as AuthedContext;
    const { data: ad } = await ctx.supabase
      .from("discovery_ads")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!ad) return null;
    const advertiser = ad as DiscoveryAd;
    const { data: siblings } = await ctx.supabase
      .from("discovery_ads")
      .select("*")
      .eq("page_id", advertiser.page_id ?? "")
      .order("traction_score", { ascending: false })
      .limit(48);
    const others = ((siblings ?? []) as DiscoveryAd[]).filter((row) => row.id !== advertiser.id);
    const all = await withSignedMedia([advertiser, ...others]);
    const head = all[0]!;
    const rest = all.slice(1);

    // Boutique liée (catalogue public déjà analysé lors de la collecte).
    let store: DiscoveryStoreRow | null = null;
    if (advertiser.landing_domain) {
      const { data: found } = await ctx.supabase
        .from("discovery_stores")
        .select("*")
        .eq("domain", advertiser.landing_domain)
        .maybeSingle();
      store = (found ?? null) as DiscoveryStoreRow | null;
    }

    return {
      ad: head,
      others: rest,
      store,
      stats: {
        totalAds: all.length,
        activeAds: all.filter((row) => row.is_active).length,
        videos: all.filter((row) => row.media_type === "video").length,
        maxDuration: all.reduce((max, row) => Math.max(max, row.active_days), 0),
        avgTraction: Math.round(all.reduce((sum, row) => sum + row.traction_score, 0) / all.length),
        countries: Array.from(new Set(all.map((row) => row.country))),
        platforms: Array.from(new Set(all.flatMap((row) => row.publisher_platforms))),
        followers: head.page_like_count ?? null,
        reach: all.reduce((sum, row) => sum + (row.reach_estimate ?? 0), 0) || null,
        firstSeen:
          all
            .map((row) => row.started_at)
            .filter((value): value is string => !!value)
            .sort()[0] ?? null,
        timeline: buildTimeline(all),
      },
    };
  });

/** Historique du nombre de pubs lancées par mois (pour les graphiques). */
function buildTimeline(ads: DiscoveryAd[]) {
  const map = new Map<string, number>();
  for (const ad of ads) {
    if (!ad.started_at) continue;
    const key = ad.started_at.slice(0, 7);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, total]) => ({ month, total }));
}

/**
 * Publicités correspondant au mot cherché, lues directement en base.
 * Sans cela, une nouveauté fraîchement collectée peut tomber hors des
 * 2 000 lignes les mieux classées et sembler « introuvable ».
 */
async function adsMatchingSearch(
  ctx: AuthedContext,
  term: string,
  filters: { country?: string | undefined; category?: string | undefined },
) {
  const clean = term.trim();
  if (clean.length < 2) return [] as DiscoveryAd[];
  const like = `%${clean}%`;
  let query = ctx.supabase.from("discovery_ads").select("*");
  if (filters.country) query = query.eq("country", filters.country);
  if (filters.category) query = query.eq("category", filters.category);
  const { data } = await query
    .or(
      `page_name.ilike.${like},headline.ilike.${like},body.ilike.${like},landing_domain.ilike.${like},keyword.ilike.${like}`,
    )
    .order("last_seen_at", { ascending: false })
    .limit(400);
  return (data ?? []) as DiscoveryAd[];
}

/** Fusionne deux lots de publicités sans doublon. */
function mergeAds(base: DiscoveryAd[], extra: DiscoveryAd[]) {
  const seen = new Set(base.map((ad) => ad.id));
  for (const ad of extra) {
    if (seen.has(ad.id)) continue;
    seen.add(ad.id);
    base.push(ad);
  }
  return base;
}


const storeFilters = z.object({
  country: z.string().max(4).optional(),
  category: z.string().max(60).optional(),
  search: z.string().max(120).optional(),
  platform: z.string().max(30).optional(),
  minAds: z.number().int().min(0).max(500).default(0),
  sort: z.enum(["traction", "ads", "duration", "products", "recent"]).default("traction"),
});

/** Annonceurs agrégés : l'onglet « Boutiques » de la Découverte. */
export const listDiscoveryAdvertisers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => storeFilters.parse(data ?? {}))
  .handler(async ({ data: input, context }) => {
    const ctx = context as unknown as AuthedContext;
    const rules = discoveryRules(await discoveryPlanOf(ctx));
    const data: z.infer<typeof storeFilters> = rules.filters
      ? input
      : {
          minAds: 0,
          sort: "traction",
          ...(rules.country ? { country: rules.country } : {}),
          ...(rules.category ? { category: rules.category } : {}),
        };
    let query = ctx.supabase.from("discovery_ads").select("*");


    if (data.country) query = query.eq("country", data.country);
    if (data.category) query = query.eq("category", data.category);
    if (!rules.filters) {
      const domains = await freeSampleDomains(ctx, rules);
      if (domains.length === 0) return [];
      query = query.in("landing_domain", domains);
    }
    const { data: rows } = await query.order("traction_score", { ascending: false }).limit(2000);
    const raw = (rows ?? []) as DiscoveryAd[];
    if (data.search && rules.filters) {
      mergeAds(
        raw,
        await adsMatchingSearch(ctx, data.search, { country: data.country, category: data.category }),
      );
    }
    let ads = await withSignedMedia(raw);


    const { data: storeRows } = await ctx.supabase.from("discovery_stores").select("*").limit(2000);
    const stores = new Map(
      ((storeRows ?? []) as DiscoveryStoreRow[]).map((store) => [store.domain, store]),
    );

    if (data.search) {
      const tokens = searchTokens(data.search);
      ads = ads.filter((ad) =>
        matchesTokens(
          `${adSearchText(ad)} ${storeSearchText(ad.landing_domain ? stores.get(ad.landing_domain) : null)}`,
          tokens,
        ),
      );
    }


    const groups = new Map<string, DiscoveryAd[]>();
    for (const ad of ads) {
      const key = ad.page_id ?? ad.page_name;
      const list = groups.get(key) ?? [];
      list.push(ad);
      groups.set(key, list);
    }

    const result = Array.from(groups.entries()).map(([key, list]) => {
      const head = list[0]!;
      const domain = list.find((row) => row.landing_domain)?.landing_domain ?? null;
      const store = domain ? stores.get(domain) ?? null : null;
      const activeAds = list.filter((row) => row.is_active).length;
      const avgPrice = store?.avg_price ?? 0;
      return {
        key,
        pageId: head.page_id,
        pageName: head.page_name,
        avatar: head.page_avatar_url,
        followers: head.page_like_count,
        domain,
        platform: store?.platform ?? null,
        productsCount: store?.products_count ?? 0,
        avgPrice,
        currency: store?.currency ?? head.currency ?? null,
        productImages: (((store?.products ?? []) as { image?: string | null }[]) || [])
          .map((product) => product.image ?? null)
          .filter((value): value is string => !!value)
          .slice(0, 6),
        category: head.category,
        categories: Array.from(new Set(list.flatMap((row) => row.page_categories ?? []))).slice(0, 3),
        countries: Array.from(new Set(list.map((row) => row.country))),
        totalAds: list.length,
        activeAds,
        videos: list.filter((row) => row.media_type === "video").length,
        maxDuration: list.reduce((max, row) => Math.max(max, row.active_days), 0),
        traction: Math.round(list.reduce((sum, row) => sum + row.traction_score, 0) / list.length),
        reach: list.reduce((sum, row) => sum + (row.reach_estimate ?? 0), 0) || null,
        // Pression publicitaire = base honnête de nos estimations (aucun CA inventé).
        adPressure: activeAds * Math.max(1, Math.round(list.reduce((s, r) => s + r.active_days, 0) / list.length)),
        avgPriceFcfa: Math.round(toFcfa(avgPrice, store?.currency ?? head.currency ?? null)),
        estimate: estimateRevenue({
          avgPrice,
          currency: store?.currency ?? head.currency ?? null,
          activeAds,
          avgDays: Math.round(list.reduce((s, r) => s + r.active_days, 0) / list.length),
          followers: head.page_like_count,
        }),

        timeline: buildTimeline(list),
        bestAds: list.slice(0, 4).map((row) => ({
          id: row.id,
          thumb: row.media_signed_url ?? row.thumbnail_url,
          days: row.active_days,
        })),
        creatives: list.slice(0, 4).map((row) => row.media_signed_url ?? row.thumbnail_url),
        sinceDate:
          list
            .map((row) => row.started_at)
            .filter((value): value is string => !!value)
            .sort()[0] ?? null,
        topAdId: head.id,
      };
    });

    const filtered = result
      .filter((store) => store.activeAds >= data.minAds)
      .filter((store) =>
        data.platform
          ? (store.platform ?? "").toLowerCase().includes(data.platform.toLowerCase())
          : true,
      );

    /* Boutiques analysées dont aucune publicité n'a encore été rattachée :
       elles doivent quand même apparaître dans la liste après une recherche. */
    if (data.search && rules.filters) {
      const tokens = searchTokens(data.search);
      const shown = new Set(filtered.map((store) => store.domain).filter(Boolean));
      for (const store of stores.values()) {
        if (shown.has(store.domain)) continue;
        if (!matchesTokens(storeSearchText(store), tokens)) continue;
        if (data.minAds > 0) continue;
        if (
          data.platform &&
          !(store.platform ?? "").toLowerCase().includes(data.platform.toLowerCase())
        )
          continue;
        const currency = store.currency ?? null;
        const avgPrice = store.avg_price ?? 0;
        filtered.push({
          key: `store:${store.domain}`,
          pageId: null,
          pageName: store.name ?? store.domain,
          avatar: null,
          followers: null,
          domain: store.domain,
          platform: store.platform ?? null,
          productsCount: store.products_count ?? 0,
          avgPrice,
          currency,
          productImages: (((store.products ?? []) as { image?: string | null }[]) || [])
            .map((product) => product.image ?? null)
            .filter((value): value is string => !!value)
            .slice(0, 6),
          category: "boutique",
          categories: [],
          countries: store.country ? [store.country] : [],
          totalAds: 0,
          activeAds: 0,
          videos: 0,
          maxDuration: 0,
          traction: 0,
          reach: null,
          adPressure: 0,
          avgPriceFcfa: Math.round(toFcfa(avgPrice, currency)),
          estimate: estimateRevenue({
            avgPrice,
            currency,
            activeAds: 0,
            avgDays: 0,
            followers: null,
          }),
          timeline: [],
          bestAds: [],
          creatives: [],
          sinceDate: store.launched_at ?? null,
          topAdId: `store:${store.domain}`,
        });
      }
    }


    const sorted = filtered.sort((a, b) => {
      if (data.sort === "ads") return b.totalAds - a.totalAds;
      if (data.sort === "duration") return b.maxDuration - a.maxDuration;
      if (data.sort === "products") return b.productsCount - a.productsCount;
      if (data.sort === "recent") return (b.sinceDate ?? "").localeCompare(a.sinceDate ?? "");
      return b.traction - a.traction;
    });
    return sorted.slice(0, rules.stores);

  });

export type DiscoveryStore = Awaited<ReturnType<typeof listDiscoveryAdvertisers>>[number];

const productFilters = z.object({
  category: z.string().max(60).optional(),
  country: z.string().max(4).optional(),
  search: z.string().max(120).optional(),
  sort: z.enum(["traction", "ads", "duration", "price"]).default("traction"),
});

/** Produits mis en avant par les annonceurs (offres réellement poussées en pub). */
export const listDiscoveryProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => productFilters.parse(data ?? {}))
  .handler(async ({ data: input, context }) => {
    const ctx = context as unknown as AuthedContext;
    const rules = discoveryRules(await discoveryPlanOf(ctx));
    const data: z.infer<typeof productFilters> = rules.filters
      ? input
      : {
          sort: "traction",
          ...(rules.country ? { country: rules.country } : {}),
          ...(rules.category ? { category: rules.category } : {}),
        };
    let query = ctx.supabase.from("discovery_ads").select("*");

    if (data.category) query = query.eq("category", data.category);
    if (data.country) query = query.eq("country", data.country);
    if (!rules.filters) {
      const domains = await freeSampleDomains(ctx, rules);
      if (domains.length === 0) return [];
      query = query.in("landing_domain", domains);
    }
    const { data: rows } = await query.order("traction_score", { ascending: false }).limit(2000);
    const raw = (rows ?? []) as DiscoveryAd[];
    if (data.search && rules.filters) {
      mergeAds(
        raw,
        await adsMatchingSearch(ctx, data.search, { country: data.country, category: data.category }),
      );
    }
    let ads = await withSignedMedia(raw);

    const { data: storeRows } = await ctx.supabase.from("discovery_stores").select("*").limit(2000);
    const stores = new Map(
      ((storeRows ?? []) as DiscoveryStoreRow[]).map((store) => [store.domain, store]),
    );

    if (data.search) {
      const tokens = searchTokens(data.search);
      ads = ads.filter((ad) =>
        matchesTokens(
          `${adSearchText(ad)} ${storeSearchText(ad.landing_domain ? stores.get(ad.landing_domain) : null)}`,
          tokens,
        ),
      );
    }


    const groups = new Map<string, DiscoveryAd[]>();
    for (const ad of ads) {
      const key = (ad.headline || ad.page_name).trim().toLowerCase().slice(0, 60) || ad.id;
      const list = groups.get(key) ?? [];
      list.push(ad);
      groups.set(key, list);
    }

    const result = Array.from(groups.values()).map((list) => {
      const head = list[0]!;
      const store = head.landing_domain ? stores.get(head.landing_domain) ?? null : null;
      return {
        id: head.id,
        title: head.headline || head.page_name,
        body: head.body,
        image: head.media_signed_url ?? head.thumbnail_url ?? head.image_url,
        video: head.video_url,
        category: head.category,
        pageName: head.page_name,
        avatar: head.page_avatar_url,
        domain: head.landing_domain,
        link: head.link_url,
        platform: store?.platform ?? null,

        price: store?.avg_price ?? 0,
        currency: store?.currency ?? null,
        productsCount: store?.products_count ?? 0,
        adsCount: list.length,
        activeAds: list.filter((row) => row.is_active).length,
        maxDuration: list.reduce((max, row) => Math.max(max, row.active_days), 0),
        traction: Math.max(...list.map((row) => row.traction_score)),
        countries: Array.from(new Set(list.map((row) => row.country))),
        timeline: buildTimeline(list),
      };
    });

    return result
      .sort((a, b) => {
        if (data.sort === "ads") return b.adsCount - a.adsCount;
        if (data.sort === "duration") return b.maxDuration - a.maxDuration;
        if (data.sort === "price")
          return toFcfa(b.price, b.currency) - toFcfa(a.price, a.currency);
        return b.traction - a.traction;
      })
      .slice(0, rules.products);

  });

export type DiscoveryProduct = Awaited<ReturnType<typeof listDiscoveryProducts>>[number];

/** Lance une collecte (administrateurs). */
export const runDiscoveryScanFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        countries: z.array(z.string().max(4)).max(8).optional(),
        keywords: z.array(z.string().max(60)).max(6).optional(),
        country: z.string().max(4).optional(),
        keyword: z.string().max(60).optional(),
        category: z.string().max(60).optional(),
        limit: z.number().int().min(10).max(60).optional(),
        network: z.enum(["meta", "google_ads", "both"]).optional(),
        media: z.enum(["video", "image", "all"]).optional(),
        status: z.enum(["active", "inactive", "all"]).optional(),
        minDays: z.number().int().min(0).max(365).optional(),
        minVariations: z.number().int().min(0).max(50).optional(),
        domain: z.string().max(120).optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { runDiscoveryScan, runGoogleAdsScan } = await import("./discovery.server");
    const network = data.network ?? "meta";
    // La collecte suit le filtre Réseau : Meta seul, Google Ads seul, ou les deux.
    if (network === "google_ads") return runGoogleAdsScan(data);
    const meta = await runDiscoveryScan(data);
    if (network === "meta") return meta;
    const google = await runGoogleAdsScan({ ...data, limit: Math.min(data.limit ?? 20, 25) });
    return {
      ok: meta.ok || google.ok,
      reason: meta.ok || google.ok ? undefined : (meta.reason ?? google.reason),
      found: meta.found + google.found,
      inserted: meta.inserted + google.inserted,
      updated: meta.updated + google.updated,
      countries: meta.countries ?? google.countries,
      keywords: Array.from(new Set([...(meta.keywords ?? []), ...(google.keywords ?? [])])),
    };
  });

/** Rafraîchit le catalogue public d'une boutique (administrateurs). */
export const refreshDiscoveryStoreFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ domain: z.string().min(3).max(120) }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { refreshStoreProfile } = await import("./discovery.server");
    return refreshStoreProfile(data.domain);
  });

/**
 * Complète les prix manquants d'une liste de domaines : lecture publique des
 * catalogues encore inconnus, périmés ou sans prix (aucun crédit Apify).
 */
export const refreshDiscoveryPricesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ domains: z.array(z.string().min(3).max(120)).max(60) }).parse(data ?? { domains: [] }),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as AuthedContext;
    /* Formule gratuite : aucune analyse de catalogue, même en lecture publique. */
    if (!discoveryRules(await discoveryPlanOf(ctx)).filters) return { refreshed: 0 };
    const wanted = Array.from(
      new Set(
        data.domains
          .map((d) => d.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ?? "")
          .filter((d) => d.includes(".")),
      ),
    );
    if (wanted.length === 0) return { refreshed: 0 };

    const { data: rows } = await ctx.supabase
      .from("discovery_stores")
      .select("*")
      .in("domain", wanted);
    const known = new Map(((rows ?? []) as DiscoveryStoreRow[]).map((row) => [row.domain, row]));

    const stale = wanted.filter((domain) => {
      const row = known.get(domain);
      if (!row) return true;
      if (!row.last_fetched_at) return true;
      if (Number(row.avg_price ?? 0) <= 0) return true;
      return Date.now() - new Date(row.last_fetched_at).getTime() > 7 * 86_400_000;
    });
    if (stale.length === 0) return { refreshed: 0 };

    const { refreshStoreProfile } = await import("./discovery.server");
    const batch = stale.slice(0, 8);
    const results = await Promise.allSettled(batch.map((domain) => refreshStoreProfile(domain)));
    return {
      refreshed: results.filter((item) => item.status === "fulfilled" && item.value).length,
      remaining: Math.max(0, stale.length - batch.length),
    };
  });

/**
 * Analyse à la demande du catalogue d'une boutique quand la fiche est absente
 * ou trop ancienne (accessible à tout compte connecté, lecture publique du site).
 */
export const ensureDiscoveryStoreFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ domain: z.string().min(3).max(120) }).parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as AuthedContext;
    if (!discoveryRules(await discoveryPlanOf(ctx)).filters) {
      throw new Error("L'analyse d'une boutique est réservée aux formules Starter et Pro.");
    }
    const clean = data.domain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]!;
    const { data: existing } = await ctx.supabase
      .from("discovery_stores")
      .select("*")
      .eq("domain", clean)
      .maybeSingle();
    const row = (existing ?? null) as DiscoveryStoreRow | null;
    const fresh =
      row && row.last_fetched_at && Date.now() - new Date(row.last_fetched_at).getTime() < 7 * 86_400_000;
    if (row && fresh && Number(row.avg_price ?? 0) > 0) return row;
    const { refreshStoreProfile } = await import("./discovery.server");
    return (await refreshStoreProfile(clean)) as DiscoveryStoreRow | null;
  });

/** Journal des collectes (administrateurs). */
export const listDiscoveryScans = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = await assertAdmin(context);
    const { data } = await ctx.supabase
      .from("discovery_scans")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    return (data ?? []) as Tables<"discovery_scans">[];
  });

/**
 * Recherche en direct d'une marque (abonnés Starter et Pro). Si la marque n'a
 * jamais été collectée, on interroge la bibliothèque publicitaire à la demande,
 * puis on analyse le catalogue des boutiques trouvées (prix, produits).
 */
export const searchDiscoveryBrandFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        term: z.string().min(3).max(60),
        country: z.string().max(4).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as AuthedContext;
    const plan = await discoveryPlanOf(ctx);
    const rules = discoveryRules(plan);
    if (rules.liveSearches <= 0) {
      throw new Error("La recherche en direct d'une marque est réservée aux formules payantes.");
    }

    const term = data.term.trim();
    const countries = data.country
      ? [data.country.toUpperCase().slice(0, 2)]
      : ["BJ", "CI", "SN", "CM"];

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    /* Quota mensuel : chaque recherche en direct coûte de la collecte publicitaire. */
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const { count: usedRaw } = await supabaseAdmin
      .from("discovery_brand_searches")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ctx.userId)
      .eq("billed", true)
      .gte("created_at", monthStart.toISOString());

    const used = Number(usedRaw ?? 0);
    if (used >= rules.liveSearches) {
      throw new Error(
        `Vous avez utilisé vos ${rules.liveSearches} recherches de marque de ce mois-ci. Le compteur repart au 1er du mois prochain.`,
      );
    }


    /* Cache serveur : une même marque n'est ré-interrogée qu'une fois par 24 h
       (recherche identique, même pays), et au plus une fois par 6 h en approchant. */
    const exactSince = new Date(Date.now() - 24 * 3_600_000).toISOString();
    const fuzzySince = new Date(Date.now() - 6 * 3_600_000).toISOString();
    const { data: exact } = await supabaseAdmin
      .from("discovery_scans")
      .select("keyword, country, found, inserted, updated, created_at")
      .ilike("keyword", term)
      .gte("created_at", exactSince)
      .order("created_at", { ascending: false })
      .limit(4);
    const exactHit = ((exact ?? []) as { country: string | null }[]).find(
      (row) => !row.country || countries.includes(row.country.toUpperCase()),
    ) as { found: number | null; updated: number | null } | undefined;

    let cached = exactHit;
    if (!cached) {
      const { data: recent } = await supabaseAdmin
        .from("discovery_scans")
        .select("keyword, found, inserted, updated, created_at")
        .ilike("keyword", `%${term}%`)
        .gte("created_at", fuzzySince)
        .order("created_at", { ascending: false })
        .limit(1);
      cached = (recent ?? [])[0] as { found: number | null; updated: number | null } | undefined;
    }


    const { runDiscoveryScan, refreshStoreProfile } = await import("./discovery.server");
    const scan = cached
      ? { ok: true, found: cached.found ?? 0, inserted: 0, updated: cached.updated ?? 0, cached: true }
      : {
          ...(await runDiscoveryScan({
            keywords: [term],
            countries,
            limit: 15,
            // Recherche de marque : tout l'historique, pas seulement les pubs récentes.
            freshDays: 0,
          })),
          cached: false,
        };

    /* Une seule recherche ramène TOUT : les publicités (ci-dessus), les
       boutiques liées et leur catalogue de produits. Peu importe l'onglet
       depuis lequel le vendeur a lancé l'analyse. */
    let stores = 0;
    let products = 0;
    try {
      const like = `%${term}%`;
      const [{ data: adRows }, { data: storeRows }] = await Promise.all([
        supabaseAdmin
          .from("discovery_ads")
          .select("landing_domain")
          .or(`page_name.ilike.${like},headline.ilike.${like},body.ilike.${like}`)
          .not("landing_domain", "is", null)
          .limit(200),
        /* La marque tapée est parfois elle-même un nom de domaine ou de boutique. */
        supabaseAdmin
          .from("discovery_stores")
          .select("domain")
          .or(`domain.ilike.${like},name.ilike.${like}`)
          .limit(50),
      ]);

      const slug = term.toLowerCase().replace(/[^a-z0-9.-]/g, "");
      const guesses = slug.includes(".")
        ? [slug]
        : slug.length >= 3
          ? [`${slug}.com`, `${slug}.shop`]
          : [];

      const domains = Array.from(
        new Set(
          [
            ...((adRows ?? []) as { landing_domain: string | null }[]).map((row) => row.landing_domain ?? ""),
            ...((storeRows ?? []) as { domain: string | null }[]).map((row) => row.domain ?? ""),
            ...guesses,
          ].filter((domain) => domain.includes(".")),
        ),
      );

      if (domains.length > 0) {
        const { data: known } = await supabaseAdmin
          .from("discovery_stores")
          .select("domain, last_fetched_at, avg_price, products_count")
          .in("domain", domains);
        const map = new Map(
          ((known ?? []) as {
            domain: string;
            last_fetched_at: string | null;
            avg_price: number | null;
            products_count: number | null;
          }[]).map((row) => [row.domain, row]),
        );
        const todo = domains
          .filter((domain) => {
            const row = map.get(domain);
            if (!row?.last_fetched_at) return true;
            if (Number(row.products_count ?? 0) <= 0) return true;
            if (Number(row.avg_price ?? 0) <= 0) return true;
            return Date.now() - new Date(row.last_fetched_at).getTime() > 7 * 86_400_000;
          })
          .slice(0, 12);

        const results = await Promise.allSettled(todo.map((domain) => refreshStoreProfile(domain)));
        for (const item of results) {
          if (item.status !== "fulfilled" || !item.value) continue;
          stores += 1;
          products += Number(item.value.products_count ?? 0);
        }
        /* Boutiques déjà connues (et à jour) : leur catalogue compte aussi
           dans ce que le vendeur voit apparaître dans l'onglet Produits. */
        for (const domain of domains) {
          if (todo.includes(domain)) continue;
          const row = map.get(domain);
          if (!row) continue;
          stores += 1;
          products += Number(row.products_count ?? 0);
        }
      }
    } catch {
      /* Les publicités trouvées restent valables même si l'analyse des
         boutiques échoue (site injoignable, catalogue fermé…). */
    }


    /* Historique toujours enregistré ; décompté seulement quand la collecte a
       vraiment tourné (une réponse servie par le cache est gratuite). */
    let spent = used;
    try {
      await supabaseAdmin.from("discovery_brand_searches").insert({
        user_id: ctx.userId,
        term,
        country: countries[0] ?? null,
        found: Number(scan.found ?? 0),
        stores,
        billed: !cached,
      });
      if (!cached) spent = used + 1;
    } catch {
      spent = cached ? used : used + 1;
    }


    return {
      ...scan,
      stores,
      products,
      term,

      countries,
      plan,
      quota: rules.liveSearches,
      used: spent,
      left: Math.max(0, rules.liveSearches - spent),
    };

  });
