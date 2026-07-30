CREATE TABLE public.transaction_category_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transaction_category_rules_keyword_not_empty CHECK (char_length(trim(keyword)) > 0),
  CONSTRAINT transaction_category_rules_category_not_empty CHECK (char_length(trim(category)) > 0),
  UNIQUE (user_id, keyword)
);

ALTER TABLE public.transaction_category_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transaction category rules"
ON public.transaction_category_rules FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transaction category rules"
ON public.transaction_category_rules FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transaction category rules"
ON public.transaction_category_rules FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transaction category rules"
ON public.transaction_category_rules FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_transaction_category_rules_updated_at
BEFORE UPDATE ON public.transaction_category_rules
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX transaction_category_rules_user_id_idx
ON public.transaction_category_rules (user_id);
