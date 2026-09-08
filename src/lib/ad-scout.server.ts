/**
 * Robot de collecte de publicités (bibliothèque publicitaire Meta).
 * Inactif tant que le jeton META_AD_LIBRARY_TOKEN n'est pas configuré.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const SCOUT_COUNTRIES = ["BF", "CI", "SN", "ML", "BJ", "TG", "CM"] as const;
export const SCOUT_KEYWORDS = [
  "beauté",
  "parfum",
  "maison",
  "mode",
  "cuisine",
  "fitness",
  "téléphone",
  "enfant",
] as const;

export type ScoutSummary = {
  ok: boolean;
  reason?: string;
  checked: number;
  inserted: number;
  updated: number;
  errors: string[];
};

const CATEGORY_RULES: [RegExp, string][] = [
  [/beaut|peau|creme|crème|parfum|cheveu/i, "Beauté & soin"],
  [/phone|montre|gadget|ecouteur|écouteur|tech/i, "Tech & gadgets"],
  [/mode|robe|chaussure|sac/i, "Mode & accessoires"],
  [/cuisine|casserole|blender|ustensile/i, "Cuisine"],
  [/maison|jardin|deco|décor/i, "Maison & jardin"],
  [/sport|fitness|muscul|minceur/i, "Sport & fitness"],
  [/bebe|bébé|enfant|jouet/i, "Bébé & enfants"],
  [/auto|moto|voiture/i, "Auto & moto"],
];

function categorize(text: string) {
  for (const [rx, label] of CATEGORY_RULES) if (rx.test(text)) return label;
  return "À la une";
}

function db() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Backend indisponible");
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

const FIELDS =
  "id,ad_creative_bodies,ad_snapshot_url,ad_delivery_start_time,page_name,publisher_platforms";

/** Lance une passe de collecte sur la bibliothèque publicitaire Meta. */
export async function runAdScout(
  options: { countries?: string[]; keywords?: string[]; perCallLimit?: number } = {},
): Promise<ScoutSummary> {
  const token = process.env["META_AD_LIBRARY_TOKEN"];
  const summary: ScoutSummary = { ok: false, checked: 0, inserted: 0, updated: 0, errors: [] };
  if (!token) {
    summary.reason = "token_manquant";
    return summary;
  }

  const countries = options.countries?.length ? options.countries : [...SCOUT_COUNTRIES];
  const keywords = options.keywords?.length ? options.keywords : [...SCOUT_KEYWORDS];
  const limit = options.perCallLimit ?? 25;
  const supabase = db();

  for (const country of countries) {
    for (const keyword of keywords) {
      const url = new URL("https://graph.facebook.com/v21.0/ads_archive");
      url.searchParams.set("access_token", token);
      url.searchParams.set("ad_reached_countries", JSON.stringify([country]));
      url.searchParams.set("search_terms", keyword);
      url.searchParams.set("ad_type", "ALL");
      url.searchParams.set("ad_active_status", "ACTIVE");
      url.searchParams.set("fields", FIELDS);
      url.searchParams.set("limit", String(limit));

      let payload: { data?: Record<string, unknown>[]; error?: { message?: string } };
      try {
        const res = await fetch(url.toString());
        payload = (await res.json()) as typeof payload;
      } catch (error) {
        summary.errors.push(`${country}/${keyword}: ${(error as Error).message}`);
        continue;
      }
      if (payload.error) {
        summary.errors.push(`${country}/${keyword}: ${payload.error.message ?? "erreur Meta"}`);
        continue;
      }

      for (const raw of payload.data ?? []) {
        summary.checked += 1;
        const id = String(raw["id"] ?? "");
        if (!id) continue;
        const bodies = Array.isArray(raw["ad_creative_bodies"])
          ? (raw["ad_creative_bodies"] as string[])
          : [];
        const description = (bodies[0] ?? "").slice(0, 600);
        const start =
          typeof raw["ad_delivery_start_time"] === "string"
            ? (raw["ad_delivery_start_time"] as string).slice(0, 10)
            : null;
        const days = start
          ? Math.max(0, Math.round((Date.now() - new Date(start).getTime()) / 86400000))
          : 0;
        const score = Math.max(
          0,
          Math.min(100, 50 + Math.min(days, 40) + (description.length > 60 ? 10 : 0)),
        );
        const row = {
          source_key: `meta:${id}`,
          title: (description.split("\n")[0] || `Publicité ${keyword}`).slice(0, 120),
          description,
          platform: "meta",
          country,
          category: categorize(description),
          advertiser: typeof raw["page_name"] === "string" ? (raw["page_name"] as string) : null,
          snapshot_url:
            typeof raw["ad_snapshot_url"] === "string" ? (raw["ad_snapshot_url"] as string) : null,
          start_date: start,
          days_active: days,
          score,
          is_active: true,
          last_seen: new Date().toISOString().slice(0, 10),
          status: "active",
        };

        const { data: existing } = await supabase
          .from("trending_ads")
          .select("id")
          .eq("source_key", row.source_key)
          .maybeSingle();

        if (existing) {
          await supabase.from("trending_ads").update(row).eq("id", existing.id);
          summary.updated += 1;
        } else {
          const { error } = await supabase.from("trending_ads").insert(row);
          if (error) summary.errors.push(error.message);
          else summary.inserted += 1;
        }
      }
    }
  }

  summary.ok = true;
  return summary;
}
