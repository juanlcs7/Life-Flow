ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_documents_tags ON public.documents USING gin (tags);

ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS auto_debit boolean NOT NULL DEFAULT false;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS auto_debit boolean NOT NULL DEFAULT false;