/**
 * Collecte des publicités réelles pour la page Découverte.
 * Source : robot Apify « Facebook Ad Library ».
 * Règles budget : chaque scan est plafonné, les publicités déjà connues sont
 * seulement rafraîchies (l'identifiant Meta évite de payer deux fois).
 * Les visuels Meta expirent au bout de quelques jours : on en garde une copie
 * durable dans le stockage privé pour que la bibliothèque reste consultable.
 */
const GATEWAY = "https://api.apify.com/v2";
const ACTOR = "curious_coder~facebook-ads-library-scraper";
const MEDIA_BUCKET = "store-media";

export type ScanInput = {
  country?: string | undefined;
  countries?: string[] | undefined;
  keyword?: string | undefined;
  keywords?: string[] | undefined;
  category?: string | undefined;
  limit?: number | undefined;
  freshDays?: number | undefined;
  /** Filtres de l'écran Publicités : la collecte doit chercher exactement cela. */
  media?: "video" | "image" | "all" | undefined;
  status?: "active" | "inactive" | "all" | undefined;
  minDays?: number | undefined;
  minVariations?: number | undefined;
  domain?: string | undefined;
};

/** Ne garde que les publicités qui correspondent aux filtres demandés. */
export function matchesScanBrief(
  row: {
    media_type?: string | null;
    is_active?: boolean | null;
    active_days?: number | null;
    variations_count?: number | null;
    landing_domain?: string | null;
  },
  input: ScanInput,
): boolean {
  if (input.media && input.media !== "all" && row.media_type !== input.media) return false;
  if (input.status === "active" && row.is_active === false) return false;
  if (input.status === "inactive" && row.is_active !== false) return false;
  if (input.minDays && (row.active_days ?? 0) < input.minDays) return false;
  if (input.minVariations && (row.variations_count ?? 1) < input.minVariations) return false;
  if (input.domain) {
    const wanted = input.domain.toLowerCase();
    if (!(row.landing_domain ?? "").toLowerCase().includes(wanted)) return false;
  }
  return true;
}

export type ScanResult = {
  ok: boolean;
  reason?: string;
  found: number;
  inserted: number;
  updated: number;
  countries?: string[];
  keywords?: string[];
};

type Card = {
  title?: string | null;
  body?: string | null;
  cta_text?: string | null;
  cta_type?: string | null;
  link_url?: string | null;
  original_image_url?: string | null;
  resized_image_url?: string | null;
  video_hd_url?: string | null;
  video_sd_url?: string | null;
  video_preview_image_url?: string | null;
};

type Media = {
  original_image_url?: string | null;
  resized_image_url?: string | null;
  video_hd_url?: string | null;
  video_sd_url?: string | null;
  video_preview_image_url?: string | null;
};

type Item = {
  ad_archive_id?: string;
  page_id?: string;
  page_name?: string;
  is_active?: boolean;
  collation_count?: number | null;
  start_date?: number | null;
  end_date?: number | null;
  publisher_platform?: string[] | null;
  reach_estimate?: number | null;
  spend?: unknown;
  currency?: string | null;
  ad_library_url?: string | null;
  total_active_time?: number | null;
  snapshot?: {
    page_name?: string | null;
    page_profile_picture_url?: string | null;
    page_categories?: unknown;
    page_like_count?: number | null;
    country_iso_code?: string | null;
    cta_text?: string | null;
    cta_type?: string | null;
    caption?: string | null;
    cards?: Card[] | null;
    images?: Media[] | null;
    videos?: Media[] | null;
    extra_images?: Media[] | null;
    extra_videos?: Media[] | null;
    link_url?: string | null;
    link_description?: string | null;
    title?: string | null;
    body?: { text?: string | null } | string | null;
  } | null;
};

const CATEGORY_RULES: { category: string; words: string[] }[] = [
  { category: "Beauté & soin", words: ["parfum", "beaut", "peau", "cheveux", "crème", "maquillage", "savon", "skincare", "perruque"] },
  { category: "Tech & gadgets", words: ["téléphone", "phone", "montre", "écouteur", "gadget", "caméra", "led", "ai ", "app"] },
  { category: "Mode & accessoires", words: ["robe", "chaussure", "sac", "mode", "vêtement", "pagne", "bijou", "sneaker"] },
  { category: "Cuisine", words: ["cuisine", "mixeur", "casserole", "friteuse", "batteur", "ustensile"] },
  { category: "Maison & jardin", words: ["maison", "salon", "meuble", "matelas", "rideau", "jardin", "ménage"] },
  { category: "Sport & fitness", words: ["sport", "fitness", "musculation", "ventre", "minceur", "vélo"] },
  { category: "Bébé & enfants", words: ["bébé", "enfant", "couche", "poussette", "jouet"] },
  { category: "Auto & moto", words: ["voiture", "auto", "moto", "pneu", "casque"] },
  { category: "Formation & services", words: ["formation", "master", "école", "coaching", "cours", "webinar"] },
];

function categorize(text: string, fallback?: string) {
  const lower = text.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.words.some((word) => lower.includes(word))) return rule.category;
  }
  return fallback && fallback.length > 1 ? fallback : "À la une";
}

/**
 * Garde e-commerce : on ne garde que les publicités de produits physiques.
 * Sans ce tri, la collecte ramenait des formations, du crédit, des paris et
 * des offres d'emploi, inutiles pour un vendeur de produits réels.
 */
const NON_ECOMMERCE = [
  "formation", "coaching", "webinar", "masterclass", "séminaire", "seminaire",
  "inscription", "école", "ecole", "université", "universite", "bourse d'étude",
  "visa", "immigration", "billet d'avion", "emploi", "recrutement", "cv ",
  "crédit", "credit", "prêt", "pret ", "banque", "assurance", "investir",
  "trading", "forex", "crypto", "casino", "pari", "bet", "loterie",
  "hôtel", "hotel", "location appartement", "terrain à vendre", "immobilier",
  "église", "eglise", "prière", "priere", "abonnement tv", "forfait internet",
];

/** Appels à l'action qui indiquent une vente de produit. */
const SHOP_CTA = ["shop_now", "order_now", "buy_now", "get_offer", "whatsapp_message", "message_page", "learn_more"];

function looksLikeEcommerce(input: { text: string; ctaType?: string | null; domain?: string | null }) {
  const lower = input.text.toLowerCase();
  if (NON_ECOMMERCE.some((word) => lower.includes(word))) return false;
  const cta = (input.ctaType ?? "").toLowerCase();
  const shopSignal =
    SHOP_CTA.includes(cta) ||
    /(\d[\d\s.,]{2,}\s?(f\s?cfa|fcfa|cfa|xof|frs?|dh|mad|ngn|₦|€|\$))/i.test(lower) ||
    /(commande|commandez|acheter|achetez|livraison|prix|promo|en stock|disponible|réduction|reduction)/.test(lower);
  // Une page produit ou une boutique compte aussi comme signal de vente.
  return shopSignal || Boolean(input.domain);
}



function domainOf(url: string | null | undefined) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function bodyText(snapshot: Item["snapshot"], card: Card | undefined) {
  if (card?.body) return card.body;
  const raw = snapshot?.body;
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object" && typeof raw.text === "string") return raw.text;
  return "";
}

/** Cherche un visuel dans toutes les zones renvoyées par Meta (cartes, images, vidéos). */
function pickMedia(snapshot: Item["snapshot"]) {
  const pools: Media[] = [
    ...((snapshot?.cards ?? []) as Media[]),
    ...(snapshot?.videos ?? []),
    ...(snapshot?.images ?? []),
    ...(snapshot?.extra_videos ?? []),
    ...(snapshot?.extra_images ?? []),
  ].filter(Boolean);

  let video: string | null = null;
  let image: string | null = null;
  let poster: string | null = null;
  for (const media of pools) {
    video = video ?? media.video_hd_url ?? media.video_sd_url ?? null;
    poster = poster ?? media.video_preview_image_url ?? null;
    image = image ?? media.original_image_url ?? media.resized_image_url ?? null;
  }
  return { video, image, thumbnail: image ?? poster ?? null };
}

/**
 * Indice de traction DUKAIO : estimation maison calculée seulement à partir de
 * faits observables (ancienneté, variantes, diffusion en cours, réseaux).
 * Ce n'est jamais un chiffre d'affaires.
 */
export function tractionScore(input: {
  activeDays: number;
  variations: number;
  isActive: boolean;
  platforms: number;
}) {
  const age = Math.min(input.activeDays, 60) * 0.85;
  const variants = Math.min(input.variations, 20) * 1.5;
  const live = input.isActive ? 15 : 0;
  const spread = Math.min(input.platforms, 4) * 2.5;
  return Math.max(1, Math.min(100, Math.round(age + variants + live + spread)));
}

function mapItem(item: Item, ctx: { country: string; keyword?: string | undefined; category?: string | undefined }) {
  const externalId = item.ad_archive_id;
  if (!externalId) return null;
  const snapshot = item.snapshot ?? null;
  const card = snapshot?.cards?.[0];
  const headline = (card?.title ?? snapshot?.title ?? snapshot?.link_description ?? "").toString().slice(0, 200);
  const body = bodyText(snapshot, card).toString().slice(0, 2000);
  const { video, image, thumbnail } = pickMedia(snapshot);
  const link = card?.link_url ?? snapshot?.link_url ?? null;
  const startSec = item.start_date ?? null;
  const endSec = item.end_date ?? null;
  const nowSec = Math.floor(Date.now() / 1000);
  const activeDays = startSec ? Math.max(0, Math.round(((endSec ?? nowSec) - startSec) / 86400)) : 0;
  const platforms = (item.publisher_platform ?? []).map((p) => String(p).toLowerCase());
  const variations = Math.max(1, item.collation_count ?? 1);
  const isActive = item.is_active !== false;
  const categories = Array.isArray(snapshot?.page_categories)
    ? (snapshot?.page_categories as unknown[]).map((value) => String(value)).slice(0, 6)
    : [];

  return {
    platform: "meta",
    external_id: externalId,
    page_id: item.page_id ?? null,
    page_name: (snapshot?.page_name ?? item.page_name ?? "Annonceur inconnu").toString().slice(0, 200),
    page_avatar_url: snapshot?.page_profile_picture_url ?? null,
    page_like_count: snapshot?.page_like_count ?? null,
    page_categories: categories,
    headline,
    body,
    cta_text: card?.cta_text ?? snapshot?.cta_text ?? null,
    cta_type: (card?.cta_type ?? snapshot?.cta_type ?? null) as string | null,
    link_url: link,
    landing_domain: domainOf(link) ?? snapshot?.caption ?? null,
    media_type: video ? "video" : "image",
    image_url: image,
    video_url: video,
    thumbnail_url: thumbnail,
    reach_estimate: item.reach_estimate ?? null,
    spend: (item.spend ?? null) as never,
    currency: item.currency ?? null,
    ad_library_url:
      item.ad_library_url ?? `https://www.facebook.com/ads/library/?id=${externalId}`,
    country: (snapshot?.country_iso_code ?? ctx.country).toString().toUpperCase().slice(0, 2),
    keyword: ctx.keyword ?? null,
    category: categorize(`${headline} ${body}`, ctx.category),
    publisher_platforms: platforms,
    variations_count: variations,
    is_active: isActive,
    started_at: startSec ? new Date(startSec * 1000).toISOString() : null,
    ended_at: endSec ? new Date(endSec * 1000).toISOString() : null,
    active_days: activeDays,
    traction_score: tractionScore({ activeDays, variations, isActive, platforms: platforms.length }),
    last_seen_at: new Date().toISOString(),
  };
}

/** Identifiant stable quand la source n'en fournit pas (hash du contenu). */
function stableId(text: string) {
  let hash = 5381;
  for (let index = 0; index < text.length; index++) {
    hash = ((hash * 33) ^ text.charCodeAt(index)) >>> 0;
  }
  return `h${hash.toString(36)}`;
}

function parseDate(value: unknown) {
  if (typeof value === "number" && value > 0) {
    // Secondes ou millisecondes selon la source.
    const ms = value > 10_000_000_000 ? value : value * 1000;
    return new Date(ms).toISOString();
  }
  if (typeof value === "string" && value) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  }
  return null;
}

type AnyItem = Record<string, unknown>;
const pick = (item: AnyItem, keys: string[]) => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value) return value;
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
};

/** Appel direct d'un acteur Apify. */
async function runActor(actor: string, body: Record<string, unknown>, maxItems: number) {
  const apifyKey = process.env["APIFY_API_KEY"];
  if (!apifyKey) throw new Error("Clé API Apify manquante (APIFY_API_KEY).");
  const response = await fetch(
    `${GATEWAY}/acts/${actor}/run-sync-get-dataset-items?timeout=120&maxItems=${maxItems}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apifyKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(response.status === 402 ? "credits" : `${response.status} ${detail.slice(0, 160)}`);
  }
  const payload = (await response.json()) as unknown;
  return Array.isArray(payload) ? payload : [];
}


/**
 * Réservoir de recherches : uniquement des produits physiques revendables
 * (beauté, soin, cuisine, maison, mode, bébé, gadgets). Aucun terme de
 * service (formation, coaching, crédit, emploi) : nos vendeurs cherchent
 * des produits e-commerce à revendre, pas des offres immatérielles.
 */
const KEYWORD_POOL = [
  // Beauté & soin du corps
  "parfum", "crème éclaircissante", "soin visage", "perruque", "huile cheveux",
  "maquillage", "savon noir", "beurre de karité", "appareil massage", "épilateur",
  // Cuisine & maison
  "mixeur", "friteuse sans huile", "ustensile cuisine", "casserole", "machine à jus",
  "aspirateur", "rangement maison", "lampe led", "matelas", "rideau",
  // Mode & accessoires
  "montre homme", "sac à main", "chaussures femme", "robe", "bijoux plaqué or", "lunettes",
  // Tech & gadgets
  "écouteurs sans fil", "montre connectée", "vidéoprojecteur", "caméra surveillance", "power bank",
  // Bien-être & sport
  "ceinture ventre plat", "thé minceur", "tapis sport", "appareil abdos", "complément minceur",
  // Bébé & divers
  "poussette", "jouet enfant", "couche bébé", "parfum voiture", "produit ménager",
  // Signaux e-commerce
  "livraison gratuite", "paiement à la livraison", "commandez maintenant", "prix promo",
];

const COUNTRY_POOL = ["BJ", "CI", "SN", "BF", "TG", "ML", "CM", "NE", "GN", "CD", "GA", "MA"];

/**
 * Choisit les termes les moins utilisés récemment (les 40 derniers scans) :
 * sans cette rotation, chaque collecte relançait les mêmes recherches et
 * consommait du crédit Apify pour des publicités déjà connues.
 */
async function rotate(
  admin: { from: (t: string) => { select: (c: string) => { order: (c: string, o: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: { keyword: string | null; country: string | null }[] | null }> } } } },
  size: { keywords: number; countries: number },
) {
  const { data } = await admin
    .from("discovery_scans")
    .select("keyword, country")
    .order("created_at", { ascending: false })
    .limit(40);
  const usedWords = new Map<string, number>();
  const usedCountries = new Map<string, number>();
  (data ?? []).forEach((scan, index) => {
    const weight = 40 - index; // les scans récents pèsent davantage
    for (const word of (scan.keyword ?? "").split(",").map((v) => v.trim()).filter(Boolean)) {
      usedWords.set(word, (usedWords.get(word) ?? 0) + weight);
    }
    for (const code of (scan.country ?? "").split(",").map((v) => v.trim()).filter(Boolean)) {
      usedCountries.set(code, (usedCountries.get(code) ?? 0) + weight);
    }
  });
  const pick = (pool: string[], used: Map<string, number>, count: number) =>
    [...pool].sort((a, b) => (used.get(a) ?? 0) - (used.get(b) ?? 0)).slice(0, count);
  return {
    keywords: pick(KEYWORD_POOL, usedWords, size.keywords),
    countries: pick(COUNTRY_POOL, usedCountries, size.countries),
  };
}

function searchUrl(country: string, keyword: string, freshDays: number) {
  const params = new URLSearchParams({
    active_status: "active",
    ad_type: "all",
    country,
    q: keyword,
    search_type: "keyword_unordered",
    media_type: "all",
  });
  // Fenêtre récente : privilégie les pubs lancées depuis peu, donc inconnues.
  if (freshDays > 0) {
    const min = new Date(Date.now() - freshDays * 86_400_000).toISOString().slice(0, 10);
    params.set("start_date[min]", min);
    params.set("start_date_min", min);
  }
  return `https://www.facebook.com/ads/library/?${params.toString()}`;
}


/** Copie durable du visuel : Meta expire ses liens au bout de quelques jours. */
async function mirrorThumbnail(
  admin: { storage: { from: (b: string) => { upload: (p: string, f: Blob, o: Record<string, unknown>) => Promise<{ error: unknown }> } } },
  externalId: string,
  url: string | null,
) {
  if (!url) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(4_000) });
    if (!response.ok) return null;
    const blob = await response.blob();
    if (blob.size > 4_000_000) return null;
    const path = `discovery/${externalId}.jpg`;
    const { error } = await admin.storage.from(MEDIA_BUCKET).upload(path, blob, {
      contentType: blob.type || "image/jpeg",
      upsert: true,
    });
    return error ? null : path;
  } catch {
    return null;
  }
}

/** Lance une collecte plafonnée (plusieurs pays et mots-clés) puis enregistre les nouveautés. */
export async function runDiscoveryScan(input: ScanInput = {}): Promise<ScanResult> {
  const apifyKey = process.env["APIFY_API_KEY"];
  const empty: ScanResult = { ok: false, found: 0, inserted: 0, updated: 0 };
  if (!apifyKey) {
    return { ...empty, reason: "Le compte de collecte publicitaire n'est pas connecté." };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const explicitCountries = (input.countries && input.countries.length
    ? input.countries
    : input.country
      ? [input.country]
      : []
  ).map((code) => code.toUpperCase().slice(0, 2)).filter(Boolean);
  const explicitKeywords = (input.keywords && input.keywords.length
    ? input.keywords
    : input.keyword
      ? [input.keyword]
      : []
  ).map((word) => word.trim().slice(0, 60)).filter(Boolean);

  // Mots-clés déduits de la niche choisie : une collecte sur « Bébé & enfants »
  // doit chercher bébé, couche, poussette… et non des termes au hasard.
  const categoryKeywords = input.category
    ? (CATEGORY_RULES.find((rule) => rule.category === input.category)?.words ?? [])
        .map((word) => word.trim())
        .filter((word) => word.length > 2)
        // Ordre variable : on ne repasse pas sur les mêmes termes de la niche.
        .sort(() => Math.random() - 0.5)
    : [];

  // Sans consigne précise, on tourne sur les recherches les moins vues.
  const rotated = await rotate(supabaseAdmin as never, { keywords: 4, countries: 3 });
  const countries = Array.from(new Set(explicitCountries.length ? explicitCountries : rotated.countries)).slice(0, 4);
  const baseKeywords = explicitKeywords.length
    ? explicitKeywords
    : categoryKeywords.length
      ? categoryKeywords
      : rotated.keywords;
  const keywords = Array.from(new Set(baseKeywords)).slice(0, 4);


  // Plafond dur : le robot facture au résultat.
  const perCall = Math.min(Math.max(input.limit ?? 20, 10), 60);
  // Fenêtre récente par défaut : on cible les pubs lancées dans les 21 derniers
  // jours, celles qu'on n'a pas encore en base.
  // Un filtre « diffusée depuis X jours » impose une fenêtre plus large :
  // sinon on ne verrait jamais de pubs assez anciennes.
  const freshDays = input.freshDays ?? (input.minDays ? Math.max(input.minDays + 30, 60) : 21);
  // Appariement tournant (et non produit croisé) : moins de requêtes, plus de
  // variété — chaque mot-clé part sur un pays différent. Exception : la
  // recherche d'une seule marque doit balayer tous les pays demandés.
  const pairs =
    keywords.length === 1
      ? countries.map((country) => ({
          country,
          keyword: keywords[0]!,
          url: searchUrl(country, keywords[0]!, freshDays),
        }))
      : keywords.map((keyword, index) => {
          const country = countries[index % countries.length] ?? "BJ";
          return { country, keyword, url: searchUrl(country, keyword, freshDays) };
        });
  const urls = pairs;


  type Row = NonNullable<ReturnType<typeof mapItem>>;
  const rows: Row[] = [];
  const errors: string[] = [];

  // Une seule exécution Apify traite toutes les recherches, quel que soit le
  // réseau. Le plafond reste bas : chaque résultat est facturé.
  try {
    {
      const maxItems = Math.min(perCall * urls.length, 240);
      const response = await fetch(
        `${GATEWAY}/acts/${ACTOR}/run-sync-get-dataset-items?timeout=120&maxItems=${maxItems}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apifyKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            urls: urls.map((target) => ({ url: target.url })),
            count: maxItems,
            limitPerSource: perCall,
          }),
        },
      );
      if (!response.ok) {
        const detail = await response.text();
        errors.push(response.status === 402 ? "credits" : `${response.status} ${detail.slice(0, 160)}`);
      } else {
        const payload = (await response.json()) as Item[] | { error?: string };
        const items = Array.isArray(payload) ? payload : [];
        if (!Array.isArray(payload) && payload.error) errors.push(payload.error.slice(0, 160));
        for (const item of items) {
          const row = mapItem(item, {
            country: countries[0] ?? "BJ",
            keyword: keywords.length === 1 ? keywords[0] : undefined,
            category: input.category,
          });
          if (
            row &&
            matchesScanBrief(row, input) &&
            looksLikeEcommerce({
              text: `${row.headline} ${row.body}`,
              ctaType: row.cta_type,
              domain: row.landing_domain,
            })
          ) {
            rows.push(row);
          }

        }
      }
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message.slice(0, 160) : "erreur inconnue");
  }

  if (rows.length === 0) {
    await supabaseAdmin.from("discovery_scans").insert({
      keyword: keywords.join(", ").slice(0, 120),
      country: countries.join(",").slice(0, 40),
      found: 0,
      error: errors.join(" | ").slice(0, 500) || null,
    });
    const credits = errors.includes("credits");
    return {
      ...empty,
      reason: credits
        ? "Crédits Apify épuisés pour ce mois-ci : la collecte reprendra au prochain rechargement."
        : "Aucune publicité trouvée pour ces pays et mots-clés.",
      countries,
      keywords,
    };
  }

  // Déduplication interne (une même pub peut sortir sur deux pays/mots-clés).
  const unique = new Map<string, NonNullable<ReturnType<typeof mapItem>>>();
  for (const row of rows) unique.set(row.external_id, row);
  const deduped = Array.from(unique.values());

  const ids = deduped.map((row) => row.external_id);
  const { data: existing } = await supabaseAdmin
    .from("discovery_ads")
    .select("external_id, media_path")
    .eq("platform", "meta")
    .in("external_id", ids);
  const known = new Map((existing ?? []).map((row) => [row.external_id, row.media_path]));

  // Les téléchargements sont parallèles : chaque visuel est sauvegardé durablement dans store-media
  const mirrorCandidates = deduped.filter((row) => !known.get(row.external_id));
  const mirroredPaths = new Map<string, string>();
  await Promise.all(
    mirrorCandidates.map(async (row) => {
      const url = row.thumbnail_url || row.image_url;
      const path = await mirrorThumbnail(supabaseAdmin as never, row.external_id, url);
      if (path) mirroredPaths.set(row.external_id, path);
    }),
  );
  const withMedia = deduped.map((row) => ({
    ...row,
    media_path: known.get(row.external_id) ?? mirroredPaths.get(row.external_id) ?? null,
  }));

  const { error } = await supabaseAdmin
    .from("discovery_ads")
    .upsert(withMedia as never, { onConflict: "platform,external_id" });

  const inserted = deduped.filter((row) => !known.has(row.external_id)).length;
  const updated = deduped.length - inserted;

  await supabaseAdmin.from("discovery_scans").insert({
    keyword: keywords.join(", ").slice(0, 120),
    country: countries.join(",").slice(0, 40),
    found: deduped.length,
    inserted: error ? 0 : inserted,
    updated: error ? 0 : updated,
    error: error ? error.message.slice(0, 500) : errors.join(" | ").slice(0, 500) || null,
  });

  if (error) return { ...empty, found: deduped.length, reason: "Enregistrement impossible.", countries, keywords };

  return { ok: true, found: deduped.length, inserted, updated, countries, keywords };
}

/* ------------------------------------------------------------------ */
/* Google Ads : centre de transparence Google (recherche, YouTube…)     */
/* ------------------------------------------------------------------ */

const GOOGLE_ACTOR = "solidcode~ads-transparency-scraper";

type GoogleItem = {
  advertiserId?: string;
  advertiserName?: string;
  creativeId?: string;
  adFormat?: string;
  firstShown?: string;
  lastShown?: string;
  approxDaysShown?: number;
  adUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  previewUrl?: string;
  domain?: string;
};

/**
 * Collecte Google Ads. Les recherches sont les mêmes niches e-commerce que
 * Meta : le vendeur retrouve les mêmes produits sur les deux réseaux.
 */
export async function runGoogleAdsScan(input: ScanInput = {}): Promise<ScanResult> {
  const apifyKey = process.env["APIFY_API_KEY"];
  const empty: ScanResult = { ok: false, found: 0, inserted: 0, updated: 0 };
  if (!apifyKey) {
    return { ...empty, reason: "Le compte de collecte publicitaire n'est pas connecté." };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const explicit = (input.keywords?.length ? input.keywords : input.keyword ? [input.keyword] : [])
    .map((word) => word.trim())
    .filter(Boolean);
  const categoryWords = input.category
    ? (CATEGORY_RULES.find((rule) => rule.category === input.category)?.words ?? [])
        .map((word) => word.trim())
        .filter((word) => word.length > 2)
        .sort(() => Math.random() - 0.5)
    : [];
  const rotated = await rotate(supabaseAdmin as never, { keywords: 3, countries: 1 });
  const keywords = Array.from(
    new Set(explicit.length ? explicit : categoryWords.length ? categoryWords : rotated.keywords),
  ).slice(0, 3);
  const country = (input.country ?? input.countries?.[0] ?? "CI").toUpperCase().slice(0, 2);
  const perCall = Math.min(Math.max(input.limit ?? 20, 5), 60);

  const rows: Record<string, unknown>[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const keyword of keywords) {
    try {
      // Google filtre peu par pays sur une recherche mot-clé : on interroge
      // sans région pour ne pas revenir les mains vides.
      const items = (await runActor(
        GOOGLE_ACTOR,
        { searchQuery: keyword, maxResults: perCall },
        perCall,
      )) as GoogleItem[];
      for (const item of items) {
        const id = item.creativeId ?? (item.adUrl ? stableId(item.adUrl) : null);
        if (!id || seen.has(id)) continue;
        const headline = (item.advertiserName ?? "Annonceur Google").slice(0, 200);
        const text = `${headline} ${keyword}`;
        if (!looksLikeEcommerce({ text: keyword, domain: item.domain ?? null })) continue;
        seen.add(id);
        const days = Math.max(0, item.approxDaysShown ?? 0);
        const active = item.lastShown
          ? Date.now() - new Date(item.lastShown).getTime() < 21 * 86_400_000
          : true;
        const video = item.videoUrl ?? null;
        rows.push({
          platform: "google_ads",
          external_id: id,
          page_id: item.advertiserId ?? null,
          page_name: headline,
          page_categories: [],
          headline,
          body: `Publicité Google Ads détectée sur la recherche « ${keyword} ».`,
          cta_text: null,
          link_url: item.adUrl ?? null,
          landing_domain: item.domain ?? null,
          media_type: video ? "video" : "image",
          image_url: item.imageUrl ?? null,
          video_url: video,
          thumbnail_url: item.imageUrl ?? null,
          ad_library_url: item.adUrl ?? null,
          country,
          keyword,
          category: categorize(text, input.category),
          publisher_platforms: ["google"],
          variations_count: 1,
          is_active: active,
          started_at: item.firstShown ? new Date(item.firstShown).toISOString() : null,
          ended_at: active ? null : item.lastShown ? new Date(item.lastShown).toISOString() : null,
          active_days: days,
          traction_score: tractionScore({
            activeDays: days,
            variations: 1,
            isActive: active,
            platforms: 1,
          }),
          last_seen_at: new Date().toISOString(),
        });
        const candidate = rows[rows.length - 1]!;
        if (!matchesScanBrief(candidate as never, input)) rows.pop();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "erreur inconnue";
      errors.push(message.slice(0, 160));
      if (message === "credits" || /\b(402|403)\b/.test(message)) break;
    }
  }

  if (rows.length === 0) {
    await supabaseAdmin.from("discovery_scans").insert({
      source: "google_ads",
      keyword: keywords.join(", ").slice(0, 120),
      country,
      found: 0,
      error: errors.join(" | ").slice(0, 500) || null,
    } as never);
    const credits = errors.includes("credits");
    return {
      ...empty,
      reason: credits
        ? "Crédits Apify épuisés pour ce mois-ci : la collecte reprendra au prochain rechargement."
        : "Aucune publicité Google Ads trouvée pour ces recherches.",
      countries: [country],
      keywords,
    };
  }

  const ids = rows.map((row) => String(row["external_id"]));
  const { data: existing } = await supabaseAdmin
    .from("discovery_ads")
    .select("external_id, media_path")
    .eq("platform", "google_ads")
    .in("external_id", ids);
  const known = new Map((existing ?? []).map((row) => [row.external_id, row.media_path]));

  const mirrorCandidates = rows.filter((row) => !known.get(String(row["external_id"])));
  const mirroredPaths = new Map<string, string>();
  await Promise.all(
    mirrorCandidates.map(async (row) => {
      const extId = String(row["external_id"]);
      const url = (row["thumbnail_url"] || row["image_url"]) as string | null;
      const path = await mirrorThumbnail(supabaseAdmin as never, extId, url);
      if (path) mirroredPaths.set(extId, path);
    }),
  );

  const withMedia = rows.map((row) => {
    const extId = String(row["external_id"]);
    return {
      ...row,
      media_path: known.get(extId) ?? mirroredPaths.get(extId) ?? null,
    };
  });

  const { error } = await supabaseAdmin
    .from("discovery_ads")
    .upsert(withMedia as never, { onConflict: "platform,external_id" });

  const inserted = ids.filter((id) => !known.has(id)).length;
  const updated = ids.length - inserted;

  await supabaseAdmin.from("discovery_scans").insert({
    source: "google_ads",
    keyword: keywords.join(", ").slice(0, 120),
    country,
    found: rows.length,
    inserted: error ? 0 : inserted,
    updated: error ? 0 : updated,
    error: error ? error.message.slice(0, 500) : errors.join(" | ").slice(0, 500) || null,
  } as never);

  if (error) return { ...empty, found: rows.length, reason: "Enregistrement impossible.", countries: [country], keywords };

  return { ok: true, found: rows.length, inserted, updated, countries: [country], keywords };
}



/* ------------------------------------------------------------------ */
/* Fiches boutiques : catalogue public (Shopify, WooCommerce, YouCan)  */
/* ------------------------------------------------------------------ */

type StoreProduct = { title: string; price: number; image: string | null; url: string | null; createdAt: string | null };

/**
 * Lit un montant écrit dans n'importe quel format local : « 8 700 », « 8.700,00 »,
 * « 8,700.00 », « 87,00 €. Sans cette lecture, les séparateurs de milliers
 * faisaient tomber le prix à 0 ou à quelques unités.
 */
function money(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = String(value ?? "").replace(/[^\d.,]/g, "");
  if (!raw) return 0;
  const cut = Math.max(raw.lastIndexOf(","), raw.lastIndexOf("."));
  if (cut === -1) return Number(raw) || 0;
  const decimals = raw.length - cut - 1;
  // 3 chiffres après le dernier séparateur = séparateur de milliers, pas des centimes.
  if (decimals !== 1 && decimals !== 2) return Number(raw.replace(/[.,]/g, "")) || 0;
  const whole = raw.slice(0, cut).replace(/[.,]/g, "");
  return Number(`${whole || "0"}.${raw.slice(cut + 1)}`) || 0;
}

/** Devise réellement affichée par la boutique (Shopify ne la met pas dans products.json). */
function currencyFromHtml(html: string | null) {
  if (!html) return null;
  const found =
    html.match(/Shopify\.currency\s*=\s*\{[^}]*"active"\s*:\s*"([A-Z]{3})"/)?.[1] ??
    html.match(/<meta[^>]+property=["']product:price:currency["'][^>]+content=["']([A-Z]{3})/i)?.[1] ??
    html.match(/["']currency(?:_code|Code)?["']\s*:\s*["']([A-Z]{3})["']/)?.[1] ??
    null;
  return found ?? null;
}


async function tryJson(url: string) {
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0 DukaioDiscovery/1.0" },
    });
    if (!response.ok) return null;
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

async function tryHtml(url: string) {
  try {
    const response = await fetch(url, {
      headers: { accept: "text/html", "user-agent": "Mozilla/5.0 DukaioDiscovery/1.0" },
    });
    if (!response.ok) return null;
    return (await response.text()).slice(0, 400_000);
  } catch {
    return null;
  }
}

/** Dernier recours : lire les produits déclarés dans le HTML (JSON-LD, balises Open Graph). */
function productsFromHtml(html: string, base: string): { products: StoreProduct[]; currency: string | null } {
  const products: StoreProduct[] = [];
  let currency: string | null = null;

  for (const match of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]!.trim()) as unknown;
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes as Record<string, any>[]) {
        const graph = Array.isArray(node["@graph"]) ? (node["@graph"] as Record<string, any>[]) : [node];
        for (const entry of graph) {
          const types = ([] as string[]).concat(entry?.["@type"] ?? []);
          if (!types.includes("Product")) continue;
          const rawOffers = entry["offers"];
          const offers = (Array.isArray(rawOffers) ? rawOffers[0] : rawOffers) as Record<string, any> | undefined;
          const rawImage = entry["image"] as any;
          currency = currency ?? (offers?.["priceCurrency"] as string | undefined) ?? null;
          products.push({
            title: String(entry["name"] ?? "Produit"),
            price: money(offers?.["price"] ?? offers?.["lowPrice"]),
            image:
              typeof rawImage === "string" ? rawImage : (rawImage?.[0] ?? rawImage?.url ?? null),
            url: typeof entry["url"] === "string" ? (entry["url"] as string) : base,
            createdAt: null,
          });
        }
      }
    } catch {
      // Balise mal formée : on l'ignore sans casser l'analyse.
    }
  }

  if (products.length === 0) {
    const title = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1];
    const image = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)?.[1];
    const amount = html.match(/<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)/i)?.[1];
    currency =
      html.match(/<meta[^>]+property=["']product:price:currency["'][^>]+content=["']([^"']+)/i)?.[1] ?? null;
    if (title && (image || amount)) {
      products.push({
        title,
        price: money(amount),
        image: image ?? null,
        url: base,
        createdAt: null,
      });
    }
  }

  return { products, currency };
}

/** Outils de suivi réellement présents dans le HTML public de la boutique. */
function pixelsFromHtml(html: string | null): string[] {
  if (!html) return [];
  const found = new Set<string>();
  if (/connect\.facebook\.net|fbq\s*\(|facebook\.com\/tr\?/i.test(html)) found.add("meta");
  if (/googletagmanager\.com\/gtag\/js|AW-\d{6,}|google_conversion_id/i.test(html)) found.add("google_ads");
  if (/googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]{4,}/i.test(html)) found.add("gtm");
  if (/G-[A-Z0-9]{8,}|gtag\('config'/i.test(html)) found.add("ga4");
  if (/analytics\.tiktok\.com|ttq\.(load|track)/i.test(html)) found.add("tiktok");
  if (/sc-static\.net\/scevent|snaptr\s*\(/i.test(html)) found.add("snapchat");
  if (/static\.ads-twitter\.com|twq\s*\(/i.test(html)) found.add("x");
  if (/snap\.licdn\.com|_linkedin_partner_id/i.test(html)) found.add("linkedin");
  return Array.from(found);
}

/** Reconnaît la technologie de la boutique à partir de son HTML public. */
function platformFromHtml(html: string | null): string | null {
  if (!html) return null;
  if (/cdn\.shopify\.com|Shopify\.theme|myshopify\.com/i.test(html)) return "Shopify";
  if (/woocommerce|wp-content\/plugins\/woocommerce/i.test(html)) return "WooCommerce";
  if (/youcan\.shop|cdn\.youcan|youcanassets/i.test(html)) return "YouCan";
  if (/dukaio/i.test(html)) return "DUKAIO";
  if (/wixstores|static\.parastorage\.com/i.test(html)) return "Wix";
  if (/cdn\.shoplazza|shoplazza/i.test(html)) return "Shoplazza";
  if (/squarespace\.com/i.test(html)) return "Squarespace";
  if (/bigcartel\.com/i.test(html)) return "Big Cartel";
  if (/prestashop/i.test(html)) return "PrestaShop";
  if (/systeme\.io/i.test(html)) return "Systeme.io";
  if (/wp-content|wp-includes/i.test(html)) return "WordPress";
  return null;
}

/** Analyse le catalogue public d'une boutique : gratuit, sans robot payant. */
export async function refreshStoreProfile(domain: string) {
  const clean = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]!;
  if (!clean.includes(".")) return null;
  const base = `https://${clean}`;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let platform = "inconnue";
  let products: StoreProduct[] = [];
  let currency: string | null = null;
  let error: string | null = null;
  const homepage = await tryHtml(base);
  const pixels = pixelsFromHtml(homepage);

  const shopify = (await tryJson(`${base}/products.json?limit=250`)) as
    | { products?: { title?: string; handle?: string; images?: { src?: string }[]; variants?: { price?: string }[]; created_at?: string }[] }
    | null;
  if (shopify?.products?.length) {
    platform = "Shopify";
    currency = currencyFromHtml(homepage);
    products = shopify.products.map((product) => ({
      title: String(product.title ?? "Produit"),
      price: money(product.variants?.[0]?.price),
      image: product.images?.[0]?.src ?? null,
      url: product.handle ? `${base}/products/${product.handle}` : null,
      createdAt: product.created_at ?? null,
    }));
  } else {
    const woo = (await tryJson(`${base}/wp-json/wc/store/products?per_page=100`)) as
      | {
          name?: string;
          prices?: { price?: string; currency_code?: string; currency_minor_unit?: number };
          images?: { src?: string }[];
          permalink?: string;
        }[]
      | null;
    if (Array.isArray(woo) && woo.length) {
      platform = "WooCommerce";
      currency = woo[0]?.prices?.currency_code ?? null;
      /* L'API Store renvoie des unités mineures : 870000 avec 2 décimales = 8 700. */
      const minor = woo[0]?.prices?.currency_minor_unit ?? 2;
      const divisor = 10 ** (Number.isFinite(minor) ? Math.max(0, Math.min(4, minor)) : 2);
      products = woo.map((product) => ({
        title: String(product.name ?? "Produit"),
        price: money(product.prices?.price) / divisor,
        image: product.images?.[0]?.src ?? null,
        url: product.permalink ?? null,
        createdAt: null,
      }));
    } else {

      // YouCan et beaucoup de tunnels de vente n'exposent pas d'API : on lit le HTML.
      const youcan = (await tryJson(`${base}/api/v1/products?limit=100`)) as
        | { data?: { name?: string; price?: number; thumbnail?: string; slug?: string }[] }
        | null;
      if (youcan?.data?.length) {
        platform = "YouCan";
        products = youcan.data.map((product) => ({
          title: String(product.name ?? "Produit"),
          price: money(product.price),
          image: product.thumbnail ?? null,
          url: product.slug ? `${base}/products/${product.slug}` : base,
          createdAt: null,
        }));
      } else {
        const html = homepage;
        const scraped = html ? productsFromHtml(html, base) : { products: [], currency: null };
        if (scraped.products.length) {
          platform = html?.includes("cdn.shopify.com")
            ? "Shopify"
            : html?.includes("woocommerce")
              ? "WooCommerce"
              : "page de vente";
          products = scraped.products;
          currency = scraped.currency;
        } else {
          error = "Catalogue public non accessible sur ce domaine (page de vente unique ou site protégé).";
        }
      }
    }
  }

  /* Même sans catalogue lisible, le HTML révèle souvent la technologie réelle. */
  if (platform === "inconnue" || platform === "page de vente") {
    platform = platformFromHtml(homepage) ?? platform;
  }

  const prices = products.map((product) => product.price).filter((price) => price > 0);

  const row = {
    domain: clean,
    platform,
    currency,
    products_count: products.length,
    avg_price: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
    min_price: prices.length ? Math.min(...prices) : 0,
    max_price: prices.length ? Math.max(...prices) : 0,
    products: products.slice(0, 24) as never,
    pixels,
    fetch_error: error,
    last_fetched_at: new Date().toISOString(),
    launched_at:
      products
        .map((product) => product.createdAt)
        .filter((value): value is string => !!value)
        .sort()[0] ?? null,
  };

  await supabaseAdmin.from("discovery_stores").upsert(row as never, { onConflict: "domain" });
  return row;
}
