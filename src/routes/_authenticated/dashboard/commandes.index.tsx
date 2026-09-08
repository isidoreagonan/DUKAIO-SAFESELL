import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Download, ChevronDown, CalendarDays, MoreVertical, ShoppingCart } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { OrderDialog } from "@/components/dashboard/order-dialog";
import { cn } from "@/lib/utils";
import { useOrders, useOrderItemCounts, formatFcfa, type Order } from "@/lib/store";
import { ORDER_STATUSES, statusMeta, type OrderStatus } from "@/lib/order-status";

export const Route = createFileRoute("/_authenticated/dashboard/commandes/")({
  head: () => ({
    meta: [
      { title: "Commandes | DUKAIO" },
      {
        name: "description",
        content:
          "Gérez vos commandes DUKAIO : confirmer, programmer, mettre en livraison, marquer livrée et contacter l'acheteur.",
      },
      { property: "og:title", content: "Commandes | DUKAIO" },
      {
        property: "og:description",
        content: "Confirmez, suivez et livrez vos commandes depuis un seul écran.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommandesPage,
});

const DATE_FILTERS = [
  { value: "all", label: "Toutes les dates" },
  { value: "today", label: "Aujourd'hui" },
  { value: "7", label: "7 derniers jours" },
  { value: "30", label: "30 derniers jours" },
] as const;

function dayLabel(value: string) {
  const d = new Date(value);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Aujourd'hui";
  if (same(d, yesterday)) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function Select({
  value,
  onChange,
  options,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}) {
  return (
    <label className="relative inline-flex min-w-0 items-center">
      {icon ? (
        <span className="pointer-events-none absolute left-3 text-muted-foreground">{icon}</span>
      ) : null}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 w-full min-w-0 cursor-pointer appearance-none rounded-[6px] border border-border bg-background pr-8 text-sm font-medium outline-none focus:border-primary/50",
          icon ? "pl-9" : "pl-3",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-muted-foreground" />
    </label>
  );
}

function CommandesPage() {
  const { data: commandes = [], isLoading } = useOrders();
  const { data: counts = {} } = useOrderItemCounts();
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [city, setCity] = useState("all");
  const [period, setPeriod] = useState<string>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);

  const cities = useMemo(
    () => [...new Set(commandes.map((o) => o.shipping_city).filter(Boolean) as string[])].sort(),
    [commandes],
  );

  const rows = useMemo(() => {
    const from =
      period === "all"
        ? 0
        : period === "today"
          ? new Date(new Date().setHours(0, 0, 0, 0)).getTime()
          : Date.now() - Number(period) * 86400000;
    return commandes.filter(
      (o) =>
        (status === "all" || o.status === status) &&
        (city === "all" || o.shipping_city === city) &&
        new Date(o.created_at).getTime() >= from &&
        (q.trim() === "" ||
          `${o.order_number} ${o.customer_name ?? ""} ${o.customer_phone ?? ""} ${o.shipping_city ?? ""}`
            .toLowerCase()
            .includes(q.toLowerCase())),
    );
  }, [commandes, status, city, period, q]);

  const groups = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const o of rows) {
      const key = String(o.created_at).slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), o]);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [rows]);

  const current = selected ? (commandes.find((o) => o.id === selected.id) ?? null) : null;

  function exportCsv() {
    const csv = [
      "commande;client;telephone;ville;date;statut;montant",
      ...rows.map((o) =>
        [
          o.order_number,
          o.customer_name ?? "",
          o.customer_phone ?? "",
          o.shipping_city ?? "",
          new Date(o.created_at).toLocaleDateString("fr-FR"),
          statusMeta(o.status).label,
          o.amount,
        ].join(";"),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "commandes-dukaio.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardShell>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
            Commandes{" "}
            <span className="font-display not-italic text-muted-foreground">
              · {commandes.length}
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirmez, programmez et livrez chaque commande.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/dashboard/commandes/paniers"
            className="btn-3d inline-flex items-center gap-2 rounded-[6px] border border-border px-3.5 py-2.5 text-sm font-semibold"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Paniers abandonnés</span>
            <span className="sm:hidden">Paniers</span>
          </Link>
          <button
            onClick={exportCsv}
            className="btn-3d inline-flex items-center gap-2 rounded-[6px] border border-border px-3.5 py-2.5 text-sm font-semibold"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exporter</span>
          </button>
        </div>
      </header>

      <label className="relative mt-5 block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un client, un numéro, un téléphone…"
          className="h-11 w-full rounded-[6px] border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary/50"
        />
      </label>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:max-w-2xl">
        <Select
          value={status}
          onChange={(v) => setStatus(v as "all" | OrderStatus)}
          options={[
            { value: "all", label: "Tous les statuts" },
            ...ORDER_STATUSES.map((s) => ({ value: s.value, label: s.label })),
          ]}
        />
        <Select
          value={city}
          onChange={setCity}
          options={[
            { value: "all", label: "Toutes les villes" },
            ...cities.map((c) => ({ value: c, label: c })),
          ]}
        />
        <Select
          value={period}
          onChange={setPeriod}
          options={DATE_FILTERS.map((d) => ({ value: d.value, label: d.label }))}
          icon={<CalendarDays className="h-4 w-4" />}
        />
      </div>

      {rows.length === 0 ? (
        <section className="mt-6 rounded-[8px] border border-dashed border-border bg-background p-12 text-center">
          <p className="text-sm font-semibold">
            {isLoading
              ? "Chargement de vos commandes…"
              : commandes.length === 0
                ? "Aucune commande pour le moment."
                : "Aucune commande ne correspond à ces filtres."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {commandes.length === 0
              ? "Vos ventes apparaîtront ici dès la première commande passée en boutique."
              : "Essayez un autre statut, une autre ville ou une autre période."}
          </p>
        </section>
      ) : null}

      <div className="mt-6 space-y-6">
        {groups.map(([day, list]) => (
          <section key={day}>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {dayLabel(day)}
            </p>
            <ul className="mt-2.5 space-y-2.5">
              {list.map((o) => {
                const meta = statusMeta(o.status);
                const articles = counts[o.id] ?? 1;
                return (
                  <li key={o.id}>
                    <button
                      onClick={() => setSelected(o)}
                      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-[8px] border border-border bg-background p-4 text-left transition-colors hover:border-primary/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold uppercase">
                          {o.customer_name ?? "Client"}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
                          <div>
                            <p className="text-[11px] text-muted-foreground">Montant</p>
                            <p className="text-sm font-bold text-accent-foreground">
                              {formatFcfa(Number(o.amount))} FCFA
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground">Articles</p>
                            <p className="text-sm font-bold">
                              {articles} article{articles > 1 ? "s" : ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground">Heure</p>
                            <p className="text-sm font-bold">
                              {new Date(o.created_at).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 truncate text-xs text-muted-foreground">
                          {o.order_number} ·{" "}
                          {new Date(o.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                          {o.shipping_city ? ` · ${o.shipping_city}` : ""}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            "rounded-[6px] px-2.5 py-1 text-[11px] font-semibold",
                            meta.className,
                          )}
                        >
                          {meta.label}
                        </span>
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <OrderDialog order={current} onOpenChange={(open) => !open && setSelected(null)} />
    </DashboardShell>
  );
}
