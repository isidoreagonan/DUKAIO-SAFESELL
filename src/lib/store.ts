import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type StoreSettings = Tables<"store_settings">;
export type Product = Tables<"products">;
export type Order = Tables<"orders">;

export function formatFcfa(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Session expirée");
  return data.user.id;
}

/* Boutique active : le vendeur peut en posséder plusieurs (formule Pro). */
const ACTIVE_KEY = "dukaio.activeStore";

export function activeStoreId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_KEY);
}

export function setActiveStoreId(id: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(ACTIVE_KEY, id);
}

async function listStores(userId: string) {
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Toutes les boutiques du vendeur, dans l'ordre de création. */
export function useStores() {
  return useQuery({
    queryKey: ["stores"],
    queryFn: async (): Promise<StoreSettings[]> => listStores(await currentUserId()),
  });
}

/** Récupère la boutique active du vendeur, la crée au premier accès. */
export function useStore() {
  return useQuery({
    queryKey: ["store"],
    queryFn: async (): Promise<StoreSettings> => {
      const userId = await currentUserId();
      const stores = await listStores(userId);
      if (stores.length) {
        const wanted = activeStoreId();
        const found = stores.find((s) => s.id === wanted) ?? stores[0]!;
        setActiveStoreId(found.id);
        return found;
      }

      const { data: userRes } = await supabase.auth.getUser();
      const meta = (userRes.user?.user_metadata ?? {}) as Record<string, unknown>;
      const storeName =
        (typeof meta["store_name"] === "string" && meta["store_name"]) || "Ma Boutique";
      const base = slugify(String(storeName)) || "boutique";
      const insert: TablesInsert<"store_settings"> = {
        user_id: userId,
        store_name: String(storeName),
        subdomain: `${base}-${userId.slice(0, 6)}`,
      };
      const { data: created, error: createError } = await supabase
        .from("store_settings")
        .insert(insert)
        .select("*")
        .single();
      if (createError) throw createError;
      setActiveStoreId(created.id);
      return created;
    },
  });
}

/** Crée une boutique supplémentaire (limite de la formule vérifiée côté serveur). */
export function useCreateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { createStore } = await import("@/lib/stores.functions");
      return createStore({ data: { name } });
    },
    onSuccess: (created) => {
      setActiveStoreId(created.id);
      qc.clear();
      void qc.invalidateQueries();
    },
  });
}

/** Bascule sur une autre boutique : tout le tableau de bord se recharge. */
export function useSwitchStore() {
  const qc = useQueryClient();
  return (id: string) => {
    setActiveStoreId(id);
    qc.clear();
    void qc.invalidateQueries();
  };
}



export function useUpdateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<"store_settings"> }) => {
      const { data, error } = await supabase
        .from("store_settings")
        .update(values)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["store"] }),
  });
}

/**
 * Portée des données : chaque boutique a ses propres produits et commandes.
 * La boutique la plus ancienne récupère aussi les lignes créées avant
 * l'arrivée du multi-boutique (store_id vide).
 */
async function scope() {
  const stores = await listStores(await currentUserId());
  const wanted = activeStoreId();
  const active = stores.find((s) => s.id === wanted) ?? stores[0];
  return { id: active?.id ?? null, primary: !!active && active.id === stores[0]?.id };
}

function scopeFilter<T extends { eq: (c: string, v: string) => T; or: (f: string) => T }>(
  query: T,
  s: { id: string | null; primary: boolean },
) {
  if (!s.id) return query;
  return s.primary ? query.or(`store_id.eq.${s.id},store_id.is.null`) : query.eq("store_id", s.id);
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const s = await scope();
      const { data, error } = await scopeFilter(
        supabase.from("products").select("*"),
        s,
      ).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["product", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string | undefined;
      values: Omit<TablesInsert<"products">, "user_id">;
    }) => {
      const userId = await currentUserId();
      if (id) {
        const { data, error } = await supabase
          .from("products")
          .update(values)
          .eq("id", id)
          .eq("user_id", userId)
          .select("*")
          .single();
        if (error) throw error;
        return data;
      }
      /* Limite de produits selon la formule (vérifiée côté serveur). */
      const { assertProductQuota } = await import("@/lib/billing.functions");
      await assertProductQuota();
      /* Le produit appartient à la boutique active. */
      const sc = await scope();
      const { data, error } = await supabase
        .from("products")
        .insert({ store_id: sc.id, ...values, user_id: userId })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["products"] });
      void qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

/**
 * Supprime un produit ET uniquement les médias qui lui sont liés
 * (image principale, galerie, vidéo) : fichiers du stockage et lignes
 * correspondantes de la bibliothèque média. Les autres médias sont conservés.
 */
export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const userId = await currentUserId();

      /* 1. Récupère les visuels du produit avant sa suppression. */
      const { data: product, error: readError } = await supabase
        .from("products")
        .select("image_url, images, video_url")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
      if (readError) throw readError;

      const mediaUrls = new Set(
        [product?.image_url, product?.video_url, ...(product?.images ?? [])].filter(
          (u): u is string => typeof u === "string" && u.length > 0,
        ),
      );

      /* 2. Supprime le produit (bloque si la base refuse). */
      const { error } = await supabase.from("products").delete().eq("id", id).eq("user_id", userId);
      if (error) throw error;

      /* 3. Nettoie les médias liés : on ne touche qu'aux fichiers dont l'URL
            était utilisée par ce produit. Un échec ici ne doit pas annuler
            la suppression du produit déjà effective. */
      if (mediaUrls.size > 0) {
        try {
          const { data: assets } = await supabase
            .from("media_library")
            .select("id, url, storage_path")
            .eq("user_id", userId);
          const linked = (assets ?? []).filter((a) => mediaUrls.has(a.url));
          const paths = linked
            .map((a) => a.storage_path)
            .filter((p): p is string => typeof p === "string" && p.length > 0);
          if (paths.length > 0) await supabase.storage.from("store-media").remove(paths);
          if (linked.length > 0) {
            await supabase
              .from("media_library")
              .delete()
              .in(
                "id",
                linked.map((a) => a.id),
              )
              .eq("user_id", userId);
          }
        } catch (e) {
          console.error("Nettoyage des médias du produit", e);
        }
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["products"] });
      void qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async (): Promise<Order[]> => {
      const s = await scope();
      const { data, error } = await scopeFilter(supabase.from("orders").select("*"), s).order(
        "created_at",
        { ascending: false },
      );
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type OrderItem = Tables<"order_items">;

/** Nombre d'articles par commande, pour les listes. */
export function useOrderItemCounts() {
  return useQuery({
    queryKey: ["order-item-counts"],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase.from("order_items").select("order_id, quantity");
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data ?? []) {
        map[row.order_id] = (map[row.order_id] ?? 0) + (row.quantity ?? 1);
      }
      return map;
    },
  });
}

/** Lignes d'une commande (produits, quantités, prix unitaires). */
export function useOrderItems(orderId: string | undefined) {

  return useQuery({
    queryKey: ["order-items", orderId],
    enabled: Boolean(orderId),
    queryFn: async (): Promise<OrderItem[]> => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function invalidateOrders(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["orders"] });
  void qc.invalidateQueries({ queryKey: ["stats"] });
  void qc.invalidateQueries({ queryKey: ["analytics"] });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: Order["status"];
    }) => {
      const values: TablesUpdate<"orders"> = { status };
      if (status === "completed") values.escrow_released_at = new Date().toISOString();
      const { error } = await supabase.from("orders").update(values).eq("id", id);
      if (error) throw error;
      /* Le client reçoit la mise à jour par e-mail (silencieux en cas d'échec). */
      const { notifyOrderStatus } = await import("@/lib/order-emails.functions");
      await notifyOrderStatus({ data: { orderId: id, status } }).catch(() => null);
    },
    onSuccess: () => invalidateOrders(qc),
  });
}


/** Mise à jour libre d'une commande (note interne, coordonnées…). */
export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<"orders"> }) => {
      const { error } = await supabase.from("orders").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateOrders(qc),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("order_items").delete().eq("order_id", id);
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateOrders(qc),
  });
}

export type DashboardStats = {
  /** Chiffre d'affaires de toutes les commandes non perdues */
  revenue: number;
  /** Chiffre d'affaires réellement livré */
  delivered: number;
  escrow: number;
  ordersCount: number;
  deliveredCount: number;
  openCount: number;
  lostCount: number;
  deliveryRate: number;
  returnRate: number;
  confirmationRate: number;
  averageOrder: number;
  activeProducts: number;
  customers: number;
  visits: number;
  series: { d: string; v: number }[];
  visitSeries: { d: string; v: number }[];
  recent: Order[];
  todo: Order[];
  topProducts: { id: string; name: string; image: string | null; sales: number; total: number }[];
};

const LOST: Order["status"][] = ["cancelled", "refunded", "unreachable"];
const OPEN: Order["status"][] = ["pending", "processing", "scheduled", "shipping"];

export function useDashboardStats(days = 30) {
  return useQuery({
    queryKey: ["stats", days],
    queryFn: async (): Promise<DashboardStats> => {
      const since = new Date(Date.now() - (days - 1) * 86400000);
      since.setHours(0, 0, 0, 0);

      const sc = await scope();
      const [ordersRes, productsRes, customersRes, visitsRes] = await Promise.all([
        scopeFilter(supabase.from("orders").select("*"), sc)
          .gte("created_at", since.toISOString())
          .order("created_at", { ascending: false }),
        scopeFilter(supabase.from("products").select("id, name, status, image_url"), sc),
        scopeFilter(supabase.from("customers").select("id", { count: "exact", head: true }), sc),
        sc.id
          ? supabase
              .from("store_visits")
              .select("created_at")
              .eq("store_id", sc.id)
              .gte("created_at", since.toISOString())
          : supabase.from("store_visits").select("created_at").gte("created_at", since.toISOString()),
      ]);
      if (ordersRes.error) throw ordersRes.error;
      if (productsRes.error) throw productsRes.error;

      const orders = ordersRes.data ?? [];
      const visits = visitsRes.data ?? [];
      const kept = orders.filter((o) => !LOST.includes(o.status));
      const delivered = orders.filter((o) => o.status === "completed");
      const lost = orders.filter((o) => LOST.includes(o.status));
      const open = orders.filter((o) => OPEN.includes(o.status));
      const confirmed = orders.filter((o) => !["pending", "unreachable"].includes(o.status));

      const total = (list: Order[]) => list.reduce((sum, o) => sum + Number(o.amount), 0);
      const revenue = total(kept);
      const deliveredTotal = total(delivered);
      const escrow = total(orders.filter((o) => o.status === "in_escrow"));

      const dayKey = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const byDay = new Map<string, number>();
      const visitsByDay = new Map<string, number>();
      for (let i = 0; i < days; i += 1) {
        const key = dayKey(new Date(since.getTime() + i * 86400000));
        byDay.set(key, 0);
        visitsByDay.set(key, 0);
      }
      for (const o of kept) {
        const key = dayKey(new Date(o.created_at));
        if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + Number(o.amount));
      }
      for (const v of visits) {
        const key = dayKey(new Date(v.created_at));
        if (visitsByDay.has(key)) visitsByDay.set(key, (visitsByDay.get(key) ?? 0) + 1);
      }
      const series = [...byDay.entries()].map(([key, v]) => ({ d: key.slice(8, 10), v }));
      const visitSeries = [...visitsByDay.entries()].map(([key, v]) => ({ d: key.slice(8, 10), v }));


      const productList = productsRes.data ?? [];
      const productMap = new Map(productList.map((p) => [p.id, p]));
      const tally = new Map<string, { sales: number; total: number }>();
      for (const o of kept) {
        if (!o.product_id) continue;
        const entry = tally.get(o.product_id) ?? { sales: 0, total: 0 };
        entry.sales += 1;
        entry.total += Number(o.amount);
        tally.set(o.product_id, entry);
      }
      const topProducts = [...tally.entries()]
        .map(([id, v]) => ({
          id,
          name: productMap.get(id)?.name ?? "Produit",
          image: productMap.get(id)?.image_url ?? null,
          ...v,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      return {
        revenue,
        delivered: deliveredTotal,
        escrow,
        ordersCount: orders.length,
        deliveredCount: delivered.length,
        openCount: open.length,
        lostCount: lost.length,
        deliveryRate: kept.length ? (delivered.length / kept.length) * 100 : 0,
        returnRate: orders.length ? (lost.length / orders.length) * 100 : 0,
        confirmationRate: orders.length ? (confirmed.length / orders.length) * 100 : 0,
        averageOrder: kept.length ? revenue / kept.length : 0,
        activeProducts: productList.filter((p) => p.status === "active").length,
        customers: customersRes.count ?? 0,
        visits: visits.length,
        series,
        visitSeries,
        recent: orders.slice(0, 5),
        todo: open.slice(0, 5),
        topProducts,
      };
    },
  });
}


/** Upload d'une image dans le bucket privé store-media (dossier = user id). */
export async function uploadStoreMedia(file: File) {
  const userId = await currentUserId();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("store-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage
    .from("store-media")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (signError || !data) throw signError ?? new Error("URL introuvable");
  await supabase.from("media_library").insert({
    user_id: userId,
    url: data.signedUrl,
    name: file.name,
    type: file.type,
    size_bytes: file.size,
    storage_path: path,
  });
  return data.signedUrl;
}
