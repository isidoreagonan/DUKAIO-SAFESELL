import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Eye,
  Package,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Truck,
  TrendingUp,
  Users,
  Wallet,
  ExternalLink,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { OrderDialog } from "@/components/dashboard/order-dialog";
import { cn } from "@/lib/utils";
import { useDashboardStats, useStore, formatFcfa, type Order } from "@/lib/store";
import { statusMeta } from "@/lib/order-status";
import { useAuth, displayName } from "@/hooks/use-auth";
import { storeUrl } from "@/lib/storefront";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord vendeur | DUKAIO" },
      {
        name: "description",
        content:
          "Pilotez vos ventes DUKAIO : revenus réels, taux de livraison, panier moyen, commandes à traiter et visiteurs de votre boutique.",
      },
      { property: "og:title", content: "Tableau de bord vendeur | DUKAIO" },
      {
        property: "og:description",
        content: "Revenus, livraisons, commandes et visiteurs de votre boutique DUKAIO en direct.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const RANGES = [
  { value: 7, label: "7 derniers jours", short: "7 j" },
  { value: 30, label: "30 derniers jours", short: "30 j" },
  { value: 90, label: "90 derniers jours", short: "90 j" },
] as const;

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-[8px] border border-border bg-background p-4 sm:p-5", className)}>
      {children}
    </section>
  );
}

function Rate({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Truck;
  tone: "good" | "bad";
}) {
  return (
    <div className="rounded-[6px] border border-border p-3.5">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <span
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-[6px]",
            tone === "good" ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", tone === "good" ? "bg-primary" : "bg-destructive")}
              style={{ width: `${Math.min(100, Math.round(value))}%` }}
            />
          </div>
        </div>
        <p className="shrink-0 text-sm font-bold">{Math.round(value)}%</p>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<number>(30);
  const { data, isLoading } = useDashboardStats(range);
  const { data: store } = useStore();
  const [selected, setSelected] = useState<Order | null>(null);
  const firstName = displayName(user).split(" ")[0] ?? "Vendeur";
  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? "";

  const kpis = [
    {
      label: "Revenus brut",
      value: `${formatFcfa(data?.revenue ?? 0)} FCFA`,
      hint: `${data?.ordersCount ?? 0} commandes`,
      icon: Wallet,
    },
    {
      label: "Revenus livrés",
      value: `${formatFcfa(data?.delivered ?? 0)} FCFA`,
      hint: `${data?.deliveredCount ?? 0} livrées`,
      icon: Truck,
    },
    {
      label: "Taux de livraison",
      value: `${Math.round(data?.deliveryRate ?? 0)}%`,
      hint: `${data?.lostCount ?? 0} perdues`,
      icon: CheckCircle2,
    },
    {
      label: "Panier moyen",
      value: `${formatFcfa(Math.round(data?.averageOrder ?? 0))} FCFA`,
      hint: `${data?.customers ?? 0} clients`,
      icon: ShoppingCart,
    },
  ];

  const orders = data?.recent ?? [];
  const todo = data?.todo ?? [];
  const topProducts = data?.topProducts ?? [];
  const maxTop = topProducts[0]?.total ?? 0;

  return (
    <DashboardShell>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
            Salut, <span className="font-display not-italic text-primary">{firstName}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Voici un aperçu réel de votre activité — {rangeLabel.toLowerCase()}.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-[6px] border border-border bg-background p-1">
            <CalendarDays className="ml-1.5 h-4 w-4 text-muted-foreground" />
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={cn(
                  "rounded-[4px] px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  range === r.value
                    ? "bg-brand-ink text-[color:var(--primary-foreground)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r.short}
              </button>
            ))}
          </div>
          {store?.subdomain ? (
            <a
              href={storeUrl(store.subdomain, store.custom_domain)}
              target="_blank"
              rel="noreferrer"
              className="btn-3d hidden items-center gap-2 rounded-[6px] border border-border px-3.5 py-2.5 text-sm font-semibold sm:inline-flex"
            >
              <ExternalLink className="h-4 w-4" /> Ma boutique
            </a>
          ) : null}
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Panel key={k.label}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] bg-accent text-accent-foreground">
                <k.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 truncate text-2xl font-extrabold tracking-tight sm:text-[26px]">
              {isLoading ? "…" : k.value}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">{k.hint}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-bold">Revenus</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{rangeLabel}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-[4px] bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
              <TrendingUp className="h-3.5 w-3.5" /> {formatFcfa(data?.revenue ?? 0)} F
            </span>
          </div>
          <div className="mt-5 h-[220px] w-full sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.series ?? []} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="d"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    color: "var(--card-foreground)",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v.toLocaleString("fr-FR")} FCFA`, "Revenu"]}
                  labelFormatter={(l) => `Jour ${l}`}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  fill="url(#rev)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-base font-bold">
                <Eye className="h-4 w-4 text-muted-foreground" /> Visiteurs
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {data?.visits ?? 0} visites sur la période
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-[4px] bg-surface-tint px-2.5 py-1 text-xs font-semibold text-primary">
              <Users className="h-3.5 w-3.5" /> {data?.customers ?? 0} clients
            </span>
          </div>
          <div className="mt-5 h-[220px] w-full sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data?.visitSeries ?? []}
                margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
              >
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="d"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={46}
                  allowDecimals={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    color: "var(--card-foreground)",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v}`, "Visiteurs"]}
                  labelFormatter={(l) => `Jour ${l}`}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel>
          <h2 className="flex items-center gap-2 text-base font-bold">
            <AlertCircle className="h-4 w-4 text-muted-foreground" /> À traiter
          </h2>
          {todo.length === 0 ? (
            <div className="mt-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">Aucune action requise</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {todo.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => setSelected(o)}
                    className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[6px] border border-border p-3 text-left hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{o.customer_name ?? "Client"}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {o.order_number} · {formatFcfa(Number(o.amount))} FCFA
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-[4px] px-2 py-1 text-[11px] font-semibold",
                        statusMeta(o.status).className,
                      )}
                    >
                      {statusMeta(o.status).label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="flex min-w-0 items-center gap-2 text-base font-bold">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" /> Dernières commandes
            </h2>
            <Link
              to="/dashboard/commandes"
              className="shrink-0 text-sm font-semibold text-primary hover:underline"
            >
              Tout voir
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="mt-6 rounded-[6px] border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {isLoading ? "Chargement…" : "Aucune commande pour le moment."}
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {orders.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => setSelected(o)}
                    className="w-full rounded-[6px] border border-border p-3 text-left hover:border-primary/40"
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <p className="truncate text-sm font-semibold text-primary">
                        {o.order_number}
                      </p>
                      <p className="shrink-0 text-sm font-bold">
                        {formatFcfa(Number(o.amount))} FCFA
                      </p>
                    </div>
                    <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <p className="truncate text-xs text-muted-foreground">
                        {o.customer_name ?? "Client"}
                        {o.shipping_city ? ` · ${o.shipping_city}` : ""}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 rounded-[4px] px-2 py-0.5 text-[11px] font-semibold",
                          statusMeta(o.status).className,
                        )}
                      >
                        {statusMeta(o.status).label}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <h2 className="flex items-center gap-2 text-base font-bold">
            <TrendingUp className="h-4 w-4 text-muted-foreground" /> Métriques paiement à la livraison
          </h2>
          <div className="mt-4 space-y-2.5">
            <Rate
              label="Confirmation"
              value={data?.confirmationRate ?? 0}
              icon={CheckCircle2}
              tone="good"
            />
            <Rate label="Livraison" value={data?.deliveryRate ?? 0} icon={Truck} tone="good" />
            <Rate label="Perte / retour" value={data?.returnRate ?? 0} icon={AlertCircle} tone="bad" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Calculé sur les {data?.ordersCount ?? 0} commandes de la période.
          </p>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="min-w-0 text-base font-bold">Top produits</h2>
            <Link
              to="/dashboard/produits"
              className="shrink-0 text-sm font-semibold text-primary hover:underline"
            >
              Tous les produits
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <p className="mt-6 rounded-[6px] border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Les ventes apparaîtront ici dès votre première commande.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {topProducts.map((p, i) => (
                <li
                  key={p.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[6px] border border-border p-3"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] bg-surface-tint text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2.5">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-9 w-9 shrink-0 rounded-[6px] object-cover"
                        />
                      ) : (
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] bg-muted text-muted-foreground">
                          <Package className="h-4 w-4" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          CA généré : {formatFcfa(p.total)} FCFA
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[image:var(--gradient-brand)]"
                        style={{ width: `${maxTop ? (p.total / maxTop) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 rounded-[4px] bg-surface-tint px-2 py-1 text-xs font-semibold text-primary">
                    {p.sales} vente{p.sales > 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <h2 className="text-base font-bold">Actions rapides</h2>
          <div className="mt-4 grid gap-2.5">
            <Link
              to="/dashboard/produits/nouveau"
              className="btn-3d inline-flex items-center justify-center gap-2 rounded-[6px] px-3.5 py-2.5 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" /> Créer un produit
            </Link>
            <Link
              to="/dashboard/commandes"
              className="btn-3d inline-flex items-center justify-center gap-2 rounded-[6px] border border-border px-3.5 py-2.5 text-sm font-semibold"
            >
              <ShoppingBag className="h-4 w-4" /> Commandes
            </Link>
            <Link
              to="/dashboard/clients"
              className="btn-3d inline-flex items-center justify-center gap-2 rounded-[6px] border border-border px-3.5 py-2.5 text-sm font-semibold"
            >
              <Users className="h-4 w-4" /> Clients
            </Link>
            {store?.subdomain ? (
              <a
                href={storeUrl(store.subdomain, store.custom_domain)}
                target="_blank"
                rel="noreferrer"
                className="btn-3d inline-flex items-center justify-center gap-2 rounded-[6px] border border-border px-3.5 py-2.5 text-sm font-semibold"
              >
                <ExternalLink className="h-4 w-4" /> Voir ma boutique
              </a>
            ) : null}
          </div>
        </Panel>
      </div>

      <OrderDialog order={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </DashboardShell>
  );
}
