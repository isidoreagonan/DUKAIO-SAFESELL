import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { slugify } from "@/lib/store";

export type Collection = Tables<"collections">;
export type Coupon = Tables<"coupons">;
export type Offer = Tables<"offers">;

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Session expirée");
  return data.user.id;
}

/* ---------------------------------- Collections --------------------------------- */

export type CollectionWithProducts = Collection & { productIds: string[] };

export function useCollections(storeId: string | undefined) {
  return useQuery({
    queryKey: ["collections", storeId],
    enabled: Boolean(storeId),
    queryFn: async (): Promise<CollectionWithProducts[]> => {
      const { data, error } = await supabase
        .from("collections")
        .select("*, collection_products(product_id)")
        .eq("store_id", storeId!)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => {
        const { collection_products: links, ...rest } = row as Collection & {
          collection_products: { product_id: string }[] | null;
        };
        return { ...rest, productIds: (links ?? []).map((l) => l.product_id) };
      });
    },
  });
}

export type CollectionInput = {
  name: string;
  description: string | null;
  image_url: string | null;
  is_published: boolean;
  productIds: string[];
};

export function useSaveCollection(storeId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string | undefined; values: CollectionInput }) => {
      const userId = await currentUserId();
      if (!storeId) throw new Error("Boutique introuvable");
      const base = {
        name: values.name.trim(),
        slug: slugify(values.name) || `collection-${Date.now().toString(36)}`,
        description: values.description,
        image_url: values.image_url,
        is_published: values.is_published,
      };
      let collectionId = id;
      if (collectionId) {
        const update: TablesUpdate<"collections"> = base;
        const { error } = await supabase
          .from("collections")
          .update(update)
          .eq("id", collectionId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const insert: TablesInsert<"collections"> = { ...base, user_id: userId, store_id: storeId };
        const { data, error } = await supabase
          .from("collections")
          .insert(insert)
          .select("id")
          .single();
        if (error) throw error;
        collectionId = data.id;
      }

      const { error: clearError } = await supabase
        .from("collection_products")
        .delete()
        .eq("collection_id", collectionId!);
      if (clearError) throw clearError;
      if (values.productIds.length) {
        const { error: linkError } = await supabase.from("collection_products").insert(
          values.productIds.map((productId, index) => ({
            collection_id: collectionId!,
            product_id: productId,
            position: index,
          })),
        );
        if (linkError) throw linkError;
      }
      return collectionId!;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["collections"] }),
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["collections"] }),
  });
}

/* ------------------------------------ Coupons ----------------------------------- */

export function useCoupons(storeId: string | undefined) {
  return useQuery({
    queryKey: ["coupons", storeId],
    enabled: Boolean(storeId),
    queryFn: async (): Promise<Coupon[]> => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type CouponInput = {
  code: string;
  type: Coupon["type"];
  value: number;
  min_subtotal: number;
  max_uses: number | null;
  ends_at: string | null;
  product_id: string | null;
  is_active: boolean;
};

export function useSaveCoupon(storeId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string | undefined; values: CouponInput }) => {
      const userId = await currentUserId();
      if (!storeId) throw new Error("Boutique introuvable");
      const payload = { ...values, code: values.code.trim().toUpperCase() };
      if (id) {
        const { error } = await supabase
          .from("coupons")
          .update(payload as TablesUpdate<"coupons">)
          .eq("id", id)
          .eq("user_id", userId);
        if (error) throw error;
        return id;
      }
      const insert: TablesInsert<"coupons"> = { ...payload, user_id: userId, store_id: storeId };
      const { data, error } = await supabase.from("coupons").insert(insert).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

/* ------------------------------------- Offers ----------------------------------- */

export function useOffers(storeId: string | undefined) {
  return useQuery({
    queryKey: ["offers", storeId],
    enabled: Boolean(storeId),
    queryFn: async (): Promise<Offer[]> => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type OfferInput = {
  name: string;
  type: Offer["type"];
  product_id: string | null;
  tiers: { qty: number; discount: number; label?: string; tag?: string }[];
  buy_quantity: number;
  get_quantity: number;
  /** X acheté / Y offert : produit offert (null = le même produit). */
  gift_product_id: string | null;
  min_subtotal: number;
  /** Livraison offerte : seuil en articles et frais facturés avant le seuil. */
  min_quantity: number;
  shipping_fee: number;
  /** Pack combo : produits liés et remise appliquée. */
  combo_product_ids: string[];
  discount_percent: number;
  is_active: boolean;
};


export function useSaveOffer(storeId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string | undefined; values: OfferInput }) => {
      const userId = await currentUserId();
      if (!storeId) throw new Error("Boutique introuvable");
      const payload = { ...values, name: values.name.trim(), tiers: values.tiers };
      if (id) {
        const { error } = await supabase
          .from("offers")
          .update(payload as TablesUpdate<"offers">)
          .eq("id", id)
          .eq("user_id", userId);
        if (error) throw error;
        return id;
      }
      const insert: TablesInsert<"offers"> = { ...payload, user_id: userId, store_id: storeId };
      const { data, error } = await supabase.from("offers").insert(insert).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["offers"] }),
  });
}

export function useDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["offers"] }),
  });
}
