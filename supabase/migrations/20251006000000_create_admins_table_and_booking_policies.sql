-- Migration: create admins table and allow admins to UPDATE/DELETE bookings

-- Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- references auth.users(uid) in Supabase
  email TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure admins table has RLS disabled for management via dashboard (optional)
ALTER TABLE IF EXISTS public.admins ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to SELECT their admin row (so they can verify)
CREATE POLICY "Admins can view their admin row"
  ON public.admins FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Allow dashboard/server to insert admin rows via service_role; no public INSERT policy is created here.

-- Create policy: only admins can UPDATE or DELETE bookings
CREATE POLICY "Admins can manage bookings"
  ON public.bookings FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid()));

CREATE POLICY "Admins can delete bookings"
  ON public.bookings FOR DELETE USING (EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid()));

-- Note for operator: after running this migration, you must create an admin user in Supabase Auth
-- and insert a row into public.admins with that user's uid. Example (run in Supabase SQL editor using a service_role key):
-- INSERT INTO public.admins (user_id, email, role) VALUES ('<AUTH_USER_UUID>', 'you@example.com', 'admin');

-- This migration intentionally does not add a public INSERT/UPDATE/DELETE policy for bookings; only admins can manage bookings.
