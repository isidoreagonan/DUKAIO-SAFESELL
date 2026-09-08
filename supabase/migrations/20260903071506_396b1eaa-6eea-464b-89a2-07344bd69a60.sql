CREATE TABLE public.theme_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.store_settings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text,
  kind text NOT NULL DEFAULT 'save' CHECK (kind IN ('save', 'publish', 'restore', 'auto')),
  config jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX theme_versions_store_created_idx ON public.theme_versions (store_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.theme_versions TO authenticated;
GRANT ALL ON public.theme_versions TO service_role;

ALTER TABLE public.theme_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "theme_versions_owner_select" ON public.theme_versions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "theme_versions_owner_insert" ON public.theme_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.store_settings s
      WHERE s.id = theme_versions.store_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "theme_versions_owner_delete" ON public.theme_versions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);