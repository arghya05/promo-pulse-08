
-- Clear existing data and insert realistic $4B retailer data
DELETE FROM transactions;
DELETE FROM customer_journey;
DELETE FROM marketing_channels;
DELETE FROM inventory_levels;
DELETE FROM store_performance;
DELETE FROM competitor_data;
DELETE FROM promotions;
DELETE FROM products;
DELETE FROM customers;
DELETE FROM stores;
DELETE FROM third_party_data;

-- Insert realistic stores (50 stores across US regions)
INSERT INTO stores (store_code, store_name, location, region, store_type) VALUES
-- Northeast Region (12 stores)
('NE001', 'Manhattan Flagship', 'New York, NY', 'Northeast', 'Flagship'),
('NE002', 'Brooklyn Heights', 'Brooklyn, NY', 'Northeast', 'Urban'),
('NE003', 'Boston Back Bay', 'Boston, MA', 'Northeast', 'Urban'),
('NE004', 'Philadelphia Center City', 'Philadelphia, PA', 'Northeast', 'Urban'),
('NE005', 'Newark Gateway', 'Newark, NJ', 'Northeast', 'Suburban'),
('NE006', 'Hartford Plaza', 'Hartford, CT', 'Northeast', 'Suburban'),
('NE007', 'Providence Place', 'Providence, RI', 'Northeast', 'Urban'),
('NE008', 'Albany Crossgates', 'Albany, NY', 'Northeast', 'Suburban'),
('NE009', 'Buffalo Galleria', 'Buffalo, NY', 'Northeast', 'Suburban'),
('NE010', 'Pittsburgh North Hills', 'Pittsburgh, PA', 'Northeast', 'Suburban'),
('NE011', 'Syracuse Destiny', 'Syracuse, NY', 'Northeast', 'Suburban'),
('NE012', 'Worcester Premium', 'Worcester, MA', 'Northeast', 'Suburban'),
-- Southeast Region (10 stores)
('SE001', 'Miami Beach', 'Miami, FL', 'Southeast', 'Urban'),
('SE002', 'Atlanta Buckhead', 'Atlanta, GA', 'Southeast', 'Urban'),
('SE003', 'Orlando International', 'Orlando, FL', 'Southeast', 'Suburban'),
('SE004', 'Charlotte SouthPark', 'Charlotte, NC', 'Southeast', 'Urban'),
('SE005', 'Tampa Bay', 'Tampa, FL', 'Southeast', 'Suburban'),
('SE006', 'Jacksonville Town Center', 'Jacksonville, FL', 'Southeast', 'Suburban'),
('SE007', 'Nashville Green Hills', 'Nashville, TN', 'Southeast', 'Urban'),
('SE008', 'Raleigh Triangle', 'Raleigh, NC', 'Southeast', 'Suburban'),
('SE009', 'Birmingham Summit', 'Birmingham, AL', 'Southeast', 'Suburban'),
('SE010', 'Richmond Short Pump', 'Richmond, VA', 'Southeast', 'Suburban'),
-- Midwest Region (10 stores)
('MW001', 'Chicago Michigan Ave', 'Chicago, IL', 'Midwest', 'Flagship'),
('MW002', 'Detroit Renaissance', 'Detroit, MI', 'Midwest', 'Urban'),
('MW003', 'Minneapolis Nicollet', 'Minneapolis, MN', 'Midwest', 'Urban'),
('MW004', 'Cleveland Beachwood', 'Cleveland, OH', 'Midwest', 'Suburban'),
('MW005', 'Indianapolis Circle Centre', 'Indianapolis, IN', 'Midwest', 'Urban'),
('MW006', 'Columbus Easton', 'Columbus, OH', 'Midwest', 'Suburban'),
('MW007', 'Milwaukee Mayfair', 'Milwaukee, WI', 'Midwest', 'Suburban'),
('MW008', 'St Louis Galleria', 'St. Louis, MO', 'Midwest', 'Suburban'),
('MW009', 'Kansas City Plaza', 'Kansas City, MO', 'Midwest', 'Urban'),
('MW010', 'Cincinnati Kenwood', 'Cincinnati, OH', 'Midwest', 'Suburban'),
-- Southwest Region (8 stores)
('SW001', 'Dallas NorthPark', 'Dallas, TX', 'Southwest', 'Flagship'),
('SW002', 'Houston Galleria', 'Houston, TX', 'Southwest', 'Urban'),
('SW003', 'Phoenix Scottsdale', 'Phoenix, AZ', 'Southwest', 'Urban'),
('SW004', 'San Antonio Riverwalk', 'San Antonio, TX', 'Southwest', 'Urban'),
('SW005', 'Austin Domain', 'Austin, TX', 'Southwest', 'Urban'),
('SW006', 'Denver Cherry Creek', 'Denver, CO', 'Southwest', 'Urban'),
('SW007', 'Las Vegas Forum', 'Las Vegas, NV', 'Southwest', 'Urban'),
('SW008', 'Albuquerque Coronado', 'Albuquerque, NM', 'Southwest', 'Suburban'),
-- West Region (10 stores)
('WE001', 'Los Angeles Beverly Center', 'Los Angeles, CA', 'West', 'Flagship'),
('WE002', 'San Francisco Union Square', 'San Francisco, CA', 'West', 'Urban'),
('WE003', 'Seattle Bellevue', 'Seattle, WA', 'West', 'Urban'),
('WE004', 'San Diego Fashion Valley', 'San Diego, CA', 'West', 'Urban'),
('WE005', 'Portland Pioneer', 'Portland, OR', 'West', 'Urban'),
('WE006', 'Sacramento Arden', 'Sacramento, CA', 'West', 'Suburban'),
('WE007', 'San Jose Valley Fair', 'San Jose, CA', 'West', 'Urban'),
('WE008', 'Honolulu Ala Moana', 'Honolulu, HI', 'West', 'Urban'),
('WE009', 'Irvine Spectrum', 'Irvine, CA', 'West', 'Suburban'),
('WE010', 'Fresno River Park', 'Fresno, CA', 'West', 'Suburban');

-- Insert realistic products (150+ SKUs across categories)
-- Consumables - Dairy
INSERT INTO products (product_sku, product_name, category, subcategory, brand, base_price, cost, margin_percent, price_elasticity, seasonality_factor) VALUES
('DAI-001', 'Organic Whole Milk 1 Gallon', 'Dairy', 'Milk', 'Horizon Organic', 6.99, 4.19, 40.0, -1.8, 'stable'),
('DAI-002', '2% Reduced Fat Milk 1 Gallon', 'Dairy', 'Milk', 'Store Brand', 4.29, 2.57, 40.0, -2.1, 'stable'),
('DAI-003', 'Greek Yogurt Variety Pack 12ct', 'Dairy', 'Yogurt', 'Chobani', 12.99, 7.79, 40.0, -1.5, 'stable'),
('DAI-004', 'Sharp Cheddar Cheese 2lb Block', 'Dairy', 'Cheese', 'Tillamook', 14.99, 8.99, 40.0, -1.3, 'holiday'),
('DAI-005', 'Butter Unsalted 1lb', 'Dairy', 'Butter', 'Land O Lakes', 5.49, 3.29, 40.0, -1.6, 'holiday'),
('DAI-006', 'Heavy Whipping Cream 1 Pint', 'Dairy', 'Cream', 'Store Brand', 4.99, 2.99, 40.0, -1.4, 'holiday'),
('DAI-007', 'Cottage Cheese Low Fat 24oz', 'Dairy', 'Cheese', 'Daisy', 5.29, 3.17, 40.0, -1.7, 'stable'),
('DAI-008', 'Cream Cheese Original 8oz', 'Dairy', 'Cheese', 'Philadelphia', 3.99, 2.39, 40.0, -1.5, 'holiday'),
-- Consumables - Produce
('PRO-001', 'Organic Bananas per lb', 'Produce', 'Fruit', 'Dole Organic', 0.79, 0.39, 50.6, -2.5, 'stable'),
('PRO-002', 'Avocados Hass 4 Pack', 'Produce', 'Fruit', 'Mission', 5.99, 2.99, 50.0, -1.8, 'summer'),
('PRO-003', 'Baby Spinach 16oz Clamshell', 'Produce', 'Vegetables', 'Organic Girl', 5.99, 3.59, 40.0, -1.6, 'stable'),
('PRO-004', 'Strawberries 2lb Clamshell', 'Produce', 'Fruit', 'Driscoll', 7.99, 4.79, 40.0, -2.0, 'summer'),
('PRO-005', 'Russet Potatoes 5lb Bag', 'Produce', 'Vegetables', 'Idaho', 4.99, 2.49, 50.0, -2.2, 'stable'),
('PRO-006', 'Roma Tomatoes per lb', 'Produce', 'Vegetables', 'Local Farm', 2.49, 1.24, 50.0, -2.0, 'summer'),
('PRO-007', 'Lemons 2lb Bag', 'Produce', 'Fruit', 'Sunkist', 4.49, 2.24, 50.0, -1.9, 'stable'),
('PRO-008', 'Organic Baby Carrots 2lb', 'Produce', 'Vegetables', 'Bolthouse', 4.29, 2.57, 40.0, -1.7, 'stable'),
-- Consumables - Beverages
('BEV-001', 'Coca-Cola 12 Pack 12oz Cans', 'Beverages', 'Soft Drinks', 'Coca-Cola', 7.99, 4.79, 40.0, -1.4, 'summer'),
('BEV-002', 'Pepsi 12 Pack 12oz Cans', 'Beverages', 'Soft Drinks', 'PepsiCo', 7.99, 4.79, 40.0, -1.4, 'summer'),
('BEV-003', 'Poland Spring Water 24 Pack', 'Beverages', 'Water', 'Nestle', 5.99, 2.99, 50.0, -2.3, 'summer'),
('BEV-004', 'Orange Juice Premium 52oz', 'Beverages', 'Juice', 'Tropicana', 5.49, 3.29, 40.0, -1.6, 'stable'),
('BEV-005', 'Coffee Ground Medium Roast 12oz', 'Beverages', 'Coffee', 'Starbucks', 9.99, 5.99, 40.0, -1.2, 'stable'),
('BEV-006', 'Green Tea 20 Bags', 'Beverages', 'Tea', 'Lipton', 4.29, 2.57, 40.0, -1.5, 'stable'),
('BEV-007', 'Energy Drink 4 Pack', 'Beverages', 'Energy', 'Red Bull', 9.99, 5.99, 40.0, -1.1, 'stable'),
('BEV-008', 'Almond Milk Unsweetened 64oz', 'Beverages', 'Plant Milk', 'Silk', 4.99, 2.99, 40.0, -1.6, 'stable'),
-- Consumables - Snacks
('SNK-001', 'Potato Chips Classic 10oz', 'Snacks', 'Chips', 'Lays', 4.99, 2.49, 50.0, -1.8, 'summer'),
('SNK-002', 'Doritos Nacho Cheese 11oz', 'Snacks', 'Chips', 'Frito-Lay', 5.49, 2.74, 50.0, -1.6, 'stable'),
('SNK-003', 'Oreo Cookies Original 14.3oz', 'Snacks', 'Cookies', 'Nabisco', 5.29, 2.64, 50.0, -1.5, 'stable'),
('SNK-004', 'Mixed Nuts Deluxe 16oz', 'Snacks', 'Nuts', 'Planters', 12.99, 7.79, 40.0, -1.3, 'holiday'),
('SNK-005', 'Granola Bars Variety 12ct', 'Snacks', 'Bars', 'Nature Valley', 4.99, 2.99, 40.0, -1.7, 'stable'),
('SNK-006', 'Pretzels Twists 16oz', 'Snacks', 'Pretzels', 'Snyder', 4.49, 2.24, 50.0, -1.9, 'stable'),
('SNK-007', 'Trail Mix 26oz', 'Snacks', 'Nuts', 'Kirkland', 11.99, 7.19, 40.0, -1.4, 'stable'),
('SNK-008', 'Popcorn Microwave 6 Pack', 'Snacks', 'Popcorn', 'Orville', 5.99, 2.99, 50.0, -1.8, 'stable'),
-- Consumables - Bakery
('BAK-001', 'White Bread Sliced 20oz', 'Bakery', 'Bread', 'Wonder', 3.99, 1.99, 50.0, -2.0, 'stable'),
('BAK-002', 'Whole Wheat Bread 24oz', 'Bakery', 'Bread', 'Arnolds', 4.49, 2.24, 50.0, -1.8, 'stable'),
('BAK-003', 'Bagels Plain 6ct', 'Bakery', 'Bagels', 'Thomas', 4.99, 2.49, 50.0, -1.7, 'stable'),
('BAK-004', 'Croissants Butter 4ct', 'Bakery', 'Pastry', 'La Boulangerie', 5.99, 2.99, 50.0, -1.5, 'stable'),
('BAK-005', 'Tortillas Flour 10ct', 'Bakery', 'Tortillas', 'Mission', 3.99, 1.99, 50.0, -1.9, 'stable'),
('BAK-006', 'English Muffins 6ct', 'Bakery', 'Bread', 'Thomas', 4.49, 2.24, 50.0, -1.7, 'stable'),
('BAK-007', 'Hamburger Buns 8ct', 'Bakery', 'Buns', 'Store Brand', 3.49, 1.74, 50.0, -2.1, 'summer'),
('BAK-008', 'Dinner Rolls 12ct', 'Bakery', 'Rolls', 'Kings Hawaiian', 4.99, 2.49, 50.0, -1.6, 'holiday'),
-- Consumables - Pantry
('PAN-001', 'Pasta Spaghetti 16oz', 'Pantry', 'Pasta', 'Barilla', 2.29, 1.14, 50.0, -2.2, 'stable'),
('PAN-002', 'Marinara Sauce 24oz', 'Pantry', 'Sauces', 'Raos', 8.99, 5.39, 40.0, -1.4, 'stable'),
('PAN-003', 'Olive Oil Extra Virgin 17oz', 'Pantry', 'Oils', 'Bertolli', 9.99, 5.99, 40.0, -1.3, 'stable'),
('PAN-004', 'Rice Long Grain 5lb', 'Pantry', 'Grains', 'Uncle Bens', 6.99, 3.49, 50.0, -2.0, 'stable'),
('PAN-005', 'Cereal Cheerios 18oz', 'Pantry', 'Cereal', 'General Mills', 5.99, 2.99, 50.0, -1.6, 'stable'),
('PAN-006', 'Peanut Butter Creamy 16oz', 'Pantry', 'Spreads', 'Jif', 4.49, 2.24, 50.0, -1.7, 'stable'),
('PAN-007', 'Canned Tomatoes Diced 28oz', 'Pantry', 'Canned Goods', 'Hunt', 2.49, 1.24, 50.0, -2.1, 'stable'),
('PAN-008', 'Chicken Broth 32oz', 'Pantry', 'Broth', 'Swanson', 3.49, 1.74, 50.0, -1.9, 'stable'),
-- Consumables - Frozen
('FRZ-001', 'Ice Cream Vanilla 1.5qt', 'Frozen', 'Ice Cream', 'Haagen-Dazs', 7.99, 4.79, 40.0, -1.5, 'summer'),
('FRZ-002', 'Frozen Pizza Pepperoni', 'Frozen', 'Pizza', 'DiGiorno', 8.99, 5.39, 40.0, -1.4, 'stable'),
('FRZ-003', 'Frozen Vegetables Mixed 32oz', 'Frozen', 'Vegetables', 'Birds Eye', 4.99, 2.99, 40.0, -1.8, 'stable'),
('FRZ-004', 'Chicken Nuggets 32oz', 'Frozen', 'Poultry', 'Tyson', 11.99, 7.19, 40.0, -1.5, 'stable'),
('FRZ-005', 'Frozen Waffles 10ct', 'Frozen', 'Breakfast', 'Eggo', 4.49, 2.69, 40.0, -1.7, 'stable'),
('FRZ-006', 'Fish Sticks 24ct', 'Frozen', 'Seafood', 'Gortons', 8.99, 5.39, 40.0, -1.6, 'stable'),
('FRZ-007', 'Frozen Fruit Blend 48oz', 'Frozen', 'Fruit', 'Dole', 9.99, 5.99, 40.0, -1.5, 'stable'),
('FRZ-008', 'Frozen Burritos 8ct', 'Frozen', 'Mexican', 'El Monterey', 7.99, 4.79, 40.0, -1.6, 'stable'),
-- Non-Consumables - Personal Care
('PER-001', 'Shampoo Daily Moisture 28oz', 'Personal Care', 'Hair Care', 'Pantene', 8.99, 4.49, 50.0, -1.4, 'stable'),
('PER-002', 'Conditioner Repair 28oz', 'Personal Care', 'Hair Care', 'TRESemme', 7.99, 3.99, 50.0, -1.4, 'stable'),
('PER-003', 'Body Wash Original 18oz', 'Personal Care', 'Body Care', 'Dove', 7.49, 3.74, 50.0, -1.5, 'stable'),
('PER-004', 'Deodorant Antiperspirant 2.6oz', 'Personal Care', 'Deodorant', 'Degree', 6.99, 3.49, 50.0, -1.3, 'stable'),
('PER-005', 'Toothpaste Whitening 6oz', 'Personal Care', 'Oral Care', 'Crest', 5.99, 2.99, 50.0, -1.5, 'stable'),
('PER-006', 'Razors Disposable 12ct', 'Personal Care', 'Shaving', 'Gillette', 14.99, 7.49, 50.0, -1.2, 'stable'),
('PER-007', 'Lotion Body 21oz', 'Personal Care', 'Skin Care', 'Jergens', 8.49, 4.24, 50.0, -1.4, 'stable'),
('PER-008', 'Hand Soap Liquid 11.25oz', 'Personal Care', 'Hand Care', 'Softsoap', 3.99, 1.99, 50.0, -1.8, 'stable'),
('PER-009', 'Facial Cleanser 6oz', 'Personal Care', 'Skin Care', 'Cetaphil', 12.99, 6.49, 50.0, -1.2, 'stable'),
('PER-010', 'Sunscreen SPF50 8oz', 'Personal Care', 'Sun Care', 'Coppertone', 11.99, 5.99, 50.0, -1.3, 'summer'),
('PER-011', 'Hair Gel Strong Hold 8oz', 'Personal Care', 'Hair Care', 'Got2b', 6.99, 3.49, 50.0, -1.5, 'stable'),
('PER-012', 'Mouthwash Antiseptic 1L', 'Personal Care', 'Oral Care', 'Listerine', 8.49, 4.24, 50.0, -1.4, 'stable'),
-- Non-Consumables - Home Care
('HOM-001', 'Laundry Detergent 100oz', 'Home Care', 'Laundry', 'Tide', 14.99, 7.49, 50.0, -1.3, 'stable'),
('HOM-002', 'Dish Soap Liquid 19.4oz', 'Home Care', 'Dish Care', 'Dawn', 4.49, 2.24, 50.0, -1.7, 'stable'),
('HOM-003', 'All Purpose Cleaner 32oz', 'Home Care', 'Cleaning', 'Lysol', 5.99, 2.99, 50.0, -1.5, 'stable'),
('HOM-004', 'Paper Towels 6 Mega Rolls', 'Home Care', 'Paper Products', 'Bounty', 18.99, 9.49, 50.0, -1.4, 'stable'),
('HOM-005', 'Toilet Paper 12 Double Rolls', 'Home Care', 'Paper Products', 'Charmin', 15.99, 7.99, 50.0, -1.5, 'stable'),
('HOM-006', 'Trash Bags 13 Gallon 80ct', 'Home Care', 'Bags', 'Glad', 14.99, 7.49, 50.0, -1.4, 'stable'),
('HOM-007', 'Glass Cleaner 26oz', 'Home Care', 'Cleaning', 'Windex', 4.99, 2.49, 50.0, -1.6, 'stable'),
('HOM-008', 'Disinfecting Wipes 75ct', 'Home Care', 'Cleaning', 'Clorox', 6.99, 3.49, 50.0, -1.4, 'stable'),
('HOM-009', 'Fabric Softener 103oz', 'Home Care', 'Laundry', 'Downy', 11.99, 5.99, 50.0, -1.4, 'stable'),
('HOM-010', 'Dryer Sheets 240ct', 'Home Care', 'Laundry', 'Bounce', 9.99, 4.99, 50.0, -1.5, 'stable'),
('HOM-011', 'Aluminum Foil 200 sq ft', 'Home Care', 'Kitchen Supplies', 'Reynolds', 12.99, 6.49, 50.0, -1.4, 'stable'),
('HOM-012', 'Plastic Wrap 400 sq ft', 'Home Care', 'Kitchen Supplies', 'Saran', 8.99, 4.49, 50.0, -1.5, 'stable');

-- Insert realistic customers (5000 customers for $4B retailer)
INSERT INTO customers (customer_code, customer_name, email, phone, segment, loyalty_tier, total_lifetime_value)
SELECT 
  'CUST-' || LPAD(generate_series::text, 6, '0'),
  CASE (generate_series % 20)
    WHEN 0 THEN 'John Smith' WHEN 1 THEN 'Maria Garcia' WHEN 2 THEN 'James Johnson'
    WHEN 3 THEN 'Jennifer Williams' WHEN 4 THEN 'Michael Brown' WHEN 5 THEN 'Linda Davis'
    WHEN 6 THEN 'Robert Miller' WHEN 7 THEN 'Patricia Wilson' WHEN 8 THEN 'David Moore'
    WHEN 9 THEN 'Elizabeth Taylor' WHEN 10 THEN 'William Anderson' WHEN 11 THEN 'Barbara Thomas'
    WHEN 12 THEN 'Richard Jackson' WHEN 13 THEN 'Susan White' WHEN 14 THEN 'Joseph Harris'
    WHEN 15 THEN 'Jessica Martin' WHEN 16 THEN 'Thomas Thompson' WHEN 17 THEN 'Sarah Garcia'
    WHEN 18 THEN 'Christopher Martinez' ELSE 'Amanda Robinson'
  END,
  'customer' || generate_series || '@email.com',
  '+1-' || (200 + (generate_series % 800))::text || '-' || LPAD((generate_series % 10000)::text, 4, '0'),
  CASE 
    WHEN random() < 0.15 THEN 'Premium'
    WHEN random() < 0.35 THEN 'Regular'
    WHEN random() < 0.65 THEN 'Occasional'
    ELSE 'New'
  END,
  CASE 
    WHEN random() < 0.05 THEN 'Platinum'
    WHEN random() < 0.15 THEN 'Gold'
    WHEN random() < 0.40 THEN 'Silver'
    ELSE 'Bronze'
  END,
  ROUND((random() * 15000 + 500)::numeric, 2)
FROM generate_series(1, 5000);
