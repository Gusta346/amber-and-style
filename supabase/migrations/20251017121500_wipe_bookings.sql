-- Wipe all bookings (agendamentos) so both Admin and Perfil lists are empty for fresh testing
-- This migration is safe to run once; it deletes all rows from public.bookings
begin;
  delete from public.bookings;
commit;
