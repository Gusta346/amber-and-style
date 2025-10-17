-- Update service prices to requested values

-- Corte - 40.00

-- Barba - 40.00

-- Sobrancelha - 5.00

-- Corte + Barba (combo) - 70.00 with original_price 80.00

DO $$
BEGIN
  -- Update individual services by name (case-insensitive match)
  UPDATE public.services SET price = 40.00, updated_at = now()
  WHERE lower(name) = 'corte';

  UPDATE public.services SET price = 40.00, updated_at = now()
  WHERE lower(name) = 'barba';

  UPDATE public.services SET price = 5.00, updated_at = now()
  WHERE lower(name) = 'sobrancelha';

  -- Update combo
  UPDATE public.service_combos SET price = 70.00, original_price = 80.00, updated_at = now()
  WHERE lower(name) = 'corte + barba';
END $$;