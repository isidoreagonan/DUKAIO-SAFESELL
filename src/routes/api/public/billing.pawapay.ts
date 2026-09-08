/**
 * Callback pawaPay (mobile money). Le corps n'est jamais cru sur parole :
 * on retrouve le paiement par sa référence puis on revérifie le statut auprès
 * de pawaPay avant toute activation d'abonnement. Endpoint idempotent.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/billing/pawapay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let depositId = "";
        try {
          const body = (await request.json()) as Record<string, unknown>;
          const nested = (body["data"] ?? body) as Record<string, unknown>;
          depositId = String(nested["depositId"] ?? body["depositId"] ?? "");
        } catch {
          return new Response("bad request", { status: 400 });
        }
        if (!depositId) return new Response("missing depositId", { status: 400 });

        const { paymentByRef, reconcilePayment } = await import("@/lib/billing.server");
        const payment = await paymentByRef("pawapay", depositId);
        if (!payment) return new Response("ok");

        try {
          await reconcilePayment(payment);
        } catch (e) {
          console.error("pawapay callback", e);
        }
        return new Response("ok");
      },
    },
  },
});
