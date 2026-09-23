/**
 * Webhook public Stripe (Cartes bancaires & abonnements).
 * Écoute l'évènement "checkout.session.completed" pour valider instantanément
 * l'abonnement du vendeur sur DUKAIO dès que le débit est confirmé. Idempotent et sécurisé.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/billing/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("stripe-signature");
        if (!signature) {
          return new Response("Missing stripe-signature header", { status: 400 });
        }

        let event: import("stripe").Stripe.Event;
        try {
          const rawBody = await request.text();
          const { constructStripeWebhookEvent } = await import("@/lib/stripe.server");
          event = constructStripeWebhookEvent(rawBody, signature);
        } catch (err) {
          console.error("[stripe:webhook] Signature verification failed:", err);
          return new Response(
            `Webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}`,
            { status: 400 },
          );
        }

        if (event.type === "checkout.session.completed") {
          const session = event.data.object as import("stripe").Stripe.Checkout.Session;
          const paymentId = session.metadata?.["payment_id"] || session.client_reference_id;

          if (paymentId) {
            try {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              const { reconcilePayment } = await import("@/lib/billing.server");

              const { data: row } = await supabaseAdmin
                .from("subscription_payments")
                .select(
                  "id, store_id, user_id, plan, billing_period, amount, provider, provider_ref, status, created_at",
                )
                .eq("id", paymentId)
                .maybeSingle();

              if (row) {
                await reconcilePayment(row as never);
              }
            } catch (error) {
              console.error("[stripe:webhook] Error reconciling payment:", error);
            }
          }
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
