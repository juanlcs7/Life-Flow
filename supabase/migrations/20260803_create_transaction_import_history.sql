create table if not exists public.transaction_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_type text not null check (file_type in ('csv', 'ofx')),
  transaction_count integer not null check (transaction_count > 0),
  total_income numeric not null default 0 check (total_income >= 0),
  total_expense numeric not null default 0 check (total_expense >= 0),
  status text not null default 'completed' check (status in ('completed', 'undone')),
  imported_at timestamptz not null default now(),
  undone_at timestamptz
);

create table if not exists public.transaction_import_items (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.transaction_imports(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (transaction_id)
);

create index if not exists transaction_imports_user_date_idx
  on public.transaction_imports (user_id, imported_at desc);

create index if not exists transaction_import_items_import_idx
  on public.transaction_import_items (import_id);

alter table public.transaction_imports enable row level security;
alter table public.transaction_import_items enable row level security;

create policy "Users view own transaction imports"
on public.transaction_imports for select
using (auth.uid() = user_id);

create policy "Users create own transaction imports"
on public.transaction_imports for insert
with check (auth.uid() = user_id);

create policy "Users update own transaction imports"
on public.transaction_imports for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users view own transaction import items"
on public.transaction_import_items for select
using (
  exists (
    select 1 from public.transaction_imports
    where transaction_imports.id = transaction_import_items.import_id
      and transaction_imports.user_id = auth.uid()
  )
);

create policy "Users create own transaction import items"
on public.transaction_import_items for insert
with check (
  exists (
    select 1 from public.transaction_imports
    where transaction_imports.id = transaction_import_items.import_id
      and transaction_imports.user_id = auth.uid()
  )
);

