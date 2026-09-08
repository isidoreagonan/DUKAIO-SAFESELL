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
  type StoreFilters,
} from "@/lib/discovery";
import { useDiscoveryAccess } from "@/lib/entitlements";
import { DiscoveryPaywall } from "@/components/discovery/paywall-dialog";
import { BrandSearchPanel, LiveBrandSearch } from "@/components/discovery/live-search";


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

function DiscoveryStoresPage() {
  const [filters, setFilters] = useState<StoreFilters>({ sort: "traction" });
  const [term, setTerm] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [visible, setVisible] = useState(30);
  const access = useDiscoveryAccess();
  const locked = !access.allowed;
  const { data: stores, isLoading } = useDiscoveryAdvertisers(filters);

  const set = <K extends keyof StoreFilters>(key: K, value: StoreFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  /** Après une recherche en direct : on affiche exactement la marque cherchée. */
  const [found, setFound] = useState<{
    term: string;
    count: number;
    ads: number;
    products: number;
  } | null>(null);
  const showFound = (info: { term: string; stores: number; found: number; products: number }) => {
    setTerm(info.term);
    setFound({
      term: info.term,
      count: info.stores,
      ads: info.found,
      products: info.products,
    });
    setFilters((prev) => ({
      sort: "recent",
      search: info.term,
      ...(prev.country ? { country: prev.country } : {}),
    }));
    setVisible(30);
  };

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
          placeholder: "Rechercher une boutique ou un produit (brosse, téléphone…)",
        }}
        presets={{ value: filters.sort ?? "traction", onChange: (value) => set("sort", value), options: PRESETS }}
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

      <BrandSearchPanel
        onPick={(value) => {
          setTerm(value);
          set("search", value);
        }}
      />


      {found ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-emerald-200 bg-emerald-50 p-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-900">
              Résultats pour « {found.term} » · {found.count} boutique(s) · {found.ads}{" "}
              publicité(s) · {found.products} produit(s)
            </p>
            <p className="mt-0.5 text-xs text-emerald-800">
              Elles rejoignent la base commune : vous les retrouverez aussi dans Publicités et Produits.
            </p>
          </div>
          <button
            onClick={() => {
              setFound(null);
              setTerm("");
              setFilters({ sort: "traction" });
            }}
            className="h-9 shrink-0 cursor-pointer rounded-[6px] border border-emerald-300 bg-background px-4 text-sm font-bold text-emerald-900 hover:bg-emerald-100"
          >
            Revoir toutes les boutiques
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </div>
      ) : (stores ?? []).length === 0 ? (
        <div className="rounded-[6px] border border-dashed border-border bg-background px-6 py-14 text-center">
          <p className="text-base font-black">Aucune boutique repérée pour ces filtres</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Les boutiques apparaissent dès que des publicités sont collectées dans l'onglet Publicités.
          </p>
          {filters.search ? (
            <div className="mx-auto mt-4 max-w-xl text-left">
              <LiveBrandSearch
                term={filters.search}
                country={filters.country}
                locked={locked}
                onLocked={() => setPaywall(true)}
                onFound={showFound}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <>
          {filters.search ? (
            <LiveBrandSearch
              term={filters.search}
              country={filters.country}
              locked={locked}
              onLocked={() => setPaywall(true)}
              onFound={showFound}
              label="Cherchez cette marque en direct pour tout voir"
            />
          ) : null}
          <p className="mb-3 text-xs text-muted-foreground">
            {(stores ?? []).length} boutiques · estimations calculées sur des faits vérifiables, jamais de chiffre
            d'affaires inventé.
          </p>
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
