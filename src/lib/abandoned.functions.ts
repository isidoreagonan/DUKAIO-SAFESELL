/**
 * Paniers abandonnés : enregistrement depuis la boutique publique (dès que le
 * visiteur laisse ses coordonnées sur la page de commande), passage en
 * « commandé » après validation, et relance par e-mail depuis le tableau de bord.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { userId: string; supabase: any };

function normalizeHandle(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Boutique publiée correspondant à l'identifiant public. */
async function publishedStore(handle: string) {
  const db = await admin();
  const clean = normalizeHandle(handle);
  const { data } = await db
    .from("store_settings")
    .select("id, store_name, currency, logo_url, subdomain, custom_domain")
    .eq("is_published", true)
    .or(`subdomain.eq.${clean},custom_domain.eq.${clean}`)
    .limit(1);
  return data?.[0] ?? null;
}

const cartInput = z.object({
  handle: z.string().min(1).max(120),
  sessionId: z.string().min(8).max(64),
  name: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().max(255).optional(),
  city: z.string().trim().max(120).optional(),
  address: z.string().trim().max(300).optional(),
  subtotal: z.number().min(0).max(100_000_000),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        name: z.string().max(200),
        qty: z.number().int().min(1).max(99),
        unitPrice: z.number().min(0),
      }),
    )
    .min(1)
    .max(30),
});

/** Le visiteur a commencé sa commande sans la finir : on garde la trace. */
export const trackAbandonedCart = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => cartInput.parse(input))
  .handler(async ({ data }) => {
    const store = await publishedStore(data.handle);
    if (!store) return { ok: false as const };
    const db = await admin();
    await db.from("abandoned_carts").upsert(
      {
        store_id: store.id,
        session_id: data.sessionId,
        customer_name: data.name ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        city: data.city ?? null,
        address: data.address ?? null,
        items: data.items,
        subtotal: data.subtotal,
        status: "open",
      },
      { onConflict: "store_id,session_id" },
    );
    return { ok: true as const };
  });

const orderedInput = z.object({
  handle: z.string().min(1).max(120),
  sessionId: z.string().min(8).max(64),
  orderNumber: z.string().trim().max(60),
});

/** La commande a été validée : le panier n'est plus abandonné. */
export const markCartOrdered = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => orderedInput.parse(input))
  .handler(async ({ data }) => {
    const store = await publishedStore(data.handle);
    if (!store) return { ok: false as const };
    const db = await admin();
    await db
      .from("abandoned_carts")
      .update({ status: "ordered", order_number: data.orderNumber })
      .eq("store_id", store.id)
      .eq("session_id", data.sessionId);
    return { ok: true as const };
  });

/** Relance par e-mail d'un panier abandonné (vendeur connecté). */
export const sendCartRecovery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ cartId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    /* RLS : le vendeur ne voit que les paniers de ses propres boutiques. */
    const { data: cart } = await ctx.supabase
      .from("abandoned_carts")
      .select("id")
      .eq("id", data.cartId)
      .maybeSingle();
    if (!cart) return { ok: false as const, reason: "Panier introuvable." };

    const { sendRecoveryEmail } = await import("@/lib/abandoned.server");
    return sendRecoveryEmail(data.cartId);
  });
