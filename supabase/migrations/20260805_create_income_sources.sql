-- Recurring income is available to every authenticated LifeFlow user.
create table if not exists public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  name text not null check (char_length(trim(name)) between 1 and 100),
  amount numeric not null check (amount > 0),
  payment_day integer not null check (payment_day between 1 and 31),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists income_sources_user_id_idx on public.income_sources(user_id);
alter table public.income_sources enable row level security;

drop policy if exists "Users view own income sources" on public.income_sources;
create policy "Users view own income sources" on public.income_sources for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users create own income sources" on public.income_sources;
create policy "Users create own income sources" on public.income_sources for insert to authenticated
  with check (
    auth.uid() = user_id
    and (account_id is null or exists (
      select 1 from public.accounts where accounts.id = account_id and accounts.user_id = auth.uid()
    ))
  );

drop policy if exists "Users update own income sources" on public.income_sources;
create policy "Users update own income sources" on public.income_sources for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (account_id is null or exists (
      select 1 from public.accounts where accounts.id = account_id and accounts.user_id = auth.uid()
    ))
  );

drop policy if exists "Users delete own income sources" on public.income_sources;
create policy "Users delete own income sources" on public.income_sources for delete to authenticated
  using (auth.uid() = user_id);

drop trigger if exists update_income_sources_updated_at on public.income_sources;
create trigger update_income_sources_updated_at before update on public.income_sources
  for each row execute function public.handle_updated_at();
