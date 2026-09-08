/**
 * Catalogue des formules DUKAIO et droits associés.
 * Une seule source de vérité, utilisée par la landing, le tableau de bord,
 * l'application des limites côté serveur et la console admin.
 */

export type PlanKey = "free" | "starter" | "pro";
export type BillingPeriod = "monthly" | "yearly";

export type PlanLimits = {
  /** Nombre de boutiques autorisées. */
  stores: number;
  /** Produits par boutique (Infinity = illimité). */
  products: number;
  /** Créations IA par mois (0 = IA désactivée, tout se fait manuellement). */
  aiCredits: number;

  /** Membres d'équipe (closers, livreurs…) par boutique. */
  team: number;
  /** Domaine personnalisé autorisé. */
  customDomain: boolean;
  /** Badge « Propulsé par DUKAIO » retirable. */
  removeBadge: boolean;
  /** Support prioritaire 24/7. */
  prioritySupport: boolean;
};

export type Plan = {
  key: PlanKey;
  name: string;
  tagline: string;
  monthly: number;
  /** Prix annuel : 10 mois payés, 2 offerts. */
  yearly: number;
  popular: boolean;
  limits: PlanLimits;
  features: string[];
  missing: string[];
};

/** Plus d'essai gratuit : la formule Découverte est gratuite pour toujours. */
export const TRIAL_DAYS = 0;


export const PLAN_CATALOG: Record<PlanKey, Plan> = {
  free: {
    key: "free",
    name: "Découverte",
    tagline: "Lancez votre boutique gratuitement, à la main.",
    monthly: 0,
    yearly: 0,
    popular: false,
    limits: {
      stores: 1,
      products: 20,
      aiCredits: 0,
      team: 0,
      customDomain: false,
      removeBadge: false,
      prioritySupport: false,
    },
    features: [
      "1 boutique en ligne + lien partageable",
      "Jusqu'à 20 produits",
      "Commandes illimitées (paiement à la livraison)",
      "Panier, codes promo et offres",
      "Suivi des commandes et e-mails clients",
    ],
    missing: [
      "Pas de relance des paniers abandonnés",
      "Pas de recherche de marque en direct",
      "Découverte limitée : 10 boutiques et 15 publicités, sans recherche ni filtre",
      "Aucune création par IA — tout se fait manuellement",
      "Pas de domaine personnalisé",
      "Badge DUKAIO affiché sur la boutique",
    ],
  },
  starter: {
    key: "starter",
    name: "Starter",
    tagline: "Pour vendre sérieusement avec l'IA à vos côtés.",
    monthly: 4900,
    yearly: 49000,
    popular: false,
    limits: {
      stores: 1,
      products: 200,
      aiCredits: 10,
      team: 1,
      customDomain: false,
      removeBadge: false,
      prioritySupport: false,
    },
    features: [
      "Espace pub Découverte : 300 publicités, 80 boutiques, 150 produits",
      "Recherche et filtres dans la Découverte",
      "15 recherches de marque en direct par mois",
      "10 créations IA par mois (page produit complète)",
      "Jusqu'à 200 produits",
      "Relance automatique des paniers abandonnés par e-mail",
      "Analyses et visites en temps réel",
      "Support e-mail sous 24 h",
    ],
    missing: [
      "Pas de domaine personnalisé",
      "1 seule boutique",
      "Badge DUKAIO affiché sur la boutique",
    ],
  },
  pro: {
    key: "pro",
    name: "Pro",
    tagline: "Débloquez tout le potentiel de votre marque.",
    monthly: 14900,
    yearly: 149000,
    popular: true,
    limits: {
      stores: 5,
      products: Number.POSITIVE_INFINITY,
      aiCredits: 30,
      team: 5,
      customDomain: true,
      removeBadge: true,
      prioritySupport: true,
    },
    features: [
      "Espace pub Découverte prioritaire : 1 000 publicités, 300 boutiques, 500 produits",
      "Recherche et filtres dans la Découverte",
      "60 recherches de marque en direct par mois",
      "30 créations IA par mois",
      "Produits illimités",
      "Jusqu'à 5 boutiques",
      "Relance automatique des paniers abandonnés par e-mail",
      "Domaine personnalisé (votre-marque.com)",
      "Sans badge DUKAIO",
      "Robot de commande WhatsApp (à venir)",
      "Support prioritaire 24/7 (WhatsApp)",
    ],
    missing: [],
  },
};

export const PLAN_ORDER: PlanKey[] = ["free", "starter", "pro"];
export const PAID_PLANS: PlanKey[] = ["starter", "pro"];

export function isPlanKey(value: unknown): value is PlanKey {
  return value === "free" || value === "starter" || value === "pro";
}

export function planOf(value: unknown): Plan {
  return PLAN_CATALOG[isPlanKey(value) ? value : "free"];
}

export function priceOf(plan: PlanKey, period: BillingPeriod) {
  const p = PLAN_CATALOG[plan];
  return period === "yearly" ? p.yearly : p.monthly;
}

/** Économie réalisée en payant à l'année. */
export function yearlySaving(plan: PlanKey) {
  const p = PLAN_CATALOG[plan];
  return p.monthly * 12 - p.yearly;
}

export type SubscriptionLike = {
  plan: string;
  status: string;
  billing_period?: string | null;
  trial_ends_at?: string | null;
  period_end?: string | null;
  ai_used?: number | null;
  ai_period_start?: string | null;
} | null;

export type Entitlements = {
  plan: Plan;
  /** Formule réellement facturable (hors essai). */
  status: string;
  /** L'abonnement est-il actif (payé ou en essai valide) ? */
  active: boolean;
  trialing: boolean;
  trialDaysLeft: number;
  renewsAt: string | null;
  limits: PlanLimits;
  aiUsed: number;
  aiLeft: number;
};

/**
 * Calcule les droits effectifs. Il n'existe plus d'essai gratuit :
 * seule une formule payée et non expirée débloque l'IA et les limites élargies.
 */
export function entitlementsOf(sub: SubscriptionLike, now = new Date()): Entitlements {
  const periodEnd = sub?.period_end ? new Date(sub.period_end) : null;
  const paidActive =
    sub?.status === "active" &&
    (!periodEnd || periodEnd > now) &&
    isPlanKey(sub.plan) &&
    sub.plan !== "free";

  const effective: PlanKey = paidActive && isPlanKey(sub?.plan) ? sub.plan : "free";
  const plan = PLAN_CATALOG[effective];

  const aiStart = sub?.ai_period_start ? new Date(sub.ai_period_start) : null;
  const sameMonth =
    aiStart && aiStart.getFullYear() === now.getFullYear() && aiStart.getMonth() === now.getMonth();
  const aiUsed = sameMonth ? Number(sub?.ai_used ?? 0) : 0;

  return {
    plan,
    status: sub?.status ?? "none",
    active: paidActive,
    trialing: false,
    trialDaysLeft: 0,
    renewsAt: paidActive ? (sub?.period_end ?? null) : null,
    limits: plan.limits,
    aiUsed,
    aiLeft: Math.max(0, plan.limits.aiCredits - aiUsed),
  };
}


export const PLAN_LABEL: Record<string, string> = {
  free: "Découverte",
  starter: "Starter",
  pro: "Pro",
};

export const PERIOD_LABEL: Record<string, string> = {
  monthly: "Mensuel",
  yearly: "Annuel",
};
