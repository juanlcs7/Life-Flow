
ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS yield_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS yield_period text NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS last_yield_date date NOT NULL DEFAULT CURRENT_DATE;
