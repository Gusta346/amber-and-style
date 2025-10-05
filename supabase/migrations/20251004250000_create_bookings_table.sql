-- Migration: create bookings table (idempotent)
BEGIN;

-- Ensure uuid generator extension is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create bookings table if it does not exist
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name text,
  client_email text,
  client_phone text,
  service_id uuid,
  barber_id uuid,
  booking_date date,
  booking_time text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add columns if missing (safe for legacy tables)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS client_phone text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_id uuid;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS barber_id uuid;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_date date;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_time text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Indexes to speed up availability queries
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'bookings_booking_date_idx') THEN
    CREATE INDEX bookings_booking_date_idx ON public.bookings (booking_date);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'bookings_barber_id_idx') THEN
    CREATE INDEX bookings_barber_id_idx ON public.bookings (barber_id);
  END IF;
END$$;

-- trigger for updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON public.bookings;
CREATE TRIGGER set_timestamp
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE PROCEDURE public.trigger_set_timestamp();

COMMIT;
