alter table public.tasks
  add column if not exists contact_id uuid references public.contacts(id) on delete set null,
  add column if not exists source text not null default 'manual';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tasks_source_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_source_check
      check (source in ('manual', 'contact_follow_up'));
  end if;
end
$$;

create index if not exists tasks_contact_id_idx
  on public.tasks(contact_id)
  where contact_id is not null;
