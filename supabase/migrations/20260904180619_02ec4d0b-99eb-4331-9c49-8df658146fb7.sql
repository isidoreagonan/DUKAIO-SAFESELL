CREATE TABLE public.store_whatsapp (
  store_id uuid PRIMARY KEY REFERENCES public.store_settings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number_id text,
  waba_id text,
  display_phone text,
  access_token text,
  verify_token text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  is_active boolean NOT NULL DEFAULT false,
  greeting text,
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX store_whatsapp_phone_number_id_key ON public.store_whatsapp (phone_number_id) WHERE phone_number_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_whatsapp TO authenticated;
GRANT ALL ON public.store_whatsapp TO service_role;
ALTER TABLE public.store_whatsapp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their whatsapp config" ON public.store_whatsapp FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER store_whatsapp_updated_at BEFORE UPDATE ON public.store_whatsapp FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.store_settings(id) ON DELETE CASCADE,
  wa_id text NOT NULL,
  state text NOT NULL DEFAULT 'menu',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, wa_id)
);
GRANT SELECT ON public.whatsapp_conversations TO authenticated;
GRANT ALL ON public.whatsapp_conversations TO service_role;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read their whatsapp conversations" ON public.whatsapp_conversations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.store_settings s WHERE s.id = whatsapp_conversations.store_id AND s.user_id = auth.uid()));
CREATE TRIGGER whatsapp_conversations_updated_at BEFORE UPDATE ON public.whatsapp_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.store_settings(id) ON DELETE CASCADE,
  wa_id text NOT NULL,
  direction text NOT NULL,
  body text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX whatsapp_messages_store_created_idx ON public.whatsapp_messages (store_id, created_at DESC);
GRANT SELECT ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read their whatsapp messages" ON public.whatsapp_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.store_settings s WHERE s.id = whatsapp_messages.store_id AND s.user_id = auth.uid()));