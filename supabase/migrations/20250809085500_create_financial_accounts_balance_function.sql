CREATE OR REPLACE FUNCTION public.get_financial_accounts_with_balances()
RETURNS TABLE(
  id uuid,
  name text,
  type public.account_type,
  balance numeric
)
LANGUAGE sql
STABLE
AS $$
SELECT
  fa.id,
  fa.name,
  fa.type,
  COALESCE(SUM(ft.amount), 0) as balance
FROM
  public.financial_accounts fa
LEFT JOIN
  public.financial_transactions ft ON ft.account_id = fa.id
GROUP BY
  fa.id, fa.name, fa.type
ORDER BY
  fa.name;
$$;
