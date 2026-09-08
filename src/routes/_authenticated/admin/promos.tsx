import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Ticket, Trash2 } from "lucide-react";
import { AdminShell, Panel, StatCard } from "@/components/admin/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminPromoCodes,
  useCreatePromoCode,
  useDeletePromoCode,
  useSetPromoActive,
  type PromoDraft,
} from "@/lib/admin";
import { formatFcfa } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/promos")({
  head: () => ({
    meta: [
      { title: "Codes promo abonnements — Admin DUKAIO" },
      {
        name: "description",
        content:
          "Créez des codes promo à appliquer sur les abonnements DUKAIO : remise en pourcentage ou en francs, durée et nombre d'utilisations.",
      },
      { property: "og:title", content: "Codes promo — Admin DUKAIO" },
      {
        property: "og:description",
        content: "Remises sur les abonnements DUKAIO : création, suivi des utilisations, activation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPromos,
});

const PLAN_LABEL: Record<string, string> = { starter: "Starter", pro: "Pro" };

const EMPTY: PromoDraft = {
  code: "",
  discountType: "percent",
  discountValue: 20,
  plan: "",
  billingPeriod: "",
};

function AdminPromos() {
  const list = useAdminPromoCodes();
  const create = useCreatePromoCode();
  const toggle = useSetPromoActive();
  const remove = useDeletePromoCode();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PromoDraft>(EMPTY);

  const rows = list.data ?? [];
  const active = rows.filter((r) => r.is_active).length;
  const uses = rows.reduce((sum, r) => sum + Number(r.used_count ?? 0), 0);

  const submit = () => {
    create.mutate(draft, {
      onSuccess: () => {
        toast.success(`Code ${draft.code.toUpperCase()} créé.`);
        setOpen(false);
        setDraft(EMPTY);
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Création impossible."),
    });
  };

  return (
    <AdminShell
      title="Codes promo"
      subtitle="Remises appliquées automatiquement au paiement de l'abonnement."
      actions={
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nouveau code
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Codes actifs" value={String(active)} />
        <StatCard label="Codes créés" value={String(rows.length)} />
        <StatCard label="Utilisations" value={String(uses)} />
      </div>

      <Panel title="Tous les codes">
        {list.isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Chargement…</p>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center">
            <Ticket className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Aucun code promo pour l'instant. Créez-en un pour offrir une remise sur les abonnements.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Remise</th>
                  <th className="px-4 py-3">Formule</th>
                  <th className="px-4 py-3">Validité</th>
                  <th className="px-4 py-3">Utilisations</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold">{r.code}</span>
                      {r.note ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">{r.note}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {r.discount_type === "fixed"
                        ? `−${formatFcfa(Number(r.discount_value))} F`
                        : `−${Number(r.discount_value)} %`}
                    </td>
                    <td className="px-4 py-3">
                      {r.plan ? (PLAN_LABEL[r.plan] ?? r.plan) : "Toutes"}
                      <span className="block text-xs text-muted-foreground">
                        {r.billing_period === "yearly"
                          ? "annuel"
                          : r.billing_period === "monthly"
                            ? "mensuel"
                            : "mensuel + annuel"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {r.ends_at
                        ? `jusqu'au ${new Date(r.ends_at).toLocaleDateString("fr-FR")}`
                        : "sans limite de date"}
                    </td>
                    <td className="px-4 py-3">
                      {r.used_count}
                      {r.max_uses ? ` / ${r.max_uses}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggle.mutate({ id: r.id, active: !r.is_active })}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                            r.is_active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-border bg-muted text-muted-foreground",
                          )}
                        >
                          {r.is_active ? "Actif" : "Inactif"}
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (!window.confirm(`Supprimer le code ${r.code} ?`)) return;
                            remove.mutate(r.id, {
                              onSuccess: () => toast.success("Code supprimé."),
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau code promo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Code</label>
              <Input
                className="mt-1.5 font-mono uppercase"
                placeholder="BIENVENUE20"
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Type de remise</label>
                <Select
                  value={draft.discountType}
                  onValueChange={(v) =>
                    setDraft({ ...draft, discountType: v as PromoDraft["discountType"] })
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Pourcentage</SelectItem>
                    <SelectItem value="fixed">Montant en FCFA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  {draft.discountType === "fixed" ? "Montant (FCFA)" : "Remise (%)"}
                </label>
                <Input
                  className="mt-1.5"
                  inputMode="numeric"
                  value={String(draft.discountValue)}
                  onChange={(e) =>
                    setDraft({ ...draft, discountValue: Number(e.target.value.replace(/\D+/g, "")) })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Formule</label>
                <Select
                  value={draft.plan || "all"}
                  onValueChange={(v) =>
                    setDraft({ ...draft, plan: (v === "all" ? "" : v) as PromoDraft["plan"] })
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Paiement</label>
                <Select
                  value={draft.billingPeriod || "all"}
                  onValueChange={(v) =>
                    setDraft({
                      ...draft,
                      billingPeriod: (v === "all" ? "" : v) as PromoDraft["billingPeriod"],
                    })
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Mensuel + annuel</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="yearly">Annuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Utilisations max.
                </label>
                <Input
                  className="mt-1.5"
                  inputMode="numeric"
                  placeholder="illimité"
                  value={draft.maxUses ? String(draft.maxUses) : ""}
                  onChange={(e) =>
                    setDraft({ ...draft, maxUses: Number(e.target.value.replace(/\D+/g, "")) })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Expire le</label>
                <Input
                  className="mt-1.5"
                  type="date"
                  value={draft.endsAt ?? ""}
                  onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Note interne (facultatif)
              </label>
              <Textarea
                className="mt-1.5"
                rows={2}
                placeholder="Campagne lancement, influenceur…"
                value={draft.note ?? ""}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit} disabled={create.isPending || draft.code.trim().length < 3}>
              Créer le code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
