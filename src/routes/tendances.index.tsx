import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Play, RotateCcw, Search, TrendingUp, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  COUNTRIES,
  PLATFORMS,
  countryLabel,
  platformLabel,
  useTrendingAds,
  type TrendingAd,
} from "@/lib/ad-library";

export const Route = createFileRoute("/tendances/")({
  head: () => ({
    meta: [
      { title: "Tendances E-commerce & Produits Gagnants | DUKAIO" },
      {
        name: "description",
        content:
          "Découvrez les publicités, niches et produits gagnants qui cartonnent en Afrique francophone : filtres par pays, catégorie et paiement à la livraison (COD).",
      },
      { property: "og:site_name", content: "DUKAIO" },
      { property: "og:title", content: "Tendances E-commerce & Produits Gagnants | DUKAIO" },
      {
        property: "og:description",
        content: "Découvrez les publicités, niches et produits gagnants qui cartonnent en Afrique francophone.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://dukaio.com/tendances" },
      { property: "og:image", content: "https://dukaio.com/og-image.png" },
      { property: "og:image:secure_url", content: "https://dukaio.com/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Tendances E-commerce & Produits Gagnants | DUKAIO" },
      { name: "twitter:description", content: "Découvrez les publicités, niches et produits gagnants qui cartonnent en Afrique francophone." },
      { name: "twitter:image", content: "https://dukaio.com/og-image.png" },
    ],
  }),
  component: TrendsPage,
});

const GENDERS = [
  { value: "all", label: "Tous les genres" },
  { value: "tous", label: "Mixte" },
  { value: "femme", label: "Femmes" },
  { value: "homme", label: "Hommes" },
];

const MODELS = [
  { value: "all", label: "Tous" },
  { value: "cod", label: "Paiement à la livraison" },
  { value: "prepaid", label: "Prépayé" },
  { value: "dropshipping", label: "Dropshipping" },
];

function compactLikes(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".", ",")}K`;
  return String(n);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

const selectClass =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus:border-primary";

function AdCard({ ad }: { ad: TrendingAd }) {
  const media = ad.thumbnail_url || ad.media_url;
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <div className="relative aspect-square bg-muted">
        {media ? (
          <img src={media} alt={ad.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <TrendingUp className="h-8 w-8" />
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-foreground/85 px-2 py-1 text-[11px] font-semibold text-background">
          {platformLabel(ad.platform)}
        </span>
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-foreground/85 px-2 py-1 text-[11px] font-semibold text-background">
          <Heart className="h-3 w-3" /> {compactLikes(ad.likes)}
        </span>
        {ad.video_url ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/50 text-background">
              <Play className="h-5 w-5" />
            </span>
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h2 className="line-clamp-2 text-sm font-bold leading-snug">{ad.title}</h2>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {MODELS.find((m) => m.value === ad.sales_model)?.label ?? ad.sales_model}
          </span>
          <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {ad.category}
          </span>
          <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {countryLabel(ad.country)}
          </span>
        </div>
        <Link
          to="/tendances/$id"
          params={{ id: ad.id }}
          className="mt-auto flex items-center justify-center gap-2 rounded-md border border-border py-2 text-sm font-semibold transition hover:border-primary hover:text-primary"
        >
          <Search className="h-4 w-4" /> Voir les détails
        </Link>
      </div>
    </article>
  );
}

function TrendsPage() {
  const { data, isLoading } = useTrendingAds();
  const [platform, setPlatform] = useState("all");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [category, setCategory] = useState("all");
  const [gender, setGender] = useState("all");
  const [model, setModel] = useState("all");
  const [minLikes, setMinLikes] = useState(0);

  function reset() {
    setPlatform("all");
    setSearch("");
    setCountry("all");
    setCategory("all");
    setGender("all");
    setModel("all");
    setMinLikes(0);
  }

  const ads = useMemo(() => {
    const rows = data ?? [];
    const q = search.trim().toLowerCase();
    return rows.filter((ad) => {
      if (platform !== "all" && ad.platform !== platform) return false;
      if (country !== "all" && ad.country !== country) return false;
      if (category !== "all" && ad.category !== category) return false;
      if (gender !== "all" && ad.gender !== gender) return false;
      if (model !== "all" && ad.sales_model !== model) return false;
      if (ad.likes < minLikes) return false;
      if (q && !`${ad.title} ${ad.description} ${ad.advertiser ?? ""}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [data, platform, search, country, category, gender, model, minLikes]);

  const tabs = [{ value: "all", label: "Tous" }, ...PLATFORMS];

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img src="/dukaio-icon.png" alt="Dukaio" className="h-9 w-9 shrink-0 object-contain rounded-md" />
            <span className="min-w-0">
              <span className="block truncate text-lg font-black leading-tight">
                Radar publicitaire
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                Propulsé par Dukaio — produits &amp; pubs gagnants
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={reset}
            className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary"
          >
            <RotateCcw className="h-4 w-4" /> Réinitialiser
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const active = platform === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setPlatform(tab.value)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
                  active
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        <section className="mt-4 grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Recherche">
            <span className="relative block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Produit, annonceur…"
                className={cn(selectClass, "pl-9")}
              />
            </span>
          </Field>
          <Field label="Catégorie">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={selectClass}
            >
              <option value="all">Toutes</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Pays">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={selectClass}
            >
              <option value="all">Tous</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Genre">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={selectClass}
            >
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Modèle de vente">
            <select value={model} onChange={(e) => setModel(e.target.value)} className={selectClass}>
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </Field>
          <Field label={`J'aime minimum : ${compactLikes(minLikes)}`}>
            <input
              type="range"
              min={0}
              max={50000}
              step={500}
              value={minLikes}
              onChange={(e) => setMinLikes(Number(e.target.value))}
              className="h-10 w-full accent-primary"
            />
          </Field>
        </section>

        <p className="mt-4 text-sm text-muted-foreground">
          {ads.length} publicité{ads.length > 1 ? "s" : ""} trouvée{ads.length > 1 ? "s" : ""}
        </p>

        {isLoading ? (
          <p className="mt-8 text-muted-foreground">Chargement…</p>
        ) : ads.length === 0 ? (
          <p className="mt-8 text-muted-foreground">
            Aucune publicité ne correspond à ces filtres pour le moment.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
