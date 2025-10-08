-- Optional RLS: users can only see their own bookings (keep admins able to see all via existing admin policies)
-- This assumes RLS is enabled on public.bookings
alter table public.bookings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_select_own'
  ) then
    create policy bookings_select_own on public.bookings
      for select using (
        -- allow admins (if you have an admin role check elsewhere) or own rows by user_id
        (user_id is not null and auth.uid() = user_id)
      );
  end if;

  -- Admin bypass for SELECT (if admins table exists)
  if to_regclass('public.admins') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_select_admin'
    ) then
      create policy bookings_select_admin on public.bookings
        for select using (exists(select 1 from public.admins a where a.user_id = auth.uid()));
    end if;
  end if;

  -- INSERT: user can create only their own booking row
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_insert_self'
  ) then
    create policy bookings_insert_self on public.bookings
      for insert with check (auth.uid() = user_id);
  end if;

  -- UPDATE: user can update own rows
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_update_self'
  ) then
    create policy bookings_update_self on public.bookings
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  -- UPDATE: admin can update any row (if admins table exists)
  if to_regclass('public.admins') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_update_admin'
    ) then
      create policy bookings_update_admin on public.bookings
        for update using (exists(select 1 from public.admins a where a.user_id = auth.uid())) with check (true);
    end if;
  end if;

  -- DELETE: user can delete own rows
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_delete_self'
  ) then
    create policy bookings_delete_self on public.bookings
      for delete using (auth.uid() = user_id);
  end if;

  -- DELETE: admin can delete any row (if admins table exists)
  if to_regclass('public.admins') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_delete_admin'
    ) then
      create policy bookings_delete_admin on public.bookings
        for delete using (exists(select 1 from public.admins a where a.user_id = auth.uid()));
    end if;
  end if;
end$$;

-- Note: Keep existing dev/admin update policies as configured. In production, add proper admin bypass.