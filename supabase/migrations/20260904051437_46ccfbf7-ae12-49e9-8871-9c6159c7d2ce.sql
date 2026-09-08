ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'scheduled';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'shipping';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'unreachable';