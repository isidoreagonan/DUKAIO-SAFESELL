/**
 * Droits d'accès côté interface. La décision qui compte reste celle du serveur
 * (voir `subscription.server.ts`) : ici on masque simplement les outils payants
 * pour éviter à un vendeur de la formule gratuite un aller-retour inutile.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getSubscription } from "@/lib/billing.functions";
import { PLAN_CATALOG } from "@/lib/plans";
import { discoveryRules } from "@/lib/discovery-plan";


export function useEntitlements() {
  const fetchSub = useServerFn(getSubscription);
  /* Sans session (déconnexion, onglet expiré) l'appel protégé renvoie 401 :
     on attend donc que le jeton soit prêt avant d'interroger le serveur. */
  const { session, loading } = useAuth();
  return useQuery({
    queryKey: ["subscription", session?.user.id ?? null],
    queryFn: () => fetchSub(),
    enabled: !loading && !!session,
    staleTime: 60_000,
    retry: false,
  });
}

/** L'IA (fiche produit, analyse d'un lien, visuels) est réservée aux formules payantes. */
export function useAiAccess() {
  const query = useEntitlements();
  const plan = query.data?.plan ?? "free";
  const credits = query.data?.limits.aiCredits ?? 0;
  const unlimited = query.data?.unlimited === true;
  return {
    loading: query.isLoading,
    unlimited,
    allowed: unlimited || credits > 0,
    plan,
    planName: PLAN_CATALOG[plan].name,
    credits,
    aiUsed: query.data?.aiUsed ?? 0,
    aiLeft: query.data?.aiLeft ?? 0,
  };
}

/** Relance des paniers abandonnés : réservée aux formules Starter et Pro. */
export function useRecoveryAccess() {
  const query = useEntitlements();
  const plan = query.data?.plan ?? "free";
  return {
    loading: query.isLoading,
    plan,
    planName: PLAN_CATALOG[plan].name,
    allowed: plan === "starter" || plan === "pro",
  };
}
/** Découverte : recherche et filtres réservés aux formules payantes. */
export function useDiscoveryAccess() {
  const query = useEntitlements();
  const plan = query.data?.plan ?? "free";
  const rules = discoveryRules(plan);
  return {
    loading: query.isLoading,
    plan,
    planName: PLAN_CATALOG[plan].name,
    rules,
    /** Recherche, filtres et tri autorisés ? */
    allowed: rules.filters,
  };
}


/** Membres d'équipe autorisés par la formule (0 en Découverte). */
export function useTeamAccess() {
  const query = useEntitlements();
  const plan = query.data?.plan ?? "free";
  const seats = query.data?.limits.team ?? 0;
  return {
    loading: query.isLoading,
    allowed: seats > 0,
    seats,
    plan,
    planName: PLAN_CATALOG[plan].name,
  };
}
