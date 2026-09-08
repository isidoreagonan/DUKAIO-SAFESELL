/**
 * Callback LigdiCash (carte bancaire). LigdiCash envoie deux requêtes (JSON et
 * formulaire) sans signature : on récupère seulement notre transaction_id, puis
 * on revérifie la facture avec le token stocké côté serveur. Idempotent.
 */
import { createFileRoute } from "@tanstack/react-router";

function readReference(payload: Record<string, unknown>) {
  const custom = payload["custom_data"];
  if (Array.isArray(custom)) {
    for (const entry of custom) {
      const item = entry as Record<string, unknown>;
      if (item["keyof_customdata"] === "transaction_id")
        return String(item["valueof_customdata"] ?? "");
    }
  }
  if (custom && typeof custom === "object") {
    const value = (custom as Record<string, unknown>)["transaction_id"];
    if (value) return String(value);
  }
  return String(payload["external_id"] ?? "");
}

export const Route = createFileRoute("/api/public/billing/ligdicash")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: Record<string, unknown> = {};
        const type = request.headers.get("content-type") ?? "";
        try {
          if (type.includes("application/json")) {
            payload = (await request.json()) as Record<string, unknown>;
          } else {
            const form = await request.formData();
            payload = Object.fromEntries(form.entries()) as Record<string, unknown>;
          }
        } catch {
          return new Response("bad request", { status: 400 });
        }

        const reference = readReference(payload);
        if (!reference) return new Response("ok");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { reconcilePayment } = await import("@/lib/billing.server");
        const { data: row } = await supabaseAdmin
          .from("subscription_payments")
          .select(
            "id, store_id, user_id, plan, billing_period, amount, provider, provider_ref, status, created_at",
          )
          .eq("id", reference)
          .maybeSingle();
        if (!row) return new Response("ok");

        try {
          await reconcilePayment(row as never);
        } catch (e) {
          console.error("ligdicash callback", e);
        }
        return new Response("ok");
      },
    },
  },
});
