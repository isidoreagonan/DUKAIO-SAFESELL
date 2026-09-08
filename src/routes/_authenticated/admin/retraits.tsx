import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Banknote, RefreshCw, Wallet } from "lucide-react";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminPayoutSummary,
  useAdminPayouts,
  useCreatePayout,
  useRefreshPayout,
} from "@/lib/admin";
import { MOMO_COUNTRIES, countryFlagUrl, findMomoOption, momoAmount } from "@/lib/momo";
import { formatFcfa } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/retraits")({
  head: () => ({
    meta: [
      { title: "Retraits mobile money — Admin DUKAIO" },
      {
        name: "description",
        content:
          "Retirez les recettes des abonnements DUKAIO vers un numéro mobile money et suivez chaque virement.",
      },
      { property: "og:title", content: "Retraits — Admin DUKAIO" },
      { property: "og:description", content: "Solde disponible et historique des retraits DUKAIO." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPayouts,
});

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  processing: "En cours",
  completed: "Versé",
  failed: "Échoué",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-sky-50 text-sky-700 border-sky-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
};

function Badge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        STATUS_STYLE[status] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function AdminPayouts() {
  const summary = useAdminPayoutSummary();
  const list = useAdminPayouts();
  const create = useCreatePayout();
  const refresh = useRefreshPayout();

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState("MTN_MOMO_BEN");
  const [phone, setPhone] = useState("");
  const [recipient, setRecipient] = useState("");
  const [note, setNote] = useState("");

  const available = summary.data?.available ?? 0;
  const option = findMomoOption(provider);
  const local = useMemo(() => {
    const value = Number(amount);
    if (!option || !Number.isFinite(value) || value <= 0) return null;
    return `${momoAmount(option, value)} ${option.currency}`;
  }, [amount, option]);

  async function submit() {
    const value = Math.round(Number(amount));
    if (!Number.isFinite(value) || value < 500) {
      toast.error("Montant minimum : 500 FCFA.");
      return;
    }
    try {
      const result = await create.mutateAsync({
        amount: value,
        provider,
        phone,
        recipientName: recipient,
        note,
      });
      toast.success(
        result.status === "completed"
          ? "Retrait versé sur le numéro indiqué."
          : "Retrait envoyé : l'opérateur traite le virement.",
      );
      setOpen(false);
      setAmount("");
      setPhone("");
      setRecipient("");
      setNote("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Retrait impossible.");
    }
  }

  const rows = list.data ?? [];

  return (
    <AdminShell
      title="Retraits"
      subtitle="Sortez l'argent des abonnements vers votre mobile money"
      actions={
        <Button onClick={() => setOpen(true)} disabled={available < 500}>
          <Banknote className="mr-2 h-4 w-4" />
          Nouveau retrait
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Disponible à retirer"
          value={`${formatFcfa(available)} F`}
          hint={`${summary.data?.payments ?? 0} paiements encaissés`}
          icon={Wallet}
        />
        <StatCard
          label="Encaissé ce mois"
          value={`${formatFcfa(summary.data?.collectedMonth ?? 0)} F`}
        />
        <StatCard label="Déjà retiré" value={`${formatFcfa(summary.data?.withdrawn ?? 0)} F`} />
        <StatCard
          label="Retraits en cours"
          value={`${formatFcfa(summary.data?.pending ?? 0)} F`}
        />
      </div>

      {summary.data?.wallets && summary.data.wallets.length > 0 && (
        <Panel title="Soldes réels chez le prestataire">
          <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {summary.data.wallets.map((w, i) => (
              <div
                key={`${w.currency}-${w.provider}-${i}`}
                className="flex items-center justify-between rounded-[10px] border border-border px-3 py-2"
              >
                <span className="text-xs text-muted-foreground">
                  {w.provider || w.country || w.currency}
                </span>
                <span className="text-sm font-bold">
                  {w.amount.toLocaleString("fr-FR")} {w.currency}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel
        title="Historique des retraits"
        action={
          <Button variant="outline" size="sm" onClick={() => void list.refetch()}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Actualiser
          </Button>
        }
      >
        {list.isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            Aucun retrait pour le moment. Le solde disponible correspond aux abonnements payés.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/50 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Date</th>
                  <th className="px-4 py-2 text-left font-semibold">Bénéficiaire</th>
                  <th className="px-4 py-2 text-left font-semibold">Opérateur</th>
                  <th className="px-4 py-2 text-right font-semibold">Montant</th>
                  <th className="px-4 py-2 text-left font-semibold">Statut</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const op = findMomoOption(row.provider);
                  return (
                    <tr key={row.id} className="border-t border-border">
                      <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">
                        {new Date(row.created_at).toLocaleString("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-2">
                        <p className="font-semibold">{row.recipient_name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{row.phone}</p>
                      </td>
                      <td className="px-4 py-2">
                        <span className="flex items-center gap-2">
                          {op && (
                            <img
                              src={countryFlagUrl(op.country)}
                              alt={op.country}
                              className="h-3.5 w-5 rounded-[2px] object-cover"
                              loading="lazy"
                            />
                          )}
                          <span className="text-xs">{op?.operator ?? row.provider}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right font-bold">
                        {formatFcfa(Number(row.amount))} F
                      </td>
                      <td className="px-4 py-2">
                        <Badge status={row.status} />
                        {row.failure_reason && (
                          <p className="mt-1 max-w-[220px] text-[11px] text-rose-600">
                            {row.failure_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {(row.status === "pending" || row.status === "processing") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void refresh.mutateAsync(row.id)}
                          >
                            Vérifier
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau retrait</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Montant en FCFA (max {formatFcfa(available)} F)
              </label>
              <Input
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="50000"
              />
              {local && (
                <p className="mt-1 text-xs text-muted-foreground">Sera envoyé : {local}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Opérateur</label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {MOMO_COUNTRIES.map((group) => (
                    <SelectGroup key={group.country}>
                      <SelectLabel className="flex items-center gap-2">
                        <img
                          src={countryFlagUrl(group.country)}
                          alt=""
                          className="h-3 w-4 rounded-[2px] object-cover"
                        />
                        {group.country}
                      </SelectLabel>
                      {group.options.map((o) => (
                        <SelectItem key={o.key} value={o.key}>
                          {o.operator} · {o.currency}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Numéro du bénéficiaire
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01 96 00 00 00"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Nom du bénéficiaire (facultatif)
              </label>
              <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Note interne (facultatif)
              </label>
              <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => void submit()} disabled={create.isPending}>
              {create.isPending ? "Envoi…" : "Envoyer le retrait"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
