/**
 * Règles de la Découverte par formule d'abonnement.
 * Une seule source de vérité, appliquée côté serveur (`discovery.functions.ts`)
 * et reprise côté interface pour afficher la fenêtre d'abonnement.
 */
export type DiscoveryPlanKey = "free" | "starter" | "pro";

export type DiscoveryRules = {
  /** Publicités visibles au maximum. */
  ads: number;
  /** Boutiques visibles au maximum. */
  stores: number;
  /** Produits visibles au maximum. */
  products: number;
  /** Recherche et filtres autorisés. */
  filters: boolean;
  /** Recherches de marque en direct autorisées par mois (0 = interdit). */
  liveSearches: number;
  /** Niche imposée (formule gratuite). */
  category: string | null;
  /** Pays imposé (formule gratuite). */
  country: string | null;
};

export const FREE_CATEGORY = "Beauté & soin";
export const FREE_COUNTRY = "FR";

export const DISCOVERY_RULES: Record<DiscoveryPlanKey, DiscoveryRules> = {
  free: {
    ads: 15,
    stores: 10,
    products: 15,
    filters: false,
    liveSearches: 0,
    category: FREE_CATEGORY,
    country: FREE_COUNTRY,
  },
  starter: {
    ads: 600,
    stores: 400,
    products: 400,
    filters: true,
    liveSearches: 15,
    category: null,
    country: null,
  },
  pro: {
    ads: 2000,
    stores: 2000,
    products: 2000,
    filters: true,
    liveSearches: 60,
    category: null,
    country: null,
  },
};


export function discoveryRules(plan: string | null | undefined): DiscoveryRules {
  if (plan === "pro") return DISCOVERY_RULES.pro;
  if (plan === "starter") return DISCOVERY_RULES.starter;
  return DISCOVERY_RULES.free;
}
