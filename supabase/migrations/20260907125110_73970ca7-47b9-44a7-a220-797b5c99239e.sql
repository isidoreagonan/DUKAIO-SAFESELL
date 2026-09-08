ALTER TABLE public.discovery_stores ADD COLUMN IF NOT EXISTS pixels text[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS discovery_stores_pixels_idx ON public.discovery_stores USING gin (pixels);
CREATE INDEX IF NOT EXISTS discovery_ads_platform_idx ON public.discovery_ads (platform);