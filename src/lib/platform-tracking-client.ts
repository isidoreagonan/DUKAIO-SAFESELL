/**
 * Suivi publicitaire client pour l'ensemble du site DUKAIO.
 *
 * RÈGLES DE SÉCURITÉ ET D'ISOLATION :
 * 1. N'est JAMAIS exécuté dans le panneau d'administration (/admin/*).
 * 2. N'interfère PAS avec le pixel individuel de la boutique d'un vendeur (/b/*, /p/*).
 * 3. Envoie les évènements d'acquisition de la plateforme (visites de landing page,
 *    tarifs, inscriptions de nouveaux vendeurs, souscriptions).
 */
import type {
  PublicPlatformTracking,
  PlatformTrackEvent,
  PlatformTrackPayload,
} from "./platform-tracking";

type AnyFn = (...args: unknown[]) => void;

type TrackingWindow = Window & {
  fbq?: AnyFn & { queue?: unknown[]; loaded?: boolean; version?: string; push?: AnyFn; callMethod?: AnyFn };
  ttq?: Record<string, unknown> & { track?: AnyFn; page?: AnyFn; load?: AnyFn };
  gtag?: AnyFn;
  dataLayer?: unknown[];
  __dukaioPlatformTracking?: PublicPlatformTracking;
};

function win(): TrackingWindow | null {
  return typeof window === "undefined" ? null : (window as TrackingWindow);
}

/** Vérifie si l'URL courante doit être strictement exclue du tracking plateforme. */
export function isExcludedPath(pathname: string): boolean {
  // 1. Panneau d'administration strictement exclu
  if (pathname.startsWith("/admin")) return true;
  // 2. Vitrines des boutiques clientes isolées (chacune a son propre pixel)
  if (pathname.startsWith("/b/") || pathname.startsWith("/p/")) return true;
  return false;
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
    addScript("dukaio-platform-fb-pixel", "https://connect.facebook.net/en_US/fbevents.js");
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
      "dukaio-platform-tt-pixel",
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
      "dukaio-platform-gtag",
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}`,
    );
  }
  w.gtag("config", tagId, { send_page_view: false });
}

/** Initialise les pixels plateforme dans le navigateur. */
export function initPlatformTracking(config: PublicPlatformTracking) {
  const w = win();
  if (!w || !config.enabled) return;
  if (isExcludedPath(window.location.pathname)) return;

  w.__dukaioPlatformTracking = config;
  if (config.facebook_pixel_id) loadFacebook(w, config.facebook_pixel_id);
  if (config.tiktok_pixel_id) loadTiktok(w, config.tiktok_pixel_id);
  const googleTag = config.ga4_measurement_id || config.google_ads_id;
  if (googleTag) {
    loadGoogle(w, googleTag);
    if (config.ga4_measurement_id && config.google_ads_id) {
      w.gtag?.("config", config.google_ads_id);
    }
  }
}

const TIKTOK_EVENTS: Record<PlatformTrackEvent, string> = {
  PageView: "Pageview",
  ViewContent: "ViewContent",
  InitiateCheckout: "InitiateCheckout",
  Lead: "Contact",
  CompleteRegistration: "CompleteRegistration",
  Subscribe: "Subscribe",
  Purchase: "PlaceAnOrder",
};

const GA4_EVENTS: Record<PlatformTrackEvent, string> = {
  PageView: "page_view",
  ViewContent: "view_item",
  InitiateCheckout: "begin_checkout",
  Lead: "generate_lead",
  CompleteRegistration: "sign_up",
  Subscribe: "purchase",
  Purchase: "purchase",
};

/**
 * Envoie un évènement publicitaire plateforme (Meta, TikTok, Google).
 * Garanti inactif sur /admin/* et sur les vitrines des boutiques.
 */
export function trackPlatformEvent(event: PlatformTrackEvent, payload: PlatformTrackPayload = {}) {
  const w = win();
  if (!w) return;

  // STRICT FILTER: Panneau d'admin et vitrines vendeurs non tracés
  if (isExcludedPath(window.location.pathname)) return;

  const config = w.__dukaioPlatformTracking;
  if (!config || !config.enabled) return;

  const currency = payload.currency || "XOF";
  const value = payload.value ?? 0;
  const eventId = payload.eventId;

  // 1. Meta / Facebook Pixel
  if (config.facebook_pixel_id && w.fbq) {
    w.fbq(
      "track",
      event,
      {
        currency,
        value,
        ...(payload.contentName ? { content_name: payload.contentName } : {}),
        ...(payload.contentCategory ? { content_category: payload.contentCategory } : {}),
      },
      ...(eventId ? [{ eventID: eventId }] : []),
    );
  }

  // 2. TikTok Pixel
  if (config.tiktok_pixel_id && w.ttq?.track) {
    w.ttq.track(TIKTOK_EVENTS[event] ?? "Pageview", {
      currency,
      value,
      ...(payload.contentName ? { content_name: payload.contentName } : {}),
      ...(eventId ? { event_id: eventId } : {}),
    });
  }

  // 3. Google Analytics 4
  if (config.ga4_measurement_id && w.gtag) {
    w.gtag("event", GA4_EVENTS[event] ?? "page_view", {
      currency,
      value,
      ...(eventId ? { transaction_id: eventId } : {}),
      ...(payload.contentName ? { content_name: payload.contentName } : {}),
    });
  }

  // 4. Google Ads Conversion (sur inscription réussie ou abonnement)
  if (
    (event === "CompleteRegistration" || event === "Subscribe" || event === "Purchase") &&
    config.google_ads_id &&
    config.google_ads_conversion_label &&
    w.gtag
  ) {
    w.gtag("event", "conversion", {
      send_to: `${config.google_ads_id}/${config.google_ads_conversion_label}`,
      value,
      currency,
      ...(eventId ? { transaction_id: eventId } : {}),
    });
  }
}
