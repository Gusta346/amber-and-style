-- Ensure subscribers can view their own row by email (case-insensitive)
do $$
begin
  -- Create table if for some reason it's not present (no-op if exists)
  perform 1 from pg_class where relname = 'subscribers' and relnamespace = 'public'::regnamespace;
  if not found then
    raise notice 'Table public.subscribers not found; skipping policy creation.';
    return;
  end if;

  -- Drop old policy if it exists (to replace with case-insensitive version)
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'subscribers' and policyname = 'Subscriber can view own subscription'
  ) then
    execute 'drop policy "Subscriber can view own subscription" on public.subscribers';
  end if;

  -- Create updated policy using lower(email) = lower(jwt email)
  create policy "Subscriber can view own subscription"
    on public.subscribers for select using (
      (auth.jwt() ->> 'email') is not null and lower((auth.jwt() ->> 'email')) = lower(email)
    );
end $$;
