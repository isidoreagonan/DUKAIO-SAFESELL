/**
 * API des e-mails de cycle de vie appelée par l'interface :
 * - e-mail de bienvenue (comptes Google qui ne passent pas par le code à 6 chiffres),
 * - relance quand un paiement d'abonnement est commencé puis abandonné.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { userId: string };

/** Envoie l'e-mail de bienvenue si le vendeur ne l'a jamais reçu. */
export const ensureWelcomeEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as unknown as Ctx;
    const { sendWelcomeEmail } = await import("@/lib/lifecycle-emails.server");
    try {
      return { sent: await sendWelcomeEmail(userId) };
    } catch (e) {
      console.error("welcome email", e);
      return { sent: false };
    }
  });

/** Le vendeur a fermé la fenêtre de paiement sans finaliser : relance marketing. */
export const reportCheckoutAbandon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const id = String((input as Record<string, unknown>)?.["paymentId"] ?? "");
    if (id.length < 10) throw new Error("Paiement inconnu.");
    return { paymentId: id };
  })
  .handler(async ({ data, context }) => {
    const { userId } = context as unknown as Ctx;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("subscription_payments")
      .select("user_id, plan, status")
      .eq("id", data.paymentId)
      .maybeSingle();
    if (!row || row.user_id !== userId || row.status === "completed") return { sent: false };

    const { sendCheckoutAbandonEmail } = await import("@/lib/lifecycle-emails.server");
    try {
      return { sent: await sendCheckoutAbandonEmail(userId, row.plan) };
    } catch (e) {
      console.error("abandon email", e);
      return { sent: false };
    }
  });
