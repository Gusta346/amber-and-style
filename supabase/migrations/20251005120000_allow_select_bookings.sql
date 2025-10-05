-- Migration: allow public SELECT on bookings so frontend can read availability
BEGIN;

-- Ensure row level security is enabled (safe to run even if already enabled)
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;

-- Create a SELECT policy for public so anonymous clients can read booking slots for availability
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = 'bookings' AND p.policyname = 'public_can_select_bookings'
  ) THEN
    EXECUTE 'CREATE POLICY public_can_select_bookings ON public.bookings FOR SELECT USING (true)';
  END IF;
END$$;

COMMIT;
