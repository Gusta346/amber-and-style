-- Migration: Enable RLS and policies for service_combos (public read, admin write)
-- Purpose: Avoid "Anyone with anon key can modify/delete combos" by enforcing RLS

DO $$
BEGIN
  -- Ensure table exists
  IF to_regclass('public.service_combos') IS NULL THEN
    RAISE NOTICE 'Table public.service_combos does not exist, skipping RLS setup.';
    RETURN;
  END IF;

  -- Enable RLS (idempotent)
  BEGIN
    EXECUTE 'ALTER TABLE public.service_combos ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN others THEN
    -- ignore if already enabled
    NULL;
  END;

  -- Public SELECT policy (display-only combos)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'service_combos' AND policyname = 'Service combos are viewable by everyone'
  ) THEN
    EXECUTE 'CREATE POLICY "Service combos are viewable by everyone" ON public.service_combos FOR SELECT USING (true)';
  END IF;

  -- Admin-only write policies, only if admins table exists
  IF to_regclass('public.admins') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'service_combos' AND policyname = 'service_combos_insert_admin'
    ) THEN
      EXECUTE 'CREATE POLICY service_combos_insert_admin ON public.service_combos FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid()))';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'service_combos' AND policyname = 'service_combos_update_admin'
    ) THEN
      EXECUTE 'CREATE POLICY service_combos_update_admin ON public.service_combos FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid()))';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'service_combos' AND policyname = 'service_combos_delete_admin'
    ) THEN
      EXECUTE 'CREATE POLICY service_combos_delete_admin ON public.service_combos FOR DELETE USING (EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid()))';
    END IF;
  END IF;
END
$$;