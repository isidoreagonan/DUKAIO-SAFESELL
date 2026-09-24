/**
 * Création d'une boutique supplémentaire. La limite de la formule est décidée
 * côté serveur (Découverte et Starter : 1 boutique, Pro : 5).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}


type Ctx = { userId: string };

export const createStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const name = String((input as Record<string, unknown>)?.["name"] ?? "").trim();
    if (name.length < 2) throw new Error("Donnez un nom à votre boutique.");
    if (name.length > 60) throw new Error("Le nom est trop long (60 caractères maximum).");
    return { name };
  })
  .handler(async ({ data, context }) => {
    const { userId } = context as unknown as Ctx;
    const { assertQuota } = await import("@/lib/subscription.server");
    await assertQuota(userId, "store");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const base = slugify(data.name) || "boutique";

    let subdomain = "";
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const candidate = `${base}-${Math.random().toString(36).slice(2, 8)}`;
      const { data: taken } = await supabaseAdmin
        .from("store_settings")
        .select("id")
        .eq("subdomain", candidate)
        .maybeSingle();
      if (!taken) {
        subdomain = candidate;
        break;
      }
    }
    if (!subdomain) throw new Error("Impossible de générer un lien de boutique. Réessayez.");

    const { data: created, error } = await supabaseAdmin
      .from("store_settings")
      .insert({ user_id: userId, store_name: data.name, subdomain })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    /* Notification instantanée Telegram Super-Admin (non bloquante) */
    try {
      const { notifyAdminNewStore } = await import("@/lib/telegram.server");
      const { data: userAuth } = await supabaseAdmin.auth.admin.getUserById(userId);
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, phone")
        .eq("id", userId)
        .maybeSingle();

      await notifyAdminNewStore({
        storeId: created.id,
        storeName: created.store_name,
        subdomain: created.subdomain,
        customDomain: created.custom_domain,
        currency: created.currency || "FCFA",
        country: created.country,
        ownerEmail: userAuth.user?.email,
        ownerName: profile?.full_name,
        ownerPhone: profile?.phone,
      });
    } catch (e) {
      console.error("[Telegram Admin Notify Store Error]", e);
    }

    return created;
  });

export const notifyAdminStoreCreated = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storeId: string }) => ({
    storeId: z.string().uuid().parse(input.storeId),
  }))
  .handler(async ({ data, context }) => {
    const { userId } = context as unknown as Ctx;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: store } = await supabaseAdmin
      .from("store_settings")
      .select("id, store_name, subdomain, custom_domain, currency, country, user_id")
      .eq("id", data.storeId)
      .single();

    if (!store) return { ok: false };

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, phone")
      .eq("id", userId)
      .maybeSingle();

    const { data: userAuth } = await supabaseAdmin.auth.admin.getUserById(userId);

    const { notifyAdminNewStore } = await import("@/lib/telegram.server");
    await notifyAdminNewStore({
      storeId: store.id,
      storeName: store.store_name,
      subdomain: store.subdomain,
      customDomain: store.custom_domain,
      currency: store.currency || "FCFA",
      country: store.country,
      ownerEmail: userAuth.user?.email,
      ownerName: profile?.full_name,
      ownerPhone: profile?.phone,
    });

    return { ok: true };
  });

/**
 * Récupère toutes les boutiques accessibles par l'utilisateur connecté :
 * - Ses propres boutiques (propriétaire)
 * - Les boutiques où il est membre actif (closer, livreur, gestionnaire, admin)
 */
export const getMyStores = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    // 1. Boutiques possédées par l'utilisateur
    const { data: owned, error: ownedErr } = await supabaseAdmin
      .from("store_settings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (ownedErr) throw ownedErr;

    // 2. Boutiques où l'utilisateur est membre actif ou invité
    const userEmail = typeof context.claims["email"] === "string" ? context.claims["email"].toLowerCase().trim() : "";
    let membershipQuery = supabaseAdmin
      .from("store_members")
      .select("id, role, permissions, store_id, user_id, status, store_settings(*)");

    if (userEmail) {
      membershipQuery = membershipQuery.or(`user_id.eq.${userId},email.eq.${userEmail}`);
    } else {
      membershipQuery = membershipQuery.eq("user_id", userId);
    }

    const { data: memberships, error: memberErr } = await membershipQuery;
    if (memberErr) throw memberErr;

    const list: Array<
      any & {
        isOwner: boolean;
        memberRole: "owner" | "admin" | "closer" | "products" | "courier";
        memberPermissions: string[];
      }
    > = [];

    for (const store of owned ?? []) {
      list.push({
        ...store,
        isOwner: true,
        memberRole: "owner",
        memberPermissions: ["*"],
      });
    }

    for (const m of memberships ?? []) {
      // Auto-lier l'invitation à l'utilisateur connecté si nécessaire
      if (!m.user_id && userEmail && m.status !== "inactive") {
        await supabaseAdmin
          .from("store_members")
          .update({ user_id: userId, status: "active", accepted_at: new Date().toISOString() })
          .eq("id", m.id)
          .catch(() => null);
      }

      const raw = m.store_settings as any;
      const s = Array.isArray(raw) ? raw[0] : raw;
      if (s && s.id && !list.some((existing) => existing.id === s.id)) {
        list.push({
          ...s,
          isOwner: false,
          memberRole: m.role as "admin" | "closer" | "products" | "courier",
          memberPermissions: m.permissions ?? [],
        });
      }
    }

    return list;
  });

/**
 * Récupère les commandes d'une boutique pour le propriétaire OU un membre d'équipe autorisé.
 */
export const getStoreOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ storeId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    // Vérifie les droits d'accès
    const { data: store } = await supabaseAdmin
      .from("store_settings")
      .select("id, user_id")
      .eq("id", data.storeId)
      .maybeSingle();
    if (!store) throw new Error("Boutique introuvable");

    const isOwner = store.user_id === userId;
    if (!isOwner) {
      const userEmail = typeof (context as any)?.claims?.email === "string"
        ? (context as any).claims.email.toLowerCase().trim()
        : "";
      let memberQuery = supabaseAdmin
        .from("store_members")
        .select("id, role, permissions, status, user_id")
        .eq("store_id", data.storeId);

      if (userEmail) {
        memberQuery = memberQuery.or(`user_id.eq.${userId},email.eq.${userEmail}`);
      } else {
        memberQuery = memberQuery.eq("user_id", userId);
      }

      const { data: member } = await memberQuery.maybeSingle();
      if (!member || member.status === "inactive") throw new Error("Accès refusé à cette boutique");

      if (!member.user_id && userEmail) {
        try {
          await supabaseAdmin
            .from("store_members")
            .update({ user_id: userId, status: "active", accepted_at: new Date().toISOString() })
            .eq("id", member.id);
        } catch {
          // ignore
        }
      }
    }

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("store_id", data.storeId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return orders ?? [];
  });

/**
 * Met à jour le statut d'une commande par le propriétaire OU un membre autorisé (closer, livreur, etc.).
 */
export const updateStoreOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        status: z.enum([
          "pending",
          "processing",
          "scheduled",
          "shipping",
          "completed",
          "cancelled",
          "refunded",
          "unreachable",
          "in_escrow",
        ]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, store_id, user_id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order) throw new Error("Commande introuvable");

    const isOwner = order.user_id === userId;
    if (!isOwner) {
      const userEmail = typeof (context as any)?.claims?.email === "string"
        ? (context as any).claims.email.toLowerCase().trim()
        : "";
      let memberQuery = supabaseAdmin
        .from("store_members")
        .select("id, role, permissions, status, user_id")
        .eq("store_id", order.store_id);

      if (userEmail) {
        memberQuery = memberQuery.or(`user_id.eq.${userId},email.eq.${userEmail}`);
      } else {
        memberQuery = memberQuery.eq("user_id", userId);
      }

      const { data: member } = await memberQuery.maybeSingle();
      if (!member || member.status === "inactive") throw new Error("Accès refusé");

      if (!member.user_id && userEmail) {
        try {
          await supabaseAdmin
            .from("store_members")
            .update({ user_id: userId, status: "active", accepted_at: new Date().toISOString() })
            .eq("id", member.id);
        } catch {
          // ignore
        }
      }

      const isAdmin = member.role === "admin";
      const hasDelivery =
        isAdmin ||
        member.role === "courier" ||
        (Array.isArray(member.permissions) && member.permissions.includes("delivery"));
      const hasOrders =
        isAdmin ||
        member.role === "closer" ||
        (Array.isArray(member.permissions) &&
          (member.permissions.includes("orders") || member.permissions.includes("orders.write")));

      // Vérification fine selon le statut demandé :
      // - "shipping" et "completed" exigent les droits de livraison (livreur ou admin)
      // - les statuts de qualification (processing, scheduled, unreachable, cancelled) exigent les droits de closer/orders
      if (data.status === "shipping" || data.status === "completed") {
        if (!hasDelivery) {
          throw new Error("Seul un livreur ou un administrateur peut marquer une commande en cours de livraison ou livrée.");
        }
      } else {
        if (!hasOrders && !hasDelivery) {
          throw new Error("Vous n'avez pas la permission de modifier le statut de cette commande.");
        }
      }
    }

    const updatePayload: Record<string, unknown> = { status: data.status };
    if (data.status === "completed") {
      updatePayload.escrow_released_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin.from("orders").update(updatePayload).eq("id", data.orderId);
    if (error) throw error;

    // Envoi silencieux de l'e-mail de statut si possible
    try {
      const { notifyOrderStatus } = await import("@/lib/order-emails.functions");
      await notifyOrderStatus({ data: { orderId: data.orderId, status: data.status } });
    } catch {
      // Non bloquant
    }

    return { success: true };
  });

/**
 * Supprime une commande de la boutique.
 * Sécurité stricte : réservé exclusivement au propriétaire de la boutique ou à un administrateur.
 */
export const deleteStoreOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ orderId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, store_id, user_id, order_number")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order) throw new Error("Commande introuvable");

    const isOwner = order.user_id === userId;
    if (!isOwner) {
      const userEmail = typeof (context as any)?.claims?.email === "string"
        ? (context as any).claims.email.toLowerCase().trim()
        : "";
      let memberQuery = supabaseAdmin
        .from("store_members")
        .select("id, role, status, user_id")
        .eq("store_id", order.store_id);

      if (userEmail) {
        memberQuery = memberQuery.or(`user_id.eq.${userId},email.eq.${userEmail}`);
      } else {
        memberQuery = memberQuery.eq("user_id", userId);
      }

      const { data: member } = await memberQuery.maybeSingle();
      if (!member || member.status === "inactive" || member.role !== "admin") {
        throw new Error("Seul le propriétaire de la boutique ou un administrateur peut supprimer une commande.");
      }
    }

    await supabaseAdmin.from("order_items").delete().eq("order_id", data.orderId);
    const { error } = await supabaseAdmin.from("orders").delete().eq("id", data.orderId);
    if (error) throw error;

    return { success: true };
  });

/**
 * Récupère les articles d'une commande pour le propriétaire OU un membre autorisé.
 */
export const getStoreOrderItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ orderId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: items, error } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .eq("order_id", data.orderId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return items ?? [];
  });

/**
 * Récupère les produits d'une boutique pour le propriétaire OU un membre autorisé.
 */
export const getStoreProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ storeId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("store_id", data.storeId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return products ?? [];
  });
