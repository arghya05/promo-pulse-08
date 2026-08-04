DELETE FROM public.transactions
WHERE product_sku IN ('MEA-010','MEA-011','MEA-012','MEA-013','MEA-014','MEA-015','MEA-016','MEA-017',
  'SEA-005','SEA-006','SEA-007','SEA-008','SEA-009','SEA-010','PRO-020','PRO-021');

INSERT INTO public.transactions (transaction_date, store_id, product_sku, product_name, quantity, unit_price,
  discount_amount, total_amount, net_sales, tax_amount, cost_of_goods_sold, margin, return_flag)
SELECT
  w.wk + ((abs(hashtext(p.product_sku || s.id::text || w.wk::text)) % 7) * interval '1 day') + interval '13 hours',
  s.id, p.product_sku, p.product_name,
  q.units, p.base_price,
  round(d.disc::numeric, 2),
  round((q.units * p.base_price)::numeric, 2),
  round((q.units * p.base_price - d.disc)::numeric, 2),
  0,
  round((q.units * p.cost)::numeric, 2),
  round((q.units * p.base_price - d.disc - q.units * p.cost)::numeric, 2),
  false
FROM public.products p
JOIN public.stores s ON true
CROSS JOIN (SELECT generate_series(date_trunc('week', CURRENT_DATE - interval '51 weeks')::date, date_trunc('week', CURRENT_DATE)::date, interval '7 days')::date AS wk) w
CROSS JOIN LATERAL (
  SELECT GREATEST(round((
    (CASE WHEN p.category = 'Meat' THEN 1.7 WHEN p.category = 'Seafood' THEN 0.7 ELSE 2.0 END)
    * (0.6 + (abs(hashtext(p.product_sku || s.id::text)) % 80) / 100.0)
    * (1 + 0.20 * sin((EXTRACT(doy FROM w.wk) / 365.0) * 2 * pi()))
  )::numeric, 0)::int, 1) AS units
) q
CROSS JOIN LATERAL (
  SELECT CASE WHEN (abs(hashtext(p.product_sku || w.wk::text || 'pr')) % 100) < 22
              THEN q.units * p.base_price * 0.20 ELSE 0 END AS disc
) d
WHERE p.product_sku IN ('MEA-010','MEA-011','MEA-012','MEA-013','MEA-014','MEA-015','MEA-016','MEA-017',
  'SEA-005','SEA-006','SEA-007','SEA-008','SEA-009','SEA-010','PRO-020','PRO-021');

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