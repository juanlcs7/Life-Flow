
-- 1) Premium flag on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_until timestamptz;

-- 2) Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  folder text NOT NULL DEFAULT 'Geral',
  file_path text NOT NULL,
  mime_type text,
  size_bytes bigint NOT NULL DEFAULT 0,
  expiry_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own documents"
  ON public.documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own documents"
  ON public.documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own documents"
  ON public.documents FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own documents"
  ON public.documents FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents(user_id);

-- 3) Market rates (CDI, Selic, IPCA, Poupanca) — public read
CREATE TABLE IF NOT EXISTS public.market_rates (
  code text PRIMARY KEY,
  name text NOT NULL,
  value numeric NOT NULL,
  period text NOT NULL,
  source text,
  reference_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.market_rates TO anon, authenticated;
GRANT ALL ON public.market_rates TO service_role;

ALTER TABLE public.market_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read market rates"
  ON public.market_rates FOR SELECT
  USING (true);
-- writes only via service role (no policy for anon/authenticated)

-- Seed initial fallback values so UI works before the edge function runs
INSERT INTO public.market_rates (code, name, value, period, source, reference_date)
VALUES
  ('CDI',      'CDI',                10.65, 'yearly', 'fallback', CURRENT_DATE),
  ('SELIC',    'Selic Meta',         10.75, 'yearly', 'fallback', CURRENT_DATE),
  ('IPCA',     'IPCA (12m)',          4.50, 'yearly', 'fallback', CURRENT_DATE),
  ('POUPANCA', 'Poupança (estim.)',   6.17, 'yearly', 'fallback', CURRENT_DATE)
ON CONFLICT (code) DO NOTHING;
