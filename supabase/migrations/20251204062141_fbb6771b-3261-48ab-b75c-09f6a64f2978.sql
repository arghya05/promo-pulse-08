-- Add non-consumable products (Soaps, Oils, Personal Care, Home Care)
INSERT INTO products (product_sku, product_name, category, subcategory, brand, base_price, cost, margin_percent, price_elasticity, seasonality_factor) VALUES
-- Personal Care - Soaps
('NC-SOAP-001', 'Body Wash 16oz', 'Personal Care', 'Soap', 'Dove', 6.99, 3.50, 50, -1.3, 'stable'),
('NC-SOAP-002', 'Bar Soap 6pk', 'Personal Care', 'Soap', 'Irish Spring', 5.49, 2.80, 49, -1.2, 'stable'),
('NC-SOAP-003', 'Hand Soap 8oz', 'Personal Care', 'Soap', 'Softsoap', 3.99, 2.00, 50, -1.1, 'stable'),
('NC-SOAP-004', 'Antibacterial Soap 12oz', 'Personal Care', 'Soap', 'Dial', 4.99, 2.50, 50, -1.2, 'stable'),
('NC-SOAP-005', 'Liquid Soap Refill 32oz', 'Personal Care', 'Soap', 'Method', 8.99, 4.50, 50, -1.4, 'stable'),

-- Personal Care - Shampoo & Hair
('NC-HAIR-001', 'Shampoo 12oz', 'Personal Care', 'Hair Care', 'Head & Shoulders', 7.99, 4.00, 50, -1.5, 'stable'),
('NC-HAIR-002', 'Conditioner 12oz', 'Personal Care', 'Hair Care', 'Pantene', 6.99, 3.50, 50, -1.4, 'stable'),
('NC-HAIR-003', 'Hair Gel 8oz', 'Personal Care', 'Hair Care', 'Garnier', 5.99, 3.00, 50, -1.3, 'stable'),

-- Home Care - Cooking Oils
('NC-OIL-001', 'Vegetable Oil 48oz', 'Home Care', 'Cooking Oil', 'Crisco', 6.99, 4.20, 40, -1.2, 'stable'),
('NC-OIL-002', 'Olive Oil 16oz', 'Home Care', 'Cooking Oil', 'Bertolli', 9.99, 5.50, 45, -1.6, 'stable'),
('NC-OIL-003', 'Canola Oil 48oz', 'Home Care', 'Cooking Oil', 'Mazola', 5.99, 3.60, 40, -1.1, 'stable'),
('NC-OIL-004', 'Coconut Oil 14oz', 'Home Care', 'Cooking Oil', 'Nutiva', 8.99, 4.80, 47, -1.5, 'stable'),
('NC-OIL-005', 'Avocado Oil 16oz', 'Home Care', 'Cooking Oil', 'Chosen Foods', 11.99, 6.50, 46, -1.7, 'stable'),

-- Home Care - Cleaning Products
('NC-CLN-001', 'All Purpose Cleaner 32oz', 'Home Care', 'Cleaning', 'Lysol', 4.99, 2.50, 50, -1.0, 'stable'),
('NC-CLN-002', 'Glass Cleaner 23oz', 'Home Care', 'Cleaning', 'Windex', 4.49, 2.20, 51, -0.9, 'stable'),
('NC-CLN-003', 'Bathroom Cleaner 24oz', 'Home Care', 'Cleaning', 'Scrubbing Bubbles', 5.49, 2.80, 49, -1.1, 'stable'),
('NC-CLN-004', 'Floor Cleaner 48oz', 'Home Care', 'Cleaning', 'Pine-Sol', 5.99, 3.00, 50, -1.0, 'stable'),
('NC-CLN-005', 'Disinfectant Spray 19oz', 'Home Care', 'Cleaning', 'Clorox', 6.99, 3.50, 50, -1.2, 'stable'),

-- Personal Care - Oral Care
('NC-ORAL-001', 'Toothpaste 6oz', 'Personal Care', 'Oral Care', 'Colgate', 4.99, 2.50, 50, -1.1, 'stable'),
('NC-ORAL-002', 'Mouthwash 16oz', 'Personal Care', 'Oral Care', 'Listerine', 6.99, 3.50, 50, -1.3, 'stable'),
('NC-ORAL-003', 'Toothbrush 2pk', 'Personal Care', 'Oral Care', 'Oral-B', 5.99, 3.00, 50, -1.2, 'stable'),

-- Personal Care - Deodorant & Skincare
('NC-DEO-001', 'Deodorant 2.7oz', 'Personal Care', 'Deodorant', 'Old Spice', 5.99, 3.00, 50, -1.2, 'stable'),
('NC-DEO-002', 'Antiperspirant 2.6oz', 'Personal Care', 'Deodorant', 'Degree', 5.49, 2.80, 49, -1.1, 'stable'),
('NC-SKIN-001', 'Body Lotion 16oz', 'Personal Care', 'Skincare', 'Nivea', 7.99, 4.00, 50, -1.4, 'stable'),
('NC-SKIN-002', 'Face Moisturizer 4oz', 'Personal Care', 'Skincare', 'Olay', 12.99, 6.50, 50, -1.8, 'stable'),

-- Home Care - Paper Products
('NC-PAP-001', 'Toilet Paper 12pk', 'Home Care', 'Paper Products', 'Charmin', 14.99, 8.50, 43, -0.8, 'stable'),
('NC-PAP-002', 'Facial Tissue 4pk', 'Home Care', 'Paper Products', 'Kleenex', 8.99, 5.00, 44, -0.9, 'stable'),
('NC-PAP-003', 'Napkins 200ct', 'Home Care', 'Paper Products', 'Vanity Fair', 5.99, 3.20, 47, -0.7, 'stable');

-- Add promotions for non-consumable products
INSERT INTO promotions (promotion_name, promotion_type, start_date, end_date, discount_percent, product_category, status, total_spend) VALUES
('Spring Clean Sale', 'percentage', '2024-03-01', '2024-03-15', 20, 'Home Care', 'completed', 8500),
('Personal Care BOGO', 'bogo', '2024-02-14', '2024-02-21', 50, 'Personal Care', 'completed', 12000),
('Oil Essentials Week', 'percentage', '2024-01-15', '2024-01-22', 15, 'Home Care', 'completed', 5500),
('Fresh Start Promo', 'percentage', '2024-04-01', '2024-04-14', 25, 'Personal Care', 'active', 9500),
('Home Care Bundle', 'bundle', '2024-03-20', '2024-04-05', 30, 'Home Care', 'completed', 11000),
('Soap & Shine Deal', 'percentage', '2024-02-01', '2024-02-10', 20, 'Personal Care', 'completed', 6500),
('Paper Products Blowout', 'percentage', '2024-04-10', '2024-04-20', 35, 'Home Care', 'active', 7800),
('Beauty Basics Sale', 'percentage', '2024-01-25', '2024-02-05', 18, 'Personal Care', 'completed', 4500);

-- Add transactions for non-consumable products
WITH non_consumable_promo AS (
  SELECT id FROM promotions WHERE promotion_name = 'Spring Clean Sale' LIMIT 1
),
store_id AS (
  SELECT id FROM stores LIMIT 1
),
customer_id AS (
  SELECT id FROM customers LIMIT 1
)
INSERT INTO transactions (product_sku, product_name, quantity, unit_price, total_amount, discount_amount, store_id, customer_id, promotion_id, transaction_date)
SELECT 
  p.product_sku,
  p.product_name,
  (random() * 10 + 1)::int as quantity,
  p.base_price as unit_price,
  p.base_price * (random() * 10 + 1)::int as total_amount,
  p.base_price * 0.15 * (random() * 10 + 1)::int as discount_amount,
  s.id,
  c.id,
  nc.id,
  (NOW() - (random() * 90)::int * INTERVAL '1 day')::timestamp
FROM products p
CROSS JOIN store_id s
CROSS JOIN customer_id c
CROSS JOIN non_consumable_promo nc
WHERE p.category IN ('Personal Care', 'Home Care')
LIMIT 150;