/**
 * Robot WhatsApp DUKAIO (API officielle Meta / Cloud API).
 * Le client écrit à la boutique, le robot répond, prend la commande de A à Z
 * et l'enregistre réellement (visible dans le tableau de bord du vendeur).
 * Server-only : jamais importé depuis le navigateur.
 */
import type { Tables } from "@/integrations/supabase/types";
import { money, type CartLine } from "@/lib/pricing";
import { placeOrder } from "@/lib/orders.server";

const GRAPH = "https://graph.facebook.com/v21.0";

export type WhatsappConfig = Tables<"store_whatsapp">;
type StoreRow = Tables<"store_settings">;

export type FaqEntry = { q: string; a: string };

export function readFaq(raw: unknown): FaqEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const row = (item ?? {}) as Record<string, unknown>;
      return {
        q: typeof row["q"] === "string" ? row["q"].trim() : "",
        a: typeof row["a"] === "string" ? row["a"].trim() : "",
      };
    })
    .filter((entry) => entry.q && entry.a)
    .slice(0, 20);
}

/* ------------------------------------------------------------- envoi Meta */

/** Envoie un message texte via l'API Cloud de Meta. Renvoie l'erreur lisible. */
export async function sendWhatsappText(
  config: { phone_number_id: string | null; access_token: string | null },
  to: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!config.phone_number_id || !config.access_token)
    return { ok: false, error: "Numéro WhatsApp non connecté." };
  try {
    const response = await fetch(`${GRAPH}/${config.phone_number_id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: body.slice(0, 4000) },
      }),
    });
    const raw = await response.text();
    if (!response.ok) {
      let message = `WhatsApp a refusé l'envoi (${response.status}).`;
      try {
        const parsed = JSON.parse(raw) as { error?: { message?: string } };
        if (parsed.error?.message) message = parsed.error.message;
      } catch {
        /* réponse non JSON : on garde le message générique */
      }
      return { ok: false, error: message };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Envoi impossible." };
  }
}

/**
 * Envoie un modèle approuvé (ex. `hello_world`). Indispensable pour le premier
 * contact : hors fenêtre de 24 h, Meta accepte un message texte (HTTP 200)
 * mais ne le délivre jamais.
 */
export async function sendWhatsappTemplate(
  config: { phone_number_id: string | null; access_token: string | null },
  to: string,
  template = "hello_world",
  language = "en_US",
): Promise<{ ok: boolean; error?: string }> {
  if (!config.phone_number_id || !config.access_token)
    return { ok: false, error: "Numéro WhatsApp non connecté." };
  try {
    const response = await fetch(`${GRAPH}/${config.phone_number_id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: { name: template, language: { code: language } },
      }),
    });
    const raw = await response.text();
    if (!response.ok) {
      let message = `WhatsApp a refusé l'envoi (${response.status}).`;
      try {
        const parsed = JSON.parse(raw) as { error?: { message?: string } };
        if (parsed.error?.message) message = parsed.error.message;
      } catch {
        /* réponse non JSON */
      }
      return { ok: false, error: message };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Envoi impossible." };
  }
}

/* ------------------------------------------------------- état de la discussion */

type Draft = {
  productId?: string;
  productName?: string;
  unitPrice?: number;
  qty?: number;
  name?: string;
  city?: string;
  address?: string;
  coupon?: string;
  catalog?: string[];
  faq?: number;
};

type State =
  | "menu"
  | "catalog"
  | "qty"
  | "name"
  | "city"
  | "address"
  | "coupon"
  | "confirm"
  | "track"
  | "faq";

const STATUS_LABEL: Record<string, string> = {
  pending: "reçue, en attente de confirmation",
  processing: "confirmée, en préparation",
  scheduled: "livraison programmée",
  shipping: "en cours de livraison",
  in_escrow: "paiement sécurisé",
  completed: "livrée",
  cancelled: "annulée",
  refunded: "remboursée",
  unreachable: "client injoignable",
};

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function menuText(store: StoreRow, config: WhatsappConfig) {
  const hello =
    config.greeting?.trim() ||
    `Bonjour 👋 Bienvenue chez *${store.store_name}* !`;
  return `${hello}

Que souhaitez-vous faire ?
*1* — Voir les produits et commander
*2* — Suivre une commande
*3* — Poser une question

Répondez simplement par 1, 2 ou 3.`;
}

/* ---------------------------------------------------------------- moteur */

export async function handleIncomingMessage(input: {
  config: WhatsappConfig;
  store: StoreRow;
  from: string;
  text: string;
}): Promise<void> {
  const { config, store, from } = input;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const text = input.text.slice(0, 500);
  const word = normalize(text);

  await supabaseAdmin
    .from("whatsapp_messages")
    .insert({ store_id: store.id, wa_id: from, direction: "in", body: text });

  const reply = async (body: string) => {
    await sendWhatsappText(config, from, body);
    await supabaseAdmin
      .from("whatsapp_messages")
      .insert({ store_id: store.id, wa_id: from, direction: "out", body });
  };

  const { data: rows } = await supabaseAdmin
    .from("whatsapp_conversations")
    .select("*")
    .eq("store_id", store.id)
    .eq("wa_id", from)
    .limit(1);
  const conversation = rows?.[0] ?? null;
  let state: State = (conversation?.state as State) ?? "menu";
  let draft: Draft = (conversation?.data as Draft) ?? {};

  const save = async (nextState: State, nextDraft: Draft) => {
    await supabaseAdmin.from("whatsapp_conversations").upsert(
      {
        store_id: store.id,
        wa_id: from,
        state: nextState,
        data: nextDraft as never,
        last_message_at: new Date().toISOString(),
      },
      { onConflict: "store_id,wa_id" },
    );
  };

  /* Commandes globales : retour au menu à tout moment. */
  if (["menu", "0", "annuler", "stop", "bonjour", "salut", "hi", "hello"].includes(word)) {
    await save("menu", {});
    await reply(menuText(store, config));
    return;
  }

  const products = async () => {
    const { data } = await supabaseAdmin
      .from("products")
      .select("id, name, title, price, quantity, track_quantity")
      .eq("store_id", store.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(12);
    return data ?? [];
  };

  const showCatalog = async () => {
    const list = await products();
    if (list.length === 0) {
      await save("menu", {});
      await reply("Aucun produit n'est disponible pour le moment. Revenez bientôt 🙏");
      return;
    }
    const lines = list
      .map(
        (product, index) =>
          `*${index + 1}* — ${product.title || product.name} : ${money(
            Number(product.price),
            store.currency,
          )}`,
      )
      .join("\n");
    await save("catalog", { ...draft, catalog: list.map((product) => product.id) });
    await reply(
      `🛍️ *Nos produits*\n\n${lines}\n\nRépondez avec le numéro du produit qui vous intéresse (ou *0* pour le menu).`,
    );
  };

  const askConfirm = async (next: Draft) => {
    const line: CartLine = {
      productId: next.productId!,
      name: next.productName!,
      image: null,
      unitPrice: next.unitPrice!,
      qty: next.qty ?? 1,
    };
    const { cartTotals, toShopOffer } = await import("@/lib/pricing");
    const { data: offerRows } = await supabaseAdmin
      .from("offers")
      .select("*")
      .eq("store_id", store.id)
      .eq("is_active", true);
    const offers = (offerRows ?? []).map(toShopOffer);
    const coupon = next.coupon ? await (await import("@/lib/orders.server")).findStoreCoupon(store.id, next.coupon) : null;
    const totals = cartTotals([line], offers, coupon);
    await save("confirm", next);
    await reply(
      `📋 *Récapitulatif*
${line.qty} × ${line.name}
${totals.offerDiscount ? `Remise offre : -${money(totals.offerDiscount, store.currency)}\n` : ""}${
        totals.couponDiscount
          ? `Code promo ${coupon?.code} : -${money(totals.couponDiscount, store.currency)}\n`
          : ""
      }*Total : ${money(totals.total, store.currency)}* (paiement à la livraison)

Nom : ${next.name}
Ville : ${next.city}
Adresse : ${next.address}

*1* — Confirmer ma commande
*2* — Annuler`,
    );
  };

  switch (state) {
    case "menu": {
      if (word === "1") return void (await showCatalog());
      if (word === "2") {
        await save("track", {});
        return void (await reply(
          "Indiquez votre *numéro de commande* (par exemple CMD-XXXXX) ou votre numéro de téléphone.",
        ));
      }
      if (word === "3") {
        const faq = readFaq(config.faq);
        if (faq.length === 0) {
          await save("menu", {});
          return void (await reply(
            `Écrivez votre question ici, ${store.store_name} vous répond très vite 🙏${
              store.contact_phone ? `\nOu appelez le ${store.contact_phone}.` : ""
            }`,
          ));
        }
        await save("faq", {});
        return void (await reply(
          `❓ *Questions fréquentes*\n\n${faq
            .map((entry, index) => `*${index + 1}* — ${entry.q}`)
            .join("\n")}\n\nRépondez avec le numéro de votre question (ou *0* pour le menu).`,
        ));
      }
      return void (await reply(menuText(store, config)));
    }

    case "faq": {
      const faq = readFaq(config.faq);
      const index = Number(word) - 1;
      const entry = faq[index];
      if (!entry) return void (await reply("Répondez avec le numéro d'une question, ou *0* pour le menu."));
      return void (await reply(
        `*${entry.q}*\n${entry.a}\n\nAutre question ? Envoyez un numéro, ou *0* pour le menu.`,
      ));
    }

    case "catalog": {
      const ids = draft.catalog ?? [];
      const index = Number(word) - 1;
      const productId = ids[index];
      if (!productId)
        return void (await reply("Répondez avec le numéro d'un produit de la liste, ou *0* pour le menu."));
      const { data } = await supabaseAdmin
        .from("products")
        .select("id, name, title, price, quantity, track_quantity, continue_selling_out_of_stock")
        .eq("id", productId)
        .single();
      if (!data) return void (await showCatalog());
      if (data.track_quantity && data.quantity <= 0 && !data.continue_selling_out_of_stock) {
        return void (await reply("Ce produit est en rupture de stock. Choisissez un autre numéro 🙏"));
      }
      const next: Draft = {
        ...draft,
        productId: data.id,
        productName: data.title || data.name,
        unitPrice: Number(data.price),
      };
      await save("qty", next);
      return void (await reply(
        `*${next.productName}* — ${money(next.unitPrice!, store.currency)}\n\nCombien d'unités voulez-vous ? Répondez par un chiffre (ex. 1).`,
      ));
    }

    case "qty": {
      const qty = Math.round(Number(word.replace(/[^0-9]/g, "")));
      if (!Number.isFinite(qty) || qty < 1 || qty > 99)
        return void (await reply("Indiquez une quantité entre 1 et 99."));
      await save("name", { ...draft, qty });
      return void (await reply("Parfait ✅ Quel est votre *nom complet* ?"));
    }

    case "name": {
      if (text.trim().length < 2) return void (await reply("Indiquez votre nom complet s'il vous plaît."));
      await save("city", { ...draft, name: text.trim() });
      return void (await reply("Dans quelle *ville* êtes-vous ?"));
    }

    case "city": {
      if (text.trim().length < 2) return void (await reply("Indiquez votre ville s'il vous plaît."));
      await save("address", { ...draft, city: text.trim() });
      return void (await reply(
        "Donnez votre *adresse de livraison* (quartier, repère, rue).",
      ));
    }

    case "address": {
      if (text.trim().length < 3) return void (await reply("Précisez un peu votre adresse 🙏"));
      const next: Draft = { ...draft, address: text.trim() };
      await save("coupon", next);
      return void (await reply(
        "Avez-vous un *code promo* ? Envoyez-le, sinon répondez *non*.",
      ));
    }

    case "coupon": {
      const next: Draft = { ...draft };
      if (!["non", "no", "aucun", "pas", "rien"].includes(word)) next.coupon = text.trim();
      return void (await askConfirm(next));
    }

    case "confirm": {
      if (word === "2") {
        await save("menu", {});
        return void (await reply("Commande annulée. Tapez *1* pour revoir les produits."));
      }
      if (word !== "1" && !["oui", "ok", "confirmer", "yes"].includes(word))
        return void (await reply("Répondez *1* pour confirmer ou *2* pour annuler."));
      if (!draft.productId || !draft.name) {
        await save("menu", {});
        return void (await reply(menuText(store, config)));
      }
      const placed = await placeOrder({
        store,
        lines: [
          {
            productId: draft.productId,
            name: draft.productName ?? "Produit",
            image: null,
            unitPrice: draft.unitPrice ?? 0,
            qty: draft.qty ?? 1,
          },
        ],
        customer: {
          name: draft.name,
          phone: from,
          address: draft.address ?? null,
          city: draft.city ?? null,
        },
        couponCode: draft.coupon ?? null,
        paymentMethod: "whatsapp_cod",
      });
      await save("menu", {});
      if (!placed)
        return void (await reply(
          "Désolé, la commande n'a pas pu être enregistrée. Réessayez dans un instant 🙏",
        ));
      return void (await reply(
        `🎉 Merci ${draft.name} ! Votre commande *${placed.orderNumber}* est enregistrée.
Total à payer à la livraison : *${money(placed.total, store.currency)}*.
${store.store_name} vous contacte très vite pour confirmer la livraison.

Tapez *2* à tout moment pour suivre votre commande.`,
      ));
    }

    case "track": {
      const search = text.trim();
      const query = supabaseAdmin
        .from("orders")
        .select("order_number, status, amount, currency, created_at")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
        .limit(3);
      const { data } = search.toUpperCase().startsWith("CMD")
        ? await query.ilike("order_number", search)
        : await query.eq("customer_phone", search.replace(/\s/g, ""));
      const found = data ?? [];
      await save("menu", {});
      if (found.length === 0)
        return void (await reply(
          "Aucune commande trouvée avec cette information. Vérifiez le numéro, ou tapez *0* pour le menu.",
        ));
      return void (await reply(
        `📦 *Vos commandes*\n\n${found
          .map(
            (order) =>
              `${order.order_number} — ${STATUS_LABEL[order.status] ?? order.status} (${money(
                Number(order.amount),
                order.currency,
              )})`,
          )
          .join("\n")}\n\nTapez *0* pour revenir au menu.`,
      ));
    }

    default: {
      await save("menu", {});
      return void (await reply(menuText(store, config)));
    }
  }
}

/** Traite un webhook Meta complet (plusieurs messages possibles). */
export async function processWebhookPayload(payload: unknown): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const root = (payload ?? {}) as {
    entry?: {
      changes?: {
        value?: {
          metadata?: { phone_number_id?: string };
          messages?: { from?: string; type?: string; text?: { body?: string }; button?: { text?: string }; interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } } }[];
        };
      }[];
    }[];
  };

  for (const entry of root.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id;
      const messages = value?.messages ?? [];
      if (!phoneNumberId || messages.length === 0) continue;

      const { data: configs } = await supabaseAdmin
        .from("store_whatsapp")
        .select("*")
        .eq("phone_number_id", phoneNumberId)
        .eq("is_active", true)
        .limit(1);
      const config = configs?.[0];
      if (!config) continue;

      const { data: stores } = await supabaseAdmin
        .from("store_settings")
        .select("*")
        .eq("id", config.store_id)
        .limit(1);
      const store = stores?.[0];
      if (!store || store.is_suspended) continue;

      for (const message of messages) {
        const from = message.from;
        if (!from) continue;
        const text =
          message.text?.body ??
          message.interactive?.button_reply?.title ??
          message.interactive?.list_reply?.title ??
          message.button?.text ??
          "";
        try {
          await handleIncomingMessage({ config, store, from, text: text || "menu" });
        } catch (error) {
          console.error("[whatsapp:handle]", error);
        }
      }
    }
  }
}
