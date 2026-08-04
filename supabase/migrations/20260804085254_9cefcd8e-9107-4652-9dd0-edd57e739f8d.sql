-- Introduce realistic thin-cover positions (fresh & dairy skew) before recomputing risk
UPDATE public.inventory_levels il SET stock_level = GREATEST(round(il.reorder_point * 0.35)::int, 0)
FROM public.products p
WHERE p.product_sku = il.product_sku
  AND (abs(hashtext(il.id::text || 'oos')) % 100) < (CASE WHEN p.category IN ('Produce','Dairy','Meat','Bakery','Seafood') THEN 11 ELSE 4 END);

UPDATE public.inventory_levels il SET stock_level = GREATEST(round(il.reorder_point * 0.85)::int, 1)
FROM public.products p
WHERE p.product_sku = il.product_sku
  AND (abs(hashtext(il.id::text || 'low')) % 100) BETWEEN 12 AND 27;

UPDATE public.inventory_levels SET stockout_risk = CASE
  WHEN stock_level <= reorder_point * 0.5 THEN 'High'
  WHEN stock_level <= reorder_point THEN 'Medium'
  ELSE 'Low' END;