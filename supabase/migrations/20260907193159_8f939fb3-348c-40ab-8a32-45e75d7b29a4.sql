create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'running',
  phase int not null default 1,
  percent int not null default 12,
  message text,
  product_id text,
  input jsonb not null default '{}'::jsonb,
  funnel jsonb,
  palette jsonb,
  prompts jsonb,
  images jsonb not null default '{}'::jsonb,
  queue jsonb not null default '[]'::jsonb,
  next_index int not null default 0,
  error text,
  acknowledged boolean not null default false,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_jobs_user_status_idx on public.ai_jobs (user_id, status, updated_at desc);

grant select, insert, update, delete on public.ai_jobs to authenticated;
grant all on public.ai_jobs to service_role;

alter table public.ai_jobs enable row level security;

create policy "Users manage own ai jobs"
on public.ai_jobs for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);