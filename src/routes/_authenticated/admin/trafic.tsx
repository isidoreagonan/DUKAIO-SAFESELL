import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { AdminShell, Panel, StatCard } from "@/components/admin/shell";
import { useAdminTraffic } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/trafic")({
  head: () => ({
    meta: [
      { title: "Trafic global — Admin DUKAIO" },
      {
        name: "description",
        content:
          "Origines du trafic des boutiques DUKAIO : pays, appareils, navigateurs et sources de visite.",
      },
      { property: "og:title", content: "Trafic — Admin DUKAIO" },
      { property: "og:description", content: "Analyse du trafic de toutes les boutiques." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminTraffic,
});

function Bars({ rows, total }: { rows: { label: string; count: number }[]; total: number }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Aucune donnée.</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="min-w-0 truncate font-medium">{r.label}</span>
            <span className="shrink-0 text-muted-foreground">
              {r.count} · {total ? Math.round((r.count / total) * 100) : 0}%
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${total ? (r.count / total) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function AdminTraffic() {
  const { data, isLoading } = useAdminTraffic();
  const total = data?.total ?? 0;

  return (
    <AdminShell title="Trafic" subtitle="30 derniers jours — toutes les boutiques">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Visites" value={String(total)} icon={Activity} />
        <StatCard label="Pays distincts" value={String(data?.countries.length ?? 0)} />
        <StatCard label="Sources" value={String(data?.referrers.length ?? 0)} />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Pays">
            <Bars rows={data?.countries ?? []} total={total} />
          </Panel>
          <Panel title="Appareils">
            <Bars rows={data?.devices ?? []} total={total} />
          </Panel>
          <Panel title="Navigateurs">
            <Bars rows={data?.browsers ?? []} total={total} />
          </Panel>
          <Panel title="Sources de trafic">
            <Bars rows={data?.referrers ?? []} total={total} />
          </Panel>
        </div>
      )}
    </AdminShell>
  );
}
