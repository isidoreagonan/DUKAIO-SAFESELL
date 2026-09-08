import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, ExternalLink, Heart, ImageOff, Loader2, Megaphone, Package, Store, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { AdAnalysisDialog } from "@/components/discovery/analysis-dialog";
import { FAVORITES_LIMIT, useFavorites, useRemoveFavorite, type Favorite, type FavoriteKind } from "@/lib/favorites";

export const Route = createFileRoute("/_authenticated/dashboard/decouverte/favoris")({
  head: () => ({
    meta: [
      { title: "Mes favoris de la Découverte | DUKAIO" },
      {
        name: "description",
        content:
          "Retrouvez les boutiques, produits et publicités que vous avez enregistrés dans la Découverte, avec leur analyse détaillée en un clic.",
      },
      { property: "og:title", content: "Mes favoris de la Découverte | DUKAIO" },
      {
        property: "og:description",
        content: "Votre liste d'inspirations : boutiques, produits et publicités mis de côté pour plus tard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FavoritesPage,
});

const SECTIONS: { kind: FavoriteKind; title: string; icon: typeof Store }[] = [
  { kind: "store", title: "Boutiques enregistrées", icon: Store },
  { kind: "product", title: "Produits enregistrés", icon: Package },
  { kind: "ad", title: "Publicités enregistrées", icon: Megaphone },
];

function FavoriteCard({
  item,
  onAnalyse,
}: {
  item: Favorite;
  onAnalyse: (adId: string) => void;
}) {
  const remove = useRemoveFavorite();
  const { payload } = item;

  return (
    <article className="flex h-full flex-row overflow-hidden rounded-[10px] border border-border bg-background sm:flex-col">
      <div className="grid aspect-square w-28 shrink-0 place-items-center overflow-hidden bg-muted sm:aspect-[4/3] sm:w-full">
        {payload.image ? (
          <img src={payload.image} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <ImageOff className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 min-h-[2.1rem] text-sm font-black leading-snug">{payload.title}</h3>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {[payload.subtitle, payload.domain].filter(Boolean).join(" · ") || "Sans détail"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Retirer des favoris"
            onClick={() => remove.mutate(item.id)}
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-[4px] border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {payload.price ? (
          <p className="mt-2 text-base font-black leading-tight text-primary">{payload.price}</p>
        ) : null}

        <dl className="mt-2 hidden grid-cols-2 gap-1.5 text-[10px] sm:grid sm:text-[11px]">
          <div className="rounded-[4px] bg-muted/50 px-2 py-1.5">
            <dt className="text-muted-foreground">Pubs actives</dt>
            <dd className="font-black">{payload.activeAds ?? "—"}</dd>
          </div>
          <div className="rounded-[4px] bg-muted/50 px-2 py-1.5">
            <dt className="text-muted-foreground">Durée</dt>
            <dd className="font-black">{payload.days ? `${payload.days} j` : "—"}</dd>
          </div>
        </dl>

        <div className="mt-auto flex flex-col gap-2 pt-2.5 sm:flex-col">
          {payload.adId ? (
            <button
              type="button"
              onClick={() => onAnalyse(payload.adId as string)}
              className="btn-3d flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[6px] px-3 py-2 text-[12px] font-bold"
            >
              <BarChart3 className="h-3.5 w-3.5" /> Analyse de l'annonce
            </button>
          ) : null}
          {payload.link ? (
            <a
              href={payload.link}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-1.5 rounded-[6px] border border-border px-3 py-2 text-[12px] font-bold hover:bg-muted"
            >
              Ouvrir la page <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function FavoritesPage() {
  const { data, isLoading } = useFavorites();
  const [openId, setOpenId] = useState<string | null>(null);
  const favorites = data ?? [];

  return (
    <DashboardShell>
      <div className="mb-5 border-b border-border pb-3">
        <h1 className="text-xl font-black tracking-tight sm:text-2xl">Mes favoris</h1>
        <p className="text-[13px] text-muted-foreground sm:text-sm">
          Les boutiques, produits et publicités que vous avez mis de côté dans la Découverte.
        </p>
      </div>

      {isLoading ? (
        <div className="grid h-64 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="rounded-[6px] border border-dashed border-border bg-background px-6 py-14 text-center">
          <Heart className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-3 text-base font-black">Aucun favori pour l'instant</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Appuyez sur le cœur d'une boutique, d'un produit ou d'une publicité pour la retrouver ici, dans la limite
            de {FAVORITES_LIMIT} éléments.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground">
            {favorites.length} favori{favorites.length > 1 ? "s" : ""} sur {FAVORITES_LIMIT} possibles
          </p>
          {SECTIONS.map((section) => {
            const items = favorites.filter((item) => item.kind === section.kind);
            if (items.length === 0) return null;
            return (
              <section key={section.kind}>
                <h2 className="mb-2.5 flex items-center gap-2 text-sm font-black">
                  <section.icon className="h-4 w-4 text-primary" />
                  {section.title}
                  <span className="rounded-[4px] bg-muted px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground">
                    {items.length}
                  </span>
                </h2>
                <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-2.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                  {items.map((item) => (
                    <FavoriteCard key={item.id} item={item} onAnalyse={setOpenId} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <AdAnalysisDialog adId={openId} onClose={() => setOpenId(null)} onOpenOther={setOpenId} />
    </DashboardShell>
  );
}
