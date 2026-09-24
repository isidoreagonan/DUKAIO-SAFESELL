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

export function activeStoreId(userId?: string | null): string | null {
  if (typeof window === "undefined") return null;
  if (userId) {
    const userScoped = window.localStorage.getItem(`${ACTIVE_KEY}.${userId}`);
    if (userScoped) return userScoped;
  }
  return window.localStorage.getItem(ACTIVE_KEY);
}

export function setActiveStoreId(id: string, userId?: string | null) {
  if (typeof window === "undefined") return;
  if (userId) {
    window.localStorage.setItem(`${ACTIVE_KEY}.${userId}`, id);
  }
  window.localStorage.setItem(ACTIVE_KEY, id);
}

export function clearActiveStoreStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ACTIVE_KEY);
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(`${ACTIVE_KEY}.`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

export type AccessibleStore = StoreSettings & {
  isOwner?: boolean;
  memberRole?: "owner" | "admin" | "closer" | "products" | "courier";
  memberPermissions?: string[];
};

async function listStores(_userId: string): Promise<AccessibleStore[]> {
  try {
    const { getMyStores } = await import("@/lib/stores.functions");
    const list = await getMyStores();
    if (list && list.length > 0) return list as AccessibleStore[];
  } catch (err) {
    console.warn("[listStores] Fallback to direct client query:", err);
  }

  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("user_id", _userId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      return data.map((s) => ({
        ...s,
        isOwner: true,
        memberRole: "owner" as const,
        memberPermissions: ["*"],
      }));
    }
  } catch (e) {
    console.warn("[listStores] direct store query error:", e);
  }
  return [];
}

/** Toutes les boutiques du vendeur (ou boutiques dont il est membre), dans l'ordre de création. */
export function useStores() {
  return useQuery({
    queryKey: ["stores"],
    queryFn: async (): Promise<AccessibleStore[]> => {
      const list = await listStores(await currentUserId());
      if (typeof window !== "undefined" && list.length > 0) {
        try {
          window.localStorage.setItem("dukaio.cachedStores", JSON.stringify(list));
        } catch {}
      }
      return list;
    },
    initialData: () => {
      if (typeof window === "undefined") return undefined;
      try {
        const cached = window.localStorage.getItem("dukaio.cachedStores");
        if (cached) return JSON.parse(cached) as AccessibleStore[];
      } catch {}
      return undefined;
    },
    staleTime: 3 * 60_000,
  });
}

/** Récupère la boutique active du vendeur ou membre, la crée au premier accès si propriétaire sans boutique. */
export function useStore() {
  return useQuery({
    queryKey: ["store"],
    queryFn: async (): Promise<AccessibleStore> => {
      const userId = await currentUserId();
      const stores = await listStores(userId);
      if (stores.length) {
        const wanted = activeStoreId(userId);
        const found = stores.find((s) => s.id === wanted) ?? stores[0]!;
        setActiveStoreId(found.id, userId);
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem("dukaio.cachedActiveStore", JSON.stringify(found));
          } catch {}
        }
        return found;
      }

      try {
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
        const newStore: AccessibleStore = {
          ...created,
          isOwner: true,
          memberRole: "owner",
          memberPermissions: ["*"],
        };
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem("dukaio.cachedActiveStore", JSON.stringify(newStore));
          } catch {}
        }
        return newStore;
      } catch (err) {
        console.warn("[useStore] Could not auto-create store:", err);
        return {
          id: "default",
          user_id: userId,
          store_name: "Ma Boutique",
          subdomain: `boutique-${userId.slice(0, 6)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isOwner: false,
          memberRole: "closer",
          memberPermissions: ["orders", "orders.read", "orders.write"],
        } as unknown as AccessibleStore;
      }
    },
    initialData: () => {
      if (typeof window === "undefined") return undefined;
      try {
        const cached = window.localStorage.getItem("dukaio.cachedActiveStore");
        if (cached) return JSON.parse(cached) as AccessibleStore;
      } catch {}
      return undefined;
    },
    staleTime: 3 * 60_000,
  });
}

/** Hook d'accès et permissions pour le membre ou propriétaire connecté */
export function useCurrentRole() {
  const { data: store } = useStore();
  const isOwner = store?.isOwner !== false;
  const role = (store?.memberRole ?? "owner") as "owner" | "admin" | "closer" | "products" | "courier";
  const permissions = store?.memberPermissions ?? (isOwner ? ["*"] : []);

  const can = (permission: string) => {
    if (isOwner || role === "admin" || permissions.includes("*")) return true;
    return permissions.includes(permission);
  };

  return {
    isOwner,
    role,
    permissions,
    can,
    isCourier: role === "courier",
    isCloser: role === "closer",
    isAdmin: isOwner || role === "admin",
  };
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
      void qc.invalidateQueries();
    },
  });
}

/** Bascule instantanément sur une autre boutique : mise à jour optimiste et rechargement ciblé. */
export function useSwitchStore() {
  const qc = useQueryClient();
  return async (id: string) => {
    try {
      const { data } = await supabase.auth.getUser();
      setActiveStoreId(id, data.user?.id);
    } catch {
      setActiveStoreId(id);
    }

    // Mise à jour optimiste immédiate (0 milliseconde)
    const stores = qc.getQueryData<AccessibleStore[]>(["stores"]);
    const target = stores?.find((s) => s.id === id);
    if (target) {
      qc.setQueryData(["store"], target);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("dukaio.cachedActiveStore", JSON.stringify(target));
        } catch {}
      }
    }

    // Invalidation ciblée des données en arrière-plan sans bloquer l'UI
    void qc.invalidateQueries({ queryKey: ["store"] });
    void qc.invalidateQueries({ queryKey: ["orders"] });
    void qc.invalidateQueries({ queryKey: ["products"] });
    void qc.invalidateQueries({ queryKey: ["stats"] });
    void qc.invalidateQueries({ queryKey: ["order-item-counts"] });
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
  const { data: store } = useStore();
  return useQuery({
    queryKey: ["products", store?.id],
    queryFn: async (): Promise<Product[]> => {
      if (store?.id) {
        try {
          const { getStoreProducts } = await import("@/lib/stores.functions");
          const list = await getStoreProducts({ data: { storeId: store.id } });
          if (list) return list as Product[];
        } catch {
          // fallback vers la requête client
        }
      }
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
  const { data: store } = useStore();
  return useQuery({
    queryKey: ["orders", store?.id],
    queryFn: async (): Promise<Order[]> => {
      if (store?.id) {
        try {
          const { getStoreOrders } = await import("@/lib/stores.functions");
          const data = await getStoreOrders({ data: { storeId: store.id } });
          if (data) return data as Order[];
        } catch {
          // fallback
        }
      }
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
      if (orderId) {
        try {
          const { getStoreOrderItems } = await import("@/lib/stores.functions");
          const items = await getStoreOrderItems({ data: { orderId } });
          if (items) return items as OrderItem[];
        } catch {
          // fallback
        }
      }
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
      try {
        const { updateStoreOrderStatus } = await import("@/lib/stores.functions");
        await updateStoreOrderStatus({ data: { orderId: id, status } });
      } catch {
        const values: TablesUpdate<"orders"> = { status };
        if (status === "completed") values.escrow_released_at = new Date().toISOString();
        const { error } = await supabase.from("orders").update(values).eq("id", id);
        if (error) throw error;
        /* Le client reçoit la mise à jour par e-mail (silencieux en cas d'échec). */
        const { notifyOrderStatus } = await import("@/lib/order-emails.functions");
        await notifyOrderStatus({ data: { orderId: id, status } }).catch(() => null);
      }
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
      try {
        const { deleteStoreOrder } = await import("@/lib/stores.functions");
        await deleteStoreOrder({ data: { orderId: id } });
      } catch (err) {
        await supabase.from("order_items").delete().eq("order_id", id);
        const { error } = await supabase.from("orders").delete().eq("id", id);
        if (error) throw error;
      }
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

      let ordersData: Order[] = [];
      let productsData: Array<{ id: string; name: string; status: string; image_url: string | null }> = [];
      let customersCount = 0;
      let visitsData: Array<{ created_at: string }> = [];

      // 1. Récupération robuste des commandes et produits (server function avec droits membre / propriétaire)
      if (sc.id) {
        try {
          const { getStoreOrders, getStoreProducts } = await import("@/lib/stores.functions");
          const [fetchedOrders, fetchedProducts] = await Promise.all([
            getStoreOrders({ data: { storeId: sc.id } }).catch(() => null),
            getStoreProducts({ data: { storeId: sc.id } }).catch(() => null),
          ]);
          if (fetchedOrders) {
            ordersData = (fetchedOrders as Order[]).filter(
              (o) => new Date(o.created_at).getTime() >= since.getTime(),
            );
          }
          if (fetchedProducts) {
            productsData = fetchedProducts as any;
          }
        } catch (e) {
          console.warn("[useDashboardStats] Server fn fetch error:", e);
        }
      }

      // 2. Si pas encore de données, fallback sur requête client directe (sécurisée)
      if (!ordersData.length && !productsData.length) {
        try {
          const [ordersRes, productsRes] = await Promise.all([
            scopeFilter(supabase.from("orders").select("*"), sc)
              .gte("created_at", since.toISOString())
              .order("created_at", { ascending: false }),
            scopeFilter(supabase.from("products").select("id, name, status, image_url"), sc),
          ]);
          ordersData = ordersRes.data ?? [];
          productsData = (productsRes.data ?? []) as any;
        } catch {
          // ignore
        }
      }

      // 3. Clients (table customers sans store_id, requête sécurisée avec fallback 0)
      try {
        const { count } = await supabase.from("customers").select("id", { count: "exact", head: true });
        customersCount = count ?? 0;
      } catch {
        customersCount = 0;
      }

      // 4. Visites
      try {
        const visitsQuery = sc.id
          ? supabase
              .from("store_visits")
              .select("created_at")
              .eq("store_id", sc.id)
              .gte("created_at", since.toISOString())
          : supabase.from("store_visits").select("created_at").gte("created_at", since.toISOString());
        const { data } = await visitsQuery;
        visitsData = data ?? [];
      } catch {
        visitsData = [];
      }

      const orders = ordersData;
      const visits = visitsData;
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

      const productList = productsData;
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
        customers: customersCount,
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
