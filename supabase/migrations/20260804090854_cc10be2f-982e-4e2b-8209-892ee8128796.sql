-- Rebuild stock positions so on-shelf availability lands near 94%
WITH vel AS (
  SELECT store_id, product_sku, GREATEST(SUM(quantity)::numeric / 52.0, 2) AS weekly
  FROM public.transactions WHERE transaction_date >= CURRENT_DATE - 365 GROUP BY 1,2
)
UPDATE public.inventory_levels il SET
  reorder_point = GREATEST(round(v.weekly * (CASE WHEN p.category IN ('Produce','Meat','Seafood','Bakery','Dairy') THEN 0.6 ELSE 1.5 END))::int, 3),
  stock_level = GREATEST(round(v.weekly
      * (CASE WHEN p.category IN ('Produce','Meat','Seafood','Bakery','Dairy') THEN 1.4 ELSE 3.0 END)
      * (0.85 + (abs(hashtext(il.id::text || 'v3')) % 60) / 100.0))::int, 1)
FROM vel v, public.products p
WHERE v.store_id = il.store_id AND v.product_sku = il.product_sku AND p.product_sku = il.product_sku;

-- Thin cover on a small, fresh-weighted minority
UPDATE public.inventory_levels il SET stock_level = GREATEST(round(il.reorder_point * 0.85)::int, 1)
FROM public.products p WHERE p.product_sku = il.product_sku
  AND (abs(hashtext(il.id::text || 'med3')) % 1000) < (CASE WHEN p.category IN ('Produce','Dairy','Meat','Bakery','Seafood') THEN 55 ELSE 20 END);

-- Genuine out-of-shelf on ~2% of positions, concentrated in fresh
UPDATE public.inventory_levels il SET stock_level = GREATEST(round(il.reorder_point * 0.35)::int, 0)
FROM public.products p WHERE p.product_sku = il.product_sku
  AND (abs(hashtext(il.id::text || 'oos3')) % 1000) < (CASE WHEN p.category IN ('Produce','Dairy','Meat','Bakery','Seafood') THEN 34 ELSE 12 END);

UPDATE public.inventory_levels SET stockout_risk = CASE
  WHEN stock_level <= reorder_point * 0.5 THEN 'High'
  WHEN stock_level <= reorder_point THEN 'Medium' ELSE 'Low' END;

-- Keep ageing snapshot aligned with the new positions
DELETE FROM public.stock_age_tracking;
INSERT INTO public.stock_age_tracking (product_sku, store_id, stock_age_days, stock_age_band, quantity, value_at_cost, value_at_retail, tracking_date)
SELECT il.product_sku, il.store_id, a.days,
  CASE WHEN p.category IN ('Produce','Meat','Seafood','Bakery','Dairy') THEN
        CASE WHEN a.days <= 2 THEN '0-2 days' WHEN a.days <= 5 THEN '3-5 days'
             WHEN a.days <= 9 THEN '6-9 days' ELSE '10+ days' END
       ELSE
        CASE WHEN a.days <= 14 THEN '0-2 weeks' WHEN a.days <= 30 THEN '3-4 weeks'
             WHEN a.days <= 60 THEN '5-8 weeks' ELSE '9+ weeks' END END,
  il.stock_level, round((il.stock_level * p.cost)::numeric, 2), round((il.stock_level * p.base_price)::numeric, 2), CURRENT_DATE - 1
FROM public.inventory_levels il JOIN public.products p ON p.product_sku = il.product_sku
CROSS JOIN LATERAL (SELECT GREATEST(CURRENT_DATE - il.last_restocked, 0)
  + (abs(hashtext(il.id::text || 'age3')) % (CASE WHEN p.category IN ('Produce','Meat','Seafood','Bakery','Dairy') THEN 3 ELSE 40 END)) AS days) a
WHERE il.stock_level > 0;