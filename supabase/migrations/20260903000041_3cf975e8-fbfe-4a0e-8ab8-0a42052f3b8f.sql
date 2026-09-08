-- ============ ENUMS ============
create type public.app_role as enum ('admin','user');
create type public.product_status as enum ('draft','active','archived');
create type public.order_status as enum ('pending','processing','in_escrow','completed','cancelled','refunded');

-- ============ HELPERS ============
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at_column();

-- ============ ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create policy "user_roles_select_own" on public.user_roles for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- new user bootstrap
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ STORE SETTINGS ============
create table public.store_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_name text not null default 'Ma Boutique',
  subdomain text unique,
  custom_domain text unique,
  country text,
  currency text not null default 'XOF',
  language text not null default 'fr',
  description text,
  logo_url text,
  favicon_url text,
  contact_email text,
  contact_phone text,
  contact_address text,
  social_facebook text,
  social_instagram text,
  social_tiktok text,
  theme_config jsonb not null default '{}'::jsonb,
  web_notifications boolean not null default true,
  email_notifications boolean not null default true,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index store_settings_user_id_idx on public.store_settings(user_id);
grant select, insert, update, delete on public.store_settings to authenticated;
grant select on public.store_settings to anon;
grant all on public.store_settings to service_role;
alter table public.store_settings enable row level security;
create policy "store_settings_owner_all" on public.store_settings for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "store_settings_admin_read" on public.store_settings for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "store_settings_public_read" on public.store_settings for select to anon
  using (is_published = true);
create trigger store_settings_updated_at before update on public.store_settings for each row execute function public.update_updated_at_column();

-- ============ SENSITIVE INTEGRATIONS (never public) ============
create table public.store_integrations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.store_settings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  facebook_pixel_id text,
  facebook_capi_token text,
  google_sheets_url text,
  cloudinary_cloud_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.store_integrations to authenticated;
grant all on public.store_integrations to service_role;
alter table public.store_integrations enable row level security;
create policy "store_integrations_owner_all" on public.store_integrations for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger store_integrations_updated_at before update on public.store_integrations for each row execute function public.update_updated_at_column();

-- ============ PRODUCTS ============
create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid references public.store_settings(id) on delete cascade,
  name text not null,
  title text,
  slug text,
  description text,
  status public.product_status not null default 'draft',
  vendor text,
  product_type text,
  tags text[] not null default '{}',
  image_url text,
  images text[] not null default '{}',
  price numeric(12,2) not null default 0,
  price_regular numeric(12,2) not null default 0,
  price_compare numeric(12,2) not null default 0,
  price_cost numeric(12,2) not null default 0,
  sku text,
  barcode text,
  track_quantity boolean not null default true,
  continue_selling_out_of_stock boolean not null default false,
  quantity integer not null default 0,
  inventory integer not null default 0,
  is_physical boolean not null default true,
  weight numeric(10,3) not null default 0,
  seo_title text,
  seo_description text,
  options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_user_id_idx on public.products(user_id);
create index products_store_id_idx on public.products(store_id);
create unique index products_store_slug_idx on public.products(store_id, slug) where slug is not null;
grant select, insert, update, delete on public.products to authenticated;
grant select on public.products to anon;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products_owner_all" on public.products for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "products_admin_read" on public.products for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "products_public_read" on public.products for select to anon
  using (status = 'active' and exists (
    select 1 from public.store_settings s where s.id = products.store_id and s.is_published = true));
create trigger products_updated_at before update on public.products for each row execute function public.update_updated_at_column();

-- ============ VARIANTS ============
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  title text,
  option1 text,
  option2 text,
  option3 text,
  price numeric(12,2) not null default 0,
  quantity integer not null default 0,
  sku text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_variants_product_id_idx on public.product_variants(product_id);
grant select, insert, update, delete on public.product_variants to authenticated;
grant select on public.product_variants to anon;
grant all on public.product_variants to service_role;
alter table public.product_variants enable row level security;
create policy "product_variants_owner_all" on public.product_variants for all to authenticated
  using (exists (select 1 from public.products p where p.id = product_variants.product_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.products p where p.id = product_variants.product_id and p.user_id = auth.uid()));
create policy "product_variants_public_read" on public.product_variants for select to anon
  using (exists (
    select 1 from public.products p join public.store_settings s on s.id = p.store_id
    where p.id = product_variants.product_id and p.status = 'active' and s.is_published = true));
create trigger product_variants_updated_at before update on public.product_variants for each row execute function public.update_updated_at_column();

-- ============ CUSTOMERS ============
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid references public.store_settings(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  address text,
  city text,
  country text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index customers_user_id_idx on public.customers(user_id);
grant select, insert, update, delete on public.customers to authenticated;
grant all on public.customers to service_role;
alter table public.customers enable row level security;
create policy "customers_owner_all" on public.customers for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger customers_updated_at before update on public.customers for each row execute function public.update_updated_at_column();

-- ============ ORDERS ============
create sequence public.order_number_seq;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid references public.store_settings(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  order_number text not null unique default 'DK-' || lpad(nextval('public.order_number_seq')::text, 6, '0'),
  customer_name text,
  customer_phone text,
  customer_email text,
  amount numeric(12,2) not null default 0,
  currency text not null default 'XOF',
  status public.order_status not null default 'pending',
  payment_method text,
  shipping_address text,
  shipping_city text,
  note text,
  escrow_released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_id_idx on public.orders(user_id);
create index orders_store_id_idx on public.orders(store_id);
grant select, insert, update, delete on public.orders to authenticated;
grant insert on public.orders to anon;
grant all on public.orders to service_role;
grant usage on sequence public.order_number_seq to anon, authenticated, service_role;
alter table public.orders enable row level security;
create policy "orders_owner_all" on public.orders for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "orders_public_insert" on public.orders for insert to anon
  with check (exists (
    select 1 from public.store_settings s
    where s.id = orders.store_id and s.is_published = true and s.user_id = orders.user_id)
    and status = 'pending' and escrow_released_at is null);
create trigger orders_updated_at before update on public.orders for each row execute function public.update_updated_at_column();

-- ============ ORDER ITEMS ============
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  title text not null,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
create index order_items_order_id_idx on public.order_items(order_id);
grant select, insert, update, delete on public.order_items to authenticated;
grant insert on public.order_items to anon;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "order_items_owner_all" on public.order_items for all to authenticated
  using (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()))
  with check (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()));
create policy "order_items_public_insert" on public.order_items for insert to anon
  with check (exists (
    select 1 from public.orders o join public.store_settings s on s.id = o.store_id
    where o.id = order_items.order_id and s.is_published = true));

-- ============ MEDIA LIBRARY ============
create table public.media_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  name text,
  type text,
  size_bytes bigint,
  storage_path text,
  added_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index media_library_user_id_idx on public.media_library(user_id);
grant select, insert, update, delete on public.media_library to authenticated;
grant select on public.media_library to anon;
grant all on public.media_library to service_role;
alter table public.media_library enable row level security;
create policy "media_library_owner_all" on public.media_library for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ FUNCTION HARDENING ============
revoke all on function public.handle_new_user() from anon, authenticated, public;
revoke all on function public.has_role(uuid, public.app_role) from anon, public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;