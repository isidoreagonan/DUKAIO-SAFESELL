create or replace function public.effective_plan_key(_store_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1
      from public.store_settings st
      join public.user_roles r on r.user_id = st.user_id and r.role = 'admin'
      where st.id = _store_id
    ) then 'pro'
    else coalesce((
      select case
        when s.status = 'active'
         and (s.period_end is null or s.period_end > now())
         and s.plan in ('starter', 'pro')
        then s.plan
        else 'free'
      end
      from public.store_subscriptions s
      where s.store_id = _store_id
      limit 1
    ), 'free')
  end
$$;

create or replace function public.best_plan_key(_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1 from public.user_roles r
      where r.user_id = _user_id and r.role = 'admin'
    ) then 2
    else coalesce((
      select max(case
        when s.status = 'active'
         and (s.period_end is null or s.period_end > now())
         and s.plan = 'pro' then 2
        when s.status = 'active'
         and (s.period_end is null or s.period_end > now())
         and s.plan = 'starter' then 1
        else 0
      end)
      from public.store_subscriptions s
      where s.user_id = _user_id
    ), 0)
  end::text
$$;