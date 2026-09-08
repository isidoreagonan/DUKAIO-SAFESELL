/**
 * API e-mail marketing : comptage de l'audience, envoi de test et envoi réel
 * d'une campagne. Toutes les fonctions vérifient que la boutique appartient
 * bien au vendeur connecté (RLS via le client authentifié).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Audience } from "@/lib/email-marketing.server";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Ctx = { userId: string; supabase: any; claims: Record<string, unknown> };

const MAX_PER_SEND = 200;

const audienceInput = z.object({
  storeId: z.string().uuid(),
  audience: z.enum(["all", "vip", "inactive", "city"]),
  city: z.string().trim().max(80).nullable().optional(),
  minOrders: z.number().int().min(1).max(50).optional(),
  inactiveDays: z.number().int().min(1).max(365).optional(),
});

/** Origine publique de la requête (pour les liens de suivi). */
async function requestOrigin() {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const url = new URL(request.url);
    if (url.hostname && url.hostname !== "localhost") return url.origin;
  } catch {
    /* hors requête HTTP */
  }
  return "https://dukaio.com";
}

async function assertStore(context: unknown, storeId: string) {
  const ctx = context as unknown as Ctx;
  const { data } = await ctx.supabase
    .from("store_settings")
    .select("id, store_name, logo_url, theme_config, contact_email, user_id")
    .eq("id", storeId)
    .maybeSingle();
  if (!data) throw new Error("Boutique introuvable.");
  return data as {
    id: string;
    store_name: string;
    logo_url: string | null;
    theme_config: Record<string, unknown> | null;
    contact_email: string | null;
  };
}

function storeColor(theme: Record<string, unknown> | null) {
  const global = theme?.["global"] as Record<string, unknown> | undefined;
  const color = global?.["primaryColor"];
  return typeof color === "string" ? color : null;
}

/** Nombre de clients réellement joignables pour une audience donnée. */
export const countAudience = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => audienceInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertStore(context, data.storeId);
    const { resolveAudience } = await import("@/lib/email-marketing.server");
    const rules: Audience = {
      audience: data.audience,
      city: data.city ?? null,
      ...(data.minOrders ? { minOrders: data.minOrders } : {}),
      ...(data.inactiveDays ? { inactiveDays: data.inactiveDays } : {}),
    };
    const people = await resolveAudience(data.storeId, rules);
    return { count: people.length, max: MAX_PER_SEND };
  });

const idInput = z.object({ campaignId: z.string().uuid() });

async function loadCampaign(context: unknown, campaignId: string) {
  const ctx = context as unknown as Ctx;
  const { data } = await ctx.supabase
    .from("email_campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();
  if (!data) throw new Error("Campagne introuvable.");
  return data as unknown as {
    id: string;
    store_id: string;
    subject: string;
    preheader: string | null;
    body: string;
    cta_label: string | null;
    cta_url: string | null;
    audience: "all" | "vip" | "inactive" | "city";
    city: string | null;
    min_orders: number;
    inactive_days: number;
    status: string;
    template: string;
    brand_color: string | null;
    button_color: string | null;
    bg_color: string | null;
    text_color: string | null;
    logo_url: string | null;
    footer_note: string | null;
  };
}

/** Apparence de la campagne : réglages du vendeur, sinon modèle + boutique. */
async function campaignDesign(
  campaign: {
    template: string;
    brand_color: string | null;
    button_color: string | null;
    bg_color: string | null;
    text_color: string | null;
    logo_url: string | null;
    footer_note: string | null;
  },
  store: { logo_url: string | null; theme_config: Record<string, unknown> | null },
) {
  const { defaultDesign, templatePreset } = await import("@/lib/email-templates");
  const preset = templatePreset(campaign.template);
  const base = defaultDesign(preset.key, campaign.logo_url ?? store.logo_url);
  return {
    ...base,
    brandColor: campaign.brand_color ?? storeColor(store.theme_config) ?? base.brandColor,
    buttonColor: campaign.button_color ?? storeColor(store.theme_config) ?? base.buttonColor,
    bgColor: campaign.bg_color ?? base.bgColor,
    textColor: campaign.text_color ?? base.textColor,
    footerNote: campaign.footer_note ?? null,
  };
}

/** Envoie la campagne à l'adresse du vendeur pour vérifier le rendu. */
export const sendCampaignTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const campaign = await loadCampaign(context, data.campaignId);
    const store = await assertStore(context, campaign.store_id);
    const to = typeof ctx.claims["email"] === "string" ? (ctx.claims["email"] as string) : null;
    if (!to) return { ok: false as const, reason: "Aucune adresse e-mail sur votre compte." };

    const { renderEmailTemplate } = await import("@/lib/email-templates");
    const { sendEmail } = await import("@/lib/email.server");
    const html = renderEmailTemplate(await campaignDesign(campaign, store), {
      storeName: store.store_name,
      subject: campaign.subject,
      preheader: campaign.preheader,
      body: campaign.body,
      ctaLabel: campaign.cta_label,
      ctaUrl: campaign.cta_url,
      firstName: null,
    });
    try {
      await sendEmail(to, `[Test] ${campaign.subject}`, html);
      return { ok: true as const, email: to };
    } catch (e) {
      console.error("[campaign:test]", e);
      return { ok: false as const, reason: "L'e-mail de test n'a pas pu être envoyé." };
    }
  });

/** Envoi réel de la campagne à toute l'audience choisie. */
export const sendCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const campaign = await loadCampaign(context, data.campaignId);
    if (campaign.status === "sent")
      return { ok: false as const, reason: "Cette campagne a déjà été envoyée." };
    if (!campaign.body.trim())
      return { ok: false as const, reason: "Écrivez le message avant d'envoyer." };

    const store = await assertStore(context, campaign.store_id);
    const { resolveAudience, deliverCampaign } = await import("@/lib/email-marketing.server");
    const people = await resolveAudience(campaign.store_id, {
      audience: campaign.audience,
      city: campaign.city,
      minOrders: campaign.min_orders,
      inactiveDays: campaign.inactive_days,
    });
    if (people.length === 0)
      return { ok: false as const, reason: "Aucun client ne correspond à cette audience." };

    const batch = people.slice(0, MAX_PER_SEND);
    const origin = await requestOrigin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("email_campaigns").update({ status: "sending" }).eq("id", campaign.id);

    const result = await deliverCampaign({
      campaignId: campaign.id,
      userId: ctx.userId,
      origin,
      storeName: store.store_name,
      design: await campaignDesign(campaign, store),
      subject: campaign.subject,
      preheader: campaign.preheader,
      body: campaign.body,
      ctaLabel: campaign.cta_label,
      ctaUrl: campaign.cta_url,
      recipients: batch,
    });

    return {
      ok: true as const,
      sent: result.sent,
      failed: result.failed,
      skipped: people.length - batch.length,
    };
  });
