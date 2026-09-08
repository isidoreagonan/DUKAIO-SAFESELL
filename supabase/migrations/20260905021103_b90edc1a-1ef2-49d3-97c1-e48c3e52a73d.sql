create or replace function public.effective_plan_key(_store_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
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
$$;

create or replace function public.best_plan_key(_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(max(case
    when s.status = 'active'
     and (s.period_end is null or s.period_end > now())
     and s.plan = 'pro' then 2
    when s.status = 'active'
     and (s.period_end is null or s.period_end > now())
     and s.plan = 'starter' then 1
    else 0
  end), 0)
  from public.store_subscriptions s
  where s.user_id = _user_id
$$;

create or replace function public.enforce_product_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_limit integer;
  v_count integer;
begin
  v_plan := coalesce(public.effective_plan_key(new.store_id), 'free');
  v_limit := case v_plan when 'pro' then null when 'starter' then 200 else 20 end;
  if v_limit is null then
    return new;
  end if;
  select count(*) into v_count from public.products where store_id = new.store_id;
  if v_count >= v_limit then
    raise exception 'Limite de la formule atteinte : % produits maximum. Passez a une formule superieure pour ajouter ce produit.', v_limit;
  end if;
  return new;
end;
$$;

create trigger enforce_product_limit
before insert on public.products
for each row execute function public.enforce_product_limit();

create or replace function public.enforce_store_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier integer;
  v_limit integer;
  v_count integer;
begin
  v_tier := public.best_plan_key(new.user_id);
  v_limit := case when v_tier >= 2 then 5 else 1 end;
  select count(*) into v_count from public.store_settings where user_id = new.user_id;
  if v_count >= v_limit then
    raise exception 'Limite de la formule atteinte : % boutique(s) maximum. Passez au plan Pro pour ouvrir davantage de boutiques.', v_limit;
  end if;
  return new;
end;
$$;

create trigger enforce_store_limit
before insert on public.store_settings
for each row execute function public.enforce_store_limit();

create or replace function public.enforce_custom_domain_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.custom_domain is not null
     and btrim(new.custom_domain) <> ''
     and new.custom_domain is distinct from old.custom_domain
     and coalesce(public.effective_plan_key(new.id), 'free') <> 'pro' then
    raise exception 'Le domaine personnalise est reserve a la formule Pro.';
  end if;
  return new;
end;
$$;

create trigger enforce_custom_domain_plan
before update of custom_domain on public.store_settings
for each row execute function public.enforce_custom_domain_plan();

create or replace function public.enforce_team_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_limit integer;
  v_count integer;
begin
  v_plan := coalesce(public.effective_plan_key(new.store_id), 'free');
  v_limit := case v_plan when 'pro' then 5 when 'starter' then 1 else 0 end;
  select count(*) into v_count
  from public.store_members
  where store_id = new.store_id and status <> 'inactive';
  if v_count >= v_limit then
    if v_limit = 0 then
      raise exception 'La gestion d equipe est reservee aux formules payantes.';
    else
      raise exception 'Limite de la formule atteinte : % membre(s) d equipe maximum par boutique.', v_limit;
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_team_limit
before insert on public.store_members
for each row execute function public.enforce_team_limit();