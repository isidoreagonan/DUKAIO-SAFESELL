import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Search } from "lucide-react";
import { AdminShell, Panel, StatCard } from "@/components/admin/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminOrders } from "@/lib/admin";
import { formatFcfa } from "@/lib/store";
import { ORDER_STATUSES, statusMeta } from "@/lib/order-status";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/commandes")({
  head: () => ({
    meta: [
      { title: "Commandes de la plateforme — Admin DUKAIO" },
      {
        name: "description",
        content:
          "Toutes les commandes DUKAIO : boutique, acheteur, montant, statut et export CSV.",
      },
      { property: "og:title", content: "Commandes — Admin DUKAIO" },
      { property: "og:description", content: "Suivi global des commandes de la plateforme." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminOrders,
});

function AdminOrders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const { data, isLoading } = useAdminOrders({ search, status });
  const rows = data ?? [];
  const total = rows.reduce((s, o) => s + Number(o.amount), 0);

  function exportCsv() {
    const head = ["Numéro", "Date", "Boutique", "Client", "Téléphone", "Ville", "Montant", "Statut"];
    const lines = rows.map((o) =>
      [
        o.order_number,
        new Date(o.created_at).toLocaleString("fr-FR"),
        o.store_name ?? "",
        o.customer_name ?? "",
        o.customer_phone ?? "",
        o.shipping_city ?? "",
        String(o.amount),
        statusMeta(o.status).label,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(";"),
    );
    const blob = new Blob([[head.join(";"), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dukaio-commandes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell
      title="Commandes"
      subtitle="Toutes boutiques confondues"
      actions={
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="mr-1 size-4" /> CSV
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Commandes affichées" value={String(rows.length)} />
        <StatCard label="Montant cumulé" value={`${formatFcfa(total)} F`} />
        <StatCard
          label="Panier moyen"
          value={rows.length ? `${formatFcfa(total / rows.length)} F` : "—"}
        />
      </div>

      <Panel title="Journal des commandes">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Numéro, nom, téléphone, e-mail…"
              className="h-9 pl-8"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setStatus("all")}
              className={cn(
                "rounded-[6px] border px-2.5 py-1.5 text-xs font-semibold",
                status === "all" ? "border-primary bg-primary/10 text-primary" : "border-border",
              )}
            >
              Tous
            </button>
            {ORDER_STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={cn(
                  "rounded-[6px] border px-2.5 py-1.5 text-xs font-semibold",
                  status === s.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune commande pour ces filtres.</p>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Commande</th>
                  <th className="py-2 pr-3 font-semibold">Boutique</th>
                  <th className="py-2 pr-3 font-semibold">Acheteur</th>
                  <th className="py-2 pr-3 font-semibold">Livraison</th>
                  <th className="py-2 pr-3 text-right font-semibold">Montant</th>
                  <th className="py-2 text-right font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((o) => {
                  const meta = statusMeta(o.status);
                  return (
                    <tr key={o.id}>
                      <td className="py-3 pr-3">
                        <p className="font-semibold">{o.order_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.created_at).toLocaleString("fr-FR")}
                        </p>
                      </td>
                      <td className="py-3 pr-3 text-xs">{o.store_name ?? "—"}</td>
                      <td className="py-3 pr-3">
                        <p className="text-xs font-medium">{o.customer_name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{o.customer_phone ?? "—"}</p>
                      </td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground">
                        {o.shipping_city ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-right font-semibold">
                        {formatFcfa(Number(o.amount))} F
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={cn(
                            "rounded-[4px] px-2 py-0.5 text-[11px] font-semibold",
                            meta.className,
                          )}
                        >
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
