// Export utility for module questions

export interface QuestionExportRow {
  module: string;
  rank: number;
  question: string;
  tags: string;
  metricKey: string;
  chartType: string;
}

export const getTop5QuestionsAllModules = (): QuestionExportRow[] => {
  const data: QuestionExportRow[] = [
    // Pricing Module - Top 5
    { module: 'Pricing', rank: 1, question: 'What is the optimal price point for our top-selling products?', tags: 'pricing, optimization', metricKey: 'optimal_price', chartType: 'bar' },
    { module: 'Pricing', rank: 2, question: 'How does price elasticity vary across product categories?', tags: 'elasticity, category', metricKey: 'price_elasticity', chartType: 'bar' },
    { module: 'Pricing', rank: 3, question: "What's our competitive price positioning vs major retailers?", tags: 'competitive, positioning', metricKey: 'competitive_index', chartType: 'bar' },
    { module: 'Pricing', rank: 4, question: 'Which competitors are most aggressive on pricing?', tags: 'competitive, analysis', metricKey: 'competitor_aggression', chartType: 'bar' },
    { module: 'Pricing', rank: 5, question: 'Which categories have declining margins and why?', tags: 'margin, trend, drivers', metricKey: 'margin_decline', chartType: 'line' },
    
    // Assortment Module - Top 5
    { module: 'Assortment', rank: 1, question: 'Which SKUs should be added to the assortment?', tags: 'sku, expansion', metricKey: 'sku_opportunity', chartType: 'bar' },
    { module: 'Assortment', rank: 2, question: 'What products should be discontinued based on performance?', tags: 'rationalization, performance', metricKey: 'sku_performance', chartType: 'bar' },
    { module: 'Assortment', rank: 3, question: "What's the optimal brand mix for each category?", tags: 'brand, mix', metricKey: 'brand_share', chartType: 'pie' },
    { module: 'Assortment', rank: 4, question: "What's the optimal SKU count per category?", tags: 'sku-count, optimization', metricKey: 'optimal_sku_count', chartType: 'bar' },
    { module: 'Assortment', rank: 5, question: 'Which categories need assortment expansion vs rationalization?', tags: 'strategy, category', metricKey: 'assortment_strategy', chartType: 'bar' },
    
    // Demand Forecasting Module - Top 5
    { module: 'Demand Forecasting', rank: 1, question: "What's the demand forecast for the next 4 weeks?", tags: 'forecast, demand', metricKey: 'demand_forecast', chartType: 'line' },
    { module: 'Demand Forecasting', rank: 2, question: 'Which products are at risk of stockout?', tags: 'stockout, risk', metricKey: 'stockout_rate', chartType: 'bar' },
    { module: 'Demand Forecasting', rank: 3, question: 'How accurate are our demand forecasts by category?', tags: 'accuracy, category', metricKey: 'forecast_accuracy', chartType: 'bar' },
    { module: 'Demand Forecasting', rank: 4, question: 'How does seasonality affect demand patterns?', tags: 'seasonality, patterns', metricKey: 'seasonal_demand', chartType: 'area' },
    { module: 'Demand Forecasting', rank: 5, question: 'What products need to be reordered this week?', tags: 'replenishment, reorder, urgent', metricKey: 'reorder_list', chartType: 'bar' },
    
    // Supply Chain Module - Top 5
    { module: 'Supply Chain', rank: 1, question: 'Which suppliers have the best on-time delivery performance?', tags: 'supplier, delivery', metricKey: 'on_time_delivery', chartType: 'bar' },
    { module: 'Supply Chain', rank: 2, question: 'Which suppliers have the highest reliability scores?', tags: 'supplier, reliability', metricKey: 'reliability_score', chartType: 'bar' },
    { module: 'Supply Chain', rank: 3, question: 'Which orders are currently at risk of being late?', tags: 'orders, risk', metricKey: 'at_risk_orders', chartType: 'bar' },
    { module: 'Supply Chain', rank: 4, question: "What's the cost breakdown of our logistics operations?", tags: 'cost, logistics', metricKey: 'logistics_cost', chartType: 'pie' },
    { module: 'Supply Chain', rank: 5, question: 'Which suppliers are single-source risks?', tags: 'risk, single-source', metricKey: 'supplier_risk', chartType: 'bar' },
    
    // Space Planning Module - Top 5
    { module: 'Space Planning', rank: 1, question: 'Which categories generate the highest sales per square foot?', tags: 'sales, space', metricKey: 'sales_per_sqft', chartType: 'bar' },
    { module: 'Space Planning', rank: 2, question: 'How should we allocate shelf space across categories?', tags: 'allocation, category', metricKey: 'category_space_share', chartType: 'pie' },
    { module: 'Space Planning', rank: 3, question: "What's the optimal number of facings for top products?", tags: 'facings, optimization', metricKey: 'facings_per_sku', chartType: 'bar' },
    { module: 'Space Planning', rank: 4, question: 'How does planogram compliance impact sales?', tags: 'planogram, compliance', metricKey: 'planogram_compliance', chartType: 'bar' },
    { module: 'Space Planning', rank: 5, question: "What's the GMROI by category and shelf position?", tags: 'gmroi, position', metricKey: 'gmroi', chartType: 'bar' },
    
    // Promotion Module - Top 5
    { module: 'Promotion', rank: 1, question: 'Which promotions delivered the highest ROI this quarter?', tags: 'roi, performance', metricKey: 'roi', chartType: 'bar' },
    { module: 'Promotion', rank: 2, question: 'What is the lift % by promotion type?', tags: 'lift, type', metricKey: 'lift_pct', chartType: 'bar' },
    { module: 'Promotion', rank: 3, question: 'Which promotions lost money and why?', tags: 'loss, analysis', metricKey: 'negative_roi', chartType: 'bar' },
    { module: 'Promotion', rank: 4, question: 'What is the optimal discount depth by category?', tags: 'depth, optimization', metricKey: 'optimal_depth', chartType: 'bar' },
    { module: 'Promotion', rank: 5, question: 'What is the net halo minus cannibalization for each promotion?', tags: 'halo, cannibalization', metricKey: 'net_halo', chartType: 'bar' },
    
    // Cross-Module Analysis - Top 5
    { module: 'Cross-Module', rank: 1, question: 'How does pricing strategy impact demand forecasting accuracy?', tags: 'pricing, demand, cross-module', metricKey: 'pricing_demand_correlation', chartType: 'line' },
    { module: 'Cross-Module', rank: 2, question: "What's the end-to-end margin impact from supplier to shelf?", tags: 'supply-chain, pricing, space, cross-module', metricKey: 'e2e_margin', chartType: 'bar' },
    { module: 'Cross-Module', rank: 3, question: 'How does assortment complexity impact supply chain efficiency?', tags: 'assortment, supply-chain, cross-module', metricKey: 'assortment_supply_efficiency', chartType: 'bar' },
    { module: 'Cross-Module', rank: 4, question: "What's the optimal inventory-to-space ratio by category?", tags: 'demand, space, cross-module', metricKey: 'inventory_space_ratio', chartType: 'bar' },
    { module: 'Cross-Module', rank: 5, question: 'How do promotional prices impact both demand and space productivity?', tags: 'pricing, demand, space, cross-module', metricKey: 'promo_holistic_impact', chartType: 'bar' },
  ];
  
  return data;
};

export const exportToCSV = (data: QuestionExportRow[], filename: string = 'module-top-questions.csv'): void => {
  // CSV header
  const headers = ['Module', 'Rank', 'Question', 'Tags', 'Metric Key', 'Chart Type'];
  
  // Convert data to CSV rows
  const csvRows = [
    headers.join(','),
    ...data.map(row => [
      `"${row.module}"`,
      row.rank,
      `"${row.question.replace(/"/g, '""')}"`,
      `"${row.tags}"`,
      `"${row.metricKey}"`,
      `"${row.chartType}"`
    ].join(','))
  ];
  
  // Create blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Direct download function
export const downloadModuleQuestions = (): void => {
  const data = getTop5QuestionsAllModules();
  exportToCSV(data, 'Algonomy-Maya-Top5-Questions-by-Module.csv');
};
