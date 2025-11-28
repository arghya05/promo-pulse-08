-- Create stores table
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_code TEXT UNIQUE NOT NULL,
  store_name TEXT NOT NULL,
  location TEXT,
  region TEXT,
  store_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_name TEXT NOT NULL,
  promotion_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  discount_percent DECIMAL(5,2),
  discount_amount DECIMAL(10,2),
  product_category TEXT,
  product_sku TEXT,
  status TEXT DEFAULT 'active',
  total_spend DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date TIMESTAMPTZ NOT NULL,
  store_id UUID REFERENCES public.stores(id),
  promotion_id UUID REFERENCES public.promotions(id),
  product_sku TEXT NOT NULL,
  product_name TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  customer_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT UNIQUE NOT NULL,
  customer_name TEXT,
  email TEXT,
  phone TEXT,
  segment TEXT,
  loyalty_tier TEXT,
  total_lifetime_value DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create third_party_data table
CREATE TABLE IF NOT EXISTS public.third_party_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source TEXT NOT NULL,
  data_type TEXT NOT NULL,
  data_date DATE NOT NULL,
  product_category TEXT,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(12,2),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.third_party_data ENABLE ROW LEVEL SECURITY;

-- Create policies (public read for now - adjust based on your needs)
CREATE POLICY "Allow public read access to stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Allow public insert to stores" ON public.stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to stores" ON public.stores FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from stores" ON public.stores FOR DELETE USING (true);

CREATE POLICY "Allow public read access to promotions" ON public.promotions FOR SELECT USING (true);
CREATE POLICY "Allow public insert to promotions" ON public.promotions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to promotions" ON public.promotions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from promotions" ON public.promotions FOR DELETE USING (true);

CREATE POLICY "Allow public read access to transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert to transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to transactions" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from transactions" ON public.transactions FOR DELETE USING (true);

CREATE POLICY "Allow public read access to customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert to customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to customers" ON public.customers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from customers" ON public.customers FOR DELETE USING (true);

CREATE POLICY "Allow public read access to third_party_data" ON public.third_party_data FOR SELECT USING (true);
CREATE POLICY "Allow public insert to third_party_data" ON public.third_party_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to third_party_data" ON public.third_party_data FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from third_party_data" ON public.third_party_data FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_store ON public.transactions(store_id);
CREATE INDEX idx_transactions_promotion ON public.transactions(promotion_id);
CREATE INDEX idx_promotions_dates ON public.promotions(start_date, end_date);
CREATE INDEX idx_third_party_data_date ON public.third_party_data(data_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();