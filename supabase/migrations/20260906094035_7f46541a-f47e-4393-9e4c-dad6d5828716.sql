CREATE TABLE public.discovery_brand_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  country TEXT,
  found INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX discovery_brand_searches_user_created_idx ON public.discovery_brand_searches (user_id, created_at DESC);
GRANT SELECT ON public.discovery_brand_searches TO authenticated;
GRANT ALL ON public.discovery_brand_searches TO service_role;
ALTER TABLE public.discovery_brand_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their own brand searches" ON public.discovery_brand_searches FOR SELECT TO authenticated USING (auth.uid() = user_id);