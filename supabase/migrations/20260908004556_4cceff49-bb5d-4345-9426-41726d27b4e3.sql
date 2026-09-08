create table if not exists public.ai_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid references public.store_settings(id) on delete set null,
  title text not null default 'Nouvelle discussion',
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.ai_chats to authenticated;
grant all on public.ai_chats to service_role;
alter table public.ai_chats enable row level security;
create policy "own chats" on public.ai_chats for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger ai_chats_updated_at before update on public.ai_chats
  for each row execute function public.update_updated_at_column();
create index if not exists ai_chats_user_idx on public.ai_chats (user_id, updated_at desc);

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.ai_chats(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null default '',
  image_url text,
  provider text,
  model text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.ai_chat_messages to authenticated;
grant all on public.ai_chat_messages to service_role;
alter table public.ai_chat_messages enable row level security;
create policy "own chat messages" on public.ai_chat_messages for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists ai_chat_messages_chat_idx on public.ai_chat_messages (chat_id, created_at);

create table if not exists public.ai_provider_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('google','openai','anthropic','xai')),
  model text,
  api_key text not null,
  is_active boolean not null default true,
  last_error text,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);
grant select, insert, update, delete on public.ai_provider_keys to authenticated;
grant all on public.ai_provider_keys to service_role;
alter table public.ai_provider_keys enable row level security;
create policy "own ai keys" on public.ai_provider_keys for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger ai_provider_keys_updated_at before update on public.ai_provider_keys
  for each row execute function public.update_updated_at_column();

alter table public.store_subscriptions
  add column if not exists chat_used integer not null default 0,
  add column if not exists chat_period_start timestamptz,
  add column if not exists chat_extra integer not null default 0;