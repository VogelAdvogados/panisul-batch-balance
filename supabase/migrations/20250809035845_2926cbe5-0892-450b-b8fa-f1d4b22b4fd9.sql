-- Average cost calculation for ingredients based on confirmed purchases
CREATE OR REPLACE FUNCTION public.recalc_ingredient_avg_cost(p_ingredient_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_qty numeric := 0;
  v_total_cost numeric := 0;
BEGIN
  SELECT COALESCE(SUM(pi.quantity), 0), COALESCE(SUM(pi.quantity * pi.unit_price), 0)
    INTO v_total_qty, v_total_cost
  FROM public.purchase_items pi
  JOIN public.purchases p ON p.id = pi.purchase_id
  WHERE pi.ingredient_id = p_ingredient_id
    AND p.status = 'confirmed';

  IF v_total_qty > 0 THEN
    UPDATE public.ingredients
       SET cost_per_unit = ROUND(v_total_cost / v_total_qty, 4),
           updated_at = now()
     WHERE id = p_ingredient_id;
  END IF;
END;
$$;

-- Trigger function to recalc avg cost when purchase_items change
CREATE OR REPLACE FUNCTION public.tg_recalc_avg_cost_on_pi()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_purchase_id uuid;
  v_ingredient_id uuid;
  v_status text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_purchase_id := OLD.purchase_id;
    v_ingredient_id := OLD.ingredient_id;
  ELSE
    v_purchase_id := NEW.purchase_id;
    v_ingredient_id := NEW.ingredient_id;
  END IF;

  SELECT status INTO v_status FROM public.purchases WHERE id = v_purchase_id;

  IF v_status = 'confirmed' THEN
    PERFORM public.recalc_ingredient_avg_cost(v_ingredient_id);
  END IF;

  RETURN NULL;
END;
$$;

-- Trigger function to recalc when purchase status changes
CREATE OR REPLACE FUNCTION public.tg_recalc_avg_cost_on_purchase_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec record;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    FOR rec IN (
      SELECT DISTINCT ingredient_id
      FROM public.purchase_items
      WHERE purchase_id = NEW.id
    ) LOOP
      PERFORM public.recalc_ingredient_avg_cost(rec.ingredient_id);
    END LOOP;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS after_purchase_items_change ON public.purchase_items;
CREATE TRIGGER after_purchase_items_change
AFTER INSERT OR UPDATE OR DELETE ON public.purchase_items
FOR EACH ROW EXECUTE FUNCTION public.tg_recalc_avg_cost_on_pi();

DROP TRIGGER IF EXISTS after_purchase_status_update ON public.purchases;
CREATE TRIGGER after_purchase_status_update
AFTER UPDATE OF status ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.tg_recalc_avg_cost_on_purchase_status();