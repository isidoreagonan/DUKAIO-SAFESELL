/** Graphiques de la Découverte : courbes et barres avec infobulle au survol (mois + valeur). */
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type Point = { month: string; total: number };

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

const numberFr = (value: number) => new Intl.NumberFormat("fr-FR").format(Math.round(value));

/** Infobulle commune : mois lisible + valeur exacte + unité. */
function ChartTip({
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
    <div className="pointer-events-none rounded-[6px] border border-border bg-background px-2.5 py-1.5 shadow-lg">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {monthLabel(String(label ?? ""))}
      </p>
      <p className="text-sm font-black">
        {format(raw)} <span className="text-[11px] font-bold text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

const AXIS = { fontSize: 10, fill: "currentColor" } as const;

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
            content={<ChartTip unit={unit} format={format} />}
            wrapperStyle={{ outline: "none", zIndex: 90 }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke={stroke}
            strokeWidth={2}
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
            content={<ChartTip unit={unit} format={numberFr} />}
            wrapperStyle={{ outline: "none", zIndex: 90 }}
          />
          <Bar dataKey="total" fill={color} radius={[3, 3, 0, 0]} maxBarSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Grande courbe d'évolution (trafic, pubs cumulées) avec infobulle jour/mois. */
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
              <stop offset="0%" stopColor={stroke} stopOpacity={0.3} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
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
            cursor={{ stroke, strokeDasharray: "4 4" }}
            content={<ChartTip unit={unit} format={format} />}
            wrapperStyle={{ outline: "none", zIndex: 90 }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke={stroke}
            strokeWidth={2.5}
            fill={`url(#${gradient})`}
            activeDot={{ r: 5, strokeWidth: 2.5, stroke: "#fff", fill: stroke }}
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
  const tone = up ? "text-emerald-600" : "text-rose-600";
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
