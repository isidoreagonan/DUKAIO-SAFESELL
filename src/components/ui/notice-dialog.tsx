/**
 * Pop-up d'information / d'erreur DUKAIO.
 *
 * Les messages importants (limite de formule atteinte, fonctionnalité réservée,
 * erreur bloquante) ne passent plus par une petite notification grise : ils
 * s'affichent dans une fenêtre de marque, avec une action claire.
 *
 * Appel depuis n'importe où : `showNotice({ ... })` ou `notifyError(error)`.
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Crown, Info } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DukaioLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export type Notice = {
  title: string;
  description?: string;
  tone?: "error" | "info" | "success" | "upgrade";
  /** Bouton d'action facultatif (lien interne). */
  actionLabel?: string;
  actionTo?: string;
  closeLabel?: string;
};

type Listener = (notice: Notice) => void;
let listener: Listener | null = null;

/** Ouvre la fenêtre de marque. Sans hôte monté, on retombe sur une notification. */
export function showNotice(notice: Notice) {
  if (listener) listener(notice);
  else toast.error(notice.title, notice.description ? { description: notice.description } : {});
}

/** Messages serveur qui méritent une vraie fenêtre plutôt qu'une notification. */
function isBlocking(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("limite de la formule") ||
    m.includes("réservé") ||
    m.includes("reserve a") ||
    m.includes("formules payantes") ||
    m.includes("quota ia") ||
    m.includes("passez a") ||
    m.includes("passez à")
  );
}

/**
 * Affiche une erreur : fenêtre de marque avec invitation à monter de formule
 * quand la limite d'un abonnement est en cause, notification sinon.
 */
export function notifyError(error: unknown, fallbackTitle = "Action impossible") {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : fallbackTitle;

  if (isBlocking(message)) {
    showNotice({
      title: "Cette fonctionnalité demande une formule supérieure",
      description: message,
      tone: "upgrade",
      actionLabel: "Voir les formules",
      actionTo: "/dashboard/parametres",
      closeLabel: "Plus tard",
    });
    return;
  }

  showNotice({ title: fallbackTitle, description: message, tone: "error" });
}

/** À monter une seule fois (racine de l'application). */
export function NoticeHost() {
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    listener = (next) => setNotice(next);
    return () => {
      listener = null;
    };
  }, []);

  const tone = notice?.tone ?? "error";
  const Icon =
    tone === "upgrade"
      ? Crown
      : tone === "success"
        ? CheckCircle2
        : tone === "info"
          ? Info
          : AlertCircle;

  return (
    <Dialog open={notice !== null} onOpenChange={(open) => (open ? null : setNotice(null))}>
      <DialogContent className="gap-5 sm:max-w-md">
        <DialogHeader className="space-y-3 text-left sm:text-left">
          <div className="flex items-center justify-between gap-3">
            <span
              className={cn(
                "grid h-11 w-11 place-items-center rounded-[8px]",
                tone === "error"
                  ? "bg-destructive/10 text-destructive"
                  : tone === "success"
                    ? "bg-accent text-accent-foreground"
                    : "bg-primary/10 text-primary",
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <DukaioLogo className="h-5 opacity-60" />
          </div>
          <DialogTitle className="text-xl font-extrabold tracking-tight">
            {notice?.title}
          </DialogTitle>
          {notice?.description ? (
            <DialogDescription className="text-sm leading-relaxed">
              {notice.description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-start">
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="btn-3d inline-flex flex-1 items-center justify-center rounded-[6px] border border-border px-4 py-2.5 text-sm font-semibold sm:flex-none"
          >
            {notice?.closeLabel ?? "J'ai compris"}
          </button>
          {notice?.actionTo && notice.actionLabel ? (
            <Link
              to={notice.actionTo}
              onClick={() => setNotice(null)}
              className="btn-3d inline-flex flex-1 items-center justify-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-semibold sm:flex-none"
            >
              <Crown className="h-4 w-4" /> {notice.actionLabel}
            </Link>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
