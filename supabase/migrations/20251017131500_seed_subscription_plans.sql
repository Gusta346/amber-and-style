-- Seed two subscription plans as requested
-- 1) 4 cortes no mês por 150,00 com 2 serviços extras
-- 2) 4 corte e barba no mês por 290,00 com 2 serviços extras

DO $$
BEGIN
  -- Ensure table exists (noop if already created earlier)
  -- Insert 4 cortes/mês
  INSERT INTO public.subscription_plans (name, description, price, billing_period, features, max_services, discount_percentage, is_popular)
  SELECT 'Plano Corte Mensal', '4 cortes no mês por preço fixo. Ganhe 2 serviços extras.', 150.00, 'monthly', ARRAY[
      '4 cortes no mês',
      'Ganha 2 serviços extras',
      'Preço fixo mensal',
      'Sem taxas adicionais'
    ], 6, 0, false
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subscription_plans WHERE lower(name) = 'plano corte mensal'
  );

  -- Insert 4 corte e barba/mês
  INSERT INTO public.subscription_plans (name, description, price, billing_period, features, max_services, discount_percentage, is_popular)
  SELECT 'Plano Corte + Barba Mensal', '4 corte e barba no mês por preço fixo. Ganhe 2 serviços extras.', 290.00, 'monthly', ARRAY[
      '4 corte e barba no mês',
      'Ganha 2 serviços extras',
      'Preço fixo mensal',
      'Sem taxas adicionais'
    ], 6, 0, true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subscription_plans WHERE lower(name) = 'plano corte + barba mensal'
  );
END $$;