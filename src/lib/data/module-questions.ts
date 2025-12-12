export interface ModuleQuestion {
  id: number;
  text: string;
  tags: string[];
  metricKey: string;
  chartType: 'bar' | 'line' | 'pie' | 'area';
}

// Pricing Questions
export const pricingQuestions: ModuleQuestion[] = [
  { id: 1, text: "What is the optimal price point for our top-selling products?", tags: ['pricing', 'optimization'], metricKey: 'optimal_price', chartType: 'bar' },
  { id: 2, text: "How does price elasticity vary across product categories?", tags: ['elasticity', 'category'], metricKey: 'price_elasticity', chartType: 'bar' },
  { id: 3, text: "What's our competitive price positioning vs major retailers?", tags: ['competitive', 'positioning'], metricKey: 'competitive_index', chartType: 'bar' },
  { id: 4, text: "Which products have the highest margin opportunity?", tags: ['margin', 'opportunity'], metricKey: 'margin_percent', chartType: 'bar' },
  { id: 5, text: "How do price changes impact sales volume?", tags: ['price', 'volume'], metricKey: 'volume_impact', chartType: 'line' },
  { id: 6, text: "What's the optimal markdown strategy for seasonal items?", tags: ['markdown', 'seasonal'], metricKey: 'markdown_rate', chartType: 'area' },
  { id: 7, text: "Which regions are most price sensitive?", tags: ['regional', 'sensitivity'], metricKey: 'price_sensitivity', chartType: 'bar' },
  { id: 8, text: "How does our private label pricing compare to national brands?", tags: ['private-label', 'comparison'], metricKey: 'price_gap', chartType: 'bar' },
];

export const pricingPopularIds = [1, 2, 3, 4, 6, 7];

// Assortment Questions
export const assortmentQuestions: ModuleQuestion[] = [
  { id: 1, text: "Which SKUs should be added to the assortment?", tags: ['sku', 'expansion'], metricKey: 'sku_opportunity', chartType: 'bar' },
  { id: 2, text: "What products should be discontinued based on performance?", tags: ['rationalization', 'performance'], metricKey: 'sku_performance', chartType: 'bar' },
  { id: 3, text: "How does category penetration vary by store type?", tags: ['category', 'penetration'], metricKey: 'category_penetration', chartType: 'bar' },
  { id: 4, text: "What's the optimal brand mix for each category?", tags: ['brand', 'mix'], metricKey: 'brand_share', chartType: 'pie' },
  { id: 5, text: "Which new products are performing above expectations?", tags: ['new-product', 'performance'], metricKey: 'new_product_sales', chartType: 'bar' },
  { id: 6, text: "What's the ideal assortment depth by store cluster?", tags: ['depth', 'cluster'], metricKey: 'assortment_depth', chartType: 'bar' },
  { id: 7, text: "How do regional preferences impact assortment decisions?", tags: ['regional', 'preferences'], metricKey: 'regional_preference', chartType: 'bar' },
  { id: 8, text: "What's the private label opportunity by category?", tags: ['private-label', 'opportunity'], metricKey: 'private_label_share', chartType: 'bar' },
];

export const assortmentPopularIds = [1, 2, 3, 4, 5, 8];

// Demand Forecasting Questions
export const demandQuestions: ModuleQuestion[] = [
  { id: 1, text: "What's the demand forecast for the next 4 weeks?", tags: ['forecast', 'demand'], metricKey: 'demand_forecast', chartType: 'line' },
  { id: 2, text: "Which products are at risk of stockout?", tags: ['stockout', 'risk'], metricKey: 'stockout_rate', chartType: 'bar' },
  { id: 3, text: "How accurate are our demand forecasts by category?", tags: ['accuracy', 'category'], metricKey: 'forecast_accuracy', chartType: 'bar' },
  { id: 4, text: "What's the optimal reorder point for fast-moving items?", tags: ['reorder', 'fast-moving'], metricKey: 'reorder_point', chartType: 'bar' },
  { id: 5, text: "How does seasonality affect demand patterns?", tags: ['seasonality', 'patterns'], metricKey: 'seasonal_demand', chartType: 'area' },
  { id: 6, text: "Which stores have the highest inventory turnover?", tags: ['turnover', 'store'], metricKey: 'inventory_turnover', chartType: 'bar' },
  { id: 7, text: "What's the optimal safety stock level by product?", tags: ['safety-stock', 'optimization'], metricKey: 'safety_stock', chartType: 'bar' },
  { id: 8, text: "How do promotions impact demand forecasting accuracy?", tags: ['promotions', 'accuracy'], metricKey: 'promo_forecast_impact', chartType: 'line' },
];

export const demandPopularIds = [1, 2, 3, 5, 6, 7];

// Supply Chain Questions
export const supplyChainQuestions: ModuleQuestion[] = [
  { id: 1, text: "Which suppliers have the best on-time delivery performance?", tags: ['supplier', 'delivery'], metricKey: 'on_time_delivery', chartType: 'bar' },
  { id: 2, text: "What's the average lead time by product category?", tags: ['lead-time', 'category'], metricKey: 'lead_time', chartType: 'bar' },
  { id: 3, text: "How can we optimize distribution routes?", tags: ['distribution', 'optimization'], metricKey: 'route_efficiency', chartType: 'bar' },
  { id: 4, text: "Which warehouses are operating at capacity?", tags: ['warehouse', 'capacity'], metricKey: 'warehouse_utilization', chartType: 'bar' },
  { id: 5, text: "What's the cost breakdown of our logistics operations?", tags: ['cost', 'logistics'], metricKey: 'logistics_cost', chartType: 'pie' },
  { id: 6, text: "How do supplier issues impact store availability?", tags: ['supplier', 'availability'], metricKey: 'supplier_fill_rate', chartType: 'bar' },
  { id: 7, text: "What's the perfect order rate by region?", tags: ['perfect-order', 'regional'], metricKey: 'perfect_order_rate', chartType: 'bar' },
  { id: 8, text: "How can we reduce transportation costs?", tags: ['transportation', 'cost'], metricKey: 'transport_cost_per_unit', chartType: 'bar' },
];

export const supplyChainPopularIds = [1, 2, 4, 5, 6, 7];

// Space Planning Questions
export const spaceQuestions: ModuleQuestion[] = [
  { id: 1, text: "Which categories generate the highest sales per square foot?", tags: ['sales', 'space'], metricKey: 'sales_per_sqft', chartType: 'bar' },
  { id: 2, text: "How should we allocate shelf space across categories?", tags: ['allocation', 'category'], metricKey: 'category_space_share', chartType: 'pie' },
  { id: 3, text: "What's the optimal number of facings for top products?", tags: ['facings', 'optimization'], metricKey: 'facings_per_sku', chartType: 'bar' },
  { id: 4, text: "How does planogram compliance impact sales?", tags: ['planogram', 'compliance'], metricKey: 'planogram_compliance', chartType: 'bar' },
  { id: 5, text: "Which store layouts drive the highest conversion?", tags: ['layout', 'conversion'], metricKey: 'store_conversion', chartType: 'bar' },
  { id: 6, text: "What's the GMROI by category and shelf position?", tags: ['gmroi', 'position'], metricKey: 'gmroi', chartType: 'bar' },
  { id: 7, text: "How do endcap displays impact category sales?", tags: ['endcap', 'impact'], metricKey: 'endcap_lift', chartType: 'bar' },
  { id: 8, text: "What's the optimal product adjacency for cross-selling?", tags: ['adjacency', 'cross-sell'], metricKey: 'adjacency_impact', chartType: 'bar' },
];

export const spacePopularIds = [1, 2, 3, 4, 6, 7];

export const getQuestionsByModule = (moduleId: string): ModuleQuestion[] => {
  switch (moduleId) {
    case 'pricing': return pricingQuestions;
    case 'assortment': return assortmentQuestions;
    case 'demand': return demandQuestions;
    case 'supply-chain': return supplyChainQuestions;
    case 'space': return spaceQuestions;
    default: return [];
  }
};

export const getPopularIdsByModule = (moduleId: string): number[] => {
  switch (moduleId) {
    case 'pricing': return pricingPopularIds;
    case 'assortment': return assortmentPopularIds;
    case 'demand': return demandPopularIds;
    case 'supply-chain': return supplyChainPopularIds;
    case 'space': return spacePopularIds;
    default: return [];
  }
};
