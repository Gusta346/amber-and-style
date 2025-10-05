-- Migration: remove 'Limpeza de Pele' and normalize service categories to Portuguese

BEGIN;

-- 1) Delete the unwanted service
DELETE FROM public.services
WHERE name = 'Limpeza de Pele';

-- 2) Normalize categories based on name (set friendly Portuguese categories)
UPDATE public.services
SET category = CASE
  WHEN LOWER(name) = 'corte' THEN 'Corte'
  WHEN LOWER(name) = 'barba' THEN 'Barba'
  WHEN LOWER(name) = 'sobrancelha' THEN 'Sobrancelha'
  ELSE category
END
WHERE LOWER(name) IN ('corte', 'barba', 'sobrancelha');

-- 3) Replace English category tokens if present (e.g. 'hair', 'beard', 'face')
UPDATE public.services
SET category = CASE
  WHEN LOWER(category) = 'hair' THEN 'Corte'
  WHEN LOWER(category) = 'beard' THEN 'Barba'
  WHEN LOWER(category) = 'face' THEN 'Rosto'
  ELSE category
END
WHERE LOWER(category) IN ('hair','beard','face');

-- 4) Seed team_members (Anderson/Pedro/Andre) if not present
-- 4) Ensure team_members table exists and seed barbers (Anderson/Pedro/Andre)

-- Create table if not exists (safe to run multiple times)
-- Ensure uuid generator extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  role text,
  years_experience int,
  image_url text,
  bio text,
  instagram text,
  specialties text[],
  rating numeric(2,1) DEFAULT 5.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- If a legacy team_members table exists without these columns, add them safely
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS years_experience int;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS instagram text;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS specialties text[];
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS rating numeric(2,1) DEFAULT 5.0;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Ensure slug uniqueness (creates index only if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i' AND c.relname = 'team_members_slug_idx'
  ) THEN
    CREATE UNIQUE INDEX team_members_slug_idx ON public.team_members (slug);
  END IF;
END$$;

-- Create or replace trigger function to maintain updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS set_timestamp ON public.team_members;
CREATE TRIGGER set_timestamp
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Insert seed barbers if they don't already exist (idempotent)
INSERT INTO public.team_members (name, slug, role, years_experience, image_url, bio, instagram, specialties, rating)
SELECT 'Anderson', 'anderson', 'Barbeiro', 8, '/anderson.jpg', 'Especialista em cortes clássicos e modern styles.', '@anderson', ARRAY['corte','barba'], 4.9
WHERE NOT EXISTS (SELECT 1 FROM public.team_members WHERE slug = 'anderson');

INSERT INTO public.team_members (name, slug, role, years_experience, image_url, bio, instagram, specialties, rating)
SELECT 'Pedro', 'pedro', 'Barbeiro', 5, '/pedro.jpg', 'Focado em fades e acabamento impecável.', '@pedro', ARRAY['corte','fade'], 4.8
WHERE NOT EXISTS (SELECT 1 FROM public.team_members WHERE slug = 'pedro');

INSERT INTO public.team_members (name, slug, role, years_experience, image_url, bio, instagram, specialties, rating)
SELECT 'Andre', 'andre', 'Barbeiro', 6, '/andre.jpg', 'Barbeiro experiente em barba e estilo.', '@andre', ARRAY['barba','estilo'], 4.7
WHERE NOT EXISTS (SELECT 1 FROM public.team_members WHERE slug = 'andre');

COMMIT;
