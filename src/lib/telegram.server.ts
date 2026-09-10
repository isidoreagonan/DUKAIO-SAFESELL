/**
 * Moteur Telegram Officiel DUKAIO (@DukaioOfficialBot) - Version Pro.
 * Inclut :
 *  - Super-pouvoirs Admin pour @easy_573 (isidoreagonan@gmail.com)
 *  - Menu interactif riche à boutons (style E-commerce Pro)
 *  - Suivi des commandes, statistiques en temps réel et alertes stock
 *  - Création de produit assistée par DUKAIO AI avec décompte des crédits
 *  - Boutons WhatsApp 1-clic pour contacter les clients
 */
import { createHmac } from "node:crypto";
import type { OrderEmailPayload } from "@/lib/order-emails.server";

const TELEGRAM_API = "https://api.telegram.org/bot";

/** Super-Administrateurs DUKAIO autorisés */
export const ADMIN_USERNAMES = ["easy_573", "easy573", "dolapoecom"];
export const ADMIN_EMAILS = ["isidoreagonan@gmail.com"];

export type TelegramStoreConfig = {
  chatId: string;
  username?: string | null;
  firstName?: string | null;
  enabled: boolean;
  linkedAt: string;
};

function getBotToken(): string {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN non configuré");
  return token;
}

export function getBotUsername(): string {
  return process.env["TELEGRAM_BOT_USERNAME"] || "DukaioOfficialBot";
}

function getSecretKey(): string {
  return process.env["CRON_SECRET"] || process.env["SUPABASE_SERVICE_ROLE_KEY"] || "dukaio-telegram-secret";
}

/** Vérifie si l'utilisateur Telegram est un Super-Admin DUKAIO */
export function isSuperAdmin(username?: string | null, userId?: number | string): boolean {
  if (userId && (String(userId) === "7593951919" || String(userId) === "easy_573")) return true;
  if (!username) return false;
  const clean = username.replace(/^@/, "").toLowerCase();
  return ADMIN_USERNAMES.includes(clean);
}

/** Génère un jeton signé pour la liaison 1-clic depuis Telegram. */
export function generateTelegramConnectToken(storeId: string): string {
  const hmac = createHmac("sha256", getSecretKey());
  hmac.update(`tg-link:${storeId}`);
  const signature = hmac.digest("hex").slice(0, 12);
  return `link_${storeId}_${signature}`;
}

/** Valide un jeton de liaison Telegram. */
export function verifyTelegramConnectToken(token: string): { storeId: string } | null {
  if (!token.startsWith("link_")) return null;
  const parts = token.split("_");
  if (parts.length !== 3) return null;
  const [, storeId, signature] = parts;
  if (!storeId || !signature) return null;

  const hmac = createHmac("sha256", getSecretKey());
  hmac.update(`tg-link:${storeId}`);
  const expected = hmac.digest("hex").slice(0, 12);
  if (signature !== expected) return null;
  return { storeId };
}

/** Génère l'URL directe pour ouvrir le bot avec le jeton de liaison. */
export function getTelegramConnectUrl(storeId: string): string {
  const token = generateTelegramConnectToken(storeId);
  const username = getBotUsername();
  return `https://t.me/${username}?start=${token}`;
}

export type InlineKeyboardButton =
  | { text: string; url: string }
  | { text: string; callback_data: string };

export type SendMessageOptions = {
  parseMode?: "HTML" | "MarkdownV2";
  inlineKeyboard?: InlineKeyboardButton[][];
  disableWebPagePreview?: boolean;
};

function sanitizeKeyboard(keyboard?: InlineKeyboardButton[][]): InlineKeyboardButton[][] | undefined {
  if (!keyboard) return undefined;
  return keyboard.map((row) =>
    row.map((btn) => {
      if ("url" in btn && btn.url) {
        let cleanUrl = btn.url;
        if (cleanUrl.includes("localhost") || cleanUrl.includes("127.0.0.1")) {
          cleanUrl = cleanUrl.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, "https://dukaio.com");
        }
        return { text: btn.text, url: cleanUrl };
      }
      return btn;
    }),
  );
}

/** Envoie un message via l'API Telegram. */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options: SendMessageOptions = {},
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  try {
    const token = getBotToken();
    const cleanKeyboard = sanitizeKeyboard(options.inlineKeyboard);
    const body: Record<string, unknown> = {
      chat_id: String(chatId),
      text,
      parse_mode: options.parseMode ?? "HTML",
      disable_web_page_preview: options.disableWebPagePreview ?? true,
    };

    if (cleanKeyboard && cleanKeyboard.length > 0) {
      body["reply_markup"] = {
        inline_keyboard: cleanKeyboard,
      };
    }

    const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as { ok: boolean; result?: { message_id: number }; description?: string };
    if (!data.ok) {
      console.error("[Telegram Send Message Error]", data.description, "to chatId:", chatId);
      return { ok: false, error: data.description || "Erreur Telegram" };
    }
    return { ok: true, messageId: data.result?.message_id };
  } catch (error) {
    console.error("[Telegram Send Message Exception]", error);
    return { ok: false, error: (error as Error).message };
  }
}

/** Récupère l'URL publique d'un fichier envoyé sur Telegram */
export async function getTelegramFileUrl(fileId: string): Promise<string | null> {
  try {
    const token = getBotToken();
    const res = await fetch(`${TELEGRAM_API}${token}/getFile?file_id=${fileId}`);
    const data = (await res.json()) as { ok: boolean; result?: { file_path?: string } };
    if (!data.ok || !data.result?.file_path) return null;
    return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
  } catch {
    return null;
  }
}

/** Envoie une photo avec légende via l'API Telegram. */
export async function sendTelegramPhoto(
  chatId: string | number,
  photoUrl: string,
  caption: string,
  options: SendMessageOptions = {},
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  try {
    const token = getBotToken();
    const body: Record<string, unknown> = {
      chat_id: String(chatId),
      photo: photoUrl,
      caption: caption.slice(0, 1024),
      parse_mode: options.parseMode ?? "HTML",
    };
    if (options.inlineKeyboard && options.inlineKeyboard.length > 0) {
      body["reply_markup"] = { inline_keyboard: options.inlineKeyboard };
    }
    const response = await fetch(`${TELEGRAM_API}${token}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as { ok: boolean; result?: { message_id: number }; description?: string };
    if (!data.ok) {
      return sendTelegramMessage(chatId, `${caption}\n\n🖼️ <i>Image : ${photoUrl}</i>`, options);
    }
    return { ok: true, messageId: data.result?.message_id };
  } catch {
    return sendTelegramMessage(chatId, caption, options);
  }
}

/** Envoie un groupe de médias (album photo) via l'API Telegram. */
export async function sendTelegramMediaGroup(
  chatId: string | number,
  media: Array<{ type: "photo"; media: string; caption?: string; parse_mode?: string }>,
): Promise<{ ok: boolean; messageIds?: number[]; error?: string }> {
  try {
    const token = getBotToken();
    const response = await fetch(`${TELEGRAM_API}${token}/sendMediaGroup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: String(chatId),
        media,
      }),
    });
    const data = (await response.json()) as {
      ok: boolean;
      result?: Array<{ message_id: number }>;
      description?: string;
    };
    if (!data.ok) {
      return { ok: false, error: data.description };
    }
    return { ok: true, messageIds: data.result?.map((r) => r.message_id) };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/** Modifie le texte et le clavier d'un message existant dans Telegram */
export async function editTelegramMessageText(
  chatId: string | number,
  messageId: number,
  text: string,
  options: SendMessageOptions = {},
): Promise<{ ok: boolean; error?: string }> {
  try {
    const token = getBotToken();
    const body: Record<string, unknown> = {
      chat_id: String(chatId),
      message_id: messageId,
      text,
      parse_mode: options.parseMode ?? "HTML",
      disable_web_page_preview: options.disableWebPagePreview ?? true,
    };
    if (options.inlineKeyboard) {
      body["reply_markup"] = { inline_keyboard: options.inlineKeyboard };
    }
    const response = await fetch(`${TELEGRAM_API}${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as { ok: boolean; description?: string };
    return { ok: data.ok, error: data.description };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/** Modifie uniquement le clavier d'un message existant */
export async function editTelegramMessageReplyMarkup(
  chatId: string | number,
  messageId: number,
  inlineKeyboard: InlineKeyboardButton[][],
): Promise<{ ok: boolean }> {
  try {
    const token = getBotToken();
    const response = await fetch(`${TELEGRAM_API}${token}/editMessageReplyMarkup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: String(chatId),
        message_id: messageId,
        reply_markup: { inline_keyboard: inlineKeyboard },
      }),
    });
    const data = (await response.json()) as { ok: boolean };
    return { ok: data.ok };
  } catch {
    return { ok: false };
  }
}

/** Répond à un callback query (clic sur bouton). */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert = false,
): Promise<void> {
  try {
    const token = getBotToken();
    await fetch(`${TELEGRAM_API}${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    });
  } catch {
    /* ignorer */
  }
}

/** Configure les commandes par défaut visibles par tous les vendeurs dans le menu Telegram (sans /admin). */
export async function registerTelegramCommands(): Promise<boolean> {
  try {
    const token = getBotToken();
    const commands = [
      { command: "start", description: "🚀 Menu principal & Tableau de bord" },
      { command: "boutique", description: "🏪 Voir ma boutique en ligne" },
      { command: "stats", description: "📊 Chiffre d'affaires & Ventes du jour" },
      { command: "commandes", description: "📦 Suivi des dernières commandes" },
      { command: "credits", description: "⚡ Mon solde de crédits DUKAIO AI" },
      { command: "profil", description: "👤 Mon profil vendeur DUKAIO" },
      { command: "aide", description: "💬 Assistance & Guide d'utilisation" },
    ];

    const response = await fetch(`${TELEGRAM_API}${token}/setMyCommands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commands, scope: { type: "default" } }),
    });

    const data = (await response.json()) as { ok: boolean };
    return data.ok;
  } catch {
    return false;
  }
}

/** Configure les commandes enrichies avec /admin EXCLUSIVEMENT pour le compte du Super-Admin (@easy_573). */
export async function registerAdminTelegramCommands(chatId: string | number): Promise<boolean> {
  try {
    const token = getBotToken();
    const commands = [
      { command: "start", description: "🚀 Menu principal & Tableau de bord" },
      { command: "admin", description: "👑 Panneau Super-Admin Master" },
      { command: "stats", description: "📊 Chiffre d'affaires & Ventes du jour" },
      { command: "commandes", description: "📦 Suivi des dernières commandes" },
      { command: "credits", description: "⚡ Mon solde de crédits DUKAIO AI" },
      { command: "boutique", description: "🏪 Voir ma boutique en ligne" },
      { command: "profil", description: "👤 Mon profil vendeur DUKAIO" },
      { command: "aide", description: "💬 Assistance & Support 24/7" },
    ];

    const response = await fetch(`${TELEGRAM_API}${token}/setMyCommands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commands,
        scope: { type: "chat", chat_id: String(chatId) },
      }),
    });

    const data = (await response.json()) as { ok: boolean };
    return data.ok;
  } catch {
    return false;
  }
}

const storeLookupCache = new Map<string, { store: any; expiresAt: number }>();

/** Trouve la boutique liée à un chatId Telegram (avec cache ultra-rapide). */
export async function getStoreByTelegramChatId(chatId: string | number) {
  const targetId = String(chatId);
  const now = Date.now();
  const cached = storeLookupCache.get(targetId);
  if (cached && cached.expiresAt > now) {
    return cached.store;
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  
  // 1. Recherche directe par filtre JSON Supabase
  const { data: matchedStores } = await supabaseAdmin
    .from("store_settings")
    .select("id, store_name, currency, language, subdomain, custom_domain, user_id, theme_config")
    .contains("theme_config", { telegram: { chatId: targetId } })
    .limit(1);

  if (matchedStores && matchedStores.length > 0) {
    storeLookupCache.set(targetId, { store: matchedStores[0], expiresAt: now + 120_000 });
    return matchedStores[0];
  }

  // 2. Fallback avec parcours direct
  const { data: stores } = await supabaseAdmin
    .from("store_settings")
    .select("id, store_name, currency, language, subdomain, custom_domain, user_id, theme_config")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (stores) {
    for (const store of stores) {
      const theme = (store.theme_config as Record<string, unknown> | null) ?? {};
      const tg = theme["telegram"] as TelegramStoreConfig | undefined;
      if (tg && String(tg.chatId) === targetId) {
        storeLookupCache.set(targetId, { store, expiresAt: now + 120_000 });
        return store;
      }
    }
  }

  return null;
}

/** Associe un compte Telegram à une boutique DUKAIO. */
export async function linkStoreTelegram(
  storeId: string,
  chatId: string | number,
  userMeta?: { username?: string; first_name?: string },
): Promise<{ ok: boolean; storeName?: string }> {
  storeLookupCache.delete(String(chatId));
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: store, error } = await supabaseAdmin
    .from("store_settings")
    .select("id, store_name, theme_config")
    .eq("id", storeId)
    .single();

  if (error || !store) return { ok: false };

  const currentTheme = (store.theme_config as Record<string, unknown> | null) ?? {};
  const telegramConfig: TelegramStoreConfig = {
    chatId: String(chatId),
    username: userMeta?.username ?? null,
    firstName: userMeta?.first_name ?? null,
    enabled: true,
    linkedAt: new Date().toISOString(),
  };

  const updatedTheme = {
    ...currentTheme,
    telegram: telegramConfig,
  };

  await supabaseAdmin
    .from("store_settings")
    .update({ theme_config: updatedTheme })
    .eq("id", storeId);

  storeLookupCache.delete(String(chatId));
  return { ok: true, storeName: store.store_name };
}

/** Dissocie le compte Telegram d'une boutique. */
export async function unlinkStoreTelegram(storeId: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: store } = await supabaseAdmin
    .from("store_settings")
    .select("id, theme_config")
    .eq("id", storeId)
    .single();

  if (!store) return false;
  const currentTheme = (store.theme_config as Record<string, unknown> | null) ?? {};
  const tg = currentTheme["telegram"] as { chatId?: string } | undefined;
  if (tg?.chatId) {
    storeLookupCache.delete(String(tg.chatId));
  }
  const { telegram: _, ...rest } = currentTheme;

  await supabaseAdmin
    .from("store_settings")
    .update({ theme_config: rest })
    .eq("id", storeId);

  return true;
}

/** Formate un numéro de téléphone pour un lien WhatsApp direct. */
function cleanPhoneForWhatsApp(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Notifie le vendeur sur Telegram d'une nouvelle commande reçue. */
export async function sendTelegramOrderNotification(
  storeId: string,
  payload: OrderEmailPayload,
): Promise<{ ok: boolean }> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: store } = await supabaseAdmin
      .from("store_settings")
      .select("id, store_name, theme_config, custom_domain, subdomain")
      .eq("id", storeId)
      .single();

    if (!store) return { ok: false };
    const theme = (store.theme_config as Record<string, unknown> | null) ?? {};
    const telegram = theme["telegram"] as TelegramStoreConfig | undefined;

    if (!telegram || !telegram.chatId || telegram.enabled === false) {
      return { ok: false };
    }

    const itemsText = payload.lines
      .map((l) => `  • <b>${l.qty}x</b> ${escapeHtml(l.name)} (<i>${money(l.total, payload.currency)}</i>)`)
      .join("\n");

    const message = [
      `🎉 <b>NOUVELLE COMMANDE REÇUE !</b> 🛒`,
      ``,
      `🏪 <b>Boutique :</b> <code>${escapeHtml(payload.storeName)}</code>`,
      `🔖 <b>N° Commande :</b> <code>${escapeHtml(payload.orderNumber)}</code>`,
      ``,
      `👤 <b>Client :</b> <b>${escapeHtml(payload.customerName)}</b>`,
      `📞 <b>Téléphone :</b> <code>${escapeHtml(payload.customerPhone)}</code>`,
      payload.city ? `📍 <b>Ville :</b> ${escapeHtml(payload.city)}` : "",
      payload.address ? `🏠 <b>Adresse :</b> ${escapeHtml(payload.address)}` : "",
      payload.note ? `📝 <b>Note :</b> <i>${escapeHtml(payload.note)}</i>` : "",
      ``,
      `📦 <b>Articles commandés :</b>`,
      itemsText,
      payload.discount ? `🏷️ <i>Remise : -${money(payload.discount, payload.currency)}</i>` : "",
      ``,
      `💰 <b>TOTAL À ENCAISSER :</b> <b>${money(payload.total, payload.currency)}</b>`,
      `💳 <i>Mode : Paiement à la livraison (COD)</i>`,
    ]
      .filter(Boolean)
      .join("\n");

    const cleanPhone = cleanPhoneForWhatsApp(payload.customerPhone);
    const whatsappGreeting = encodeURIComponent(
      `Bonjour ${payload.customerName}, nous avons bien reçu votre commande ${payload.orderNumber} sur ${payload.storeName} pour un montant de ${money(payload.total, payload.currency)}. Confirmez-vous la livraison à ${payload.city || "votre adresse"} ?`,
    );

    const inlineKeyboard: InlineKeyboardButton[][] = [];

    if (cleanPhone) {
      inlineKeyboard.push([
        {
          text: "💬 Contacter le client sur WhatsApp",
          url: `https://wa.me/${cleanPhone}?text=${whatsappGreeting}`,
        },
      ]);
    }

    inlineKeyboard.push([
      {
        text: "📦 Voir la commande sur DUKAIO",
        url: "https://dukaio.com/dashboard/commandes",
      },
    ]);

    await sendTelegramMessage(telegram.chatId, message, { inlineKeyboard });
    return { ok: true };
  } catch (error) {
    console.error("[Telegram] Échec d'envoi de la notification:", error);
    return { ok: false };
  }
}

/** Envoie un message de test au vendeur. */
export async function sendTelegramTestNotification(
  chatId: string | number,
  storeName: string,
): Promise<{ ok: boolean; error?: string }> {
  const text = [
    `✅ <b>TEST DE NOTIFICATION RÉUSSI !</b> 🚀`,
    ``,
    `Votre bot <b>DUKAIO Official</b> est connecté à votre boutique <b>${escapeHtml(storeName)}</b>.`,
    ``,
    `🔔 Vos prochaines commandes arriveront ici automatiquement en temps réel avec :`,
    `• Nom, téléphone et ville du client`,
    `• Montant total exact à encaisser`,
    `• Bouton WhatsApp direct en 1 clic`,
  ].join("\n");

  return sendTelegramMessage(chatId, text);
}

export function getAppBaseUrl(): string {
  const custom = process.env["APP_URL"];
  if (custom && !custom.includes("localhost") && !custom.includes("127.0.0.1")) {
    return custom.replace(/\/$/, "");
  }
  if (process.env["VERCEL_PROJECT_PRODUCTION_URL"]) {
    return `https://${process.env["VERCEL_PROJECT_PRODUCTION_URL"]}`;
  }
  return "https://dukaio.com";
}

/** Construit et envoie le Menu Principal Interactif (style E-commerce Pro conforme aux captures) */
export async function sendMainMenu(
  chatId: string | number,
  from?: { username?: string; first_name?: string },
): Promise<void> {
  const store = await getStoreByTelegramChatId(chatId);
  const isAdmin = isSuperAdmin(from?.username);
  const userName = from?.first_name || (from?.username ? `@${from.username}` : "Vendeur");
  const baseUrl = getAppBaseUrl();

  const intro = [
    `🔥 <b>Bienvenue sur DUKAIO Official Bot</b> 🚀`,
    ``,
    `Bonjour <b>${escapeHtml(userName)}</b> 👋`,
    ``,
    `La plateforme e-commerce tout-en-un avec livraison COD, génération de produits par IA et notifications instantanées.`,
    ``,
    store
      ? `🏪 <b>Boutique connectée :</b> <code>${escapeHtml(store.store_name)}</code>`
      : `⚠️ <i>Aucune boutique liée pour l'instant.</i>`,
    ``,
    `<blockquote>` +
      `🏪 <b>Boutique</b> — Accédez à votre boutique en ligne\n` +
      `💎 <b>Crédits IA</b> — Solde de génération DUKAIO AI\n` +
      `📦 <b>Commandes</b> — Suivi en temps réel & contact client\n` +
      `📊 <b>Statistiques</b> — Ventes & chiffre d'affaires du jour\n` +
      `🤝 <b>Support</b> — Assistance rapide par notre équipe\n` +
      (isAdmin ? `👑 <b>Super-Admin</b> — Contrôle total de la plateforme` : `🎁 <b>Programme</b> — Parrainez et gagnez des crédits`) +
      `</blockquote>`,
  ].join("\n");

  const inlineKeyboard: InlineKeyboardButton[][] = [];

  if (store) {
    const storeUrl = store.custom_domain
      ? `https://${store.custom_domain}`
      : `${baseUrl}/s/${store.subdomain || store.id}`;

    inlineKeyboard.push([{ text: "🏪 Ma Boutique en Ligne", url: storeUrl }]);
    inlineKeyboard.push([
      { text: "💎 Mes Crédits IA", callback_data: "cmd_credits" },
      { text: "👤 Mon Profil", callback_data: "cmd_profile" },
    ]);
    inlineKeyboard.push([
      { text: "📦 Mes Commandes", callback_data: "cmd_orders" },
      { text: "📊 Mes Statistiques", callback_data: "cmd_stats" },
    ]);
    inlineKeyboard.push([
      { text: "✨ Créer avec DUKAIO AI (Web)", url: `${baseUrl}/dashboard/produits/ia` },
    ]);
  } else {
    inlineKeyboard.push([
      { text: "🔗 Connecter ma boutique DUKAIO", url: `${baseUrl}/dashboard/parametres` },
    ]);
  }

  if (isAdmin) {
    inlineKeyboard.push([
      { text: "👑 Super-Admin Master Control ⚡", callback_data: "cmd_admin_panel" },
    ]);
  }

  inlineKeyboard.push([
    { text: "🤝 Support & Aide", url: "https://wa.me/22900000000" },
    { text: "📢 Canal Officiel", url: "https://t.me/DukaioOfficial" },
  ]);

  await sendTelegramMessage(chatId, intro, { inlineKeyboard });
}

/** Affiche les détails du profil vendeur et boutique */
export async function sendSellerProfile(
  chatId: string | number,
  from?: { username?: string; first_name?: string },
): Promise<void> {
  const store = await getStoreByTelegramChatId(chatId);
  const isAdmin = isSuperAdmin(from?.username);
  const baseUrl = getAppBaseUrl();

  if (!store) {
    await sendTelegramMessage(
      chatId,
      "⚠️ <b>Aucune boutique liée.</b> Ouvrez Paramètres DUKAIO pour connecter votre compte.",
      {
        inlineKeyboard: [
          [{ text: "🔗 Lier ma Boutique", url: `${baseUrl}/dashboard/parametres` }],
          [{ text: "🔙 Menu Principal", callback_data: "cmd_main_menu" }],
        ],
      },
    );
    return;
  }

  const { subscriptionState } = await import("@/lib/subscription.server");
  const state = await subscriptionState(store.user_id);

  const planName = state.unlimited ? "PRO (SUPER-ADMIN)" : state.plan.name.toUpperCase();
  const creditsText = state.unlimited
    ? "Illimité (Admin)"
    : state.limits.aiCredits === 0
      ? "0 (Formule Découverte sans IA)"
      : `${state.aiLeft} / ${state.limits.aiCredits}`;

  const storeUrl = store.custom_domain
    ? `https://${store.custom_domain}`
    : `${baseUrl}/s/${store.subdomain || store.id}`;

  const message = [
    `👤 <b>PROFIL VENDEUR DUKAIO</b>`,
    ``,
    `🏪 <b>Boutique :</b> <b>${escapeHtml(store.store_name)}</b>`,
    `🌐 <b>Lien public :</b> ${storeUrl}`,
    `🌍 <b>Devise :</b> ${store.currency || "FCFA"}`,
    `👑 <b>Rôle :</b> ${isAdmin ? "👑 Super-Administrateur Master" : "Vendeur DUKAIO"}`,
    ``,
    `💎 <b>Formule active :</b> <b>${planName}</b>`,
    `⚡ <b>Crédits IA disponibles :</b> <b>${creditsText}</b>`,
    `📊 <b>Générations utilisées ce mois :</b> ${state.aiUsed}`,
    `🆔 <b>Telegram ID :</b> <code>${chatId}</code>`,
  ].join("\n");

  const inlineKeyboard: InlineKeyboardButton[][] = [
    [
      { text: "🏪 Voir la Boutique", url: storeUrl },
      { text: "⚙️ Dashboard Web", url: `${baseUrl}/dashboard` },
    ],
    [{ text: "🔙 Menu Principal", callback_data: "cmd_main_menu" }],
  ];

  await sendTelegramMessage(chatId, message, { inlineKeyboard });
}

/** Affiche les statistiques du jour d'une boutique */
export async function sendStoreStats(chatId: string | number): Promise<void> {
  const store = await getStoreByTelegramChatId(chatId);
  if (!store) {
    await sendTelegramMessage(
      chatId,
      "⚠️ <b>Boutique non connectée</b>. Rendez-vous dans Paramètres DUKAIO pour lier votre compte.",
    );
    return;
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("amount, status, created_at")
    .or(`store_id.eq.${store.id},user_id.eq.${store.user_id}`)
    .gte("created_at", todayStart.toISOString());

  const list = orders || [];
  const totalRev = list.reduce((acc, o) => acc + (Number(o.amount) || 0), 0);
  const totalOrders = list.length;
  const pendingOrders = list.filter((o) => o.status === "pending" || o.status === "processing").length;
  const currency = store.currency || "FCFA";

  const message = [
    `📊 <b>BILAN DU JOUR — ${escapeHtml(store.store_name)}</b>`,
    ``,
    `💰 <b>Chiffre d'affaires :</b> <b>${money(totalRev, currency)}</b>`,
    `🛒 <b>Commandes du jour :</b> <b>${totalOrders}</b>`,
    `⏳ <b>En attente de livraison :</b> <b>${pendingOrders}</b>`,
    ``,
    `<i>Actualisé en temps réel depuis votre base DUKAIO.</i>`,
  ].join("\n");

  const inlineKeyboard: InlineKeyboardButton[][] = [
    [
      { text: "📦 Voir les commandes", callback_data: "cmd_orders" },
      { text: "🔙 Menu Principal", callback_data: "cmd_main_menu" },
    ],
  ];

  await sendTelegramMessage(chatId, message, { inlineKeyboard });
}

/** Affiche les dernières commandes d'une boutique */
export async function sendLatestOrders(chatId: string | number): Promise<void> {
  const store = await getStoreByTelegramChatId(chatId);
  const baseUrl = getAppBaseUrl();

  if (!store) {
    await sendTelegramMessage(
      chatId,
      "⚠️ <b>Boutique non connectée</b>. Rendez-vous dans Paramètres DUKAIO pour lier votre compte.",
    );
    return;
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: orders, error: ordersErr } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, shipping_city, shipping_address, amount, status, created_at")
    .or(`store_id.eq.${store.id},user_id.eq.${store.user_id}`)
    .order("created_at", { ascending: false })
    .limit(5);

  if (ordersErr) {
    console.error("[Telegram Latest Orders Error]", ordersErr);
  }

  if (!orders || orders.length === 0) {
    await sendTelegramMessage(
      chatId,
      `📦 <b>Aucune commande enregistrée pour le moment sur ${escapeHtml(store.store_name)}.</b>\n\nPartagez votre lien boutique pour déclencher vos premières ventes !`,
      {
        inlineKeyboard: [[{ text: "🔙 Menu Principal", callback_data: "cmd_main_menu" }]],
      },
    );
    return;
  }

  const currency = store.currency || "FCFA";
  const items = orders.map((o) => {
    const statusEmoji = o.status === "delivered" ? "✅" : o.status === "cancelled" ? "❌" : "⏳";
    const city = o.shipping_city || o.shipping_address || "Livraison";
    return `• <b>${o.order_number}</b> — <b>${money(Number(o.amount || 0), currency)}</b>\n  👤 ${escapeHtml(o.customer_name || "Client")} (${escapeHtml(city)})\n  📞 <code>${o.customer_phone || "Non renseigné"}</code> · ${statusEmoji} <i>${o.status || "En attente"}</i>`;
  });

  const message = [
    `📦 <b>5 DERNIÈRES COMMANDES — ${escapeHtml(store.store_name)}</b>`,
    ``,
    items.join("\n\n"),
  ].join("\n");

  const inlineKeyboard: InlineKeyboardButton[][] = [
    [
      { text: "📊 Tableau de bord", url: `${baseUrl}/dashboard/commandes` },
      { text: "🔙 Menu Principal", callback_data: "cmd_main_menu" },
    ],
  ];

  await sendTelegramMessage(chatId, message, { inlineKeyboard });
}

/** Affiche le solde réel de crédits IA selon la formule DUKAIO */
export async function sendAiCreditsStatus(chatId: string | number): Promise<void> {
  const store = await getStoreByTelegramChatId(chatId);
  const baseUrl = getAppBaseUrl();

  if (!store) {
    await sendTelegramMessage(
      chatId,
      "⚠️ <b>Boutique non connectée</b>. Rendez-vous dans Paramètres DUKAIO pour lier votre compte.",
    );
    return;
  }

  const { subscriptionState } = await import("@/lib/subscription.server");
  const state = await subscriptionState(store.user_id);

  if (state.unlimited) {
    const message = [
      `⚡ <b>VOS CRÉDITS DUKAIO AI</b> 🧠`,
      ``,
      `🌟 <b>Formule active :</b> <b>PRO (SUPER-ADMIN)</b>`,
      `💎 <b>Crédits restants :</b> <b>Illimité</b>`,
      `📊 <b>Générations utilisées :</b> ${state.aiUsed}`,
      ``,
      `<i>Accès complet et illimité à tous les moteurs IA de la plateforme.</i>`,
    ].join("\n");

    const inlineKeyboard: InlineKeyboardButton[][] = [
      [{ text: "✨ Créer un produit avec l'IA", callback_data: "cmd_ai_create" }],
      [{ text: "🔙 Menu Principal", callback_data: "cmd_main_menu" }],
    ];

    await sendTelegramMessage(chatId, message, { inlineKeyboard });
    return;
  }

  if (state.limits.aiCredits === 0) {
    const message = [
      `⚡ <b>VOS CRÉDITS DUKAIO AI</b> 🧠`,
      ``,
      `🌟 <b>Formule active :</b> <b>DÉCOUVERTE (GRATUIT)</b>`,
      `💎 <b>Crédits restants :</b> <b>0</b>`,
      `📊 <b>Générations utilisées :</b> 0`,
      ``,
      `⚠️ <i>La formule gratuite Découverte ne comprend pas de crédits de génération IA. La création de produits se fait manuellement.</i>`,
      ``,
      `💎 <b>Passez à Starter (10 crédits/mois) ou Pro (30 crédits/mois) pour générer vos pages produits automatiquement par IA !</b>`,
    ].join("\n");

    const inlineKeyboard: InlineKeyboardButton[][] = [
      [{ text: "💎 Débloquer l'IA (Starter / Pro)", url: `${baseUrl}/dashboard/parametres` }],
      [{ text: "🔙 Menu Principal", callback_data: "cmd_main_menu" }],
    ];

    await sendTelegramMessage(chatId, message, { inlineKeyboard });
    return;
  }

  // Formule payante (Starter ou Pro)
  const message = [
    `⚡ <b>VOS CRÉDITS DUKAIO AI</b> 🧠`,
    ``,
    `🌟 <b>Formule active :</b> <b>${state.plan.name.toUpperCase()}</b>`,
    `💎 <b>Crédits restants ce mois :</b> <b>${state.aiLeft} / ${state.limits.aiCredits}</b>`,
    `📊 <b>Générations utilisées :</b> ${state.aiUsed}`,
    ``,
    `<i>Chaque création complète de page de vente avec DUKAIO AI consomme 1 crédit IA selon les moteurs définis par l'admin (Gemini / Kie.ai).</i>`,
  ].join("\n");

  const inlineKeyboard: InlineKeyboardButton[][] = [
    [
      { text: "✨ Ouvrir DUKAIO AI (Web)", url: `${baseUrl}/dashboard/produits/ia` },
      { text: "💎 Gérer mon abonnement", url: `${baseUrl}/dashboard/parametres` },
    ],
    [{ text: "🔙 Menu Principal", callback_data: "cmd_main_menu" }],
  ];

  await sendTelegramMessage(chatId, message, { inlineKeyboard });
}

/** Panneau Super-Admin réservé à @easy_573 (isidoreagonan@gmail.com) */
export async function sendAdminPanel(chatId: string | number): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { getAiEngineSettings } = await import("@/lib/ai-engine.server");
  const baseUrl = getAppBaseUrl();

  // Métriques globales de la plateforme
  const { count: totalStores } = await supabaseAdmin.from("store_settings").select("*", { count: "exact", head: true });
  const { count: totalOrders } = await supabaseAdmin.from("orders").select("*", { count: "exact", head: true });
  const { data: recentOrders } = await supabaseAdmin
    .from("orders")
    .select("amount")
    .order("created_at", { ascending: false })
    .limit(100);

  const aiEngine = await getAiEngineSettings();
  const totalVolume = (recentOrders || []).reduce((acc, o) => acc + (Number(o.amount) || 0), 0);

  const message = [
    `👑 <b>PANNEAU SUPER-ADMINISTRATEUR DUKAIO MASTER</b> ⚡`,
    `👤 <i>Identifié : @easy_573 (isidoreagonan@gmail.com)</i>`,
    ``,
    `📊 <b>MÉTRIQUES GLOBALES DE LA PLATEFORME :</b>`,
    `🏪 <b>Boutiques créées :</b> <b>${totalStores ?? 0}</b>`,
    `🛒 <b>Commandes totales :</b> <b>${totalOrders ?? 0}</b>`,
    `💰 <b>Volume d'affaires (100 dernières) :</b> <b>${money(totalVolume, "FCFA")}</b>`,
    ``,
    `🧠 <b>MOTEURS IA ACTIFS (DÉFINIS DANS VOTRE DASHBOARD) :</b>`,
    `✍️ <b>Génération Texte :</b> <code>${aiEngine.textEngine.toUpperCase()}</code>`,
    `🎨 <b>Génération Image :</b> <code>${aiEngine.imageEngine.toUpperCase()}</code>`,
    `🛡️ <b>Secours Kie.ai automatique :</b> <code>${aiEngine.fallbackToKie ? "ACTIF" : "INACTIF"}</code>`,
    ``,
    `🛠️ <b>COMMANDES SUPER-POUVOIRS DISPONIBLES :</b>`,
    `• <code>/broadcast &lt;message&gt;</code> — Envoyer une annonce à TOUS les vendeurs`,
    `• <code>/modeles</code> — Voir la configuration IA`,
  ].join("\n");

  const inlineKeyboard: InlineKeyboardButton[][] = [
    [
      { text: "📊 Dashboard Admin Web", url: `${baseUrl}/dashboard/analyses` },
      { text: "🧠 Réglage Modèles IA", url: `${baseUrl}/dashboard/admin/modeles-ia` },
    ],
    [{ text: "🔙 Menu Principal", callback_data: "cmd_main_menu" }],
  ];

  await sendTelegramMessage(chatId, message, { inlineKeyboard });
}

/** Envoie un message broadcast à tous les vendeurs connectés (Super-Admin) */
export async function sendBroadcastMessage(adminChatId: string | number, announcement: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: stores } = await supabaseAdmin.from("store_settings").select("id, store_name, theme_config");

  if (!stores || stores.length === 0) {
    await sendTelegramMessage(adminChatId, "Aucune boutique enregistrée.");
    return;
  }

  let sent = 0;
  const broadcastText = [
    `📢 <b>ANNONCE OFFICIELLE DUKAIO</b> 🌟`,
    ``,
    escapeHtml(announcement),
    ``,
    `<i>L'équipe DUKAIO E-Commerce</i>`,
  ].join("\n");

  for (const s of stores) {
    const theme = (s.theme_config as Record<string, unknown> | null) ?? {};
    const tg = theme["telegram"] as TelegramStoreConfig | undefined;
    if (tg?.chatId) {
      await sendTelegramMessage(tg.chatId, broadcastText);
      sent++;
    }
  }

  await sendTelegramMessage(adminChatId, `✅ <b>Annonce envoyée avec succès à ${sent} vendeur(s) DUKAIO !</b>`);
}

/** Envoie les informations pour accéder à l'assistant DUKAIO AI sur le Web */
export async function sendAiCreationGuide(chatId: string | number): Promise<void> {
  const store = await getStoreByTelegramChatId(chatId);
  const baseUrl = getAppBaseUrl();

  if (!store) {
    await sendTelegramMessage(
      chatId,
      "⚠️ <b>Boutique non connectée</b>. Rendez-vous dans les Paramètres DUKAIO pour lier votre compte.",
      {
        inlineKeyboard: [
          [{ text: "🔗 Connecter ma Boutique", url: `${baseUrl}/dashboard/parametres` }],
          [{ text: "🔙 Menu Principal", callback_data: "cmd_main_menu" }],
        ],
      },
    );
    return;
  }

  const { subscriptionState } = await import("@/lib/subscription.server");
  const state = await subscriptionState(store.user_id);

  const message = [
    `✨ <b>GÉNÉRATEUR DE PRODUITS DUKAIO AI</b> 🧠`,
    ``,
    `Créez vos fiches produits ultra-vendeuses directement depuis votre <b>Studio DUKAIO AI Web</b> :`,
    ``,
    `🎯 <b>Fonctionnalités du Studio Web :</b>`,
    `• 📸 <b>Génération IA ultra-rapide</b> par URL (AliExpress, Amazon, TikTok…), photo ou simple idée`,
    `• 🎨 <b>Choix du style visuel</b> (Studio Pro, Lifestyle, Rendu 3D)`,
    `• 💬 <b>Avis clients & témoignages crédibles</b> générés en 1 clic`,
    `• 👁️ <b>Prévisualisation en direct</b> avant mise en ligne`,
    ``,
    `💎 <i>Solde : ${state.unlimited ? "Illimité (Super-Admin)" : `${state.aiLeft} crédit(s) restants`}</i>`,
  ].join("\n");

  const inlineKeyboard: InlineKeyboardButton[][] = [
    [
      { text: "🚀 Ouvrir DUKAIO AI (Web)", url: `${baseUrl}/dashboard/produits/ia` },
    ],
    [
      { text: "📦 Voir mes Produits", url: `${baseUrl}/dashboard/produits` },
      { text: "🔙 Menu Principal", callback_data: "cmd_main_menu" },
    ],
  ];

  await sendTelegramMessage(chatId, message, { inlineKeyboard });
}

/** Recharger manuellement des crédits IA à un vendeur (Super-Admin) */
export async function grantUserAiCredits(
  adminChatId: string | number,
  email: string,
  creditsToAdd: number,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: user, error: userErr } = await supabaseAdmin
    .from("users")
    .select("id, email")
    .eq("email", email.trim().toLowerCase())
    .single();

  if (userErr || !user) {
    await sendTelegramMessage(adminChatId, `❌ Aucun utilisateur trouvé avec l'email <code>${escapeHtml(email)}</code>.`);
    return;
  }

  const { data: subscription } = await supabaseAdmin
    .from("subscriptions")
    .select("id, ai_credits_used, custom_credits")
    .eq("user_id", user.id)
    .single();

  if (subscription) {
    const currentCustom = Number(subscription.custom_credits || 0);
    await supabaseAdmin
      .from("subscriptions")
      .update({ custom_credits: currentCustom + creditsToAdd })
      .eq("id", subscription.id);
  }

  await sendTelegramMessage(
    adminChatId,
    `✅ <b>+${creditsToAdd} crédits IA accordés avec succès</b> à <code>${escapeHtml(email)}</code> !`,
  );
}

// Cache anti-doublon pour éviter le multi-traitement (webhook retries, concurrence polling, multiples onglets)
const processedEventsCache = new Map<string, number>();
const inFlightProcessing = new Set<string>();
const DEDUP_TTL_MS = 30 * 60 * 1000; // 30 minutes

function cleanupDedupCache(): void {
  const now = Date.now();
  for (const [key, ts] of processedEventsCache.entries()) {
    if (now - ts > DEDUP_TTL_MS) {
      processedEventsCache.delete(key);
    }
  }
}

export function isTelegramEventProcessed(eventId: string): boolean {
  if (!eventId) return false;
  cleanupDedupCache();
  if (processedEventsCache.has(eventId) || inFlightProcessing.has(eventId)) {
    return true;
  }
  processedEventsCache.set(eventId, Date.now());
  inFlightProcessing.add(eventId);
  setTimeout(() => inFlightProcessing.delete(eventId), 15_000);
  return false;
}

let lastUpdateOffset = 0;
let isPolling = false;

/** Traite un message entrant reçu depuis Telegram (texte, photo, URL) */
export async function processTelegramIncomingMessage(message: {
  message_id: number;
  from?: { id: number; username?: string; first_name?: string };
  chat: { id: number; type: string };
  text?: string;
  caption?: string;
  photo?: Array<{ file_id: string; width: number; height: number; file_size?: number }>;
}): Promise<{ ok: boolean; linked?: boolean; storeName?: string }> {
  const dedupKey = `msg_${message.chat.id}_${message.message_id}`;
  if (isTelegramEventProcessed(dedupKey)) {
    return { ok: true };
  }

  const text = (message.text || message.caption || "").trim();
  const chat = message.chat;
  const from = message.from;
  const isAdmin = isSuperAdmin(from?.username);

  // A. Si l'utilisateur envoie une photo ou un lien URL de produit -> Redirection vers DUKAIO AI Web
  if (message.photo && message.photo.length > 0) {
    await sendAiCreationGuide(chat.id);
    return { ok: true };
  }

  const isUrl = /^(https?:\/\/[^\s]+)/i.test(text);
  if (isUrl && !text.startsWith("/start")) {
    await sendAiCreationGuide(chat.id);
    return { ok: true };
  }

  // 1. Commande /start
  if (text.startsWith("/start")) {
    const parts = text.split(" ");
    const token = parts[1]?.trim();

    if (token && token.startsWith("link_")) {
      const verified = verifyTelegramConnectToken(token);
      if (verified) {
        const res = await linkStoreTelegram(verified.storeId, chat.id, {
          username: from?.username,
          first_name: from?.first_name,
        });

        if (res.ok) {
          await sendMainMenu(chat.id, from);
          return { ok: true, linked: true, storeName: res.storeName };
        }
      }
    }

    await sendMainMenu(chat.id, from);
    return { ok: true };
  }

  // 2. Commande /stats
  if (text === "/stats") {
    await sendStoreStats(chat.id);
    return { ok: true };
  }

  // 3. Commande /commandes ou /orders
  if (text === "/commandes" || text === "/orders") {
    await sendLatestOrders(chat.id);
    return { ok: true };
  }

  // 4. Commande /credits
  if (text === "/credits") {
    await sendAiCreditsStatus(chat.id);
    return { ok: true };
  }

  // 5. Commande /profil ou /profile
  if (text === "/profil" || text === "/profile") {
    await sendSellerProfile(chat.id, from);
    return { ok: true };
  }

  // 6. Commande /boutique ou /shop
  if (text === "/boutique" || text === "/shop") {
    const store = await getStoreByTelegramChatId(chat.id);
    const baseUrl = getAppBaseUrl();
    if (store) {
      const storeUrl = store.custom_domain
        ? `https://${store.custom_domain}`
        : `${baseUrl}/s/${store.subdomain || store.id}`;
      await sendTelegramMessage(
        chat.id,
        `🏪 <b>Votre Boutique DUKAIO :</b> <b>${escapeHtml(store.store_name)}</b>\n\n🌐 Lien public : ${storeUrl}`,
        {
          inlineKeyboard: [
            [{ text: "🚀 Visiter ma Boutique", url: storeUrl }],
            [{ text: "🔙 Menu Principal", callback_data: "cmd_main_menu" }],
          ],
        },
      );
    } else {
      await sendTelegramMessage(
        chat.id,
        `⚠️ <b>Aucune boutique liée.</b> Ouvrez votre dashboard DUKAIO pour lier votre boutique.`,
        {
          inlineKeyboard: [
            [{ text: "🔗 Connecter ma Boutique", url: `${baseUrl}/dashboard/parametres` }],
            [{ text: "🔙 Menu Principal", callback_data: "cmd_main_menu" }],
          ],
        },
      );
    }
    return { ok: true };
  }

  // 7. Commande /creer ou /ia -> Guide DUKAIO AI Web
  if (text.startsWith("/creer") || text.startsWith("/create") || text.startsWith("/ia")) {
    await sendAiCreationGuide(chat.id);
    return { ok: true };
  }

  // 8. Commandes Super-Admin (@easy_573)
  if (text === "/admin") {
    if (!isAdmin) {
      await sendTelegramMessage(
        chat.id,
        `⛔ <b>Accès refusé.</b> Cette commande est strictement réservée au Super-Administrateur Master DUKAIO (@easy_573).`,
        {
          inlineKeyboard: [[{ text: "🔙 Menu Principal", callback_data: "cmd_main_menu" }]],
        },
      );
      return { ok: true };
    }
    await registerAdminTelegramCommands(chat.id);
    await sendAdminPanel(chat.id);
    return { ok: true };
  }

  if (text.startsWith("/broadcast ") && isAdmin) {
    const announcement = text.replace(/^\/broadcast\s+/i, "").trim();
    await sendBroadcastMessage(chat.id, announcement);
    return { ok: true };
  }

  if (text.startsWith("/recharger ") && isAdmin) {
    const parts = text.replace(/^\/recharger\s+/i, "").trim().split(" ");
    const email = parts[0];
    const amount = Number(parts[1]) || 5;
    if (email) {
      await grantUserAiCredits(chat.id, email, amount);
      return { ok: true };
    }
  }

  if (text === "/modeles" && isAdmin) {
    const { getAiEngineSettings } = await import("@/lib/ai-engine.server");
    const settings = await getAiEngineSettings();
    const baseUrl = getAppBaseUrl();
    await sendTelegramMessage(
      chat.id,
      `🧠 <b>CONFIGURATION DES MOTEURS IA DUKAIO</b>\n\n• <b>Moteur Texte :</b> <code>${settings.textEngine.toUpperCase()}</code>\n• <b>Moteur Image :</b> <code>${settings.imageEngine.toUpperCase()}</code>\n• <b>Fallback Kie.ai :</b> <code>${settings.fallbackToKie ? "Activé" : "Désactivé"}</code>`,
      {
        inlineKeyboard: [
          [{ text: "⚙️ Modifier dans le Dashboard", url: `${baseUrl}/dashboard/admin/modeles-ia` }],
          [{ text: "🔙 Menu Principal", callback_data: "cmd_main_menu" }],
        ],
      },
    );
    return { ok: true };
  }

  // 9. Commande /aide ou /help
  if (text === "/aide" || text === "/help") {
    await sendMainMenu(chat.id, from);
    return { ok: true };
  }

  // Réponse par défaut avec le menu principal
  await sendMainMenu(chat.id, from);
  return { ok: true };
}

/** Traite un clic de bouton Callback Query */
export async function processTelegramCallbackQuery(query: {
  id: string;
  from: { id: number; username?: string; first_name?: string };
  message?: { chat: { id: number }; message_id: number };
  data?: string;
}): Promise<void> {
  const data = query.data;
  const chatId = query.message?.chat.id;
  if (!chatId || !data) return;

  const dedupKey = `cb_${query.id}`;
  if (isTelegramEventProcessed(dedupKey)) {
    return;
  }

  // Acquittement immédiat pour fermer le loading Telegram et éviter les retries
  void answerCallbackQuery(query.id);

  if (data === "cmd_stats") {
    await sendStoreStats(chatId);
  } else if (data === "cmd_orders") {
    await sendLatestOrders(chatId);
  } else if (data === "cmd_credits") {
    await sendAiCreditsStatus(chatId);
  } else if (data === "cmd_profile") {
    await sendSellerProfile(chatId, query.from);
  } else if (data === "cmd_ai_create") {
    await sendAiCreationGuide(chatId);
  } else if (data === "cmd_admin_panel" && isSuperAdmin(query.from.username)) {
    await sendAdminPanel(chatId);
  } else if (data === "cmd_main_menu" || data === "cmd_refresh_menu") {
    await sendMainMenu(chatId, query.from);
  }
}

/** Interroge l'API Telegram pour traiter les nouveaux messages (polling sécurisé avec commit d'offset et déduplication). */
export async function pollTelegramUpdates(): Promise<number> {
  if (isPolling) return 0;
  isPolling = true;
  try {
    const token = getBotToken();
    const res = await fetch(
      `${TELEGRAM_API}${token}/getUpdates?offset=${lastUpdateOffset}&limit=10&timeout=1`,
      { cache: "no-store" },
    );
    const data = (await res.json()) as {
      ok: boolean;
      result?: Array<{
        update_id: number;
        message?: any;
        callback_query?: any;
      }>;
    };

    if (!data.ok || !Array.isArray(data.result) || data.result.length === 0) {
      return 0;
    }

    let count = 0;
    let maxUpdateId = lastUpdateOffset;

    for (const update of data.result) {
      if (update.update_id >= maxUpdateId) {
        maxUpdateId = update.update_id + 1;
      }

      const updateDedupKey = `upd_${update.update_id}`;
      if (isTelegramEventProcessed(updateDedupKey)) {
        continue;
      }

      try {
        if (update.message) {
          await processTelegramIncomingMessage(update.message);
          count++;
        } else if (update.callback_query) {
          await processTelegramCallbackQuery(update.callback_query);
          count++;
        }
      } catch (err) {
        console.error("[Telegram Update Error]", err);
      }
    }

    lastUpdateOffset = maxUpdateId;

    // Confirmer définitivement l'offset auprès des serveurs Telegram pour purger la file
    fetch(`${TELEGRAM_API}${token}/getUpdates?offset=${maxUpdateId}&limit=1&timeout=0`, {
      cache: "no-store",
    }).catch(() => {});

    return count;
  } catch (err) {
    console.error("[Telegram Poll Error]", err);
    return 0;
  } finally {
    isPolling = false;
  }
}

let pollingTimer: NodeJS.Timeout | null = null;

/** Démarre la boucle de polling automatique en tâche de fond pour écouter Telegram sans délai */
export function startTelegramPollingLoop(): void {
  if (pollingTimer) return;
  pollingTimer = setInterval(async () => {
    try {
      await pollTelegramUpdates();
    } catch {
      // ignore
    }
  }, 1500);

  // Exécution immédiate au démarrage
  pollTelegramUpdates().catch(() => {});
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function money(value: number, currency: string): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(value))} ${currency}`;
}

