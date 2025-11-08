-- Reset user-related data for clean testing environments
-- WARNING: This will delete rows from user-generated tables. Keep catalog tables intact.
-- Tables affected: bookings, barber_day_blocks, contact_messages, reviews, subscribers, student_enrollments
-- Requires caller to be an admin present in public.admins (user_id = auth.uid()).

create or replace function public.reset_user_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only allow if the caller is an admin
  if not exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  ) then
    raise exception 'not authorized';
  end if;

  -- Delete user-generated/application data
  if to_regclass('public.bookings') is not null then
    delete from public.bookings where true;
  end if;

  if to_regclass('public.barber_day_blocks') is not null then
    delete from public.barber_day_blocks where true;
  end if;

  if to_regclass('public.contact_messages') is not null then
    delete from public.contact_messages where true;
  end if;

  if to_regclass('public.reviews') is not null then
    delete from public.reviews where true;
  end if;

  if to_regclass('public.subscribers') is not null then
    delete from public.subscribers where true;
  end if;

  if to_regclass('public.student_enrollments') is not null then
    delete from public.student_enrollments where true;
  end if;
end
$$;

-- Allow authenticated users to call; function enforces admin check internally
grant execute on function public.reset_user_data() to authenticated;
