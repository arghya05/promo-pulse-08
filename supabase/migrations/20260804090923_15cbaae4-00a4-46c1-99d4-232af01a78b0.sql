UPDATE public.inventory_levels il
SET reorder_point = GREATEST(reorder_point, 3),
    stock_level = GREATEST(round(GREATEST(il.reorder_point, 3) * (1.6 + (abs(hashtext(il.id::text || 'v4')) % 90) / 100.0))::int, 2)
FROM public.products p
WHERE p.product_sku = il.product_sku
  AND NOT EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.store_id = il.store_id AND t.product_sku = il.product_sku
      AND t.transaction_date >= CURRENT_DATE - 365
  );

UPDATE public.inventory_levels il SET stock_level = GREATEST(round(il.reorder_point * 0.85)::int, 1)
FROM public.products p WHERE p.product_sku = il.product_sku
  AND (abs(hashtext(il.id::text || 'med4')) % 1000) < (CASE WHEN p.category IN ('Produce','Dairy','Meat','Bakery','Seafood') THEN 55 ELSE 20 END);

UPDATE public.inventory_levels il SET stock_level = GREATEST(round(il.reorder_point * 0.35)::int, 0)
FROM public.products p WHERE p.product_sku = il.product_sku
  AND (abs(hashtext(il.id::text || 'oos4')) % 1000) < (CASE WHEN p.category IN ('Produce','Dairy','Meat','Bakery','Seafood') THEN 34 ELSE 12 END);

UPDATE public.inventory_levels SET stockout_risk = CASE
  WHEN stock_level <= reorder_point * 0.5 THEN 'High'
  WHEN stock_level <= reorder_point THEN 'Medium' ELSE 'Low' END;