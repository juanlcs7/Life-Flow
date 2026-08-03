create table if not exists public.budget_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_id uuid not null references public.monthly_budgets(id) on delete cascade,
  alert_level integer not null check (alert_level in (80, 100)),
  spent_amount numeric not null check (spent_amount >= 0),
  budget_amount numeric not null check (budget_amount > 0),
  created_at timestamptz not null default now(),
  unique (budget_id, alert_level)
);

create index if not exists budget_alerts_user_date_idx
  on public.budget_alerts (user_id, created_at desc);

alter table public.budget_alerts enable row level security;

create policy "Users view own budget alerts"
on public.budget_alerts for select
using (auth.uid() = user_id);

create or replace function public.claim_budget_alert(
  p_budget_id uuid,
  p_alert_level integer,
  p_spent_amount numeric,
  p_budget_amount numeric
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  if p_alert_level not in (80, 100) then
    raise exception 'Nível de alerta inválido';
  end if;

  insert into public.budget_alerts (
    user_id,
    budget_id,
    alert_level,
    spent_amount,
    budget_amount
  )
  select
    auth.uid(),
    budget.id,
    p_alert_level,
    p_spent_amount,
    p_budget_amount
  from public.monthly_budgets budget
  where budget.id = p_budget_id
    and budget.user_id = auth.uid()
  on conflict (budget_id, alert_level) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted = 1;
end;
$$;

revoke all on function public.claim_budget_alert(uuid, integer, numeric, numeric) from public;
grant execute on function public.claim_budget_alert(uuid, integer, numeric, numeric) to authenticated;

create or replace function public.reset_budget_alerts_after_limit_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.amount is distinct from new.amount then
    delete from public.budget_alerts where budget_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists reset_budget_alerts_on_limit_change on public.monthly_budgets;
create trigger reset_budget_alerts_on_limit_change
after update of amount on public.monthly_budgets
for each row execute function public.reset_budget_alerts_after_limit_change();

