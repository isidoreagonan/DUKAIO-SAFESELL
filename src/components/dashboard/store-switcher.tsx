/**
 * Sélecteur de boutique de la barre du haut : liste les boutiques du vendeur,
 * permet d'en changer et d'en créer une nouvelle dans la limite de sa formule.
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronsUpDown, Crown, Loader2, Plus, Store } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore, useStores, useCreateStore, useSwitchStore } from "@/lib/store";
import { useEntitlements } from "@/lib/entitlements";
import { cn } from "@/lib/utils";

export function StoreSwitcher() {
  const { data: store } = useStore();
  const { data: stores } = useStores();
  const { data: sub } = useEntitlements();
  const switchStore = useSwitchStore();
  const create = useCreateStore();

  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [name, setName] = useState("");

  const list = stores ?? (store ? [store] : []);
  const limit = sub?.limits.stores ?? 1;
  const canAdd = list.length < limit;
  const planName = sub?.plan === "pro" ? "Pro" : sub?.plan === "starter" ? "Starter" : "Découverte";

  const submit = () => {
    create.mutate(name.trim(), {
      onSuccess: () => {
        toast.success("Boutique créée");
        setDialog(false);
        setName("");
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Création impossible"),
    });
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="inline-flex items-center gap-2 rounded-[6px] border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted">
          <Store className="h-4 w-4 text-primary" />
          <span className="max-w-[160px] truncate">{store?.store_name ?? "Ma boutique"}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[300px] rounded-[6px] p-2">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Vos boutiques ({list.length}/{limit})
          </p>
          <ul className="space-y-1">
            {list.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => {
                    if (s.id !== store?.id) switchStore(s.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-[6px] px-2 py-2 text-left text-sm transition-colors",
                    s.id === store?.id
                      ? "bg-accent font-semibold text-accent-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  <Store className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{s.store_name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {s.subdomain ?? "lien à définir"}
                    </span>
                  </span>
                  {s.id === store?.id ? <Check className="h-4 w-4 shrink-0" /> : null}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-2 border-t border-border pt-2">
            {canAdd ? (
              <button
                onClick={() => {
                  setOpen(false);
                  setDialog(true);
                }}
                className="flex w-full items-center gap-2 rounded-[6px] px-2 py-2 text-sm font-semibold hover:bg-muted"
              >
                <Plus className="h-4 w-4 text-primary" /> Créer une boutique
              </button>
            ) : (
              <div className="rounded-[6px] bg-surface-tint p-3">
                <p className="text-xs text-muted-foreground">
                  La formule {planName} autorise {limit} boutique{limit > 1 ? "s" : ""}. Passez au
                  Pro pour en gérer jusqu'à 5.
                </p>
                <Link
                  to="/dashboard/parametres"
                  onClick={() => setOpen(false)}
                  className="btn-3d mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[6px] px-3 py-2 text-sm font-semibold"
                >
                  <Crown className="h-4 w-4" /> Voir les formules
                </Link>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="rounded-[6px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle boutique</DialogTitle>
            <DialogDescription>
              Elle démarre vide, avec son propre lien, ses produits et ses commandes.
            </DialogDescription>
          </DialogHeader>
          <label className="block text-sm font-semibold">
            Nom de la boutique
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim().length >= 2) submit();
              }}
              placeholder="Ex. Befort Double"
              className="mt-1.5 h-11 w-full rounded-[6px] border border-border bg-muted/30 px-3.5 text-sm font-normal outline-none focus:border-primary/50 focus:bg-background"
            />
          </label>
          <DialogFooter>
            <button
              onClick={() => setDialog(false)}
              className="btn-3d inline-flex items-center justify-center rounded-[6px] border border-border px-4 py-2.5 text-sm font-semibold"
            >
              Annuler
            </button>
            <button
              disabled={create.isPending || name.trim().length < 2}
              onClick={submit}
              className="btn-3d inline-flex items-center justify-center gap-2 rounded-[6px] px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {create.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Créer la boutique
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
