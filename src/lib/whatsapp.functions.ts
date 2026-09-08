/**
 * Réglages du robot WhatsApp du vendeur (lecture, enregistrement, test).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type WhatsappSettings = {
  storeId: string;
  phoneNumberId: string | null;
  wabaId: string | null;
  displayPhone: string | null;
  hasToken: boolean;
  verifyToken: string;
  isActive: boolean;
  greeting: string | null;
  faq: { q: string; a: string }[];
  webhookUrl: string;
  connectMode: string;
  connectedAt: string | null;
};


const storeInput = z.object({ storeId: z.string().uuid() });

async function webhookUrl() {
  try {
    const { getRequestHost } = await import("@tanstack/react-start/server");
    const host = getRequestHost({ xForwardedHost: true });
    if (host && !host.includes("localhost")) return `https://${host}/api/public/whatsapp`;
  } catch {
    /* hors requête HTTP : on retombe sur le domaine public */
  }
  const base = process.env["PUBLIC_SITE_URL"] || "https://dukaio.com";
  return `${base.replace(/\/$/, "")}/api/public/whatsapp`;
}

async function ownedStore(supabase: never, storeId: string) {
  const client = supabase as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, value: string) => { limit: (n: number) => Promise<{ data: unknown[] | null }> };
      };
    };
  };
  const { data } = await client.from("store_settings").select("id").eq("id", storeId).limit(1);
  return Boolean(data?.[0]);
}

export const getWhatsappSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => storeInput.parse(data))
  .handler(async ({ data, context }): Promise<WhatsappSettings | null> => {
    if (!(await ownedStore(context.supabase as never, data.storeId))) return null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let { data: rows } = await supabaseAdmin
      .from("store_whatsapp")
      .select("*")
      .eq("store_id", data.storeId)
      .limit(1);
    if (!rows?.[0]) {
      const created = await supabaseAdmin
        .from("store_whatsapp")
        .insert({ store_id: data.storeId, user_id: context.userId })
        .select("*")
        .limit(1);
      rows = created.data ?? [];
    }
    const row = rows?.[0];
    if (!row) return null;
    const { readFaq } = await import("@/lib/whatsapp.server");
    return {
      storeId: row.store_id,
      phoneNumberId: row.phone_number_id,
      wabaId: row.waba_id,
      displayPhone: row.display_phone,
      hasToken: Boolean(row.access_token),
      verifyToken: row.verify_token,
      isActive: row.is_active,
      greeting: row.greeting,
      faq: readFaq(row.faq),
      webhookUrl: await webhookUrl(),
      connectMode: (row as { connect_mode?: string }).connect_mode ?? "manual",
      connectedAt: (row as { connected_at?: string | null }).connected_at ?? null,
    };
  });


const saveInput = z.object({
  storeId: z.string().uuid(),
  phoneNumberId: z.string().trim().max(60).optional(),
  wabaId: z.string().trim().max(60).optional(),
  displayPhone: z.string().trim().max(30).optional(),
  accessToken: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
  greeting: z.string().trim().max(600).optional(),
  faq: z
    .array(z.object({ q: z.string().trim().min(2).max(160), a: z.string().trim().min(2).max(800) }))
    .max(20)
    .optional(),
});

export const saveWhatsappSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => saveInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: boolean; reason?: string }> => {
    if (!(await ownedStore(context.supabase as never, data.storeId)))
      return { ok: false, reason: "Boutique introuvable." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: Record<string, unknown> = { store_id: data.storeId, user_id: context.userId };
    if (data.phoneNumberId !== undefined) patch["phone_number_id"] = data.phoneNumberId || null;
    if (data.wabaId !== undefined) patch["waba_id"] = data.wabaId || null;
    if (data.displayPhone !== undefined) patch["display_phone"] = data.displayPhone || null;
    if (data.accessToken) patch["access_token"] = data.accessToken;
    if (data.isActive !== undefined) patch["is_active"] = data.isActive;
    if (data.greeting !== undefined) patch["greeting"] = data.greeting || null;
    if (data.faq !== undefined) patch["faq"] = data.faq;

    const { error } = await supabaseAdmin
      .from("store_whatsapp")
      .upsert(patch as never, { onConflict: "store_id" });
    if (error) {
      if (error.code === "23505" || error.message.includes("duplicate"))
        return { ok: false, reason: "Ce numéro WhatsApp est déjà connecté à une autre boutique." };
      return { ok: false, reason: "Enregistrement impossible." };
    }
    return { ok: true };
  });

const testInput = z.object({
  storeId: z.string().uuid(),
  to: z.string().trim().min(8).max(20),
});

export const sendWhatsappTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => testInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: boolean; reason?: string }> => {
    if (!(await ownedStore(context.supabase as never, data.storeId)))
      return { ok: false, reason: "Boutique introuvable." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("store_whatsapp")
      .select("phone_number_id, access_token")
      .eq("store_id", data.storeId)
      .limit(1);
    const config = rows?.[0];
    if (!config?.phone_number_id || !config.access_token)
      return { ok: false, reason: "Renseignez d'abord l'identifiant du numéro et le jeton." };
    const { sendWhatsappTemplate } = await import("@/lib/whatsapp.server");
    const to = data.to.replace(/[^0-9]/g, "");
    /* Premier contact : seul un modèle approuvé est réellement délivré par Meta. */
    let result = await sendWhatsappTemplate(config, to, "hello_world", "en_US");
    if (!result.ok) result = await sendWhatsappTemplate(config, to, "hello_world", "fr");
    return result.ok
      ? { ok: true }
      : {
          ok: false,
          reason:
            result.error ??
            "Envoi impossible. Vérifiez que le numéro est autorisé dans Meta (Destinataires).",
        };
  });

export type WhatsappConversation = {
  waId: string;
  state: string;
  lastMessageAt: string;
};

export const listWhatsappConversations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => storeInput.parse(data))
  .handler(async ({ data, context }): Promise<WhatsappConversation[]> => {
    const { data: rows } = await context.supabase
      .from("whatsapp_conversations")
      .select("wa_id, state, last_message_at")
      .eq("store_id", data.storeId)
      .order("last_message_at", { ascending: false })
      .limit(20);
    return (rows ?? []).map((row) => ({
      waId: row.wa_id,
      state: row.state,
      lastMessageAt: row.last_message_at,
    }));
  });

/* ------------------------------------------- connexion en un clic (Meta) */

export type EmbeddedConfig = { enabled: boolean; appId: string | null; configId: string | null };

/** Indique si la connexion en un clic est disponible et donne les identifiants publics. */
export const getWhatsappEmbeddedConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<EmbeddedConfig> => {
    const { embeddedCredentials } = await import("@/lib/whatsapp-embedded.server");
    const creds = embeddedCredentials();
    if (!creds) return { enabled: false, appId: null, configId: null };
    return { enabled: true, appId: creds.appId, configId: creds.configId };
  });

const connectInput = z.object({
  storeId: z.string().uuid(),
  code: z.string().trim().min(10).max(2000),
  wabaId: z.string().trim().min(5).max(60),
  phoneNumberId: z.string().trim().min(5).max(60),
});

/**
 * Termine la connexion en un clic : échange du code, abonnement du webhook,
 * enregistrement du numéro, puis activation du robot pour la boutique.
 */
export const connectWhatsappEmbedded = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => connectInput.parse(data))
  .handler(
    async ({ data, context }): Promise<{ ok: boolean; reason?: string; displayPhone?: string }> => {
      if (!(await ownedStore(context.supabase as never, data.storeId)))
        return { ok: false, reason: "Boutique introuvable." };

      const meta = await import("@/lib/whatsapp-embedded.server");
      const exchanged = await meta.exchangeCode(data.code);
      if (!exchanged.ok) return { ok: false, reason: exchanged.error };
      const token = exchanged.token;

      const subscribed = await meta.subscribeApp(data.wabaId, token);
      if (!subscribed.ok) return { ok: false, reason: subscribed.error ?? "Abonnement impossible." };

      const registered = await meta.registerPhone(data.phoneNumberId, token, meta.makePin());
      if (!registered.ok) return { ok: false, reason: registered.error ?? "Numéro non enregistré." };

      const details = await meta.readPhoneDetails(data.phoneNumberId, token);

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("store_whatsapp").upsert(
        {
          store_id: data.storeId,
          user_id: context.userId,
          waba_id: data.wabaId,
          phone_number_id: data.phoneNumberId,
          access_token: token,
          display_phone: details.displayPhone,
          connect_mode: "embedded",
          connected_at: new Date().toISOString(),
          last_error: null,
          is_active: true,
        } as never,
        { onConflict: "store_id" },
      );
      if (error)
        return {
          ok: false,
          reason: "Ce numéro WhatsApp est peut-être déjà connecté à une autre boutique.",
        };

      return { ok: true, ...(details.displayPhone ? { displayPhone: details.displayPhone } : {}) };
    },
  );

/** Déconnecte le numéro WhatsApp de la boutique. */
export const disconnectWhatsapp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => storeInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: boolean; reason?: string }> => {
    if (!(await ownedStore(context.supabase as never, data.storeId)))
      return { ok: false, reason: "Boutique introuvable." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("store_whatsapp")
      .update({
        access_token: null,
        phone_number_id: null,
        waba_id: null,
        display_phone: null,
        connect_mode: "manual",
        connected_at: null,
        is_active: false,
      } as never)
      .eq("store_id", data.storeId);
    return error ? { ok: false, reason: "Déconnexion impossible." } : { ok: true };
  });

