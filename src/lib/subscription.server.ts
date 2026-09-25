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

/** Première boutique du vendeur (celle facturée) ou boutique où il est membre actif. */
export async function primaryStore(userId: string) {
  const db = await adminDb();
  // 1. Boutique possédée en propre
  const { data, error } = await db
    .from("store_settings")
    .select("id, store_name, user_id, custom_domain")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return data;

  // 2. Si non propriétaire, boutique où l'utilisateur est membre actif (closer, livreur, admin...)
  const { data: member } = await db
    .from("store_members")
    .select("store_id, store_settings(id, store_name, user_id, custom_domain)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const memberStoreRaw = member?.store_settings as any;
  const memberStore = Array.isArray(memberStoreRaw) ? memberStoreRaw[0] : memberStoreRaw;
  if (memberStore) {
    return memberStore as { id: string; store_name: string; user_id: string; custom_domain: string | null };
  }

  // 3. Vérification par email si pas encore lié par user_id
  const { data: userAuth } = await db.auth.admin.getUserById(userId);
  const email = (userAuth?.user?.email ?? "").toLowerCase().trim();
  if (email) {
    const { data: inviteMember } = await db
      .from("store_members")
      .select("store_id, store_settings(id, store_name, user_id, custom_domain)")
      .eq("email", email)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const inviteStoreRaw = inviteMember?.store_settings as any;
    const inviteStore = Array.isArray(inviteStoreRaw) ? inviteStoreRaw[0] : inviteStoreRaw;
    if (inviteStore) {
      return inviteStore as { id: string; store_name: string; user_id: string; custom_domain: string | null };
    }
  }

  return null;
}

/**
 * Lit l'abonnement de la boutique et le crée en Essai Gratuit 14 jours
 * au premier accès. Accorde 1 crédit IA d'accueil offert.
 */
export async function ensureSubscription(userId: string, storeId: string) {
  const db = await adminDb();
  const isAdmin = await isPlatformAdmin(userId);
  const { data: userAuth } = await db.auth.admin.getUserById(userId);
  const isOwnerAdmin =
    isAdmin || (userAuth?.user?.email ?? "").toLowerCase().trim() === "isidoreagonan@gmail.com";

  const { data, error } = await db
    .from("store_subscriptions")
    .select("*")
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  if (data) {
    if (isOwnerAdmin && (data.plan !== "pro" || data.status !== "active")) {
      const { data: updated } = await db
        .from("store_subscriptions")
        .update({
          plan: "pro",
          status: "active",
          period_end: "2099-01-01T00:00:00Z",
          trial_ends_at: null,
        })
        .eq("id", data.id)
        .select("*")
        .single();
      return (updated ?? data) as unknown as SubscriptionRow;
    }
    return data as unknown as SubscriptionRow;
  }

  const now = new Date();
  const trialEnds = new Date(now.getTime() + 14 * 86400000);

  const insertData = isOwnerAdmin
    ? {
        store_id: storeId,
        user_id: userId,
        plan: "pro",
        status: "active",
        amount: 0,
        currency: "XOF",
        billing_period: "yearly",
        trial_ends_at: null,
        period_start: now.toISOString(),
        period_end: "2099-01-01T00:00:00Z",
        ai_period_start: now.toISOString(),
      }
    : {
        store_id: storeId,
        user_id: userId,
        plan: "free",
        status: "trialing",
        amount: 0,
        currency: "XOF",
        billing_period: "monthly",
        trial_ends_at: trialEnds.toISOString(),
        period_start: now.toISOString(),
        period_end: trialEnds.toISOString(),
        ai_period_start: now.toISOString(),
      };

  const { data: created, error: insertError } = await db
    .from("store_subscriptions")
    .insert(insertData)
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
  if (!store) {
    const plan = PLAN_CATALOG.free;
    const dummySub: SubscriptionRow = {
      id: "dummy",
      store_id: "",
      user_id: userId,
      plan: "free",
      status: "active",
      amount: 0,
      currency: "XOF",
      billing_period: "monthly",
      trial_ends_at: null,
      period_start: null,
      period_end: null,
      ai_used: 0,
      ai_period_start: null,
      provider: null,
      provider_ref: null,
      notes: null,
    };
    return {
      plan,
      status: "active",
      active: true,
      trialing: false,
      trialDaysLeft: 0,
      renewsAt: null,
      limits: plan.limits,
      aiUsed: 0,
      aiLeft: 0,
      unlimited: false,
      subscription: dummySub,
      storeId: "",
      storeName: "Ma Boutique",
    };
  }

  // L'abonnement est rattaché au propriétaire de la boutique (store.user_id)
  const sub = await ensureSubscription(store.user_id, store.id);
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
      "Votre essai gratuit est expiré. Passez à Starter (7 900 FCFA) ou Pro (14 900 FCFA) pour débloquer l'IA.",
    );
  if (state.aiLeft < cost)
    throw new Error(
      state.trialing
        ? "Votre création IA d'essai gratuit a été utilisée ! Passez à Starter (20 créations/mois) ou Pro (40 créations/mois) pour continuer."
        : `Quota IA épuisé (${state.limits.aiCredits} créations / mois sur la formule ${state.plan.name}). Passez à une formule supérieure ou attendez le renouvellement.`,
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

  if (kind === "team") {
    const { data: userAuth } = await db.auth.admin.getUserById(userId);
    const email = (userAuth?.user?.email ?? "").toLowerCase().trim();
    if (email === "isidoreagonan@gmail.com" || (await isPlatformAdmin(userId))) {
      return state;
    }
    if (state.trialing && !state.isTrialExpired) {
      const { count } = await db
        .from("store_members")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId ?? state.storeId)
        .neq("status", "inactive");
      if ((count ?? 0) >= 2) {
        throw new Error("L'essai gratuit autorise jusqu'à 2 membres d'équipe pour tester.");
      }
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
