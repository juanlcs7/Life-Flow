-- Harden plan fields and make financial mutations atomic/idempotent.

alter table public.installment_payments
  add column if not exists transaction_id uuid references public.transactions(id) on delete set null;

create unique index if not exists installment_payments_transaction_id_key
  on public.installment_payments(transaction_id)
  where transaction_id is not null;

create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  billing_date date not null,
  amount numeric not null check (amount > 0),
  transaction_id uuid references public.transactions(id) on delete set null,
  paid_at timestamptz not null default now(),
  unique (subscription_id, billing_date)
);

alter table public.subscription_payments enable row level security;
drop policy if exists "Users view own subscription payments" on public.subscription_payments;
create policy "Users view own subscription payments"
  on public.subscription_payments for select
  using (auth.uid() = user_id);

-- Browser clients may edit profile presentation fields, never billing state.
create or replace function public.protect_profile_billing_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' then
    new.is_premium := old.is_premium;
    new.premium_until := old.premium_until;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_billing_fields on public.profiles;
create trigger protect_profile_billing_fields
  before update on public.profiles
  for each row execute function public.protect_profile_billing_fields();

revoke execute on function public.protect_profile_billing_fields() from public, anon, authenticated;

create or replace function public.is_current_user_premium()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select is_premium and (premium_until is null or premium_until >= now())
    from public.profiles where user_id = auth.uid()
  ), false)
$$;

revoke execute on function public.is_current_user_premium() from public, anon;
grant execute on function public.is_current_user_premium() to authenticated;

create or replace function public.enforce_free_transaction_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id = auth.uid() and not public.is_current_user_premium() and (
    select count(*) from public.transactions
    where user_id = new.user_id
      and date >= date_trunc('month', new.date)::date
      and date < (date_trunc('month', new.date) + interval '1 month')::date
  ) >= 5 then
    raise exception 'Plano gratuito permite 5 transações por mês' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_free_transaction_limit on public.transactions;
create trigger enforce_free_transaction_limit
  before insert on public.transactions
  for each row execute function public.enforce_free_transaction_limit();

create or replace function public.enforce_free_investment_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id = auth.uid() and not public.is_current_user_premium() and (
    select count(*) from public.investments where user_id = new.user_id
  ) >= 2 then
    raise exception 'Plano gratuito permite 2 investimentos' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_free_investment_limit on public.investments;
create trigger enforce_free_investment_limit
  before insert on public.investments
  for each row execute function public.enforce_free_investment_limit();

create or replace function public.enforce_free_goal_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  goal_count integer;
begin
  if new.user_id = auth.uid() and not public.is_current_user_premium() then
    select
      (select count(*) from public.goals where user_id = new.user_id) +
      (select count(*) from public.financial_goals where user_id = new.user_id)
    into goal_count;
    if goal_count >= 3 then
      raise exception 'Plano gratuito permite 3 metas ativas' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_free_goal_limit_goals on public.goals;
create trigger enforce_free_goal_limit_goals before insert on public.goals
  for each row execute function public.enforce_free_goal_limit();
drop trigger if exists enforce_free_goal_limit_financial on public.financial_goals;
create trigger enforce_free_goal_limit_financial before insert on public.financial_goals
  for each row execute function public.enforce_free_goal_limit();
revoke execute on function public.enforce_free_transaction_limit() from public, anon, authenticated;
revoke execute on function public.enforce_free_investment_limit() from public, anon, authenticated;
revoke execute on function public.enforce_free_goal_limit() from public, anon, authenticated;

create or replace function public.create_financial_transaction(
  p_type text, p_category text, p_amount numeric, p_description text,
  p_date date, p_account_id uuid default null
)
returns public.transactions
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  created public.transactions;
  account_name text;
begin
  if uid is null then raise exception 'Usuário não autenticado'; end if;
  if p_type not in ('income', 'expense') or p_amount <= 0 then
    raise exception 'Transação inválida';
  end if;
  if p_account_id is not null then
    select name into account_name from public.accounts
    where id = p_account_id and user_id = uid for update;
    if not found then raise exception 'Conta não encontrada'; end if;
  end if;
  insert into public.transactions(user_id, type, category, amount, description, date, account_id)
  values(uid, p_type, p_category, p_amount, p_description, p_date, p_account_id)
  returning * into created;
  if p_account_id is not null then
    update public.accounts set balance = balance + case when p_type = 'income' then p_amount else -p_amount end
    where id = p_account_id and user_id = uid;
  end if;
  insert into public.history_events(user_id, event_type, action, title, description, amount, category, account_name, reference_id, reference_type, metadata)
  values(uid, 'finance', 'create', p_description,
    case when p_type = 'income' then 'Nova receita registrada' else 'Nova despesa registrada' end,
    p_amount, p_category, account_name, created.id, 'transaction', jsonb_build_object('type', p_type));
  return created;
end;
$$;

create or replace function public.update_financial_transaction(
  p_id uuid, p_type text, p_category text, p_amount numeric, p_description text,
  p_date date, p_account_id uuid default null
)
returns public.transactions
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid(); old_tx public.transactions; updated public.transactions; account_name text;
begin
  select * into old_tx from public.transactions where id = p_id and user_id = uid for update;
  if not found then raise exception 'Transação não encontrada'; end if;
  if p_type not in ('income', 'expense') or p_amount <= 0 then raise exception 'Transação inválida'; end if;
  if old_tx.account_id is not null then
    update public.accounts set balance = balance - case when old_tx.type = 'income' then old_tx.amount else -old_tx.amount end
    where id = old_tx.account_id and user_id = uid;
  end if;
  if p_account_id is not null then
    select name into account_name from public.accounts where id = p_account_id and user_id = uid for update;
    if not found then raise exception 'Conta não encontrada'; end if;
    update public.accounts set balance = balance + case when p_type = 'income' then p_amount else -p_amount end
    where id = p_account_id and user_id = uid;
  end if;
  update public.transactions set type=p_type, category=p_category, amount=p_amount,
    description=p_description, date=p_date, account_id=p_account_id
  where id=p_id and user_id=uid returning * into updated;
  insert into public.history_events(user_id,event_type,action,title,description,amount,category,account_name,reference_id,reference_type,metadata)
  values(uid,'finance','update',p_description,'Transação editada',p_amount,p_category,account_name,p_id,'transaction',jsonb_build_object('type',p_type));
  return updated;
end;
$$;

create or replace function public.delete_financial_transaction(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare uid uuid := auth.uid(); old_tx public.transactions; account_name text;
begin
  select * into old_tx from public.transactions where id=p_id and user_id=uid for update;
  if not found then raise exception 'Transação não encontrada'; end if;
  if old_tx.account_id is not null then
    select name into account_name from public.accounts where id=old_tx.account_id and user_id=uid for update;
    update public.accounts set balance = balance - case when old_tx.type='income' then old_tx.amount else -old_tx.amount end
    where id=old_tx.account_id and user_id=uid;
  end if;
  insert into public.history_events(user_id,event_type,action,title,description,amount,category,account_name,reference_id,reference_type,metadata)
  values(uid,'finance','delete',old_tx.description,'Transação excluída',old_tx.amount,old_tx.category,account_name,p_id,'transaction',jsonb_build_object('type',old_tx.type));
  delete from public.transactions where id=p_id and user_id=uid;
end;
$$;

create or replace function public.set_installment_payment_status(p_payment_id uuid, p_paid boolean)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid(); pay public.installment_payments; inst public.installments;
  tx_id uuid; account_name text;
begin
  select p.* into pay from public.installment_payments p join public.installments i on i.id=p.installment_id
  where p.id=p_payment_id and i.user_id=uid for update of p;
  if not found then raise exception 'Parcela não encontrada'; end if;
  select * into inst from public.installments where id=pay.installment_id and user_id=uid;
  if p_paid and pay.paid then return pay.transaction_id; end if;
  if not p_paid and not pay.paid then return null; end if;
  if inst.account_id is not null then
    select name into account_name from public.accounts where id=inst.account_id and user_id=uid for update;
  end if;
  if p_paid then
    insert into public.transactions(user_id,type,category,amount,description,date,account_id)
    values(uid,'expense',inst.category,pay.amount,inst.description||' ('||pay.payment_number||'/'||inst.installment_count||')',current_date,inst.account_id)
    returning id into tx_id;
    if inst.account_id is not null then update public.accounts set balance=balance-pay.amount where id=inst.account_id and user_id=uid; end if;
    update public.installment_payments set paid=true,paid_date=current_date,transaction_id=tx_id where id=p_payment_id;
    insert into public.history_events(user_id,event_type,action,title,description,amount,category,account_name,reference_id,reference_type,metadata)
    values(uid,'finance','payment',inst.description||' ('||pay.payment_number||'/'||inst.installment_count||')','Parcela paga',pay.amount,inst.category,account_name,p_payment_id,'installment_payment',jsonb_build_object('installment_id',inst.id,'payment_number',pay.payment_number));
    return tx_id;
  end if;
  tx_id := pay.transaction_id;
  if tx_id is not null then delete from public.transactions where id=tx_id and user_id=uid; end if;
  if inst.account_id is not null then update public.accounts set balance=balance+pay.amount where id=inst.account_id and user_id=uid; end if;
  update public.installment_payments set paid=false,paid_date=null,transaction_id=null where id=p_payment_id;
  insert into public.history_events(user_id,event_type,action,title,description,amount,category,account_name,reference_id,reference_type,metadata)
  values(uid,'finance','refund',inst.description||' ('||pay.payment_number||'/'||inst.installment_count||')','Pagamento de parcela estornado',pay.amount,inst.category,account_name,p_payment_id,'installment_payment',jsonb_build_object('installment_id',inst.id,'payment_number',pay.payment_number));
  return null;
end;
$$;

create or replace function public.pay_subscription(p_subscription_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare uid uuid:=auth.uid(); sub public.subscriptions; tx_id uuid; account_name text; billing_date date;
begin
  select * into sub from public.subscriptions where id=p_subscription_id and user_id=uid for update;
  if not found then raise exception 'Assinatura não encontrada'; end if;
  billing_date := sub.next_billing_date;
  select transaction_id into tx_id from public.subscription_payments where subscription_id=sub.id and billing_date=billing_date;
  if found then return tx_id; end if;
  if sub.account_id is not null then
    select name into account_name from public.accounts where id=sub.account_id and user_id=uid for update;
    if not found then raise exception 'Conta não encontrada'; end if;
  end if;
  insert into public.transactions(user_id,type,category,amount,description,date,account_id)
  values(uid,'expense',sub.category,sub.amount,sub.name||' (assinatura)',current_date,sub.account_id) returning id into tx_id;
  if sub.account_id is not null then update public.accounts set balance=balance-sub.amount where id=sub.account_id and user_id=uid; end if;
  insert into public.subscription_payments(subscription_id,user_id,billing_date,amount,transaction_id)
  values(sub.id,uid,billing_date,sub.amount,tx_id);
  update public.subscriptions set next_billing_date = case sub.frequency
    when 'weekly' then sub.next_billing_date + 7
    when 'yearly' then (sub.next_billing_date + interval '1 year')::date
    else (sub.next_billing_date + interval '1 month')::date end where id=sub.id;
  insert into public.history_events(user_id,event_type,action,title,description,amount,category,account_name,reference_id,reference_type,metadata)
  values(uid,'finance','payment',sub.name,'Assinatura paga',sub.amount,sub.category,account_name,sub.id,'subscription',jsonb_build_object('billing_date',billing_date));
  return tx_id;
end;
$$;

grant execute on function public.create_financial_transaction(text,text,numeric,text,date,uuid) to authenticated;
grant execute on function public.update_financial_transaction(uuid,text,text,numeric,text,date,uuid) to authenticated;
grant execute on function public.delete_financial_transaction(uuid) to authenticated;
grant execute on function public.set_installment_payment_status(uuid,boolean) to authenticated;
grant execute on function public.pay_subscription(uuid) to authenticated;

-- Automatic debits run in the database, independent of app visits. Each row is
-- locked and linked to a unique payment record so retries are harmless.
create or replace function public.process_due_auto_debits()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare item record; processed integer:=0; tx_id uuid;
begin
  for item in
    select p.id from public.installment_payments p join public.installments i on i.id=p.installment_id
    where not p.paid and p.due_date<=current_date and i.auto_debit and i.account_id is not null
    for update of p skip locked
  loop
    perform set_config('request.jwt.claim.sub',(select i.user_id::text from public.installment_payments p join public.installments i on i.id=p.installment_id where p.id=item.id),true);
    perform public.set_installment_payment_status(item.id,true);
    processed:=processed+1;
  end loop;
  for item in
    select id,user_id from public.subscriptions
    where active and auto_debit and account_id is not null and next_billing_date<=current_date
    for update skip locked
  loop
    perform set_config('request.jwt.claim.sub',item.user_id::text,true);
    perform public.pay_subscription(item.id);
    processed:=processed+1;
  end loop;
  return processed;
end;
$$;

revoke execute on function public.process_due_auto_debits() from public, anon, authenticated;
grant execute on function public.process_due_auto_debits() to service_role;

create extension if not exists pg_cron with schema extensions;
do $$
begin
  if not exists (select 1 from cron.job where jobname='lifeflow-auto-debits') then
    perform cron.schedule('lifeflow-auto-debits','15 3 * * *','select public.process_due_auto_debits();');
  end if;
end $$;
