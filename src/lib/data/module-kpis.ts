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
  // Critical Merchandising KPIs - added to all modules
  { id: 'sell_through_rate', name: 'Sell-Through Rate', category: 'inventory', dataSource: 'supplier_orders', format: 'percent' },
  { id: 'units_per_transaction', name: 'Units per Transaction', category: 'sales', dataSource: 'transactions', format: 'ratio' },
  { id: 'basket_penetration', name: 'Basket Penetration', category: 'customer', dataSource: 'transactions', format: 'percent' },
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
  // Additional critical pricing KPIs
  { id: 'net_price_realization', name: 'Net Price Realization', category: 'pricing', dataSource: 'transactions', format: 'percent' },
  { id: 'cross_elasticity', name: 'Cross-Price Elasticity', category: 'pricing', dataSource: 'products', format: 'ratio' },
  { id: 'average_discount_percent', name: 'Avg Discount %', category: 'pricing', dataSource: 'transactions', format: 'percent' },
  { id: 'price_per_unit', name: 'Price per Unit', category: 'pricing', dataSource: 'transactions', format: 'currency' },
  { id: 'price_index_vs_market', name: 'Price Index vs Market', category: 'pricing', dataSource: 'competitor_prices', format: 'ratio' },
  { id: 'promoted_price_index', name: 'Promoted vs Regular Price Index', category: 'pricing', dataSource: 'promotions', format: 'ratio' },
  { id: 'margin_erosion', name: 'Margin Erosion', category: 'pricing', dataSource: 'price_change_history', format: 'percent' },
  // NEW: Price Band & Markdown KPIs (from new tables)
  { id: 'price_band_performance', name: 'Price Band Performance', category: 'pricing', dataSource: 'price_bands', format: 'currency' },
  { id: 'price_band_margin', name: 'Price Band Margin', category: 'pricing', dataSource: 'price_bands', format: 'percent' },
  { id: 'markdown_effectiveness', name: 'Markdown Effectiveness', category: 'pricing', dataSource: 'markdowns', format: 'percent' },
  { id: 'markdown_rate', name: 'Markdown Rate', category: 'pricing', dataSource: 'markdowns', format: 'percent' },
  { id: 'discount_usage_rate', name: 'Discount Usage Rate', category: 'pricing', dataSource: 'discounts', format: 'percent' },
  { id: 'discount_redemption_count', name: 'Discount Redemptions', category: 'pricing', dataSource: 'discounts', format: 'number' },
  { id: 'yoy_price_change', name: 'YOY Price Change', category: 'pricing', dataSource: 'kpi_measures', format: 'percent' },
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
  // Additional critical assortment KPIs
  { id: 'sku_productivity', name: 'SKU Productivity', category: 'assortment', dataSource: 'transactions', format: 'currency' },
  { id: 'dead_stock_percent', name: 'Dead Stock %', category: 'assortment', dataSource: 'inventory_levels', format: 'percent' },
  { id: 'sku_rationalization_score', name: 'SKU Rationalization Score', category: 'assortment', dataSource: 'products', format: 'ratio' },
  { id: 'category_role_index', name: 'Category Role Index', category: 'assortment', dataSource: 'transactions', format: 'ratio' },
  { id: 'variety_index', name: 'Variety Index', category: 'assortment', dataSource: 'products', format: 'ratio' },
  { id: 'attribute_performance', name: 'Attribute Performance', category: 'assortment', dataSource: 'products', format: 'ratio' },
  { id: 'new_item_success_rate', name: 'New Item Success Rate', category: 'assortment', dataSource: 'products', format: 'percent' },
  { id: 'delisting_rate', name: 'Delisting Rate', category: 'assortment', dataSource: 'products', format: 'percent' },
  // NEW: Stock Age & Returns KPIs (from new tables)
  { id: 'stock_age_days', name: 'Avg Stock Age (Days)', category: 'inventory', dataSource: 'stock_age_tracking', format: 'number' },
  { id: 'aging_inventory_value', name: 'Aging Inventory Value', category: 'inventory', dataSource: 'stock_age_tracking', format: 'currency' },
  { id: 'return_rate', name: 'Return Rate', category: 'assortment', dataSource: 'returns', format: 'percent' },
  { id: 'return_value', name: 'Return Value', category: 'assortment', dataSource: 'returns', format: 'currency' },
  { id: 'yoy_category_growth', name: 'YOY Category Growth', category: 'assortment', dataSource: 'kpi_measures', format: 'percent' },
  { id: 'obsolescence_risk_value', name: 'Obsolescence Risk Value', category: 'inventory', dataSource: 'stock_age_tracking', format: 'currency' },
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
  // Additional critical demand/replenishment KPIs
  { id: 'weeks_of_supply', name: 'Weeks of Supply', category: 'inventory', dataSource: 'inventory_levels', format: 'number' },
  { id: 'safety_stock_level', name: 'Safety Stock Level', category: 'inventory', dataSource: 'inventory_levels', format: 'number' },
  { id: 'reorder_point', name: 'Reorder Point', category: 'inventory', dataSource: 'inventory_levels', format: 'number' },
  { id: 'service_level', name: 'Service Level', category: 'inventory', dataSource: 'inventory_levels', format: 'percent' },
  { id: 'lost_sales', name: 'Lost Sales', category: 'inventory', dataSource: 'inventory_levels', format: 'currency' },
  { id: 'inventory_accuracy', name: 'Inventory Accuracy', category: 'inventory', dataSource: 'inventory_levels', format: 'percent' },
  { id: 'demand_sensing_accuracy', name: 'Demand Sensing Accuracy', category: 'forecasting', dataSource: 'demand_forecasts', format: 'percent' },
  { id: 'forecast_value_add', name: 'Forecast Value Add (FVA)', category: 'forecasting', dataSource: 'demand_forecasts', format: 'percent' },
  { id: 'weighted_mape', name: 'Weighted MAPE', category: 'forecasting', dataSource: 'forecast_accuracy_tracking', format: 'percent' },
  { id: 'rmse', name: 'RMSE', category: 'forecasting', dataSource: 'forecast_accuracy_tracking', format: 'number' },
  // NEW: Holiday & Time-Based KPIs (from new tables)
  { id: 'holiday_lift', name: 'Holiday Demand Lift', category: 'forecasting', dataSource: 'holidays', format: 'percent' },
  { id: 'day_type_index', name: 'Day Type Index', category: 'forecasting', dataSource: 'time_dimension', format: 'ratio' },
  { id: 'fiscal_quarter_trend', name: 'Fiscal Quarter Trend', category: 'forecasting', dataSource: 'time_dimension', format: 'percent' },
  { id: 'yoy_units_sold', name: 'YOY Units Sold', category: 'forecasting', dataSource: 'kpi_measures', format: 'number' },
  { id: 'yoy_forecast_accuracy', name: 'YOY Forecast Accuracy', category: 'forecasting', dataSource: 'kpi_measures', format: 'percent' },
  { id: 'seasonal_index', name: 'Seasonal Index', category: 'forecasting', dataSource: 'time_dimension', format: 'ratio' },
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
  // Additional critical supply chain KPIs
  { id: 'inbound_fill_rate', name: 'Inbound Fill Rate', category: 'supplier', dataSource: 'supplier_orders', format: 'percent' },
  { id: 'receiving_accuracy', name: 'Receiving Accuracy', category: 'logistics', dataSource: 'supplier_orders', format: 'percent' },
  { id: 'vendor_scorecard', name: 'Vendor Scorecard', category: 'supplier', dataSource: 'suppliers', format: 'ratio' },
  { id: 'cost_per_case', name: 'Cost per Case', category: 'cost', dataSource: 'supplier_orders', format: 'currency' },
  { id: 'carbon_footprint', name: 'Carbon Footprint (kg CO2)', category: 'sustainability', dataSource: 'shipping_routes', format: 'number' },
  { id: 'order_accuracy', name: 'Order Accuracy', category: 'logistics', dataSource: 'supplier_orders', format: 'percent' },
  { id: 'backorder_rate', name: 'Backorder Rate', category: 'logistics', dataSource: 'supplier_orders', format: 'percent' },
  { id: 'supplier_defect_rate', name: 'Supplier Defect Rate', category: 'supplier', dataSource: 'supplier_orders', format: 'percent' },
  { id: 'days_payable_outstanding', name: 'Days Payable Outstanding', category: 'financial', dataSource: 'suppliers', format: 'number' },
  { id: 'total_cost_of_ownership', name: 'Total Cost of Ownership', category: 'cost', dataSource: 'supplier_orders', format: 'currency' },
  // NEW: Vendor & PO KPIs (from new tables)
  { id: 'vendor_rating', name: 'Vendor Rating', category: 'supplier', dataSource: 'vendors', format: 'ratio' },
  { id: 'vendor_credit_limit', name: 'Vendor Credit Limit', category: 'supplier', dataSource: 'vendors', format: 'currency' },
  { id: 'po_delivery_accuracy', name: 'PO Delivery Accuracy', category: 'logistics', dataSource: 'purchase_orders', format: 'percent' },
  { id: 'po_value', name: 'Purchase Order Value', category: 'logistics', dataSource: 'purchase_orders', format: 'currency' },
  { id: 'overdue_po_count', name: 'Overdue PO Count', category: 'logistics', dataSource: 'purchase_orders', format: 'number' },
  { id: 'invoice_payment_rate', name: 'Invoice Payment Rate', category: 'financial', dataSource: 'invoices', format: 'percent' },
  { id: 'outstanding_invoice_value', name: 'Outstanding Invoice Value', category: 'financial', dataSource: 'invoices', format: 'currency' },
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
  // Additional critical space planning KPIs
  { id: 'gmrof', name: 'GMROF (Gross Margin Return on Footage)', category: 'space', dataSource: 'shelf_allocations', format: 'ratio' },
  { id: 'share_of_shelf', name: 'Share of Shelf', category: 'space', dataSource: 'shelf_allocations', format: 'percent' },
  { id: 'adjacency_compliance', name: 'Adjacency Compliance', category: 'space', dataSource: 'planograms', format: 'percent' },
  { id: 'hot_spot_conversion', name: 'Hot Spot Conversion', category: 'space', dataSource: 'store_performance', format: 'percent' },
  { id: 'cold_zone_performance', name: 'Cold Zone Performance', category: 'space', dataSource: 'store_performance', format: 'percent' },
  { id: 'promo_display_roi', name: 'Promo Display ROI', category: 'space', dataSource: 'promotions', format: 'ratio' },
  // NEW: Fixture, Employee & Markdown Display KPIs (from new tables)
  { id: 'fixture_status', name: 'Fixture Status', category: 'space', dataSource: 'fixtures', format: 'percent' },
  { id: 'fixture_capacity', name: 'Fixture Capacity (sqft)', category: 'space', dataSource: 'fixtures', format: 'number' },
  { id: 'markdown_display_lift', name: 'Markdown Display Lift', category: 'space', dataSource: 'markdowns', format: 'percent' },
  { id: 'employee_productivity', name: 'Employee Productivity', category: 'operations', dataSource: 'employees', format: 'currency' },
  { id: 'employee_sales_target', name: 'Sales Target Achievement', category: 'operations', dataSource: 'employees', format: 'percent' },
  { id: 'stock_age_shelf_impact', name: 'Stock Age Shelf Impact', category: 'space', dataSource: 'stock_age_tracking', format: 'ratio' },
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
  // Additional critical promotion KPIs
  { id: 'promo_intensity', name: 'Promo Intensity Index', category: 'promotion', dataSource: 'promotions', format: 'ratio' },
  { id: 'trade_spend_percent', name: 'Trade Spend % of Sales', category: 'promotion', dataSource: 'promotions', format: 'percent' },
  { id: 'incremental_units', name: 'Incremental Units', category: 'promotion', dataSource: 'transactions', format: 'number' },
  { id: 'base_vs_incremental', name: 'Base vs Incremental Sales', category: 'promotion', dataSource: 'transactions', format: 'ratio' },
  { id: 'promo_frequency', name: 'Promo Frequency', category: 'promotion', dataSource: 'promotions', format: 'number' },
  { id: 'depth_of_discount', name: 'Depth of Discount', category: 'promotion', dataSource: 'promotions', format: 'percent' },
  { id: 'forward_buying_index', name: 'Forward Buying Index', category: 'promotion', dataSource: 'transactions', format: 'ratio' },
  { id: 'markdown_efficiency', name: 'Markdown Efficiency', category: 'promotion', dataSource: 'promotions', format: 'percent' },
  { id: 'promo_attach_rate', name: 'Promo Attach Rate', category: 'promotion', dataSource: 'transactions', format: 'percent' },
  // NEW: Discount & Return Impact KPIs (from new tables)
  { id: 'discount_roi', name: 'Discount ROI', category: 'promotion', dataSource: 'discounts', format: 'ratio' },
  { id: 'coupon_redemption_rate', name: 'Coupon Redemption Rate', category: 'promotion', dataSource: 'discounts', format: 'percent' },
  { id: 'promo_return_rate', name: 'Promo Return Rate', category: 'promotion', dataSource: 'returns', format: 'percent' },
  { id: 'yoy_promo_roi', name: 'YOY Promo ROI', category: 'promotion', dataSource: 'kpi_measures', format: 'percent' },
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
  
  // Additional Executive KPIs for merchandising
  { id: 'fresh_waste_percent', name: 'Fresh Waste %', category: 'operations', dataSource: 'inventory_levels', format: 'percent' },
  { id: 'open_to_buy', name: 'Open-to-Buy', category: 'financial', dataSource: 'supplier_orders', format: 'currency' },
  { id: 'total_inventory_value', name: 'Total Inventory Value', category: 'inventory', dataSource: 'inventory_levels', format: 'currency' },
  { id: 'category_contribution', name: 'Category Contribution', category: 'financial', dataSource: 'transactions', format: 'percent' },
  { id: 'vendor_fill_rate', name: 'Vendor Fill Rate', category: 'supplier', dataSource: 'supplier_orders', format: 'percent' },
  // NEW: Executive Strategic KPIs from new tables
  { id: 'yoy_net_sales_growth', name: 'YOY Net Sales Growth', category: 'financial', dataSource: 'kpi_measures', format: 'percent' },
  { id: 'yoy_margin_growth', name: 'YOY Margin Growth', category: 'financial', dataSource: 'kpi_measures', format: 'percent' },
  { id: 'return_rate_overall', name: 'Overall Return Rate', category: 'operations', dataSource: 'returns', format: 'percent' },
  { id: 'refund_value', name: 'Refund Value', category: 'financial', dataSource: 'returns', format: 'currency' },
  { id: 'employee_count', name: 'Employee Count', category: 'operations', dataSource: 'employees', format: 'number' },
  { id: 'labor_cost', name: 'Labor Cost', category: 'operations', dataSource: 'employees', format: 'currency' },
  { id: 'invoice_value', name: 'Invoice Value', category: 'financial', dataSource: 'invoices', format: 'currency' },
  { id: 'holiday_sales_index', name: 'Holiday Sales Index', category: 'financial', dataSource: 'holidays', format: 'ratio' },
  { id: 'stock_age_value', name: 'Stock Age Value', category: 'inventory', dataSource: 'stock_age_tracking', format: 'currency' },
  { id: 'markdown_value', name: 'Markdown Value', category: 'financial', dataSource: 'markdowns', format: 'currency' },
];

// KPIs that have actual calculated data in the backend
// These are the only KPIs that will produce real values (not "data not available")
export const kpisWithAvailableData: string[] = [
  // Core calculated from transactions
  'revenue',
  'margin',
  'margin_percent',
  'gross_margin',
  'units_sold',
  'avg_transaction_value',
  'total_discount',
  'transaction_count',
  // Pricing module
  'avg_margin_pct',
  'avg_elasticity',
  'price_elasticity',
  // Promotion module
  'roi',
  'promo_roi',
  'lift_percent',
  'lift_pct',
  'promo_spend',
  'incremental_margin',
  // Space module
  'sales_per_sqft',
  'gmroi',
  // Derived from products
  'sku_count',
  'category_penetration',
  // Basic calculations
  'units_per_transaction',
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

// Get only KPIs that have actual data available (for suggestions)
export const getKPIsWithData = (moduleId: string): ModuleKPI[] => {
  const allKPIs = getKPIsByModule(moduleId);
  return allKPIs.filter(kpi => kpisWithAvailableData.includes(kpi.id));
};

export const getSharedKPIs = (): ModuleKPI[] => sharedKPIs;

export const getModuleSpecificKPIs = (moduleId: string): ModuleKPI[] => {
  const allKPIs = getKPIsByModule(moduleId);
  const sharedIds = sharedKPIs.map(k => k.id);
  return allKPIs.filter(kpi => !sharedIds.includes(kpi.id));
};

// Check if a KPI has actual data available
export const hasKPIData = (kpiId: string): boolean => {
  return kpisWithAvailableData.includes(kpiId);
};
