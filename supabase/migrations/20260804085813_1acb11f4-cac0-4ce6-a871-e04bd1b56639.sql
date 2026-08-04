-- ===== 1) Scale sales to a realistic department mix =====
WITH f(category, k) AS (VALUES
  ('Pantry', 3.10), ('Dairy', 1.89), ('Beverages', 1.63), ('Meat', 0.67), ('Produce', 1.28),
  ('Frozen', 1.28), ('Snacks', 1.30), ('Bakery', 1.52), ('Personal Care', 0.44),
  ('Home Care', 0.49), ('Seafood', 0.245)
)
UPDATE public.transactions t SET
  quantity = GREATEST(round(t.quantity * f.k)::int, 1),
  total_amount = round((GREATEST(round(t.quantity * f.k)::int, 1) * t.unit_price)::numeric, 2),
  discount_amount = round((COALESCE(t.discount_amount, 0) * f.k)::numeric, 2),
  net_sales = round((GREATEST(round(t.quantity * f.k)::int, 1) * t.unit_price - COALESCE(t.discount_amount, 0) * f.k)::numeric, 2),
  cost_of_goods_sold = round((GREATEST(round(t.quantity * f.k)::int, 1) * p.cost)::numeric, 2),
  margin = round((GREATEST(round(t.quantity * f.k)::int, 1) * t.unit_price - COALESCE(t.discount_amount, 0) * f.k
                  - GREATEST(round(t.quantity * f.k)::int, 1) * p.cost)::numeric, 2)
FROM f, public.products p
WHERE p.product_sku = t.product_sku AND f.category = p.category;

-- ===== 2) Inventory cover recomputed from rebalanced velocity =====
WITH vel AS (
  SELECT store_id, product_sku, GREATEST(SUM(quantity)::numeric / 52.0, 2) AS weekly
  FROM public.transactions WHERE transaction_date >= CURRENT_DATE - 365 GROUP BY 1,2
)
UPDATE public.inventory_levels il SET
  stock_level = GREATEST(round(v.weekly * (0.6 + (abs(hashtext(il.id::text || 'v2')) % 26) / 10.0))::int, 0),
  reorder_point = GREATEST(round(v.weekly * (CASE WHEN p.category IN ('Produce','Meat','Seafood','Bakery','Dairy') THEN 0.5 ELSE 1.4 END))::int, 3)
FROM vel v, public.products p
WHERE v.store_id = il.store_id AND v.product_sku = il.product_sku AND p.product_sku = il.product_sku;

UPDATE public.inventory_levels il SET stock_level = GREATEST(round(il.reorder_point * 0.35)::int, 0)
FROM public.products p WHERE p.product_sku = il.product_sku
  AND (abs(hashtext(il.id::text || 'oos2')) % 100) < (CASE WHEN p.category IN ('Produce','Dairy','Meat','Bakery','Seafood') THEN 11 ELSE 4 END);
UPDATE public.inventory_levels SET stock_level = GREATEST(round(reorder_point * 0.85)::int, 1)
WHERE (abs(hashtext(id::text || 'low2')) % 100) BETWEEN 12 AND 27;
UPDATE public.inventory_levels SET stockout_risk = CASE
  WHEN stock_level <= reorder_point * 0.5 THEN 'High'
  WHEN stock_level <= reorder_point THEN 'Medium' ELSE 'Low' END;

-- ===== 3) Stock ageing refreshed =====
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
  + (abs(hashtext(il.id::text || 'age2')) % (CASE WHEN p.category IN ('Produce','Meat','Seafood','Bakery','Dairy') THEN 3 ELSE 40 END)) AS days) a
WHERE il.stock_level > 0;

-- ===== 4) Trade spend re-based on rebalanced promoted revenue =====
UPDATE public.promotions pr SET total_spend = round(GREATEST(rev.promo_rev * 0.10, 4500)::numeric, 0)
FROM (SELECT promotion_id, SUM(total_amount) AS promo_rev FROM public.transactions
      WHERE promotion_id IS NOT NULL GROUP BY promotion_id) rev
WHERE rev.promotion_id = pr.id;

-- ===== 5) Daily KPI measures rebuilt =====
DELETE FROM public.kpi_measures;
INSERT INTO public.kpi_measures (
  measure_date, category, net_sales, net_sales_ly, yoy_net_sales_growth_pct,
  gross_margin, gross_margin_pct, margin_ly, yoy_margin_growth_pct, units_sold, units_sold_ly,
  avg_transaction_value, avg_basket_size, transactions_count, return_rate_pct, discount_rate_pct,
  inventory_turn, sell_through_rate, stock_to_sales_ratio
)
SELECT
  t.transaction_date::date, p.category,
  round(SUM(COALESCE(t.net_sales, t.total_amount))::numeric, 2),
  round((SUM(COALESCE(t.net_sales, t.total_amount)) / (1 + ly.g))::numeric, 2),
  round((ly.g * 100)::numeric, 2),
  round(SUM(t.margin)::numeric, 2),
  round((SUM(t.margin) / NULLIF(SUM(COALESCE(t.net_sales, t.total_amount)), 0) * 100)::numeric, 2),
  round((SUM(t.margin) / (1 + ly.g * 0.7))::numeric, 2),
  round((ly.g * 70)::numeric, 2),
  SUM(t.quantity),
  round(SUM(t.quantity) / (1 + ly.g * 0.6))::int,
  round((SUM(COALESCE(t.net_sales, t.total_amount)) / COUNT(*))::numeric, 2),
  round((SUM(t.quantity)::numeric / COUNT(*))::numeric, 2),
  COUNT(*),
  round((1.2 + (abs(hashtext(p.category)) % 12) / 10.0)::numeric, 2),
  round((SUM(COALESCE(t.discount_amount, 0)) / NULLIF(SUM(t.total_amount), 0) * 100)::numeric, 2),
  round((CASE p.category
      WHEN 'Produce' THEN 42.0 WHEN 'Dairy' THEN 34.0 WHEN 'Meat' THEN 30.0 WHEN 'Seafood' THEN 28.0
      WHEN 'Bakery' THEN 38.0 WHEN 'Frozen' THEN 14.0 WHEN 'Beverages' THEN 16.0
      WHEN 'Snacks' THEN 13.0 WHEN 'Pantry' THEN 9.0 ELSE 8.0 END
    + (abs(hashtext(p.category || t.transaction_date::date::text)) % 20) / 10.0)::numeric, 2),
  round((62 + (abs(hashtext(p.category || t.transaction_date::date::text || 'st')) % 30))::numeric, 2),
  round((1.1 + (abs(hashtext(p.category || 'ss')) % 22) / 10.0)::numeric, 2)
FROM public.transactions t
JOIN public.products p ON p.product_sku = t.product_sku
CROSS JOIN LATERAL (SELECT (CASE p.category
    WHEN 'Produce' THEN 0.041 WHEN 'Dairy' THEN 0.018 WHEN 'Meat' THEN 0.032 WHEN 'Seafood' THEN 0.012
    WHEN 'Bakery' THEN 0.026 WHEN 'Frozen' THEN 0.048 WHEN 'Beverages' THEN 0.035
    WHEN 'Snacks' THEN 0.057 WHEN 'Pantry' THEN 0.014 WHEN 'Personal Care' THEN -0.008
    ELSE 0.006 END) AS g) ly
GROUP BY t.transaction_date::date, p.category, ly.g;