import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { AdminShell, Panel, StatCard } from "@/components/admin/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { PLANS, SUB_STATUS, SUB_STATUS_LABEL, useAdminStores, useSetSubscription } from "@/lib/admin";
import { formatFcfa } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/abonnements")({
  head: () => ({
    meta: [
      { title: "Abonnements des boutiques — Admin DUKAIO" },
      {
        name: "description",
        content:
          "Gérez les plans, statuts de paiement et montants d'abonnement de chaque boutique DUKAIO.",
      },
      { property: "og:title", content: "Abonnements — Admin DUKAIO" },
      { property: "og:description", content: "Plans et facturation des boutiques DUKAIO." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminSubscriptions,
});

type Draft = {
  storeId: string;
  userId: string;
  name: string;
  plan: string;
  status: string;
  amount: string;
  periodEnd: string;
  notes: string;
};

function AdminSubscriptions() {
  const { data, isLoading } = useAdminStores();
  const save = useSetSubscription();
  const [draft, setDraft] = useState<Draft | null>(null);

  const rows = data ?? [];
  const paying = rows.filter((s) => s.subscription?.status === "active");
  const mrr = paying.reduce((sum, s) => sum + Number(s.subscription?.amount ?? 0), 0);

  async function submit() {
    if (!draft) return;
    try {
      await save.mutateAsync({
        storeId: draft.storeId,
        userId: draft.userId,
        plan: draft.plan,
        status: draft.status,
        amount: Number(draft.amount) || 0,
        periodEnd: draft.periodEnd ? new Date(draft.periodEnd).toISOString() : null,
        notes: draft.notes || null,
      });
      toast.success("Abonnement mis à jour.");
      setDraft(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible.");
    }
  }

  return (
    <AdminShell title="Abonnements" subtitle="Plans et facturation par boutique">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Boutiques payantes" value={String(paying.length)} icon={CreditCard} />
        <StatCard label="Revenu récurrent" value={`${formatFcfa(mrr)} F`} />
        <StatCard
          label="Sans abonnement"
          value={String(rows.filter((s) => !s.subscription).length)}
        />
      </div>

      <Panel title="Abonnements">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Boutique</th>
                  <th className="py-2 pr-3 font-semibold">Plan</th>
                  <th className="py-2 pr-3 font-semibold">Statut</th>
                  <th className="py-2 pr-3 text-right font-semibold">Montant</th>
                  <th className="py-2 pr-3 font-semibold">Échéance</th>
                  <th className="py-2 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((s) => {
                  const sub = s.subscription;
                  return (
                    <tr key={s.id}>
                      <td className="py-3 pr-3">
                        <p className="font-semibold">{s.store_name}</p>
                        <p className="text-xs text-muted-foreground">{s.owner_email ?? "—"}</p>
                      </td>
                      <td className="py-3 pr-3 text-xs font-semibold uppercase">
                        {sub?.plan ?? "free"}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={cn(
                            "rounded-[4px] px-2 py-0.5 text-[11px] font-semibold",
                            sub?.status === "active"
                              ? "bg-accent text-accent-foreground"
                              : sub?.status === "past_due"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {SUB_STATUS_LABEL[sub?.status ?? "free"] ?? "Gratuit"}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right font-semibold">
                        {formatFcfa(Number(sub?.amount ?? 0))} F
                      </td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground">
                        {sub?.period_end
                          ? new Date(sub.period_end).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setDraft({
                              storeId: s.id,
                              userId: s.user_id,
                              name: s.store_name,
                              plan: sub?.plan ?? "free",
                              status: sub?.status ?? "free",
                              amount: String(sub?.amount ?? 0),
                              periodEnd: sub?.period_end
                                ? new Date(sub.period_end).toISOString().slice(0, 10)
                                : "",
                              notes: sub?.notes ?? "",
                            })
                          }
                        >
                          Modifier
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Dialog open={Boolean(draft)} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abonnement — {draft?.name}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Plan</label>
                  <Select
                    value={draft.plan}
                    onValueChange={(v) => setDraft({ ...draft, plan: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLANS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Statut</label>
                  <Select
                    value={draft.status}
                    onValueChange={(v) => setDraft({ ...draft, status: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUB_STATUS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {SUB_STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Montant mensuel (F)
                  </label>
                  <Input
                    className="mt-1"
                    inputMode="numeric"
                    value={draft.amount}
                    onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Échéance</label>
                  <Input
                    className="mt-1"
                    type="date"
                    value={draft.periodEnd}
                    onChange={(e) => setDraft({ ...draft, periodEnd: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Note interne</label>
                <Input
                  className="mt-1"
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Annuler
            </Button>
            <Button disabled={save.isPending} onClick={() => void submit()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
