import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  BarChart3,
  CalendarDays,
  Coins,
  ExternalLink,
  Flame,
  Globe,
  ImageOff,
  Loader2,
  Megaphone,
  Package,
  Star,
  Tags,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { DiscoveryHeader } from "@/components/discovery/header";
import { AdAnalysisDialog } from "@/components/discovery/analysis-dialog";
import { DiscoveryFilterBar } from "@/components/discovery/filter-bar";
import { Sparkline } from "@/components/discovery/charts";
import { FavoriteButton } from "@/components/discovery/favorite-button";
import { ProductTable } from "@/components/discovery/product-table";
import { useDiscoveryAccess } from "@/lib/entitlements";
import { useAuth } from "@/hooks/use-auth";
import { DiscoveryPaywall } from "@/components/discovery/paywall-dialog";

import {
  DISCOVERY_CATEGORIES,
  DISCOVERY_COUNTRIES,
  compact,
  countryLabel,
  flagUrl,
  toFcfa,
  tractionLabel,

  useDiscoveryFacets,
  useDiscoveryProducts,
  useRefreshDiscoveryPrices,
  type ProductFilters,
} from "@/lib/discovery";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const productSearchSchema = z.object({
  category: z.string().optional().catch(undefined),
  country: z.string().optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  sort: z.enum(["traction", "ads", "duration", "price"]).optional().catch(undefined),
});

export const Route = createFileRoute("/_authenticated/dashboard/decouverte/produits")({
  validateSearch: (search: Record<string, unknown>) => productSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Découverte — produits qui vendent | DUKAIO" },
      {
        name: "description",
        content:
          "Les produits réellement poussés en publicité en Afrique francophone : visuels, prix moyen du catalogue, pubs actives, durée de diffusion et marchés visés.",
      },
      { property: "og:title", content: "Découverte — produits qui vendent | DUKAIO" },
      {
        property: "og:description",
        content: "Repérez les produits sur lesquels les vendeurs africains investissent réellement en publicité.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiscoveryProductsPage,
});

const SORTS: { value: NonNullable<ProductFilters["sort"]>; label: string }[] = [
  { value: "traction", label: "Traction" },
  { value: "ads", label: "Nombre de pubs" },
  { value: "duration", label: "Durée" },
  { value: "price", label: "Prix moyen" },
];

const PRESETS: {
  value: NonNullable<ProductFilters["sort"]>;
  label: string;
  icon: typeof Star;
  tone: string;
}[] = [
  { value: "traction", label: "Recommandés", icon: Star, tone: "text-amber-500" },
  { value: "ads", label: "Pubs actives", icon: Megaphone, tone: "text-blue-500" },
  { value: "duration", label: "Longue diffusion", icon: Flame, tone: "text-orange-500" },
  { value: "price", label: "Panier élevé", icon: Coins, tone: "text-emerald-600" },
];

const MIN_ACTIVE = [
  { value: "1", label: "1 pub active ou +" },
  { value: "5", label: "5 pubs actives ou +" },
  { value: "20", label: "20 pubs actives ou +" },
  { value: "50", label: "50 pubs actives ou +" },
];

const MIN_DURATION = [
  { value: "7", label: "7 jours ou +" },
  { value: "30", label: "30 jours ou +" },
  { value: "90", label: "90 jours ou +" },
];

const PRICE_BANDS = [
  { value: "0-10000", label: "Moins de 10 000 FCFA" },
  { value: "10000-25000", label: "10 000 à 25 000 FCFA" },
  { value: "25000-50000", label: "25 000 à 50 000 FCFA" },
  { value: "50000-0", label: "Plus de 50 000 FCFA" },
];

const MIN_TRACTION = [
  { value: "40", label: "Traction 40+" },
  { value: "60", label: "Traction 60+" },
  { value: "80", label: "Traction 80+" },
];

function DiscoveryProductsPage() {
  const urlSearch = Route.useSearch();
  const [filters, setFilters] = useState<ProductFilters>(() => ({
    sort: urlSearch.sort ?? "traction",
    category: urlSearch.category || undefined,
    country: urlSearch.country || undefined,
    search: urlSearch.search || undefined,
  }));
  const [term, setTerm] = useState(urlSearch.search ?? "");
  const [openId, setOpenId] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [visible, setVisible] = useState(30);
  const [view, setView] = useState<"cards" | "table">("table");
  const [minActive, setMinActive] = useState("");
  const [minDuration, setMinDuration] = useState("");
  const [priceBand, setPriceBand] = useState("");
  const [minTraction, setMinTraction] = useState("");
  const set = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const access = useDiscoveryAccess();
  const { data: facets } = useDiscoveryFacets();
  const locked = !access.allowed;

  useEffect(() => {
    if (access.loading) return;

    if (!locked) {
      setPaywall(false);
    } else {
      setFilters({ sort: "traction" });
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
      const nextSort = urlSearch.sort ?? prev.sort ?? "traction";

      if (
        prev.category === nextCategory &&
        prev.country === nextCountry &&
        prev.search === nextSearch &&
        prev.sort === nextSort
      ) {
        return prev;
      }
      return {
        ...prev,
        category: nextCategory,
        country: nextCountry,
        search: nextSearch,
        sort: nextSort,
      };
    });
    if (urlSearch.search !== undefined) {
      setTerm(urlSearch.search || "");
    }
  }, [locked, access.rules.category, urlSearch.category, urlSearch.country, urlSearch.search, urlSearch.sort]);

  const { data: rows, isLoading } = useDiscoveryProducts(filters);

  /* Filtres complémentaires appliqués côté client. */
  const products = (rows ?? []).filter((product) => {
    if (minActive && product.activeAds < Number(minActive)) return false;
    if (minDuration && product.maxDuration < Number(minDuration)) return false;
    if (minTraction && product.traction < Number(minTraction)) return false;
    if (priceBand) {
      const [low, high] = priceBand.split("-").map(Number) as [number, number];
      const price = product.price > 0 ? toFcfa(product.price, product.currency) : 0;
      if (price <= 0 || price < low) return false;
      if (high > 0 && price > high) return false;
    }
    return true;
  });

  const { session } = useAuth();
  const refreshPrices = useRefreshDiscoveryPrices();
  const asked = useRef(new Set<string>());

  /* Les fiches sans prix sont complétées en lisant le catalogue public. */
  useEffect(() => {
    if (!session || !products || refreshPrices.isPending) return;
    const missing = Array.from(
      new Set(
        products
          .filter((product) => (product.price <= 0 || !product.currency) && product.domain)
          .map((product) => product.domain as string)
          .filter((domain) => !asked.current.has(domain)),
      ),
    ).slice(0, 8);
    if (missing.length === 0) return;
    for (const domain of missing) asked.current.add(domain);
    refreshPrices.mutate(missing);
  }, [session, products, refreshPrices]);

  const { dict } = useI18n();

  const presets = [
    { value: "traction" as const, label: dict.discoveryPage.recommended, icon: Star, tone: "text-amber-500" },
    { value: "ads" as const, label: dict.discoveryPage.activeAds, icon: Megaphone, tone: "text-blue-500" },
    { value: "duration" as const, label: "Longue diffusion", icon: Flame, tone: "text-orange-500" },
    { value: "price" as const, label: "Panier élevé", icon: Coins, tone: "text-emerald-600" },
  ];

  return (
    <DashboardShell>
      <DiscoveryHeader />

      {locked ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-orange-200 bg-orange-50 p-3 text-sm">
          <p className="font-semibold text-orange-900">
            Formule {access.planName} : aperçu limité à {access.rules.products} produits. Recherche et filtres
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
          placeholder: dict.discoveryPage.searchProducts,
        }}
        presets={{
          value: filters.sort ?? "traction",
          onChange: (value) => set("sort", value),
          options: presets,
        }}
        sorts={{ value: filters.sort ?? "traction", onChange: (value) => set("sort", value), options: SORTS }}
        onReset={() => {
          setFilters({ sort: "traction" });
          setTerm("");
          setMinActive("");
          setMinDuration("");
          setPriceBand("");
          setMinTraction("");
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
            key: "active",
            icon: Megaphone,
            label: "Publicités actives",
            value: minActive,
            onChange: setMinActive,
            options: MIN_ACTIVE,
          },
          {
            key: "duration",
            icon: CalendarDays,
            label: "Durée de diffusion",
            value: minDuration,
            onChange: setMinDuration,
            options: MIN_DURATION,
          },
          {
            key: "price",
            icon: Coins,
            label: "Prix du produit",
            value: priceBand,
            onChange: setPriceBand,
            options: PRICE_BANDS,
          },
          {
            key: "traction",
            icon: Flame,
            label: "Traction",
            value: minTraction,
            onChange: setMinTraction,
            options: MIN_TRACTION,
          },
        ]}
        right={
          <div className="flex items-center gap-1 rounded-[8px] border border-border bg-background p-0.5">
            {(["table", "cards"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={cn(
                  "cursor-pointer rounded-[6px] px-3 py-1.5 text-xs font-bold transition-colors",
                  view === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {mode === "cards" ? "Cartes" : "Tableau"}
              </button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </div>
      ) : (products ?? []).length === 0 ? (
        <div className="rounded-[6px] border border-dashed border-border bg-background px-6 py-14 text-center">
          <p className="text-base font-black">Aucun produit ne correspond à ces critères</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Modifiez vos filtres ou effectuez une recherche avec un autre nom de produit.
          </p>
        </div>
      ) : (
        <>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/30 p-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center rounded-md bg-orange-500/15 px-2.5 py-1 text-xs font-black text-orange-700 dark:text-orange-300">
                {(products ?? []).length} {filters.search ? "produits trouvés" : "produits gagnants"}
              </span>
              <span className="text-xs text-muted-foreground">
                {filters.search ? (
                  <>
                    pour la recherche <strong className="text-foreground">« {filters.search} »</strong> · extraits des {facets?.total ? facets.total.toLocaleString() : "1 139+"} publicités surveillées
                  </>
                ) : (
                  <>
                    répertoriés et classés par traction · issus des {facets?.total ? facets.total.toLocaleString() : "1 139+"} publicités actives de la plateforme
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
                ✕ Effacer la recherche ({filters.search})
              </button>
            ) : null}
          </div>
          {view === "table" ? (
            <div className="hidden sm:block">
              <ProductTable products={(products ?? []).slice(0, visible)} onAnalyse={setOpenId} />
            </div>
          ) : null}
          <div
            className={cn(
              "grid auto-rows-fr grid-cols-2 items-stretch gap-2.5 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4",
              view === "table" && "sm:hidden",
            )}
          >
            {(products ?? []).slice(0, visible).map((product) => {
              const traction = tractionLabel(product.traction);
              return (
                <article
                  key={product.id}
                  className="flex h-full flex-col overflow-hidden rounded-[6px] border border-border bg-background"
                >
                  <div className="grid aspect-[4/3] w-full place-items-center overflow-hidden bg-muted">
                    {product.image ? (
                      <img src={product.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <ImageOff className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-2.5 sm:p-3">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="line-clamp-2 text-sm font-black leading-snug">{product.title}</h2>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {product.pageName} · {product.category}
                        </p>
                      </div>
                      <span className={cn("shrink-0 text-xs font-black", traction.tone)}>{product.traction}/100</span>
                    </div>

                    <p className="mt-2 text-base font-black leading-tight text-orange-600 sm:text-lg">
                      {product.price > 0
                        ? `${compact(Math.round(toFcfa(product.price, product.currency)))} FCFA`
                        : refreshPrices.isPending
                          ? "Lecture du prix…"
                          : "Prix non public"}
                      {product.price > 0 ? (
                        <span className="ml-1 hidden text-[10px] font-semibold text-muted-foreground sm:inline">
                          prix moyen du catalogue
                          {product.currency && product.currency !== "XOF"
                            ? ` (${compact(product.price)} ${product.currency})`
                            : ""}
                        </span>
                      ) : null}
                    </p>


                    <dl className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] sm:grid-cols-3 sm:text-[11px]">
                      <div className="rounded-[4px] bg-muted/50 px-2 py-1.5">
                        <dt className="flex items-center gap-1 text-muted-foreground">
                          <Megaphone className="h-3 w-3" /> Pubs
                        </dt>
                        <dd className="font-black">
                          {product.adsCount}
                          <span className="ml-1 text-[10px] text-emerald-600">{product.activeAds} act.</span>
                        </dd>
                      </div>
                      <div className="rounded-[4px] bg-muted/50 px-2 py-1.5">
                        <dt className="flex items-center gap-1 text-muted-foreground">
                          <CalendarDays className="h-3 w-3" /> Durée
                        </dt>
                        <dd className="font-black">{product.maxDuration} j</dd>
                      </div>
                      <div className="hidden rounded-[4px] bg-muted/50 px-2 py-1.5 sm:block">
                        <dt className="flex items-center gap-1 text-muted-foreground">
                          <Package className="h-3 w-3" /> Site
                        </dt>
                        <dd className="font-black">{product.productsCount || "—"}</dd>
                      </div>
                    </dl>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {product.countries.slice(0, 4).map((code, index) => (
                        <span
                          key={code}
                          className={cn(
                            "flex items-center gap-1 rounded-[4px] border border-border px-1.5 py-0.5 text-[10px] font-semibold",
                            index > 0 && "hidden sm:flex",
                          )}
                        >
                          <img src={flagUrl(code)} alt="" className="h-2.5 w-3.5 rounded-[1px]" />
                          {countryLabel(code)}
                        </span>
                      ))}
                    </div>

                    <Sparkline data={product.timeline} className="mt-2 hidden w-full sm:block" height={34} />

                    <div className="mt-auto flex gap-2 pt-2 sm:pt-3">
                      <button
                        type="button"
                        onClick={() => setOpenId(product.id)}
                        className="btn-3d flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[6px] px-3 py-2 text-[12px] font-bold text-white"
                      >
                        <BarChart3 className="h-3.5 w-3.5 text-white" />
                        <span>Analyser</span>
                      </button>
                      <FavoriteButton
                        size="sm"
                        kind="product"
                        refId={product.id}
                        payload={{
                          title: product.title,
                          subtitle: product.pageName,
                          image: product.image,
                          domain: product.domain,
                          link: product.link,
                          adId: product.id,
                          activeAds: product.activeAds,
                          days: product.maxDuration,
                          price:
                            product.price > 0
                              ? `${compact(Math.round(toFcfa(product.price, product.currency)))} FCFA`
                              : null,
                        }}
                      />
                      {product.link ? (
                        <a
                          href={product.link}
                          target="_blank"
                          rel="noreferrer"
                          className="hidden items-center gap-1 rounded-[4px] border border-border px-2.5 py-2 text-[12px] font-bold hover:bg-muted sm:flex"
                        >
                          Page <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {(products ?? []).length > visible ? (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setVisible((count) => count + 30)}
                className="h-10 cursor-pointer rounded-[4px] border border-border bg-background px-5 text-sm font-bold hover:bg-muted"
              >
                Voir plus de produits
              </button>
            </div>
          ) : null}
        </>
      )}

      <DiscoveryPaywall
        open={paywall}
        onClose={() => setPaywall(false)}
        title="Abonnez-vous pour voir tous les produits gagnants"
      />
      <AdAnalysisDialog adId={openId} onClose={() => setOpenId(null)} onOpenOther={setOpenId} />

    </DashboardShell>
  );
}
