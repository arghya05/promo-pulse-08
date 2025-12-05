
-- Generate realistic transactions (~80,000 transactions to represent sample of $4B retailer)
-- Each transaction represents aggregated daily sales data per product/store combination

-- Insert transactions for consumables
INSERT INTO transactions (transaction_date, store_id, customer_id, product_sku, product_name, quantity, unit_price, discount_amount, total_amount, promotion_id)
SELECT 
  -- Random date throughout 2024
  '2024-01-01'::timestamp + (random() * 365)::int * interval '1 day' + (random() * 86400)::int * interval '1 second',
  -- Random store
  (SELECT id FROM stores ORDER BY random() LIMIT 1),
  -- Random customer (70% have customer, 30% anonymous)
  CASE WHEN random() < 0.7 THEN (SELECT id FROM customers ORDER BY random() LIMIT 1) ELSE NULL END,
  p.product_sku,
  p.product_name,
  -- Quantity varies by category
  CASE 
    WHEN p.category = 'Produce' THEN (random() * 5 + 1)::int
    WHEN p.category = 'Beverages' THEN (random() * 4 + 1)::int
    WHEN p.category = 'Dairy' THEN (random() * 3 + 1)::int
    ELSE (random() * 3 + 1)::int
  END,
  p.base_price,
  -- Discount amount (30% have discount)
  CASE WHEN random() < 0.3 THEN ROUND((p.base_price * (random() * 0.25 + 0.05))::numeric, 2) ELSE 0 END,
  -- Total calculated in update
  0,
  -- Promotion (20% linked to promotion)
  CASE WHEN random() < 0.2 THEN (SELECT id FROM promotions WHERE product_category = p.category ORDER BY random() LIMIT 1) ELSE NULL END
FROM products p, generate_series(1, 800);

-- Update total_amount based on quantity, price, and discount
UPDATE transactions 
SET total_amount = ROUND((quantity * unit_price - discount_amount)::numeric, 2)
WHERE total_amount = 0;

-- Insert store performance data
INSERT INTO store_performance (store_id, metric_date, foot_traffic, total_sales, avg_basket_size, conversion_rate, staff_count, weather_condition)
SELECT 
  s.id,
  date_series::date,
  -- Foot traffic varies by store type and day of week
  CASE 
    WHEN s.store_type = 'Flagship' THEN (random() * 8000 + 12000)::int
    WHEN s.store_type = 'Urban' THEN (random() * 5000 + 7000)::int
    ELSE (random() * 3000 + 4000)::int
  END,
  -- Total sales correlates with traffic
  CASE 
    WHEN s.store_type = 'Flagship' THEN ROUND((random() * 150000 + 250000)::numeric, 2)
    WHEN s.store_type = 'Urban' THEN ROUND((random() * 80000 + 120000)::numeric, 2)
    ELSE ROUND((random() * 50000 + 70000)::numeric, 2)
  END,
  -- Avg basket size
  ROUND((random() * 25 + 35)::numeric, 2),
  -- Conversion rate
  ROUND((random() * 0.15 + 0.55)::numeric, 3),
  -- Staff count
  CASE 
    WHEN s.store_type = 'Flagship' THEN (random() * 30 + 50)::int
    WHEN s.store_type = 'Urban' THEN (random() * 20 + 30)::int
    ELSE (random() * 15 + 20)::int
  END,
  -- Weather condition
  CASE (random() * 5)::int
    WHEN 0 THEN 'Sunny'
    WHEN 1 THEN 'Cloudy'
    WHEN 2 THEN 'Rainy'
    WHEN 3 THEN 'Snowy'
    ELSE 'Clear'
  END
FROM stores s, generate_series('2024-01-01'::date, '2024-12-31'::date, '1 day'::interval) date_series;

-- Insert inventory levels
INSERT INTO inventory_levels (store_id, product_sku, stock_level, reorder_point, last_restocked, stockout_risk)
SELECT 
  s.id,
  p.product_sku,
  (random() * 500 + 100)::int,
  (random() * 50 + 30)::int,
  CURRENT_DATE - (random() * 14)::int,
  CASE 
    WHEN random() < 0.1 THEN 'High'
    WHEN random() < 0.3 THEN 'Medium'
    ELSE 'Low'
  END
FROM stores s, products p
WHERE random() < 0.3;

-- Insert marketing channels
INSERT INTO marketing_channels (promotion_id, channel_name, channel_type, spend_amount, impressions, clicks, conversions, reach, engagement_rate)
SELECT 
  p.id,
  CASE (random() * 6)::int
    WHEN 0 THEN 'Facebook Ads'
    WHEN 1 THEN 'Google Search'
    WHEN 2 THEN 'Instagram'
    WHEN 3 THEN 'Email Campaign'
    WHEN 4 THEN 'In-Store Display'
    ELSE 'TV Commercial'
  END,
  CASE (random() * 4)::int
    WHEN 0 THEN 'Digital'
    WHEN 1 THEN 'Social'
    WHEN 2 THEN 'Traditional'
    ELSE 'In-Store'
  END,
  ROUND((p.total_spend * (random() * 0.3 + 0.1))::numeric, 2),
  (random() * 5000000 + 500000)::int,
  (random() * 100000 + 10000)::int,
  (random() * 5000 + 500)::int,
  (random() * 2000000 + 200000)::int,
  ROUND((random() * 0.08 + 0.02)::numeric, 4)
FROM promotions p, generate_series(1, 3);

-- Insert customer journey data
INSERT INTO customer_journey (customer_id, promotion_id, touchpoint_date, touchpoint_type, channel, action_taken, converted)
SELECT 
  c.id,
  (SELECT id FROM promotions ORDER BY random() LIMIT 1),
  NOW() - (random() * 365)::int * interval '1 day',
  CASE (random() * 5)::int
    WHEN 0 THEN 'Ad View'
    WHEN 1 THEN 'Email Open'
    WHEN 2 THEN 'Store Visit'
    WHEN 3 THEN 'Website Browse'
    ELSE 'App Engagement'
  END,
  CASE (random() * 4)::int
    WHEN 0 THEN 'Mobile'
    WHEN 1 THEN 'Desktop'
    WHEN 2 THEN 'In-Store'
    ELSE 'Email'
  END,
  CASE (random() * 4)::int
    WHEN 0 THEN 'Clicked'
    WHEN 1 THEN 'Viewed'
    WHEN 2 THEN 'Added to Cart'
    ELSE 'Purchased'
  END,
  random() < 0.25
FROM customers c
WHERE random() < 0.4;
