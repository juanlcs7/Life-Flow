create table if not exists public.personal_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  event_date date not null,
  event_time time,
  notes text,
  reminder_days_before integer not null default 1 check (reminder_days_before between 0 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_events_user_date_idx
  on public.personal_events(user_id, event_date);

alter table public.personal_events enable row level security;

drop policy if exists "Users can view own personal events" on public.personal_events;
create policy "Users can view own personal events"
  on public.personal_events for select using (auth.uid() = user_id);

drop policy if exists "Users can create own personal events" on public.personal_events;
create policy "Users can create own personal events"
  on public.personal_events for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own personal events" on public.personal_events;
create policy "Users can update own personal events"
  on public.personal_events for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own personal events" on public.personal_events;
create policy "Users can delete own personal events"
  on public.personal_events for delete using (auth.uid() = user_id);

drop trigger if exists update_personal_events_updated_at on public.personal_events;
create trigger update_personal_events_updated_at
  before update on public.personal_events
  for each row execute function public.handle_updated_at();

notify pgrst, 'reload schema';
