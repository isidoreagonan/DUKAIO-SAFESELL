import { createFileRoute } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { AdminShell, Panel, StatCard } from "@/components/admin/shell";
import { useAdminAudit } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/journal")({
  head: () => ({
    meta: [
      { title: "Journal d'audit — Admin DUKAIO" },
      {
        name: "description",
        content:
          "Historique complet des actions administrateur sur DUKAIO : suspensions, abonnements, modération et vérifications.",
      },
      { property: "og:title", content: "Journal d'audit — Admin DUKAIO" },
      { property: "og:description", content: "Traçabilité des actions administrateur." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminJournal,
});

const ACTION_LABEL: Record<string, string> = {
  "store.suspend": "Boutique suspendue",
  "store.unsuspend": "Boutique réactivée",
  "subscription.update": "Abonnement modifié",
  "order.verify": "Commande vérifiée",
  "admin.add": "Administrateur ajouté",
  "admin.remove": "Administrateur retiré",
  "product.delete": "Produit supprimé",
};

function AdminJournal() {
  const { data, isLoading } = useAdminAudit();
  const rows = data ?? [];

  return (
    <AdminShell title="Journal d'audit" subtitle="200 dernières actions administrateur">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Actions enregistrées" value={String(rows.length)} icon={ScrollText} />
        <StatCard
          label="Administrateurs actifs"
          value={String(new Set(rows.map((r) => r.actor_email ?? r.actor_id)).size)}
        />
        <StatCard
          label="Dernière action"
          value={rows[0] ? new Date(rows[0].created_at).toLocaleString("fr-FR") : "—"}
        />
      </div>

      <Panel title="Historique">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune action pour le moment.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{ACTION_LABEL[r.action] ?? r.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.actor_email ?? r.actor_id}
                    {r.target_type ? ` · ${r.target_type}` : ""}
                    {r.target_id ? ` ${r.target_id.slice(0, 8)}` : ""}
                  </p>
                  {r.details ? (
                    <pre className="mt-1 max-w-full overflow-x-auto rounded-[6px] bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                      {JSON.stringify(r.details)}
                    </pre>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("fr-FR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AdminShell>
  );
}
