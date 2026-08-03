-- Hotfix for installations that already applied 20260803_harden_financial_core.sql.
create or replace function public.pay_subscription(p_subscription_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  sub public.subscriptions;
  tx_id uuid;
  account_name text;
  v_billing_date date;
begin
  if uid is null then raise exception 'Usuário não autenticado'; end if;

  select * into sub
  from public.subscriptions
  where id = p_subscription_id and user_id = uid
  for update;
  if not found then raise exception 'Assinatura não encontrada'; end if;

  v_billing_date := sub.next_billing_date;
  select sp.transaction_id into tx_id
  from public.subscription_payments sp
  where sp.subscription_id = sub.id
    and sp.billing_date = v_billing_date;
  if found then return tx_id; end if;

  if sub.account_id is not null then
    select name into account_name
    from public.accounts
    where id = sub.account_id and user_id = uid
    for update;
    if not found then raise exception 'Conta não encontrada'; end if;
  end if;

  insert into public.transactions(user_id, type, category, amount, description, date, account_id)
  values(uid, 'expense', sub.category, sub.amount, sub.name || ' (assinatura)', current_date, sub.account_id)
  returning id into tx_id;

  if sub.account_id is not null then
    update public.accounts
    set balance = balance - sub.amount
    where id = sub.account_id and user_id = uid;
  end if;

  insert into public.subscription_payments(subscription_id, user_id, billing_date, amount, transaction_id)
  values(sub.id, uid, v_billing_date, sub.amount, tx_id);

  update public.subscriptions
  set next_billing_date = case sub.frequency
    when 'weekly' then sub.next_billing_date + 7
    when 'yearly' then (sub.next_billing_date + interval '1 year')::date
    else (sub.next_billing_date + interval '1 month')::date
  end
  where id = sub.id and user_id = uid;

  insert into public.history_events(
    user_id, event_type, action, title, description, amount, category,
    account_name, reference_id, reference_type, metadata
  ) values (
    uid, 'finance', 'payment', sub.name, 'Assinatura paga', sub.amount,
    sub.category, account_name, sub.id, 'subscription',
    jsonb_build_object('billing_date', v_billing_date)
  );

  return tx_id;
end;
$$;

revoke execute on function public.pay_subscription(uuid) from public, anon;
grant execute on function public.pay_subscription(uuid) to authenticated;
