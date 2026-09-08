ALTER TABLE public.discovery_brand_searches
  ADD COLUMN IF NOT EXISTS billed BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS stores INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS discovery_brand_searches_billed_idx
  ON public.discovery_brand_searches (user_id, billed, created_at DESC);