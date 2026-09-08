import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  Globe2,
  Laptop,
  Link2,
  Package,
  ShoppingBag,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { useAnalytics, growth, type Range } from "@/lib/analytics";
import { formatFcfa } from "@/lib/store";
import { statusMeta } from "@/lib/order-status";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/analyses")({
  head: () => ({
    meta: [
      { title: "Analyses de votre boutique | DUKAIO" },
      {
        name: "description",
        content:
          "Suivez l'évolution réelle de vos ventes DUKAIO : revenus, visites, taux de conversion, pays et navigateurs de vos clients.",
      },
      { property: "og:title", content: "Analyses de votre boutique | DUKAIO" },
      {
        property: "og:description",
        content: "Revenus, visites, conversion, pays et appareils de vos visiteurs en temps réel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalysesPage,
});

const RANGES: { value: Range; label: string }[] = [
  { value: 7, label: "7 jours" },
  { value: 30, label: "30 jours" },
  { value: 90, label: "90 jours" },
];

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-[6px] border border-border bg-background p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        up ? "text-primary" : "text-destructive",
      )}
    >
      {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {Math.abs(value).toFixed(0)}%
    </span>
  );
}

function Ranking({
  title,
  icon: Icon,
  rows,
  empty,
}: {
  title: string;
  icon: typeof Globe2;
  rows: { name: string; visits: number }[];
  empty: string;
}) {
  const total = rows.reduce((acc, r) => acc + r.visits, 0);
  return (
    <Panel>
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-[6px] bg-accent text-accent-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((r) => {
            const pct = total ? Math.round((r.visits / total) * 100) : 0;
            return (
              <li key={r.name}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{r.name}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {r.visits} · {pct}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-[4px] bg-muted">
                  <div
                    className="h-full rounded-[4px] bg-[image:var(--gradient-brand)]"
                    style={{ width: `${Math.max(pct, 3)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function AnalysesPage() {
  const [range, setRange] = useState<Range>(30);
  const { data, isLoading } = useAnalytics(range);

  const kpis = [
    {
      label: "Revenu encaissé",
      value: formatFcfa(data?.revenue ?? 0),
      unit: "FCFA",
      icon: Wallet,
      delta: growth(data?.revenue ?? 0, data?.revenuePrev ?? 0),
    },
    {
      label: "Commandes",
      value: String(data?.ordersCount ?? 0),
      unit: "",
      icon: ShoppingBag,
      delta: growth(data?.ordersCount ?? 0, data?.ordersPrev ?? 0),
    },
    {
      label: "Visites boutique",
      value: String(data?.visits ?? 0),
      unit: "",
      icon: Eye,
      delta: growth(data?.visits ?? 0, data?.visitsPrev ?? 0),
    },
    {
      label: "Taux de conversion",
      value: `${(data?.conversionRate ?? 0).toFixed(1)}`,
      unit: "%",
      icon: Target,
      delta: 0,
    },
  ];

  return (
    <DashboardShell>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Analyses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Données réelles de votre boutique — ventes, visiteurs et conversion.
          </p>
        </div>
        <div className="inline-flex rounded-[6px] border border-border bg-background p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={cn(
                "rounded-[6px] px-3 py-1.5 text-sm font-semibold transition-colors",
                range === r.value
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Panel key={k.label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] bg-accent text-accent-foreground">
                <k.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 flex items-baseline gap-1.5 text-3xl font-extrabold tracking-tight">
              {isLoading ? "—" : k.value}
              {k.unit && (
                <span className="text-base font-semibold text-muted-foreground">{k.unit}</span>
              )}
            </p>
            <p className="mt-2 flex items-center gap-2">
              <Delta value={k.delta} />
              <span className="text-xs text-muted-foreground">vs période précédente</span>
            </p>
          </Panel>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel>
          <h2 className="text-sm font-bold">Évolution du chiffre d'affaires</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.series ?? []}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={48} />
                <Tooltip
                  formatter={(v: number) => [`${formatFcfa(v)} FCFA`, "Revenu"]}
                  contentStyle={{ borderRadius: 12, borderColor: "var(--color-border)" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  fill="url(#rev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <h2 className="text-sm font-bold">Visites par jour</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.series ?? []}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={32} />
                <Tooltip
                  formatter={(v: number) => [String(v), "Visites"]}
                  contentStyle={{ borderRadius: 12, borderColor: "var(--color-border)" }}
                />
                <Bar dataKey="visits" radius={[6, 6, 0, 0]} fill="var(--color-primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Panel className="p-5">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-[6px] bg-accent text-accent-foreground">
              <Users className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-bold">Clients</h2>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight">{data?.customers ?? 0}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            dont {data?.newCustomers ?? 0} nouveaux sur la période
          </p>
          <p className="mt-4 text-sm font-semibold">
            Panier moyen : {formatFcfa(data?.averageOrder ?? 0)} FCFA
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {data?.uniqueVisitors ?? 0} visiteurs uniques
          </p>
        </Panel>

        <Ranking
          title="Pays de conversion"
          icon={Globe2}
          rows={data?.countries.map((c) => ({ name: c.name, visits: c.visits })) ?? []}
          empty="Aucune visite enregistrée pour l'instant. Publiez votre boutique pour collecter les données."
        />
        <Ranking
          title="Navigateurs"
          icon={Laptop}
          rows={data?.browsers ?? []}
          empty="Les navigateurs de vos visiteurs apparaîtront ici."
        />
        <Ranking
          title="Sources de trafic"
          icon={Link2}
          rows={data?.referrers ?? []}
          empty="Aucune source de trafic pour l'instant."
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-[6px] bg-accent text-accent-foreground">
              <Package className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-bold">Meilleurs produits</h2>
          </div>
          {(data?.topProducts.length ?? 0) === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Aucune vente sur la période sélectionnée.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {data?.topProducts.map((p) => (
                <li key={p.name} className="flex items-center justify-between gap-3 py-3">
                  <span className="truncate text-sm font-medium">{p.name}</span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {p.sales} vente(s) · {formatFcfa(p.total)} FCFA
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <h2 className="text-sm font-bold">Répartition des commandes</h2>
          {(data?.statuses.length ?? 0) === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Aucune commande sur la période.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data?.statuses.map((s) => {
                const meta = statusMeta(s.name as Parameters<typeof statusMeta>[0]);
                const total = data.ordersCount || 1;
                const pct = Math.round((s.count / total) * 100);
                return (
                  <li key={s.name}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium">{meta?.label ?? s.name}</span>
                      <span className="text-muted-foreground">
                        {s.count} · {pct}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-[4px] bg-muted">
                      <div
                        className="h-full rounded-[4px] bg-[image:var(--gradient-brand)]"
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-4">
        <Ranking
          title="Appareils utilisés"
          icon={Laptop}
          rows={data?.devices ?? []}
          empty="Les appareils de vos visiteurs apparaîtront ici dès les premières visites."
        />
      </div>
    </DashboardShell>
  );
}
