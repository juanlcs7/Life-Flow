-- Garante que a tabela de tarefas suporte recorrência e vínculo com contatos.
-- A migração é idempotente e não remove tarefas existentes.

alter table public.tasks
  add column if not exists recurrence text not null default 'none',
  add column if not exists recurrence_generated boolean not null default false,
  add column if not exists contact_id uuid references public.contacts(id) on delete set null,
  add column if not exists source text not null default 'manual';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_recurrence_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_recurrence_check
      check (recurrence in ('none', 'daily', 'weekly', 'monthly'));
  end if;

  if not exists (
    select 1
    from pg_constraint
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

notify pgrst, 'reload schema';
