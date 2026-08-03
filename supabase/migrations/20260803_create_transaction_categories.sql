CREATE TABLE public.transaction_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#64748b',
  icon text NOT NULL DEFAULT '📌',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transaction_categories_name_length CHECK (char_length(trim(name)) BETWEEN 2 AND 32),
  CONSTRAINT transaction_categories_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT transaction_categories_icon_length CHECK (char_length(icon) BETWEEN 1 AND 8)
);

CREATE UNIQUE INDEX transaction_categories_user_name_unique
ON public.transaction_categories (user_id, lower(trim(name)));

ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transaction categories"
ON public.transaction_categories FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transaction categories"
ON public.transaction_categories FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transaction categories"
ON public.transaction_categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transaction categories"
ON public.transaction_categories FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_transaction_categories_updated_at
BEFORE UPDATE ON public.transaction_categories
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX transaction_categories_user_id_idx ON public.transaction_categories (user_id);
