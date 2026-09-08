ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS min_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS combo_product_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS discount_percent numeric NOT NULL DEFAULT 0;