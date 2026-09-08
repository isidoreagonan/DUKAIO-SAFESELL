/**
 * Suivi publicitaire d'une boutique (Facebook / Meta, TikTok, Google Ads &
 * Analytics). Les identifiants publics (pixels) sont chargés dans la boutique
 * en ligne ; les jetons d'API restent côté serveur.
 */

/** Réglages complets, visibles seulement par le propriétaire. */
export type TrackingSettings = {
  tracking_enabled: boolean;
  facebook_pixel_id: string;
  facebook_capi_token: string;
  facebook_test_event_code: string;
  tiktok_pixel_id: string;
  tiktok_access_token: string;
  tiktok_test_event_code: string;
  google_ads_id: string;
  google_ads_conversion_label: string;
  ga4_measurement_id: string;
  ga4_api_secret: string;
};

export const emptyTracking: TrackingSettings = {
  tracking_enabled: true,
  facebook_pixel_id: "",
  facebook_capi_token: "",
  facebook_test_event_code: "",
  tiktok_pixel_id: "",
  tiktok_access_token: "",
  tiktok_test_event_code: "",
  google_ads_id: "",
  google_ads_conversion_label: "",
  ga4_measurement_id: "",
  ga4_api_secret: "",
};

/** Identifiants publics chargés dans la boutique en ligne. */
export type PublicTracking = {
  facebook_pixel_id: string | null;
  tiktok_pixel_id: string | null;
  google_ads_id: string | null;
  google_ads_conversion_label: string | null;
  ga4_measurement_id: string | null;
};

export type TrackingProvider = "facebook" | "tiktok" | "google";

export const PROVIDER_LABEL: Record<TrackingProvider, string> = {
  facebook: "Facebook / Meta",
  tiktok: "TikTok",
  google: "Google Ads & Analytics",
};

/** Évènements standards suivis sur la boutique. */
export type TrackEvent =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase";

export type TrackPayload = {
  value?: number;
  currency?: string;
  contentId?: string;
  contentName?: string;
  quantity?: number;
  orderId?: string;
  /** Identifiant partagé avec l'envoi serveur pour éviter les doublons. */
  eventId?: string;
  items?: { id: string; name: string; quantity: number; price: number }[];
};

