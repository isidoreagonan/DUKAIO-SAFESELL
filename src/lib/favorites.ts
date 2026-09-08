/**
 * Favoris de la Découverte : boutiques, produits et publicités sauvegardés par
 * le vendeur. Lecture et écriture directes en base (chaque vendeur ne voit que
 * ses propres favoris) avec mise à jour immédiate de l'affichage.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type FavoriteKind = "ad" | "store" | "product";

/** Copie d'affichage : le favori reste lisible même si la pub disparaît. */
export type FavoritePayload = {
  title: string;
  subtitle?: string | null;
  image?: string | null;
  avatar?: string | null;
  domain?: string | null;
  link?: string | null;
  adId?: string | null;
  activeAds?: number | null;
  days?: number | null;
  startedAt?: string | null;
  country?: string | null;
  price?: string | null;
  source?: string | null;
};

export type Favorite = {
  id: string;
  kind: FavoriteKind;
  ref_id: string;
  payload: FavoritePayload;
  created_at: string;
};

export const FAVORITES_LIMIT = 200;

export const FAVORITE_LABELS: Record<FavoriteKind, string> = {
  store: "Boutiques",
  product: "Produits",
  ad: "Publicités",
};

function favoriteKey(kind: FavoriteKind, refId: string) {
  return `${kind}:${refId}`;
}

/** Tous les favoris du vendeur connecté, du plus récent au plus ancien. */
export function useFavorites() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["discovery-favorites", session?.user.id ?? null],
    enabled: !!session,
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discovery_favorites")
        .select("id, kind, ref_id, payload, created_at")
        .order("created_at", { ascending: false })
        .limit(FAVORITES_LIMIT);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        id: row.id,
        kind: row.kind as FavoriteKind,
        ref_id: row.ref_id,
        payload: (row.payload ?? {}) as FavoritePayload,
        created_at: row.created_at,
      })) as Favorite[];
    },
  });
}

/** Clés déjà en favoris, pour colorer les cœurs sans requête supplémentaire. */
export function useFavoriteKeys() {
  const { data } = useFavorites();
  return new Set((data ?? []).map((item) => favoriteKey(item.kind, item.ref_id)));
}

/** Ajoute ou retire un favori (le cœur change tout de suite). */
export function useToggleFavorite() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const key = ["discovery-favorites", session?.user.id ?? null];

  return useMutation({
    mutationFn: async (input: { kind: FavoriteKind; refId: string; payload: FavoritePayload }) => {
      const userId = session?.user.id;
      if (!userId) throw new Error("Connectez-vous pour enregistrer un favori.");
      const { data: existing } = await supabase
        .from("discovery_favorites")
        .select("id")
        .eq("kind", input.kind)
        .eq("ref_id", input.refId)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from("discovery_favorites").delete().eq("id", existing.id);
        if (error) throw new Error(error.message);
        return { removed: true };
      }
      const { count } = await supabase
        .from("discovery_favorites")
        .select("id", { count: "exact", head: true });
      if (Number(count ?? 0) >= FAVORITES_LIMIT) {
        throw new Error(`Votre liste de favoris est pleine (${FAVORITES_LIMIT} éléments).`);
      }
      const { error } = await supabase.from("discovery_favorites").insert({
        user_id: userId,
        kind: input.kind,
        ref_id: input.refId,
        payload: input.payload as never,
      });
      if (error) throw new Error(error.message);
      return { removed: false };
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Favorite[]>(key) ?? [];
      const already = previous.some(
        (item) => item.kind === input.kind && item.ref_id === input.refId,
      );
      qc.setQueryData<Favorite[]>(
        key,
        already
          ? previous.filter((item) => !(item.kind === input.kind && item.ref_id === input.refId))
          : [
              {
                id: `local-${input.kind}-${input.refId}`,
                kind: input.kind,
                ref_id: input.refId,
                payload: input.payload,
                created_at: new Date().toISOString(),
              },
              ...previous,
            ],
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["discovery-favorites"] });
    },
  });
}

/** Retire un favori depuis la page « Mes Favoris ». */
export function useRemoveFavorite() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const key = ["discovery-favorites", session?.user.id ?? null];
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("discovery_favorites").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return true;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Favorite[]>(key) ?? [];
      qc.setQueryData<Favorite[]>(key, previous.filter((item) => item.id !== id));
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["discovery-favorites"] });
    },
  });
}
