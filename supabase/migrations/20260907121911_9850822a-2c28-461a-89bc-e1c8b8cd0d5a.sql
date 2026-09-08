CREATE TABLE public.discovery_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('ad', 'store', 'product')),
  ref_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX discovery_favorites_unique ON public.discovery_favorites (user_id, kind, ref_id);
CREATE INDEX discovery_favorites_user_created ON public.discovery_favorites (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.discovery_favorites TO authenticated;
GRANT ALL ON public.discovery_favorites TO service_role;

ALTER TABLE public.discovery_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendeurs gerent leurs favoris"
  ON public.discovery_favorites
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);