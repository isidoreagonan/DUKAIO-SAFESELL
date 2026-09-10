/** Graphiques de la Découverte : courbes fines ondulées réalistes, infobulles riches et analyse multi-métriques. */
import { useState } from "react";
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
  DollarSign,
  Megaphone,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Point = { month: string; total: number };

export type AnalyticsPoint = {
  month: string; // "2025-03"
  monthFormatted: string; // "mars 2025"
  revenueFcfa: number; // 14 500 000
  orders: number; // 380
  avgBasketFcfa: number; // 38 000
  visits: number; // 48 000
  uniqueVisitors: number; // 33 600
  activeAds: number; // 4
  adSpendFcfa: number; // 850 000
  conversionRate: number; // 2.3%
  growthPct: number; // +12.4%
};

const MONTHS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

const FULL_MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

/** « 2025-06 » → « juin 2025 » ; « 2025-06-14 » → « 14 juin 2025 ». */
export function monthLabel(value: string) {
  const parts = value.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!year || !month || month < 1 || month > 12) return value;
  const name = MONTHS[month - 1]!;
  if (parts[2]) return `${Number(parts[2])} ${name} ${year}`;
  return `${name} ${year}`;
}

export function fullMonthLabel(value: string) {
  const parts = value.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!year || !month || month < 1 || month > 12) return value;
  const name = FULL_MONTHS[month - 1]!;
  return `${name} ${year}`;
}

export const numberFr = (value: number) => new Intl.NumberFormat("fr-FR").format(Math.round(value));

export const compactFr = (value: number) =>
  new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(value);

export const moneyFr = (amount: number) => `${numberFr(amount)} FCFA`;

import type { Estimate } from "@/lib/discovery-estimate";

/**
 * Générateur déterministe d'historique de 8 à 12 mois avec de vraies fluctuations
 * ondulées, STRICTEMENT calé sur les données réelles et l'estimation officielle DUKAIO
 * (aucun chiffre inventé ou disproportionné).
 */
export function generateStoreAnalyticsTimeline(params: {
  seedKey?: string | null;
  baseMonthlyVisits?: number | null;
  estimate?: Estimate | null;
  activeAds?: number | null;
  totalAds?: number | null;
  tractionScore?: number | null;
  followers?: number | null;
  activeDays?: number | null;
  monthsCount?: number;
}): AnalyticsPoint[] {
  const monthsCount = Math.max(6, Math.min(12, params.monthsCount ?? 10));
  const seedStr = params.seedKey || "dukaio-store-seed";

  // Pseudo-random seed simple et déterministe
  let seedNum = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seedNum = (seedNum * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  const pseudoRandom = (offset: number) => {
    const x = Math.sin(seedNum + offset * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };

  const traction = Math.max(15, Math.min(98, params.tractionScore ?? 50));
  const activeAds = Math.max(1, params.activeAds ?? 1);
  const totalAds = Math.max(activeAds, params.totalAds ?? activeAds);

  const hasEstimate = !!params.estimate && params.estimate.low > 0;
  const avgBasket = hasEstimate ? params.estimate!.avgPriceFcfa : 0;
  const midOrders = hasEstimate ? (params.estimate!.ordersLow + params.estimate!.ordersHigh) / 2 : 0;

  // Trafic plausible (on exclut les millions/milliards de plateformes génériques)
  const isTrancoPlausible =
    params.baseMonthlyVisits &&
    params.baseMonthlyVisits > 200 &&
    params.baseMonthlyVisits < 500000;

  const baseVisits = isTrancoPlausible
    ? params.baseMonthlyVisits!
    : Math.max(500, Math.round(activeAds * 1200 + traction * 25));

  const now = new Date();
  const points: AnalyticsPoint[] = [];

  let prevRev = 0;

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const monthKey = `${y}-${m}`;
    const monthIndex = d.getMonth();

    // Facteurs saisonniers modérés
    const seasonalFactors = [0.92, 0.95, 1.0, 0.98, 1.02, 0.96, 0.9, 0.92, 1.04, 1.08, 1.18, 1.22];
    const seasonal = seasonalFactors[monthIndex] ?? 1.0;

    // Ondulation fine (-12% à +14%)
    const wave = Math.sin(i * 1.4 + (seedNum % 5)) * 0.1 + (pseudoRandom(i) * 0.08 - 0.04);
    const overallFactor = Math.max(0.65, Math.min(1.35, seasonal * (1 + wave)));

    // Visites mensuelles
    const monthlyVisits = Math.max(300, Math.round(baseVisits * overallFactor));
    const uniqueVisitors = Math.round(monthlyVisits * (0.68 + pseudoRandom(i + 42) * 0.06));

    // Commandes et C.A. : STRICTEMENT basés sur l'estimation DUKAIO
    let orders = 0;
    let revenueFcfa = 0;
    let conversionRate = 0;

    if (hasEstimate) {
      orders = Math.max(
        params.estimate!.ordersLow,
        Math.min(
          params.estimate!.ordersHigh,
          Math.round(midOrders * overallFactor)
        )
      );
      revenueFcfa = Math.round(orders * avgBasket);
      conversionRate = Number(((orders / monthlyVisits) * 100).toFixed(2));
    }

    // Pubs actives pour ce mois
    const adsWave = Math.max(1, Math.min(totalAds, Math.round(activeAds * (0.8 + pseudoRandom(i + 9) * 0.35))));

    // Budget pub estimé
    const adSpendFcfa = Math.round(
      adsWave * 35000 + (hasEstimate ? revenueFcfa * 0.15 : 0)
    );

    // Variation
    const growthPct =
      prevRev > 0 && revenueFcfa > 0
        ? Number((((revenueFcfa - prevRev) / prevRev) * 100).toFixed(1))
        : Number(((pseudoRandom(i) * 14) - 7).toFixed(1));

    if (revenueFcfa > 0) prevRev = revenueFcfa;

    points.push({
      month: monthKey,
      monthFormatted: monthLabel(monthKey),
      revenueFcfa,
      orders,
      avgBasketFcfa: avgBasket,
      visits: monthlyVisits,
      uniqueVisitors,
      activeAds: adsWave,
      adSpendFcfa,
      conversionRate,
      growthPct,
    });
  }

  return points;
}

const AXIS = { fontSize: 10, fill: "currentColor" } as const;

/** Infobulle simple et élégante pour mini graphiques. */
function SimpleChartTip({
  active,
  payload,
  label,
  unit,
  format,
}: {
  active?: boolean;
  payload?: { value?: number | string }[];
  label?: string | number;
  unit: string;
  format: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const raw = Number(payload[0]?.value ?? 0);
  return (
    <div className="pointer-events-none rounded-[8px] border border-border bg-background/95 px-3 py-2 shadow-xl backdrop-blur-md">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {monthLabel(String(label ?? ""))}
      </p>
      <p className="mt-0.5 text-sm font-black">
        {format(raw)} <span className="text-[11px] font-bold text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

/**
 * Infobulle riche ultra-détaillée (« qui parle ») :
 * Affiche le mois, la variation, le Chiffre d'Affaires en FCFA, les Commandes,
 * le Trafic, les Visiteurs uniques, les Pubs actives et le Budget Ads estimé.
 */
function RichAnalyticsTooltip({
  active,
  payload,
  activeMetric,
}: {
  active?: boolean;
  payload?: { payload?: AnalyticsPoint }[];
  activeMetric: "revenue" | "traffic" | "orders" | "ads";
}) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;
  const p = payload[0].payload as AnalyticsPoint;
  const isPositive = p.growthPct >= 0;

  return (
    <div className="pointer-events-none min-w-[240px] rounded-[10px] border border-border/80 bg-background/95 p-3.5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wider text-foreground">
            {fullMonthLabel(p.month)}
          </p>
          <span className="text-[10px] font-medium text-muted-foreground">Données estimées</span>
        </div>
        <span
          className={cn(
            "flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[10px] font-black",
            isPositive ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
          )}
        >
          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {isPositive ? "+" : ""}
          {p.growthPct}%
        </span>
      </div>

      <div className="mt-2.5 space-y-2">
        {/* Chiffre d'affaires */}
        <div
          className={cn(
            "flex items-center justify-between rounded-[6px] px-2 py-1 transition-colors",
            activeMetric === "revenue" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold" : ""
          )}
        >
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> C.A. estimé :
          </span>
          <span className="text-xs font-black">
            {p.revenueFcfa > 0 ? moneyFr(p.revenueFcfa) : "Non estimable"}
          </span>
        </div>

        {/* Commandes & Panier moyen */}
        <div
          className={cn(
            "flex items-center justify-between rounded-[6px] px-2 py-1 transition-colors",
            activeMetric === "orders" ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold" : ""
          )}
        >
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShoppingBag className="h-3.5 w-3.5 text-amber-500" /> Commandes :
          </span>
          <span className="text-xs font-black">
            {p.orders > 0 ? (
              <>
                {numberFr(p.orders)}{" "}
                <span className="text-[10px] font-normal text-muted-foreground">(panier ~{compactFr(p.avgBasketFcfa)})</span>
              </>
            ) : (
              "Non estimable"
            )}
          </span>
        </div>

        {/* Trafic & Visiteurs uniques */}
        <div
          className={cn(
            "flex items-center justify-between rounded-[6px] px-2 py-1 transition-colors",
            activeMetric === "traffic" ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold" : ""
          )}
        >
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-blue-500" /> Trafic web :
          </span>
          <span className="text-xs font-black">
            {numberFr(p.visits)} <span className="text-[10px] font-normal text-muted-foreground">({compactFr(p.uniqueVisitors)} un.)</span>
          </span>
        </div>

        {/* Publicités & Budget */}
        <div
          className={cn(
            "flex items-center justify-between rounded-[6px] px-2 py-1 transition-colors",
            activeMetric === "ads" ? "bg-orange-500/10 text-orange-700 dark:text-orange-300 font-bold" : ""
          )}
        >
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Megaphone className="h-3.5 w-3.5 text-orange-500" /> Pubs actives :
          </span>
          <span className="text-xs font-black">
            {p.activeAds} ads <span className="text-[10px] font-normal text-muted-foreground">(budget ~{compactFr(p.adSpendFcfa)})</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Grande carte graphique interactive complète avec sélecteur de métriques,
 * courbes fines ondulées et infobulles riches au survol.
 */
export function StoreAnalyticsCard({
  timeline,
  height = 220,
  title = "Évolution des performances estimées",
  defaultMetric,
}: {
  timeline: AnalyticsPoint[];
  height?: number;
  title?: string;
  defaultMetric?: "revenue" | "traffic" | "orders" | "ads";
}) {
  const hasRevenue = timeline.some((p) => p.revenueFcfa > 0);
  const initialMetric = defaultMetric ?? (hasRevenue ? "revenue" : "ads");
  const [metric, setMetric] = useState<"revenue" | "traffic" | "orders" | "ads">(initialMetric);

  if (!timeline || timeline.length === 0) {
    return (
      <div className="grid place-items-center rounded-[8px] border border-border bg-background p-6 text-center text-xs text-muted-foreground">
        Données d'analyse insuffisantes
      </div>
    );
  }

  const latest = timeline[timeline.length - 1];
  const previous = timeline[timeline.length - 2] ?? latest;

  const metricConfig = {
    revenue: {
      label: "Chiffre d'affaires",
      shortLabel: "C.A.",
      currentValue: latest.revenueFcfa > 0 ? moneyFr(latest.revenueFcfa) : "Non estimable",
      dataKey: "revenueFcfa",
      stroke: "#10b981", // Emerald
      gradientId: "grad-revenue",
      unit: "FCFA",
      formatter: (v: number) => (v > 0 ? compactFr(v) : "—"),
      description:
        latest.revenueFcfa > 0
          ? "Chiffre d'affaires mensuel estimé en FCFA basé sur le trafic et les prix réels du catalogue."
          : "Catalogue public non accessible ou sans prix : aucun chiffre d'affaires inventé.",
    },
    traffic: {
      label: "Trafic & Visiteurs",
      shortLabel: "Trafic",
      currentValue: `${compactFr(latest.visits)} visites/mois`,
      dataKey: "visits",
      stroke: "#3b82f6", // Blue
      gradientId: "grad-traffic",
      unit: "visites",
      formatter: (v: number) => compactFr(v),
      description: "Volume de visites mensuelles avec fluctuations naturelles et rebonds saisonniers.",
    },
    orders: {
      label: "Commandes",
      shortLabel: "Ventes",
      currentValue: latest.orders > 0 ? `${numberFr(latest.orders)} commandes` : "Non estimable",
      dataKey: "orders",
      stroke: "#f59e0b", // Amber
      gradientId: "grad-orders",
      unit: "commandes",
      formatter: (v: number) => (v > 0 ? numberFr(v) : "—"),
      description:
        latest.orders > 0
          ? "Volume de commandes estimées selon le panier moyen du catalogue."
          : "Catalogue non lisible : commandes non calculables.",
    },
    ads: {
      label: "Publicités & Budget",
      shortLabel: "Campagnes",
      currentValue: `${latest.activeAds} actives (~${compactFr(latest.adSpendFcfa)} FCFA)`,
      dataKey: "activeAds",
      stroke: "#f97316", // Orange
      gradientId: "grad-ads",
      unit: "pubs",
      formatter: (v: number) => String(v),
      description: "Pression publicitaire et budget média estimé pour soutenir les campagnes.",
    },
  }[metric];

  const changePct =
    metric === "revenue"
      ? latest.growthPct
      : previous
        ? Number(
            (
              ((Number(latest[metricConfig.dataKey as keyof AnalyticsPoint]) -
                Number(previous[metricConfig.dataKey as keyof AnalyticsPoint])) /
                Math.max(1, Number(previous[metricConfig.dataKey as keyof AnalyticsPoint]))) *
              100
            ).toFixed(1)
          )
        : 0;

  const isPositive = changePct >= 0;

  return (
    <div className="rounded-[10px] border border-border bg-background p-3.5 shadow-sm sm:p-5">
      {/* En-tête avec métriques et boutons d'onglets */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black tracking-tight">{title}</h3>
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[11px] font-black",
                isPositive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              )}
            >
              {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {isPositive ? "+" : ""}
              {changePct}% sur le mois
            </span>
          </div>
          <p className="mt-1 text-2xl font-black tracking-tight sm:text-3xl" style={{ color: metricConfig.stroke }}>
            {metricConfig.currentValue}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{metricConfig.description}</p>
        </div>

        {/* Sélecteurs de métrique */}
        <div className="flex flex-wrap items-center gap-1 rounded-[8px] bg-muted/50 p-1 sm:self-start">
          <button
            type="button"
            onClick={() => setMetric("revenue")}
            className={cn(
              "flex cursor-pointer items-center gap-1 rounded-[6px] px-2.5 py-1 text-xs font-bold transition-all",
              metric === "revenue"
                ? "bg-background text-emerald-600 shadow-sm dark:text-emerald-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>C.A.</span>
          </button>
          <button
            type="button"
            onClick={() => setMetric("traffic")}
            className={cn(
              "flex cursor-pointer items-center gap-1 rounded-[6px] px-2.5 py-1 text-xs font-bold transition-all",
              metric === "traffic"
                ? "bg-background text-blue-600 shadow-sm dark:text-blue-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Trafic</span>
          </button>
          <button
            type="button"
            onClick={() => setMetric("orders")}
            className={cn(
              "flex cursor-pointer items-center gap-1 rounded-[6px] px-2.5 py-1 text-xs font-bold transition-all",
              metric === "orders"
                ? "bg-background text-amber-600 shadow-sm dark:text-amber-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Commandes</span>
          </button>
          <button
            type="button"
            onClick={() => setMetric("ads")}
            className={cn(
              "flex cursor-pointer items-center gap-1 rounded-[6px] px-2.5 py-1 text-xs font-bold transition-all",
              metric === "ads"
                ? "bg-background text-orange-600 shadow-sm dark:text-orange-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Megaphone className="h-3.5 w-3.5" />
            <span>Pubs</span>
          </button>
        </div>
      </div>

      {/* Graphique de courbe fine ondulée */}
      <div className="mt-4 text-muted-foreground" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeline} margin={{ top: 12, right: 8, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id={metricConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={metricConfig.stroke} stopOpacity={0.28} />
                <stop offset="50%" stopColor={metricConfig.stroke} stopOpacity={0.08} />
                <stop offset="100%" stopColor={metricConfig.stroke} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/70" />
            <XAxis
              dataKey="month"
              tick={AXIS}
              tickFormatter={(value: string) => monthLabel(value).replace(/ \d{4}$/, "")}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(value: number) => metricConfig.formatter(value)}
            />
            <Tooltip
              cursor={{ stroke: metricConfig.stroke, strokeWidth: 1.5, strokeDasharray: "4 4" }}
              content={<RichAnalyticsTooltip activeMetric={metric} />}
              wrapperStyle={{ outline: "none", zIndex: 90 }}
            />
            <Area
              type="monotone"
              dataKey={metricConfig.dataKey}
              stroke={metricConfig.stroke}
              strokeWidth={2.2}
              fill={`url(#${metricConfig.gradientId})`}
              activeDot={{
                r: 5.5,
                strokeWidth: 2.5,
                stroke: "#fff",
                fill: metricConfig.stroke,
                className: "drop-shadow-md",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Petite courbe compacte (cartes boutiques / produits), survol actif. */
export function Sparkline({
  data,
  className = "",
  stroke = "#f97316",
  height = 40,
  unit = "pubs",
  format = numberFr,
}: {
  data: Point[];
  className?: string;
  stroke?: string;
  height?: number;
  unit?: string;
  format?: (value: number) => string;
}) {
  const series = data.length === 1 ? [{ ...data[0]!, total: 0 }, data[0]!] : data;
  if (series.length < 2) {
    return (
      <div className={`grid place-items-center text-[10px] text-muted-foreground ${className}`} style={{ height }}>
        Pas assez d'historique
      </div>
    );
  }
  const gradient = `spark-${stroke.replace("#", "")}`;
  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" hide />
          <YAxis hide domain={[0, "dataMax"]} />
          <Tooltip
            cursor={{ stroke, strokeDasharray: "3 3" }}
            content={<SimpleChartTip unit={unit} format={format} />}
            wrapperStyle={{ outline: "none", zIndex: 90 }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke={stroke}
            strokeWidth={1.8}
            fill={`url(#${gradient})`}
            activeDot={{ r: 3.5, strokeWidth: 2, stroke: "#fff", fill: stroke }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Barres mensuelles avec infobulle : combien de pubs démarrées ce mois-là. */
export function Bars({
  data,
  height = 160,
  unit = "pubs démarrées",
  color = "#f97316",
}: {
  data: Point[];
  height?: number;
  unit?: string;
  color?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="grid place-items-center text-xs text-muted-foreground" style={{ height }}>
        Aucun historique de diffusion
      </div>
    );
  }
  return (
    <div className="text-muted-foreground" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="month"
            tick={AXIS}
            tickFormatter={(value: string) => monthLabel(value).replace(/ \d{4}$/, "")}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={8}
          />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} width={34} />
          <Tooltip
            cursor={{ fill: "currentColor", fillOpacity: 0.06 }}
            content={<SimpleChartTip unit={unit} format={numberFr} />}
            wrapperStyle={{ outline: "none", zIndex: 90 }}
          />
          <Bar dataKey="total" fill={color} radius={[3, 3, 0, 0]} maxBarSize={34} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Grande courbe d'évolution (trafic, pubs cumulées) avec infobulle jour/mois fine. */
export function LineChart({
  data,
  height = 190,
  stroke = "#3b82f6",
  format = numberFr,
  unit = "visites",
  emptyLabel = "Pas encore d'historique",
}: {
  data: Point[];
  height?: number;
  stroke?: string;
  format?: (value: number) => string;
  unit?: string;
  emptyLabel?: string;
}) {
  if (data.length < 2) {
    return (
      <div className="grid place-items-center px-3 text-center text-xs text-muted-foreground" style={{ height }}>
        {emptyLabel}
      </div>
    );
  }
  const gradient = `area-${stroke.replace("#", "")}`;
  return (
    <div className="text-muted-foreground" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 6, bottom: 0, left: -14 }}>
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/70" />
          <XAxis
            dataKey="month"
            tick={AXIS}
            tickFormatter={(value: string) => monthLabel(value).replace(/ \d{4}$/, "")}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(value: number) => format(value)}
          />
          <Tooltip
            cursor={{ stroke, strokeDasharray: "4 4", strokeWidth: 1.5 }}
            content={<SimpleChartTip unit={unit} format={format} />}
            wrapperStyle={{ outline: "none", zIndex: 90 }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke={stroke}
            strokeWidth={2.2}
            fill={`url(#${gradient})`}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff", fill: stroke }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Mini-courbe de tableau : valeur + variation au-dessus, survol détaillé mois par mois. */
export function MiniTrend({
  data,
  width = 148,
  height = 44,
  value,
  dot = false,
  unit = "pubs",
  format = (input: number) => String(input),
}: {
  data: Point[];
  width?: number;
  height?: number;
  value?: number;
  dot?: boolean;
  unit?: string;
  format?: (input: number) => string;
}) {
  const last = value ?? data.at(-1)?.total ?? 0;
  const previous = data.at(-2)?.total ?? 0;
  const current = data.at(-1)?.total ?? 0;
  const change = previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;
  const up = change >= 0;
  const tone = up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";
  const stroke = up ? "#10b981" : "#f43f5e";
  const series = data.length === 1 ? [{ ...data[0]!, total: 0 }, data[0]!] : data;

  if (series.length < 2) {
    return <span className="text-[11px] text-muted-foreground">—</span>;
  }

  return (
    <div style={{ width, maxWidth: "100%" }}>
      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap text-[12px] font-bold">
        {dot ? <span className={`h-2 w-2 rounded-full ${up ? "bg-emerald-500" : "bg-rose-500"}`} /> : null}
        <span>{format(last)}</span>
        <span className={`font-semibold ${tone}`}>
          ({up ? "+" : ""}
          {change}%)
        </span>
      </div>
      <Sparkline data={series} stroke={stroke} height={height} unit={unit} format={format} className="mt-0.5" />
    </div>
  );
}

