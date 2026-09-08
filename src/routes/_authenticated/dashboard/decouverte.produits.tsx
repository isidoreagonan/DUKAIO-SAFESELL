import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
import { LiveBrandSearch } from "@/components/discovery/live-search";

import {
  DISCOVERY_CATEGORIES,
  DISCOVERY_COUNTRIES,
  compact,
  countryLabel,
  flagUrl,
  toFcfa,
  tractionLabel,

  useDiscoveryProducts,
  useRefreshDiscoveryPrices,
  type ProductFilters,
} from "@/lib/discovery";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/decouverte/produits")({
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
  const [filters, setFilters] = useState<ProductFilters>({ sort: "traction" });
  const [term, setTerm] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [visible, setVisible] = useState(30);
  const [view, setView] = useState<"cards" | "table">("table");
  const [minActive, setMinActive] = useState("");
  const [minDuration, setMinDuration] = useState("");
  const [priceBand, setPriceBand] = useState("");
  const [minTraction, setMinTraction] = useState("");
  const access = useDiscoveryAccess();
  const locked = !access.allowed;
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

  const set = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  /** Après une recherche en direct : on affiche exactement ce que le vendeur a cherché. */
  const [found, setFound] = useState<{
    term: string;
    count: number;
    ads: number;
    stores: number;
  } | null>(null);
  const showFound = (info: { term: string; found: number; stores: number; products: number }) => {
    setTerm(info.term);
    setFound({ term: info.term, count: info.products, ads: info.found, stores: info.stores });
    setFilters((prev) => ({
      sort: "traction",
      search: info.term,
      ...(prev.country ? { country: prev.country } : {}),
    }));
    setMinActive("");
    setMinDuration("");
    setPriceBand("");
    setMinTraction("");
    setVisible(30);
  };

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
          placeholder: "Rechercher un produit : brosse, cheveux, téléphone, casserole…",
        }}
        presets={{
          value: filters.sort ?? "traction",
          onChange: (value) => set("sort", value),
          options: PRESETS,
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

      {found ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-emerald-200 bg-emerald-50 p-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-900">
              Résultats pour « {found.term} » · {found.count} produit(s) · {found.ads}{" "}
              publicité(s) · {found.stores} boutique(s)
            </p>
            <p className="mt-0.5 text-xs text-emerald-800">
              La recherche a tout collecté d'un coup : ces produits, les publicités et les
              boutiques trouvées rejoignent la base commune et restent visibles dans les trois
              onglets.
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
            Revoir tous les produits
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </div>
      ) : (products ?? []).length === 0 ? (
        <div className="rounded-[6px] border border-dashed border-border bg-background px-6 py-14 text-center">
          <p className="text-base font-black">Aucun produit ne correspond à ces filtres</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Les produits apparaissent dès que des publicités sont collectées dans l'onglet Publicités.
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
          <p className="mb-3 text-xs text-muted-foreground">{(products ?? []).length} produits repérés en publicité</p>
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
                        onClick={() => setOpenId(product.id)}
                        className="btn-3d flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[6px] px-3 py-2 text-[12px] font-bold"
                      >
                        <BarChart3 className="h-3.5 w-3.5" /> Analyser
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
