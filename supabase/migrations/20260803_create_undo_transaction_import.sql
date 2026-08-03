drop policy if exists "Users create own transaction import items"
on public.transaction_import_items;

create policy "Users create own transaction import items"
on public.transaction_import_items for insert
with check (
  exists (
    select 1 from public.transaction_imports
    where transaction_imports.id = transaction_import_items.import_id
      and transaction_imports.user_id = auth.uid()
  )
  and exists (
    select 1 from public.transactions
    where transactions.id = transaction_import_items.transaction_id
      and transactions.user_id = auth.uid()
  )
);

create or replace function public.undo_transaction_import(p_import_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_file_name text;
  v_status text;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  select file_name, status
    into v_file_name, v_status
  from public.transaction_imports
  where id = p_import_id
    and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Importação não encontrada';
  end if;

  if v_status = 'undone' then
    raise exception 'Esta importação já foi desfeita';
  end if;

  select count(*)::integer
    into v_count
  from public.transaction_import_items item
  join public.transactions txn on txn.id = item.transaction_id
  where item.import_id = p_import_id
    and txn.user_id = v_user_id;

  if v_count = 0 then
    raise exception 'Nenhuma transação ativa foi encontrada para esta importação';
  end if;

  with account_deltas as (
    select
      txn.account_id,
      sum(
        case
          when txn.type = 'income' then -txn.amount
          else txn.amount
        end
      ) as balance_change
    from public.transaction_import_items item
    join public.transactions txn on txn.id = item.transaction_id
    where item.import_id = p_import_id
      and txn.user_id = v_user_id
      and txn.account_id is not null
    group by txn.account_id
  )
  update public.accounts account
  set
    balance = account.balance + account_deltas.balance_change,
    updated_at = now()
  from account_deltas
  where account.id = account_deltas.account_id
    and account.user_id = v_user_id;

  delete from public.transactions txn
  using public.transaction_import_items item
  where item.import_id = p_import_id
    and txn.id = item.transaction_id
    and txn.user_id = v_user_id;

  update public.transaction_imports
  set status = 'undone', undone_at = now()
  where id = p_import_id
    and user_id = v_user_id;

  insert into public.history_events (
    user_id,
    event_type,
    action,
    title,
    description,
    reference_id,
    reference_type,
    metadata
  ) values (
    v_user_id,
    'finance',
    'delete',
    v_file_name,
    'Importação desfeita pelo histórico',
    p_import_id,
    'transaction_import',
    jsonb_build_object('transaction_count', v_count)
  );

  return v_count;
end;
$$;

revoke all on function public.undo_transaction_import(uuid) from public;
grant execute on function public.undo_transaction_import(uuid) to authenticated;
