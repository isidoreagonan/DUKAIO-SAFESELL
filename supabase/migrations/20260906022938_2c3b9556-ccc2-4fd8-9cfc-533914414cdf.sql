CREATE TABLE public.discovery_jobs (
  key text NOT NULL PRIMARY KEY,
  status text NOT NULL DEFAULT 'idle',
  paused_reason text,
  lease_until timestamp with time zone,
  last_run_at timestamp with time zone,
  last_found integer NOT NULL DEFAULT 0,
  last_inserted integer NOT NULL DEFAULT 0,
  last_error text,
  runs integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.discovery_jobs TO authenticated;
GRANT ALL ON public.discovery_jobs TO service_role;

ALTER TABLE public.discovery_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read discovery jobs"
ON public.discovery_jobs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.discovery_jobs (key) VALUES ('discovery-ads') ON CONFLICT (key) DO NOTHING;