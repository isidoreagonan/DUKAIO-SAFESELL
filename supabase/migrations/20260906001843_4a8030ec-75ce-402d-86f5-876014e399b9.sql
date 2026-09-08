ALTER TABLE public.discovery_ads
  ADD COLUMN IF NOT EXISTS page_like_count bigint,
  ADD COLUMN IF NOT EXISTS page_categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reach_estimate bigint,
  ADD COLUMN IF NOT EXISTS spend jsonb,
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS ad_library_url text,
  ADD COLUMN IF NOT EXISTS cta_type text,
  ADD COLUMN IF NOT EXISTS media_path text;

CREATE TABLE IF NOT EXISTS public.discovery_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  name text,
  platform text NOT NULL DEFAULT 'inconnue',
  currency text,
  language text,
  country text,
  products_count integer NOT NULL DEFAULT 0,
  avg_price numeric NOT NULL DEFAULT 0,
  min_price numeric NOT NULL DEFAULT 0,
  max_price numeric NOT NULL DEFAULT 0,
  products jsonb NOT NULL DEFAULT '[]'::jsonb,
  socials jsonb NOT NULL DEFAULT '{}'::jsonb,
  launched_at timestamptz,
  fetch_error text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_fetched_at timestamptz
);

GRANT SELECT ON public.discovery_stores TO authenticated;
GRANT ALL ON public.discovery_stores TO service_role;
ALTER TABLE public.discovery_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs connectes lisent les boutiques decouvertes"
  ON public.discovery_stores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Administrateurs gerent les boutiques decouvertes"
  ON public.discovery_stores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS discovery_stores_products_idx ON public.discovery_stores (products_count DESC);