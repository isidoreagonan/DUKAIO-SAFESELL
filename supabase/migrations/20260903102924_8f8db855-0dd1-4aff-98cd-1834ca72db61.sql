create type public.store_member_role as enum ('closer','products','courier','admin');
create type public.store_member_status as enum ('pending','active','inactive');

create table public.store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.store_settings(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  full_name text,
  role public.store_member_role not null default 'closer',
  permissions text[] not null default '{}',
  status public.store_member_status not null default 'pending',
  invite_token text not null unique,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, email)
);

grant select, insert, update, delete on public.store_members to authenticated;
grant all on public.store_members to service_role;

alter table public.store_members enable row level security;

create policy store_members_owner_all on public.store_members
  for all to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy store_members_self_read on public.store_members
  for select to authenticated
  using (auth.uid() = user_id);

create index store_members_store_idx on public.store_members (store_id, created_at desc);

create trigger store_members_updated_at before update on public.store_members
  for each row execute function public.update_updated_at_column();