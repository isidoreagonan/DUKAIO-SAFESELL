/**
 * Encaissement des abonnements DUKAIO.
 * - Mobile money : pawaPay API v2 (POST /v2/deposits, callback + vérification GET /v2/deposits/{id}).
 * - Carte bancaire : LigdiCash hosted pay-in (page 3D Secure hébergée, puis confirm par token).
 * Le statut d'un paiement n'est jamais accepté depuis le navigateur ni depuis le corps
 * d'un webhook : il est toujours revérifié auprès du prestataire avant activation.
 */
import { activatePlan } from "@/lib/subscription.server";
import type { BillingPeriod, PlanKey } from "@/lib/plans";
import { findMomoOption, momoAmount } from "@/lib/momo";

/* ------------------------------------------------------------------ pawaPay */

const PAWAPAY_LIVE = "https://api.pawapay.io";
const PAWAPAY_SANDBOX = "https://api.sandbox.pawapay.io";

function pawapayBase() {
  /* Production par défaut : le token fourni est un token live.
     Mettre PAWAPAY_ENV=sandbox pour tester avec un token sandbox. */
  return process.env["PAWAPAY_ENV"] === "sandbox" ? PAWAPAY_SANDBOX : PAWAPAY_LIVE;
}

function pawapayToken() {
  const token = process.env["PAWAPAY_API_TOKEN"];
  if (!token) throw new Error("Paiement mobile money indisponible : clé pawaPay manquante.");
  return token;
}

/** Opérateurs mobile money activés sur le compte pawaPay (voir src/lib/momo.ts). */
export { MOMO_OPTIONS as MOMO_PROVIDERS } from "@/lib/momo";

export function momoProvider(key: string) {
  const found = findMomoOption(key);
  if (!found) throw new Error("Opérateur mobile money inconnu.");
  return found;
}


/** MSISDN au format pawaPay : indicatif pays + numéro, sans « + » ni zéro initial. */
export function toMsisdn(dial: string, raw: string) {
  /* On retire d'abord l'indicatif, puis les zéros et le préfixe national
     (Bénin : 01 96 XX XX XX → 96 XX XX XX) avant de recomposer le MSISDN. */
  let local = raw.replace(/\D+/g, "");
  if (local.startsWith(`00${dial}`)) local = local.slice(dial.length + 2);
  else if (local.startsWith(dial)) local = local.slice(dial.length);
  local = local.replace(/^0+/, "");
  if (dial === "229" && local.length === 9 && local.startsWith("1")) local = local.slice(1);
  if (local.length < 6 || local.length > 12) throw new Error("Numéro de téléphone invalide.");
  return `${dial}${local}`;
}

async function pawapay(path: string, init?: RequestInit) {
  const response = await fetch(`${pawapayBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${pawapayToken()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    console.error(`pawaPay ${path} [${response.status}]: ${text}`);
    throw new Error(`Le prestataire mobile money a refusé la demande (${response.status}).`);
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("Réponse illisible du prestataire mobile money.");
  }
}

export type MomoInit = {
  depositId: string;
  amount: number;
  phone: string;
  provider: string;
  reference: string;
  storeName: string;
};

/** Demande de dépôt : le client valide sur son téléphone. */
export async function pawapayDeposit(input: MomoInit) {
  const provider = momoProvider(input.provider);
  const body = {
    depositId: input.depositId,
    amount: momoAmount(provider, input.amount),
    currency: provider.currency,
    payer: {
      type: "MMO",
      accountDetails: {
        phoneNumber: toMsisdn(provider.dial, input.phone),
        provider: provider.code,
      },
    },
    customerMessage: "DUKAIO abonnement".slice(0, 22),
    clientReferenceId: input.reference.slice(0, 40),
    metadata: [{ storeName: input.storeName.slice(0, 60) }],
  };
  const result = await pawapay("/v2/deposits", { method: "POST", body: JSON.stringify(body) });
  const status = String(result["status"] ?? "");
  if (status === "REJECTED") {
    const reason = result["failureReason"] as { failureMessage?: string } | undefined;
    throw new Error(reason?.failureMessage ?? "Dépôt refusé par l'opérateur.");
  }
  return { status, raw: result };
}

/** Logos officiels des opérateurs, récupérés depuis la configuration pawaPay. */
export async function pawapayProviderLogos() {
  try {
    const conf = await pawapay("/v2/active-conf");
    const logos: Record<string, string> = {};
    const countries = (conf["countries"] ?? []) as Array<Record<string, unknown>>;
    for (const country of countries) {
      const providers = (country["providers"] ?? []) as Array<Record<string, unknown>>;
      for (const provider of providers) {
        const code = String(provider["provider"] ?? "");
        const logo = String(provider["logo"] ?? "");
        if (code && logo) logos[code] = logo;
      }
    }
    return logos;
  } catch (e) {
    console.error("pawaPay active-conf", e);
    return {} as Record<string, string>;
  }
}

/** Statut réel d'un dépôt : COMPLETED, FAILED, PROCESSING… */
export async function pawapayStatus(depositId: string) {
  const result = await pawapay(`/v2/deposits/${depositId}`);
  if (String(result["status"]) === "NOT_FOUND") return { status: "PENDING", raw: result };
  const data = (result["data"] ?? {}) as Record<string, unknown>;
  const failure = data["failureReason"] as { failureMessage?: string } | undefined;
  return {
    status: String(data["status"] ?? "PROCESSING"),
    reason: failure?.failureMessage ?? null,
    raw: data,
  };
}

/* ------------------------------------------------- Retraits (payouts) admin */

export type PayoutInit = {
  payoutId: string;
  /** Montant en FCFA : converti dans la devise de l'opérateur choisi. */
  amount: number;
  phone: string;
  provider: string;
  reference: string;
  label: string;
};

/** Envoi d'argent vers un numéro mobile money (retrait des recettes DUKAIO). */
export async function pawapayPayout(input: PayoutInit) {
  const provider = momoProvider(input.provider);
  const body = {
    payoutId: input.payoutId,
    amount: momoAmount(provider, input.amount),
    currency: provider.currency,
    recipient: {
      type: "MMO",
      accountDetails: {
        phoneNumber: toMsisdn(provider.dial, input.phone),
        provider: provider.code,
      },
    },
    customerMessage: input.label.slice(0, 22),
    clientReferenceId: input.reference.slice(0, 40),
  };
  const result = await pawapay("/v2/payouts", { method: "POST", body: JSON.stringify(body) });
  const status = String(result["status"] ?? "");
  if (status === "REJECTED") {
    const reason = result["failureReason"] as { failureMessage?: string } | undefined;
    throw new Error(reason?.failureMessage ?? "Retrait refusé par l'opérateur.");
  }
  return {
    status,
    currency: provider.currency,
    localAmount: momoAmount(provider, input.amount),
    raw: result,
  };
}

/** Statut réel d'un retrait : COMPLETED, FAILED, PROCESSING… */
export async function pawapayPayoutStatus(payoutId: string) {
  const result = await pawapay(`/v2/payouts/${payoutId}`);
  if (String(result["status"]) === "NOT_FOUND") return { status: "PROCESSING", reason: null, raw: result };
  const data = (result["data"] ?? {}) as Record<string, unknown>;
  const failure = data["failureReason"] as { failureMessage?: string } | undefined;
  return {
    status: String(data["status"] ?? "PROCESSING"),
    reason: failure?.failureMessage ?? null,
    raw: data,
  };
}

/** Soldes réellement disponibles sur le compte du prestataire, par devise. */
export async function pawapayWallets() {
  try {
    const result = await pawapay("/v2/wallet-balances");
    const balances = (result["balances"] ?? []) as Array<Record<string, unknown>>;
    return balances.map((b) => ({
      currency: String(b["currency"] ?? ""),
      amount: Number(b["amount"] ?? 0),
      country: String(b["country"] ?? ""),
      provider: String(b["provider"] ?? ""),
    }));
  } catch (e) {
    console.error("pawaPay wallet-balances", e);
    return null;
  }
}

/* ---------------------------------------------------------------- LigdiCash */

const LIGDICASH_BASE = "https://app.ligdicash.com";

function ligdicashHeaders() {
  const apiKey = process.env["LIGDICASH_API_KEY"];
  const token = process.env["LIGDICASH_AUTH_TOKEN"] || process.env["LIGDICASH_API_TOKEN"];
  if (!apiKey || !token)
    throw new Error("Paiement par carte indisponible : clés LigdiCash manquantes.");
  return {
    Apikey: apiKey,
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export type CardInit = {
  reference: string;
  amount: number;
  label: string;
  origin: string;
  customer: { firstName: string; lastName: string; email: string };
};

/** Crée la facture hébergée et renvoie l'URL de la page de paiement (3D Secure). */
export async function ligdicashInvoice(input: CardInit) {
  const body = {
    commande: {
      invoice: {
        items: [
          {
            name: input.label.slice(0, 60),
            description: input.label.slice(0, 120),
            quantity: 1,
            unit_price: Math.round(input.amount),
            total_price: Math.round(input.amount),
          },
        ],
        total_amount: Math.round(input.amount),
        devise: "XOF",
        description: input.label.slice(0, 160),
        customer: "",
        customer_firstname: input.customer.firstName.slice(0, 60) || "Client",
        customer_lastname: input.customer.lastName.slice(0, 60) || "DUKAIO",
        customer_email: input.customer.email,
        external_id: input.reference,
        otp: "",
      },
      store: { name: "DUKAIO", website_url: input.origin },
      actions: {
        cancel_url: `${input.origin}/dashboard/parametres?paiement=annule`,
        return_url: `${input.origin}/dashboard/parametres?paiement=retour&ref=${input.reference}`,
        callback_url: `${input.origin}/api/public/billing/ligdicash`,
      },
      custom_data: { transaction_id: input.reference },
    },
  };

  const response = await fetch(`${LIGDICASH_BASE}/pay/v01/redirect/checkout-invoice/create`, {
    method: "POST",
    headers: ligdicashHeaders(),
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    console.error(`LigdiCash create [${response.status}]: ${text}`);
    throw new Error(`Le prestataire carte bancaire a refusé la demande (${response.status}).`);
  }
  const json = JSON.parse(text) as Record<string, unknown>;
  if (String(json["response_code"]) !== "00" || !json["token"]) {
    console.error(`LigdiCash create refusée: ${text}`);
    throw new Error("Création de la facture carte bancaire impossible. Réessayez.");
  }
  return { token: String(json["token"]), url: String(json["response_text"]), raw: json };
}

/** Statut réel de la facture (jamais celui du webhook). */
export async function ligdicashStatus(token: string) {
  const response = await fetch(
    `${LIGDICASH_BASE}/pay/v01/redirect/checkout-invoice/confirm/?invoiceToken=${encodeURIComponent(token)}`,
    { headers: ligdicashHeaders() },
  );
  const text = await response.text();
  if (!response.ok) {
    console.error(`LigdiCash confirm [${response.status}]: ${text}`);
    throw new Error(`Vérification du paiement impossible (${response.status}).`);
  }
  const json = JSON.parse(text) as Record<string, unknown>;
  return {
    status: String(json["status"] ?? "pending"),
    amount: Number(json["amount"] ?? json["montant"] ?? 0),
    raw: json,
  };
}

/* ------------------------------------------------------- Réconciliation DB */

type PaymentRow = {
  id: string;
  store_id: string;
  user_id: string;
  plan: string;
  billing_period: string;
  amount: number;
  provider: string;
  provider_ref: string | null;
  status: string;
  created_at?: string | null;
  promo_code?: string | null;
  discount_amount?: number | null;
};

/* Délais de validation : au-delà, la demande est considérée abandonnée. */
const MOMO_DEADLINE_MS = 4 * 60_000;
const CARD_DEADLINE_MS = 30 * 60_000;
/* Statuts pawaPay qui signent un échec définitif (refus, annulation du code PIN, expiration). */
const MOMO_FAILED = new Set([
  "FAILED",
  "REJECTED",
  "CANCELLED",
  "CANCELED",
  "EXPIRED",
  "DUPLICATE_IGNORED",
]);

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/**
 * Revérifie un paiement auprès du prestataire et active l'abonnement si le
 * montant encaissé correspond au tarif attendu. Idempotent.
 */
export async function reconcilePayment(payment: PaymentRow) {
  if (payment.status === "completed") return { status: "completed" as const };

  let paid = false;
  let pending = true;
  let reason: string | null = null;
  let raw: unknown = null;

  if (payment.provider === "pawapay") {
    const result = await pawapayStatus(payment.provider_ref ?? payment.id);
    raw = result.raw;
    reason = result.reason ?? null;
    paid = result.status === "COMPLETED";
    pending = !paid && !MOMO_FAILED.has(result.status.toUpperCase());
    if (!paid && !pending && !reason)
      reason = "Paiement refusé ou annulé sur le téléphone. Relancez la demande pour réessayer.";
  } else {
    if (!payment.provider_ref) return { status: "pending" as const };
    const result = await ligdicashStatus(payment.provider_ref);
    raw = result.raw;
    paid = result.status === "completed" && result.amount >= Number(payment.amount);
    pending = !paid && result.status === "pending";
    if (!paid && !pending) reason = "Paiement non abouti.";
  }

  /* Le vendeur n'a pas validé (code PIN annulé, téléphone posé) : on ne laisse
     pas la demande « en attente » indéfiniment, on la clôture en échec. */
  if (pending) {
    const createdAt = payment.created_at ? Date.parse(payment.created_at) : Number.NaN;
    const age = Number.isFinite(createdAt) ? Date.now() - createdAt : 0;
    const deadline = payment.provider === "pawapay" ? MOMO_DEADLINE_MS : CARD_DEADLINE_MS;
    if (age > deadline) {
      pending = false;
      reason =
        payment.provider === "pawapay"
          ? "Demande expirée : le paiement n'a pas été validé sur votre téléphone à temps. Relancez l'abonnement."
          : "Demande expirée : le paiement par carte n'a pas été finalisé. Relancez l'abonnement.";
    }
  }

  const store = await db();
  const status = paid ? "completed" : pending ? "pending" : "failed";
  await store
    .from("subscription_payments")
    .update({
      status,
      failure_reason: reason,
      payload: (raw ?? {}) as never,
      completed_at: paid ? new Date().toISOString() : null,
    })
    .eq("id", payment.id);

  /* Paiement refusé, annulé ou expiré : on prévient le vendeur par e-mail
     pour qu'il puisse relancer sa demande sans rester bloqué. */
  if (!paid && !pending && payment.status !== "failed") {
    try {
      const { PLAN_CATALOG } = await import("@/lib/plans");
      const { renderBrandEmail, sendEmail } = await import("@/lib/email.server");
      const { data: user } = await store.auth.admin.getUserById(payment.user_id);
      const to = user?.user?.email;
      if (to) {
        const label = PLAN_CATALOG[payment.plan as PlanKey]?.name ?? payment.plan;
        const html = renderBrandEmail({
          title: "Votre paiement n'a pas abouti",
          intro:
            reason ??
            "La demande de paiement a été refusée, annulée ou a expiré. Aucun montant n'a été débité.",
          body: [
            `Formule : ${label} (${payment.billing_period === "yearly" ? "annuel" : "mensuel"})`,
            `Montant : ${Math.round(Number(payment.amount)).toLocaleString("fr-FR")} FCFA`,
            `Moyen de paiement : ${payment.provider === "pawapay" ? "mobile money" : "carte bancaire"}`,
          ].join(" · "),
          cta: {
            label: "Relancer le paiement",
            url: "https://dukaio.com/dashboard/parametres",
          },
          footNote:
            "Aucun montant n'a été prélevé. Vous pouvez relancer la demande depuis Paramètres › Abonnement.",
        });
        await sendEmail(to, "DUKAIO — paiement non abouti", html);
      }
    } catch (e) {
      console.error("subscription failure email", e);
    }
  }

  if (paid) {
    const plan = payment.plan as PlanKey;
    const period = payment.billing_period as BillingPeriod;
    const activated = await activatePlan({
      storeId: payment.store_id,
      userId: payment.user_id,
      plan,
      period,
      provider: payment.provider,
      providerRef: payment.provider_ref,
      amount: Number(payment.amount),
    });
    /* Code promo utilisé : on comptabilise l'utilisation une seule fois. */
    try {
      const { consumePromo } = await import("@/lib/promo.server");
      await consumePromo(payment.promo_code ?? null);
    } catch (e) {
      console.error("promo consume", e);
    }
    /* Numéro de reçu lisible, dérivé de l'identifiant du paiement. */
    const receiptNumber = `DK-${String(payment.id).replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const paidAt = new Date().toISOString();
    const fcfa = (value: number) => `${Math.round(value).toLocaleString("fr-FR")} FCFA`;
    const { PLAN_CATALOG } = await import("@/lib/plans");
    const label = PLAN_CATALOG[plan].name;
    const methodLabel = payment.provider === "pawapay" ? "Mobile money" : "Carte bancaire";
    const discount = Number(payment.discount_amount ?? 0);

    /* Reçu par e-mail : non bloquant, un échec d'envoi ne doit pas annuler l'abonnement. */
    try {
      const { renderReceiptEmail, sendEmail } = await import("@/lib/email.server");
      const { data: user } = await store.auth.admin.getUserById(payment.user_id);
      const to = user?.user?.email;
      if (to) {
        const rows = [
          { label: "Reçu n°", value: receiptNumber },
          { label: "Date", value: new Date(paidAt).toLocaleString("fr-FR") },
          { label: "Formule", value: `${label} — ${period === "yearly" ? "annuel" : "mensuel"}` },
          { label: "Moyen de paiement", value: methodLabel },
          ...(payment.promo_code
            ? [
                { label: "Code promo", value: payment.promo_code },
                { label: "Remise", value: `− ${fcfa(discount)}` },
              ]
            : []),
          {
            label: "Abonnement valable jusqu'au",
            value: new Date(activated.periodEnd).toLocaleDateString("fr-FR"),
          },
        ];
        const html = renderReceiptEmail({
          title: "Merci, votre abonnement est actif",
          intro: `Votre paiement a bien été confirmé : la formule ${label} est activée sur votre compte DUKAIO.`,
          rows,
          totalLabel: "Total payé",
          totalValue: fcfa(Number(payment.amount)),
          footNote:
            "Conservez ce reçu comme justificatif. Vous retrouvez votre abonnement dans Abonnement › Formule actuelle.",
          cta: { label: "Ouvrir mon tableau de bord", url: "https://dukaio.com/dashboard" },
        });
        await sendEmail(to, `DUKAIO — reçu ${receiptNumber} · formule ${label}`, html);
      }
    } catch (e) {
      console.error("subscription receipt email", e);
    }

    return {
      status: "completed" as const,
      reason: null,
      receipt: {
        number: receiptNumber,
        paidAt,
        plan,
        planName: label,
        period,
        amount: Number(payment.amount),
        discount,
        promoCode: payment.promo_code ?? null,
        method: methodLabel,
        periodEnd: activated.periodEnd,
      },
    };
  }

  return { status: status as "completed" | "pending" | "failed", reason };
}

/** Retrouve un paiement par sa référence prestataire (webhooks). */
export async function paymentByRef(provider: string, ref: string) {
  const store = await db();
  const { data } = await store
    .from("subscription_payments")
    .select(
      "id, store_id, user_id, plan, billing_period, amount, provider, provider_ref, status, created_at",
    )
    .eq("provider", provider)
    .eq("provider_ref", ref)
    .maybeSingle();
  return (data as PaymentRow | null) ?? null;
}

export type { PaymentRow };
