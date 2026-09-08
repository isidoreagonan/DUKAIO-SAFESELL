CREATE TABLE public.store_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.store_settings(id) ON DELETE CASCADE,
  path text NOT NULL DEFAULT '/',
  country text,
  browser text,
  device text,
  referrer text,
  session_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX store_visits_store_created_idx ON public.store_visits (store_id, created_at DESC);

GRANT SELECT ON public.store_visits TO authenticated;
GRANT INSERT ON public.store_visits TO anon;
GRANT INSERT ON public.store_visits TO authenticated;
GRANT ALL ON public.store_visits TO service_role;

ALTER TABLE public.store_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_visits_owner_read" ON public.store_visits
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.store_settings s WHERE s.id = store_visits.store_id AND s.user_id = auth.uid()));

CREATE POLICY "store_visits_public_insert" ON public.store_visits
  FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.store_settings s WHERE s.id = store_visits.store_id AND s.is_published = true));

CREATE POLICY "store_visits_auth_insert" ON public.store_visits
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.store_settings s WHERE s.id = store_visits.store_id AND s.is_published = true));