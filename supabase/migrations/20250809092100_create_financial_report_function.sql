CREATE OR REPLACE FUNCTION public.get_financial_report(p_start_date date, p_end_date date)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_paid_payables json;
  v_received_receivables json;
BEGIN
  -- Get paid payables within the date range, joining supplier name
  SELECT COALESCE(json_agg(t), '[]'::json)
  INTO v_paid_payables
  FROM (
    SELECT ap.*, s.name as supplier_name
    FROM public.accounts_payable ap
    LEFT JOIN public.suppliers s ON s.id = ap.supplier_id
    WHERE ap.status = 'paid' AND ap.paid_date BETWEEN p_start_date AND p_end_date
    ORDER BY ap.paid_date
  ) t;

  -- Get 'paid' receivables within the date range, joining customer name
  -- Note: The status for receivables might be different, e.g., 'received'. Assuming 'paid' for now.
  SELECT COALESCE(json_agg(t), '[]'::json)
  INTO v_received_receivables
  FROM (
    SELECT ar.*, c.name as customer_name
    FROM public.accounts_receivable ar
    LEFT JOIN public.customers c ON c.id = ar.customer_id
    WHERE ar.status = 'paid' AND ar.received_date BETWEEN p_start_date AND p_end_date
    ORDER BY ar.received_date
  ) t;

  -- Return as a single JSON object
  RETURN json_build_object(
    'paidPayables', v_paid_payables,
    'receivedReceivables', v_received_receivables
  );
END;
$$;
