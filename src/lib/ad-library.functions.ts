/**
 * Radar publicitaire : lecture publique des publicités repérées,
 * ajout/suppression réservés aux administrateurs.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database, Tables } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TrendingAd = Tables<"trending_ads">;

type AdminContext = {
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> };
  userId: string;
  claims: Record<string, unknown>;
};

function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Backend indisponible");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (target, init) => {
        const headers = new Headers(init?.headers);
        headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(target, { ...init, headers });
      },
    },
  });
}

async function assertAdmin(context: unknown) {
  const ctx = context as AdminContext;
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (data !== true) throw new Error("Accès réservé aux administrateurs.");
  const email = typeof ctx.claims["email"] === "string" ? (ctx.claims["email"] as string) : null;
  return { userId: ctx.userId, email };
}

async function privileged() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function log(
  actor: { userId: string; email: string | null },
  action: string,
  details: Record<string, unknown>,
) {
  const db = await privileged();
  await db.from("admin_audit_log").insert({
    actor_id: actor.userId,
    actor_email: actor.email,
    action,
    target_type: "trending_ad",
    target_id: typeof details["id"] === "string" ? (details["id"] as string) : null,
    details: details as never,
  });
}

/** Liste publique des publicités actives, les meilleures d'abord. */
export const getTrendingAds = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient()
    .from("trending_ads")
    .select("*")
    .eq("status", "active")
    .order("score", { ascending: false })
    .limit(200);
  return (data ?? []) as TrendingAd[];
});

/** Fiche détaillée d'une publicité. */
export const getTrendingAdById = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { data: row } = await publicClient()
      .from("trending_ads")
      .select("*")
      .eq("id", data.id)
      .eq("status", "active")
      .maybeSingle();
    return (row ?? null) as TrendingAd | null;
  });

const adInput = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(600).default(""),
  platform: z.string().max(20).default("meta"),
  country: z.string().max(4).default("BF"),
  category: z.string().max(60).default("À la une"),
  why_it_sells: z.string().max(400).default(""),
  engagement: z.number().int().min(0).default(0),
  likes: z.number().int().min(0).default(0),
  source_url: z.string().max(500).nullable().default(null),
  video_url: z.string().max(500).nullable().default(null),
  thumbnail_url: z.string().max(500).nullable().default(null),
  gender: z.string().max(20).default("tous"),
  sales_model: z.string().max(40).default("cod"),
});

/** Ajout manuel d'une publicité (admin). */
export const addTrendingAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => adInput.parse(data))
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await privileged();
    const { data: row, error } = await db
      .from("trending_ads")
      .insert({ ...data, status: "active" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await log(actor, "trending.add", { id: row.id, title: data.title });
    return { id: row.id };
  });

/** Retrait d'une publicité (admin). */
export const removeTrendingAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const db = await privileged();
    const { error } = await db.from("trending_ads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await log(actor, "trending.remove", { id: data.id });
    return { ok: true };
  });

/** Lance le robot de collecte (admin). */
export const runAdScoutFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { runAdScout } = await import("./ad-scout.server");
    return runAdScout();
  });
