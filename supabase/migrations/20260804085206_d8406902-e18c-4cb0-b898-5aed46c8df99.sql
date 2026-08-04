-- ===== 1) Inventory driven by real store/SKU weekly velocity =====
WITH vel AS (
  SELECT t.store_id, t.product_sku,
         GREATEST(SUM(t.quantity)::numeric / 52.0, 2) AS weekly_units
  FROM public.transactions t
  WHERE t.transaction_date >= CURRENT_DATE - 365
  GROUP BY t.store_id, t.product_sku
)
UPDATE public.inventory_levels il SET
  stock_level = GREATEST(round(v.weekly_units * (0.6 + (abs(hashtext(il.id::text)) % 26) / 10.0))::int, 0),
  reorder_point = GREATEST(round(v.weekly_units * (CASE WHEN p.category IN ('Produce','Meat','Seafood','Bakery','Dairy') THEN 0.5 ELSE 1.4 END))::int, 3),
  last_restocked = CURRENT_DATE - (abs(hashtext(il.id::text || 'r')) % (CASE WHEN p.category IN ('Produce','Meat','Seafood','Bakery','Dairy') THEN 3 ELSE 10 END) + 1)
FROM vel v, public.products p
WHERE v.store_id = il.store_id AND v.product_sku = il.product_sku AND p.product_sku = il.product_sku;

UPDATE public.inventory_levels SET
  stockout_risk = CASE
    WHEN stock_level <= reorder_point * 0.5 THEN 'High'
    WHEN stock_level <= reorder_point THEN 'Medium'
    ELSE 'Low' END;

-- ===== 2) Fresh vs center-store stock ageing =====
DELETE FROM public.stock_age_tracking;
INSERT INTO public.stock_age_tracking (product_sku, store_id, stock_age_days, stock_age_band, quantity, value_at_cost, value_at_retail, tracking_date)
SELECT il.product_sku, il.store_id, age.days,
  CASE WHEN p.category IN ('Produce','Meat','Seafood','Bakery','Dairy') THEN
        CASE WHEN age.days <= 2 THEN '0-2 days' WHEN age.days <= 5 THEN '3-5 days'
             WHEN age.days <= 9 THEN '6-9 days' ELSE '10+ days' END
       ELSE
        CASE WHEN age.days <= 14 THEN '0-2 weeks' WHEN age.days <= 30 THEN '3-4 weeks'
             WHEN age.days <= 60 THEN '5-8 weeks' ELSE '9+ weeks' END
  END,
  il.stock_level,
  round((il.stock_level * p.cost)::numeric, 2),
  round((il.stock_level * p.base_price)::numeric, 2),
  CURRENT_DATE - 1
FROM public.inventory_levels il
JOIN public.products p ON p.product_sku = il.product_sku
CROSS JOIN LATERAL (SELECT (CURRENT_DATE - il.last_restocked)
  + (abs(hashtext(il.id::text || 'age')) % (CASE WHEN p.category IN ('Produce','Meat','Seafood','Bakery','Dairy') THEN 3 ELSE 40 END)) AS days) age
WHERE il.stock_level > 0;

-- ===== 3) Demand forecasts anchored to real sales, realistic error by department =====
DELETE FROM public.demand_forecasts;
INSERT INTO public.demand_forecasts (product_sku, store_id, forecast_date, forecast_period_start, forecast_period_end,
  forecasted_units, actual_units, forecast_accuracy, forecast_model, confidence_interval_low, confidence_interval_high)
SELECT s.product_sku, s.store_id,
  s.wk::date, s.wk::date, s.wk::date + 6,
  GREATEST(round(s.units * (1 + err.e))::int, 1),
  CASE WHEN s.wk::date <= CURRENT_DATE THEN s.units ELSE NULL END,
  CASE WHEN s.wk::date <= CURRENT_DATE THEN round((100 - abs(err.e) * 100)::numeric, 1) ELSE NULL END,
  CASE WHEN p.category IN ('Produce','Meat','Seafood','Bakery') THEN 'Gradient Boosted Trees (fresh daily)'
       WHEN p.category IN ('Beverages','Snacks') THEN 'Promo-aware Regression + Uplift'
       ELSE 'Seasonal ARIMA + Holiday Regressors' END,
  GREATEST(round(s.units * (1 + err.e) * 0.86)::int, 1),
  GREATEST(round(s.units * (1 + err.e) * 1.14)::int, 2)
FROM (
  SELECT date_trunc('week', t.transaction_date) AS wk, t.store_id, t.product_sku, SUM(t.quantity)::numeric AS units
  FROM public.transactions t
  WHERE t.transaction_date >= CURRENT_DATE - 120
  GROUP BY 1,2,3
) s
JOIN public.products p ON p.product_sku = s.product_sku
CROSS JOIN LATERAL (SELECT (CASE
    WHEN p.category IN ('Produce','Seafood') THEN 0.18
    WHEN p.category IN ('Meat','Bakery') THEN 0.14
    WHEN p.category IN ('Snacks','Beverages') THEN 0.12
    WHEN p.category IN ('Dairy','Frozen') THEN 0.09
    ELSE 0.07 END) * (((abs(hashtext(s.product_sku || s.store_id::text || s.wk::text)) % 200) - 100) / 100.0) AS e) err
LIMIT 6000;

-- Forward-looking 6 weeks of forecast for the top-velocity SKUs
INSERT INTO public.demand_forecasts (product_sku, store_id, forecast_date, forecast_period_start, forecast_period_end,
  forecasted_units, forecast_model, confidence_interval_low, confidence_interval_high)
SELECT b.product_sku, b.store_id, CURRENT_DATE, w.wk, w.wk + 6,
  GREATEST(round(b.weekly * (1 + (abs(hashtext(b.product_sku || w.wk::text)) % 14 - 6) / 100.0))::int, 1),
  'Gradient Boosted Trees + Weather & Event Signals',
  GREATEST(round(b.weekly * 0.88)::int, 1), GREATEST(round(b.weekly * 1.12)::int, 2)
FROM (
  SELECT t.product_sku, t.store_id, SUM(t.quantity)::numeric / 12.0 AS weekly
  FROM public.transactions t WHERE t.transaction_date >= CURRENT_DATE - 84
  GROUP BY 1,2 ORDER BY 3 DESC LIMIT 250
) b
CROSS JOIN (SELECT generate_series(date_trunc('week', CURRENT_DATE)::date + 7, date_trunc('week', CURRENT_DATE)::date + 42, interval '7 days')::date AS wk) w;

-- ===== 4) Forecast accuracy tracking by department =====
DELETE FROM public.forecast_accuracy_tracking;
INSERT INTO public.forecast_accuracy_tracking (tracking_date, category, mape, bias, rmse, forecast_model, sample_size, notes)
SELECT d.day::date, c.category,
  round((c.base + (abs(hashtext(c.category || d.day::text)) % 30) / 10.0)::numeric, 2),
  round((((abs(hashtext(c.category || d.day::text || 'b')) % 60) - 30) / 10.0)::numeric, 2),
  round((c.base * 1.6 + (abs(hashtext(c.category || d.day::text || 'r')) % 20) / 10.0)::numeric, 2),
  c.model,
  1200 + (abs(hashtext(c.category || d.day::text || 's')) % 4800),
  c.note
FROM generate_series(date_trunc('month', CURRENT_DATE - interval '11 months'), date_trunc('month', CURRENT_DATE), interval '1 month') d(day)
CROSS JOIN (VALUES
  ('Produce', 17.0, 'Gradient Boosted Trees (fresh daily)', 'Weather sensitivity and shrink drive error'),
  ('Meat', 13.5, 'Gradient Boosted Trees (fresh daily)', 'Grilling season volatility'),
  ('Seafood', 18.5, 'Gradient Boosted Trees (fresh daily)', 'Supply-constrained, Lent spike'),
  ('Bakery', 14.0, 'Gradient Boosted Trees (fresh daily)', 'DSD scan-based trading noise'),
  ('Dairy', 8.5, 'Seasonal ARIMA + Holiday Regressors', 'Stable staple demand'),
  ('Frozen', 9.5, 'Seasonal ARIMA + Holiday Regressors', 'Promo-driven peaks'),
  ('Beverages', 11.5, 'Promo-aware Regression + Uplift', 'Heat index and event driven'),
  ('Snacks', 12.0, 'Promo-aware Regression + Uplift', 'Super Bowl and holiday spikes'),
  ('Pantry', 7.0, 'Seasonal ARIMA + Holiday Regressors', 'Highly predictable replenishment'),
  ('Personal Care', 7.5, 'Seasonal ARIMA + Holiday Regressors', 'Long purchase cycles'),
  ('Home Care', 8.0, 'Seasonal ARIMA + Holiday Regressors', 'Pack-size cannibalization')
) AS c(category, base, model, note);

-- ===== 5) Realistic supplier / PO service levels =====
UPDATE public.supplier_orders so SET
  actual_delivery_date = CASE WHEN (abs(hashtext(so.id::text)) % 100) < 94
      THEN so.expected_delivery_date - (abs(hashtext(so.id::text || 'd')) % 2)
      ELSE so.expected_delivery_date + 1 + (abs(hashtext(so.id::text || 'l')) % 3) END,
  total_cost = round((so.quantity * so.unit_cost)::numeric, 2),
  status = 'delivered'
WHERE so.expected_delivery_date <= CURRENT_DATE;
UPDATE public.supplier_orders SET on_time = (actual_delivery_date IS NOT NULL AND actual_delivery_date <= expected_delivery_date);
UPDATE public.supplier_orders SET status = 'in_transit', actual_delivery_date = NULL, on_time = NULL WHERE expected_delivery_date > CURRENT_DATE;

UPDATE public.purchase_orders SET
  actual_delivery_date = CASE WHEN (abs(hashtext(id::text)) % 100) < 92
      THEN expected_delivery_date - (abs(hashtext(id::text || 'd')) % 2)
      ELSE expected_delivery_date + 1 + (abs(hashtext(id::text || 'l')) % 4) END,
  status = 'received'
WHERE expected_delivery_date <= CURRENT_DATE;
UPDATE public.purchase_orders SET status = 'open', actual_delivery_date = NULL WHERE expected_delivery_date > CURRENT_DATE;