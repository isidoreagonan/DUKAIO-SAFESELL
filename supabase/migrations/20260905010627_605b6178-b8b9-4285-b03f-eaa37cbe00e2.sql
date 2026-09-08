ALTER TABLE public.store_whatsapp
  ADD COLUMN IF NOT EXISTS connect_mode text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS connected_at timestamptz,
  ADD COLUMN IF NOT EXISTS business_id text,
  ADD COLUMN IF NOT EXISTS last_error text;