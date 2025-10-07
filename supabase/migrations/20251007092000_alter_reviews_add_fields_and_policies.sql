-- Add fields to reviews and allow public insert for customer submissions
create extension if not exists pgcrypto;

-- Add new columns if not present
alter table public.reviews
  add column if not exists client_phone text,
  add column if not exists booking_id uuid references public.bookings(id) on delete set null,
  add column if not exists featured boolean default false;

-- Ensure RLS is enabled
alter table public.reviews enable row level security;

-- Allow public to insert reviews (anonymous customers)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reviews' and policyname = 'allow_public_insert_reviews'
  ) then
    create policy "allow_public_insert_reviews" on public.reviews
      for insert with check (true);
  end if;
end$$;

-- Indexes for performance
create index if not exists idx_reviews_created_at on public.reviews (created_at desc);
create index if not exists idx_reviews_booking_id on public.reviews (booking_id);
create index if not exists idx_reviews_featured on public.reviews (featured);
