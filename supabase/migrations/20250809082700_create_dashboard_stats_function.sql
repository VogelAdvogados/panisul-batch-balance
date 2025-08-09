CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sales_last_30_days numeric;
  v_pending_receivables numeric;
  v_pending_payables numeric;
  v_low_stock_ingredients_count integer;
BEGIN
  -- 1. Total sales in the last 30 days
  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_sales_last_30_days
  FROM public.sales
  WHERE sale_date >= (now() - interval '30 days');

  -- 2. Pending accounts receivable
  SELECT COALESCE(SUM(amount), 0)
  INTO v_pending_receivables
  FROM public.accounts_receivable
  WHERE status = 'pending';

  -- 3. Pending accounts payable
  SELECT COALESCE(SUM(amount), 0)
  INTO v_pending_payables
  FROM public.accounts_payable
  WHERE status = 'pending';

  -- 4. Low stock ingredients count
  SELECT COUNT(*)
  INTO v_low_stock_ingredients_count
  FROM public.ingredients
  WHERE current_stock <= min_stock;

  -- Return as a single JSON object
  RETURN json_build_object(
    'salesLast30Days', v_sales_last_30_days,
    'pendingReceivables', v_pending_receivables,
    'pendingPayables', v_pending_payables,
    'lowStockCount', v_low_stock_ingredients_count
  );
END;
$$;
