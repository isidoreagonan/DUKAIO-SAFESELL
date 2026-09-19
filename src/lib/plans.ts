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

/** Durée de l'essai gratuit en jours lors de la création d'un compte. */
export const TRIAL_DAYS = 14;


export const PLAN_CATALOG: Record<PlanKey, Plan> = {
  free: {
    key: "free",
    name: "Essai Gratuit",
    tagline: "14 jours pour lancer votre boutique et tester l'IA DUKAIO.",
    monthly: 0,
    yearly: 0,
    popular: false,
    limits: {
      stores: 1,
      products: 20,
      aiCredits: 1,
      team: 0,
      customDomain: false,
      removeBadge: false,
      prioritySupport: false,
    },
    features: [
      "14 jours d'essai gratuit complet",
      "1 création de produit par IA offerte",
      "1 boutique en ligne publiable + lien partageable",
      "Jusqu'à 20 produits manuels",
      "Commandes illimitées (paiement à la livraison)",
      "Formulaire COD & contact WhatsApp",
      "Suivi des commandes et clients",
    ],
    missing: [
      "Catalogue publicités limité (15 aperçus sans filtres)",
      "Badge DUKAIO affiché sur la boutique",
      "Pas de domaine personnalisé",
      "Pas de relance des paniers abandonnés",
    ],
  },
  starter: {
    key: "starter",
    name: "Starter",
    tagline: "Pour vendre sérieusement en marque blanche avec l'IA.",
    monthly: 7900,
    yearly: 79000,
    popular: false,
    limits: {
      stores: 1,
      products: 200,
      aiCredits: 20,
      team: 1,
      customDomain: false,
      removeBadge: true,
      prioritySupport: false,
    },
    features: [
      "Sans badge DUKAIO (Boutique 100% à votre marque)",
      "Accès illimité aux publicités (espace Découverte)",
      "Recherche et filtres avancés (Publicités, Produits, Boutiques)",
      "20 créations IA par mois (page produit complète)",
      "Jusqu'à 200 produits",
      "Relance automatique des paniers abandonnés par e-mail",
      "Analyses et visites en temps réel",
      "Support e-mail sous 24 h",
    ],
    missing: [
      "Pas de domaine personnalisé (.com)",
      "1 seule boutique",
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
      aiCredits: 40,
      team: 5,
      customDomain: true,
      removeBadge: true,
      prioritySupport: true,
    },
    features: [
      "Sans badge DUKAIO (Marque blanche totale)",
      "Accès illimité et prioritaire aux publicités (espace Découverte)",
      "Recherche et filtres avancés (Publicités, Produits, Boutiques)",
      "Accès prioritaire à toutes les nouvelles tendances et analyses",
      "40 créations IA par mois",
      "Produits illimités",
      "Jusqu'à 5 boutiques",
      "Relance automatique des paniers abandonnés par e-mail",
      "Domaine personnalisé (votre-marque.com)",
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
  period_start?: string | null;
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
 * Calcule les droits effectifs avec gestion de l'essai gratuit 14 jours :
 * - Durant l'essai (14 jours) : 1 crédit IA d'accueil, boutique publiable.
 * - Après l'essai sans abonnement : boutique suspendue, 0 crédit IA.
 * - Formule payée (Starter / Pro) : limites débloquées, 20 ou 40 crédits IA.
 */
export function entitlementsOf(sub: SubscriptionLike, now = new Date()): Entitlements {
  const periodEnd = sub?.period_end ? new Date(sub.period_end) : null;
  const paidActive =
    sub?.status === "active" &&
    (!periodEnd || periodEnd > now) &&
    isPlanKey(sub.plan) &&
    sub.plan !== "free";

  // Gestion de l'essai gratuit 14 jours pour les nouveaux inscrits :
  // Un utilisateur est en essai s'il a un trial_ends_at défini ou le statut "trialing".
  // Les anciens comptes Free (trial_ends_at === null) restent sur l'ancien modèle Free :
  // boutique active sans limite de temps, 0 crédit IA, badge DUKAIO obligatoire.
  const isTrialSubject = Boolean(sub?.trial_ends_at || sub?.status === "trialing");
  const trialEnds = sub?.trial_ends_at ? new Date(sub.trial_ends_at) : null;

  const isTrialActive =
    !paidActive &&
    isTrialSubject &&
    trialEnds !== null &&
    trialEnds > now;

  const trialDaysLeft = isTrialActive && trialEnds
    ? Math.max(1, Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isTrialExpired = !paidActive && isTrialSubject && trialEnds !== null && trialEnds <= now;

  // Ancien compte Free conservé (boutique active, 0 IA)
  const isLegacyFree = !paidActive && !isTrialSubject;

  const effective: PlanKey = paidActive && isPlanKey(sub?.plan) ? sub.plan : "free";
  const plan = PLAN_CATALOG[effective];

  const aiStart = sub?.ai_period_start ? new Date(sub.ai_period_start) : null;
  const sameMonth =
    aiStart && aiStart.getFullYear() === now.getFullYear() && aiStart.getMonth() === now.getMonth();
  const aiUsed = sameMonth ? Number(sub?.ai_used ?? 0) : 0;

  const aiTotalCredits = paidActive ? plan.limits.aiCredits : isTrialActive ? 1 : 0;
  const aiLeft = Math.max(0, aiTotalCredits - aiUsed);
  const active = paidActive || isTrialActive || isLegacyFree;

  return {
    plan,
    status: paidActive ? "active" : isTrialActive ? "trialing" : isTrialExpired ? "expired" : "free",
    active,
    trialing: isTrialActive,
    trialDaysLeft,
    renewsAt: paidActive ? (sub?.period_end ?? null) : null,
    limits: {
      ...plan.limits,
      aiCredits: aiTotalCredits,
    },
    aiUsed,
    aiLeft,
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
