-- Create products table for detailed product information
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_sku TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  brand TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  margin_percent DECIMAL(5,2),
  price_elasticity DECIMAL(4,2),
  seasonality_factor TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create marketing_channels table for campaign channel tracking
CREATE TABLE IF NOT EXISTS public.marketing_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID REFERENCES public.promotions(id),
  channel_name TEXT NOT NULL,
  channel_type TEXT NOT NULL,
  spend_amount DECIMAL(12,2) NOT NULL,
  impressions INTEGER,
  clicks INTEGER,
  conversions INTEGER,
  reach INTEGER,
  engagement_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create competitor_data table for competitive intelligence
CREATE TABLE IF NOT EXISTS public.competitor_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_name TEXT NOT NULL,
  product_category TEXT NOT NULL,
  pricing_index DECIMAL(5,2),
  promotion_intensity TEXT,
  market_share_percent DECIMAL(5,2),
  observation_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create store_performance table for store-level metrics
CREATE TABLE IF NOT EXISTS public.store_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id),
  metric_date DATE NOT NULL,
  foot_traffic INTEGER,
  avg_basket_size DECIMAL(10,2),
  conversion_rate DECIMAL(5,2),
  total_sales DECIMAL(12,2),
  staff_count INTEGER,
  weather_condition TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create customer_journey table for touchpoint tracking
CREATE TABLE IF NOT EXISTS public.customer_journey (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id),
  promotion_id UUID REFERENCES public.promotions(id),
  touchpoint_type TEXT NOT NULL,
  touchpoint_date TIMESTAMPTZ NOT NULL,
  channel TEXT,
  action_taken TEXT,
  converted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create inventory_levels table for stock tracking
CREATE TABLE IF NOT EXISTS public.inventory_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id),
  product_sku TEXT NOT NULL,
  stock_level INTEGER NOT NULL,
  reorder_point INTEGER,
  stockout_risk TEXT,
  last_restocked DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_journey ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public access for demo)
CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert to products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from products" ON public.products FOR DELETE USING (true);

CREATE POLICY "Allow public read access to marketing_channels" ON public.marketing_channels FOR SELECT USING (true);
CREATE POLICY "Allow public insert to marketing_channels" ON public.marketing_channels FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to marketing_channels" ON public.marketing_channels FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from marketing_channels" ON public.marketing_channels FOR DELETE USING (true);

CREATE POLICY "Allow public read access to competitor_data" ON public.competitor_data FOR SELECT USING (true);
CREATE POLICY "Allow public insert to competitor_data" ON public.competitor_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to competitor_data" ON public.competitor_data FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from competitor_data" ON public.competitor_data FOR DELETE USING (true);

CREATE POLICY "Allow public read access to store_performance" ON public.store_performance FOR SELECT USING (true);
CREATE POLICY "Allow public insert to store_performance" ON public.store_performance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to store_performance" ON public.store_performance FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from store_performance" ON public.store_performance FOR DELETE USING (true);

CREATE POLICY "Allow public read access to customer_journey" ON public.customer_journey FOR SELECT USING (true);
CREATE POLICY "Allow public insert to customer_journey" ON public.customer_journey FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to customer_journey" ON public.customer_journey FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from customer_journey" ON public.customer_journey FOR DELETE USING (true);

CREATE POLICY "Allow public read access to inventory_levels" ON public.inventory_levels FOR SELECT USING (true);
CREATE POLICY "Allow public insert to inventory_levels" ON public.inventory_levels FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to inventory_levels" ON public.inventory_levels FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from inventory_levels" ON public.inventory_levels FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_brand ON public.products(brand);
CREATE INDEX idx_marketing_channels_promotion ON public.marketing_channels(promotion_id);
CREATE INDEX idx_competitor_data_date ON public.competitor_data(observation_date);
CREATE INDEX idx_store_performance_store ON public.store_performance(store_id);
CREATE INDEX idx_store_performance_date ON public.store_performance(metric_date);
CREATE INDEX idx_customer_journey_customer ON public.customer_journey(customer_id);
CREATE INDEX idx_customer_journey_promotion ON public.customer_journey(promotion_id);
CREATE INDEX idx_inventory_levels_store ON public.inventory_levels(store_id);

-- Add triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();