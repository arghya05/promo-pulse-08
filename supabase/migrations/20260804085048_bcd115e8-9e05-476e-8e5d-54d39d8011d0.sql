-- ============ 1) Realistic grocery product economics ============
WITH m(category, gm, elast, seas) AS (VALUES
  ('Produce', 0.33, -2.10, 'High Summer'),
  ('Meat', 0.28, -1.55, 'Grilling Season'),
  ('Seafood', 0.30, -1.70, 'Lent Peak'),
  ('Dairy', 0.22, -1.05, 'Stable'),
  ('Bakery', 0.45, -1.30, 'Holiday Peak'),
  ('Frozen', 0.27, -1.60, 'Winter Peak'),
  ('Snacks', 0.30, -1.95, 'Event Driven'),
  ('Beverages', 0.26, -2.25, 'High Summer'),
  ('Pantry', 0.24, -1.15, 'Stable'),
  ('Personal Care', 0.38, -0.95, 'Stable'),
  ('Home Care', 0.32, -1.10, 'Stable')
)
UPDATE public.products p SET
  margin_percent = round(((m.gm + CASE WHEN p.brand = 'Store Brand' THEN 0.08 ELSE 0 END) * 100)::numeric, 1),
  cost = round((p.base_price * (1 - (m.gm + CASE WHEN p.brand = 'Store Brand' THEN 0.08 ELSE 0 END)))::numeric, 2),
  price_elasticity = round((m.elast + (CASE WHEN p.brand = 'Store Brand' THEN 0.35 ELSE -0.05 END))::numeric, 2),
  seasonality_factor = m.seas,
  brand_type = CASE WHEN p.brand = 'Store Brand' THEN 'Private Label' ELSE 'National Brand' END
FROM m WHERE m.category = p.category;

-- ============ 2) Recompute transaction COGS / margin off real costs ============
UPDATE public.transactions t SET
  cost_of_goods_sold = round((t.quantity * p.cost)::numeric, 2),
  margin = round((COALESCE(t.net_sales, t.total_amount - COALESCE(t.discount_amount,0)) - (t.quantity * p.cost))::numeric, 2)
FROM public.products p WHERE p.product_sku = t.product_sku;

-- ============ 3) Real grocery promotion mechanics ============
UPDATE public.promotions SET
  promo_mechanism = CASE (abs(hashtext(id::text)) % 8)
    WHEN 0 THEN 'BOGO Free'
    WHEN 1 THEN 'Buy 2 Save $3'
    WHEN 2 THEN '10 for $10 Mix & Match'
    WHEN 3 THEN 'Digital Coupon Clip'
    WHEN 4 THEN 'Loyalty Member Price'
    WHEN 5 THEN 'Fuel Points Bonus 2x'
    WHEN 6 THEN 'Temporary Price Reduction'
    ELSE 'Weekly Circular Feature' END,
  channel = CASE (abs(hashtext(id::text || 'ch')) % 5)
    WHEN 0 THEN 'Weekly Circular'
    WHEN 1 THEN 'Digital App'
    WHEN 2 THEN 'In-Store Endcap'
    WHEN 3 THEN 'Email + Loyalty'
    ELSE 'Omnichannel' END,
  target_segment = CASE (abs(hashtext(id::text || 'sg')) % 5)
    WHEN 0 THEN 'Loyalty Households'
    WHEN 1 THEN 'Value Seekers'
    WHEN 2 THEN 'Large Families'
    WHEN 3 THEN 'Health Conscious'
    ELSE 'All Shoppers' END,
  discount_percent = LEAST(GREATEST(COALESCE(discount_percent, 15), 10), 40),
  running_promo = (CURRENT_DATE BETWEEN start_date AND end_date),
  status = CASE WHEN CURRENT_DATE > end_date THEN 'completed'
                WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'active'
                ELSE 'planned' END;

-- Promo spend capped at realistic grocery trade-spend levels (~8-12% of promoted revenue)
UPDATE public.promotions pr SET total_spend = round(GREATEST(rev.promo_rev * 0.10, 4500)::numeric, 0)
FROM (
  SELECT promotion_id, SUM(total_amount) AS promo_rev
  FROM public.transactions WHERE promotion_id IS NOT NULL GROUP BY promotion_id
) rev WHERE rev.promotion_id = pr.id;
UPDATE public.promotions SET total_spend = 6800 WHERE total_spend IS NULL OR total_spend = 0;

-- ============ 4) Real US grocery competitors with realistic price gaps ============
DELETE FROM public.competitor_prices;
INSERT INTO public.competitor_prices (product_sku, competitor_name, competitor_price, our_price, price_gap_percent, observation_date, source)
SELECT p.product_sku, c.name,
  round((p.base_price * c.idx * (1 + ((abs(hashtext(p.product_sku || c.name)) % 60) - 30) / 1000.0))::numeric, 2),
  p.base_price,
  round((((p.base_price * c.idx) - p.base_price) / p.base_price * 100)::numeric, 1),
  '2026-08-03',
  c.src
FROM public.products p
CROSS JOIN (VALUES
  ('Walmart Supercenter', 0.94, 'Weekly price audit'),
  ('Kroger', 0.98, 'Digital shelf scrape'),
  ('Aldi', 0.86, 'Store price check'),
  ('Publix', 1.06, 'Weekly circular'),
  ('Albertsons/Safeway', 1.03, 'Digital shelf scrape'),
  ('Costco Wholesale', 0.89, 'Unit-price normalized'),
  ('Target', 1.01, 'Digital shelf scrape'),
  ('Whole Foods Market', 1.17, 'Store price check'),
  ('Trader Joes', 0.95, 'Store price check'),
  ('H-E-B', 0.96, 'Weekly circular')
) AS c(name, idx, src);

UPDATE public.competitor_data SET competitor_name = CASE (abs(hashtext(id::text)) % 6)
  WHEN 0 THEN 'Walmart Supercenter' WHEN 1 THEN 'Kroger' WHEN 2 THEN 'Aldi'
  WHEN 3 THEN 'Publix' WHEN 4 THEN 'Albertsons/Safeway' ELSE 'Costco Wholesale' END;

-- ============ 5) Real CPG suppliers and vendors ============
UPDATE public.suppliers s SET supplier_name = v.nm, supplier_code = v.cd,
  lead_time_days = v.lt, reliability_score = v.rl, payment_terms = v.pt,
  preferred_carrier = v.car
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) rn FROM public.suppliers
) o
JOIN (VALUES
  (1,'The Coca-Cola Company','SUP-COKE',3,98.4,'Net 30','DSD - Vendor Fleet'),
  (2,'PepsiCo / Frito-Lay','SUP-PEP',3,97.9,'Net 30','DSD - Vendor Fleet'),
  (3,'Danone North America','SUP-DAN',2,96.2,'Net 15','Refrigerated LTL'),
  (4,'Tyson Foods','SUP-TYS',4,94.8,'Net 30','Temp-Controlled TL'),
  (5,'General Mills','SUP-GMI',7,97.1,'Net 45','Dry TL'),
  (6,'Kraft Heinz','SUP-KHC',6,95.6,'Net 45','Dry TL'),
  (7,'Driscolls Berries','SUP-DRS',1,92.4,'Net 10','Fresh Air-Cooled'),
  (8,'Conagra Brands','SUP-CAG',8,96.8,'Net 45','Frozen TL'),
  (9,'Procter & Gamble','SUP-PG',9,98.1,'Net 60','Dry TL'),
  (10,'Unilever North America','SUP-UNI',9,97.3,'Net 60','Dry TL')
) AS v(rn, nm, cd, lt, rl, pt, car) ON v.rn = o.rn
WHERE s.id = o.id;

UPDATE public.vendors ve SET vendor_name = v.nm, vendor_code = v.cd, vendor_type = v.tp, rating = v.rt, payment_terms = v.pt
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) rn FROM public.vendors) o
JOIN (VALUES
  (1,'Nestle USA','VEN-NES','National CPG',4.6,'Net 45'),
  (2,'Mondelez International','VEN-MDLZ','National CPG',4.4,'Net 45'),
  (3,'Sysco Fresh Distribution','VEN-SYS','Broadline Distributor',4.3,'Net 30'),
  (4,'Dole Food Company','VEN-DOL','Produce Grower',4.1,'Net 15'),
  (5,'Pacific Seafood Group','VEN-PAC','Protein Supplier',3.9,'Net 21'),
  (6,'Land O Lakes','VEN-LOL','Dairy Cooperative',4.5,'Net 30'),
  (7,'Bimbo Bakeries USA','VEN-BIM','DSD Bakery',4.2,'Net 21'),
  (8,'Keurig Dr Pepper','VEN-KDP','Beverage DSD',4.4,'Net 30'),
  (9,'Clorox Company','VEN-CLX','Home Care CPG',4.3,'Net 60'),
  (10,'Colgate-Palmolive','VEN-CL','Personal Care CPG',4.2,'Net 60')
) AS v(rn, nm, cd, tp, rt, pt) ON v.rn = o.rn
WHERE ve.id = o.id;

-- ============ 6) Perishable-led markdowns (real grocery shrink drivers) ============
DELETE FROM public.markdowns;
INSERT INTO public.markdowns (markdown_code, product_sku, store_id, markdown_type, markdown_reason, original_price, markdown_price, markdown_percent, effective_date, end_date, status)
SELECT
  'MD-' || to_char(d.day, 'YYYYMMDD') || '-' || p.product_sku,
  p.product_sku, s.id,
  CASE WHEN p.category IN ('Produce','Meat','Seafood','Bakery','Dairy') THEN 'Perishable Reduction' ELSE 'Clearance' END,
  CASE (abs(hashtext(p.product_sku || d.day::text)) % 5)
    WHEN 0 THEN 'Approaching sell-by date'
    WHEN 1 THEN 'Overstock after promotion'
    WHEN 2 THEN 'Slow sell-through vs forecast'
    WHEN 3 THEN 'Seasonal exit / range change'
    ELSE 'Quality grade downgrade' END,
  p.base_price,
  round((p.base_price * (1 - md.pct))::numeric, 2),
  round((md.pct * 100)::numeric, 0),
  d.day::date,
  d.day::date + 3,
  CASE WHEN d.day::date < CURRENT_DATE - 3 THEN 'completed' WHEN d.day::date <= CURRENT_DATE THEN 'active' ELSE 'planned' END
FROM generate_series(CURRENT_DATE - 60, CURRENT_DATE + 7, interval '4 days') AS d(day)
CROSS JOIN LATERAL (
  SELECT product_sku, base_price, category FROM public.products
  WHERE category IN ('Produce','Meat','Seafood','Bakery','Dairy','Frozen')
  ORDER BY hashtext(product_sku || d.day::text) LIMIT 4
) p
CROSS JOIN LATERAL (SELECT id FROM public.stores ORDER BY hashtext(id::text || d.day::text || p.product_sku) LIMIT 1) s
CROSS JOIN LATERAL (SELECT (ARRAY[0.25,0.30,0.40,0.50])[1 + (abs(hashtext(p.product_sku || d.day::text || 'md')) % 4)] AS pct) md;

-- ============ 7) Rebuild daily KPI measures from real transactions ============
DELETE FROM public.kpi_measures;
INSERT INTO public.kpi_measures (
  measure_date, store_id, category, net_sales, net_sales_ly, yoy_net_sales_growth_pct,
  gross_margin, gross_margin_pct, margin_ly, yoy_margin_growth_pct, units_sold, units_sold_ly,
  avg_transaction_value, avg_basket_size, transactions_count, return_rate_pct, discount_rate_pct,
  inventory_turn, sell_through_rate, stock_to_sales_ratio
)
SELECT
  t.transaction_date::date,
  NULL,
  p.category,
  round(SUM(COALESCE(t.net_sales, t.total_amount))::numeric, 2) AS net_sales,
  round((SUM(COALESCE(t.net_sales, t.total_amount)) / (1 + ly.g))::numeric, 2) AS net_sales_ly,
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