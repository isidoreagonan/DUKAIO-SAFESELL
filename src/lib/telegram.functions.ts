import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Récupère le lien 1-clic pour connecter son Telegram. */
export const getTelegramConnectInfo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ storeId: z.string() }))
  .handler(async ({ data }) => {
    const { getTelegramConnectUrl, getBotUsername } = await import("@/lib/telegram.server");
    const url = getTelegramConnectUrl(data.storeId);
    const username = getBotUsername();
    return { url, username };
  });

/** Envoie un message de test au chat Telegram connecté de la boutique. */
export const testTelegramNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ storeId: z.string() }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: store, error } = await supabaseAdmin
      .from("store_settings")
      .select("id, store_name, theme_config")
      .eq("id", data.storeId)
      .single();

    if (error || !store) throw new Error("Boutique introuvable");

    const theme = (store.theme_config as Record<string, unknown> | null) ?? {};
    const telegram = theme["telegram"] as { chatId?: string; enabled?: boolean } | undefined;

    if (!telegram?.chatId) {
      throw new Error("Aucun compte Telegram n'est connecté à cette boutique.");
    }

    const { sendTelegramTestNotification } = await import("@/lib/telegram.server");
    const res = await sendTelegramTestNotification(telegram.chatId, store.store_name);
    if (!res.ok) {
      throw new Error(res.error || "Impossible d'envoyer le message Telegram.");
    }

    return { ok: true };
  });

/** Active ou désactive les notifications Telegram. */
export const toggleTelegramNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ storeId: z.string(), enabled: z.boolean() }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: store } = await supabaseAdmin
      .from("store_settings")
      .select("id, theme_config")
      .eq("id", data.storeId)
      .single();

    if (!store) throw new Error("Boutique introuvable");
    const theme = (store.theme_config as Record<string, unknown> | null) ?? {};
    const currentTelegram = (theme["telegram"] as Record<string, unknown> | undefined) ?? {};

    const updatedTheme = {
      ...theme,
      telegram: {
        ...currentTelegram,
        enabled: data.enabled,
      },
    };

    await supabaseAdmin
      .from("store_settings")
      .update({ theme_config: updatedTheme })
      .eq("id", data.storeId);

    return { ok: true, enabled: data.enabled };
  });

/** Déconnecte Telegram de la boutique. */
export const disconnectTelegram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ storeId: z.string() }))
  .handler(async ({ data }) => {
    const { unlinkStoreTelegram } = await import("@/lib/telegram.server");
    const ok = await unlinkStoreTelegram(data.storeId);
    return { ok };
  });

/** Récupère et traite les mises à jour Telegram en attente. */
export const syncTelegramUpdates = createServerFn({ method: "POST" })
  .handler(async () => {
    const { pollTelegramUpdates } = await import("@/lib/telegram.server");
    const count = await pollTelegramUpdates();
    return { count };
  });

