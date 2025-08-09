CREATE OR REPLACE FUNCTION public.get_sales_last_7_days()
RETURNS TABLE(day text, total_sales numeric)
LANGUAGE sql
STABLE
AS $$
  SELECT
    TO_CHAR(d.day, 'YYYY-MM-DD') as day,
    COALESCE(SUM(s.total_amount), 0) as total_sales
  FROM
    generate_series(
      (now() - interval '6 days'),
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
