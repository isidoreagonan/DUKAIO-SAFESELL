CREATE OR REPLACE FUNCTION public.order_in_published_store(_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.store_settings s ON s.id = o.store_id
    WHERE o.id = _order_id AND s.is_published = true
  );
$$;

REVOKE ALL ON FUNCTION public.order_in_published_store(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.order_in_published_store(uuid) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS order_items_public_insert ON public.order_items;
CREATE POLICY order_items_public_insert
  ON public.order_items
  FOR INSERT
  TO anon
  WITH CHECK (public.order_in_published_store(order_id));

CREATE OR REPLACE FUNCTION public.consume_coupon(_store_id uuid, _code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.coupons c
  SET used_count = c.used_count + 1
  WHERE c.store_id = _store_id
    AND lower(c.code) = lower(trim(_code))
    AND c.is_active = true
    AND EXISTS (
      SELECT 1 FROM public.store_settings s
      WHERE s.id = c.store_id AND s.is_published = true
    );
$$;

REVOKE ALL ON FUNCTION public.consume_coupon(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_coupon(uuid, text) TO anon, authenticated, service_role;