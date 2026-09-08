/**
 * API d'abonnement appelée par le tableau de bord.
 * Le client choisit une formule ; le serveur fixe le montant, crée le paiement,
 * appelle le prestataire puis n'active la formule qu'après vérification.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isPlanKey, type BillingPeriod, type PlanKey } from "@/lib/plans";

type Ctx = { userId: string; claims: Record<string, unknown> };

function planInput(input: unknown) {
  const raw = (input ?? {}) as Record<string, unknown>;
  const plan = raw["plan"];
  const period = raw["period"] === "yearly" ? "yearly" : "monthly";
  if (!isPlanKey(plan) || plan === "free") throw new Error("Choisissez une formule payante.");
  const promo = String(raw["promo"] ?? "").trim().toUpperCase().replace(/\s+/g, "");
  return { plan: plan as Exclude<PlanKey, "free">, period: period as BillingPeriod, promo };
}

/** État de l'abonnement + quotas de la boutique du vendeur. */
export const getSubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as unknown as Ctx;
    const { subscriptionState } = await import("@/lib/subscription.server");
    const state = await subscriptionState(userId);
    return {
      plan: state.plan.key,
      status: state.status,
      active: state.active,
      trialing: state.trialing,
      trialDaysLeft: state.trialDaysLeft,
      renewsAt: state.renewsAt,
      billingPeriod: state.subscription.billing_period ?? "monthly",
      aiUsed: state.aiUsed,
      aiLeft: state.aiLeft,
      unlimited: state.unlimited,
      limits: {
        ...state.limits,
        /* Infinity ne traverse pas proprement le réseau : null = illimité. */
        products: Number.isFinite(state.limits.products) ? state.limits.products : null,
      },
      storeId: state.storeId,
      storeName: state.storeName,
    };
  });

/** Historique des paiements d'abonnement de la boutique. */
export const listSubscriptionPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as unknown as Ctx;
    const { supabase } = context as unknown as {
      supabase: {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              c: string,
              v: string,
            ) => {
              order: (
                c: string,
                o: { ascending: boolean },
              ) => { limit: (n: number) => Promise<{ data: unknown }> };
            };
          };
        };
      };
    };
    const { data } = await supabase
      .from("subscription_payments")
      .select("id, plan, billing_period, amount, currency, provider, status, created_at, phone")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    return (data ?? []) as Array<{
      id: string;
      plan: string;
      billing_period: string;
      amount: number;
      currency: string;
      provider: string;
      status: string;
      created_at: string;
      phone: string | null;
    }>;
  });

/** Paiement mobile money : le vendeur valide la demande sur son téléphone. */
export const startMomoPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const raw = (input ?? {}) as Record<string, unknown>;
    const { plan, period, promo } = planInput(raw);
    const phone = String(raw["phone"] ?? "").trim();
    const provider = String(raw["provider"] ?? "").trim();
    if (phone.replace(/\D+/g, "").length < 8) throw new Error("Numéro de téléphone invalide.");
    if (!provider) throw new Error("Choisissez votre opérateur mobile money.");
    return { plan, period, promo, phone, provider };
  })
  .handler(async ({ data, context }) => {
    const { userId } = context as unknown as Ctx;
    const { primaryStore, expectedAmount } = await import("@/lib/subscription.server");
    const { pawapayDeposit, momoProvider } = await import("@/lib/billing.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { applyPromo } = await import("@/lib/promo.server");
    const store = await primaryStore(userId);
    const base = expectedAmount(data.plan, data.period);
    const promo = await applyPromo({ code: data.promo, plan: data.plan, period: data.period, amount: base });
    const amount = promo.amount;
    const operator = momoProvider(data.provider);
    const depositId = crypto.randomUUID();

    const { error } = await supabaseAdmin.from("subscription_payments").insert({
      id: depositId,
      store_id: store.id,
      user_id: userId,
      plan: data.plan,
      billing_period: data.period,
      amount,
      base_amount: base,
      promo_code: promo.code,
      discount_amount: promo.discount,
      currency: "XOF",
      provider: "pawapay",
      provider_ref: depositId,
      phone: data.phone,
      correspondent: operator.code,
      status: "pending",
    });
    if (error) throw new Error(error.message);

    try {
      await pawapayDeposit({
        depositId,
        amount,
        phone: data.phone,
        provider: operator.code,
        reference: depositId,
        storeName: store.store_name,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Paiement refusé.";
      await supabaseAdmin
        .from("subscription_payments")
        .update({ status: "failed", failure_reason: message })
        .eq("id", depositId);
      throw new Error(message);
    }

    return { paymentId: depositId, amount, operator: `${operator.operator} — ${operator.country}` };
  });

/** Logos officiels des opérateurs mobile money (source : configuration pawaPay). */
export const getMomoLogos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { pawapayProviderLogos } = await import("@/lib/billing.server");
    return { logos: await pawapayProviderLogos() };
  });

/** Paiement par carte bancaire : renvoie l'URL de la page 3D Secure. */
export const startCardPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => planInput(input))
  .handler(async ({ data, context }) => {
    const { userId, claims } = context as unknown as Ctx;
    const { primaryStore, expectedAmount } = await import("@/lib/subscription.server");
    const { ligdicashInvoice } = await import("@/lib/billing.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestHost } = await import("@tanstack/react-start/server");

    const { applyPromo } = await import("@/lib/promo.server");
    const store = await primaryStore(userId);
    const base = expectedAmount(data.plan, data.period);
    const promo = await applyPromo({ code: data.promo, plan: data.plan, period: data.period, amount: base });
    const amount = promo.amount;
    const paymentId = crypto.randomUUID();
    const host = getRequestHost({ xForwardedHost: true });
    const origin = host ? `https://${host}` : "https://dukaio.com";
    const email = typeof claims["email"] === "string" ? (claims["email"] as string) : "";

    const { error } = await supabaseAdmin.from("subscription_payments").insert({
      id: paymentId,
      store_id: store.id,
      user_id: userId,
      plan: data.plan,
      billing_period: data.period,
      amount,
      base_amount: base,
      promo_code: promo.code,
      discount_amount: promo.discount,
      currency: "XOF",
      provider: "ligdicash",
      status: "pending",
    });
    if (error) throw new Error(error.message);

    const invoice = await ligdicashInvoice({
      reference: paymentId,
      amount,
      label: `Abonnement DUKAIO ${data.plan} (${data.period === "yearly" ? "annuel" : "mensuel"})`,
      origin,
      customer: { firstName: store.store_name, lastName: "DUKAIO", email: email || "client@dukaio.com" },
    });

    await supabaseAdmin
      .from("subscription_payments")
      .update({ provider_ref: invoice.token })
      .eq("id", paymentId);

    return { paymentId, amount, url: invoice.url };
  });

/** Vérifie un paiement auprès du prestataire et active la formule si payée. */
export const checkPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const id = String((input as Record<string, unknown>)?.["paymentId"] ?? "");
    if (id.length < 10) throw new Error("Paiement inconnu.");
    return { paymentId: id };
  })
  .handler(async ({ data, context }) => {
    const { userId } = context as unknown as Ctx;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { reconcilePayment } = await import("@/lib/billing.server");

    const { data: row } = await supabaseAdmin
      .from("subscription_payments")
      .select(
        "id, store_id, user_id, plan, billing_period, amount, provider, provider_ref, status, created_at, promo_code, discount_amount",
      )
      .eq("id", data.paymentId)
      .maybeSingle();
    if (!row || row.user_id !== userId) throw new Error("Paiement introuvable.");

    const result = await reconcilePayment(row as never);
    return result;
  });

/** Vérifie qu'un produit supplémentaire reste dans la limite de la formule. */
export const assertProductQuota = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as unknown as Ctx;
    const { assertQuota } = await import("@/lib/subscription.server");
    const state = await assertQuota(userId, "product");
    return {
      plan: state.plan.key,
      limit: Number.isFinite(state.limits.products) ? state.limits.products : null,
    };
  });

/** Vérifie un code promo avant paiement et renvoie le prix remisé. */
export const previewPromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const raw = (input ?? {}) as Record<string, unknown>;
    const { plan, period } = planInput(raw);
    const code = String(raw["code"] ?? "").trim();
    if (code.length < 2) throw new Error("Saisissez votre code promo.");
    return { plan, period, code };
  })
  .handler(async ({ data }) => {
    const { expectedAmount } = await import("@/lib/subscription.server");
    const { applyPromo } = await import("@/lib/promo.server");
    const base = expectedAmount(data.plan, data.period);
    const result = await applyPromo({
      code: data.code,
      plan: data.plan,
      period: data.period,
      amount: base,
    });
    return { code: result.code, discount: result.discount, amount: result.amount, base };
  });
