-- Add barber_name to reviews to capture the chosen barber in public review submissions
alter table public.reviews
  add column if not exists barber_name text;

-- No policy changes required; existing insert policy allows setting this field