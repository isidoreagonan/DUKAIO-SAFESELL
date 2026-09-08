/**
 * Chargement des pixels publicitaires dans la boutique en ligne uniquement
 * (jamais dans le tableau de bord) et envoi des évènements standards.
 * Tout est exécuté après l'hydratation, dans le navigateur.
 */
import type { PublicTracking, TrackEvent, TrackPayload } from "@/lib/tracking";

type AnyFn = (...args: unknown[]) => void;

type TrackingWindow = Window & {
  fbq?: AnyFn & { queue?: unknown[]; loaded?: boolean; version?: string; push?: AnyFn; callMethod?: AnyFn };
  ttq?: Record<string, unknown> & { track?: AnyFn; page?: AnyFn; load?: AnyFn };
  gtag?: AnyFn;
  dataLayer?: unknown[];
  __dukaioTracking?: PublicTracking;
};

function win(): TrackingWindow | null {
  return typeof window === "undefined" ? null : (window as TrackingWindow);
}

function addScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function loadFacebook(w: TrackingWindow, pixelId: string) {
  if (!w.fbq) {
    const fbq: TrackingWindow["fbq"] = function (...args: unknown[]) {
      const self = fbq as NonNullable<TrackingWindow["fbq"]>;
      if (self.callMethod) self.callMethod(...args);
      else self.queue?.push(args);
    } as NonNullable<TrackingWindow["fbq"]>;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.push = fbq;
    w.fbq = fbq;
    addScript("dukaio-fb-pixel", "https://connect.facebook.net/en_US/fbevents.js");
  }
  w.fbq?.("init", pixelId);
}

function loadTiktok(w: TrackingWindow, pixelId: string) {
  if (!w.ttq) {
    const queue: unknown[] = [];
    const methods = [
      "page",
      "track",
      "identify",
      "instances",
      "debug",
      "on",
      "off",
      "once",
      "ready",
      "alias",
      "group",
      "enableCookie",
      "disableCookie",
    ];
    const ttq: Record<string, unknown> = { _i: {}, _t: {}, _o: {}, _q: queue };
    for (const method of methods) {
      ttq[method] = (...args: unknown[]) => queue.push([method, ...args]);
    }
    w.ttq = ttq as NonNullable<TrackingWindow["ttq"]>;
    addScript(
      "dukaio-tiktok-pixel",
      `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(pixelId)}&lib=ttq`,
    );
  }
  w.ttq?.load?.(pixelId);
}

function loadGoogle(w: TrackingWindow, tagId: string) {
  w.dataLayer = w.dataLayer ?? [];
  if (!w.gtag) {
    w.gtag = function (...args: unknown[]) {
      w.dataLayer?.push(args);
    };
    w.gtag("js", new Date());
    addScript(
      "dukaio-gtag",
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}`,
    );
  }
  w.gtag("config", tagId, { send_page_view: false });
}

/** Installe les pixels configurés sur la boutique. */
export function initTracking(config: PublicTracking) {
  const w = win();
  if (!w) return;
  w.__dukaioTracking = config;
  if (config.facebook_pixel_id) loadFacebook(w, config.facebook_pixel_id);
  if (config.tiktok_pixel_id) loadTiktok(w, config.tiktok_pixel_id);
  const googleTag = config.ga4_measurement_id || config.google_ads_id;
  if (googleTag) {
    loadGoogle(w, googleTag);
    if (config.ga4_measurement_id && config.google_ads_id)
      w.gtag?.("config", config.google_ads_id);
  }
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

/**
 * Envoie l'évènement aux trois plateformes actives. `orderId` sert
 * d'identifiant partagé avec l'envoi serveur pour éviter les doublons.
 */
export function trackEvent(event: TrackEvent, payload: TrackPayload = {}) {
  const w = win();
  const config = w?.__dukaioTracking;
  if (!w || !config) return;

  const currency = payload.currency || "XOF";
  const value = payload.value ?? 0;
  const eventId = payload.orderId;

  if (config.facebook_pixel_id) {
    w.fbq?.(
      "track",
      event,
      {
        currency,
        value,
        ...(payload.contentId ? { content_ids: [payload.contentId], content_type: "product" } : {}),
        ...(payload.contentName ? { content_name: payload.contentName } : {}),
      },
      ...(eventId ? [{ eventID: eventId }] : []),
    );
  }

  if (config.tiktok_pixel_id) {
    w.ttq?.track?.(TIKTOK_EVENT[event], {
      currency,
      value,
      ...(payload.contentId
        ? { content_id: payload.contentId, content_type: "product" }
        : {}),
      ...(payload.contentName ? { content_name: payload.contentName } : {}),
      ...(payload.quantity ? { quantity: payload.quantity } : {}),
      ...(eventId ? { event_id: eventId } : {}),
    });
  }

  if (config.ga4_measurement_id) {
    w.gtag?.("event", GA4_EVENT[event], {
      currency,
      value,
      ...(eventId ? { transaction_id: eventId } : {}),
      ...(payload.contentId
        ? {
            items: [
              {
                item_id: payload.contentId,
                item_name: payload.contentName ?? payload.contentId,
                quantity: payload.quantity ?? 1,
                price: value,
              },
            ],
          }
        : {}),
    });
  }

  /* Conversion Google Ads : uniquement sur l'achat réel. */
  if (event === "Purchase" && config.google_ads_id && config.google_ads_conversion_label) {
    w.gtag?.("event", "conversion", {
      send_to: `${config.google_ads_id}/${config.google_ads_conversion_label}`,
      value,
      currency,
      ...(eventId ? { transaction_id: eventId } : {}),
    });
  }
}
