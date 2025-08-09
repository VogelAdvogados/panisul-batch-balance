CREATE OR REPLACE FUNCTION public.get_sales_by_period(p_period text)
RETURNS TABLE(day text, total_sales numeric)
LANGUAGE sql
STABLE
AS $$
SELECT
  TO_CHAR(d.day, 'YYYY-MM-DD') as day,
  COALESCE(SUM(s.total_amount), 0) as total_sales
FROM
  generate_series(
    CASE
      WHEN p_period = '7d' THEN now() - interval '6 days'
      WHEN p_period = '30d' THEN now() - interval '29 days'
      WHEN p_period = 'this_month' THEN date_trunc('month', now())
      ELSE now() - interval '6 days'
    END,
    now(),
    interval '1 day'
  ) as d(day)
LEFT JOIN
  public.sales s ON date_trunc('day', s.sale_date) = date_trunc('day', d.day)
GROUP BY
  d.day
ORDER BY
  d.day;
$$;
