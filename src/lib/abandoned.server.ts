/**
 * Relance des paniers abandonnés (server-only) : gabarit d'e-mail aux couleurs
 * de la boutique et campagne automatique quotidienne.
 */

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** La relance des paniers est réservée aux formules Starter et Pro. */
async function paidStore(storeId: string) {
  const db = await admin();
  const { data } = await db.rpc("effective_plan_key", { _store_id: storeId });
  return data === "starter" || data === "pro";
}

/** Envoie la relance d'un panier abandonné. */
export async function sendRecoveryEmail(cartId: string) {
  const db = await admin();
  const { data: cart } = await db
    .from("abandoned_carts")
    .select("*")
    .eq("id", cartId)
    .maybeSingle();
  if (!cart) return { ok: false as const, reason: "Panier introuvable." };
  if (!cart.email) return { ok: false as const, reason: "Ce client n'a pas laissé d'e-mail." };
  if (!(await paidStore(cart.store_id)))
    return {
      ok: false as const,
      reason: "La relance des paniers abandonnés est réservée aux formules Starter et Pro.",
    };

  const { data: store } = await db
    .from("store_settings")
    .select("store_name, currency, logo_url, subdomain, custom_domain, theme_config")
    .eq("id", cart.store_id)
    .maybeSingle();
  if (!store) return { ok: false as const, reason: "Boutique introuvable." };

  const currency = store.currency || "FCFA";
  const fmt = (value: number) =>
    `${new Intl.NumberFormat("fr-FR").format(Math.round(value))} ${currency}`;
  const items = Array.isArray(cart.items)
    ? (cart.items as unknown as { name?: string; qty?: number; unitPrice?: number }[])
    : [];
  const lines = items
    .map(
      (item) =>
        `${item.qty ?? 1} × ${item.name ?? "Article"} — ${fmt((item.unitPrice ?? 0) * (item.qty ?? 1))}`,
    )
    .join("\n");

  const url = store.custom_domain
    ? `https://${store.custom_domain}/commande`
    : `https://dukaio.com/s/${store.subdomain ?? ""}/commande`;

  const theme = (store.theme_config ?? null) as Record<string, unknown> | null;
  const global = theme?.["global"] as Record<string, unknown> | undefined;

  const { renderEmailTemplate, defaultDesign } = await import("@/lib/email-templates");
  const { sendEmail } = await import("@/lib/email.server");
  const design = defaultDesign("relance", store.logo_url);
  if (typeof global?.["primaryColor"] === "string") {
    design.brandColor = global["primaryColor"] as string;
    design.buttonColor = global["primaryColor"] as string;
  }
  const html = renderEmailTemplate(design, {
    storeName: store.store_name,
    subject: "Votre panier vous attend",
    preheader: "Terminez votre commande en une minute.",
    body: `Vous avez laissé ces articles dans votre panier :\n\n${lines}\n\nTotal : ${fmt(
      Number(cart.subtotal),
    )}\n\nIl vous suffit d'un clic pour finaliser votre commande. Paiement à la livraison.`,
    ctaLabel: "Terminer ma commande",
    ctaUrl: url,
    firstName: cart.customer_name?.trim().split(/\s+/)[0] ?? null,
  });


  try {
    await sendEmail(cart.email, `Votre panier chez ${store.store_name}`, html);
  } catch (e) {
    console.error("[panier:relance]", e);
    return { ok: false as const, reason: "L'e-mail n'a pas pu être envoyé." };
  }

  await db
    .from("abandoned_carts")
    .update({ recovery_sent_at: new Date().toISOString() })
    .eq("id", cart.id);
  return { ok: true as const, email: cart.email as string };
}

/**
 * Relance automatique : paniers ouverts depuis plus de 2 heures, avec un
 * e-mail, jamais encore relancés. Un seul e-mail par panier.
 */
export async function recoverAbandonedCarts() {
  const db = await admin();
  const cutoff = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
  const { data: carts } = await db
    .from("abandoned_carts")
    .select("id")
    .eq("status", "open")
    .is("recovery_sent_at", null)
    .not("email", "is", null)
    .lt("updated_at", cutoff)
    .order("updated_at", { ascending: false })
    .limit(100);

  let sent = 0;
  for (const cart of carts ?? []) {
    try {
      const result = await sendRecoveryEmail(cart.id);
      if (result.ok) sent += 1;
    } catch (e) {
      console.error("relance panier", e);
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return { carts: sent };
}
