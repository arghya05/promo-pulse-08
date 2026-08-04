// ============================================================================
// RETAIL ONTOLOGY GRAPH
// A single semantic layer that connects every merchandising module to the same
// physical tables, so any question can be answered from governed data only.
//
// Nodes    = business entities (Store, Product, Category, Promotion, Supplier…)
// Edges    = how entities join (shared keys) -> enables cross-module answers
// Datasets = governed fact views: whitelisted metrics, dimensions and filters
//
// Nothing outside this file may invent a metric, a table or a column. The LLM
// only chooses from this catalog; all math happens in code.
// ============================================================================

export type MetricFormat = 'currency' | 'pct' | 'number' | 'ratio' | 'days';

export interface MetricDef {
  label: string;
  format: MetricFormat;
  agg: 'sum' | 'avg' | 'ratio' | 'wavg' | 'count' | 'share';
  field?: string;
  num?: string;
  den?: string;
  weight?: string;
  scale?: number;
  /** for `share` / conditional counts */
  when?: (row: Record<string, unknown>) => boolean;
  definition: string;
}

export interface DimensionDef {
  label: string;
  field: string;
}

export interface FilterDef {
  label: string;
  field: string;
  /** raw table column -> pushed down to the database */
  column?: string;
  match?: 'eq' | 'ilike';
}

export type EnrichKey = 'product' | 'store' | 'supplier' | 'planogram' | 'promotion';

export interface Dataset {
  id: string;
  module: string;
  grain: string;
  description: string;
  table: string;
  select: string;
  dateField?: string;
  enrich?: EnrichKey[];
  maxRows: number;
  metrics: Record<string, MetricDef>;
  dimensions: Record<string, DimensionDef>;
  filters: Record<string, FilterDef>;
}

// ---------------------------------------------------------------------------
// Entity graph — used for cross-module reasoning and shown as provenance
// ---------------------------------------------------------------------------

export interface OntologyEdge {
  from: string;
  to: string;
  via: string;
  label: string;
}

export const ontologyEntities: Record<string, { label: string; keyField: string; modules: string[] }> = {
  Store: { label: 'Store', keyField: 'store_id', modules: ['executive', 'promotion', 'demand', 'supply-chain', 'space'] },
  Product: { label: 'Product / SKU', keyField: 'product_sku', modules: ['pricing', 'assortment', 'promotion', 'demand', 'space'] },
  Category: { label: 'Category / Department', keyField: 'category', modules: ['executive', 'assortment', 'pricing', 'demand', 'space'] },
  Promotion: { label: 'Promotion event', keyField: 'promotion_id', modules: ['promotion', 'pricing'] },
  Supplier: { label: 'Supplier / Vendor', keyField: 'supplier_id', modules: ['supply-chain', 'assortment'] },
  Competitor: { label: 'Competitor banner', keyField: 'competitor_name', modules: ['pricing'] },
  Planogram: { label: 'Planogram / Fixture', keyField: 'planogram_id', modules: ['space'] },
  Customer: { label: 'Customer household', keyField: 'customer_id', modules: ['executive', 'promotion'] },
  Calendar: { label: 'Retail calendar', keyField: 'date', modules: ['executive', 'demand', 'promotion'] },
};

export const ontologyEdges: OntologyEdge[] = [
  { from: 'Product', to: 'Category', via: 'products.category', label: 'rolls up to' },
  { from: 'Product', to: 'Store', via: 'transactions / inventory_levels', label: 'is sold & stocked in' },
  { from: 'Product', to: 'Competitor', via: 'competitor_prices.product_sku', label: 'is price-compared against' },
  { from: 'Product', to: 'Supplier', via: 'supplier_orders.product_sku', label: 'is replenished by' },
  { from: 'Product', to: 'Planogram', via: 'shelf_allocations.product_sku', label: 'is merchandised on' },
  { from: 'Promotion', to: 'Product', via: 'transactions.promotion_id', label: 'drives sales of' },
  { from: 'Promotion', to: 'Store', via: 'transactions.store_id', label: 'is executed in' },
  { from: 'Store', to: 'Calendar', via: 'kpi_measures.measure_date', label: 'is measured over' },
  { from: 'Product', to: 'Calendar', via: 'demand_forecasts.forecast_date', label: 'is forecast over' },
  { from: 'Customer', to: 'Promotion', via: 'customer_journey.promotion_id', label: 'responds to' },
];

// ---------------------------------------------------------------------------
// Governed datasets
// ---------------------------------------------------------------------------

const m = (d: MetricDef) => d;

export const datasets: Record<string, Dataset> = {
  sales: {
    id: 'sales',
    module: 'executive',
    grain: 'day × category × store',
    description:
      'Certified daily P&L / KPI fact table. Use for sales, margin, units, baskets, traffic-value, discount rate, returns, turn, sell-through and YoY growth at company, category or store level.',
    table: 'kpi_measures',
    select:
      'measure_date,category,store_id,net_sales,net_sales_ly,gross_margin,margin_ly,units_sold,units_sold_ly,transactions_count,avg_transaction_value,avg_basket_size,discount_rate_pct,return_rate_pct,inventory_turn,sell_through_rate,stock_to_sales_ratio',
    dateField: 'measure_date',
    enrich: ['store'],
    maxRows: 30000,
    metrics: {
      net_sales: m({ label: 'Net sales', format: 'currency', agg: 'sum', field: 'net_sales', definition: 'Sum of net sales after discounts' }),
      net_sales_ly: m({ label: 'Net sales LY', format: 'currency', agg: 'sum', field: 'net_sales_ly', definition: 'Net sales same period last year' }),
      yoy_growth_pct: m({ label: 'YoY sales growth', format: 'pct', agg: 'ratio', num: 'net_sales_delta', den: 'net_sales_ly', scale: 100, definition: '(Net sales − Net sales LY) / Net sales LY' }),
      gross_margin: m({ label: 'Gross margin $', format: 'currency', agg: 'sum', field: 'gross_margin', definition: 'Net sales less cost of goods' }),
      gross_margin_pct: m({ label: 'Gross margin rate', format: 'pct', agg: 'ratio', num: 'gross_margin', den: 'net_sales', scale: 100, definition: 'Gross margin $ / Net sales' }),
      units_sold: m({ label: 'Units sold', format: 'number', agg: 'sum', field: 'units_sold', definition: 'Total units scanned' }),
      transactions: m({ label: 'Transactions', format: 'number', agg: 'sum', field: 'transactions_count', definition: 'Count of till transactions' }),
      avg_transaction_value: m({ label: 'Avg transaction value', format: 'currency', agg: 'ratio', num: 'net_sales', den: 'transactions_count', definition: 'Net sales / transactions' }),
      avg_basket_size: m({ label: 'Avg basket units', format: 'ratio', agg: 'ratio', num: 'units_sold', den: 'transactions_count', definition: 'Units / transactions' }),
      discount_rate_pct: m({ label: 'Discount rate', format: 'pct', agg: 'wavg', field: 'discount_rate_pct', weight: 'net_sales', definition: 'Sales-weighted discount depth' }),
      return_rate_pct: m({ label: 'Return rate', format: 'pct', agg: 'wavg', field: 'return_rate_pct', weight: 'net_sales', definition: 'Sales-weighted returns' }),
      inventory_turn: m({ label: 'Inventory turn', format: 'ratio', agg: 'avg', field: 'inventory_turn', definition: 'Average annualised inventory turn' }),
      sell_through_rate: m({ label: 'Sell-through', format: 'pct', agg: 'wavg', field: 'sell_through_rate', weight: 'net_sales', definition: 'Sales-weighted sell-through' }),
      stock_to_sales: m({ label: 'Stock-to-sales', format: 'ratio', agg: 'avg', field: 'stock_to_sales_ratio', definition: 'Average stock to sales ratio' }),
    },
    dimensions: {
      category: { label: 'Category', field: 'category' },
      store: { label: 'Store', field: 'store_name' },
      region: { label: 'Region', field: 'store_region' },
      store_format: { label: 'Store format', field: 'store_format' },
      month: { label: 'Month', field: 'period_month' },
      week: { label: 'Week', field: 'period_week' },
      day: { label: 'Day', field: 'measure_date' },
    },
    filters: {
      category: { label: 'Category', field: 'category', column: 'category', match: 'eq' },
      store: { label: 'Store name', field: 'store_name' },
      region: { label: 'Region', field: 'store_region' },
      store_format: { label: 'Store format', field: 'store_format' },
    },
  },

  sku_sales: {
    id: 'sku_sales',
    module: 'assortment',
    grain: 'transaction line × SKU × store',
    description:
      'POS line-item fact. Use whenever the question needs named SKUs / products / brands: top or worst sellers, SKU margin, promoted vs base sales, brand and subcategory performance.',
    table: 'transactions',
    select:
      'transaction_date,store_id,product_sku,product_name,promotion_id,quantity,unit_price,discount_amount,total_amount,net_sales,cost_of_goods_sold,margin',
    dateField: 'transaction_date',
    enrich: ['product', 'store', 'promotion'],
    maxRows: 24000,
    metrics: {
      net_sales: m({ label: 'Net sales', format: 'currency', agg: 'sum', field: 'net_sales', definition: 'Sum of line net sales' }),
      units: m({ label: 'Units', format: 'number', agg: 'sum', field: 'quantity', definition: 'Units sold' }),
      margin: m({ label: 'Gross margin $', format: 'currency', agg: 'sum', field: 'margin', definition: 'Line margin after discount' }),
      margin_pct: m({ label: 'Gross margin rate', format: 'pct', agg: 'ratio', num: 'margin', den: 'net_sales', scale: 100, definition: 'Margin $ / net sales' }),
      discount_spend: m({ label: 'Discount given', format: 'currency', agg: 'sum', field: 'discount_amount', definition: 'Total discount dollars' }),
      discount_rate_pct: m({ label: 'Discount rate', format: 'pct', agg: 'ratio', num: 'discount_amount', den: 'total_amount', scale: 100, definition: 'Discount $ / gross sales' }),
      avg_selling_price: m({ label: 'Avg selling price', format: 'currency', agg: 'ratio', num: 'net_sales', den: 'quantity', definition: 'Net sales / units' }),
      lines: m({ label: 'Sales lines', format: 'number', agg: 'count', definition: 'Count of POS lines' }),
    },
    dimensions: {
      product: { label: 'Product', field: 'product_label' },
      product_sku: { label: 'SKU', field: 'product_sku' },
      category: { label: 'Category', field: 'product_category' },
      subcategory: { label: 'Subcategory', field: 'product_subcategory' },
      brand: { label: 'Brand', field: 'product_brand' },
      store: { label: 'Store', field: 'store_name' },
      region: { label: 'Region', field: 'store_region' },
      promotion: { label: 'Promotion', field: 'promotion_label' },
      month: { label: 'Month', field: 'period_month' },
      week: { label: 'Week', field: 'period_week' },
    },
    filters: {
      category: { label: 'Category', field: 'product_category' },
      subcategory: { label: 'Subcategory', field: 'product_subcategory' },
      brand: { label: 'Brand', field: 'product_brand' },
      product_sku: { label: 'SKU', field: 'product_sku', column: 'product_sku', match: 'eq' },
      store: { label: 'Store name', field: 'store_name' },
      region: { label: 'Region', field: 'store_region' },
      promoted_only: { label: 'Promoted lines only', field: 'is_promoted' },
    },
  },

  inventory: {
    id: 'inventory',
    module: 'supply-chain',
    grain: 'store × SKU snapshot',
    description:
      'Current perpetual inventory position. Use for on-shelf availability, stockout risk, out-of-shelf, weeks of cover, reorder exposure and which SKUs/stores are short.',
    table: 'inventory_levels',
    select: 'store_id,product_sku,stock_level,reorder_point,stockout_risk,last_restocked',
    enrich: ['product', 'store'],
    maxRows: 40000,
    metrics: {
      skus_tracked: m({ label: 'SKU-store positions', format: 'number', agg: 'count', definition: 'Count of tracked store/SKU positions' }),
      osa_pct: m({ label: 'On-shelf availability', format: 'pct', agg: 'share', when: (r) => r.stockout_risk === 'Low', scale: 100, definition: 'Share of positions with Low stockout risk' }),
      high_risk_pct: m({ label: 'High stockout risk', format: 'pct', agg: 'share', when: (r) => r.stockout_risk === 'High', scale: 100, definition: 'Share of positions with High stockout risk' }),
      units_on_hand: m({ label: 'Units on hand', format: 'number', agg: 'sum', field: 'stock_level', definition: 'Sum of stock level' }),
      retail_value_on_hand: m({ label: 'Retail value on hand', format: 'currency', agg: 'sum', field: 'retail_value', definition: 'Stock level × base price' }),
      cost_value_on_hand: m({ label: 'Cost value on hand', format: 'currency', agg: 'sum', field: 'cost_value', definition: 'Stock level × unit cost' }),
      cover_vs_reorder: m({ label: 'Stock vs reorder point', format: 'ratio', agg: 'ratio', num: 'stock_level', den: 'reorder_point', definition: 'Stock on hand / reorder point' }),
      below_reorder_pct: m({ label: 'Below reorder point', format: 'pct', agg: 'share', when: (r) => Number(r.stock_level) < Number(r.reorder_point), scale: 100, definition: 'Share of positions under reorder point' }),
    },
    dimensions: {
      category: { label: 'Category', field: 'product_category' },
      subcategory: { label: 'Subcategory', field: 'product_subcategory' },
      product: { label: 'Product', field: 'product_label' },
      store: { label: 'Store', field: 'store_name' },
      region: { label: 'Region', field: 'store_region' },
      risk: { label: 'Stockout risk', field: 'stockout_risk' },
    },
    filters: {
      category: { label: 'Category', field: 'product_category' },
      store: { label: 'Store name', field: 'store_name' },
      region: { label: 'Region', field: 'store_region' },
      risk: { label: 'Stockout risk', field: 'stockout_risk', column: 'stockout_risk', match: 'eq' },
    },
  },

  price_gap: {
    id: 'price_gap',
    module: 'pricing',
    grain: 'SKU × competitor × observation',
    description:
      'Competitor price observations vs our shelf price. Use for price index, price gaps, competitive position by banner (Aldi, Walmart, Kroger, Whole Foods…) and which SKUs are over/under-priced.',
    table: 'competitor_prices',
    select: 'product_sku,competitor_name,competitor_price,our_price,price_gap_percent,observation_date,source',
    dateField: 'observation_date',
    enrich: ['product'],
    maxRows: 30000,
    metrics: {
      observations: m({ label: 'Price observations', format: 'number', agg: 'count', definition: 'Count of competitor price checks' }),
      price_gap_pct: m({ label: 'Price gap vs competitor', format: 'pct', agg: 'avg', field: 'price_gap_percent', definition: 'Average (our price − competitor price) / competitor price' }),
      our_price: m({ label: 'Our avg price', format: 'currency', agg: 'avg', field: 'our_price', definition: 'Average our shelf price' }),
      competitor_price: m({ label: 'Competitor avg price', format: 'currency', agg: 'avg', field: 'competitor_price', definition: 'Average competitor price' }),
      price_index: m({ label: 'Price index', format: 'ratio', agg: 'ratio', num: 'our_price', den: 'competitor_price', scale: 100, definition: 'Our price / competitor price × 100' }),
      above_market_pct: m({ label: 'SKUs priced above market', format: 'pct', agg: 'share', when: (r) => Number(r.price_gap_percent) > 0, scale: 100, definition: 'Share of observations where we are more expensive' }),
    },
    dimensions: {
      competitor: { label: 'Competitor', field: 'competitor_name' },
      product: { label: 'Product', field: 'product_label' },
      category: { label: 'Category', field: 'product_category' },
      brand: { label: 'Brand', field: 'product_brand' },
      month: { label: 'Month', field: 'period_month' },
    },
    filters: {
      competitor: { label: 'Competitor', field: 'competitor_name', column: 'competitor_name', match: 'ilike' },
      category: { label: 'Category', field: 'product_category' },
      product_sku: { label: 'SKU', field: 'product_sku', column: 'product_sku', match: 'eq' },
    },
  },

  forecast: {
    id: 'forecast',
    module: 'demand',
    grain: 'forecast × SKU × store',
    description:
      'Demand forecast vs actuals. Use for forecast accuracy, bias, forecasted units, over/under-forecasting by category or store.',
    table: 'demand_forecasts',
    select:
      'product_sku,store_id,forecast_date,forecast_period_start,forecast_period_end,forecasted_units,actual_units,forecast_accuracy,forecast_model,confidence_interval_low,confidence_interval_high',
    dateField: 'forecast_date',
    enrich: ['product', 'store'],
    maxRows: 30000,
    metrics: {
      forecasted_units: m({ label: 'Forecast units', format: 'number', agg: 'sum', field: 'forecasted_units', definition: 'Sum of forecast units' }),
      actual_units: m({ label: 'Actual units', format: 'number', agg: 'sum', field: 'actual_units', definition: 'Sum of actual units' }),
      forecast_accuracy_pct: m({ label: 'Forecast accuracy', format: 'pct', agg: 'avg', field: 'forecast_accuracy', definition: 'Average forecast accuracy' }),
      mape_pct: m({ label: 'Forecast MAPE', format: 'pct', agg: 'ratio', num: 'abs_error', den: 'actual_units', scale: 100, definition: 'Σ|forecast − actual| / Σ actual' }),
      bias_pct: m({ label: 'Forecast bias', format: 'pct', agg: 'ratio', num: 'signed_error', den: 'actual_units', scale: 100, definition: 'Σ(forecast − actual) / Σ actual' }),
      forecast_rows: m({ label: 'Forecast records', format: 'number', agg: 'count', definition: 'Count of forecast records' }),
    },
    dimensions: {
      category: { label: 'Category', field: 'product_category' },
      product: { label: 'Product', field: 'product_label' },
      store: { label: 'Store', field: 'store_name' },
      region: { label: 'Region', field: 'store_region' },
      model: { label: 'Forecast model', field: 'forecast_model' },
      month: { label: 'Month', field: 'period_month' },
    },
    filters: {
      category: { label: 'Category', field: 'product_category' },
      store: { label: 'Store name', field: 'store_name' },
      region: { label: 'Region', field: 'store_region' },
      model: { label: 'Forecast model', field: 'forecast_model', column: 'forecast_model', match: 'eq' },
    },
  },

  promotions: {
    id: 'promotions',
    module: 'promotion',
    grain: 'promotion event',
    description:
      'Promotion event register with trade spend. Use for event counts, trade spend, discount depth, mechanic mix (BOGO, multibuy, price-off), channel and target segment.',
    table: 'promotions',
    select:
      'id,promotion_name,promotion_type,promo_mechanism,product_category,product_sku,start_date,end_date,discount_percent,discount_amount,status,total_spend,channel,target_segment,running_promo',
    dateField: 'start_date',
    maxRows: 20000,
    metrics: {
      events: m({ label: 'Promotion events', format: 'number', agg: 'count', definition: 'Count of promotion events' }),
      trade_spend: m({ label: 'Trade spend', format: 'currency', agg: 'sum', field: 'total_spend', definition: 'Sum of promotion spend' }),
      avg_discount_pct: m({ label: 'Avg discount depth', format: 'pct', agg: 'avg', field: 'discount_percent', definition: 'Average discount percent' }),
      avg_spend_per_event: m({ label: 'Avg spend per event', format: 'currency', agg: 'ratio', num: 'total_spend', den: 'event_one', definition: 'Trade spend / events' }),
      active_share_pct: m({ label: 'Active events share', format: 'pct', agg: 'share', when: (r) => String(r.status).toLowerCase() === 'active', scale: 100, definition: 'Share of events currently active' }),
    },
    dimensions: {
      promotion_type: { label: 'Promotion type', field: 'promotion_type' },
      mechanic: { label: 'Mechanic', field: 'promo_mechanism' },
      category: { label: 'Category', field: 'product_category' },
      channel: { label: 'Channel', field: 'channel' },
      segment: { label: 'Target segment', field: 'target_segment' },
      status: { label: 'Status', field: 'status' },
      month: { label: 'Month', field: 'period_month' },
    },
    filters: {
      promotion_type: { label: 'Promotion type', field: 'promotion_type', column: 'promotion_type', match: 'ilike' },
      category: { label: 'Category', field: 'product_category', column: 'product_category', match: 'eq' },
      status: { label: 'Status', field: 'status', column: 'status', match: 'ilike' },
      channel: { label: 'Channel', field: 'channel' },
    },
  },

  supplier_performance: {
    id: 'supplier_performance',
    module: 'supply-chain',
    grain: 'supplier order line',
    description:
      'Supplier order execution. Use for on-time delivery, lead time, fill reliability, purchase cost and worst/best suppliers.',
    table: 'supplier_orders',
    select:
      'supplier_id,product_sku,order_date,expected_delivery_date,actual_delivery_date,quantity,unit_cost,total_cost,status,on_time',
    dateField: 'order_date',
    enrich: ['product', 'supplier'],
    maxRows: 30000,
    metrics: {
      orders: m({ label: 'Purchase orders', format: 'number', agg: 'count', definition: 'Count of supplier order lines' }),
      on_time_pct: m({ label: 'On-time delivery', format: 'pct', agg: 'share', when: (r) => r.on_time === true, scale: 100, definition: 'Share of lines delivered on time' }),
      order_cost: m({ label: 'Purchase cost', format: 'currency', agg: 'sum', field: 'total_cost', definition: 'Sum of order cost' }),
      units_ordered: m({ label: 'Units ordered', format: 'number', agg: 'sum', field: 'quantity', definition: 'Sum of ordered units' }),
      lead_time_days: m({ label: 'Quoted lead time', format: 'days', agg: 'avg', field: 'supplier_lead_time_days', definition: 'Average supplier lead time in days' }),
      reliability_score: m({ label: 'Reliability score', format: 'ratio', agg: 'avg', field: 'supplier_reliability', definition: 'Average supplier reliability score' }),
    },
    dimensions: {
      supplier: { label: 'Supplier', field: 'supplier_name' },
      category: { label: 'Category', field: 'product_category' },
      product: { label: 'Product', field: 'product_label' },
      status: { label: 'Order status', field: 'status' },
      month: { label: 'Month', field: 'period_month' },
    },
    filters: {
      supplier: { label: 'Supplier', field: 'supplier_name' },
      category: { label: 'Category', field: 'product_category' },
      status: { label: 'Order status', field: 'status', column: 'status', match: 'ilike' },
    },
  },

  space: {
    id: 'space',
    module: 'space',
    grain: 'shelf allocation',
    description:
      'Planogram shelf allocations. Use for space productivity (sales per sq ft), facings, eye-level share and space vs sales balance by category.',
    table: 'shelf_allocations',
    select:
      'planogram_id,product_sku,shelf_number,position_from_left,facings,width_inches,height_inches,depth_inches,sales_per_sqft,is_eye_level',
    enrich: ['product', 'planogram'],
    maxRows: 30000,
    metrics: {
      allocations: m({ label: 'Shelf allocations', format: 'number', agg: 'count', definition: 'Count of SKU shelf placements' }),
      sales_per_sqft: m({ label: 'Sales per sq ft', format: 'currency', agg: 'avg', field: 'sales_per_sqft', definition: 'Average sales per square foot' }),
      facings: m({ label: 'Facings', format: 'number', agg: 'sum', field: 'facings', definition: 'Total facings allocated' }),
      eye_level_pct: m({ label: 'Eye-level share', format: 'pct', agg: 'share', when: (r) => r.is_eye_level === true, scale: 100, definition: 'Share of placements at eye level' }),
      linear_inches: m({ label: 'Linear space (in)', format: 'number', agg: 'sum', field: 'linear_inches', definition: 'Facings × width in inches' }),
    },
    dimensions: {
      category: { label: 'Category', field: 'product_category' },
      product: { label: 'Product', field: 'product_label' },
      planogram: { label: 'Planogram', field: 'planogram_name' },
      shelf: { label: 'Shelf number', field: 'shelf_number' },
    },
    filters: {
      category: { label: 'Category', field: 'product_category' },
      planogram: { label: 'Planogram', field: 'planogram_name' },
    },
  },

  store_traffic: {
    id: 'store_traffic',
    module: 'executive',
    grain: 'store × day',
    description:
      'Store traffic and conversion. Use for footfall, conversion rate, basket size by store/region, staffing and weather effects.',
    table: 'store_performance',
    select: 'store_id,metric_date,foot_traffic,avg_basket_size,conversion_rate,total_sales,staff_count,weather_condition',
    dateField: 'metric_date',
    enrich: ['store'],
    maxRows: 40000,
    metrics: {
      foot_traffic: m({ label: 'Foot traffic', format: 'number', agg: 'sum', field: 'foot_traffic', definition: 'Sum of counted visitors' }),
      conversion_rate: m({ label: 'Conversion rate', format: 'pct', agg: 'avg', field: 'conversion_rate', definition: 'Average visit-to-transaction conversion' }),
      total_sales: m({ label: 'Store sales', format: 'currency', agg: 'sum', field: 'total_sales', definition: 'Sum of store sales' }),
      avg_basket_size: m({ label: 'Avg basket', format: 'currency', agg: 'avg', field: 'avg_basket_size', definition: 'Average basket value' }),
      sales_per_visitor: m({ label: 'Sales per visitor', format: 'currency', agg: 'ratio', num: 'total_sales', den: 'foot_traffic', definition: 'Store sales / foot traffic' }),
      staff_count: m({ label: 'Staff on floor', format: 'number', agg: 'avg', field: 'staff_count', definition: 'Average staff count' }),
    },
    dimensions: {
      store: { label: 'Store', field: 'store_name' },
      region: { label: 'Region', field: 'store_region' },
      store_format: { label: 'Store format', field: 'store_format' },
      weather: { label: 'Weather', field: 'weather_condition' },
      month: { label: 'Month', field: 'period_month' },
      week: { label: 'Week', field: 'period_week' },
    },
    filters: {
      store: { label: 'Store name', field: 'store_name' },
      region: { label: 'Region', field: 'store_region' },
      weather: { label: 'Weather', field: 'weather_condition', column: 'weather_condition', match: 'ilike' },
    },
  },

  markdowns: {
    id: 'markdowns',
    module: 'pricing',
    grain: 'markdown event',
    description:
      'Markdown and clearance register. Use for markdown depth, markdown reasons (ageing, seasonal, damage), and margin leakage from markdowns.',
    table: 'markdowns',
    select:
      'markdown_code,product_sku,store_id,markdown_type,markdown_reason,original_price,markdown_price,markdown_percent,effective_date,end_date,status',
    dateField: 'effective_date',
    enrich: ['product', 'store'],
    maxRows: 20000,
    metrics: {
      markdown_events: m({ label: 'Markdown events', format: 'number', agg: 'count', definition: 'Count of markdown records' }),
      avg_markdown_pct: m({ label: 'Avg markdown depth', format: 'pct', agg: 'avg', field: 'markdown_percent', definition: 'Average markdown percent' }),
      price_give_up: m({ label: 'Price give-up per unit', format: 'currency', agg: 'ratio', num: 'markdown_delta', den: 'event_one', definition: 'Average original price − markdown price' }),
    },
    dimensions: {
      reason: { label: 'Markdown reason', field: 'markdown_reason' },
      type: { label: 'Markdown type', field: 'markdown_type' },
      category: { label: 'Category', field: 'product_category' },
      product: { label: 'Product', field: 'product_label' },
      store: { label: 'Store', field: 'store_name' },
    },
    filters: {
      category: { label: 'Category', field: 'product_category' },
      reason: { label: 'Markdown reason', field: 'markdown_reason', column: 'markdown_reason', match: 'ilike' },
      status: { label: 'Status', field: 'status', column: 'status', match: 'ilike' },
    },
  },
};

// ---------------------------------------------------------------------------
// Compact catalog for the planner prompt (no data, only vocabulary)
// ---------------------------------------------------------------------------

export function ontologyPromptSpec(): string {
  const lines: string[] = [];
  lines.push('ENTITY GRAPH (how modules connect):');
  for (const edge of ontologyEdges) {
    lines.push(`- ${edge.from} ${edge.label} ${edge.to}  [${edge.via}]`);
  }
  lines.push('');
  lines.push('GOVERNED DATASETS (the only queryable facts):');
  for (const ds of Object.values(datasets)) {
    lines.push(`\n# ${ds.id} — module=${ds.module}, grain=${ds.grain}`);
    lines.push(`  ${ds.description}`);
    lines.push(`  metrics: ${Object.keys(ds.metrics).join(', ')}`);
    lines.push(`  dimensions: ${Object.keys(ds.dimensions).join(', ')}`);
    lines.push(`  filters: ${Object.keys(ds.filters).join(', ')}`);
    lines.push(`  time filter: ${ds.dateField ? 'yes (dateFrom/dateTo)' : 'no (snapshot dataset)'}`);
  }
  return lines.join('\n');
}

export function metricCatalogText(): string {
  const out: string[] = [];
  for (const ds of Object.values(datasets)) {
    for (const [key, def] of Object.entries(ds.metrics)) {
      out.push(`${ds.id}.${key} = ${def.definition}`);
    }
  }
  return out.join('\n');
}
