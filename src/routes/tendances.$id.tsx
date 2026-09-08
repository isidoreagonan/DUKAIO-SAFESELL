import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Heart } from "lucide-react";
import mark from "@/assets/dukaio-mark.png.asset.json";
import { countryLabel, platformLabel, trendingAdQueryOptions } from "@/lib/ad-library";

export const Route = createFileRoute("/tendances/$id")({
  head: () => ({
    meta: [
      { title: "Publicité en tendance | Dukaio" },
      {
        name: "description",
        content: "Fiche détaillée d'une publicité repérée par le radar publicitaire Dukaio.",
      },
      { property: "og:title", content: "Publicité en tendance | Dukaio" },
      {
        property: "og:description",
        content: "Fiche détaillée d'une publicité repérée par le radar publicitaire Dukaio.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdDetail,
  errorComponent: () => (
    <Shell>
      <p className="text-muted-foreground">Impossible d'afficher cette publicité.</p>
    </Shell>
  ),
  notFoundComponent: () => (
    <Shell>
      <p className="text-muted-foreground">Cette publicité n'existe plus.</p>
    </Shell>
  ),
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <img src={mark.url} alt="Dukaio" className="h-8 w-8 shrink-0 object-contain" />
            <span className="truncate text-lg font-black">Radar publicitaire</span>
          </Link>
          <Link
            to="/tendances"
            className="flex shrink-0 items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}

function AdDetail() {
  const { id } = Route.useParams();
  const { data: ad, isLoading } = useQuery(trendingAdQueryOptions(id));

  if (isLoading)
    return (
      <Shell>
        <p className="text-muted-foreground">Chargement…</p>
      </Shell>
    );
  if (!ad)
    return (
      <Shell>
        <p className="text-muted-foreground">Cette publicité n'existe plus.</p>
      </Shell>
    );

  const media = ad.thumbnail_url || ad.media_url;
  return (
    <Shell>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {ad.video_url ? (
            <video src={ad.video_url} controls poster={media ?? undefined} className="w-full" />
          ) : media ? (
            <img src={media} alt={ad.title} className="w-full object-cover" />
          ) : (
            <div className="aspect-square bg-muted" />
          )}
        </div>
        <div>
          <div className="flex flex-wrap gap-2">
            {[platformLabel(ad.platform), countryLabel(ad.country), ad.category].map((tag) => (
              <span
                key={tag}
                className="rounded bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="mt-4 text-2xl font-black">{ad.title}</h1>
          {ad.advertiser ? (
            <p className="mt-1 text-sm text-muted-foreground">Annonceur : {ad.advertiser}</p>
          ) : null}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" /> {ad.likes.toLocaleString("fr-FR")} J'aime
            </span>
            <span>{ad.days_active} jours en ligne</span>
          </div>
          {ad.description ? (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{ad.description}</p>
          ) : null}
          {ad.why_it_sells ? (
            <div className="mt-6 rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-bold uppercase tracking-wide">Pourquoi ça se vend</h2>
              <p className="mt-2 text-sm text-muted-foreground">{ad.why_it_sells}</p>
            </div>
          ) : null}
          {ad.source_url || ad.snapshot_url ? (
            <a
              href={(ad.source_url || ad.snapshot_url) as string}
              target="_blank"
              rel="noreferrer"
              className="btn-pill mt-6 inline-flex items-center gap-2 px-5 py-2 text-sm"
            >
              Voir la publicité <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}
