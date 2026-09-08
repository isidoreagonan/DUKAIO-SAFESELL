ALTER TABLE public.store_integrations
  ADD COLUMN IF NOT EXISTS facebook_test_event_code text,
  ADD COLUMN IF NOT EXISTS tiktok_pixel_id text,
  ADD COLUMN IF NOT EXISTS tiktok_access_token text,
  ADD COLUMN IF NOT EXISTS tiktok_test_event_code text,
  ADD COLUMN IF NOT EXISTS google_ads_id text,
  ADD COLUMN IF NOT EXISTS google_ads_conversion_label text,
  ADD COLUMN IF NOT EXISTS ga4_measurement_id text,
  ADD COLUMN IF NOT EXISTS ga4_api_secret text,
  ADD COLUMN IF NOT EXISTS tracking_enabled boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.storefront_tracking(_store_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_build_object(
      'facebook_pixel_id', i.facebook_pixel_id,
      'tiktok_pixel_id', i.tiktok_pixel_id,
      'google_ads_id', i.google_ads_id,
      'google_ads_conversion_label', i.google_ads_conversion_label,
      'ga4_measurement_id', i.ga4_measurement_id
    ),
    '{}'::jsonb
  )
  FROM public.store_integrations i
  JOIN public.store_settings s ON s.id = i.store_id
  WHERE i.store_id = _store_id
    AND s.is_published = true
    AND i.tracking_enabled = true;
$$;

REVOKE ALL ON FUNCTION public.storefront_tracking(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.storefront_tracking(uuid) TO anon, authenticated, service_role;