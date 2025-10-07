-- DEV-ONLY: Allow public UPDATE on contact_messages (so admin dashboard can mark as read using anon key)
-- WARNING: Do NOT use in production. Replace with admin-only policies when ready.

alter table public.contact_messages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'contact_messages' and policyname = 'allow_public_update_contact_messages_dev'
  ) then
    create policy "allow_public_update_contact_messages_dev" on public.contact_messages
      for update using (true)
      with check (true);
  end if;
end$$;
