CREATE TABLE public.admin_payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payout_id uuid NOT NULL DEFAULT gen_random_uuid(),
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'XOF',
  provider text NOT NULL,
  phone text NOT NULL,
  recipient_name text,
  status text NOT NULL DEFAULT 'pending',
  failure_reason text,
  provider_ref text,
  note text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX admin_payouts_payout_id_key ON public.admin_payouts(payout_id);
CREATE INDEX admin_payouts_created_at_idx ON public.admin_payouts(created_at DESC);

GRANT SELECT ON public.admin_payouts TO authenticated;
GRANT ALL ON public.admin_payouts TO service_role;

ALTER TABLE public.admin_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payouts"
ON public.admin_payouts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_admin_payouts_updated_at
BEFORE UPDATE ON public.admin_payouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();