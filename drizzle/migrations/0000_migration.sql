CREATE TABLE public.tujitos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_name text NOT NULL,
  recipient_phone text NOT NULL DEFAULT '',
  occasion text NOT NULL,
  opened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tujito_greetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tujito_id uuid NOT NULL REFERENCES public.tujitos(id) ON DELETE CASCADE,
  from_name text,
  kind text NOT NULL DEFAULT 'text',
  message text,
  media_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tujito_greetings_tujito_id_idx ON public.tujito_greetings(tujito_id);

GRANT ALL ON public.tujitos TO service_role;
GRANT ALL ON public.tujito_greetings TO service_role;

ALTER TABLE public.tujitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tujito_greetings ENABLE ROW LEVEL SECURITY;
-- No policies: all access goes through server code that only exposes a Tujito to people holding its link.