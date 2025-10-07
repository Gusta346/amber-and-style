-- Create contact_messages table to store "Contato" form submissions
-- Note: Uses anon-key on frontend; we allow public INSERT and (for now) public SELECT so the admin dashboard can read without server
-- For production, consider restricting SELECT to admins only.

-- Enable pgcrypto for gen_random_uuid if not already
create extension if not exists pgcrypto;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text,
  email text,
  phone text,
  subject text,
  message text,
  status text default 'new'
);

-- RLS
alter table public.contact_messages enable row level security;

-- Allow anyone to insert a message (no auth required)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'contact_messages' and policyname = 'allow_insert_contact_messages'
  ) then
    create policy "allow_insert_contact_messages" on public.contact_messages
      for insert
      with check (true);
  end if;
end$$;

-- Allow public select (dev-friendly). For production, replace with an admin-only policy.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'contact_messages' and policyname = 'allow_select_contact_messages_public'
  ) then
    create policy "allow_select_contact_messages_public" on public.contact_messages
      for select
      using (true);
  end if;
end$$;

-- Optional: Admin-only update/delete (if you add admin users via Supabase auth)
-- create policy "allow_admin_update_contact_messages" on public.contact_messages
--   for update using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
--   with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));
-- create policy "allow_admin_delete_contact_messages" on public.contact_messages
--   for delete using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

create index if not exists idx_contact_messages_created_at on public.contact_messages (created_at desc);
