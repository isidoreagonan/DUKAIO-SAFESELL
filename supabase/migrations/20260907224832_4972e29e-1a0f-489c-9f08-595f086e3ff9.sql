CREATE TABLE public.plan_promo_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percent',
  discount_value numeric NOT NULL DEFAULT 0,
  plan text,
  billing_period text,
  min_amount numeric NOT NULL DEFAULT 0,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  note text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX plan_promo_codes_code_key ON public.plan_promo_codes (upper(code));

GRANT ALL ON public.plan_promo_codes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_promo_codes TO authenticated;

ALTER TABLE public.plan_promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage promo codes"
ON public.plan_promo_codes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_plan_promo_codes_updated_at
BEFORE UPDATE ON public.plan_promo_codes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.subscription_payments
  ADD COLUMN promo_code text,
  ADD COLUMN discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN base_amount numeric;