-- Migration: create barber_day_blocks to allow admins to block a barber for a full day

-- Ensure pgcrypto for gen_random_uuid (id generation)
create extension if not exists pgcrypto;

create table if not exists public.barber_day_blocks (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.team_members(id) on delete cascade,
  block_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (barber_id, block_date)
);

alter table public.barber_day_blocks enable row level security;

-- Public can read (frontend needs to know blocked days)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'barber_day_blocks' and policyname = 'barber_day_blocks_select_public'
  ) then
    execute 'create policy barber_day_blocks_select_public on public.barber_day_blocks for select using (true)';
  end if;
end$$;

-- Admins can insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='barber_day_blocks' AND policyname='barber_day_blocks_insert_admin'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY barber_day_blocks_insert_admin ON public.barber_day_blocks
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid())
      )
    $policy$;
  END IF;
END$$;

-- Admins can delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='barber_day_blocks' AND policyname='barber_day_blocks_delete_admin'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY barber_day_blocks_delete_admin ON public.barber_day_blocks
      FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid())
      )
    $policy$;
  END IF;
END$$;
