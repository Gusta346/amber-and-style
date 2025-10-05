-- Migration: add initial services and combos

-- Insert base services if not exists
INSERT INTO public.services (id, name, description, price, duration, category, image_url, created_at, updated_at)
SELECT gen_random_uuid(), 'Corte', 'Corte masculino com máquina e tesoura', 60.00, 45, 'hair', NULL, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Corte');

INSERT INTO public.services (id, name, description, price, duration, category, image_url, created_at, updated_at)
SELECT gen_random_uuid(), 'Barba', 'Design e aparo de barba', 40.00, 30, 'beard', NULL, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Barba');

INSERT INTO public.services (id, name, description, price, duration, category, image_url, created_at, updated_at)
SELECT gen_random_uuid(), 'Sobrancelha', 'Design de sobrancelha e acabamento', 30.00, 20, 'face', NULL, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Sobrancelha');

INSERT INTO public.services (id, name, description, price, duration, category, image_url, created_at, updated_at)
SELECT gen_random_uuid(), 'Limpeza de Pele', 'Limpeza facial rápida para manter a pele saudável', 50.00, 40, 'face', NULL, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Limpeza de Pele');

-- Create service_combos table
CREATE TABLE IF NOT EXISTS public.service_combos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  duration INTEGER NOT NULL,
  service_ids UUID[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert a combo for Corte + Barba if not exists
WITH corte AS (SELECT id FROM public.services WHERE name = 'Corte' LIMIT 1),
     barba AS (SELECT id FROM public.services WHERE name = 'Barba' LIMIT 1)
INSERT INTO public.service_combos (id, name, description, price, original_price, duration, service_ids, created_at, updated_at)
SELECT gen_random_uuid(), 'Corte + Barba', 'Combo com corte e barba com desconto especial', 85.00, 100.00, 75, ARRAY[(SELECT id FROM corte),(SELECT id FROM barba)], now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.service_combos WHERE name = 'Corte + Barba');

-- Triggers to update timestamps
CREATE OR REPLACE FUNCTION public.update_service_combos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_service_combos_updated_at BEFORE UPDATE ON public.service_combos
FOR EACH ROW EXECUTE FUNCTION public.update_service_combos_updated_at();
