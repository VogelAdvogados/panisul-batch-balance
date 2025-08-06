-- Corrigir função update_updated_at_column com search_path seguro
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Corrigir função update_stock_on_production com search_path seguro
CREATE OR REPLACE FUNCTION public.update_stock_on_production()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Para cada ingrediente da receita, diminuir o estoque
  INSERT INTO public.stock_movements (ingredient_id, movement_type, quantity, reason, production_id)
  SELECT 
    ri.ingredient_id,
    'saida',
    -(ri.quantity * NEW.quantity_produced),
    'Produção: ' || r.name,
    NEW.id
  FROM public.recipe_ingredients ri
  JOIN public.recipes r ON r.id = ri.recipe_id
  WHERE ri.recipe_id = NEW.recipe_id;
  
  -- Atualizar o estoque atual dos ingredientes
  UPDATE public.ingredients 
  SET current_stock = current_stock + sm.total_movement
  FROM (
    SELECT 
      ingredient_id,
      SUM(quantity) as total_movement
    FROM public.stock_movements 
    WHERE production_id = NEW.id
    GROUP BY ingredient_id
  ) sm
  WHERE ingredients.id = sm.ingredient_id;
  
  RETURN NEW;
END;
$$;

-- Corrigir função update_stock_on_movement com search_path seguro
CREATE OR REPLACE FUNCTION public.update_stock_on_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar estoque apenas se não for uma movimentação de produção
  IF NEW.production_id IS NULL THEN
    UPDATE public.ingredients 
    SET current_stock = current_stock + NEW.quantity
    WHERE id = NEW.ingredient_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Corrigir função update_stock_on_sale com search_path seguro
CREATE OR REPLACE FUNCTION public.update_stock_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Para cada item vendido, diminuir o estoque baseado na receita
  INSERT INTO public.stock_movements (ingredient_id, movement_type, quantity, reason)
  SELECT 
    ri.ingredient_id,
    'saida',
    -(ri.quantity * NEW.quantity),
    'Venda: ' || r.name
  FROM public.recipe_ingredients ri
  JOIN public.recipes r ON r.id = ri.recipe_id
  WHERE ri.recipe_id = NEW.recipe_id;
  
  -- Atualizar o estoque atual dos ingredientes
  UPDATE public.ingredients 
  SET current_stock = current_stock + sm.total_movement
  FROM (
    SELECT 
      ingredient_id,
      SUM(quantity) as total_movement
    FROM public.stock_movements 
    WHERE reason LIKE 'Venda: %' AND created_at >= NEW.created_at
    GROUP BY ingredient_id
  ) sm
  WHERE ingredients.id = sm.ingredient_id;
  
  RETURN NEW;
END;
$$;