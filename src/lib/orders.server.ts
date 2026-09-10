/**
 * Création d'une commande réelle côté serveur (boutique publique et robot
 * WhatsApp). Les totaux sont toujours recalculés ici : aucun montant envoyé
 * par le client n'est utilisé. Server-only.
 */
import type { Tables } from "@/integrations/supabase/types";
import { cartTotals, toShopOffer, type CartLine, type ShopOffer } from "@/lib/pricing";

export type OrderCustomerInput = {
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  note?: string | null;
};

export type PlacedOrder = {
  orderId: string;
  orderNumber: string;
  total: number;
  discount: number;
  subtotal: number;
};

type StoreRow = Tables<"store_settings">;

function toOffers(rows: Tables<"offers">[]): ShopOffer[] {
  return rows.map(toShopOffer);
}

/** Code promo valide de la boutique, ou null. */
export async function findStoreCoupon(storeId: string, code: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("coupons")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .ilike("code", code.trim())
    .limit(1);
  const coupon = data?.[0];
  if (!coupon) return null;
  const now = Date.now();
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) return null;
  if (coupon.ends_at && new Date(coupon.ends_at).getTime() < now) return null;
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) return null;
  return {
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    min_subtotal: Number(coupon.min_subtotal),
    product_id: coupon.product_id,
  };
}

/**
 * Enregistre la commande, la fiche client, les articles, consomme le code
 * promo et envoie les e-mails (vendeur + client). Jamais bloquant sur l'e-mail.
 */
export async function placeOrder(opts: {
  store: StoreRow;
  lines: CartLine[];
  customer: OrderCustomerInput;
  couponCode?: string | null;
  paymentMethod?: string;
}): Promise<PlacedOrder | null> {
  const { store, lines, customer } = opts;
  if (lines.length === 0) return null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: offerRows } = await supabaseAdmin
    .from("offers")
    .select("*")
    .eq("store_id", store.id)
    .eq("is_active", true);

  const coupon = opts.couponCode ? await findStoreCoupon(store.id, opts.couponCode) : null;
  const totals = cartTotals(lines, toOffers(offerRows ?? []), coupon);

  const orderNumber = `CMD-${Date.now().toString(36).toUpperCase()}`;
  const orderId = crypto.randomUUID();

  /* Fiche client réelle, visible dans le dashboard du vendeur. */
  let customerId: string | null = null;
  const existing = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("store_id", store.id)
    .eq("phone", customer.phone)
    .limit(1);
  if (existing.data?.[0]) {
    customerId = existing.data[0].id;
    await supabaseAdmin
      .from("customers")
      .update({
        full_name: customer.name,
        email: customer.email || null,
        address: customer.address || null,
        city: customer.city || null,
      })
      .eq("id", customerId);
  } else {
    const created = await supabaseAdmin
      .from("customers")
      .insert({
        user_id: store.user_id,
        store_id: store.id,
        full_name: customer.name,
        phone: customer.phone,
        email: customer.email || null,
        address: customer.address || null,
        city: customer.city || null,
      })
      .select("id")
      .single();
    customerId = created.data?.id ?? null;
  }

  const { error: orderError } = await supabaseAdmin.from("orders").insert({
    id: orderId,
    user_id: store.user_id,
    store_id: store.id,
    order_number: orderNumber,
    customer_name: customer.name,
    customer_phone: customer.phone,
    customer_email: customer.email || null,
    shipping_address: customer.address || null,
    shipping_city: customer.city || null,
    note: customer.note || null,
    amount: totals.total,
    currency: store.currency,
    status: "pending",
    payment_method: opts.paymentMethod ?? "cash_on_delivery",
    coupon_code: coupon?.code ?? null,
    discount_amount: totals.offerDiscount + totals.comboDiscount + totals.couponDiscount,
    shipping_amount: totals.shipping,

    product_id: lines[0]?.productId ?? null,
    customer_id: customerId,
  });
  if (orderError) {
    console.error("[order:insert]", orderError);
    return null;
  }

  await supabaseAdmin.from("order_items").insert(
    totals.lines.map((row) => ({
      order_id: orderId,
      product_id: row.line.productId,
      title: row.line.name,
      quantity: row.line.qty,
      unit_price: row.total / row.line.qty,
    })),
  );

  if (coupon) {
    await supabaseAdmin.rpc("consume_coupon", { _store_id: store.id, _code: coupon.code });
  }

  try {
    const { sendSellerOrderEmail, sendCustomerOrderEmail } = await import(
      "@/lib/order-emails.server"
    );
    const payload = {
      orderNumber,
      storeName: store.store_name,
      currency: store.currency,
      total: totals.total,
      discount: totals.offerDiscount + totals.comboDiscount + totals.couponDiscount,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email || null,
      address: customer.address || null,
      city: customer.city || null,
      note: customer.note || null,
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
    if (customer.email) {
      await sendCustomerOrderEmail(customer.email, payload).catch((error) =>
        console.error("[order-email:customer]", error),
      );
    }

    /* Notification Telegram instantanée sur le bot DUKAIO */
    try {
      const { sendTelegramOrderNotification } = await import("@/lib/telegram.server");
      await sendTelegramOrderNotification(store.id, payload).catch((error) =>
        console.error("[telegram-notification:order]", error),
      );
    } catch {
      /* non-bloquant */
    }
  } catch (error) {
    console.error("[order-email]", error);
  }

  /* Conversion réelle vers Facebook, TikTok et Google (serveur à serveur). */
  try {
    const { reportServerConversion } = await import("@/lib/tracking.server");
    await reportServerConversion(store.id, {
      event: "Purchase",
      eventId: orderId,
      value: totals.total,
      currency: store.currency || "XOF",
      email: customer.email || null,
      phone: customer.phone,
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
    orderId,
    orderNumber,
    total: totals.total,
    discount: totals.offerDiscount + totals.comboDiscount + totals.couponDiscount,
    subtotal: totals.subtotal,
  };
}
