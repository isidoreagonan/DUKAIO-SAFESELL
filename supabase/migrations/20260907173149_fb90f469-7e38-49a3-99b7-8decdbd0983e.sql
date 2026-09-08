CREATE TABLE public.ai_engine_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  text_engine text NOT NULL DEFAULT 'kie' CHECK (text_engine IN ('kie','gemini')),
  image_engine text NOT NULL DEFAULT 'kie' CHECK (image_engine IN ('kie','gemini')),
  fallback_to_kie boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_engine_settings TO service_role;
ALTER TABLE public.ai_engine_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.ai_engine_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;