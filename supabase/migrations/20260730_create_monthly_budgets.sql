create table if not exists public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  amount numeric not null check (amount > 0),
  month date not null check (month = date_trunc('month', month)::date),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category, month)
);

alter table public.monthly_budgets enable row level security;

create policy "Users view own monthly budgets"
on public.monthly_budgets for select
using (auth.uid() = user_id);

create policy "Users create own monthly budgets"
on public.monthly_budgets for insert
with check (auth.uid() = user_id);

create policy "Users update own monthly budgets"
on public.monthly_budgets for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users delete own monthly budgets"
on public.monthly_budgets for delete
using (auth.uid() = user_id);
