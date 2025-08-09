-- Function to get top selling products (recipes) by quantity sold
CREATE OR REPLACE FUNCTION public.get_top_selling_products(p_limit integer)
RETURNS TABLE(
  product_id uuid,
  product_name text,
  total_quantity_sold numeric
)
LANGUAGE sql
STABLE
AS $$
SELECT
  si.recipe_id as product_id,
  r.name as product_name,
  SUM(si.quantity) as total_quantity_sold
FROM
  public.sale_items si
JOIN
  public.recipes r ON r.id = si.recipe_id
GROUP BY
  si.recipe_id, r.name
ORDER BY
  total_quantity_sold DESC
LIMIT p_limit;
$$;

-- Function to get top customers by total amount spent
CREATE OR REPLACE FUNCTION public.get_top_customers(p_limit integer)
RETURNS TABLE(
  customer_id uuid,
  customer_name text,
  total_spent numeric
)
LANGUAGE sql
STABLE
AS $$
SELECT
  s.customer_id,
  c.name as customer_name,
  SUM(s.total_amount) as total_spent
FROM
  public.sales s
JOIN
  public.customers c ON c.id = s.customer_id
WHERE
  s.customer_id IS NOT NULL
GROUP BY
  s.customer_id, c.name
ORDER BY
  total_spent DESC
LIMIT p_limit;
$$;
