/**
 * Fonctions serveur TanStack pour le suivi publicitaire global de DUKAIO.
 * Les accès complets et tests sont protégés par le rôle « admin ».
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PlatformTrackingSettings, PlatformTrackingProvider } from "./platform-tracking";

type AdminContext = {
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> };
  userId: string;
  claims: Record<string, unknown>;
};

async function assertAdmin(context: unknown) {
  const ctx = context as AdminContext;
  const { data } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (data !== true) throw new Error("Accès réservé aux administrateurs.");
  const email = typeof ctx.claims["email"] === "string" ? (ctx.claims["email"] as string) : null;
  return { userId: ctx.userId, email };
}

/** Lecture des réglages complets par un administrateur. */
export const adminPlatformTrackingGet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { getPlatformTrackingSettings } = await import("./platform-tracking.server");
    return getPlatformTrackingSettings(true);
  });

/** Enregistrement des réglages de tracking plateforme par un administrateur. */
export const adminPlatformTrackingSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Partial<PlatformTrackingSettings>) => input)
  .handler(async ({ data, context }) => {
    const actor = await assertAdmin(context);
    const { savePlatformTrackingSettings } = await import("./platform-tracking.server");
    const updated = await savePlatformTrackingSettings(data, actor);
    return { ok: true, settings: updated };
  });

/** Test de connexion CAPI en direct (Meta, TikTok, Google) depuis l'administration. */
export const adminPlatformTrackingTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { provider: PlatformTrackingProvider; settings: PlatformTrackingSettings }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { testPlatformProvider } = await import("./platform-tracking.server");
    return testPlatformProvider(data.provider, data.settings);
  });

/** Récupération publique des identifiants pixels pour le client (jamais de jeton). */
export const getPublicPlatformTrackingFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const { getPublicPlatformTracking } = await import("./platform-tracking.server");
    return getPublicPlatformTracking();
  });

/** Envoi d'une conversion serveur lors de la finalisation d'une inscription sur DUKAIO. */
export const reportPlatformRegistrationServer = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; userId?: string; eventId?: string }) => input)
  .handler(async ({ data }) => {
    const { reportPlatformServerConversion } = await import("./platform-tracking.server");
    const eventId = data.eventId || `reg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await reportPlatformServerConversion({
      event: "CompleteRegistration",
      eventId,
      email: data.email,
      externalId: data.userId || null,
      contentName: "Inscription Vendeur DUKAIO",
      sourceUrl: "https://dukaio.com/inscription",
    });
    return { ok: true };
  });
