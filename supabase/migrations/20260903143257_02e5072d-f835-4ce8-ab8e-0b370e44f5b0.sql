-- =========================== collections ===========================
CREATE TABLE public.collections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.store_settings(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  image_url text,
  position integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT SELECT ON public.collections TO anon;
GRANT ALL ON public.collections TO service_role;

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY collections_owner_all ON public.collections
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY collections_public_read ON public.collections
  FOR SELECT TO anon
  USING (
    is_published = true
    AND EXISTS (SELECT 1 FROM public.store_settings s WHERE s.id = collections.store_id AND s.is_published = true)
  );

CREATE TRIGGER collections_updated_at BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================== collection_products ========================
CREATE TABLE public.collection_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (collection_id, product_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_products TO authenticated;
GRANT SELECT ON public.collection_products TO anon;
GRANT ALL ON public.collection_products TO service_role;

ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY collection_products_owner_all ON public.collection_products
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_products.collection_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_products.collection_id AND c.user_id = auth.uid()));

CREATE POLICY collection_products_public_read ON public.collection_products
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.collections c
    JOIN public.store_settings s ON s.id = c.store_id
    WHERE c.id = collection_products.collection_id AND c.is_published = true AND s.is_published = true
  ));

-- ============================= coupons =============================
CREATE TYPE public.coupon_type AS ENUM ('percent', 'fixed');

CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.store_settings(id) ON DELETE CASCADE,
  code text NOT NULL,
  type public.coupon_type NOT NULL DEFAULT 'percent',
  value numeric NOT NULL DEFAULT 0,
  min_subtotal numeric NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, code)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT SELECT ON public.coupons TO anon;
GRANT ALL ON public.coupons TO service_role;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY coupons_owner_all ON public.coupons
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY coupons_public_read ON public.coupons
  FOR SELECT TO anon
  USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM public.store_settings s WHERE s.id = coupons.store_id AND s.is_published = true)
  );

CREATE TRIGGER coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================== offers =============================
CREATE TYPE public.offer_type AS ENUM ('quantity', 'bogo', 'free_shipping');

CREATE TABLE public.offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.store_settings(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  type public.offer_type NOT NULL DEFAULT 'quantity',
  tiers jsonb NOT NULL DEFAULT '[]'::jsonb,
  buy_quantity integer NOT NULL DEFAULT 0,
  get_quantity integer NOT NULL DEFAULT 0,
  min_subtotal numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT SELECT ON public.offers TO anon;
GRANT ALL ON public.offers TO service_role;

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY offers_owner_all ON public.offers
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY offers_public_read ON public.offers
  FOR SELECT TO anon
  USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM public.store_settings s WHERE s.id = offers.store_id AND s.is_published = true)
  );

CREATE TRIGGER offers_updated_at BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================== orders =============================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_amount numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS collections_store_idx ON public.collections(store_id);
CREATE INDEX IF NOT EXISTS collection_products_collection_idx ON public.collection_products(collection_id);
CREATE INDEX IF NOT EXISTS coupons_store_idx ON public.coupons(store_id);
CREATE INDEX IF NOT EXISTS offers_store_idx ON public.offers(store_id);