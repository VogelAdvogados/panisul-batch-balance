ALTER TABLE public.accounts_receivable
  ADD COLUMN expected_payment_method text,
  ADD COLUMN actual_payment_method text;
