-- ===== 1) Real Meat & Seafood assortment =====
INSERT INTO public.products (product_sku, product_name, category, subcategory, brand, base_price, cost, margin_percent, price_elasticity, seasonality_factor, brand_type, sku_status, selling_uom)
VALUES
 ('MEA-010','Ground Beef 80/20 1lb','Meat','Beef','Store Brand',6.49,4.16,36.0,-1.20,'Grilling Season','Private Label','active','LB'),
 ('MEA-011','Ribeye Steak USDA Choice 1lb','Meat','Beef','Certified Angus Beef',17.99,12.95,28.0,-1.55,'Grilling Season','National Brand','active','LB'),
 ('MEA-012','Boneless Chicken Breast 2.5lb','Meat','Poultry','Perdue',11.99,8.63,28.0,-1.55,'Stable','National Brand','active','EA'),
 ('MEA-013','Chicken Thighs Bone-In 3lb','Meat','Poultry','Store Brand',7.49,4.79,36.0,-1.20,'Stable','Private Label','active','EA'),
 ('MEA-014','Pork Chops Center Cut 1.5lb','Meat','Pork','Smithfield',8.99,6.47,28.0,-1.55,'Grilling Season','National Brand','active','EA'),
 ('MEA-015','Bacon Thick Cut 16oz','Meat','Pork','Oscar Mayer',8.49,6.11,28.0,-1.55,'Stable','National Brand','active','EA'),
 ('MEA-016','Italian Sausage Links 19oz','Meat','Pork','Johnsonville',6.99,5.03,28.0,-1.55,'Grilling Season','National Brand','active','EA'),
 ('MEA-017','Ground Turkey 93/7 1lb','Meat','Poultry','Butterball',6.29,4.53,28.0,-1.55,'Holiday Peak','National Brand','active','LB'),
 ('SEA-005','Atlantic Salmon Fillet 1lb','Seafood','Fish','Fresh Catch',13.99,9.79,30.0,-1.70,'Lent Peak','National Brand','active','LB'),
 ('SEA-006','Raw Shrimp 31/40 Peeled 1lb','Seafood','Shellfish','Sea Best',12.49,8.74,30.0,-1.70,'Lent Peak','National Brand','active','LB'),
 ('SEA-007','Cod Loins Wild Caught 1lb','Seafood','Fish','Store Brand',11.49,7.36,36.0,-1.35,'Lent Peak','Private Label','active','LB'),
 ('SEA-008','Tilapia Fillets 1lb','Seafood','Fish','Store Brand',7.99,5.11,36.0,-1.35,'Stable','Private Label','active','LB'),
 ('SEA-009','Snow Crab Clusters 1.5lb','Seafood','Shellfish','Pacific Seafood',26.99,18.89,30.0,-1.90,'Holiday Peak','National Brand','active','EA'),
 ('SEA-010','Tuna Steaks Yellowfin 12oz','Seafood','Fish','Fresh Catch',14.99,10.49,30.0,-1.70,'Stable','National Brand','active','EA'),
 ('PRO-020','Strawberries 1lb Clamshell','Produce','Berries','Driscolls',4.99,3.34,33.0,-2.10,'High Summer','National Brand','active','EA'),
 ('PRO-021','Avocados Hass 4ct Bag','Produce','Fruit','Calavo',5.49,3.68,33.0,-2.10,'High Summer','National Brand','active','EA')
ON CONFLICT DO NOTHING;

-- ===== 2) A year of weekly sales for the new SKUs across every store =====
INSERT INTO public.transactions (transaction_date, store_id, product_sku, product_name, quantity, unit_price,
  discount_amount, total_amount, net_sales, tax_amount, cost_of_goods_sold, margin, return_flag)
SELECT
  w.wk + ((abs(hashtext(p.product_sku || s.id::text || w.wk::text)) % 7) * interval '1 day') + interval '13 hours',
  s.id, p.product_sku, p.product_name,
  q.units, p.base_price,
  round((CASE WHEN (abs(hashtext(p.product_sku || w.wk::text || 'pr')) % 100) < 22
        THEN q.units * p.base_price * 0.20 ELSE 0 END)::numeric, 2),
  round((q.units * p.base_price)::numeric, 2),
  round((q.units * p.base_price - (CASE WHEN (abs(hashtext(p.product_sku || w.wk::text || 'pr')) % 100) < 22
        THEN q.units * p.base_price * 0.20 ELSE 0 END))::numeric, 2),
  round((q.units * p.base_price * 0.0)::numeric, 2),
  round((q.units * p.cost)::numeric, 2),
  round((q.units * p.base_price - (CASE WHEN (abs(hashtext(p.product_sku || w.wk::text || 'pr')) % 100) < 22
        THEN q.units * p.base_price * 0.20 ELSE 0 END) - q.units * p.cost)::numeric, 2),
  false
FROM public.products p
JOIN public.stores s ON true
CROSS JOIN (SELECT generate_series(date_trunc('week', CURRENT_DATE - interval '51 weeks')::date, date_trunc('week', CURRENT_DATE)::date, interval '7 days')::date AS wk) w
CROSS JOIN LATERAL (
  SELECT GREATEST(round((
    (CASE WHEN p.category = 'Meat' THEN 34 WHEN p.category = 'Seafood' THEN 16 ELSE 42 END)
    * (0.7 + (abs(hashtext(p.product_sku || s.id::text)) % 60) / 100.0)
    * (1 + 0.18 * sin((EXTRACT(doy FROM w.wk) / 365.0) * 2 * pi()))
  )::numeric, 0)::int, 4) AS units
) q
WHERE p.product_sku IN ('MEA-010','MEA-011','MEA-012','MEA-013','MEA-014','MEA-015','MEA-016','MEA-017',
  'SEA-005','SEA-006','SEA-007','SEA-008','SEA-009','SEA-010','PRO-020','PRO-021');

-- ===== 3) Inventory positions + ageing for the new SKUs =====
INSERT INTO public.inventory_levels (store_id, product_sku, stock_level, reorder_point, stockout_risk, last_restocked)
SELECT s.id, p.product_sku,
  GREATEST(round(v.weekly * (0.5 + (abs(hashtext(p.product_sku || s.id::text || 'i')) % 22) / 10.0))::int, 0),
  GREATEST(round(v.weekly * 0.5)::int, 3),
  'Low',
  CURRENT_DATE - (abs(hashtext(p.product_sku || s.id::text || 'r')) % 3 + 1)
FROM public.products p
JOIN public.stores s ON true
CROSS JOIN LATERAL (
  SELECT GREATEST(SUM(t.quantity)::numeric / 52.0, 3) AS weekly FROM public.transactions t
  WHERE t.product_sku = p.product_sku AND t.store_id = s.id AND t.transaction_date >= CURRENT_DATE - 365
) v
WHERE p.product_sku IN ('MEA-010','MEA-011','MEA-012','MEA-013','MEA-014','MEA-015','MEA-016','MEA-017',
  'SEA-005','SEA-006','SEA-007','SEA-008','SEA-009','SEA-010','PRO-020','PRO-021');

UPDATE public.inventory_levels il SET stock_level = GREATEST(round(il.reorder_point * 0.4)::int, 0)
WHERE (abs(hashtext(il.id::text || 'fresh-oos')) % 100) < 10
  AND il.product_sku LIKE ANY (ARRAY['MEA-%','SEA-%','PRO-02%']);

UPDATE public.inventory_levels SET stockout_risk = CASE
  WHEN stock_level <= reorder_point * 0.5 THEN 'High'
  WHEN stock_level <= reorder_point THEN 'Medium' ELSE 'Low' END
WHERE product_sku LIKE ANY (ARRAY['MEA-%','SEA-%','PRO-02%']);

INSERT INTO public.stock_age_tracking (product_sku, store_id, stock_age_days, stock_age_band, quantity, value_at_cost, value_at_retail, tracking_date)
SELECT il.product_sku, il.store_id, a.days,
  CASE WHEN a.days <= 2 THEN '0-2 days' WHEN a.days <= 5 THEN '3-5 days'
       WHEN a.days <= 9 THEN '6-9 days' ELSE '10+ days' END,
  il.stock_level, round((il.stock_level * p.cost)::numeric,2), round((il.stock_level * p.base_price)::numeric,2), CURRENT_DATE - 1
FROM public.inventory_levels il JOIN public.products p ON p.product_sku = il.product_sku
CROSS JOIN LATERAL (SELECT (CURRENT_DATE - il.last_restocked) + (abs(hashtext(il.id::text||'a')) % 3) AS days) a
WHERE il.product_sku IN ('MEA-010','MEA-011','MEA-012','MEA-013','MEA-014','MEA-015','MEA-016','MEA-017',
  'SEA-005','SEA-006','SEA-007','SEA-008','SEA-009','SEA-010','PRO-020','PRO-021') AND il.stock_level > 0;

-- ===== 4) Competitor prices for the new SKUs =====
INSERT INTO public.competitor_prices (product_sku, competitor_name, competitor_price, our_price, price_gap_percent, observation_date, source)
SELECT p.product_sku, c.name,
  round((p.base_price * c.idx)::numeric, 2), p.base_price,
  round((((p.base_price * c.idx) - p.base_price) / p.base_price * 100)::numeric, 1), CURRENT_DATE - 1, c.src
FROM public.products p
CROSS JOIN (VALUES
  ('Walmart Supercenter', 0.94, 'Weekly price audit'),
  ('Kroger', 0.98, 'Digital shelf scrape'),
  ('Aldi', 0.86, 'Store price check'),
  ('Publix', 1.06, 'Weekly circular'),
  ('Costco Wholesale', 0.89, 'Unit-price normalized'),
  ('Whole Foods Market', 1.17, 'Store price check')
) AS c(name, idx, src)
WHERE p.product_sku IN ('MEA-010','MEA-011','MEA-012','MEA-013','MEA-014','MEA-015','MEA-016','MEA-017',
  'SEA-005','SEA-006','SEA-007','SEA-008','SEA-009','SEA-010','PRO-020','PRO-021');

-- ===== 5) Refresh daily KPI measures to include new departments =====
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