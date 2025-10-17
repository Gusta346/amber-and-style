-- Migration: create subscribers table for managing in-person subscriptions
-- Purpose: allow admins to register subscribers by email, attach a plan, and manage status/notes

-- Create table if not exists
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  phone text,
  plan_id uuid references public.subscription_plans(id) on delete set null,
  status text not null default 'active' check (status in ('active','inactive','paused')),
  start_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.subscribers enable row level security;

-- Timestamps trigger
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

drop trigger if exists update_subscribers_updated_at on public.subscribers;
create trigger update_subscribers_updated_at before update on public.subscribers
for each row execute function public.update_updated_at_column();

-- Policies: admins only (via public.admins)
do $$
begin
  -- Clean any existing policies with same names
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'subscribers'
  ) then
    -- no-op, we'll create distinct names guarded by IF NOT EXISTS
  end if;

  -- SELECT/INSERT/UPDATE/DELETE policies: only if admins table exists
  if to_regclass('public.admins') is not null then
    -- SELECT policy
    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = 'subscribers' and policyname = 'Admins can view subscribers'
    ) then
      create policy "Admins can view subscribers"
        on public.subscribers for select using (
          exists(select 1 from public.admins a where a.user_id = auth.uid())
        );
    end if;

    -- INSERT policy
    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = 'subscribers' and policyname = 'Admins can insert subscribers'
    ) then
      create policy "Admins can insert subscribers"
        on public.subscribers for insert with check (
          exists(select 1 from public.admins a where a.user_id = auth.uid())
        );
    end if;

    -- UPDATE policy
    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = 'subscribers' and policyname = 'Admins can update subscribers'
    ) then
      create policy "Admins can update subscribers"
        on public.subscribers for update using (
          exists(select 1 from public.admins a where a.user_id = auth.uid())
        ) with check (
          exists(select 1 from public.admins a where a.user_id = auth.uid())
        );
    end if;

    -- DELETE policy
    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = 'subscribers' and policyname = 'Admins can delete subscribers'
    ) then
      create policy "Admins can delete subscribers"
        on public.subscribers for delete using (
          exists(select 1 from public.admins a where a.user_id = auth.uid())
        );
    end if;
  end if;

  -- Also allow the subscriber to view their own row by email (non-admins)
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'subscribers' and policyname = 'Subscriber can view own subscription'
  ) then
    create policy "Subscriber can view own subscription"
      on public.subscribers for select using (
        (auth.jwt() ->> 'email') is not null and (auth.jwt() ->> 'email') = email
      );
  else
    -- Fallback: allow authenticated users with a specific email domain (optional). For now, deny by default.
    null;
  end if;
end $$;
