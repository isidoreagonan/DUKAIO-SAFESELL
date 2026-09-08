/**
 * Webhook WhatsApp (API Cloud de Meta). Une seule URL pour toutes les
 * boutiques : le message est routé grâce à `phone_number_id`.
 * GET  : vérification du webhook par Meta (hub.verify_token).
 * POST : messages entrants → robot de commande.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/whatsapp")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        if (mode !== "subscribe" || !token || !challenge)
          return new Response("Bad request", { status: 400 });

        /* Jeton commun à toute la plateforme (connexion en un clic). */
        const verifyToken = process.env["META_WEBHOOK_VERIFY_TOKEN"] || process.env["META_VERIFY_TOKEN"];
        if (token && verifyToken && token === verifyToken)
          return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("store_whatsapp")
          .select("store_id")
          .eq("verify_token", token)
          .limit(1);
        if (!data?.[0]) return new Response("Forbidden", { status: 403 });

        return new Response(challenge, {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });
      },
      POST: async ({ request }) => {
        let payload: unknown = null;
        try {
          payload = await request.json();
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        try {
          const { processWebhookPayload } = await import("@/lib/whatsapp.server");
          await processWebhookPayload(payload);
        } catch (error) {
          /* Meta réessaie si on renvoie une erreur : on log et on acquitte. */
          console.error("[whatsapp:webhook]", error);
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});
