create table if not exists public.user_security (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_2fa_enabled boolean not null default false,
  email_2fa_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.user_security to authenticated;
grant all on public.user_security to service_role;
alter table public.user_security enable row level security;

create policy user_security_select_own on public.user_security
  for select to authenticated using (auth.uid() = user_id);

create trigger user_security_updated_at before update on public.user_security
  for each row execute function public.update_updated_at_column();

create table if not exists public.email_otp_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  purpose text not null default 'login',
  attempts integer not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

grant all on public.email_otp_codes to service_role;
alter table public.email_otp_codes enable row level security;

create index if not exists email_otp_codes_user_idx on public.email_otp_codes (user_id, created_at desc);