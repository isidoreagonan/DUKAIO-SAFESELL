/**
 * Réglages de suivi publicitaire : lecture, enregistrement et test réel des
 * connexions Facebook, TikTok et Google. Réservé au propriétaire connecté.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { emptyTracking, type TrackingSettings } from "@/lib/tracking";

type Ctx = { userId: string };

const id = z.object({ storeId: z.string().uuid() });

const text = (max: number) => z.string().trim().max(max).optional().default("");

const settingsInput = z.object({
  storeId: z.string().uuid(),
  tracking_enabled: z.boolean().optional().default(true),
  facebook_pixel_id: text(40),
  facebook_capi_token: text(400),
  facebook_test_event_code: text(40),
  tiktok_pixel_id: text(60),
  tiktok_access_token: text(400),
  tiktok_test_event_code: text(40),
  google_ads_id: text(40),
  google_ads_conversion_label: text(60),
  ga4_measurement_id: text(40),
  ga4_api_secret: text(200),
});

/** Vérifie que la boutique appartient bien à l'utilisateur connecté. */
async function assertOwner(storeId: string, userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("store_settings")
    .select("id, user_id, store_name, currency")
    .eq("id", storeId)
    .maybeSingle();
  if (!data || data.user_id !== userId) throw new Error("Boutique introuvable.");
  return data;
}

export const getTracking = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => id.parse(input))
  .handler(async ({ data, context }): Promise<TrackingSettings> => {
    const { userId } = context as unknown as Ctx;
    await assertOwner(data.storeId, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("store_integrations")
      .select("*")
      .eq("store_id", data.storeId)
      .maybeSingle();
    if (!row) return emptyTracking;
    return {
      tracking_enabled: row.tracking_enabled !== false,
      facebook_pixel_id: row.facebook_pixel_id ?? "",
      facebook_capi_token: row.facebook_capi_token ?? "",
      facebook_test_event_code: row.facebook_test_event_code ?? "",
      tiktok_pixel_id: row.tiktok_pixel_id ?? "",
      tiktok_access_token: row.tiktok_access_token ?? "",
      tiktok_test_event_code: row.tiktok_test_event_code ?? "",
      google_ads_id: row.google_ads_id ?? "",
      google_ads_conversion_label: row.google_ads_conversion_label ?? "",
      ga4_measurement_id: row.ga4_measurement_id ?? "",
      ga4_api_secret: row.ga4_api_secret ?? "",
    };
  });

export const saveTracking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => settingsInput.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { userId } = context as unknown as Ctx;
    await assertOwner(data.storeId, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { storeId, ...values } = data;
    const { error } = await supabaseAdmin.from("store_integrations").upsert(
      {
        store_id: storeId,
        user_id: userId,
        tracking_enabled: values.tracking_enabled,
        facebook_pixel_id: values.facebook_pixel_id || null,
        facebook_capi_token: values.facebook_capi_token || null,
        facebook_test_event_code: values.facebook_test_event_code || null,
        tiktok_pixel_id: values.tiktok_pixel_id || null,
        tiktok_access_token: values.tiktok_access_token || null,
        tiktok_test_event_code: values.tiktok_test_event_code || null,
        google_ads_id: values.google_ads_id || null,
        google_ads_conversion_label: values.google_ads_conversion_label || null,
        ga4_measurement_id: values.ga4_measurement_id || null,
        ga4_api_secret: values.ga4_api_secret || null,
      },
      { onConflict: "store_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Test réel : un évènement de test est envoyé à la plateforme choisie avec les
 * identifiants enregistrés. Le résultat vient de la plateforme elle-même.
 */
export const testTracking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        storeId: z.string().uuid(),
        provider: z.enum(["facebook", "tiktok", "google"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean; detail: string }> => {
    const { userId } = context as unknown as Ctx;
    const store = await assertOwner(data.storeId, userId);
    const { loadTrackingRow, sendProvider } = await import("@/lib/tracking.server");
    const row = await loadTrackingRow(data.storeId);
    if (!row) return { ok: false, detail: "Aucun réglage enregistré pour cette boutique." };
    return sendProvider(
      data.provider,
      row,
      {
        event: "Purchase",
        eventId: `test-${crypto.randomUUID()}`,
        value: 1000,
        currency: store.currency || "XOF",
        sourceUrl: "https://dukaio.com",
         /* Meta exige une donnée de correspondance client dans user_data. Cet
            identifiant est haché en SHA-256 avant de quitter le serveur. */
         externalId: userId,
        userAgent: "Mozilla/5.0 (compatible; DUKAIO-Tracking-Test/1.0)",
        items: [{ id: "test", name: "Test DUKAIO", quantity: 1, price: 1000 }],
      },
      true,
    );
  });
