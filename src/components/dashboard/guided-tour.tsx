/**
 * Visite guidée du tableau de bord.
 *
 * Au premier accès d'un nouveau vendeur, une série de petites bulles présente
 * les menus et les actions clés. Chaque étape peut être passée ou fermée ;
 * l'état est mémorisé sur le compte (métadonnées) et localement, pour ne pas
 * réafficher la visite à chaque connexion.
 */
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "dukaio.tour.dashboard.v1";

type Step = {
  /** Cible mise en lumière (sélecteur CSS) ; absent = bulle centrée. */
  target?: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    title: "Bienvenue sur DUKAIO 👋",
    body: "En moins de deux minutes, je vous montre où tout se trouve : vos produits, vos commandes, votre marketing et la Découverte. Vous pouvez passer la visite à tout moment.",
  },
  {
    target: '[data-tour="store-switcher"]',
    title: "Votre boutique",
    body: "Ici vous voyez la boutique en cours. Si votre formule le permet, vous basculez d'une boutique à l'autre depuis ce sélecteur.",
  },
  {
    target: '[data-tour="nav-accueil"]',
    title: "Accueil",
    body: "Votre tableau de bord : ventes du jour, commandes récentes et raccourcis vers ce qui compte.",
  },
  {
    target: '[data-tour="nav-produits"]',
    title: "Produits",
    body: "Ajoutez vos articles à la main, ou laissez DUKAIO AI rédiger la fiche complète et créer les visuels (formules Starter et Pro).",
  },
  {
    target: '[data-tour="nav-commandes"]',
    title: "Commandes",
    body: "Toutes vos commandes et vos paniers abandonnés, avec leur statut de livraison et d'encaissement.",
  },
  {
    target: '[data-tour="nav-marketing"]',
    title: "Marketing",
    body: "Codes promo, offres spéciales et e-mails automatiques pour faire revenir vos clients.",
  },
  {
    target: '[data-tour="nav-clients"]',
    title: "Clients",
    body: "Votre carnet de clients et vos segments, pour cibler vos relances.",
  },
  {
    target: '[data-tour="nav-analyses"]',
    title: "Analyses",
    body: "Visites, ventes et produits les plus performants, en temps réel.",
  },
  {
    target: '[data-tour="nav-decouverte"]',
    title: "Découverte",
    body: "Espionnez le marché : boutiques, produits et publicités qui marchent en ce moment. Ouvrez une analyse pour voir les tendances en détail.",
  },
  {
    target: '[data-tour="nav-mes-favoris"]',
    title: "Mes favoris",
    body: "Tout ce que vous mettez en cœur dans la Découverte (publicité, produit ou boutique) se retrouve ici.",
  },
  {
    target: '[data-tour="nav-ma-boutique"]',
    title: "Ma boutique",
    body: "Personnalisez l'apparence de votre boutique : couleurs, sections, pages et aperçu en direct.",
  },
  {
    target: '[data-tour="nav-abonnement"]',
    title: "Abonnement",
    body: "Votre formule, vos créations IA restantes et vos limites (produits, boutiques, équipe). Changez de formule quand vous voulez.",
  },
  {
    target: '[data-tour="user-menu"]',
    title: "Votre compte",
    body: "Profil, paramètres et déconnexion. Vous pouvez relancer cette visite depuis ce menu à tout moment.",
  },
  {
    title: "C'est parti 🚀",
    body: "Commencez par ajouter votre premier produit, puis partagez le lien de votre boutique. Le Centre d'aide reste disponible en bas du menu.",
  },
];

type Rect = { top: number; left: number; width: number; height: number };

function rectOf(selector?: string): Rect | null {
  if (!selector || typeof document === "undefined") return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function useTourLauncher() {
  return useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* stockage indisponible : la visite se lancera quand même */
    }
    window.dispatchEvent(new Event("dukaio:start-tour"));
  }, []);
}

export function GuidedTour() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  /* Démarrage automatique pour un compte qui n'a jamais vu la visite. */
  useEffect(() => {
    if (loading || !user) return;
    const seenOnAccount = Boolean(
      (user.user_metadata as Record<string, unknown> | undefined)?.["tour_dashboard_done"],
    );
    let seenLocally = false;
    try {
      seenLocally = window.localStorage.getItem(STORAGE_KEY) === "done";
    } catch {
      seenLocally = false;
    }
    if (seenOnAccount || seenLocally) return;
    const t = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(t);
  }, [loading, user]);

  /* Relance manuelle depuis le menu du compte. */
  useEffect(() => {
    const start = () => {
      setIndex(0);
      setOpen(true);
    };
    window.addEventListener("dukaio:start-tour", start);
    return () => window.removeEventListener("dukaio:start-tour", start);
  }, []);

  const step = STEPS[index];

  useLayoutEffect(() => {
    if (!open || !step) return;
    const update = () => setRect(rectOf(step.target));
    update();
    const id = window.setInterval(update, 250);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, step, index]);

  /* Pendant la visite, on empêche le défilement de l'arrière-plan. */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const finish = useCallback(
    (completed: boolean) => {
      setOpen(false);
      setIndex(0);
      try {
        window.localStorage.setItem(STORAGE_KEY, "done");
      } catch {
        /* ignoré */
      }
      void supabase.auth.updateUser({
        data: { tour_dashboard_done: true, tour_dashboard_completed: completed },
      });
    },
    [],
  );

  if (!open || !step) return null;

  const isFirst = index === 0;
  const isLast = index === STEPS.length - 1;
  const pad = 6;
  const spot = rect
    ? {
        top: Math.max(rect.top - pad, 4),
        left: Math.max(rect.left - pad, 4),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  /* Position de la bulle : à droite de la cible sur grand écran, sinon en bas. */
  const cardWidth = 320;
  const desktop = typeof window !== "undefined" && window.innerWidth >= 1024;
  let cardStyle: React.CSSProperties = {};
  if (spot && desktop) {
    const left = Math.min(spot.left + spot.width + 14, window.innerWidth - cardWidth - 16);
    const top = Math.min(Math.max(spot.top - 8, 16), window.innerHeight - 260);
    cardStyle = { top, left, width: cardWidth };
  } else if (spot) {
    const below = spot.top + spot.height + 12;
    const fitsBelow = below + 240 < window.innerHeight;
    cardStyle = {
      left: 12,
      right: 12,
      ...(fitsBelow ? { top: below } : { bottom: 16 }),
    };
  } else {
    cardStyle = desktop
      ? {
          top: "50%",
          left: "50%",
          width: cardWidth + 40,
          transform: "translate(-50%, -50%)",
        }
      : { left: 12, right: 12, bottom: 16 };
  }

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-label="Visite guidée">
      {spot ? (
        <div
          className="pointer-events-none fixed rounded-[8px] ring-2 ring-primary transition-all duration-200"
          style={{
            top: spot.top,
            left: spot.left,
            width: spot.width,
            height: spot.height,
            boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.66)",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-[rgba(2,6,23,0.66)]" />
      )}

      {/* Clic à côté = on ferme la visite. */}
      <button
        type="button"
        aria-label="Fermer la visite"
        onClick={() => finish(false)}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div
        className="fixed rounded-[10px] border border-border bg-background p-4 shadow-2xl"
        style={cardStyle}
      >
        <div className="mb-2 flex items-start gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[6px] bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <h2 className="min-w-0 flex-1 text-sm font-black leading-tight">{step.title}</h2>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => finish(false)}
            className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-[6px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">{step.body}</p>

        <div className="mt-3 flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-4 bg-primary" : "w-1.5 bg-border",
              )}
            />
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => finish(false)}
            className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Passer la visite
          </button>
          <div className="flex items-center gap-2">
            {!isFirst ? (
              <button
                type="button"
                onClick={() => setIndex((v) => Math.max(0, v - 1))}
                aria-label="Étape précédente"
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-[6px] border border-border transition-colors hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => (isLast ? finish(true) : setIndex((v) => v + 1))}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[6px] bg-primary px-3 text-xs font-black text-primary-foreground transition-opacity hover:opacity-90"
            >
              {isLast ? (
                <>
                  <Check className="h-4 w-4" /> Terminer
                </>
              ) : (
                <>
                  {index === 0 ? "Commencer" : "Suivant"} <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Étape {index + 1} / {STEPS.length}
        </div>
      </div>
    </div>
  );
}
