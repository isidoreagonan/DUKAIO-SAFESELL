/**
 * Trafic d'un domaine : basé sur le classement public Tranco (données réelles,
 * gratuites, mises à jour chaque jour). Le rang est converti en visites
 * mensuelles estimées — c'est une estimation, jamais une mesure exacte.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TrafficPoint = { month: string; total: number; rank: number };
export type DomainTraffic = {
  domain: string;
  rank: number | null;
  monthlyVisits: number | null;
  trend: number;
  history: TrafficPoint[];
  source: string;
};

/** Rang mondial -> visites mensuelles estimées (loi de puissance type Zipf). */
function rankToVisits(rank: number) {
  if (!(rank > 0)) return 0;
  return Math.round(2.5e9 / Math.pow(rank, 0.95));
}

function apex(domain: string) {
  const clean = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
  return clean;
}

export const getDomainTraffic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ domain: z.string().min(3).max(120) }).parse(data))
  .handler(async ({ data }): Promise<DomainTraffic> => {
    const domain = apex(data.domain);
    const empty: DomainTraffic = {
      domain,
      rank: null,
      monthlyVisits: null,
      trend: 0,
      history: [],
      source: "Tranco",
    };
    if (!domain.includes(".")) return empty;

    let ranks: { date: string; rank: number }[] = [];
    try {
      const response = await fetch(`https://tranco-list.eu/api/ranks/domain/${domain}`, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return empty;
      const payload = (await response.json()) as { ranks?: { date?: string; rank?: number }[] };
      ranks = (payload.ranks ?? [])
        .filter((item): item is { date: string; rank: number } => !!item.date && !!item.rank)
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch {
      return empty;
    }
    if (ranks.length === 0) return empty;

    // Un point par mois (médiane des rangs du mois), 12 derniers mois.
    const months = new Map<string, number[]>();
    for (const item of ranks) {
      const key = item.date.slice(0, 7);
      months.set(key, [...(months.get(key) ?? []), item.rank]);
    }
    const history = Array.from(months.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, values]) => {
        const sorted = [...values].sort((a, b) => a - b);
        const rank = sorted[Math.floor(sorted.length / 2)] ?? sorted[0]!;
        return { month, rank, total: rankToVisits(rank) };
      });

    const last = history.at(-1);
    const first = history[0];
    const trend =
      first && last && first.total > 0 ? Math.round(((last.total - first.total) / first.total) * 100) : 0;

    return {
      domain,
      rank: last?.rank ?? null,
      monthlyVisits: last?.total ?? null,
      trend,
      history,
      source: "Tranco",
    };
  });
