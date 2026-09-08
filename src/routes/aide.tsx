import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Headphones,
  LifeBuoy,
  MessageCircle,
  PlayCircle,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import teamImage from "@/assets/help-team.png";
import mark from "@/assets/dukaio-mark.png.asset.json";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  HELP_CATEGORIES,
  HELP_GUIDES,
  searchGuides,
  type HelpCategoryKey,
  type HelpGuide,
} from "@/lib/help-center";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/aide")({
  head: () => ({
    meta: [
      { title: "Centre d'aide créateurs | DUKAIO" },
      {
        name: "description",
        content:
          "Le HUB DUKAIO : guides pas à pas pour créer une offre, activer son abonnement, valider une commande ou générer sa boutique avec l'IA.",
      },
      { property: "og:title", content: "Centre d'aide créateurs | DUKAIO" },
      {
        property: "og:description",
        content:
          "Recherchez une réponse, suivez les guides détaillés et accédez directement au bon outil de votre tableau de bord.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AidePage,
});

const POPULAIRES = [
  "creer-offre",
  "activer-abonnement",
  "valider-commande",
  "boutique-ia",
  "produit-ia",
  "pixels-publicite",
];

function HelpHeader() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-[4px] bg-foreground">
            <img src={mark.url} alt="" className="h-5 w-5 object-contain" />
          </div>
          <span className="text-lg font-bold tracking-tight">dukaio</span>
        </Link>
        <Link
          to={user ? "/dashboard" : "/"}
          className="btn-white-3d inline-flex cursor-pointer items-center gap-2 px-4 py-2 text-sm"
        >
          {user ? "Retour au tableau de bord" : "Retour au site"}
        </Link>
      </div>
    </header>
  );
}

function WelcomeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="max-w-[540px] gap-0 rounded-[10px] p-0">
        <div className="px-6 pb-6 pt-8 text-center sm:px-8">
          <img
            src={teamImage}
            alt="L'équipe support DUKAIO"
            loading="lazy"
            width={992}
            height={672}
            className="mx-auto h-16 w-auto object-contain"
          />
          <DialogHeader className="mt-4 space-y-2">
            <DialogTitle className="text-center text-2xl font-black tracking-tight">
              Nous sommes là pour vous aider !
            </DialogTitle>
            <DialogDescription className="text-center text-sm leading-relaxed">
              Obtenez des réponses instantanées aux questions courantes dans notre centre
              d'aide, ou écrivez directement à notre équipe.
            </DialogDescription>
          </DialogHeader>
          <button
            type="button"
            onClick={onClose}
            className="btn-3d mt-5 inline-flex cursor-pointer items-center justify-center gap-2 px-6 py-3 text-sm"
          >
            Explorer les guides
          </button>
        </div>

        <div className="space-y-3 border-t border-border bg-muted/30 p-5 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full cursor-pointer items-start gap-3 rounded-[6px] border border-border bg-background p-3.5 text-left transition-colors hover:border-primary/40"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted">
              <BookOpen className="h-4 w-4 text-foreground" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-primary">
                Explorer le HUB des créateurs
              </span>
              <span className="block text-xs leading-relaxed text-muted-foreground">
                Plus de {HELP_GUIDES.length} guides détaillés pour faire progresser votre
                boutique.
              </span>
            </span>
          </button>

          <a
            href="https://wa.me/22600000000"
            target="_blank"
            rel="noreferrer"
            className="flex w-full cursor-pointer items-start gap-3 rounded-[6px] border border-border bg-background p-3.5 text-left transition-colors hover:border-primary/40"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted">
              <MessageCircle className="h-4 w-4 text-foreground" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-primary">
                Discuter sur WhatsApp
              </span>
              <span className="block text-xs leading-relaxed text-muted-foreground">
                Une question précise ? Notre équipe répond du lundi au samedi.
              </span>
            </span>
          </a>

          <a
            href="mailto:support@dukaio.com"
            className="flex w-full cursor-pointer items-start gap-3 rounded-[6px] border border-border bg-background p-3.5 text-left transition-colors hover:border-primary/40"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted">
              <Headphones className="h-4 w-4 text-foreground" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-primary">
                Écrire au support
              </span>
              <span className="block text-xs leading-relaxed text-muted-foreground">
                support@dukaio.com — réponse sous 24 h ouvrées.
              </span>
            </span>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GuideDialog({
  guide,
  onClose,
}: {
  guide: HelpGuide | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!guide} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="max-h-[85vh] max-w-[620px] overflow-y-auto rounded-[10px]">
        {guide ? (
          <>
            <DialogHeader>
              <span className="grid h-11 w-11 place-items-center rounded-[6px] bg-primary/10">
                <guide.icon className="h-5 w-5 text-primary" />
              </span>
              <DialogTitle className="text-xl font-black tracking-tight">
                {guide.title}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                {guide.summary}
              </DialogDescription>
            </DialogHeader>

            <ol className="mt-2 space-y-3">
              {guide.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[4px] bg-foreground text-[11px] font-black text-background">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-foreground/90">{step}</p>
                </li>
              ))}
            </ol>

            {guide.tips?.length ? (
              <div className="mt-4 space-y-2 rounded-[6px] border border-border bg-muted/40 p-3.5">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" /> Bon à savoir
                </p>
                {guide.tips.map((tip) => (
                  <p key={tip} className="text-sm leading-relaxed text-foreground/80">
                    {tip}
                  </p>
                ))}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              {guide.links.map((link, i) =>
                i === 0 ? (
                  <Link
                    key={link.to + link.label}
                    to={link.to}
                    className="btn-3d inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm"
                  >
                    {link.label} <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    key={link.to + link.label}
                    to={link.to}
                    className="btn-white-3d inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm"
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function GuideCard({ guide, onOpen }: { guide: HelpGuide; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex cursor-pointer items-start gap-3 rounded-[6px] border border-border bg-background p-4 text-left transition-colors hover:border-primary/40"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[6px] bg-muted transition-colors group-hover:bg-primary/10">
        <guide.icon className="h-4.5 w-4.5 text-foreground group-hover:text-primary" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-snug">{guide.title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
          {guide.summary}
        </span>
        <span className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {guide.minutes} min
          </span>
          <span className="inline-flex items-center gap-1">
            <PlayCircle className="h-3 w-3" /> {guide.steps.length} étapes
          </span>
        </span>
      </span>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
    </button>
  );
}

function AidePage() {
  const [welcome, setWelcome] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HelpCategoryKey | "tous">("tous");
  const [openGuide, setOpenGuide] = useState<HelpGuide | null>(null);

  useEffect(() => {
    if (localStorage.getItem("dukaio.help.welcome") !== "vu") setWelcome(true);
  }, []);

  const closeWelcome = () => {
    localStorage.setItem("dukaio.help.welcome", "vu");
    setWelcome(false);
  };

  const results = useMemo(() => {
    const base =
      category === "tous"
        ? HELP_GUIDES
        : HELP_GUIDES.filter((g) => g.category === category);
    return searchGuides(query, base);
  }, [query, category]);

  const populaires = POPULAIRES.map((id) => HELP_GUIDES.find((g) => g.id === id)!).filter(
    Boolean,
  );

  return (
    <div className="min-h-screen bg-surface-tint">
      <HelpHeader />
      <main className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-5">
        <WelcomeDialog open={welcome} onClose={closeWelcome} />
        <GuideDialog guide={openGuide} onClose={() => setOpenGuide(null)} />

        {/* En-tête + recherche */}
        <section className="rounded-[6px] border border-border bg-background p-5 sm:p-7">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-[4px] bg-primary/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                <LifeBuoy className="h-3.5 w-3.5" /> HUB des créateurs
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                Comment pouvons-nous vous aider ?
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {HELP_GUIDES.length} guides pas à pas, classés par thème, avec un accès direct
                au bon outil.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWelcome(true)}
              className="btn-white-3d hidden shrink-0 cursor-pointer items-center gap-2 px-4 py-2.5 text-sm sm:inline-flex"
            >
              <Headphones className="h-4 w-4" /> Contacter le support
            </button>
          </div>

          <label className="relative mt-5 block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher : créer une offre, abonnement, commande, boutique IA…"
              className="h-12 w-full rounded-[6px] border border-border bg-muted/30 pl-10 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Effacer la recherche"
                className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 cursor-pointer place-items-center rounded-[4px] text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>

          {!query ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="py-1 text-xs font-semibold text-muted-foreground">
                Populaire :
              </span>
              {populaires.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setOpenGuide(g)}
                  className="cursor-pointer rounded-[4px] border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {g.title}
                </button>
              ))}
            </div>
          ) : null}
        </section>

        {/* Catégories */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategory("tous")}
            className={cn(
              "shrink-0 cursor-pointer rounded-[6px] border px-3.5 py-2 text-sm font-semibold transition-colors",
              category === "tous"
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background hover:border-primary/40",
            )}
          >
            Tous les guides
          </button>
          {HELP_CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={cn(
                "inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-[6px] border px-3.5 py-2 text-sm font-semibold transition-colors",
                category === c.key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background hover:border-primary/40",
              )}
            >
              <c.icon className="h-4 w-4" /> {c.label}
            </button>
          ))}
        </div>

        {/* Résultats */}
        {results.length === 0 ? (
          <section className="mt-5 rounded-[6px] border border-border bg-background p-8 text-center">
            <Search className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-bold">Aucun guide ne correspond à « {query} »</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Essayez un mot plus simple (offre, commande, pixel, abonnement) ou contactez
              notre équipe.
            </p>
            <button
              type="button"
              onClick={() => setWelcome(true)}
              className="btn-3d mt-4 inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm"
            >
              <Headphones className="h-4 w-4" /> Contacter le support
            </button>
          </section>
        ) : category === "tous" && !query ? (
          <div className="mt-5 space-y-6">
            {HELP_CATEGORIES.map((c) => {
              const items = HELP_GUIDES.filter((g) => g.category === c.key);
              if (!items.length) return null;
              return (
                <section key={c.key}>
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] border border-border bg-background">
                      <c.icon className="h-4 w-4 text-primary" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-black tracking-tight">
                        {c.label}
                      </h2>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((g) => (
                      <GuideCard key={g.id} guide={g} onOpen={() => setOpenGuide(g)} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((g) => (
              <GuideCard key={g.id} guide={g} onOpen={() => setOpenGuide(g)} />
            ))}
          </div>
        )}

        {/* Toujours besoin d'aide */}
        <section className="mt-6 rounded-[6px] border border-border bg-background p-5 sm:p-6">
          <h2 className="text-base font-black tracking-tight">Toujours bloqué ?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Notre équipe accompagne les créateurs DUKAIO du lundi au samedi.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="https://wa.me/22600000000"
              target="_blank"
              rel="noreferrer"
              className="btn-3d inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm"
            >
              <MessageCircle className="h-4 w-4" /> Écrire sur WhatsApp
            </a>
            <a
              href="mailto:support@dukaio.com"
              className="btn-white-3d inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm"
            >
              <Headphones className="h-4 w-4" /> support@dukaio.com
            </a>
          </div>
        </section>
      </main>

      <footer className="px-4 pb-8 text-center text-xs text-muted-foreground sm:px-6">
        <Link to="/" className="cursor-pointer hover:text-foreground">
          Retour au site Dukaio
        </Link>
      </footer>
    </div>
  );
}
