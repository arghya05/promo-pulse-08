export interface ModuleKPI {
  id: string;
  name: string;
  category: string;
  dataSource: string;
  format: 'currency' | 'percent' | 'number' | 'ratio';
}

// Shared KPIs available across all modules
export const sharedKPIs: ModuleKPI[] = [
  { id: 'revenue', name: 'Revenue', category: 'financial', dataSource: 'transactions', format: 'currency' },
  { id: 'margin', name: 'Margin', category: 'financial', dataSource: 'transactions', format: 'currency' },
  { id: 'margin_percent', name: 'Margin %', category: 'financial', dataSource: 'transactions', format: 'percent' },
  { id: 'units_sold', name: 'Units Sold', category: 'sales', dataSource: 'transactions', format: 'number' },
  { id: 'avg_transaction_value', name: 'Avg Transaction Value', category: 'sales', dataSource: 'transactions', format: 'currency' },
];

// Pricing-specific KPIs
export const pricingKPIs: ModuleKPI[] = [
  ...sharedKPIs,
  { id: 'price_elasticity', name: 'Price Elasticity', category: 'pricing', dataSource: 'products', format: 'ratio' },
  { id: 'competitive_index', name: 'Competitive Price Index', category: 'pricing', dataSource: 'competitor_prices', format: 'ratio' },
  { id: 'price_gap', name: 'Price Gap vs Competition', category: 'pricing', dataSource: 'competitor_prices', format: 'percent' },
  { id: 'revenue_per_unit', name: 'Revenue per Unit', category: 'financial', dataSource: 'transactions', format: 'currency' },
  { id: 'price_variance', name: 'Price Variance', category: 'pricing', dataSource: 'price_change_history', format: 'percent' },
  { id: 'markdown_rate', name: 'Markdown Rate', category: 'pricing', dataSource: 'price_change_history', format: 'percent' },
  { id: 'price_change_frequency', name: 'Price Change Frequency', category: 'pricing', dataSource: 'price_change_history', format: 'number' },
];

// Assortment-specific KPIs
export const assortmentKPIs: ModuleKPI[] = [
  ...sharedKPIs,
  { id: 'sku_count', name: 'Active SKU Count', category: 'assortment', dataSource: 'products', format: 'number' },
  { id: 'category_penetration', name: 'Category Penetration', category: 'assortment', dataSource: 'transactions', format: 'percent' },
  { id: 'brand_share', name: 'Brand Share', category: 'assortment', dataSource: 'transactions', format: 'percent' },
  { id: 'new_product_sales', name: 'New Product Sales', category: 'assortment', dataSource: 'transactions', format: 'currency' },
  { id: 'product_velocity', name: 'Product Velocity', category: 'assortment', dataSource: 'transactions', format: 'number' },
  { id: 'assortment_efficiency', name: 'Assortment Efficiency', category: 'assortment', dataSource: 'products', format: 'percent' },
  { id: 'category_growth', name: 'Category Growth', category: 'assortment', dataSource: 'transactions', format: 'percent' },
  { id: 'private_label_share', name: 'Private Label Share', category: 'assortment', dataSource: 'transactions', format: 'percent' },
];

// Demand Forecasting-specific KPIs
export const demandKPIs: ModuleKPI[] = [
  ...sharedKPIs,
  { id: 'forecast_accuracy', name: 'Forecast Accuracy', category: 'forecasting', dataSource: 'demand_forecasts', format: 'percent' },
  { id: 'mape', name: 'MAPE', category: 'forecasting', dataSource: 'forecast_accuracy_tracking', format: 'percent' },
  { id: 'forecast_bias', name: 'Forecast Bias', category: 'forecasting', dataSource: 'forecast_accuracy_tracking', format: 'percent' },
  { id: 'stock_days', name: 'Days of Stock', category: 'inventory', dataSource: 'inventory_levels', format: 'number' },
  { id: 'stockout_rate', name: 'Stockout Rate', category: 'inventory', dataSource: 'inventory_levels', format: 'percent' },
  { id: 'overstock_rate', name: 'Overstock Rate', category: 'inventory', dataSource: 'inventory_levels', format: 'percent' },
  { id: 'inventory_turnover', name: 'Inventory Turnover', category: 'inventory', dataSource: 'inventory_levels', format: 'ratio' },
  { id: 'fill_rate', name: 'Fill Rate', category: 'inventory', dataSource: 'inventory_levels', format: 'percent' },
  { id: 'demand_variability', name: 'Demand Variability', category: 'forecasting', dataSource: 'transactions', format: 'percent' },
];

// Supply Chain-specific KPIs
export const supplyChainKPIs: ModuleKPI[] = [
  ...sharedKPIs,
  { id: 'lead_time', name: 'Lead Time (Days)', category: 'logistics', dataSource: 'suppliers', format: 'number' },
  { id: 'on_time_delivery', name: 'On-Time Delivery', category: 'logistics', dataSource: 'supplier_orders', format: 'percent' },
  { id: 'supplier_fill_rate', name: 'Supplier Fill Rate', category: 'supplier', dataSource: 'supplier_orders', format: 'percent' },
  { id: 'supplier_reliability', name: 'Supplier Reliability Score', category: 'supplier', dataSource: 'suppliers', format: 'percent' },
  { id: 'logistics_cost', name: 'Logistics Cost', category: 'cost', dataSource: 'shipping_routes', format: 'currency' },
  { id: 'warehouse_utilization', name: 'Warehouse Utilization', category: 'logistics', dataSource: 'stores', format: 'percent' },
  { id: 'transport_cost_per_unit', name: 'Transport Cost/Unit', category: 'cost', dataSource: 'shipping_routes', format: 'currency' },
  { id: 'order_cycle_time', name: 'Order Cycle Time', category: 'logistics', dataSource: 'supplier_orders', format: 'number' },
  { id: 'perfect_order_rate', name: 'Perfect Order Rate', category: 'logistics', dataSource: 'supplier_orders', format: 'percent' },
];

// Space Planning-specific KPIs
export const spaceKPIs: ModuleKPI[] = [
  ...sharedKPIs,
  { id: 'sales_per_sqft', name: 'Sales per Sq Ft', category: 'space', dataSource: 'shelf_allocations', format: 'currency' },
  { id: 'gmroi', name: 'GMROI', category: 'financial', dataSource: 'store_performance', format: 'ratio' },
  { id: 'shelf_capacity_utilization', name: 'Shelf Capacity %', category: 'space', dataSource: 'shelf_allocations', format: 'percent' },
  { id: 'facings_per_sku', name: 'Facings per SKU', category: 'space', dataSource: 'shelf_allocations', format: 'number' },
  { id: 'category_space_share', name: 'Category Space Share', category: 'space', dataSource: 'planograms', format: 'percent' },
  { id: 'planogram_compliance', name: 'Planogram Compliance', category: 'space', dataSource: 'planograms', format: 'percent' },
  { id: 'out_of_shelf', name: 'Out of Shelf Rate', category: 'space', dataSource: 'inventory_levels', format: 'percent' },
  { id: 'impulse_purchase_rate', name: 'Impulse Purchase Rate', category: 'space', dataSource: 'transactions', format: 'percent' },
  { id: 'eye_level_performance', name: 'Eye-Level Performance', category: 'space', dataSource: 'shelf_allocations', format: 'percent' },
  { id: 'revenue_per_linear_foot', name: 'Revenue per Linear Foot', category: 'space', dataSource: 'shelf_allocations', format: 'currency' },
  { id: 'fixture_utilization', name: 'Fixture Utilization', category: 'space', dataSource: 'fixtures', format: 'percent' },
  { id: 'endcap_lift', name: 'Endcap Sales Lift', category: 'space', dataSource: 'store_performance', format: 'percent' },
  { id: 'aisle_traffic_index', name: 'Aisle Traffic Index', category: 'space', dataSource: 'store_performance', format: 'ratio' },
  { id: 'cross_sell_rate', name: 'Cross-Sell Rate', category: 'space', dataSource: 'transactions', format: 'percent' },
  { id: 'shelf_replenishment_frequency', name: 'Replenishment Frequency', category: 'space', dataSource: 'inventory_levels', format: 'number' },
  { id: 'space_to_sales_index', name: 'Space-to-Sales Index', category: 'space', dataSource: 'shelf_allocations', format: 'ratio' },
  { id: 'vertical_blocking_score', name: 'Blocking Score', category: 'space', dataSource: 'planograms', format: 'ratio' },
];

// Promotion-specific KPIs (existing module)
export const promotionKPIs: ModuleKPI[] = [
  ...sharedKPIs,
  { id: 'roi', name: 'ROI', category: 'promotion', dataSource: 'promotions', format: 'ratio' },
  { id: 'lift_percent', name: 'Lift %', category: 'promotion', dataSource: 'transactions', format: 'percent' },
  { id: 'incremental_margin', name: 'Incremental Margin', category: 'promotion', dataSource: 'transactions', format: 'currency' },
  { id: 'promo_spend', name: 'Promotion Spend', category: 'promotion', dataSource: 'promotions', format: 'currency' },
  { id: 'redemption_rate', name: 'Redemption Rate', category: 'promotion', dataSource: 'customer_journey', format: 'percent' },
  { id: 'cannibalization', name: 'Cannibalization %', category: 'promotion', dataSource: 'transactions', format: 'percent' },
  { id: 'halo_effect', name: 'Halo Effect', category: 'promotion', dataSource: 'transactions', format: 'percent' },
];

// Executive Strategic KPIs - cross-functional
export const executiveKPIs: ModuleKPI[] = [
  ...sharedKPIs,
  // Core Financial Performance
  { id: 'total_revenue', name: 'Total Revenue', category: 'financial', dataSource: 'transactions', format: 'currency' },
  { id: 'yoy_growth', name: 'YoY Growth %', category: 'growth', dataSource: 'transactions', format: 'percent' },
  { id: 'gross_margin', name: 'Gross Margin %', category: 'financial', dataSource: 'transactions', format: 'percent' },
  { id: 'operating_margin', name: 'Operating Margin %', category: 'financial', dataSource: 'transactions', format: 'percent' },
  { id: 'net_margin', name: 'Net Margin %', category: 'financial', dataSource: 'transactions', format: 'percent' },
  
  // Advanced Financial KPIs
  { id: 'ebitda', name: 'EBITDA', category: 'financial', dataSource: 'transactions', format: 'currency' },
  { id: 'ebitda_margin', name: 'EBITDA Margin %', category: 'financial', dataSource: 'transactions', format: 'percent' },
  { id: 'working_capital', name: 'Working Capital', category: 'financial', dataSource: 'inventory_levels', format: 'currency' },
  { id: 'working_capital_ratio', name: 'Working Capital Ratio', category: 'financial', dataSource: 'inventory_levels', format: 'ratio' },
  { id: 'cash_conversion_cycle', name: 'Cash Conversion Cycle (Days)', category: 'financial', dataSource: 'supplier_orders', format: 'number' },
  { id: 'operating_cash_flow', name: 'Operating Cash Flow', category: 'financial', dataSource: 'transactions', format: 'currency' },
  { id: 'free_cash_flow', name: 'Free Cash Flow', category: 'financial', dataSource: 'transactions', format: 'currency' },
  { id: 'return_on_assets', name: 'Return on Assets (ROA)', category: 'financial', dataSource: 'transactions', format: 'percent' },
  { id: 'return_on_invested_capital', name: 'ROIC', category: 'financial', dataSource: 'transactions', format: 'percent' },
  { id: 'asset_turnover', name: 'Asset Turnover', category: 'financial', dataSource: 'transactions', format: 'ratio' },
  
  // Profitability & Efficiency
  { id: 'contribution_margin', name: 'Contribution Margin %', category: 'financial', dataSource: 'transactions', format: 'percent' },
  { id: 'operating_leverage', name: 'Operating Leverage', category: 'financial', dataSource: 'transactions', format: 'ratio' },
  { id: 'cost_to_serve', name: 'Cost to Serve', category: 'cost', dataSource: 'shipping_routes', format: 'currency' },
  { id: 'shrinkage_rate', name: 'Shrinkage Rate %', category: 'financial', dataSource: 'inventory_levels', format: 'percent' },
  { id: 'margin_vs_budget', name: 'Margin vs Budget', category: 'financial', dataSource: 'transactions', format: 'percent' },
  
  // Pricing & Competitive
  { id: 'competitive_index', name: 'Competitive Price Index', category: 'pricing', dataSource: 'competitor_prices', format: 'ratio' },
  { id: 'price_perception', name: 'Price Perception Score', category: 'pricing', dataSource: 'competitor_data', format: 'ratio' },
  { id: 'price_realization', name: 'Price Realization %', category: 'pricing', dataSource: 'transactions', format: 'percent' },
  
  // Promotion
  { id: 'promo_roi', name: 'Promotion ROI', category: 'promotion', dataSource: 'promotions', format: 'ratio' },
  { id: 'promo_spend_pct', name: 'Promo Spend % of Revenue', category: 'promotion', dataSource: 'promotions', format: 'percent' },
  { id: 'promo_lift', name: 'Average Promo Lift %', category: 'promotion', dataSource: 'transactions', format: 'percent' },
  { id: 'promo_effectiveness', name: 'Promo Effectiveness Index', category: 'promotion', dataSource: 'promotions', format: 'ratio' },
  
  // Demand & Inventory
  { id: 'forecast_accuracy', name: 'Forecast Accuracy', category: 'demand', dataSource: 'demand_forecasts', format: 'percent' },
  { id: 'inventory_value', name: 'Inventory Investment', category: 'inventory', dataSource: 'inventory_levels', format: 'currency' },
  { id: 'stockout_rate', name: 'Stockout Rate', category: 'inventory', dataSource: 'inventory_levels', format: 'percent' },
  { id: 'inventory_turnover', name: 'Inventory Turnover', category: 'inventory', dataSource: 'inventory_levels', format: 'ratio' },
  { id: 'days_of_supply', name: 'Days of Supply', category: 'inventory', dataSource: 'inventory_levels', format: 'number' },
  { id: 'gmroi', name: 'GMROI', category: 'inventory', dataSource: 'inventory_levels', format: 'ratio' },
  { id: 'inventory_to_sales', name: 'Inventory to Sales Ratio', category: 'inventory', dataSource: 'inventory_levels', format: 'ratio' },
  
  // Supply Chain
  { id: 'on_time_delivery', name: 'On-Time Delivery %', category: 'logistics', dataSource: 'supplier_orders', format: 'percent' },
  { id: 'supplier_reliability', name: 'Supplier Reliability', category: 'supplier', dataSource: 'suppliers', format: 'percent' },
  { id: 'logistics_cost_pct', name: 'Logistics Cost % Revenue', category: 'cost', dataSource: 'shipping_routes', format: 'percent' },
  { id: 'supply_chain_cost', name: 'Total Supply Chain Cost', category: 'cost', dataSource: 'shipping_routes', format: 'currency' },
  
  // Space & Store
  { id: 'sales_per_sqft', name: 'Sales per Sq Ft', category: 'space', dataSource: 'shelf_allocations', format: 'currency' },
  { id: 'store_conversion', name: 'Store Conversion Rate', category: 'store', dataSource: 'store_performance', format: 'percent' },
  { id: 'basket_size', name: 'Average Basket Size', category: 'store', dataSource: 'store_performance', format: 'currency' },
  { id: 'foot_traffic', name: 'Foot Traffic Index', category: 'store', dataSource: 'store_performance', format: 'number' },
  { id: 'same_store_sales', name: 'Same-Store Sales Growth', category: 'store', dataSource: 'store_performance', format: 'percent' },
  { id: 'labor_productivity', name: 'Sales per Labor Hour', category: 'store', dataSource: 'store_performance', format: 'currency' },
  
  // Customer & Market
  { id: 'customer_ltv', name: 'Customer LTV', category: 'customer', dataSource: 'customers', format: 'currency' },
  { id: 'customer_acquisition_cost', name: 'Customer Acquisition Cost', category: 'customer', dataSource: 'marketing_channels', format: 'currency' },
  { id: 'customer_retention_rate', name: 'Customer Retention Rate', category: 'customer', dataSource: 'customers', format: 'percent' },
  { id: 'market_share', name: 'Market Share %', category: 'competitive', dataSource: 'competitor_data', format: 'percent' },
  { id: 'share_of_wallet', name: 'Share of Wallet', category: 'customer', dataSource: 'customers', format: 'percent' },
];

export const getKPIsByModule = (moduleId: string): ModuleKPI[] => {
  switch (moduleId) {
    case 'executive': return executiveKPIs;
    case 'promotion': return promotionKPIs;
    case 'pricing': return pricingKPIs;
    case 'assortment': return assortmentKPIs;
    case 'demand': return demandKPIs;
    case 'supply-chain': return supplyChainKPIs;
    case 'space': return spaceKPIs;
    default: return sharedKPIs;
  }
};

export const getSharedKPIs = (): ModuleKPI[] => sharedKPIs;

export const getModuleSpecificKPIs = (moduleId: string): ModuleKPI[] => {
  const allKPIs = getKPIsByModule(moduleId);
  const sharedIds = sharedKPIs.map(k => k.id);
  return allKPIs.filter(kpi => !sharedIds.includes(kpi.id));
};
