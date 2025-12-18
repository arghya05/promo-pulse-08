
-- =====================================================
-- ALGONOMY MERCHANDISE ANALYTICS METADATA ALIGNMENT
-- Adding missing dimensions, hierarchies, and attributes
-- =====================================================

-- 1. ENHANCE PRODUCTS TABLE with missing hierarchy and attributes
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS class text,
ADD COLUMN IF NOT EXISTS sub_class text,
ADD COLUMN IF NOT EXISTS product_type text,
ADD COLUMN IF NOT EXISTS manufacturer text,
ADD COLUMN IF NOT EXISTS sku_status text DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS never_out_flag boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS brand_type text DEFAULT 'National',
ADD COLUMN IF NOT EXISTS ean text,
ADD COLUMN IF NOT EXISTS selling_uom text DEFAULT 'Each',
ADD COLUMN IF NOT EXISTS buying_uom text DEFAULT 'Case',
ADD COLUMN IF NOT EXISTS introduction_date date,
ADD COLUMN IF NOT EXISTS product_height numeric,
ADD COLUMN IF NOT EXISTS product_width numeric,
ADD COLUMN IF NOT EXISTS product_depth numeric,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS style text,
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS size text,
ADD COLUMN IF NOT EXISTS brand_group text,
ADD COLUMN IF NOT EXISTS variant text,
ADD COLUMN IF NOT EXISTS merchandise_flag boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS outright_concession_flag text DEFAULT 'Outright';

-- 2. ENHANCE STORES TABLE with geo hierarchy and attributes
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS country text DEFAULT 'USA',
ADD COLUMN IF NOT EXISTS sector text,
ADD COLUMN IF NOT EXISTS district text,
ADD COLUMN IF NOT EXISTS channel_group text DEFAULT 'Retail',
ADD COLUMN IF NOT EXISTS channel_description text DEFAULT 'Physical Store',
ADD COLUMN IF NOT EXISTS store_format text DEFAULT 'Supermarket',
ADD COLUMN IF NOT EXISTS comp_status text DEFAULT 'Comparable',
ADD COLUMN IF NOT EXISTS store_group text,
ADD COLUMN IF NOT EXISTS opening_hours time DEFAULT '07:00:00',
ADD COLUMN IF NOT EXISTS closing_hours time DEFAULT '22:00:00',
ADD COLUMN IF NOT EXISTS store_size_sqft numeric;

-- 3. ENHANCE CUSTOMERS TABLE with missing attributes
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS member_type text DEFAULT 'Regular',
ADD COLUMN IF NOT EXISTS customer_group text,
ADD COLUMN IF NOT EXISTS income_band text,
ADD COLUMN IF NOT EXISTS age_band text,
ADD COLUMN IF NOT EXISTS marital_status text,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS customer_country text DEFAULT 'USA',
ADD COLUMN IF NOT EXISTS customer_region text,
ADD COLUMN IF NOT EXISTS customer_sector text,
ADD COLUMN IF NOT EXISTS customer_city text;

-- 4. ENHANCE TRANSACTIONS TABLE with missing measures
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_sales numeric,
ADD COLUMN IF NOT EXISTS return_flag boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS discount_type text,
ADD COLUMN IF NOT EXISTS cost_of_goods_sold numeric,
ADD COLUMN IF NOT EXISTS margin numeric;

-- 5. ENHANCE PROMOTIONS TABLE with missing attributes
ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS running_promo boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS promo_mechanism text,
ADD COLUMN IF NOT EXISTS target_segment text,
ADD COLUMN IF NOT EXISTS channel text DEFAULT 'All';

-- 6. CREATE TIME DIMENSION TABLE
CREATE TABLE IF NOT EXISTS public.time_dimension (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_value date NOT NULL UNIQUE,
  year integer NOT NULL,
  quarter integer NOT NULL,
  quarter_name text NOT NULL,
  period integer NOT NULL,
  period_name text NOT NULL,
  week integer NOT NULL,
  week_name text NOT NULL,
  day_of_week integer NOT NULL,
  day_name text NOT NULL,
  day_type text NOT NULL,
  fiscal_year integer,
  fiscal_quarter integer,
  is_holiday boolean DEFAULT false,
  holiday_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.time_dimension ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to time_dimension" ON public.time_dimension FOR SELECT USING (true);
CREATE POLICY "Allow public insert to time_dimension" ON public.time_dimension FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to time_dimension" ON public.time_dimension FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from time_dimension" ON public.time_dimension FOR DELETE USING (true);

-- 7. CREATE ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_code text NOT NULL,
  customer_id uuid REFERENCES public.customers(id),
  store_id uuid REFERENCES public.stores(id),
  order_date timestamp with time zone NOT NULL DEFAULT now(),
  order_status text DEFAULT 'Pending',
  cancel_reason text,
  close_reason text,
  order_age_days integer,
  order_age_band text,
  total_amount numeric NOT NULL DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  net_amount numeric,
  delivery_type text DEFAULT 'In-Store Pickup',
  delivery_partner text,
  delivery_country text,
  delivery_region text,
  delivery_city text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert to orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from orders" ON public.orders FOR DELETE USING (true);

-- 8. CREATE ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_sku text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  discount_amount numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to order_items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert to order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to order_items" ON public.order_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from order_items" ON public.order_items FOR DELETE USING (true);

-- 9. CREATE RETURNS TABLE
CREATE TABLE IF NOT EXISTS public.returns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_code text NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  customer_id uuid REFERENCES public.customers(id),
  store_id uuid REFERENCES public.stores(id),
  product_sku text NOT NULL,
  return_date timestamp with time zone NOT NULL DEFAULT now(),
  return_type text NOT NULL,
  return_reason text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  refund_amount numeric NOT NULL,
  restocking_fee numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to returns" ON public.returns FOR SELECT USING (true);
CREATE POLICY "Allow public insert to returns" ON public.returns FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to returns" ON public.returns FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from returns" ON public.returns FOR DELETE USING (true);

-- 10. CREATE MARKDOWNS TABLE
CREATE TABLE IF NOT EXISTS public.markdowns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  markdown_code text NOT NULL,
  product_sku text NOT NULL,
  store_id uuid REFERENCES public.stores(id),
  markdown_type text NOT NULL,
  markdown_reason text NOT NULL,
  original_price numeric NOT NULL,
  markdown_price numeric NOT NULL,
  markdown_percent numeric,
  effective_date date NOT NULL,
  end_date date,
  status text DEFAULT 'Active',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.markdowns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to markdowns" ON public.markdowns FOR SELECT USING (true);
CREATE POLICY "Allow public insert to markdowns" ON public.markdowns FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to markdowns" ON public.markdowns FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from markdowns" ON public.markdowns FOR DELETE USING (true);

-- 11. CREATE DISCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.discounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discount_code text NOT NULL,
  discount_name text NOT NULL,
  discount_type text NOT NULL,
  discount_value numeric NOT NULL,
  discount_percent numeric,
  min_purchase_amount numeric,
  max_discount_amount numeric,
  applicable_categories text[],
  applicable_skus text[],
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'Active',
  usage_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to discounts" ON public.discounts FOR SELECT USING (true);
CREATE POLICY "Allow public insert to discounts" ON public.discounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to discounts" ON public.discounts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from discounts" ON public.discounts FOR DELETE USING (true);

-- 12. CREATE EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_code text NOT NULL UNIQUE,
  employee_name text NOT NULL,
  employee_type text NOT NULL,
  department text,
  store_id uuid REFERENCES public.stores(id),
  hire_date date,
  status text DEFAULT 'Active',
  hourly_rate numeric,
  sales_target numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Allow public insert to employees" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to employees" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from employees" ON public.employees FOR DELETE USING (true);

-- 13. CREATE PRICE BANDS TABLE
CREATE TABLE IF NOT EXISTS public.price_bands (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  price_department text NOT NULL,
  price_band text NOT NULL,
  price_point_low numeric NOT NULL,
  price_point_high numeric NOT NULL,
  band_description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.price_bands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to price_bands" ON public.price_bands FOR SELECT USING (true);
CREATE POLICY "Allow public insert to price_bands" ON public.price_bands FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to price_bands" ON public.price_bands FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from price_bands" ON public.price_bands FOR DELETE USING (true);

-- 14. CREATE VENDORS TABLE (distinct from suppliers)
CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_code text NOT NULL UNIQUE,
  vendor_name text NOT NULL,
  vendor_country text DEFAULT 'USA',
  vendor_type text,
  contact_name text,
  contact_email text,
  contact_phone text,
  payment_terms text DEFAULT 'Net 30',
  credit_limit numeric,
  rating numeric,
  status text DEFAULT 'Active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to vendors" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Allow public insert to vendors" ON public.vendors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to vendors" ON public.vendors FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from vendors" ON public.vendors FOR DELETE USING (true);

-- 15. CREATE PURCHASE ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number text NOT NULL UNIQUE,
  vendor_id uuid REFERENCES public.vendors(id),
  store_id uuid REFERENCES public.stores(id),
  order_date date NOT NULL,
  expected_delivery_date date NOT NULL,
  actual_delivery_date date,
  total_amount numeric NOT NULL,
  status text DEFAULT 'Pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to purchase_orders" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert to purchase_orders" ON public.purchase_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to purchase_orders" ON public.purchase_orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from purchase_orders" ON public.purchase_orders FOR DELETE USING (true);

-- 16. CREATE STOCK AGE TRACKING TABLE
CREATE TABLE IF NOT EXISTS public.stock_age_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_sku text NOT NULL,
  store_id uuid REFERENCES public.stores(id),
  stock_age_days integer NOT NULL,
  stock_age_band text NOT NULL,
  quantity integer NOT NULL,
  value_at_cost numeric,
  value_at_retail numeric,
  tracking_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_age_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to stock_age_tracking" ON public.stock_age_tracking FOR SELECT USING (true);
CREATE POLICY "Allow public insert to stock_age_tracking" ON public.stock_age_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to stock_age_tracking" ON public.stock_age_tracking FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from stock_age_tracking" ON public.stock_age_tracking FOR DELETE USING (true);

-- 17. CREATE INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_no text NOT NULL UNIQUE,
  order_id uuid REFERENCES public.orders(id),
  customer_id uuid REFERENCES public.customers(id),
  store_id uuid REFERENCES public.stores(id),
  invoice_date timestamp with time zone NOT NULL DEFAULT now(),
  trx_type text DEFAULT 'Sale',
  subtotal numeric NOT NULL,
  tax_amount numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  payment_method text,
  payment_status text DEFAULT 'Paid',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow public insert to invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to invoices" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from invoices" ON public.invoices FOR DELETE USING (true);

-- 18. CREATE HOLIDAYS TABLE
CREATE TABLE IF NOT EXISTS public.holidays (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  holiday_date date NOT NULL,
  holiday_name text NOT NULL,
  holiday_type text DEFAULT 'Federal',
  country text DEFAULT 'USA',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to holidays" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "Allow public insert to holidays" ON public.holidays FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to holidays" ON public.holidays FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from holidays" ON public.holidays FOR DELETE USING (true);

-- 19. CREATE KPI MEASURES TABLE (for storing calculated KPIs)
CREATE TABLE IF NOT EXISTS public.kpi_measures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  measure_date date NOT NULL,
  store_id uuid REFERENCES public.stores(id),
  category text,
  product_sku text,
  net_sales numeric,
  net_sales_ly numeric,
  yoy_net_sales_growth_pct numeric,
  gross_margin numeric,
  gross_margin_pct numeric,
  margin_ly numeric,
  yoy_margin_growth_pct numeric,
  units_sold integer,
  units_sold_ly integer,
  avg_transaction_value numeric,
  avg_basket_size numeric,
  transactions_count integer,
  return_rate_pct numeric,
  discount_rate_pct numeric,
  inventory_turn numeric,
  sell_through_rate numeric,
  stock_to_sales_ratio numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.kpi_measures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to kpi_measures" ON public.kpi_measures FOR SELECT USING (true);
CREATE POLICY "Allow public insert to kpi_measures" ON public.kpi_measures FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to kpi_measures" ON public.kpi_measures FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from kpi_measures" ON public.kpi_measures FOR DELETE USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_dimension_date ON public.time_dimension(date_value);
CREATE INDEX IF NOT EXISTS idx_time_dimension_year ON public.time_dimension(year);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_store ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON public.orders(order_date);
CREATE INDEX IF NOT EXISTS idx_returns_customer ON public.returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_markdowns_sku ON public.markdowns(product_sku);
CREATE INDEX IF NOT EXISTS idx_kpi_measures_date ON public.kpi_measures(measure_date);
CREATE INDEX IF NOT EXISTS idx_kpi_measures_store ON public.kpi_measures(store_id);
