/**
 * Cœur serveur du système d'abonnement : lecture de l'abonnement d'une boutique,
 * ouverture de l'essai gratuit, application des quotas et activation après paiement.
 * Toutes les décisions de facturation sont prises ici, jamais côté client.
 */
import {
  PLAN_CATALOG,
  entitlementsOf,
  isPlanKey,
  priceOf,
  type BillingPeriod,
  type Entitlements,
  type PlanKey,
} from "@/lib/plans";


type Db = Awaited<ReturnType<typeof adminDb>>;

async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export type SubscriptionRow = {
  id: string;
  store_id: string;
  user_id: string;
  plan: string;
  status: string;
  amount: number;
  currency: string;
  billing_period: string | null;
  trial_ends_at: string | null;
  period_start: string | null;
  period_end: string | null;
  ai_used: number | null;
  ai_period_start: string | null;
  provider: string | null;
  provider_ref: string | null;
  notes: string | null;
};

/** Première boutique du vendeur (celle facturée). */
export async function primaryStore(userId: string) {
  const db = await adminDb();
  const { data, error } = await db
    .from("store_settings")
    .select("id, store_name, user_id, custom_domain")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Créez d'abord votre boutique.");
  return data;
}

/**
 * Lit l'abonnement de la boutique et le crée en formule Découverte (gratuite,
 * sans essai) au premier accès. L'IA reste fermée jusqu'au passage en payant.
 */
export async function ensureSubscription(userId: string, storeId: string) {
  const db = await adminDb();
  const { data, error } = await db
    .from("store_subscriptions")
    .select("*")
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return data as unknown as SubscriptionRow;

  const now = new Date();
  const { data: created, error: insertError } = await db
    .from("store_subscriptions")
    .insert({
      store_id: storeId,
      user_id: userId,
      plan: "free",
      status: "free",
      amount: 0,
      currency: "XOF",
      billing_period: "monthly",
      trial_ends_at: null,
      period_start: now.toISOString(),
      period_end: null,
      ai_period_start: now.toISOString(),
    })
    .select("*")
    .single();
  if (insertError) throw new Error(insertError.message);
  return created as unknown as SubscriptionRow;
}


export type SubscriptionState = Entitlements & {
  /** Compte administrateur : aucune limite de créations IA. */
  unlimited: boolean;
  subscription: SubscriptionRow;
  storeId: string;
  storeName: string;
};

/** Un compte portant le rôle admin utilise DUKAIO sans abonnement (formule Pro offerte). */
async function isPlatformAdmin(userId: string) {
  const db = await adminDb();
  const { data } = await db.rpc("has_role", { _user_id: userId, _role: "admin" });
  return data === true;
}

export async function subscriptionState(userId: string): Promise<SubscriptionState> {
  const store = await primaryStore(userId);
  const sub = await ensureSubscription(userId, store.id);
  if (await isPlatformAdmin(userId)) {
    const plan = PLAN_CATALOG.pro;
    /* Un admin bénéficie des limites Pro, mais son solde IA reste décompté
       normalement pour que le compteur affiché suive les créations réelles. */
    const base = entitlementsOf({ ...sub, plan: "pro", status: "active" });
    return {
      plan,
      status: sub.status,
      active: true,
      trialing: false,
      trialDaysLeft: 0,
      renewsAt: null,
      limits: plan.limits,
      aiUsed: base.aiUsed,
      aiLeft: Number.MAX_SAFE_INTEGER,
      unlimited: true,
      subscription: sub,
      storeId: store.id,
      storeName: store.store_name,
    };
  }

  return {
    ...entitlementsOf(sub),
    unlimited: false,
    subscription: sub,
    storeId: store.id,
    storeName: store.store_name,
  };
}

/** Vérifie un quota d'IA disponible et le consomme. Lève une erreur explicite sinon. */
export async function consumeAiCredit(userId: string, cost = 1) {
  const state = await subscriptionState(userId);
  if (state.unlimited) return { left: Number.MAX_SAFE_INTEGER, plan: state.plan.key };
  if (state.limits.aiCredits === 0)
    throw new Error(
      "La création par IA est réservée aux formules Starter et Pro. Passez à une formule payante ou créez votre page manuellement.",
    );
  if (state.aiLeft < cost)
    throw new Error(
      `Quota IA épuisé (${state.limits.aiCredits} créations / mois sur la formule ${state.plan.name}). Passez à une formule supérieure ou attendez le renouvellement.`,
    );

  const db = await adminDb();
  const now = new Date();
  const start = state.subscription.ai_period_start
    ? new Date(state.subscription.ai_period_start)
    : null;
  const sameMonth =
    start && start.getFullYear() === now.getFullYear() && start.getMonth() === now.getMonth();
  const periodStart =
    sameMonth && state.subscription.ai_period_start
      ? state.subscription.ai_period_start
      : new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { error } = await db
    .from("store_subscriptions")
    .update({
      ai_used: (sameMonth ? state.aiUsed : 0) + cost,
      ai_period_start: periodStart,
    })
    .eq("id", state.subscription.id);
  if (error) throw new Error(error.message);
  return { left: state.aiLeft - cost, plan: state.plan.key };
}

/** Vérifie qu'une nouvelle boutique ou un nouveau produit reste dans les limites. */
export async function assertQuota(
  userId: string,
  kind: "product" | "store" | "team",
  storeId?: string,
) {
  const state = await subscriptionState(userId);
  const db = await adminDb();

  if (kind === "store") {
    const { count } = await db
      .from("store_settings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((count ?? 0) >= state.limits.stores)
      throw new Error(
        `Votre formule ${state.plan.name} autorise ${state.limits.stores} boutique(s). Passez au plan Pro pour en ouvrir davantage.`,
      );
    return state;
  }

  if (kind === "product") {
    if (!Number.isFinite(state.limits.products)) return state;
    const { count } = await db
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId ?? state.storeId);
    if ((count ?? 0) >= state.limits.products)
      throw new Error(
        `Votre formule ${state.plan.name} est limitée à ${state.limits.products} produits. Passez à une formule supérieure pour en ajouter.`,
      );
    return state;
  }

  const { count } = await db
    .from("store_members")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId ?? state.storeId)
    .neq("status", "inactive");
  if ((count ?? 0) >= state.limits.team)
    throw new Error(
      state.limits.team === 0
        ? `La gestion d'équipe est réservée aux formules payantes.`
        : `Votre formule ${state.plan.name} autorise ${state.limits.team} membre(s) d'équipe.`,
    );
  return state;
}

/** Active la formule payée après confirmation du prestataire de paiement. */
export async function activatePlan(input: {
  storeId: string;
  userId: string;
  plan: PlanKey;
  period: BillingPeriod;
  provider: string;
  providerRef: string | null;
  amount: number;
}) {
  const db = await adminDb();
  const now = new Date();
  const end = new Date(now);
  if (input.period === "yearly") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);

  const { error } = await db.from("store_subscriptions").upsert(
    {
      store_id: input.storeId,
      user_id: input.userId,
      plan: input.plan,
      status: "active",
      amount: input.amount,
      currency: "XOF",
      billing_period: input.period,
      period_start: now.toISOString(),
      period_end: end.toISOString(),
      trial_ends_at: null,
      provider: input.provider,
      provider_ref: input.providerRef,
    },
    { onConflict: "store_id" },
  );
  if (error) throw new Error(error.message);
  return { periodEnd: end.toISOString() };
}

export function expectedAmount(plan: PlanKey, period: BillingPeriod) {
  if (!isPlanKey(plan) || plan === "free") throw new Error("Formule payante invalide.");
  const amount = priceOf(plan, period);
  if (!amount || amount <= 0) throw new Error("Montant d'abonnement invalide.");
  return amount;
}

export { PLAN_CATALOG };
export type { Db };
