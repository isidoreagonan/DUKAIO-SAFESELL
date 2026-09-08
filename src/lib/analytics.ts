import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Range = 7 | 30 | 90;

export type AnalyticsData = {
  revenue: number;
  revenuePrev: number;
  ordersCount: number;
  ordersPrev: number;
  visits: number;
  visitsPrev: number;
  uniqueVisitors: number;
  customers: number;
  newCustomers: number;
  conversionRate: number;
  averageOrder: number;
  series: { label: string; revenue: number; orders: number; visits: number }[];
  countries: { name: string; visits: number; orders: number }[];
  browsers: { name: string; visits: number }[];
  devices: { name: string; visits: number }[];
  referrers: { name: string; visits: number }[];
  statuses: { name: string; count: number }[];
  topProducts: { name: string; sales: number; total: number }[];
};

const COUNTRY_NAMES: Record<string, string> = {
  BJ: "Bénin",
  BF: "Burkina Faso",
  CI: "Côte d'Ivoire",
  SN: "Sénégal",
  TG: "Togo",
  ML: "Mali",
  NE: "Niger",
  CM: "Cameroun",
  GA: "Gabon",
  CG: "Congo",
  CD: "RD Congo",
  RW: "Rwanda",
  KE: "Kenya",
  UG: "Ouganda",
  FR: "France",
  BE: "Belgique",
  CA: "Canada",
  US: "États-Unis",
};

export function countryLabel(code: string | null | undefined) {
  if (!code) return "Inconnu";
  return COUNTRY_NAMES[code.toUpperCase()] ?? code.toUpperCase();
}

function tally<T>(rows: T[], key: (row: T) => string) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const k = key(row) || "Inconnu";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, visits]) => ({ name, visits }))
    .sort((a, b) => b.visits - a.visits);
}

function dayKey(value: string) {
  return String(value).slice(0, 10);
}

/** Statistiques réelles de la boutique (ventes, visites, pays, navigateurs). */
export function useAnalytics(range: Range) {
  return useQuery({
    queryKey: ["analytics", range],
    queryFn: async (): Promise<AnalyticsData> => {
      const now = Date.now();
      const start = new Date(now - (range - 1) * 86400000);
      start.setHours(0, 0, 0, 0);
      const prevStart = new Date(start.getTime() - range * 86400000);

      const [ordersRes, visitsRes, customersRes, productsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .gte("created_at", prevStart.toISOString())
          .order("created_at", { ascending: false }),
        supabase
          .from("store_visits")
          .select("*")
          .gte("created_at", prevStart.toISOString()),
        supabase.from("customers").select("id, created_at, country"),
        supabase.from("products").select("id, name"),
      ]);
      if (ordersRes.error) throw ordersRes.error;
      if (visitsRes.error) throw visitsRes.error;
      if (customersRes.error) throw customersRes.error;
      if (productsRes.error) throw productsRes.error;

      const startIso = start.toISOString();
      const allOrders = (ordersRes.data ?? []) as Tables<"orders">[];
      const allVisits = (visitsRes.data ?? []) as Tables<"store_visits">[];
      const orders = allOrders.filter((o) => o.created_at >= startIso);
      const ordersPrevList = allOrders.filter((o) => o.created_at < startIso);
      const visits = allVisits.filter((v) => v.created_at >= startIso);
      const visitsPrevList = allVisits.filter((v) => v.created_at < startIso);

      const paidOf = (list: Tables<"orders">[]) =>
        list.filter((o) => o.status === "completed" || o.status === "processing");
      const sum = (list: Tables<"orders">[]) =>
        list.reduce((acc, o) => acc + Number(o.amount), 0);

      const paid = paidOf(orders);
      const revenue = sum(paid);
      const revenuePrev = sum(paidOf(ordersPrevList));

      const buckets = new Map<string, { revenue: number; orders: number; visits: number }>();
      for (let i = 0; i < range; i += 1) {
        const day = new Date(start.getTime() + i * 86400000);
        buckets.set(day.toISOString().slice(0, 10), { revenue: 0, orders: 0, visits: 0 });
      }
      for (const o of orders) {
        const b = buckets.get(dayKey(o.created_at));
        if (!b) continue;
        b.orders += 1;
        if (o.status === "completed" || o.status === "processing") b.revenue += Number(o.amount);
      }
      for (const v of visits) {
        const b = buckets.get(dayKey(v.created_at));
        if (b) b.visits += 1;
      }
      const series = [...buckets.entries()].map(([key, v]) => ({
        label: `${key.slice(8, 10)}/${key.slice(5, 7)}`,
        ...v,
      }));

      const visitCountries = new Map<string, { visits: number; orders: number }>();
      for (const v of visits) {
        const name = countryLabel(v.country);
        const entry = visitCountries.get(name) ?? { visits: 0, orders: 0 };
        entry.visits += 1;
        visitCountries.set(name, entry);
      }
      const countries = [...visitCountries.entries()]
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 8);

      const productNames = new Map((productsRes.data ?? []).map((p) => [p.id, p.name]));
      const productTally = new Map<string, { sales: number; total: number }>();
      for (const o of orders) {
        if (!o.product_id) continue;
        const entry = productTally.get(o.product_id) ?? { sales: 0, total: 0 };
        entry.sales += 1;
        entry.total += Number(o.amount);
        productTally.set(o.product_id, entry);
      }

      const statusTally = new Map<string, number>();
      for (const o of orders) statusTally.set(o.status, (statusTally.get(o.status) ?? 0) + 1);

      const customers = customersRes.data ?? [];
      const newCustomers = customers.filter((c) => c.created_at >= startIso).length;
      const uniqueVisitors = new Set(visits.map((v) => v.session_id ?? v.id)).size;

      return {
        revenue,
        revenuePrev,
        ordersCount: orders.length,
        ordersPrev: ordersPrevList.length,
        visits: visits.length,
        visitsPrev: visitsPrevList.length,
        uniqueVisitors,
        customers: customers.length,
        newCustomers,
        conversionRate: visits.length ? (orders.length / visits.length) * 100 : 0,
        averageOrder: paid.length ? revenue / paid.length : 0,
        series,
        countries,
        browsers: tally(visits, (v) => v.browser ?? "Inconnu").slice(0, 6),
        devices: tally(visits, (v) => v.device ?? "Inconnu").slice(0, 4),
        referrers: tally(visits, (v) => v.referrer ?? "Direct").slice(0, 6),
        statuses: [...statusTally.entries()].map(([name, count]) => ({ name, count })),
        topProducts: [...productTally.entries()]
          .map(([id, v]) => ({ name: productNames.get(id) ?? "Produit", ...v }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5),
      };
    },
  });
}

export function growth(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
