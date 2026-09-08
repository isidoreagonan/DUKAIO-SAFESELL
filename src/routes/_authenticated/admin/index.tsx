import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, ClipboardList, Store, Users, Wallet } from "lucide-react";
import { AdminShell, Panel, StatCard } from "@/components/admin/shell";
import { useAdminOverview } from "@/lib/admin";
import { formatFcfa } from "@/lib/store";
import { statusMeta } from "@/lib/order-status";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Console admin DUKAIO — pilotage de la plateforme" },
      {
        name: "description",
        content:
          "Vue d'ensemble de la plateforme DUKAIO : boutiques, commandes, revenus et trafic en temps réel.",
      },
      { property: "og:title", content: "Console admin DUKAIO" },
      { property: "og:description", content: "Pilotage global des boutiques et des commandes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminHome,
});

function Chart({
  data,
  color,
  label,
}: {
  data: { d: string; v: number }[];
  color: string;
  label: string;
}) {
  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={`g-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="d" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" width={54} />
          <Tooltip
            formatter={(value: number) => [formatFcfa(value), label]}
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#g-${label})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function AdminHome() {
  const { data, isLoading, error } = useAdminOverview();

  return (
    <AdminShell title="Vue d'ensemble" subtitle="30 derniers jours — toutes les boutiques">
      {error ? (
        <p className="rounded-[8px] border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Chargement impossible."}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Volume d'affaires"
          value={data ? `${formatFcfa(data.gmv)} F` : "—"}
          hint={data ? `${formatFcfa(data.deliveredTotal)} F livrés` : undefined}
          icon={Wallet}
        />
        <StatCard
          label="Commandes"
          value={data ? String(data.orders) : "—"}
          hint={data ? `${data.deliveredCount} livrées · ${data.deliveryRate.toFixed(0)}%` : undefined}
          icon={ClipboardList}
        />
        <StatCard
          label="Boutiques"
          value={data ? String(data.stores) : "—"}
          hint={data ? `${data.published} en ligne · ${data.suspended} suspendues` : undefined}
          icon={Store}
        />
        <StatCard
          label="Comptes"
          value={data ? String(data.users) : "—"}
          hint={data ? `${data.customers} clients finaux` : undefined}
          icon={Users}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Revenus de la plateforme">
          {data ? <Chart data={data.series} color="var(--color-primary)" label="Revenus" /> : null}
        </Panel>
        <Panel title="Visiteurs des boutiques">
          {data ? (
            <Chart data={data.visitSeries} color="var(--color-accent-foreground)" label="Visites" />
          ) : null}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Top boutiques"
          action={
            <Link to="/admin/boutiques" className="text-xs font-semibold text-primary">
              Tout voir
            </Link>
          }
        >
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : data?.topStores.length ? (
            <ul className="divide-y divide-border">
              {data.topStores.map((s, i) => (
                <li key={s.id} className="flex items-center gap-3 py-2.5">
                  <span className="grid size-7 place-items-center rounded-[6px] bg-muted text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{s.orders} cmd</span>
                  <span className="shrink-0 text-sm font-semibold">{formatFcfa(s.total)} F</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune vente pour le moment.</p>
          )}
        </Panel>

        <Panel
          title="Dernières commandes"
          action={
            <Link to="/admin/commandes" className="text-xs font-semibold text-primary">
              Tout voir
            </Link>
          }
        >
          {data?.recent.length ? (
            <ul className="divide-y divide-border">
              {data.recent.map((o) => {
                const meta = statusMeta(o.status);
                return (
                  <li key={o.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{o.order_number}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {o.store_name ?? "Boutique"} · {o.customer_name ?? "Client"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-[4px] px-2 py-0.5 text-[11px] font-semibold",
                        meta.className,
                      )}
                    >
                      {meta.label}
                    </span>
                    <span className="shrink-0 text-sm font-semibold">
                      {formatFcfa(Number(o.amount))} F
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune commande.</p>
          )}
        </Panel>
      </div>

      <Panel title="Activité">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Visites (30 j)"
            value={data ? String(data.visits) : "—"}
            icon={Activity}
          />
          <StatCard label="Produits" value={data ? String(data.products) : "—"} />
          <StatCard
            label="Panier moyen"
            value={data ? `${formatFcfa(data.averageOrder)} F` : "—"}
          />
        </div>
      </Panel>
    </AdminShell>
  );
}
