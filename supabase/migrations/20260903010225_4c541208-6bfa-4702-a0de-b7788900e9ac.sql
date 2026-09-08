ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS legal_terms text,
  ADD COLUMN IF NOT EXISTS legal_privacy text,
  ADD COLUMN IF NOT EXISTS legal_notice text,
  ADD COLUMN IF NOT EXISTS social_whatsapp text,
  ADD COLUMN IF NOT EXISTS social_youtube text,
  ADD COLUMN IF NOT EXISTS contact_city text,
  ADD COLUMN IF NOT EXISTS theme_published jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS theme_published_at timestamp with time zone;

CREATE UNIQUE INDEX IF NOT EXISTS store_settings_subdomain_unique
  ON public.store_settings (lower(subdomain)) WHERE subdomain IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS store_settings_custom_domain_unique
  ON public.store_settings (lower(custom_domain)) WHERE custom_domain IS NOT NULL;

CREATE OR REPLACE FUNCTION public.is_store_link_available(_link text, _store_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.store_settings s
    WHERE lower(s.subdomain) = lower(trim(_link))
      AND (_store_id IS NULL OR s.id <> _store_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_custom_domain_available(_domain text, _store_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.store_settings s
    WHERE lower(s.custom_domain) = lower(trim(_domain))
      AND (_store_id IS NULL OR s.id <> _store_id)
  );
$$;

REVOKE ALL ON FUNCTION public.is_store_link_available(text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_custom_domain_available(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_store_link_available(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_custom_domain_available(text, uuid) TO authenticated;