/**
 * Types et réglages du suivi publicitaire global de la plateforme DUKAIO
 * (Meta / Facebook Pixel + Conversions API, TikTok Pixel + Events API, Google Ads & GA4).
 *
 * Contrairement au tracking d'une boutique individuelle (store_integrations),
 * ce système suit l'acquisition des utilisateurs pour l'ensemble de DUKAIO
 * (visiteurs, inscriptions de nouveaux vendeurs, abonnements payants).
 * Il exclut strictement les chemins /admin/* et les boutiques des clients.
 */

export type PlatformTrackingSettings = {
  enabled: boolean;
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
  updated_at?: string;
};

export const emptyPlatformTracking: PlatformTrackingSettings = {
  enabled: true,
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

/** Identifiants publics légers chargés dans le navigateur (jamais de jetons d'API). */
export type PublicPlatformTracking = {
  enabled: boolean;
  facebook_pixel_id: string | null;
  tiktok_pixel_id: string | null;
  google_ads_id: string | null;
  google_ads_conversion_label: string | null;
  ga4_measurement_id: string | null;
};

export type PlatformTrackingProvider = "facebook" | "tiktok" | "google";

export const PLATFORM_PROVIDER_LABEL: Record<PlatformTrackingProvider, string> = {
  facebook: "Meta (Facebook & Instagram)",
  tiktok: "TikTok Ads",
  google: "Google Ads & Analytics",
};

/** Évènements standards de conversion du tunnel plateforme DUKAIO. */
export type PlatformTrackEvent =
  | "PageView"
  | "ViewContent"
  | "InitiateCheckout"
  | "Lead"
  | "CompleteRegistration"
  | "Subscribe"
  | "Purchase";

export type PlatformTrackPayload = {
  value?: number;
  currency?: string;
  contentName?: string;
  contentCategory?: string;
  planKey?: string;
  email?: string | null;
  phone?: string | null;
  userId?: string | null;
  eventId?: string;
};
