/**
 * Envoi serveur-à-serveur des conversions réelles de la boutique vers
 * Facebook (Conversions API), TikTok (Events API) et Google Analytics 4
 * (Measurement Protocol). Server-only : les jetons ne quittent jamais le
 * serveur. Aucune erreur ici ne doit bloquer une commande.
 */
import type { TrackEvent, TrackingProvider } from "@/lib/tracking";

const FB_GRAPH = "https://graph.facebook.com/v21.0";
const TIKTOK_API = "https://business-api.tiktok.com/open_api/v1.3/event/track/";
const GA4_COLLECT = "https://www.google-analytics.com/mp/collect";
const GA4_DEBUG = "https://www.google-analytics.com/debug/mp/collect";

export type TrackingRow = {
  tracking_enabled: boolean | null;
  facebook_pixel_id: string | null;
  facebook_capi_token: string | null;
  facebook_test_event_code: string | null;
  tiktok_pixel_id: string | null;
  tiktok_access_token: string | null;
  tiktok_test_event_code: string | null;
  ga4_measurement_id: string | null;
  ga4_api_secret: string | null;
};

/** Hachage SHA-256 hexadécimal exigé par Meta et TikTok pour les données client. */
async function sha256(value: string) {
  const clean = value.trim().toLowerCase();
  if (!clean) return null;
  const bytes = new TextEncoder().encode(clean);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const TIKTOK_EVENT: Record<TrackEvent, string> = {
  PageView: "Pageview",
  ViewContent: "ViewContent",
  AddToCart: "AddToCart",
  InitiateCheckout: "InitiateCheckout",
  Purchase: "PlaceAnOrder",
};

const GA4_EVENT: Record<TrackEvent, string> = {
  PageView: "page_view",
  ViewContent: "view_item",
  AddToCart: "add_to_cart",
  InitiateCheckout: "begin_checkout",
  Purchase: "purchase",
};

export type ServerEvent = {
  event: TrackEvent;
  eventId: string;
  value?: number;
  currency?: string;
  sourceUrl?: string;
  email?: string | null;
  phone?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  externalId?: string | null;
  items?: { id: string; name: string; quantity: number; price: number }[];
};

type Outcome = { ok: boolean; detail: string };

/** Facebook / Meta Conversions API. */
export async function sendFacebook(
  row: TrackingRow,
  event: ServerEvent,
  test = false,
): Promise<Outcome> {
  if (!row.facebook_pixel_id)
    return { ok: false, detail: "Ajoutez d'abord l'ID de votre pixel Facebook." };
  if (!row.facebook_capi_token)
    return {
      ok: false,
      detail:
        "L'ID du pixel est bien enregistré. Pour tester la connexion, ajoutez aussi le jeton d'accès Conversions API (Meta, Gestionnaire d'évènements › Paramètres › Générer un jeton d'accès). Sans ce jeton, le pixel fonctionne sur votre boutique mais ne peut pas être vérifié ici.",
    };

  const code = row.facebook_test_event_code?.trim().toUpperCase();
  if (test && code && !/^TEST\d+$/.test(code)) {
    return {
      ok: false,
      detail:
        "Le code de test Meta n’est pas valide. Dans Meta, ouvrez votre pixel › Tester les évènements › Tester les évènements du serveur, puis copiez le code qui commence par TEST (exemple : TEST12345).",
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
          ...(event.items
            ? {
                contents: event.items.map((item) => ({
                  id: item.id,
                  quantity: item.quantity,
                  item_price: item.price,
                })),
                content_type: "product",
              }
            : {}),
        },
      },
    ],
  };
  if (test && code) body["test_event_code"] = code;

  try {
    const res = await fetch(
      `${FB_GRAPH}/${encodeURIComponent(row.facebook_pixel_id)}/events?access_token=${encodeURIComponent(row.facebook_capi_token)}`,
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
    if (!res.ok)
      return {
        ok: false,
        detail:
          json?.error?.error_user_msg ??
          json?.error?.error_user_title ??
          json?.error?.message ??
          `Facebook a répondu ${res.status}.`,
      };
    return {
      ok: true,
      detail: code
        ? `${json?.events_received ?? 1} évènement de test reçu par Meta pour le pixel ${row.facebook_pixel_id}. Ouvrez « Tester les évènements » dans Meta pour le voir.`
        : `${json?.events_received ?? 1} évènement reçu par Meta pour le pixel ${row.facebook_pixel_id}. Sans code TEST, il apparaîtra dans l’aperçu après le délai de traitement de Meta.`,
    };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : "Facebook injoignable." };
  }
}

/** TikTok Events API 2.0. */
export async function sendTiktok(
  row: TrackingRow,
  event: ServerEvent,
  test = false,
): Promise<Outcome> {
  if (!row.tiktok_pixel_id)
    return { ok: false, detail: "Ajoutez d'abord l'ID de votre pixel TikTok." };
  if (!row.tiktok_access_token)
    return {
      ok: false,
      detail:
        "L'ID du pixel TikTok est enregistré. Pour tester la connexion, ajoutez le jeton d'accès Events API (TikTok Events Manager › Paramètres › Generate Access Token).",
    };

  const [em, ph] = await Promise.all([
    event.email ? sha256(event.email) : null,
    event.phone ? sha256(event.phone.replace(/[^\d+]/g, "")) : null,
  ]);

  const body: Record<string, unknown> = {
    event_source: "web",
    event_source_id: row.tiktok_pixel_id,
    data: [
      {
        event: TIKTOK_EVENT[event.event],
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
          ...(event.items
            ? {
                contents: event.items.map((item) => ({
                  content_id: item.id,
                  content_name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                })),
                content_type: "product",
              }
            : {}),
        },
      },
    ],
  };
  const code = row.tiktok_test_event_code?.trim();
  if (test && code) body["test_event_code"] = code;

  try {
    const res = await fetch(TIKTOK_API, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Access-Token": row.tiktok_access_token,
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as
      | { code?: number; message?: string }
      | null;
    if (!res.ok || (json?.code ?? 0) !== 0)
      return { ok: false, detail: json?.message ?? `TikTok a répondu ${res.status}.` };
    return { ok: true, detail: "Évènement reçu par TikTok." };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : "TikTok injoignable." };
  }
}

/** Google Analytics 4 Measurement Protocol (alimente aussi Google Ads si lié). */
export async function sendGoogle(
  row: TrackingRow,
  event: ServerEvent,
  test = false,
): Promise<Outcome> {
  if (!row.ga4_measurement_id)
    return { ok: false, detail: "Ajoutez d'abord votre identifiant de mesure Google Analytics 4 (G-…)." };
  if (!row.ga4_api_secret)
    return {
      ok: false,
      detail:
        "L'identifiant de mesure est enregistré. Pour tester la connexion, ajoutez le secret d'API Google Analytics 4 (Administration › Flux de données › Secrets d'API du protocole de mesure).",
    };

  const body = {
    client_id: event.eventId,
    events: [
      {
        name: GA4_EVENT[event.event],
        params: {
          currency: event.currency ?? "XOF",
          value: event.value ?? 0,
          ...(event.event === "Purchase" ? { transaction_id: event.eventId } : {}),
          ...(event.items
            ? {
                items: event.items.map((item) => ({
                  item_id: item.id,
                  item_name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                })),
              }
            : {}),
        },
      },
    ],
  };

  const url = `${test ? GA4_DEBUG : GA4_COLLECT}?measurement_id=${encodeURIComponent(row.ga4_measurement_id)}&api_secret=${encodeURIComponent(row.ga4_api_secret)}`;
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
      return { ok: true, detail: "Évènement validé par Google Analytics." };
    }
    if (!res.ok) return { ok: false, detail: `Google a répondu ${res.status}.` };
    return { ok: true, detail: "Évènement envoyé à Google Analytics." };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : "Google injoignable." };
  }
}

const SENDERS: Record<TrackingProvider, typeof sendFacebook> = {
  facebook: sendFacebook,
  tiktok: sendTiktok,
  google: sendGoogle,
};

export async function sendProvider(
  provider: TrackingProvider,
  row: TrackingRow,
  event: ServerEvent,
  test = false,
) {
  return SENDERS[provider](row, event, test);
}

/** Réglages de suivi d'une boutique, ou null si aucun. */
export async function loadTrackingRow(storeId: string): Promise<TrackingRow | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("store_integrations")
    .select(
      "tracking_enabled, facebook_pixel_id, facebook_capi_token, facebook_test_event_code, tiktok_pixel_id, tiktok_access_token, tiktok_test_event_code, ga4_measurement_id, ga4_api_secret",
    )
    .eq("store_id", storeId)
    .maybeSingle();
  return (data as TrackingRow | null) ?? null;
}

/**
 * Conversion réelle (commande) diffusée à toutes les plateformes configurées.
 * Jamais bloquant : les erreurs sont seulement journalisées.
 */
export async function reportServerConversion(
  storeId: string,
  event: ServerEvent,
): Promise<void> {
  try {
    const row = await loadTrackingRow(storeId);
    if (!row || row.tracking_enabled === false) return;
    const results = await Promise.all([
      row.facebook_pixel_id && row.facebook_capi_token
        ? sendFacebook(row, event)
        : null,
      row.tiktok_pixel_id && row.tiktok_access_token ? sendTiktok(row, event) : null,
      row.ga4_measurement_id && row.ga4_api_secret ? sendGoogle(row, event) : null,
    ]);
    for (const result of results) {
      if (result && !result.ok) console.error("[tracking:server]", result.detail);
    }
  } catch (error) {
    console.error("[tracking:server]", error);
  }
}
