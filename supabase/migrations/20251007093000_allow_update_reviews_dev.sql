-- DEV-ONLY: Allow public UPDATE on reviews (to toggle featured/verified from frontend during development)
-- WARNING: Replace with admin-only policies for production!

alter table public.reviews enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reviews' and policyname = 'allow_public_update_reviews_dev'
  ) then
    create policy "allow_public_update_reviews_dev" on public.reviews
      for update using (true)
      with check (true);
  end if;
end$$;
