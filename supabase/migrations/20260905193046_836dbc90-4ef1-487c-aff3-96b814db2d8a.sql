CREATE TABLE public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid not null references public.store_settings(id) on delete cascade,
  name text not null,
  subject text not null,
  preheader text,
  body text not null default '',
  cta_label text,
  cta_url text,
  audience text not null default 'all' check (audience in ('all','vip','inactive','city')),
  city text,
  min_orders integer not null default 2,
  inactive_days integer not null default 30,
  status text not null default 'draft' check (status in ('draft','sending','sent')),
  recipients_count integer not null default 0,
  sent_count integer not null default 0,
  opened_count integer not null default 0,
  clicked_count integer not null default 0,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_campaigns TO authenticated;
GRANT ALL ON public.email_campaigns TO service_role;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_owner" ON public.email_campaigns FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER email_campaigns_updated_at BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX email_campaigns_store_idx ON public.email_campaigns (store_id, created_at DESC);

CREATE TABLE public.email_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  status text not null default 'sent' check (status in ('sent','failed')),
  error_message text,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz not null default now()
);
GRANT SELECT ON public.email_campaign_recipients TO authenticated;
GRANT ALL ON public.email_campaign_recipients TO service_role;
ALTER TABLE public.email_campaign_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaign_recipients_owner_read" ON public.email_campaign_recipients
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX email_campaign_recipients_campaign_idx ON public.email_campaign_recipients (campaign_id);

CREATE TABLE public.abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.store_settings(id) on delete cascade,
  session_id text not null,
  customer_name text,
  phone text,
  email text,
  city text,
  address text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  status text not null default 'open' check (status in ('open','ordered','recovered')),
  order_number text,
  recovery_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, session_id)
);
GRANT SELECT, UPDATE, DELETE ON public.abandoned_carts TO authenticated;
GRANT ALL ON public.abandoned_carts TO service_role;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "abandoned_carts_owner" ON public.abandoned_carts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.store_settings s WHERE s.id = store_id AND s.user_id = auth.uid()));
CREATE POLICY "abandoned_carts_owner_update" ON public.abandoned_carts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.store_settings s WHERE s.id = store_id AND s.user_id = auth.uid()));
CREATE POLICY "abandoned_carts_owner_delete" ON public.abandoned_carts FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.store_settings s WHERE s.id = store_id AND s.user_id = auth.uid()));
CREATE TRIGGER abandoned_carts_updated_at BEFORE UPDATE ON public.abandoned_carts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX abandoned_carts_store_idx ON public.abandoned_carts (store_id, updated_at DESC);