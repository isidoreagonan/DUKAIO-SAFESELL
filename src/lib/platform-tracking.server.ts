/**
 * Gestion serveur du suivi publicitaire global de DUKAIO (Conversions API).
 *
 * Exécuté strictement côté serveur (Node.js / Edge). Les jetons d'accès ne sont
 * jamais exposés au client. Envoi d'évènements fiables même en présence de
 * bloqueurs de publicité (AdBlock, Brave, Safari ITP).
 */
import {
  type PlatformTrackingSettings,
  type PublicPlatformTracking,
  type PlatformTrackEvent,
  type PlatformTrackingProvider,
  emptyPlatformTracking,
} from "./platform-tracking";

const FB_GRAPH = "https://graph.facebook.com/v21.0";
const TIKTOK_API = "https://business-api.tiktok.com/open_api/v1.3/event/track/";
const GA4_COLLECT = "https://www.google-analytics.com/mp/collect";
const GA4_DEBUG = "https://www.google-analytics.com/debug/mp/collect";

/* Cache serveur (60s) pour éviter d'interroger la base à chaque hit */
let cachedSettings: { value: PlatformTrackingSettings; at: number } | null = null;
const CACHE_TTL_MS = 60_000;

/** Hachage SHA-256 hexadécimal exigé par Meta et TikTok pour la conformité RGPD / hashing. */
async function sha256(value: string): Promise<string | null> {
  const clean = value.trim().toLowerCase();
  if (!clean) return null;
  const bytes = new TextEncoder().encode(clean);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type PlatformServerEvent = {
  event: PlatformTrackEvent;
  eventId: string;
  value?: number;
  currency?: string;
  sourceUrl?: string;
  email?: string | null;
  phone?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  externalId?: string | null;
  contentName?: string;
};

type Outcome = { ok: boolean; detail: string };

/** Récupère les réglages complets de tracking de la plateforme DUKAIO. */
export async function getPlatformTrackingSettings(
  force = false,
): Promise<PlatformTrackingSettings> {
  if (!force && cachedSettings && Date.now() - cachedSettings.at < CACHE_TTL_MS) {
    return cachedSettings.value;
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // 1. Essai de lecture depuis la table dédiée platform_tracking_settings
  try {
    const { data, error } = await supabaseAdmin
      .from("platform_tracking_settings" as never)
      .select(
        "enabled, facebook_pixel_id, facebook_capi_token, facebook_test_event_code, tiktok_pixel_id, tiktok_access_token, tiktok_test_event_code, google_ads_id, google_ads_conversion_label, ga4_measurement_id, ga4_api_secret, updated_at",
      )
      .eq("id", 1)
      .maybeSingle();

    if (!error && data) {
      const row = data as Partial<PlatformTrackingSettings>;
      const settings: PlatformTrackingSettings = {
        enabled: row.enabled !== false,
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
        updated_at: row.updated_at,
      };
      cachedSettings = { value: settings, at: Date.now() };
      return settings;
    }
  } catch {
    // La table n'existe peut-être pas encore, fallback ci-dessous
  }

  // 2. Fallback résilient : lecture depuis admin_audit_log (action = 'platform_tracking.settings')
  try {
    const { data: auditRow } = await supabaseAdmin
      .from("admin_audit_log")
      .select("details, created_at")
      .eq("action", "platform_tracking.settings")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (auditRow?.details && typeof auditRow.details === "object") {
      const d = auditRow.details as Partial<PlatformTrackingSettings>;
      const settings: PlatformTrackingSettings = {
        ...emptyPlatformTracking,
        ...d,
        updated_at: auditRow.created_at,
      };
      cachedSettings = { value: settings, at: Date.now() };
      return settings;
    }
  } catch {
    // Rien d'enregistré
  }

  return emptyPlatformTracking;
}

/** Sauvegarde les réglages de tracking par l'administrateur. */
export async function savePlatformTrackingSettings(
  patch: Partial<PlatformTrackingSettings>,
  actor: { userId: string; email: string | null },
): Promise<PlatformTrackingSettings> {
  const current = await getPlatformTrackingSettings(true);
  const next: PlatformTrackingSettings = {
    enabled: typeof patch.enabled === "boolean" ? patch.enabled : current.enabled,
    facebook_pixel_id: patch.facebook_pixel_id !== undefined ? patch.facebook_pixel_id.trim() : current.facebook_pixel_id,
    facebook_capi_token: patch.facebook_capi_token !== undefined ? patch.facebook_capi_token.trim() : current.facebook_capi_token,
    facebook_test_event_code: patch.facebook_test_event_code !== undefined ? patch.facebook_test_event_code.trim() : current.facebook_test_event_code,
    tiktok_pixel_id: patch.tiktok_pixel_id !== undefined ? patch.tiktok_pixel_id.trim() : current.tiktok_pixel_id,
    tiktok_access_token: patch.tiktok_access_token !== undefined ? patch.tiktok_access_token.trim() : current.tiktok_access_token,
    tiktok_test_event_code: patch.tiktok_test_event_code !== undefined ? patch.tiktok_test_event_code.trim() : current.tiktok_test_event_code,
    google_ads_id: patch.google_ads_id !== undefined ? patch.google_ads_id.trim() : current.google_ads_id,
    google_ads_conversion_label: patch.google_ads_conversion_label !== undefined ? patch.google_ads_conversion_label.trim() : current.google_ads_conversion_label,
    ga4_measurement_id: patch.ga4_measurement_id !== undefined ? patch.ga4_measurement_id.trim() : current.ga4_measurement_id,
    ga4_api_secret: patch.ga4_api_secret !== undefined ? patch.ga4_api_secret.trim() : current.ga4_api_secret,
    updated_at: new Date().toISOString(),
  };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // 1. Tenter d'enregistrer dans platform_tracking_settings
  try {
    await supabaseAdmin.from("platform_tracking_settings" as never).upsert({
      id: 1,
      ...next,
    } as never);
  } catch (err) {
    console.warn("[platform_tracking] Table platform_tracking_settings introuvable, sauvegarde via audit log", err);
  }

  // 2. Toujours enregistrer une entrée d'audit log pour traçabilité et fallback immédiat
  await supabaseAdmin.from("admin_audit_log").insert({
    actor_id: actor.userId,
    actor_email: actor.email,
    action: "platform_tracking.settings",
    target_type: "platform_tracking",
    target_id: "global",
    details: next as never,
  });

  cachedSettings = { value: next, at: Date.now() };
  return next;
}

/** Récupère les identifiants publics sûrs pour l'injection dans le navigateur. */
export async function getPublicPlatformTracking(): Promise<PublicPlatformTracking> {
  const settings = await getPlatformTrackingSettings();
  if (!settings.enabled) {
    return {
      enabled: false,
      facebook_pixel_id: null,
      tiktok_pixel_id: null,
      google_ads_id: null,
      google_ads_conversion_label: null,
      ga4_measurement_id: null,
    };
  }

  return {
    enabled: true,
    facebook_pixel_id: settings.facebook_pixel_id || null,
    tiktok_pixel_id: settings.tiktok_pixel_id || null,
    google_ads_id: settings.google_ads_id || null,
    google_ads_conversion_label: settings.google_ads_conversion_label || null,
    ga4_measurement_id: settings.ga4_measurement_id || null,
  };
}

/** Meta / Facebook Conversions API pour la plateforme DUKAIO. */
export async function sendPlatformFacebook(
  settings: PlatformTrackingSettings,
  event: PlatformServerEvent,
  test = false,
): Promise<Outcome> {
  if (!settings.facebook_pixel_id) {
    return { ok: false, detail: "Ajoutez d'abord l'ID de votre Pixel Facebook DUKAIO." };
  }
  if (!settings.facebook_capi_token) {
    return {
      ok: false,
      detail:
        "L'ID du pixel est renseigné. Pour activer le suivi serveur CAPI, ajoutez le jeton d'accès (Meta Events Manager › Paramètres › Générer un jeton d'accès).",
    };
  }

  const code = settings.facebook_test_event_code?.trim().toUpperCase();
  if (test && code && !/^TEST\d+$/.test(code)) {
    return {
      ok: false,
      detail:
        "Le code de test Meta n'est pas valide. Copiez le code commençant par TEST dans Meta › Tester les évènements.",
    };
  }

  const [em, ph, externalId] = await Promise.all([
    event.email ? sha256(event.email) : null,
    event.phone ? sha256(event.phone.replace(/[^\d]/g, "")) : null,
    event.externalId ? sha256(event.externalId) : null,
  ]);

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: event.event,
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        action_source: "website",
        ...(event.sourceUrl ? { event_source_url: event.sourceUrl } : {}),
        user_data: {
          ...(em ? { em: [em] } : {}),
          ...(ph ? { ph: [ph] } : {}),
          ...(externalId ? { external_id: [externalId] } : {}),
          ...(event.clientIp ? { client_ip_address: event.clientIp } : {}),
          ...(event.userAgent ? { client_user_agent: event.userAgent } : {}),
        },
        custom_data: {
          currency: event.currency ?? "XOF",
          value: event.value ?? 0,
          ...(event.contentName ? { content_name: event.contentName } : {}),
        },
      },
    ],
  };

  if (test && code) {
    body["test_event_code"] = code;
  }

  try {
    const res = await fetch(
      `${FB_GRAPH}/${encodeURIComponent(settings.facebook_pixel_id)}/events?access_token=${encodeURIComponent(settings.facebook_capi_token)}`,
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
    );
    const json = (await res.json().catch(() => null)) as
      | {
          events_received?: number;
          error?: {
            message?: string;
            error_user_msg?: string;
            error_user_title?: string;
          };
        }
      | null;

    if (!res.ok) {
      return {
        ok: false,
        detail:
          json?.error?.error_user_msg ??
          json?.error?.error_user_title ??
          json?.error?.message ??
          `Meta a répondu avec le statut ${res.status}.`,
      };
    }

    return {
      ok: true,
      detail: code
        ? `Succès ! Évènement de test reçu par Meta pour le pixel ${settings.facebook_pixel_id}. Rendez-vous dans « Tester les évènements » sur Meta pour le voir.`
        : `Succès ! ${json?.events_received ?? 1} évènement transmis à Meta CAPI avec succès pour le pixel ${settings.facebook_pixel_id}.`,
    };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : "Meta Conversions API injoignable." };
  }
}

/** TikTok Events API 2.0 pour la plateforme DUKAIO. */
export async function sendPlatformTiktok(
  settings: PlatformTrackingSettings,
  event: PlatformServerEvent,
  test = false,
): Promise<Outcome> {
  if (!settings.tiktok_pixel_id) {
    return { ok: false, detail: "Ajoutez d'abord l'ID de votre Pixel TikTok." };
  }
  if (!settings.tiktok_access_token) {
    return {
      ok: false,
      detail:
        "L'ID du pixel TikTok est renseigné. Ajoutez le jeton d'accès Events API pour tester la connexion serveur.",
    };
  }

  const [em, ph] = await Promise.all([
    event.email ? sha256(event.email) : null,
    event.phone ? sha256(event.phone.replace(/[^\d+]/g, "")) : null,
  ]);

  const TIKTOK_EVENTS: Record<PlatformTrackEvent, string> = {
    PageView: "Pageview",
    ViewContent: "ViewContent",
    InitiateCheckout: "InitiateCheckout",
    Lead: "Contact",
    CompleteRegistration: "CompleteRegistration",
    Subscribe: "Subscribe",
    Purchase: "PlaceAnOrder",
  };

  const body: Record<string, unknown> = {
    event_source: "web",
    event_source_id: settings.tiktok_pixel_id,
    data: [
      {
        event: TIKTOK_EVENTS[event.event] ?? "Pageview",
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        user: {
          ...(em ? { email: em } : {}),
          ...(ph ? { phone: ph } : {}),
          ...(event.clientIp ? { ip: event.clientIp } : {}),
          ...(event.userAgent ? { user_agent: event.userAgent } : {}),
        },
        page: event.sourceUrl ? { url: event.sourceUrl } : {},
        properties: {
          currency: event.currency ?? "XOF",
          value: event.value ?? 0,
          ...(event.contentName ? { content_name: event.contentName } : {}),
        },
      },
    ],
  };

  const code = settings.tiktok_test_event_code?.trim();
  if (test && code) body["test_event_code"] = code;

  try {
    const res = await fetch(TIKTOK_API, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Access-Token": settings.tiktok_access_token,
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as
      | { code?: number; message?: string }
      | null;

    if (!res.ok || (json?.code ?? 0) !== 0) {
      return { ok: false, detail: json?.message ?? `TikTok a répondu avec le statut ${res.status}.` };
    }
    return { ok: true, detail: "Succès ! Évènement reçu par TikTok Events API." };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : "TikTok injoignable." };
  }
}

/** Google Analytics 4 Measurement Protocol pour la plateforme DUKAIO. */
export async function sendPlatformGoogle(
  settings: PlatformTrackingSettings,
  event: PlatformServerEvent,
  test = false,
): Promise<Outcome> {
  if (!settings.ga4_measurement_id) {
    return { ok: false, detail: "Ajoutez d'abord l'ID de mesure GA4 (G-XXXXXXXXXX)." };
  }
  if (!settings.ga4_api_secret) {
    return { ok: false, detail: "Ajoutez le secret d'API GA4 Protocol pour activer l'envoi serveur." };
  }

  const GA4_NAMES: Record<PlatformTrackEvent, string> = {
    PageView: "page_view",
    ViewContent: "view_item",
    InitiateCheckout: "begin_checkout",
    Lead: "generate_lead",
    CompleteRegistration: "sign_up",
    Subscribe: "purchase",
    Purchase: "purchase",
  };

  const body = {
    client_id: event.eventId,
    events: [
      {
        name: GA4_NAMES[event.event] ?? "page_view",
        params: {
          currency: event.currency ?? "XOF",
          value: event.value ?? 0,
          ...(event.event === "Purchase" || event.event === "Subscribe" ? { transaction_id: event.eventId } : {}),
          ...(event.contentName ? { item_name: event.contentName } : {}),
        },
      },
    ],
  };

  const url = `${test ? GA4_DEBUG : GA4_COLLECT}?measurement_id=${encodeURIComponent(settings.ga4_measurement_id)}&api_secret=${encodeURIComponent(settings.ga4_api_secret)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (test) {
      const json = (await res.json().catch(() => null)) as
        | { validationMessages?: { description?: string }[] }
        | null;
      const problem = json?.validationMessages?.[0]?.description;
      if (problem) return { ok: false, detail: problem };
      return { ok: true, detail: "Succès ! Évènement validé par Google Analytics 4." };
    }
    if (!res.ok) return { ok: false, detail: `Google a répondu ${res.status}.` };
    return { ok: true, detail: "Évènement envoyé à Google Analytics 4." };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : "Google injoignable." };
  }
}

/** Diffuse une conversion majeure serveur à serveur (ex: inscription d'un vendeur, abonnement payant). */
export async function reportPlatformServerConversion(event: PlatformServerEvent): Promise<void> {
  try {
    const settings = await getPlatformTrackingSettings();
    if (!settings.enabled) return;

    await Promise.allSettled([
      settings.facebook_pixel_id && settings.facebook_capi_token
        ? sendPlatformFacebook(settings, event)
        : null,
      settings.tiktok_pixel_id && settings.tiktok_access_token
        ? sendPlatformTiktok(settings, event)
        : null,
      settings.ga4_measurement_id && settings.ga4_api_secret
        ? sendPlatformGoogle(settings, event)
        : null,
    ]);
  } catch (error) {
    console.error("[platform_tracking:server]", error);
  }
}

/** Teste en direct la connexion à un fournisseur depuis le tableau de bord administrateur. */
export async function testPlatformProvider(
  provider: PlatformTrackingProvider,
  settings: PlatformTrackingSettings,
): Promise<Outcome> {
  const testEvent: PlatformServerEvent = {
    event: "ViewContent",
    eventId: `test_${Date.now()}`,
    sourceUrl: "https://dukaio.com",
    contentName: "Test de connexion DUKAIO CAPI",
    value: 1000,
    currency: "XOF",
  };

  if (provider === "facebook") return sendPlatformFacebook(settings, testEvent, true);
  if (provider === "tiktok") return sendPlatformTiktok(settings, testEvent, true);
  if (provider === "google") return sendPlatformGoogle(settings, testEvent, true);
  return { ok: false, detail: "Fournisseur non reconnu." };
}
