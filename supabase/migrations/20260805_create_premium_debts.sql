-- Premium debt planner. Select remains available to the owner so users never
-- lose access to their data if a subscription expires; writes require Premium.
create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  balance numeric not null check (balance > 0),
  annual_interest_rate numeric not null default 0 check (annual_interest_rate >= 0 and annual_interest_rate <= 500),
  minimum_payment numeric not null check (minimum_payment > 0),
  due_day integer check (due_day between 1 and 31),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists debts_user_id_idx on public.debts(user_id);
alter table public.debts enable row level security;

drop policy if exists "Users view own debts" on public.debts;
create policy "Users view own debts" on public.debts for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Premium users create own debts" on public.debts;
create policy "Premium users create own debts" on public.debts for insert to authenticated
  with check (auth.uid() = user_id and public.is_current_user_premium());

drop policy if exists "Premium users update own debts" on public.debts;
create policy "Premium users update own debts" on public.debts for update to authenticated
  using (auth.uid() = user_id and public.is_current_user_premium())
  with check (auth.uid() = user_id and public.is_current_user_premium());

drop policy if exists "Premium users delete own debts" on public.debts;
create policy "Premium users delete own debts" on public.debts for delete to authenticated
  using (auth.uid() = user_id and public.is_current_user_premium());

drop trigger if exists update_debts_updated_at on public.debts;
create trigger update_debts_updated_at before update on public.debts
  for each row execute function public.handle_updated_at();
