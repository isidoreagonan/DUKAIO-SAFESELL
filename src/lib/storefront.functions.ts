import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database, Tables } from "@/integrations/supabase/types";
import { cartTotals, toShopOffer, type CartLine, type ShopOffer } from "@/lib/pricing";
import type { PublicTracking } from "@/lib/tracking";

export type StorefrontCollection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  productIds: string[];
};

export type StorefrontData = {
  store: Tables<"store_settings">;
  products: Tables<"products">[];
  collections: StorefrontCollection[];
  offers: ShopOffer[];
  /** Formule active de la boutique (free/starter/pro) — pilote le badge DUKAIO. */
  plan: string;
  /** Identifiants publics des pixels publicitaires (jamais les jetons). */
  tracking: PublicTracking | null;
} | null;

/** Lecture défensive de la configuration publique des pixels. */
function readPublicTracking(raw: unknown): PublicTracking | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const text = (key: string) => {
    const value = row[key];
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };
  const config: PublicTracking = {
    facebook_pixel_id: text("facebook_pixel_id"),
    tiktok_pixel_id: text("tiktok_pixel_id"),
    google_ads_id: text("google_ads_id"),
    google_ads_conversion_label: text("google_ads_conversion_label"),
    ga4_measurement_id: text("ga4_measurement_id"),
  };
  const hasAny = Object.values(config).some((value) => value !== null);
  return hasAny ? config : null;
}


const input = z.object({ handle: z.string().min(1).max(120) });

/** Identifiant public : sous-domaine (boutique) ou domaine personnalisé. */
function normalizeHandle(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "");
}

/** Client lecture seule (clé publiable) : les policies RLS anon s'appliquent. */
function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Backend indisponible");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (target, init) => {
        const headers = new Headers(init?.headers);
        headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(target, { ...init, headers });
      },
    },
  });
}

function toOffers(rows: Tables<"offers">[]): ShopOffer[] {
  return rows.map(toShopOffer);
}

/**
 * Boutique publique : lue par son sous-domaine (`boutique` de
 * boutique.dukaio.com) ou son domaine personnalisé. Seules les boutiques
 * publiées et les produits actifs sont visibles (policies anon).
 */
export const getStorefront = createServerFn({ method: "GET" })
  .inputValidator((data) => input.parse(data))
  .handler(async ({ data }): Promise<StorefrontData> => {
    const handle = normalizeHandle(data.handle);
    if (!handle) return null;

    const sb = publicClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(handle);
    const filter = isUuid
      ? `id.eq.${handle},subdomain.eq.${handle},custom_domain.eq.${handle}`
      : `subdomain.eq.${handle},custom_domain.eq.${handle}`;

    const { data: stores, error } = await sb
      .from("store_settings")
      .select("*")
      .or(filter)
      .limit(1);
    if (error) throw error;
    const store = stores?.[0];
    if (!store) return null;

    const [productsRes, collectionsRes, offersRes] = await Promise.all([
      sb
        .from("products")
        .select("*")
        .eq("store_id", store.id)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      sb
        .from("collections")
        .select("id, name, slug, description, image_url, position, collection_products(product_id)")
        .eq("store_id", store.id)
        .eq("is_published", true)
        .order("position", { ascending: true }),
      sb.from("offers").select("*").eq("store_id", store.id).eq("is_active", true),
    ]);
    if (productsRes.error) throw productsRes.error;
    if (collectionsRes.error) throw collectionsRes.error;
    if (offersRes.error) throw offersRes.error;

    const collections: StorefrontCollection[] = (collectionsRes.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      image_url: row.image_url,
      productIds: (row.collection_products ?? []).map((link) => link.product_id),
    }));

    const [{ data: planKey }, { data: trackingRaw }] = await Promise.all([
      sb.rpc("effective_plan_key", { _store_id: store.id }),
      sb.rpc("storefront_tracking", { _store_id: store.id }),
    ]);

    const tracking = readPublicTracking(trackingRaw);

    return {
      store,
      products: productsRes.data ?? [],
      collections,
      offers: toOffers(offersRes.data ?? []),
      plan: typeof planKey === "string" ? planKey : "free",
      tracking,
    };

  });

/* --------------------------------------------------------------- coupons */

const couponInput = z.object({
  handle: z.string().min(1).max(120),
  code: z.string().trim().min(1).max(40),
});

export type CouponResult =
  | {
      ok: true;
      code: string;
      type: "percent" | "fixed";
      value: number;
      min_subtotal: number;
      product_id: string | null;
    }
  | { ok: false; reason: string };

async function findCoupon(handle: string, code: string): Promise<CouponResult> {
  const sb = publicClient();
  const clean = normalizeHandle(handle);
  const { data: stores } = await sb
    .from("store_settings")
    .select("id")
    .eq("is_published", true)
    .or(`subdomain.eq.${clean},custom_domain.eq.${clean}`)
    .limit(1);
  const store = stores?.[0];
  if (!store) return { ok: false, reason: "Boutique introuvable." };

  const { data: rows } = await sb
    .from("coupons")
    .select("*")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .ilike("code", code.trim())
    .limit(1);
  const coupon = rows?.[0];
  if (!coupon) return { ok: false, reason: "Ce code promo n'existe pas." };

  const now = Date.now();
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now)
    return { ok: false, reason: "Ce code n'est pas encore actif." };
  if (coupon.ends_at && new Date(coupon.ends_at).getTime() < now)
    return { ok: false, reason: "Ce code a expiré." };
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses)
    return { ok: false, reason: "Ce code a atteint sa limite d'utilisation." };

  return {
    ok: true,
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    min_subtotal: Number(coupon.min_subtotal),
    product_id: coupon.product_id,
  };
}

export const validateCoupon = createServerFn({ method: "POST" })
  .inputValidator((data) => couponInput.parse(data))
  .handler(async ({ data }): Promise<CouponResult> => findCoupon(data.handle, data.code));

/* ---------------------------------------------------------------- orders */

const orderInput = z.object({
  handle: z.string().min(1).max(120),
  couponCode: z.string().trim().max(40).optional(),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(6).max(30),
    address: z.string().trim().min(3).max(300),
    city: z.string().trim().max(120).optional(),
    email: z.string().trim().email().max(255).optional().or(z.literal("")),
    note: z.string().trim().max(500).optional(),
  }),
  items: z
    .array(z.object({ productId: z.string().uuid(), qty: z.number().int().min(1).max(99) }))
    .min(1)
    .max(20),
});

export type OrderResult =
  | { ok: true; orderNumber: string; orderId: string; total: number; discount: number }
  | { ok: false; reason: string };

export const submitOrder = createServerFn({ method: "POST" })
  .inputValidator((data) => orderInput.parse(data))
  .handler(async ({ data }): Promise<OrderResult> => {
    const sb = publicClient();
    const handle = normalizeHandle(data.handle);
    const { data: stores } = await sb
      .from("store_settings")
      .select("*")
      .eq("is_published", true)
      .or(`subdomain.eq.${handle},custom_domain.eq.${handle}`)
      .limit(1);
    const store = stores?.[0];
    if (!store) return { ok: false, reason: "Boutique introuvable." };

    const ids = [...new Set(data.items.map((item) => item.productId))];
    const { data: products } = await sb
      .from("products")
      .select("id, name, title, price, image_url")
      .eq("store_id", store.id)
      .eq("status", "active")
      .in("id", ids);
    if (!products || products.length === 0)
      return { ok: false, reason: "Produits indisponibles." };

    const lines: CartLine[] = [];
    for (const item of data.items) {
      const product = products.find((row) => row.id === item.productId);
      if (!product) continue;
      lines.push({
        productId: product.id,
        name: product.title || product.name,
        image: product.image_url,
        unitPrice: Number(product.price),
        qty: item.qty,
      });
    }
    if (lines.length === 0) return { ok: false, reason: "Panier vide." };

    const { data: offerRows } = await sb
      .from("offers")
      .select("*")
      .eq("store_id", store.id)
      .eq("is_active", true);

    let coupon = null as Awaited<ReturnType<typeof findCoupon>> | null;
    if (data.couponCode) coupon = await findCoupon(data.handle, data.couponCode);
    const validCoupon = coupon && coupon.ok ? coupon : null;

    const totals = cartTotals(lines, toOffers(offerRows ?? []), validCoupon);

    const orderNumber = `CMD-${Date.now().toString(36).toUpperCase()}`;
    /* L'identifiant est généré ici : la boutique publique n'a pas le droit de
       relire une commande après l'insertion. */
    const orderId = crypto.randomUUID();

    /* Fiche client réelle (visible dans le dashboard du vendeur). */
    let customerId: string | null = null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const existing = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("store_id", store.id)
      .eq("phone", data.customer.phone)
      .limit(1);
    if (existing.data?.[0]) {
      customerId = existing.data[0].id;
      await supabaseAdmin
        .from("customers")
        .update({
          full_name: data.customer.name,
          email: data.customer.email || null,
          address: data.customer.address,
          city: data.customer.city || null,
        })
        .eq("id", customerId);
    } else {
      const created = await supabaseAdmin
        .from("customers")
        .insert({
          user_id: store.user_id,
          store_id: store.id,
          full_name: data.customer.name,
          phone: data.customer.phone,
          email: data.customer.email || null,
          address: data.customer.address,
          city: data.customer.city || null,
        })
        .select("id")
        .single();
      customerId = created.data?.id ?? null;
    }

    const { error: orderError } = await sb
      .from("orders")
      .insert({
        id: orderId,
        user_id: store.user_id,
        store_id: store.id,
        order_number: orderNumber,
        customer_name: data.customer.name,
        customer_phone: data.customer.phone,
        customer_email: data.customer.email || null,
        shipping_address: data.customer.address,
        shipping_city: data.customer.city || null,
        note: data.customer.note || null,
        amount: totals.total,
        currency: store.currency,
        status: "pending",
        payment_method: "cash_on_delivery",
        coupon_code: validCoupon?.code ?? null,
        discount_amount: totals.offerDiscount + totals.comboDiscount + totals.couponDiscount,
        shipping_amount: totals.shipping,
        product_id: lines[0]?.productId ?? null,
        customer_id: customerId,
      })
      ;
    if (orderError) return { ok: false, reason: "Commande non enregistrée." };

    const items = totals.lines.map((row) => ({
      order_id: orderId,
      product_id: row.line.productId,
      title: row.line.name,
      quantity: row.line.qty,
      unit_price: row.total / row.line.qty,
    }));
    await sb.from("order_items").insert(items);

    if (validCoupon) {
      /* Compteur d'utilisation incrémenté côté serveur uniquement. */
      await supabaseAdmin.rpc("consume_coupon", {
        _store_id: store.id,
        _code: validCoupon.code,
      });
    }

    /* E-mails : vendeur notifié, client confirmé. Jamais bloquant. */
    try {
      const {
        sendSellerOrderEmail,
        sendCustomerOrderEmail,
      } = await import("@/lib/order-emails.server");
      const payload = {
        orderNumber,
        storeName: store.store_name,
        currency: store.currency,
        total: totals.total,
        discount: totals.offerDiscount + totals.comboDiscount + totals.couponDiscount,
        customerName: data.customer.name,
        customerPhone: data.customer.phone,
        customerEmail: data.customer.email || null,
        address: data.customer.address,
        city: data.customer.city || null,
        note: data.customer.note || null,
        lines: totals.lines.map((row) => ({
          name: row.line.name,
          qty: row.line.qty,
          total: row.total,
        })),
      };

      let sellerEmail = store.contact_email;
      if (!sellerEmail) {
        const owner = await supabaseAdmin.auth.admin.getUserById(store.user_id);
        sellerEmail = owner.data.user?.email ?? null;
      }
      if (sellerEmail && store.email_notifications !== false) {
        await sendSellerOrderEmail(sellerEmail, payload).catch((error) =>
          console.error("[order-email:seller]", error),
        );
      }
      if (data.customer.email) {
        await sendCustomerOrderEmail(data.customer.email, payload).catch((error) =>
          console.error("[order-email:customer]", error),
        );
      }

      /* Notification Telegram instantanée sur le bot DUKAIO */
      try {
        const { sendTelegramOrderNotification } = await import("@/lib/telegram.server");
        await sendTelegramOrderNotification(store.id, payload).catch((error) =>
          console.error("[telegram-notification:storefront]", error),
        );
      } catch {
        /* non-bloquant */
      }
    } catch (error) {
      console.error("[order-email]", error);
    }

    /* Conversion réelle envoyée à Facebook, TikTok et Google (serveur à
       serveur). `orderId` est partagé avec le pixel pour éviter les doublons. */
    try {
      const { reportServerConversion } = await import("@/lib/tracking.server");
      let clientIp: string | null = null;
      let userAgent: string | null = null;
      try {
        const { getRequest } = await import("@tanstack/react-start/server");
        const headers = getRequest().headers;
        clientIp =
          headers.get("cf-connecting-ip") ??
          headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          null;
        userAgent = headers.get("user-agent");
      } catch {
        /* Hors requête HTTP : on envoie sans ces informations. */
      }
      await reportServerConversion(store.id, {
        event: "Purchase",
        eventId: orderId,
        value: totals.total,
        currency: store.currency || "XOF",
        email: data.customer.email || null,
        phone: data.customer.phone,
        clientIp,
        userAgent,
        items: totals.lines.map((row) => ({
          id: row.line.productId,
          name: row.line.name,
          quantity: row.line.qty,
          price: row.total / row.line.qty,
        })),
      });
    } catch (error) {
      console.error("[tracking:order]", error);
    }

    return {
      ok: true,
      orderNumber,
      orderId,
      total: totals.total,
      discount: totals.offerDiscount + totals.comboDiscount + totals.couponDiscount,
    };

  });

/** Hôte de la requête (SSR) : permet de router boutique.dukaio.com → /s/boutique. */
export const getIncomingHost = createServerFn({ method: "GET" }).handler(
  async (): Promise<string | null> => {
    const { getRequestHost } = await import("@tanstack/react-start/server");
    return getRequestHost({ xForwardedHost: true }) ?? null;
  },
);

/* ---------------------------------------------------------------- visites */

const visitInput = z.object({
  handle: z.string().min(1).max(120),
  path: z.string().min(1).max(300),
  sessionId: z.string().min(6).max(64),
  referrer: z.string().max(300).optional(),
  browser: z.string().max(60).optional(),
  device: z.string().max(30).optional(),
});

/**
 * Enregistre une visite de la boutique publique (accueil, catalogue, page
 * produit, contact). Le pays vient de l'en-tête réseau, jamais du navigateur.
 */
export const trackVisit = createServerFn({ method: "POST" })
  .inputValidator((data) => visitInput.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const handle = normalizeHandle(data.handle);
    if (!handle) return { ok: false };

    const sb = publicClient();
    const { data: stores } = await sb
      .from("store_settings")
      .select("id, country")
      .eq("is_published", true)
      .or(`subdomain.eq.${handle},custom_domain.eq.${handle}`)
      .limit(1);
    const store = stores?.[0];
    if (!store) return { ok: false };

    let country: string | null = store.country ?? null;
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const headers = getRequest().headers;
      country =
        headers.get("cf-ipcountry") ??
        headers.get("x-vercel-ip-country") ??
        headers.get("x-country-code") ??
        country;
    } catch {
      /* Hors requête HTTP : on garde le pays de la boutique. */
    }

    const { error } = await sb.from("store_visits").insert({
      store_id: store.id,
      path: data.path.slice(0, 300),
      session_id: data.sessionId,
      referrer: data.referrer?.slice(0, 300) || null,
      browser: data.browser || null,
      device: data.device || null,
      country: country && country !== "XX" ? country.toUpperCase().slice(0, 2) : null,
    });
    return { ok: !error };
  });
