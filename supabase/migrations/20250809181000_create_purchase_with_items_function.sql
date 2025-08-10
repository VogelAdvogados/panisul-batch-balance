create or replace function create_purchase_with_items(
  purchase_data jsonb,
  items_data jsonb[]
)
returns purchases
language plpgsql
as $$
declare
  new_purchase purchases;
  item jsonb;
begin
  -- Insert the purchase and return the new record
  insert into purchases (supplier_id, nfe_number, nfe_issue_date, total_amount, status, purchase_date)
  values (
    (purchase_data->>'supplier_id')::uuid,
    purchase_data->>'nfe_number',
    (purchase_data->>'nfe_issue_date')::timestamp with time zone,
    (purchase_data->>'total_amount')::numeric,
    (purchase_data->>'status')::text,
    (purchase_data->>'purchase_date')::timestamp with time zone
  ) returning * into new_purchase;

  -- Loop through the items and insert them
  if array_length(items_data, 1) > 0 then
    foreach item in array items_data
    loop
      insert into purchase_items (purchase_id, ingredient_id, quantity, unit_price)
      values (
        new_purchase.id,
        (item->>'ingredient_id')::uuid,
        (item->>'quantity')::numeric,
        (item->>'unit_price')::numeric
      );
    end loop;
  end if;

  return new_purchase;
end;
$$;
