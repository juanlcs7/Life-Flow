create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'personal'
    check (type in ('personal', 'professional')),
  email text,
  phone text,
  role text,
  company text,
  birthday date,
  notes text,
  favorite boolean not null default false,
  last_contact_date date,
  follow_up_date date,
  follow_up_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_user_id_idx
  on public.contacts(user_id);

create index if not exists contacts_user_follow_up_idx
  on public.contacts(user_id, follow_up_date)
  where follow_up_date is not null;

alter table public.contacts enable row level security;

drop policy if exists "Users view own contacts" on public.contacts;
create policy "Users view own contacts"
  on public.contacts for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own contacts" on public.contacts;
create policy "Users insert own contacts"
  on public.contacts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own contacts" on public.contacts;
create policy "Users update own contacts"
  on public.contacts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own contacts" on public.contacts;
create policy "Users delete own contacts"
  on public.contacts for delete
  using (auth.uid() = user_id);
