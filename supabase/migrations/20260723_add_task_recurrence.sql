alter table public.tasks
  add column if not exists recurrence text not null default 'none',
  add column if not exists recurrence_generated boolean not null default false;

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
end
$$;

comment on column public.tasks.recurrence is
  'Frequência da tarefa: none, daily, weekly ou monthly.';

comment on column public.tasks.recurrence_generated is
  'Indica se esta ocorrência já gerou a próxima tarefa recorrente.';
