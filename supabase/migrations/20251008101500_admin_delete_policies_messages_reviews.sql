-- Admin delete policies for contact_messages and reviews
-- Enable RLS (no-op if already enabled)
alter table if exists public.contact_messages enable row level security;
alter table if exists public.reviews enable row level security;

-- Create policies with idempotent guards
-- Approach: create an email-whitelist policy unconditionally; and, if the admins table exists, create a separate admins-based policy.
-- This avoids checking table existence inside policy expressions, which can cause migration issues.

do $$
begin
  -- contact_messages: allow delete by whitelisted email
  if to_regclass('public.contact_messages') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'contact_messages' and policyname = 'contact_messages_delete_admin_email'
    ) then
      execute $$
        create policy contact_messages_delete_admin_email on public.contact_messages
          for delete using (
            coalesce((auth.jwt() ->> 'email'),'') = 'gustavoribeiro4523@gmail.com'
          );
      $$;
    end if;

    -- contact_messages: allow delete by admins table (only if table exists)
    if to_regclass('public.admins') is not null then
      if not exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = 'contact_messages' and policyname = 'contact_messages_delete_admin_table'
      ) then
        execute $$
          create policy contact_messages_delete_admin_table on public.contact_messages
            for delete using (
              exists(select 1 from public.admins a where a.user_id = auth.uid())
            );
        $$;
      end if;
    end if;
  end if;

  -- reviews: allow delete by whitelisted email
  if to_regclass('public.reviews') is not null then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'reviews' and policyname = 'reviews_delete_admin_email'
    ) then
      execute $$
        create policy reviews_delete_admin_email on public.reviews
          for delete using (
            coalesce((auth.jwt() ->> 'email'),'') = 'gustavoribeiro4523@gmail.com'
          );
      $$;
    end if;

    -- reviews: allow delete by admins table (only if table exists)
    if to_regclass('public.admins') is not null then
      if not exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = 'reviews' and policyname = 'reviews_delete_admin_table'
      ) then
        execute $$
          create policy reviews_delete_admin_table on public.reviews
            for delete using (
              exists(select 1 from public.admins a where a.user_id = auth.uid())
            );
        $$;
      end if;
    end if;
  end if;
end$$;
