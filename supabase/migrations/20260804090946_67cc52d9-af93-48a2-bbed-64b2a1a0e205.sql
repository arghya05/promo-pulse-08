UPDATE public.inventory_levels
SET stock_level = GREATEST(stock_level, round(reorder_point * (1.5 + (abs(hashtext(id::text || 'h5')) % 100) / 100.0))::int);

UPDATE public.inventory_levels il SET stock_level = GREATEST(round(il.reorder_point * 0.8)::int, 1)
FROM public.products p WHERE p.product_sku = il.product_sku
  AND (abs(hashtext(il.id::text || 'med5')) % 1000) < (CASE WHEN p.category IN ('Produce','Dairy','Meat','Bakery','Seafood') THEN 52 ELSE 18 END);

UPDATE public.inventory_levels il SET stock_level = GREATEST(round(il.reorder_point * 0.3)::int, 0)
FROM public.products p WHERE p.product_sku = il.product_sku
  AND (abs(hashtext(il.id::text || 'oos5')) % 1000) < (CASE WHEN p.category IN ('Produce','Dairy','Meat','Bakery','Seafood') THEN 32 ELSE 10 END);

UPDATE public.inventory_levels SET stockout_risk = CASE
  WHEN stock_level <= reorder_point * 0.5 THEN 'High'
  WHEN stock_level <= reorder_point THEN 'Medium' ELSE 'Low' END;