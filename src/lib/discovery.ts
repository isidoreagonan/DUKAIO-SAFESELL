import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getDiscoveryAdDetail,
  ensureDiscoveryStoreFn,
  getDiscoveryFacets,
  listDiscoveryAds,
  listDiscoveryAdvertisers,
  listDiscoveryProducts,
  listDiscoveryScans,
  refreshDiscoveryStoreFn,
  refreshDiscoveryPricesFn,
  runDiscoveryScanFn,
  searchDiscoveryBrandFn,
  type DiscoveryAd,
  type DiscoveryProduct,
  type DiscoveryStore,
} from "@/lib/discovery.functions";
import { getDomainTraffic } from "@/lib/traffic.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useDiscoveryAccess } from "@/lib/entitlements";

export { estimateRevenue, toFcfa, type Estimate } from "@/lib/discovery-estimate";

export type { DiscoveryAd, DiscoveryProduct, DiscoveryStore };

export const DISCOVERY_COUNTRIES = [
  { code: "BJ", label: "Bénin" },
  { code: "BF", label: "Burkina Faso" },
  { code: "CI", label: "Côte d'Ivoire" },
  { code: "SN", label: "Sénégal" },
  { code: "ML", label: "Mali" },
  { code: "TG", label: "Togo" },
  { code: "CM", label: "Cameroun" },
  { code: "NE", label: "Niger" },
  { code: "GN", label: "Guinée" },
  { code: "GA", label: "Gabon" },
  { code: "CD", label: "RD Congo" },
  { code: "MA", label: "Maroc" },
  { code: "FR", label: "France" },
  { code: "US", label: "États-Unis" },
];

export const DISCOVERY_CATEGORIES = [
  "À la une",
  "Beauté & soin",
  "Tech & gadgets",
  "Mode & accessoires",
  "Cuisine",
  "Maison & jardin",
  "Sport & fitness",
  "Bébé & enfants",
  "Auto & moto",
  "Formation & services",
];

export const DISCOVERY_PLATFORMS = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "messenger", label: "Messenger" },
  { value: "audience_network", label: "Audience Network" },
  { value: "threads", label: "Threads" },
  { value: "tiktok", label: "TikTok" },
  { value: "google", label: "Google Ads" },
];

/** Les deux régies sur lesquelles la Découverte travaille. */
export const DISCOVERY_SOURCES = [
  { value: "meta", label: "Meta Ads" },
  { value: "google", label: "Google Ads" },
  { value: "tiktok", label: "TikTok Ads" },
];

/** Outils de suivi détectés sur les pages de vente (données réelles du HTML public). */
export const DISCOVERY_PIXELS = [
  { value: "meta", label: "Pixel Meta" },
  { value: "google_ads", label: "Pixel Google Ads" },
  { value: "ga4", label: "Google Analytics 4" },
  { value: "gtm", label: "Google Tag Manager" },
  { value: "tiktok", label: "Pixel TikTok" },
  { value: "snapchat", label: "Pixel Snapchat" },
];

export function pixelLabel(value: string) {
  return DISCOVERY_PIXELS.find((item) => item.value === value)?.label ?? value;
}

export function sourceLabel(value: string | null | undefined) {
  if (!value) return "Meta Ads";
  return DISCOVERY_SOURCES.find((item) => item.value === value)?.label ?? value;
}

export const DISCOVERY_KEYWORDS = [
  "produit",
  "parfum",
  "beauté",
  "montre",
  "cheveux",
  "cuisine",
  "téléphone",
  "mode",
  "minceur",
  "bébé",
];

export type AdFilters = {
  country?: string | undefined;
  category?: string | undefined;
  media?: "all" | "video" | "image";
  status?: "all" | "active" | "inactive";
  platform?: string | undefined;
  source?: string | undefined;
  pixel?: string | undefined;
  domain?: string | undefined;
  minDays?: number;
  minTraction?: number;
  minVariations?: number | undefined;
  search?: string | undefined;
  sort?: "traction" | "recent" | "duration" | "variations";
  limit?: number;
};

export function countryLabel(code: string) {
  return DISCOVERY_COUNTRIES.find((item) => item.code === code)?.label ?? code;
}

export function flagUrl(code: string) {
  return `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;
}

export function tractionLabel(score: number) {
  if (score >= 75) return { label: "Très forte", tone: "text-emerald-600" };
  if (score >= 50) return { label: "Forte", tone: "text-orange-600" };
  if (score >= 25) return { label: "Moyenne", tone: "text-amber-600" };
  return { label: "Faible", tone: "text-muted-foreground" };
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function compact(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function moneyRange(range: { low: number; high: number } | null, currency?: string | null) {
  if (!range) return null;
  const unit = currency ?? "FCFA";
  return `${compact(range.low)} – ${compact(range.high)} ${unit}`;
}

export function adMedia(ad: DiscoveryAd) {
  return ad.media_signed_url ?? ad.thumbnail_url ?? ad.image_url ?? null;
}

export function useDiscoveryAds(filters: AdFilters) {
  const fn = useServerFn(listDiscoveryAds);
  return useQuery({
    queryKey: ["discovery-ads", filters],
    queryFn: () =>
      fn({
        data: {
          media: filters.media ?? "all",
          status: filters.status ?? "all",
          sort: filters.sort ?? "traction",
          minDays: filters.minDays ?? 0,
          minTraction: filters.minTraction ?? 0,
          limit: filters.limit ?? 120,
          ...(filters.country ? { country: filters.country } : {}),
          ...(filters.category ? { category: filters.category } : {}),
          ...(filters.platform ? { platform: filters.platform } : {}),
          ...(filters.source ? { source: filters.source } : {}),
          ...(filters.pixel ? { pixel: filters.pixel } : {}),
          ...(filters.domain ? { domain: filters.domain } : {}),
          ...(filters.minVariations ? { minVariations: filters.minVariations } : {}),
          ...(filters.search ? { search: filters.search } : {}),
        },
      }),
    staleTime: 60_000,
  });
}

export function useDiscoveryFacets() {
  const fn = useServerFn(getDiscoveryFacets);
  return useQuery({ queryKey: ["discovery-facets"], queryFn: () => fn(), staleTime: 120_000 });
}

export function useDiscoveryAdDetail(id: string | null) {
  const fn = useServerFn(getDiscoveryAdDetail);
  return useQuery({
    queryKey: ["discovery-ad", id],
    queryFn: () => fn({ data: { id: id! } }),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export type StoreFilters = {
  country?: string | undefined;
  category?: string | undefined;
  search?: string | undefined;
  platform?: string | undefined;
  minAds?: number;
  sort?: "traction" | "ads" | "duration" | "products" | "recent";
};

export function useDiscoveryAdvertisers(filters: StoreFilters = {}) {
  const fn = useServerFn(listDiscoveryAdvertisers);
  return useQuery({
    queryKey: ["discovery-advertisers", filters],
    queryFn: () =>
      fn({
        data: {
          minAds: filters.minAds ?? 0,
          sort: filters.sort ?? "traction",
          ...(filters.country ? { country: filters.country } : {}),
          ...(filters.category ? { category: filters.category } : {}),
          ...(filters.platform ? { platform: filters.platform } : {}),
          ...(filters.search ? { search: filters.search } : {}),
        },
      }),
    staleTime: 60_000,
  });
}

export type ProductFilters = {
  category?: string | undefined;
  country?: string | undefined;
  search?: string | undefined;
  sort?: "traction" | "ads" | "duration" | "price";
};

export function useDiscoveryProducts(filters: ProductFilters = {}) {
  const fn = useServerFn(listDiscoveryProducts);
  return useQuery({
    queryKey: ["discovery-products", filters],
    queryFn: () =>
      fn({
        data: {
          sort: filters.sort ?? "traction",
          ...(filters.category ? { category: filters.category } : {}),
          ...(filters.country ? { country: filters.country } : {}),
          ...(filters.search ? { search: filters.search } : {}),
        },
      }),
    staleTime: 60_000,
  });
}

export function useDiscoveryScans() {
  const fn = useServerFn(listDiscoveryScans);
  return useQuery({ queryKey: ["discovery-scans"], queryFn: () => fn(), staleTime: 30_000 });
}

function invalidateDiscovery(qc: ReturnType<typeof useQueryClient>) {
  for (const key of [
    "discovery-ads",
    "discovery-advertisers",
    "discovery-products",
    "discovery-scans",
    "discovery-facets",
    "brand-search-usage",
    "brand-search-history",
  ]) {

    void qc.invalidateQueries({ queryKey: [key] });
  }
}

export function useRunDiscoveryScan() {
  const fn = useServerFn(runDiscoveryScanFn);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      countries?: string[];
      keywords?: string[];
      category?: string;
      limit?: number;
      network?: "meta" | "google_ads" | "both";
      media?: "video" | "image";
      status?: "active" | "inactive";
      minDays?: number;
      minVariations?: number;
      domain?: string;
    }) => fn({ data: input }),
    onSuccess: () => invalidateDiscovery(qc),
  });
}

export function useRefreshDiscoveryStore() {
  const fn = useServerFn(refreshDiscoveryStoreFn);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (domain: string) => fn({ data: { domain } }),
    onSuccess: () => invalidateDiscovery(qc),
  });
}

/** Complète les prix manquants des boutiques listées (lecture publique). */
export function useRefreshDiscoveryPrices() {
  const fn = useServerFn(refreshDiscoveryPricesFn);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (domains: string[]) => fn({ data: { domains } }),
    retry: false,
    /* Session absente ou expirée : on ignore silencieusement, la page reste affichée. */
    onError: () => undefined,
    onSuccess: (result) => {
      if (result.refreshed > 0) invalidateDiscovery(qc);
    },
  });
}

/** Analyse à la demande du catalogue de la boutique liée à une publicité. */
export function useEnsureDiscoveryStore(domain: string | null | undefined, enabled: boolean) {
  const fn = useServerFn(ensureDiscoveryStoreFn);
  return useQuery({
    queryKey: ["discovery-store", domain],
    queryFn: () => fn({ data: { domain: domain! } }),
    enabled: enabled && !!domain && domain.includes("."),
    staleTime: 10 * 60_000,
    retry: false,
  });
}

/** Trafic réel (classement public Tranco) du domaine d'une publicité. */
export function useDomainTraffic(domain: string | null | undefined) {
  const fn = useServerFn(getDomainTraffic);
  return useQuery({
    queryKey: ["domain-traffic", domain],
    queryFn: () => fn({ data: { domain: domain! } }),
    enabled: !!domain && domain.includes("."),
    staleTime: 24 * 60 * 60_000,
    retry: false,
  });
}

/**
 * Recherche en direct d'une marque : va chercher les publicités et les chiffres
 * de cette marque même si elle n'a jamais été collectée (abonnés uniquement).
 */
export function useSearchDiscoveryBrand() {
  const fn = useServerFn(searchDiscoveryBrandFn);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { term: string; country?: string }) => fn({ data: input }),
    retry: false,
    onSuccess: () => invalidateDiscovery(qc),
  });
}

/**
 * Recherches de marque déjà utilisées ce mois-ci par le vendeur connecté.
 * Sert à afficher le compteur avant de dépenser une recherche.
 */
export function useBrandSearchQuota() {
  const { session } = useAuth();
  const access = useDiscoveryAccess();
  const quota = access.rules.liveSearches;
  const query = useQuery({
    queryKey: ["brand-search-usage", session?.user.id ?? null],
    enabled: !!session && quota > 0,
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      const start = new Date();
      start.setUTCDate(1);
      start.setUTCHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("discovery_brand_searches")
        .select("id", { count: "exact", head: true })
        .eq("billed", true)
        .gte("created_at", start.toISOString());
      return Number(count ?? 0);
    },
  });
  const used = query.data ?? 0;
  return {
    loading: access.loading || query.isLoading,
    plan: access.plan,
    planName: access.planName,
    quota,
    used,
    left: Math.max(0, quota - used),
    /** Formule payante ET quota disponible. */
    allowed: quota > 0 && used < quota,
  };
}

/** Dernières marques recherchées par le vendeur connecté (abonnés). */
export function useBrandSearchHistory() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["brand-search-history", session?.user.id ?? null],
    enabled: !!session,
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      const { data } = await supabase
        .from("discovery_brand_searches")
        .select("id, term, country, found, stores, created_at")
        .order("created_at", { ascending: false })
        .limit(24);
      const rows = data ?? [];
      const seen = new Set<string>();
      return rows.filter((row) => {
        const key = row.term.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 8);
    },
  });
}
