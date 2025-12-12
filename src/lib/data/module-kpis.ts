export interface ModuleKPI {
  id: string;
  name: string;
  category: string;
  dataSource: string;
  format: 'currency' | 'percent' | 'number' | 'ratio';
}

// Pricing KPIs
export const pricingKPIs: ModuleKPI[] = [
  { id: 'price_elasticity', name: 'Price Elasticity', category: 'pricing', dataSource: 'products', format: 'ratio' },
  { id: 'margin_percent', name: 'Margin %', category: 'financial', dataSource: 'products', format: 'percent' },
  { id: 'competitive_index', name: 'Competitive Price Index', category: 'pricing', dataSource: 'competitor_data', format: 'ratio' },
  { id: 'price_gap', name: 'Price Gap vs Competition', category: 'pricing', dataSource: 'competitor_data', format: 'percent' },
  { id: 'revenue_per_unit', name: 'Revenue per Unit', category: 'financial', dataSource: 'transactions', format: 'currency' },
  { id: 'price_variance', name: 'Price Variance', category: 'pricing', dataSource: 'transactions', format: 'percent' },
  { id: 'markdown_rate', name: 'Markdown Rate', category: 'pricing', dataSource: 'transactions', format: 'percent' },
  { id: 'gross_margin', name: 'Gross Margin', category: 'financial', dataSource: 'transactions', format: 'currency' },
];

// Assortment KPIs
export const assortmentKPIs: ModuleKPI[] = [
  { id: 'sku_count', name: 'Active SKU Count', category: 'assortment', dataSource: 'products', format: 'number' },
  { id: 'category_penetration', name: 'Category Penetration', category: 'assortment', dataSource: 'transactions', format: 'percent' },
  { id: 'brand_share', name: 'Brand Share', category: 'assortment', dataSource: 'transactions', format: 'percent' },
  { id: 'new_product_sales', name: 'New Product Sales', category: 'assortment', dataSource: 'transactions', format: 'currency' },
  { id: 'product_velocity', name: 'Product Velocity', category: 'assortment', dataSource: 'transactions', format: 'number' },
  { id: 'assortment_efficiency', name: 'Assortment Efficiency', category: 'assortment', dataSource: 'products', format: 'percent' },
  { id: 'category_growth', name: 'Category Growth', category: 'assortment', dataSource: 'transactions', format: 'percent' },
  { id: 'private_label_share', name: 'Private Label Share', category: 'assortment', dataSource: 'transactions', format: 'percent' },
];

// Demand Forecasting KPIs
export const demandKPIs: ModuleKPI[] = [
  { id: 'forecast_accuracy', name: 'Forecast Accuracy', category: 'forecasting', dataSource: 'inventory_levels', format: 'percent' },
  { id: 'stock_days', name: 'Days of Stock', category: 'inventory', dataSource: 'inventory_levels', format: 'number' },
  { id: 'stockout_rate', name: 'Stockout Rate', category: 'inventory', dataSource: 'inventory_levels', format: 'percent' },
  { id: 'overstock_rate', name: 'Overstock Rate', category: 'inventory', dataSource: 'inventory_levels', format: 'percent' },
  { id: 'inventory_turnover', name: 'Inventory Turnover', category: 'inventory', dataSource: 'inventory_levels', format: 'ratio' },
  { id: 'fill_rate', name: 'Fill Rate', category: 'inventory', dataSource: 'inventory_levels', format: 'percent' },
  { id: 'demand_variability', name: 'Demand Variability', category: 'forecasting', dataSource: 'transactions', format: 'percent' },
  { id: 'reorder_frequency', name: 'Reorder Frequency', category: 'inventory', dataSource: 'inventory_levels', format: 'number' },
];

// Supply Chain KPIs
export const supplyChainKPIs: ModuleKPI[] = [
  { id: 'lead_time', name: 'Lead Time (Days)', category: 'logistics', dataSource: 'inventory_levels', format: 'number' },
  { id: 'on_time_delivery', name: 'On-Time Delivery', category: 'logistics', dataSource: 'stores', format: 'percent' },
  { id: 'supplier_fill_rate', name: 'Supplier Fill Rate', category: 'supplier', dataSource: 'inventory_levels', format: 'percent' },
  { id: 'logistics_cost', name: 'Logistics Cost', category: 'cost', dataSource: 'stores', format: 'currency' },
  { id: 'warehouse_utilization', name: 'Warehouse Utilization', category: 'logistics', dataSource: 'stores', format: 'percent' },
  { id: 'transport_cost_per_unit', name: 'Transport Cost/Unit', category: 'cost', dataSource: 'stores', format: 'currency' },
  { id: 'order_cycle_time', name: 'Order Cycle Time', category: 'logistics', dataSource: 'inventory_levels', format: 'number' },
  { id: 'perfect_order_rate', name: 'Perfect Order Rate', category: 'logistics', dataSource: 'stores', format: 'percent' },
];

// Space Planning KPIs
export const spaceKPIs: ModuleKPI[] = [
  { id: 'sales_per_sqft', name: 'Sales per Sq Ft', category: 'space', dataSource: 'store_performance', format: 'currency' },
  { id: 'gmroi', name: 'GMROI', category: 'financial', dataSource: 'store_performance', format: 'ratio' },
  { id: 'shelf_capacity_utilization', name: 'Shelf Capacity %', category: 'space', dataSource: 'inventory_levels', format: 'percent' },
  { id: 'facings_per_sku', name: 'Facings per SKU', category: 'space', dataSource: 'products', format: 'number' },
  { id: 'category_space_share', name: 'Category Space Share', category: 'space', dataSource: 'products', format: 'percent' },
  { id: 'planogram_compliance', name: 'Planogram Compliance', category: 'space', dataSource: 'stores', format: 'percent' },
  { id: 'out_of_shelf', name: 'Out of Shelf Rate', category: 'space', dataSource: 'inventory_levels', format: 'percent' },
  { id: 'impulse_purchase_rate', name: 'Impulse Purchase Rate', category: 'space', dataSource: 'transactions', format: 'percent' },
];

export const getKPIsByModule = (moduleId: string): ModuleKPI[] => {
  switch (moduleId) {
    case 'pricing': return pricingKPIs;
    case 'assortment': return assortmentKPIs;
    case 'demand': return demandKPIs;
    case 'supply-chain': return supplyChainKPIs;
    case 'space': return spaceKPIs;
    default: return [];
  }
};
