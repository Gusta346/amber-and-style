-- Create team_members table and seed initial barbers
create table if not exists public.team_members (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  role text,
  years_experience int,
  image_url text,
  bio text,
  instagram text,
  specialties text[],
  rating numeric(2,1) default 5.0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- trigger to update updated_at
create or replace function public.trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_timestamp on public.team_members;
create trigger set_timestamp
  before update on public.team_members
  for each row
  execute procedure public.trigger_set_timestamp();

-- Seed 3 barbers (skip if exists by slug)
insert into public.team_members (name, slug, role, years_experience, image_url, bio, instagram, specialties, rating)
select 'Anderson', 'anderson', 'Barbeiro', 8, '/anderson.jpg', 'Especialista em cortes clássicos e modern styles.', '@anderson', array['corte','barba'], 4.9
where not exists (select 1 from public.team_members where slug = 'anderson');

insert into public.team_members (name, slug, role, years_experience, image_url, bio, instagram, specialties, rating)
select 'Pedro', 'pedro', 'Barbeiro', 5, '/pedro.jpg', 'Focado em fades e acabamento impecável.', '@pedro', array['corte','fade'], 4.8
where not exists (select 1 from public.team_members where slug = 'pedro');

insert into public.team_members (name, slug, role, years_experience, image_url, bio, instagram, specialties, rating)
select 'Andre', 'andre', 'Barbeiro', 6, '/andre.jpg', 'Barbeiro experiente em barba e estilo.', '@andre', array['barba','estilo'], 4.7
where not exists (select 1 from public.team_members where slug = 'andre');
