create or replace function public.effective_plan_key(_store_id uuid)
returns text
language sql
stable
security definer
set search_path to 'public'
as $function$
  select case
    when public.has_role(s.user_id, 'admin') then 'pro'
    when sub.status = 'active'
     and (sub.period_end is null or sub.period_end > now())
     and sub.plan in ('starter', 'pro')
    then sub.plan
    else 'free'
  end
  from public.store_settings s
  left join public.store_subscriptions sub on sub.store_id = s.id
  where s.id = _store_id
  limit 1
$function$;

create or replace function public.enforce_store_limit()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_tier integer;
  v_limit integer;
  v_count integer;
begin
  if public.has_role(new.user_id, 'admin') then
    return new;
  end if;
  v_tier := public.best_plan_key(new.user_id);
  v_limit := case when v_tier >= 2 then 5 else 1 end;
  select count(*) into v_count from public.store_settings where user_id = new.user_id;
  if v_count >= v_limit then
    raise exception 'Limite de la formule atteinte : % boutique(s) maximum. Passez au plan Pro pour ouvrir davantage de boutiques.', v_limit;
  end if;
  return new;
end;
$function$;