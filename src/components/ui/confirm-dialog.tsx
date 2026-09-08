/**
 * Pop-up de confirmation DUKAIO.
 *
 * Remplace `window.confirm` (fenêtre grise du navigateur) par une boîte de
 * dialogue aux couleurs de la marque : titre, explication, bouton d'annulation
 * et action colorée selon la gravité.
 *
 * Usage :
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "Supprimer ce produit ?", ... }))) return;
 */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Loader2, ShieldAlert, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "warning" | "default";
};

type Resolver = (value: boolean) => void;

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [pending, setPending] = useState(false);
  const resolver = useRef<Resolver | null>(null);

  const confirm = useCallback(
    (next: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setPending(false);
        setOptions(next);
      }),
    [],
  );

  const close = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  };

  const tone = options?.tone ?? "danger";
  const Icon = tone === "danger" ? Trash2 : tone === "warning" ? AlertTriangle : ShieldAlert;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={options !== null}
        onOpenChange={(open) => {
          if (!open && !pending) close(false);
        }}
      >
        <DialogContent className="gap-5 sm:max-w-md">
          <DialogHeader className="space-y-3 text-left sm:text-left">
            <span
              className={cn(
                "grid h-11 w-11 place-items-center rounded-[8px]",
                tone === "danger"
                  ? "bg-destructive/10 text-destructive"
                  : tone === "warning"
                    ? "bg-primary/10 text-primary"
                    : "bg-surface-tint text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <DialogTitle className="text-xl font-extrabold tracking-tight">
              {options?.title}
            </DialogTitle>
            {options?.description ? (
              <DialogDescription className="text-sm leading-relaxed">
                {options.description}
              </DialogDescription>
            ) : null}
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start">
            <button
              type="button"
              onClick={() => close(false)}
              className="btn-3d inline-flex flex-1 items-center justify-center rounded-[6px] border border-border px-4 py-2.5 text-sm font-semibold sm:flex-none"
            >
              {options?.cancelLabel ?? "Annuler"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPending(true);
                close(true);
              }}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform active:translate-y-px sm:flex-none",
                tone === "danger"
                  ? "bg-destructive hover:brightness-95"
                  : "btn-3d text-primary-foreground",
              )}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {options?.confirmLabel ?? "Supprimer"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm doit être utilisé dans <ConfirmProvider>.");
  return ctx;
}

/** Raccourci pour les suppressions : « Supprimer ce produit ? ». */
export function useConfirmDelete() {
  const confirm = useConfirm();
  return (label: string, description?: string) =>
    confirm({
      title: `Supprimer ${label} ?`,
      description:
        description ??
        "Cette action est définitive : l'élément disparaîtra de votre tableau de bord et de votre boutique.",
      confirmLabel: "Supprimer",
      tone: "danger",
    });
}
