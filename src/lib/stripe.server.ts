/**
 * Intégration serveur officielle de Stripe pour les paiements d'abonnements DUKAIO par carte bancaire.
 *
 * Fonctionne indifféremment en mode Test (sk_test_...) ou Live (sk_live_...).
 * Prend en charge Visa, Mastercard, American Express, Apple Pay, Google Pay et 3D Secure.
 *
 * NOTE DEVISE STRIPE :
 * Le FCFA (XOF) est une devise sans décimale ("zero-decimal currency") chez Stripe.
 * Un montant de 15 000 FCFA doit être passé à 15000 (et non multiplié par 100).
 */
import Stripe from "stripe";

let _stripeInstance: Stripe | null = null;

export function getStripeServer(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "La clé secrète Stripe (STRIPE_SECRET_KEY) n'est pas configurée dans votre fichier .env.",
    );
  }
  if (!_stripeInstance) {
    _stripeInstance = new Stripe(secretKey);
  }
  return _stripeInstance;
}

export type CreateStripeSessionInput = {
  paymentId: string;
  amount: number; // Montant en FCFA (XOF)
  planLabel: string;
  planKey: string;
  period: "monthly" | "yearly";
  origin: string;
  customerEmail?: string;
  storeName?: string;
};

/**
 * Crée une session Stripe Checkout pour un abonnement DUKAIO.
 * Renvoie l'identifiant de session et l'URL hébergée sécurisée de Stripe.
 */
export async function createStripeCheckoutSession(input: CreateStripeSessionInput) {
  const stripe = getStripeServer();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    client_reference_id: input.paymentId,
    customer_email: input.customerEmail || undefined,
    line_items: [
      {
        price_data: {
          currency: "xof",
          product_data: {
            name: `Abonnement DUKAIO — ${input.planLabel}`,
            description: `Période ${input.period === "yearly" ? "annuelle" : "mensuelle"} · Boutique ${input.storeName || "DUKAIO"}`,
            images: ["https://dukaio.com/og-image.png"],
          },
          unit_amount: Math.round(input.amount),
        },
        quantity: 1,
      },
    ],
    metadata: {
      payment_id: input.paymentId,
      plan: input.planKey,
      period: input.period,
    },
    success_url: `${input.origin}/dashboard/parametres?payment=success&session_id={CHECKOUT_SESSION_ID}&payment_id=${input.paymentId}`,
    cancel_url: `${input.origin}/dashboard/parametres?payment=cancelled`,
  });

  return {
    id: session.id,
    url: session.url ?? "",
  };
}

/**
 * Récupère l'état d'une session de paiement Stripe.
 */
export async function getStripeSessionStatus(sessionId: string) {
  const stripe = getStripeServer();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  return {
    status: session.status, // "complete" | "expired" | "open"
    paymentStatus: session.payment_status, // "paid" | "unpaid" | "no_payment_required"
    amountTotal: session.amount_total,
    currency: session.currency,
    metadata: session.metadata,
    clientReferenceId: session.client_reference_id,
    raw: session,
  };
}

/**
 * Vérifie la signature cryptographique d'un webhook Stripe entrant.
 */
export function constructStripeWebhookEvent(rawPayload: string | Buffer, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error(
      "Le secret de signature webhook (STRIPE_WEBHOOK_SECRET) n'est pas configuré dans votre fichier .env.",
    );
  }
  const stripe = getStripeServer();
  return stripe.webhooks.constructEvent(rawPayload, signature, webhookSecret);
}
