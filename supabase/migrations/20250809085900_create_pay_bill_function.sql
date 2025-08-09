CREATE OR REPLACE FUNCTION public.pay_bill(p_payable_id uuid, p_account_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_payable record;
BEGIN
  -- Get the details of the bill being paid
  SELECT * INTO v_payable FROM public.accounts_payable WHERE id = p_payable_id;

  -- Ensure the bill exists and is pending
  IF NOT FOUND OR v_payable.status != 'pending' THEN
    RAISE EXCEPTION 'Conta a pagar não encontrada ou já processada.';
  END IF;

  -- 1. Update the bill's status to 'paid'
  UPDATE public.accounts_payable
  SET
    status = 'paid',
    paid_date = now()
  WHERE id = p_payable_id;

  -- 2. Insert the debit transaction
  INSERT INTO public.financial_transactions(account_id, amount, txn_type, description, accounts_payable_id, purchase_id)
  VALUES (
    p_account_id,
    -v_payable.amount, -- The amount is negative because it's a debit
    'debit',
    'Pagamento: ' || v_payable.description,
    p_payable_id,
    v_payable.purchase_id
  );
END;
$$;
