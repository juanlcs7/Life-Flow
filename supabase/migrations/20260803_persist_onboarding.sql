-- Persist onboarding state across browsers and devices.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'onboarding_completed_at'
  ) then
    alter table public.profiles add column onboarding_completed_at timestamptz;

    -- Existing accounts should not be forced through a new-user flow.
    update public.profiles set onboarding_completed_at = now();
  end if;
end;
$$;

comment on column public.profiles.onboarding_completed_at is
  'Null for new accounts until the welcome onboarding is completed.';
