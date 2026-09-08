-- Limites de produits par formule
create or replace function public.plan_product_limit(_plan text)
returns integer language sql immutable set search_path = public as $$
  select case _plan when 'pro' then null when 'starter' then 200 else 20 end
$$;

create or replace function public.plan_store_limit(_plan text)
returns integer language sql immutable set search_path = public as $$
  select case _plan when 'pro' then 5 else 1 end
$$;

-- Formule effective d'un vendeur (celle de sa première boutique)
create or replace function public.effective_plan_key_for_user(_user_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce((
    select public.effective_plan_key(st.id)
    from public.store_settings st
    where st.user_id = _user_id
    order by st.created_at asc
    limit 1
  ), 'free')
$$;

create or replace function public.enforce_product_quota()
returns trigger language plpgsql security definer set search_path = public as $$
declare _plan text; _limit integer; _count integer;
begin
  _plan := public.effective_plan_key(new.store_id);
  _limit := public.plan_product_limit(_plan);
  if _limit is null then return new; end if;
  select count(*) into _count from public.products where store_id = new.store_id;
  if _count >= _limit then
    raise exception 'Limite de % produits atteinte pour la formule %. Passez à une formule supérieure.', _limit, _plan;
  end if;
  return new;
end $$;

drop trigger if exists enforce_product_quota_trg on public.products;
create trigger enforce_product_quota_trg
before insert on public.products
for each row execute function public.enforce_product_quota();

create or replace function public.enforce_store_rules()
returns trigger language plpgsql security definer set search_path = public as $$
declare _plan text; _limit integer; _count integer;
begin
  _plan := public.effective_plan_key_for_user(new.user_id);

  if tg_op = 'INSERT' then
    _limit := public.plan_store_limit(_plan);
    select count(*) into _count from public.store_settings where user_id = new.user_id;
    if _count >= _limit then
      raise exception 'Limite de % boutique(s) atteinte pour la formule %.', _limit, _plan;
    end if;
  end if;

  if new.custom_domain is not null and new.custom_domain <> ''
     and (tg_op = 'INSERT' or coalesce(old.custom_domain, '') <> coalesce(new.custom_domain, '')) then
    if _plan <> 'pro' then
      raise exception 'Le domaine personnalisé est réservé à la formule Pro.';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists enforce_store_rules_trg on public.store_settings;
create trigger enforce_store_rules_trg
before insert or update on public.store_settings
for each row execute function public.enforce_store_rules();

grant execute on function public.plan_product_limit(text) to authenticated, service_role;
grant execute on function public.plan_store_limit(text) to authenticated, service_role;
grant execute on function public.effective_plan_key_for_user(uuid) to authenticated, service_role;