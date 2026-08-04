DELETE FROM public.transactions t USING public.products p
WHERE p.product_sku = t.product_sku AND p.category = 'Seafood'
  AND (abs(hashtext(t.id::text)) % 100) >= 26;

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