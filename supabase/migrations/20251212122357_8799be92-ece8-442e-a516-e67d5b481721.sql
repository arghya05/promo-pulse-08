-- =============================================
-- PRICING MODULE TABLES
-- =============================================

-- Price change history - tracks all price modifications
CREATE TABLE public.price_change_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_sku TEXT NOT NULL,
  old_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  change_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  change_reason TEXT,
  change_type TEXT DEFAULT 'regular', -- regular, promotional, markdown, cost-driven
  approved_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Competitor price tracking - detailed competitor pricing
CREATE TABLE public.competitor_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_sku TEXT NOT NULL,
  competitor_name TEXT NOT NULL,
  competitor_price NUMERIC NOT NULL,
  our_price NUMERIC NOT NULL,
  price_gap_percent NUMERIC,
  observation_date DATE NOT NULL,
  source TEXT DEFAULT 'manual', -- manual, scraper, third-party
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- SUPPLY CHAIN MODULE TABLES
-- =============================================

-- Suppliers master data
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_code TEXT NOT NULL UNIQUE,
  supplier_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'USA',
  lead_time_days INTEGER NOT NULL DEFAULT 7,
  reliability_score NUMERIC DEFAULT 0.95,
  payment_terms TEXT DEFAULT 'Net 30',
  minimum_order_value NUMERIC,
  preferred_carrier TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Supplier orders / Purchase orders
CREATE TABLE public.supplier_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id),
  product_sku TEXT NOT NULL,
  order_date DATE NOT NULL,
  expected_delivery_date DATE NOT NULL,
  actual_delivery_date DATE,
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC NOT NULL,
  total_cost NUMERIC,
  status TEXT DEFAULT 'pending', -- pending, shipped, delivered, delayed, cancelled
  on_time BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Shipping routes / Distribution network
CREATE TABLE public.shipping_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_name TEXT NOT NULL,
  origin_location TEXT NOT NULL,
  destination_location TEXT NOT NULL,
  origin_store_id UUID REFERENCES public.stores(id),
  destination_store_id UUID REFERENCES public.stores(id),
  distance_miles NUMERIC NOT NULL,
  avg_transit_time_hours NUMERIC NOT NULL,
  transportation_mode TEXT DEFAULT 'truck', -- truck, rail, air, ocean
  cost_per_mile NUMERIC,
  carbon_footprint_kg NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- SPACE PLANNING MODULE TABLES
-- =============================================

-- Planograms - shelf layout definitions
CREATE TABLE public.planograms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  planogram_name TEXT NOT NULL,
  planogram_code TEXT UNIQUE,
  category TEXT NOT NULL,
  subcategory TEXT,
  store_type TEXT DEFAULT 'standard', -- standard, express, superstore
  shelf_count INTEGER NOT NULL DEFAULT 5,
  total_width_inches NUMERIC NOT NULL DEFAULT 48,
  total_height_inches NUMERIC NOT NULL DEFAULT 72,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active', -- draft, active, archived
  effective_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Shelf allocations - product placement on planograms
CREATE TABLE public.shelf_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  planogram_id UUID REFERENCES public.planograms(id),
  product_sku TEXT NOT NULL,
  shelf_number INTEGER NOT NULL,
  position_from_left NUMERIC NOT NULL,
  facings INTEGER NOT NULL DEFAULT 1,
  width_inches NUMERIC NOT NULL,
  height_inches NUMERIC NOT NULL,
  depth_inches NUMERIC,
  sales_per_sqft NUMERIC,
  is_eye_level BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Store fixtures - physical fixtures in stores
CREATE TABLE public.fixtures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id),
  fixture_code TEXT NOT NULL,
  fixture_type TEXT NOT NULL, -- gondola, endcap, cooler, freezer, checkout, island
  location_in_store TEXT, -- aisle 1, front, back, entrance
  aisle_number INTEGER,
  width_inches NUMERIC NOT NULL,
  height_inches NUMERIC NOT NULL,
  depth_inches NUMERIC NOT NULL,
  capacity_sqft NUMERIC,
  assigned_category TEXT,
  status TEXT DEFAULT 'active', -- active, maintenance, retired
  installed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- DEMAND FORECASTING MODULE TABLES
-- =============================================

-- Demand forecasts - historical and current forecasts
CREATE TABLE public.demand_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_sku TEXT NOT NULL,
  store_id UUID REFERENCES public.stores(id),
  forecast_date DATE NOT NULL, -- when forecast was made
  forecast_period_start DATE NOT NULL, -- period being forecasted
  forecast_period_end DATE NOT NULL,
  forecasted_units INTEGER NOT NULL,
  actual_units INTEGER, -- filled in after period ends
  forecast_accuracy NUMERIC, -- calculated after actuals available
  forecast_model TEXT DEFAULT 'ensemble', -- ensemble, arima, prophet, ml
  confidence_interval_low INTEGER,
  confidence_interval_high INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Forecast accuracy tracking - aggregate accuracy metrics
CREATE TABLE public.forecast_accuracy_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_date DATE NOT NULL,
  category TEXT,
  store_id UUID REFERENCES public.stores(id),
  mape NUMERIC NOT NULL, -- Mean Absolute Percentage Error
  bias NUMERIC, -- systematic over/under forecasting
  rmse NUMERIC, -- Root Mean Square Error
  forecast_model TEXT,
  sample_size INTEGER, -- number of SKUs in calculation
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- ENABLE RLS ON ALL NEW TABLES
-- =============================================
ALTER TABLE public.price_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planograms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelf_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_accuracy_tracking ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREATE PUBLIC READ/WRITE POLICIES (demo app)
-- =============================================

-- Price change history policies
CREATE POLICY "Allow public read access to price_change_history" ON public.price_change_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert to price_change_history" ON public.price_change_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to price_change_history" ON public.price_change_history FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from price_change_history" ON public.price_change_history FOR DELETE USING (true);

-- Competitor prices policies
CREATE POLICY "Allow public read access to competitor_prices" ON public.competitor_prices FOR SELECT USING (true);
CREATE POLICY "Allow public insert to competitor_prices" ON public.competitor_prices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to competitor_prices" ON public.competitor_prices FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from competitor_prices" ON public.competitor_prices FOR DELETE USING (true);

-- Suppliers policies
CREATE POLICY "Allow public read access to suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Allow public insert to suppliers" ON public.suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to suppliers" ON public.suppliers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from suppliers" ON public.suppliers FOR DELETE USING (true);

-- Supplier orders policies
CREATE POLICY "Allow public read access to supplier_orders" ON public.supplier_orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert to supplier_orders" ON public.supplier_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to supplier_orders" ON public.supplier_orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from supplier_orders" ON public.supplier_orders FOR DELETE USING (true);

-- Shipping routes policies
CREATE POLICY "Allow public read access to shipping_routes" ON public.shipping_routes FOR SELECT USING (true);
CREATE POLICY "Allow public insert to shipping_routes" ON public.shipping_routes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to shipping_routes" ON public.shipping_routes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from shipping_routes" ON public.shipping_routes FOR DELETE USING (true);

-- Planograms policies
CREATE POLICY "Allow public read access to planograms" ON public.planograms FOR SELECT USING (true);
CREATE POLICY "Allow public insert to planograms" ON public.planograms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to planograms" ON public.planograms FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from planograms" ON public.planograms FOR DELETE USING (true);

-- Shelf allocations policies
CREATE POLICY "Allow public read access to shelf_allocations" ON public.shelf_allocations FOR SELECT USING (true);
CREATE POLICY "Allow public insert to shelf_allocations" ON public.shelf_allocations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to shelf_allocations" ON public.shelf_allocations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from shelf_allocations" ON public.shelf_allocations FOR DELETE USING (true);

-- Fixtures policies
CREATE POLICY "Allow public read access to fixtures" ON public.fixtures FOR SELECT USING (true);
CREATE POLICY "Allow public insert to fixtures" ON public.fixtures FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to fixtures" ON public.fixtures FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from fixtures" ON public.fixtures FOR DELETE USING (true);

-- Demand forecasts policies
CREATE POLICY "Allow public read access to demand_forecasts" ON public.demand_forecasts FOR SELECT USING (true);
CREATE POLICY "Allow public insert to demand_forecasts" ON public.demand_forecasts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to demand_forecasts" ON public.demand_forecasts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from demand_forecasts" ON public.demand_forecasts FOR DELETE USING (true);

-- Forecast accuracy tracking policies
CREATE POLICY "Allow public read access to forecast_accuracy_tracking" ON public.forecast_accuracy_tracking FOR SELECT USING (true);
CREATE POLICY "Allow public insert to forecast_accuracy_tracking" ON public.forecast_accuracy_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to forecast_accuracy_tracking" ON public.forecast_accuracy_tracking FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from forecast_accuracy_tracking" ON public.forecast_accuracy_tracking FOR DELETE USING (true);

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_price_change_history_sku ON public.price_change_history(product_sku);
CREATE INDEX idx_price_change_history_date ON public.price_change_history(change_date);
CREATE INDEX idx_competitor_prices_sku ON public.competitor_prices(product_sku);
CREATE INDEX idx_competitor_prices_competitor ON public.competitor_prices(competitor_name);
CREATE INDEX idx_supplier_orders_supplier ON public.supplier_orders(supplier_id);
CREATE INDEX idx_supplier_orders_status ON public.supplier_orders(status);
CREATE INDEX idx_shelf_allocations_planogram ON public.shelf_allocations(planogram_id);
CREATE INDEX idx_shelf_allocations_sku ON public.shelf_allocations(product_sku);
CREATE INDEX idx_fixtures_store ON public.fixtures(store_id);
CREATE INDEX idx_demand_forecasts_sku ON public.demand_forecasts(product_sku);
CREATE INDEX idx_demand_forecasts_store ON public.demand_forecasts(store_id);
CREATE INDEX idx_forecast_accuracy_date ON public.forecast_accuracy_tracking(tracking_date);