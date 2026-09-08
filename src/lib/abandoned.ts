/**
 * Hooks « Panier abandonné » : liste, relance par e-mail et suppression.
 * Côté boutique publique, l'identifiant de session est gardé en local.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { sendCartRecovery } from "@/lib/abandoned.functions";

export type AbandonedCart = Tables<"abandoned_carts">;

export type CartItem = { productId: string; name: string; qty: number; unitPrice: number };

/** Articles enregistrés dans un panier abandonné. */
export function cartItems(cart: AbandonedCart): CartItem[] {
  const raw = cart.items as unknown;
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[])
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      productId: String(item["productId"] ?? ""),
      name: String(item["name"] ?? "Article"),
      qty: Number(item["qty"] ?? 1),
      unitPrice: Number(item["unitPrice"] ?? 0),
    }));
}

export function useAbandonedCarts(storeId: string | undefined) {
  return useQuery({
    queryKey: ["abandoned-carts", storeId],
    enabled: Boolean(storeId),
    queryFn: async (): Promise<AbandonedCart[]> => {
      const { data, error } = await supabase
        .from("abandoned_carts")
        .select("*")
        .eq("store_id", storeId!)
        .order("updated_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSendCartRecovery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cartId: string) => sendCartRecovery({ data: { cartId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["abandoned-carts"] }),
  });
}

export function useDeleteAbandonedCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("abandoned_carts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["abandoned-carts"] }),
  });
}

/** Identifiant de session du visiteur (stable par boutique et par navigateur). */
export function visitorSession(handle: string) {
  const key = `dukaio.sid.${handle.toLowerCase()}`;
  if (typeof window === "undefined") return "";
  try {
    const found = window.localStorage.getItem(key);
    if (found && found.length >= 8) return found;
    const fresh = crypto.randomUUID();
    window.localStorage.setItem(key, fresh);
    return fresh;
  } catch {
    return "";
  }
}
