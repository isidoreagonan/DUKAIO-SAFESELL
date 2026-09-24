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


import { useIsAdmin } from "@/lib/admin";
import { DISCOVERY_RULES } from "@/lib/discovery-plan";

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

/** L'IA (fiche produit, analyse d'un lien, visuels) : 1 offerte en essai 14j, puis réservée aux formules payantes. */
export function useAiAccess() {
  const query = useEntitlements();
  const { session, user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const email = (user?.email || session?.user?.email || "").toLowerCase().trim();
  const isOwnerOrAdmin = isAdmin === true || email === "isidoreagonan@gmail.com";

  const rawPlan = query.data?.plan ?? "free";
  const plan = isOwnerOrAdmin ? "pro" : rawPlan;
  const credits = isOwnerOrAdmin ? 9999 : (query.data?.limits?.aiCredits ?? 0);
  const unlimited = isOwnerOrAdmin || query.data?.unlimited === true;
  const trialing = !isOwnerOrAdmin && query.data?.trialing === true;
  const trialDaysLeft = query.data?.trialDaysLeft ?? 0;
  return {
    loading: (query.isLoading && !isOwnerOrAdmin) || (authLoading && !email),
    unlimited,
    allowed: unlimited || credits > 0,
    plan,
    planName: PLAN_CATALOG[plan].name,
    credits,
    aiUsed: query.data?.aiUsed ?? 0,
    aiLeft: isOwnerOrAdmin ? 9999 : (query.data?.aiLeft ?? 0),
    trialing,
    trialDaysLeft,
  };
}

/** Relance des paniers abandonnés : réservée aux formules Starter et Pro. */
export function useRecoveryAccess() {
  const query = useEntitlements();
  const { session, user, loading: authLoading } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const email = (user?.email || session?.user?.email || "").toLowerCase().trim();
  const isOwnerOrAdmin = isAdmin === true || email === "isidoreagonan@gmail.com";

  const rawPlan = query.data?.plan ?? "free";
  const plan = isOwnerOrAdmin ? "pro" : rawPlan;
  return {
    loading: (query.isLoading && !isOwnerOrAdmin) || (authLoading && !email),
    plan,
    planName: PLAN_CATALOG[plan].name,
    allowed: isOwnerOrAdmin || plan === "starter" || plan === "pro",
  };
}
/** Découverte : recherche et filtres réservés aux formules payantes. */
export function useDiscoveryAccess() {
  const query = useEntitlements();
  const { session, user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const email = (user?.email || session?.user?.email || "").toLowerCase().trim();
  const isOwnerOrAdmin = isAdmin === true || email === "isidoreagonan@gmail.com";

  const rawPlan = query.data?.plan ?? "free";
  const plan = isOwnerOrAdmin ? "pro" : rawPlan;
  const rules = isOwnerOrAdmin ? DISCOVERY_RULES.pro : discoveryRules(plan);
  const loading = (query.isLoading && !isOwnerOrAdmin) || (authLoading && !email) || (adminLoading && !email);

  return {
    loading,
    plan,
    planName: PLAN_CATALOG[plan].name,
    rules,
    /** Recherche, filtres et tri autorisés ? */
    allowed: isOwnerOrAdmin || rules.filters,
  };
}


/** Membres d'équipe autorisés par la formule (0 en Découverte). */
export function useTeamAccess() {
  const query = useEntitlements();
  const { session, user, loading: authLoading } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const email = (user?.email || session?.user?.email || "").toLowerCase().trim();
  const isOwnerOrAdmin = isAdmin === true || email === "isidoreagonan@gmail.com";

  const rawPlan = query.data?.plan ?? "free";
  const plan = isOwnerOrAdmin ? "pro" : rawPlan;
  const seats = isOwnerOrAdmin ? 999 : (query.data?.limits?.team ?? 0);
  return {
    loading: (query.isLoading && !isOwnerOrAdmin) || (authLoading && !email),
    allowed: isOwnerOrAdmin || seats > 0,
    seats,
    plan,
    planName: PLAN_CATALOG[plan].name,
  };
}
