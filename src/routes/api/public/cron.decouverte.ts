/**
 * Robot de collecte automatique des publicités « Découverte ».
 * Appelé par la tâche planifiée tous les 3 jours à minuit (heure du Bénin).
 * Garde-fous : verrou d'exécution unique, plafond de 200 publicités par passage,
 * mise en pause automatique si le compte de collecte est bloqué ou hors crédit.
 */
import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

const JOB_KEY = "discovery-ads";
const TARGET = 200; // plafond dur de publicités par passage
const META_TARGET = 150; // 150 publicités Meta…
const GOOGLE_TARGET = TARGET - META_TARGET; // …et 50 publicités Google Ads
const BATCH = 50; // par recherche, le robot facture au résultat
const MAX_ROUNDS = 5;
const GOOGLE_ROUNDS = 2;
const LEASE_MINUTES = 20;


type Admin = {
  from: (table: string) => any;
};

async function authorized(request: Request) {
  const secret = process.env["CRON_RELANCES_SECRET"];
  const match = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "");
  const token = match?.[1];
  if (secret && token) {
    const { createHash, timingSafeEqual } = await import("node:crypto");
    const digest = (v: string) => createHash("sha256").update(v, "utf8").digest();
    if (timingSafeEqual(digest(token), digest(secret))) return null;
  }
  return authenticateCronRequest(request);
}

async function run(request: Request) {
  const denied = await authorized(request);
  if (denied) return denied;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as unknown as Admin;
  const now = new Date();

  const { data: job } = await admin
    .from("discovery_jobs")
    .select("status, paused_reason, lease_until")
    .eq("key", JOB_KEY)
    .maybeSingle();

  // Verrou : un seul passage à la fois.
  const leased = job?.lease_until ? new Date(job.lease_until) : null;
  if (job?.status === "running" && leased && leased > now) {
    return Response.json({ ok: true, skipped: "collecte déjà en cours" });
  }

  const paused = job?.status === "paused";
  // En pause : un seul essai de sondage par passage pour détecter le déblocage.
  const rounds = paused ? 1 : MAX_ROUNDS;
  const perRound = paused ? 10 : BATCH;

  await admin
    .from("discovery_jobs")
    .upsert(
      {
        key: JOB_KEY,
        status: "running",
        lease_until: new Date(now.getTime() + LEASE_MINUTES * 60_000).toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: "key" },
    );

  const { runDiscoveryScan, runGoogleAdsScan } = await import("@/lib/discovery.server");

  let found = 0;
  let inserted = 0;
  let updated = 0;
  let blocked: string | null = null;
  let lastError: string | null = null;

  /** Boucle de collecte bornée, commune aux deux réseaux. */
  async function collect(
    scan: (input: { limit: number }) => Promise<{
      ok: boolean;
      reason?: string;
      found: number;
      inserted: number;
      updated: number;
    }>,
    target: number,
    maxRounds: number,
    perCall: number,
  ) {
    let got = 0;
    for (let round = 0; round < maxRounds && got < target; round += 1) {
      const remaining = target - got;
      try {
        const result = await scan({ limit: Math.max(10, Math.min(perCall, remaining)) });
        if (!result.ok) {
          lastError = result.reason ?? "collecte impossible";
          // Compte non connecté / bloqué / hors crédit : on met le robot en pause.
          if (/connect|crédit|credit/i.test(lastError)) blocked = lastError;
          break;
        }
        got += result.found;
        found += result.found;
        inserted += result.inserted;
        updated += result.updated;
        // Rien de nouveau à ramener : on arrête au lieu de repayer.
        if (result.found === 0) break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        lastError = message;
        if (/\b(402|403)\b/.test(message) || message === "credits") blocked = message;
        break;
      }
      // Respiration entre deux recherches (limites de débit).
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  }

  // 150 publicités Meta puis 50 publicités Google Ads.
  await collect(runDiscoveryScan, paused ? 10 : META_TARGET, rounds, perRound);
  if (!blocked) {
    await collect(runGoogleAdsScan, paused ? 5 : GOOGLE_TARGET, paused ? 1 : GOOGLE_ROUNDS, 25);
  }


  const status = blocked ? "paused" : "idle";
  await admin
    .from("discovery_jobs")
    .upsert(
      {
        key: JOB_KEY,
        status,
        paused_reason: blocked,
        lease_until: null,
        last_run_at: new Date().toISOString(),
        last_found: found,
        last_inserted: inserted,
        last_error: lastError,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

  return Response.json({ ok: !blocked, status, found, inserted, updated, error: lastError });
}

export const Route = createFileRoute("/api/public/cron/decouverte")({
  server: { handlers: { POST: ({ request }) => run(request), GET: ({ request }) => run(request) } },
});
