-- Table de configuration du suivi publicitaire et pixels de la plateforme DUKAIO
-- (Meta Pixel + CAPI, TikTok Pixel + Events API, Google Ads & GA4).
CREATE TABLE IF NOT EXISTS public.platform_tracking_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT true,
  facebook_pixel_id text,
  facebook_capi_token text,
  facebook_test_event_code text,
  tiktok_pixel_id text,
  tiktok_access_token text,
  tiktok_test_event_code text,
  google_ads_id text,
  google_ads_conversion_label text,
  ga4_measurement_id text,
  ga4_api_secret text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.platform_tracking_settings TO service_role;
GRANT SELECT, UPDATE ON public.platform_tracking_settings TO authenticated;
ALTER TABLE public.platform_tracking_settings ENABLE ROW LEVEL SECURITY;

-- Seuls les administrateurs peuvent lire les identifiants et jetons CAPI
CREATE POLICY "Admins can read platform tracking settings" ON public.platform_tracking_settings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seuls les administrateurs peuvent modifier les réglages de tracking
CREATE POLICY "Admins can update platform tracking settings" ON public.platform_tracking_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.platform_tracking_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
