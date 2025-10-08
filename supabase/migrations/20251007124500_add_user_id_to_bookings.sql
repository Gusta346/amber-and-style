-- Link bookings to auth users
alter table public.bookings add column if not exists user_id uuid;
create index if not exists idx_bookings_user_id on public.bookings(user_id);

-- Optional: backfill could be added here if you had historical mapping