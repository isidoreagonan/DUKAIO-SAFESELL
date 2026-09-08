/**
 * Tâche planifiée des relances marketing DUKAIO (appelée chaque jour à 9 h).
 * Authentification obligatoire : jeton Bearer (CRON_RELANCES_SECRET ou CRON_SECRET).
 * La logique d'espacement (3 jours) vit dans lifecycle-emails.server.ts.
 */
import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

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
  const { runLifecycleCampaign } = await import("@/lib/lifecycle-emails.server");
  const { recoverAbandonedCarts } = await import("@/lib/abandoned.server");
  try {
    const result = await runLifecycleCampaign();
    const carts = await recoverAbandonedCarts();
    return Response.json({ ok: true, ...result, ...carts });
  } catch (e) {
    console.error("cron relances", e);
    return Response.json({ ok: false, error: "campagne impossible" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/cron/relances")({
  server: { handlers: { POST: ({ request }) => run(request), GET: ({ request }) => run(request) } },
});
