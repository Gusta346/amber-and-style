-- DEV Migration: allow public UPDATE/DELETE on bookings (development-only, NOT for production)
-- WARNING: This policy allows anyone with the anon/public key to UPDATE and DELETE bookings.
-- Use only for local/dev testing. Remove or revert this migration before deploying to production.

-- Create permissive policies for dev convenience
CREATE POLICY "Public can update bookings (dev only)"
  ON public.bookings FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Public can delete bookings (dev only)"
  ON public.bookings FOR DELETE USING (true);

-- NOTE: If you later run a stricter migration (admins table + admin policies), remove these policies.
