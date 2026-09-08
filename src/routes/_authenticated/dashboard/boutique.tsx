import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LayoutTemplate,
  ExternalLink,
  Monitor,
  Smartphone,
  Sparkles,
  Lock,
  RefreshCw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { useStore } from "@/lib/store";
import { useThemeVersions } from "@/theme/versions";
import { storePath, storeUrl } from "@/lib/storefront";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/boutique")({
  head: () => ({
    meta: [
      { title: "Boutique en ligne | DUKAIO" },
      {
        name: "description",
        content:
          "Prévisualisez le thème de votre vitrine DUKAIO, modifiez son design et découvrez les prochains thèmes professionnels.",
      },
      { property: "og:title", content: "Boutique en ligne | DUKAIO" },
      {
        property: "og:description",
        content: "Aperçu du thème, identité visuelle et prochains thèmes de votre boutique DUKAIO.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BoutiquePage,
});

const THEME_NAME = "glow-2.0-public";

const upcoming = [
  {
    name: "Noir Studio 1.0",
    desc: "Vitrine éditoriale sombre, pensée pour les marques premium.",
    gradient: "linear-gradient(135deg,#111114,#2b2b31 60%,#4a4a52)",
  },
  {
    name: "Aurora Retail 1.0",
    desc: "Grandes images, sections produits animées et paiement rapide.",
    gradient: "linear-gradient(135deg,#1b2a4a,#2d6f9e 55%,#6ecbc4)",
  },
  {
    name: "Marché Pro 1.0",
    desc: "Catalogue dense multi-catégories pour boutiques à fort volume.",
    gradient: "linear-gradient(135deg,#3d2415,#8a4a20 55%,#d99a4e)",
  },
  {
    name: "Éclat Beauté 1.0",
    desc: "Fiches produit longues, avis clients et offres en avant.",
    gradient: "linear-gradient(135deg,#4a1b34,#a3416b 55%,#f0b9c9)",
  },
];

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-[6px] border border-border bg-background p-4 sm:p-5", className)}>
      {children}
    </section>
  );
}

function BoutiquePage() {
  const { data: store } = useStore();
  const { data: versions } = useThemeVersions(store?.id);
  const [reload, setReload] = useState(0);
  const handle = store?.subdomain ?? "";
  const liveUrl = handle ? storeUrl(handle, store?.custom_domain) : "";
  const previewPath = handle ? storePath(handle) : "";

  const lastSaved = useMemo(() => {
    const at = versions?.[0]?.created_at;
    if (!at) return null;
    return new Date(at).toLocaleString("fr-FR", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [versions]);

  const previewSrc = previewPath ? `${previewPath}?preview=${reload}` : "";

  return (
    <DashboardShell>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
            Boutique <span className="font-display not-italic text-muted-foreground">· en ligne</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Prévisualisez et personnalisez le thème de votre vitrine Dukaio.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setReload((n) => n + 1)}
            className="btn-3d inline-flex items-center gap-2 rounded-[6px] border border-border px-3 py-2.5 text-sm font-semibold"
          >
            <RefreshCw className="h-4 w-4" /> <span className="hidden sm:inline">Rafraîchir</span>
          </button>
          {liveUrl ? (
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-3.5 py-2.5 text-sm font-semibold"
            >
              <ExternalLink className="h-4 w-4" /> Voir la boutique
            </a>
          ) : null}
        </div>
      </header>

      <div className="mt-6 grid gap-4">
        {/* Carte thème façon Shopify */}
        <section className="overflow-hidden rounded-[6px] border border-border bg-background">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3">
            <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
              <LayoutTemplate className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">Thème en ligne</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Monitor className="h-3.5 w-3.5" /> <Smartphone className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="relative h-[300px] overflow-hidden bg-surface-tint sm:h-[380px] lg:h-[440px]">
            {previewSrc ? (
              <div className="flex h-full items-start justify-center gap-6 pt-6">
                {/* Aperçu ordinateur */}
                <div
                  className="relative shrink-0 overflow-hidden rounded-[4px] border border-border bg-background shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)]"
                  style={{ width: 1440 * 0.42, height: 1100 * 0.42 }}
                >
                  <iframe
                    key={`d-${reload}`}
                    title="Aperçu ordinateur du thème"
                    src={previewSrc}
                    className="pointer-events-none absolute top-0 left-0 origin-top-left"
                    style={{ width: 1440, height: 1100, transform: "scale(0.42)" }}
                  />
                </div>
                {/* Aperçu mobile */}
                <div
                  className="relative hidden shrink-0 overflow-hidden rounded-[6px] border border-border bg-background shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)] lg:block"
                  style={{ width: 390 * 0.42, height: 1000 * 0.42 }}
                >
                  <iframe
                    key={`m-${reload}`}
                    title="Aperçu mobile du thème"
                    src={previewSrc}
                    className="pointer-events-none absolute top-0 left-0 origin-top-left"
                    style={{ width: 390, height: 1000, transform: "scale(0.42)" }}
                  />
                </div>
              </div>
            ) : (
              <div className="grid h-full place-items-center px-6 text-center text-sm text-muted-foreground">
                Créez votre boutique pour afficher l'aperçu du thème.
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(to_top,var(--background),transparent)]" />
          </div>

          <div className="grid gap-3 border-t border-border px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="truncate text-sm font-bold">{THEME_NAME}</p>
                <span className="shrink-0 rounded-[4px] bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                  Actif
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {lastSaved ? `Dernière sauvegarde : ${lastSaved}` : "Aucune sauvegarde enregistrée"}
                {" · Version 2.0"}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                to="/dashboard/editeur"
                className="btn-3d inline-flex items-center gap-2 rounded-[6px] px-3.5 py-2.5 text-sm font-semibold"
              >
                <LayoutTemplate className="h-4 w-4" /> Modifier le thème
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Prochains thèmes */}
      <section className="mt-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-extrabold tracking-tight">Prochains thèmes</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Quatre thèmes professionnels arrivent bientôt dans votre bibliothèque.
            </p>
          </div>
          <span className="shrink-0 rounded-[4px] bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-foreground">
            Bientôt
          </span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {upcoming.map((t) => (
            <article
              key={t.name}
              className="overflow-hidden rounded-[6px] border border-border bg-background"
            >
              <div
                className="relative grid h-32 place-items-center"
                style={{ backgroundImage: t.gradient }}
              >
                <span className="grid h-12 w-12 place-items-center rounded-[6px] bg-[color:var(--primary-foreground)]/15 text-[color:var(--primary-foreground)] backdrop-blur-sm">
                  <Sparkles className="h-5 w-5" />
                </span>
                <span className="absolute top-2 right-2 flex items-center gap-1 rounded-[4px] bg-[color:var(--primary-foreground)]/15 px-2 py-0.5 text-[10px] font-bold text-[color:var(--primary-foreground)] backdrop-blur-sm">
                  <Lock className="h-3 w-3" /> Bientôt
                </span>
              </div>
              <div className="p-4">
                <p className="truncate text-sm font-bold">{t.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.desc}</p>
                <button
                  type="button"
                  onClick={() => toast.success("Nous vous préviendrons dès sa sortie ✓")}
                  className="btn-3d mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[6px] border border-border px-3 py-2 text-xs font-semibold"
                >
                  Me prévenir
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

    </DashboardShell>
  );
}
