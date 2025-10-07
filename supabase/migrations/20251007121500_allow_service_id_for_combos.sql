-- Allow bookings.service_id to reference either services or service_combos by removing the strict FK to services
-- This keeps existing data and policies intact while enabling combo IDs to be stored in service_id

do $$
begin
  -- Drop FK if it exists (default name usually bookings_service_id_fkey)
  if exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname = 'bookings' and c.conname = 'bookings_service_id_fkey'
  ) then
    alter table public.bookings drop constraint bookings_service_id_fkey;
  end if;
end$$;

-- Optionally, you could add a CHECK or trigger to ensure the id exists in either table in production