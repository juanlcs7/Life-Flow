-- Existing transactions are considered reviewed. New imported/automated
-- transactions remain pending until the user confirms them in the inbox.
alter table public.transactions
  add column if not exists reviewed_at timestamptz;

update public.transactions
set reviewed_at = coalesce(created_at, now())
where reviewed_at is null;

create index if not exists transactions_pending_review_idx
  on public.transactions(user_id, created_at desc)
  where reviewed_at is null;
