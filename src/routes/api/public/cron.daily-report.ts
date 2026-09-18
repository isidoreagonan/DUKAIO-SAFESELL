/**
 * Tâche planifiée du rapport exécutif quotidien DUKAIO (appelée chaque soir à 23h00).
 * Authentification : jeton Bearer (CRON_SECRET ou CRON_RELANCES_SECRET) ou signature Supabase.
 * Envoie le bilan complet au Super-Administrateur via le bot Telegram Officiel.
 */
import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

async function authorized(request: Request) {
  const secret = process.env["CRON_SECRET"] || process.env["CRON_RELANCES_SECRET"];
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

  const { sendAdminTelegramDailyReport } = await import("@/lib/telegram.server");
  try {
    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "true";
    const result = await sendAdminTelegramDailyReport({ force });
    return Response.json({ ok: true, ...result });
  } catch (e) {
    console.error("[Cron Daily Report Error]", e);
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/cron/daily-report")({
  server: {
    handlers: {
      POST: ({ request }) => run(request),
      GET: ({ request }) => run(request),
    },
  },
});
