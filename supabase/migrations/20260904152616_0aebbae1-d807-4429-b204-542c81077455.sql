CREATE TABLE public.lifecycle_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.lifecycle_emails TO service_role;
ALTER TABLE public.lifecycle_emails ENABLE ROW LEVEL SECURITY;
CREATE INDEX lifecycle_emails_user_kind_idx ON public.lifecycle_emails (user_id, kind, sent_at DESC);