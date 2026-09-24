import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  Activity,
  CalendarDays,
  Copy,
  Crosshair,
  Film,
  Flame,
  Globe,
  Layers,
  Loader2,
  Megaphone,
  RefreshCw,
  Star,
  Store,
  Tags,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { DiscoveryHeader } from "@/components/discovery/header";
import { AdAnalysisDialog } from "@/components/discovery/analysis-dialog";
import { AdCard } from "@/components/discovery/ad-card";
import { DiscoveryFilterBar } from "@/components/discovery/filter-bar";
import {
  DISCOVERY_CATEGORIES,
  DISCOVERY_COUNTRIES,
  DISCOVERY_PLATFORMS,
  DISCOVERY_PIXELS,
  DISCOVERY_SOURCES,
  flagUrl,
  formatDate,
  useDiscoveryAds,
  useDiscoveryFacets,
  useRunDiscoveryScan,
  type AdFilters,
} from "@/lib/discovery";
import { useIsAdmin } from "@/lib/admin";
import { useDiscoveryAccess } from "@/lib/entitlements";
import { DiscoveryPaywall } from "@/components/discovery/paywall-dialog";
import { useI18n } from "@/lib/i18n";

const adSearchSchema = z.object({
  category: z.string().optional().catch(undefined),
  country: z.string().optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  media: z.enum(["all", "video", "image"]).optional().catch(undefined),
  status: z.enum(["all", "active", "inactive"]).optional().catch(undefined),
  sort: z.enum(["traction", "recent", "duration", "variations"]).optional().catch(undefined),
});

export const Route = createFileRoute("/_authenticated/dashboard/decouverte/publicites")({
  validateSearch: (search: Record<string, unknown>) => adSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Découverte — publicités qui tournent | DUKAIO" },
      {
        name: "description",
        content:
          "Explorez les publicités Facebook et Instagram réellement diffusées en Afrique francophone : durée de diffusion, variantes, visuels et indice de traction DUKAIO.",
      },
      { property: "og:title", content: "Découverte — publicités qui tournent | DUKAIO" },
      {
        property: "og:description",
        content: "Les vraies publicités des vendeurs africains, avec leur durée de diffusion et leurs visuels.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiscoveryAdsPage,
});

const SORTS: { value: NonNullable<AdFilters["sort"]>; label: string }[] = [
  { value: "traction", label: "Traction" },
  { value: "duration", label: "Durée" },
  { value: "variations", label: "Variantes" },
  { value: "recent", label: "Nouveautés" },
];

const PRESETS: {
  value: NonNullable<AdFilters["sort"]>;
  label: string;
  icon: typeof Star;
  tone: string;
}[] = [
  { value: "traction", label: "Recommandés", icon: Star, tone: "text-amber-500" },
  { value: "duration", label: "Longue diffusion", icon: Flame, tone: "text-orange-500" },
  { value: "variations", label: "Beaucoup de variantes", icon: Copy, tone: "text-blue-500" },
  { value: "recent", label: "Nouveautés", icon: Activity, tone: "text-emerald-600" },
];

const DAYS = [
  { value: "7", label: "7 jours et plus" },
  { value: "14", label: "14 jours et plus" },
  { value: "30", label: "30 jours et plus" },
  { value: "60", label: "60 jours et plus" },
];

const TRACTIONS = [
  { value: "25", label: "Traction 25+" },
  { value: "50", label: "Traction 50+" },
  { value: "75", label: "Traction 75+" },
];

const VARIATIONS = [
  { value: "2", label: "2 variantes et plus" },
  { value: "5", label: "5 variantes et plus" },
  { value: "10", label: "10 variantes et plus" },
];

function DiscoveryAdsPage() {
  const urlSearch = Route.useSearch();
  const [filters, setFilters] = useState<AdFilters>(() => ({
    sort: urlSearch.sort ?? "traction",
    media: urlSearch.media ?? "all",
    status: urlSearch.status ?? "active",
    category: urlSearch.category || undefined,
    country: urlSearch.country || undefined,
    search: urlSearch.search || undefined,
  }));
  const [term, setTerm] = useState(urlSearch.search ?? "");
  const [openId, setOpenId] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const access = useDiscoveryAccess();
  const locked = !access.allowed;

  useEffect(() => {
    if (access.loading) return;

    if (!locked) {
      setPaywall(false);
    } else {
      setFilters({
        sort: "traction",
        media: "all",
        status: "active",
      });
      setTerm("");
      if (urlSearch.search || (urlSearch.category && urlSearch.category !== access.rules.category)) {
        setPaywall(true);
      }
      return;
    }

    setFilters((prev) => {
      const nextCategory = urlSearch.category !== undefined ? (urlSearch.category || undefined) : prev.category;
      const nextCountry = urlSearch.country !== undefined ? (urlSearch.country || undefined) : prev.country;
      const nextSearch = urlSearch.search !== undefined ? (urlSearch.search || undefined) : prev.search;
      const nextMedia = urlSearch.media ?? prev.media ?? "all";
      const nextStatus = urlSearch.status ?? prev.status ?? "active";
      const nextSort = urlSearch.sort ?? prev.sort ?? "traction";

      if (
        prev.category === nextCategory &&
        prev.country === nextCountry &&
        prev.search === nextSearch &&
        prev.media === nextMedia &&
        prev.status === nextStatus &&
        prev.sort === nextSort
      ) {
        return prev;
      }
      return {
        ...prev,
        category: nextCategory,
        country: nextCountry,
        search: nextSearch,
        media: nextMedia,
        status: nextStatus,
        sort: nextSort,
      };
    });
    if (urlSearch.search !== undefined) {
      setTerm(urlSearch.search || "");
    }
  }, [locked, access.rules.category, urlSearch.category, urlSearch.country, urlSearch.search, urlSearch.media, urlSearch.status, urlSearch.sort]);

  const { data: ads, isLoading } = useDiscoveryAds(filters);
  const { data: facets } = useDiscoveryFacets();
  const { data: isAdmin } = useIsAdmin();
  const scan = useRunDiscoveryScan();


  const set = <K extends keyof AdFilters>(key: K, value: AdFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));


  const updatedAt = useMemo(() => {
    const latest = (ads ?? [])
      .map((ad) => ad.last_seen_at)
      .sort()
      .at(-1);
    return latest ? formatDate(latest) : null;
  }, [ads]);

  const countryOptions = DISCOVERY_COUNTRIES.map((item) => ({
    value: item.code,
    label: item.label,
    flag: flagUrl(item.code),
  }));
  const domainOptions = (facets?.domains ?? []).map((item) => ({
    value: item.value,
    label: `${item.value} (${item.total})`,
  }));

  const launchScan = () => {
    // La collecte suit exactement les filtres affichés : réseau, marché, niche,
    // format, statut, durée de diffusion, variantes et boutique.
    const network =
      filters.source === "google_ads" ? "google_ads" : filters.source === "meta" ? "meta" : "both";
    scan.mutate(
      {
        network,
        ...(filters.country ? { countries: [filters.country] } : {}),
        ...(term.trim() ? { keywords: [term.trim()] } : {}),
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.media && filters.media !== "all" ? { media: filters.media } : {}),
        ...(filters.status && filters.status !== "all" ? { status: filters.status } : {}),
        ...(filters.minDays ? { minDays: filters.minDays } : {}),
        ...(filters.minVariations ? { minVariations: filters.minVariations } : {}),
        ...(filters.domain ? { domain: filters.domain } : {}),
        limit: 20,
      },
      {
        onSuccess: (result) => {
          if (!result.ok) {
            toast.error(result.reason ?? "Collecte impossible.");
            return;
          }
          const where = [result.keywords?.join(", "), result.countries?.join(", ")].filter(Boolean).join(" · ");
          toast.success(
            `${result.inserted} nouvelles pubs · ${result.updated} déjà connues${where ? ` (${where})` : ""}`,
          );
        },
        onError: () => toast.error("Collecte impossible pour le moment."),
      },
    );
  };

  const { dict } = useI18n();

  const presets = [
    { value: "traction" as const, label: dict.discoveryPage.recommended, icon: Star, tone: "text-amber-500" },
    { value: "duration" as const, label: "Longue diffusion", icon: Flame, tone: "text-orange-500" },
    { value: "variations" as const, label: "Beaucoup de variantes", icon: Copy, tone: "text-blue-500" },
    { value: "recent" as const, label: dict.discoveryPage.recent, icon: Activity, tone: "text-emerald-600" },
  ];

  return (
    <DashboardShell>
      <DiscoveryHeader updatedAt={updatedAt} />

      {locked ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-orange-200 bg-orange-50 p-3 text-sm">
          <p className="font-semibold text-orange-900">
            Formule {access.planName} : aperçu de {access.rules.ads} publicités beauté (France). La recherche et
            les filtres sont réservés aux abonnés.
          </p>
          <button
            onClick={() => setPaywall(true)}
            className="h-9 cursor-pointer rounded-[6px] bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Débloquer
          </button>
        </div>
      ) : null}

      <DiscoveryFilterBar
        locked={locked}
        onLocked={() => setPaywall(true)}
        search={{
          value: term,
          onChange: setTerm,
          onSubmit: () => set("search", term.trim() || undefined),
          placeholder: dict.discoveryPage.searchAds,
        }}
        presets={{
          value: filters.sort ?? "traction",
          onChange: (value) => set("sort", value),
          options: presets,
        }}
        sorts={{ value: filters.sort ?? "traction", onChange: (value) => set("sort", value), options: SORTS }}
        onReset={() => {
          setFilters({ sort: "traction", media: "all", status: "active" });
          setTerm("");
        }}
        chips={[
          {
            key: "source",
            icon: Megaphone,
            label: "Régie (Meta / Google)",
            value: filters.source ?? "",
            onChange: (value) => set("source", value || undefined),
            options: DISCOVERY_SOURCES,
          },
          {
            key: "country",
            icon: Globe,
            label: "Marchés",
            value: filters.country ?? "",
            onChange: (value) => set("country", value || undefined),
            options: countryOptions,
          },
          {
            key: "category",
            icon: Tags,
            label: "Niche",
            value: filters.category ?? "",
            onChange: (value) => set("category", value || undefined),
            options: DISCOVERY_CATEGORIES.map((item) => ({ value: item, label: item })),
          },
          {
            key: "media",
            icon: Film,
            label: "Format",
            value: filters.media && filters.media !== "all" ? filters.media : "",
            onChange: (value) => set("media", (value || "all") as AdFilters["media"]),
            options: [
              { value: "video", label: "Vidéos" },
              { value: "image", label: "Images" },
            ],
          },
          {
            key: "status",
            icon: Activity,
            label: "Statut",
            value: filters.status && filters.status !== "all" ? filters.status : "",
            onChange: (value) => set("status", (value || "all") as AdFilters["status"]),
            options: [
              { value: "active", label: "Pubs actives" },
              { value: "inactive", label: "Pubs arrêtées" },
            ],
          },
          {
            key: "days",
            icon: CalendarDays,
            label: "Durée de diffusion",
            value: String(filters.minDays ?? ""),
            onChange: (value) => set("minDays", value ? Number(value) : 0),
            options: DAYS,
          },
          {
            key: "pixel",
            icon: Crosshair,
            label: "Pixel installé",
            value: filters.pixel ?? "",
            onChange: (value) => set("pixel", value || undefined),
            options: DISCOVERY_PIXELS,
            advanced: true,
          },
          {
            key: "platform",
            icon: Layers,
            label: "Réseau de diffusion",
            value: filters.platform ?? "",
            onChange: (value) => set("platform", value || undefined),
            options: DISCOVERY_PLATFORMS,
            advanced: true,
          },
          {
            key: "traction",
            icon: Flame,
            label: "Traction",
            value: String(filters.minTraction ?? ""),
            onChange: (value) => set("minTraction", value ? Number(value) : 0),
            options: TRACTIONS,
            advanced: true,
          },
          {
            key: "variations",
            icon: Copy,
            label: "Variantes",
            value: String(filters.minVariations ?? ""),
            onChange: (value) => set("minVariations", value ? Number(value) : undefined),
            options: VARIATIONS,
            advanced: true,
          },
          ...(domainOptions.length > 0
            ? [
                {
                  key: "domain",
                  icon: Store,
                  label: "Boutique",
                  value: filters.domain ?? "",
                  onChange: (value: string) => set("domain", value || undefined),
                  options: domainOptions,
                  advanced: true,
                },
              ]
            : []),
        ]}
        right={
          isAdmin ? (
            <button
              onClick={launchScan}
              disabled={scan.isPending}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-[8px] border border-border bg-background px-3 text-xs font-bold transition-colors hover:bg-muted disabled:opacity-60"
            >
              {scan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Collecter
            </button>
          ) : null
        }
      />

      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </div>
      ) : (ads ?? []).length === 0 ? (
        <div className="rounded-[6px] border border-dashed border-border bg-background px-6 py-14 text-center">
          <p className="text-base font-black">Aucune publicité ne correspond à ces critères</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Modifiez vos filtres ou effectuez une recherche avec d'autres mots-clés.
          </p>
        </div>
      ) : (
        <>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/30 p-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center rounded-md bg-orange-500/15 px-2.5 py-1 text-xs font-black text-orange-700 dark:text-orange-300">
                {(ads ?? []).length} affichées
              </span>
              <span className="text-xs text-muted-foreground">
                {filters.search ? (
                  <>
                    publicités trouvées pour <strong className="text-foreground">« {filters.search} »</strong> · sur un total de {facets?.total ? facets.total.toLocaleString() : "1 139+"} publicités actives
                  </>
                ) : (
                  <>
                    sur un total de <strong className="text-foreground font-bold">{facets?.total ? facets.total.toLocaleString() : "1 139+"} publicités actives surveillées</strong> (dont {facets?.videoTotal ?? "536"} vidéos HD)
                  </>
                )}
              </span>
            </div>
            {filters.search ? (
              <button
                onClick={() => {
                  setTerm("");
                  set("search", undefined);
                }}
                className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 hover:bg-orange-100 dark:border-orange-900/40 dark:bg-orange-950/40 dark:text-orange-300 cursor-pointer transition-colors"
              >
                ✕ Voir toutes les publicités
              </button>
            ) : null}
          </div>
          <div className="grid auto-rows-fr grid-cols-2 items-stretch gap-2.5 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
            {(ads ?? []).map((ad) => (
              <AdCard key={ad.id} ad={ad} onAnalyse={setOpenId} />
            ))}
          </div>
          {locked ? (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setPaywall(true)}
                className="h-11 cursor-pointer rounded-[6px] bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Voir des milliers de publicités
              </button>
            </div>
          ) : (ads ?? []).length >= (filters.limit ?? 120) ? (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => set("limit", (filters.limit ?? 120) + 120)}
                className="h-11 cursor-pointer rounded-[4px] border border-border bg-background px-6 text-sm font-bold hover:bg-muted"
              >
                Voir plus de publicités
              </button>
            </div>
          ) : null}
        </>

      )}

      <DiscoveryPaywall open={paywall} onClose={() => setPaywall(false)} />
      <AdAnalysisDialog adId={openId} onClose={() => setOpenId(null)} onOpenOther={setOpenId} />

    </DashboardShell>
  );
}
