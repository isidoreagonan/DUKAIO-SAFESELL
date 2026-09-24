import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Flame, Globe, Layers, Loader2, Megaphone, Package, Star, Tags } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { DiscoveryHeader } from "@/components/discovery/header";
import { AdAnalysisDialog } from "@/components/discovery/analysis-dialog";
import { StoreCard } from "@/components/discovery/store-card";
import { DiscoveryFilterBar } from "@/components/discovery/filter-bar";
import {
  DISCOVERY_CATEGORIES,
  DISCOVERY_COUNTRIES,
  flagUrl,
  useDiscoveryAdvertisers,
  useDiscoveryFacets,
  type StoreFilters,
} from "@/lib/discovery";
import { useDiscoveryAccess } from "@/lib/entitlements";
import { DiscoveryPaywall } from "@/components/discovery/paywall-dialog";


export const Route = createFileRoute("/_authenticated/dashboard/decouverte/boutiques")({
  head: () => ({
    meta: [
      { title: "Découverte — boutiques qui vendent | DUKAIO" },
      {
        name: "description",
        content:
          "Repérez les boutiques africaines qui investissent en publicité : pubs actives, durée de diffusion, produits en ligne, marchés et indice de traction DUKAIO.",
      },
      { property: "og:title", content: "Découverte — boutiques qui vendent | DUKAIO" },
      {
        property: "og:description",
        content: "Les boutiques les plus actives en publicité en Afrique francophone, avec des données vérifiables.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiscoveryStoresPage,
});

const SORTS: { value: NonNullable<StoreFilters["sort"]>; label: string }[] = [
  { value: "traction", label: "Traction" },
  { value: "ads", label: "Nombre de pubs" },
  { value: "duration", label: "Durée" },
  { value: "products", label: "Produits" },
  { value: "recent", label: "Nouveautés" },
];

const PRESETS: {
  value: NonNullable<StoreFilters["sort"]>;
  label: string;
  icon: typeof Star;
  tone: string;
}[] = [
  { value: "traction", label: "Recommandées", icon: Star, tone: "text-amber-500" },
  { value: "ads", label: "Beaucoup de pubs", icon: Megaphone, tone: "text-blue-500" },
  { value: "duration", label: "Longue diffusion", icon: Flame, tone: "text-orange-500" },
  { value: "products", label: "Gros catalogue", icon: Package, tone: "text-emerald-600" },
  { value: "recent", label: "Nouveautés", icon: CalendarDays, tone: "text-slate-500" },
];

const MIN_ADS = [
  { value: "1", label: "1 pub active et plus" },
  { value: "3", label: "3 pubs actives et plus" },
  { value: "10", label: "10 pubs actives et plus" },
];

const PLATFORMS = [
  { value: "shopify", label: "Shopify" },
  { value: "woocommerce", label: "WooCommerce" },
  { value: "youcan", label: "YouCan" },
  { value: "wordpress", label: "WordPress" },
  { value: "dukaio", label: "DUKAIO" },
];

import { useI18n } from "@/lib/i18n";

function DiscoveryStoresPage() {
  const { dict } = useI18n();
  const [filters, setFilters] = useState<StoreFilters>({ sort: "traction" });
  const [term, setTerm] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [visible, setVisible] = useState(30);
  const access = useDiscoveryAccess();
  const { data: facets } = useDiscoveryFacets();
  const locked = !access.allowed;
  const { data: stores, isLoading } = useDiscoveryAdvertisers(filters);

  const presets = [
    { value: "traction" as const, label: dict.discoveryPage.recommended, icon: Star, tone: "text-amber-500" },
    { value: "ads" as const, label: dict.discoveryPage.activeAds, icon: Megaphone, tone: "text-blue-500" },
    { value: "duration" as const, label: "Longue diffusion", icon: Flame, tone: "text-orange-500" },
    { value: "products" as const, label: dict.dashboardNav.products, icon: Package, tone: "text-emerald-600" },
    { value: "recent" as const, label: dict.discoveryPage.recent, icon: CalendarDays, tone: "text-slate-500" },
  ];

  const set = <K extends keyof StoreFilters>(key: K, value: StoreFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));


  return (
    <DashboardShell>
      <DiscoveryHeader />

      {locked ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-orange-200 bg-orange-50 p-3 text-sm">
          <p className="font-semibold text-orange-900">
            Formule {access.planName} : aperçu limité à {access.rules.stores} boutiques. Recherche et filtres
            réservés aux abonnés.
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
          placeholder: dict.discoveryPage.searchStores,
        }}
        presets={{ value: filters.sort ?? "traction", onChange: (value) => set("sort", value), options: presets }}
        sorts={{ value: filters.sort ?? "traction", onChange: (value) => set("sort", value), options: SORTS }}
        onReset={() => {
          setFilters({ sort: "traction" });
          setTerm("");
        }}
        chips={[
          {
            key: "country",
            icon: Globe,
            label: "Marchés",
            value: filters.country ?? "",
            onChange: (value) => set("country", value || undefined),
            options: DISCOVERY_COUNTRIES.map((item) => ({
              value: item.code,
              label: item.label,
              flag: flagUrl(item.code),
            })),
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
            key: "platform",
            icon: Layers,
            label: "Technologie",
            value: filters.platform ?? "",
            onChange: (value) => set("platform", value || undefined),
            options: PLATFORMS,
          },
          {
            key: "minAds",
            icon: Megaphone,
            label: "Publicités actives",
            value: String(filters.minAds ?? ""),
            onChange: (value) => set("minAds", value ? Number(value) : 0),
            options: MIN_ADS,
          },
        ]}
      />

      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </div>
      ) : (stores ?? []).length === 0 ? (
        <div className="rounded-[6px] border border-dashed border-border bg-background px-6 py-14 text-center">
          <p className="text-base font-black">Aucune boutique repérée pour ces filtres</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Modifiez vos filtres ou effectuez une recherche avec un autre nom de boutique ou mot-clé.
          </p>
        </div>
      ) : (
        <>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/30 p-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center rounded-md bg-orange-500/15 px-2.5 py-1 text-xs font-black text-orange-700 dark:text-orange-300">
                {Math.min(visible, (stores ?? []).length)} sur {(stores ?? []).length} boutiques
              </span>
              <span className="text-xs text-muted-foreground">
                {filters.search ? (
                  <>
                    pour la recherche <strong className="text-foreground">« {filters.search} »</strong> · issues de l'analyse de {facets?.total ? facets.total.toLocaleString() : "1 139+"} publicités
                  </>
                ) : (
                  <>
                    concurrentes actives · répertoriées depuis l'analyse de {facets?.total ? facets.total.toLocaleString() : "1 139+"} publicités
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
                ✕ Voir toutes les boutiques
              </button>
            ) : null}
          </div>
          <div className="grid auto-rows-fr grid-cols-2 items-stretch gap-2.5 sm:gap-3 xl:grid-cols-3 2xl:grid-cols-4">
            {(stores ?? []).slice(0, visible).map((store) => (
              <StoreCard key={store.key} store={store} onAnalyse={setOpenId} />
            ))}
          </div>
          {(stores ?? []).length > visible ? (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setVisible((count) => count + 30)}
                className="h-10 cursor-pointer rounded-[4px] border border-border bg-background px-5 text-sm font-bold hover:bg-muted"
              >
                Voir plus de boutiques
              </button>
            </div>
          ) : null}
        </>
      )}

      <DiscoveryPaywall
        open={paywall}
        onClose={() => setPaywall(false)}
        title="Abonnez-vous pour explorer toutes les boutiques"
      />
      <AdAnalysisDialog adId={openId} onClose={() => setOpenId(null)} onOpenOther={setOpenId} />

    </DashboardShell>
  );
}
