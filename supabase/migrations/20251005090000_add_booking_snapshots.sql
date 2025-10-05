-- Migration: add snapshot fields to bookings for reporting and cancellation support
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add snapshot columns if missing
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS service_name text;
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS service_price numeric(10,2);
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS barber_name text;
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS status text DEFAULT 'scheduled';
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS canceled_at timestamptz;

-- Backfill existing rows with joined values when possible
DO $$
BEGIN
  -- Only run if columns were just added and there are rows without snapshot
  IF EXISTS (SELECT 1 FROM public.bookings WHERE service_name IS NULL OR service_price IS NULL OR barber_name IS NULL) THEN
    UPDATE public.bookings b
    SET service_name = (
          SELECT s.name FROM public.services s WHERE s.id = b.service_id LIMIT 1
        ),
        service_price = (
          SELECT s.price FROM public.services s WHERE s.id = b.service_id LIMIT 1
        ),
        barber_name = (
          SELECT tm.name FROM public.team_members tm WHERE tm.id = b.barber_id LIMIT 1
        )
    WHERE (b.service_name IS NULL OR b.service_price IS NULL OR b.barber_name IS NULL);
  END IF;
END$$;

COMMIT;
