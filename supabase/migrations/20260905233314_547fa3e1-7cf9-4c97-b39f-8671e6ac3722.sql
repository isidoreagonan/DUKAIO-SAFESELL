CREATE TABLE public.discovery_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL DEFAULT 'meta',
  external_id text NOT NULL,
  page_id text,
  page_name text NOT NULL DEFAULT '',
  page_avatar_url text,
  headline text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  cta_text text,
  link_url text,
  landing_domain text,
  media_type text NOT NULL DEFAULT 'image',
  image_url text,
  video_url text,
  thumbnail_url text,
  country text NOT NULL DEFAULT 'BJ',
  keyword text,
  category text NOT NULL DEFAULT 'À la une',
  publisher_platforms text[] NOT NULL DEFAULT '{}',
  variations_count integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  started_at timestamptz,
  ended_at timestamptz,
  active_days integer NOT NULL DEFAULT 0,
  traction_score integer NOT NULL DEFAULT 0,
  raw jsonb,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, external_id)
);

CREATE INDEX discovery_ads_score_idx ON public.discovery_ads (traction_score DESC);
CREATE INDEX discovery_ads_country_idx ON public.discovery_ads (country);
CREATE INDEX discovery_ads_page_idx ON public.discovery_ads (page_id);
CREATE INDEX discovery_ads_domain_idx ON public.discovery_ads (landing_domain);

GRANT SELECT ON public.discovery_ads TO authenticated;
GRANT ALL ON public.discovery_ads TO service_role;
ALTER TABLE public.discovery_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comptes connectés consultent la découverte"
  ON public.discovery_ads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Les admins gèrent la découverte"
  ON public.discovery_ads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.discovery_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'apify-meta',
  keyword text,
  country text,
  found integer NOT NULL DEFAULT 0,
  inserted integer NOT NULL DEFAULT 0,
  updated integer NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.discovery_scans TO authenticated;
GRANT ALL ON public.discovery_scans TO service_role;
ALTER TABLE public.discovery_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les admins consultent le journal des collectes"
  ON public.discovery_scans FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));