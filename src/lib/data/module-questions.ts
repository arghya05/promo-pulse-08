export interface ModuleQuestion {
  id: number;
  text: string;
  tags: string[];
  metricKey: string;
  chartType: 'bar' | 'line' | 'pie' | 'area';
  crossModule?: string[]; // For cross-module analysis
  isSimulation?: boolean; // For scenario simulation
}

// Pricing Questions (38+)
export const pricingQuestions: ModuleQuestion[] = [
  // Core Pricing Optimization
  { id: 1, text: "What is the optimal price point for our top-selling products?", tags: ['pricing', 'optimization'], metricKey: 'optimal_price', chartType: 'bar' },
  { id: 2, text: "How does price elasticity vary across product categories?", tags: ['elasticity', 'category'], metricKey: 'price_elasticity', chartType: 'bar' },
  { id: 3, text: "What's our competitive price positioning vs major retailers?", tags: ['competitive', 'positioning'], metricKey: 'competitive_index', chartType: 'bar' },
  { id: 4, text: "Which products have the highest margin opportunity?", tags: ['margin', 'opportunity'], metricKey: 'margin_percent', chartType: 'bar' },
  { id: 5, text: "How do price changes impact sales volume?", tags: ['price', 'volume'], metricKey: 'volume_impact', chartType: 'line' },
  { id: 6, text: "What's the optimal markdown strategy for seasonal items?", tags: ['markdown', 'seasonal'], metricKey: 'markdown_rate', chartType: 'area' },
  { id: 7, text: "Which regions are most price sensitive?", tags: ['regional', 'sensitivity'], metricKey: 'price_sensitivity', chartType: 'bar' },
  { id: 8, text: "How does our private label pricing compare to national brands?", tags: ['private-label', 'comparison'], metricKey: 'price_gap', chartType: 'bar' },
  
  // Competitive Intelligence
  { id: 9, text: "What's the price-volume relationship for each category?", tags: ['price', 'volume', 'category'], metricKey: 'price_volume_curve', chartType: 'line' },
  { id: 10, text: "Which competitors are most aggressive on pricing?", tags: ['competitive', 'analysis'], metricKey: 'competitor_aggression', chartType: 'bar' },
  { id: 11, text: "What's the impact of recent price changes on margin?", tags: ['price-change', 'margin'], metricKey: 'margin_impact', chartType: 'bar' },
  { id: 12, text: "Where are our biggest price gaps vs Walmart?", tags: ['competitive', 'walmart'], metricKey: 'walmart_gap', chartType: 'bar' },
  { id: 13, text: "How do competitor price changes affect our sales?", tags: ['competitive', 'impact'], metricKey: 'competitor_impact', chartType: 'line' },
  { id: 14, text: "What products are we over-priced vs competition?", tags: ['competitive', 'overpriced'], metricKey: 'overpriced_items', chartType: 'bar' },
  { id: 15, text: "What products are we under-priced and leaving margin on the table?", tags: ['competitive', 'underpriced'], metricKey: 'underpriced_items', chartType: 'bar' },
  
  // Margin Management
  { id: 16, text: "What's the cannibalization effect of price promotions?", tags: ['cannibalization', 'promo'], metricKey: 'cannibalization_rate', chartType: 'bar' },
  { id: 17, text: "Which categories have declining margins and why?", tags: ['margin', 'trend', 'drivers'], metricKey: 'margin_decline', chartType: 'line' },
  { id: 18, text: "What's the margin impact of recent cost increases?", tags: ['cost', 'margin', 'impact'], metricKey: 'cost_impact', chartType: 'bar' },
  { id: 19, text: "How can we improve margins without losing volume?", tags: ['margin', 'optimization'], metricKey: 'margin_opportunity', chartType: 'bar' },
  { id: 20, text: "What's driving margin erosion in each category?", tags: ['margin', 'drivers', 'erosion'], metricKey: 'margin_erosion_drivers', chartType: 'bar' },
  
  // Elasticity & Price Sensitivity
  { id: 21, text: "What products are over-priced relative to elasticity?", tags: ['overpriced', 'opportunity'], metricKey: 'price_optimization_gap', chartType: 'bar' },
  { id: 22, text: "What's the optimal price ladder within each category?", tags: ['price-ladder', 'tiering'], metricKey: 'price_tier_performance', chartType: 'bar' },
  { id: 23, text: "Which customer segments are most price sensitive?", tags: ['customer', 'sensitivity'], metricKey: 'customer_sensitivity', chartType: 'bar' },
  { id: 24, text: "How does weather impact price sensitivity?", tags: ['weather', 'sensitivity'], metricKey: 'weather_price_impact', chartType: 'line' },
  { id: 25, text: "What's the price elasticity for each brand?", tags: ['brand', 'elasticity'], metricKey: 'brand_elasticity', chartType: 'bar' },
  
  // Price Change Analysis
  { id: 26, text: "What recent price changes performed best?", tags: ['price-change', 'performance'], metricKey: 'price_change_success', chartType: 'bar' },
  { id: 27, text: "What recent price changes hurt volume the most?", tags: ['price-change', 'failure'], metricKey: 'price_change_failure', chartType: 'bar' },
  { id: 28, text: "What's the optimal timing for price increases?", tags: ['timing', 'price-increase'], metricKey: 'optimal_timing', chartType: 'line' },
  { id: 29, text: "How long does it take for price changes to stabilize volume?", tags: ['price-change', 'recovery'], metricKey: 'recovery_time', chartType: 'line' },
  
  // Pricing Strategy
  { id: 30, text: "How do everyday low prices compare to promotional pricing effectiveness?", tags: ['edlp', 'promo', 'strategy'], metricKey: 'pricing_strategy', chartType: 'bar' },
  { id: 31, text: "What's the ideal price gap between private label and national brands?", tags: ['private-label', 'gap', 'strategy'], metricKey: 'pl_nb_gap', chartType: 'bar' },
  { id: 32, text: "Which categories should use EDLP vs Hi-Lo pricing?", tags: ['strategy', 'category'], metricKey: 'pricing_strategy_fit', chartType: 'bar' },
  
  // Simulation / What-If
  { id: 33, text: "What if we increase prices by 5% on high-elasticity products?", tags: ['simulation', 'price-increase'], metricKey: 'simulated_revenue', chartType: 'bar', isSimulation: true },
  { id: 34, text: "What if we match competitor prices on key value items?", tags: ['simulation', 'competitive'], metricKey: 'simulated_share', chartType: 'bar', isSimulation: true },
  { id: 35, text: "What if we reduce prices by 10% on slow-moving inventory?", tags: ['simulation', 'markdown'], metricKey: 'simulated_velocity', chartType: 'bar', isSimulation: true },
  { id: 36, text: "What if commodity costs increase by 15%?", tags: ['simulation', 'cost'], metricKey: 'simulated_margin_impact', chartType: 'bar', isSimulation: true },
  { id: 37, text: "What if we implement zone pricing by region?", tags: ['simulation', 'zone-pricing'], metricKey: 'simulated_zone_impact', chartType: 'bar', isSimulation: true },
  
  // Cross-module
  { id: 38, text: "How does pricing impact demand forecasting accuracy?", tags: ['cross-module', 'demand'], metricKey: 'demand_price_correlation', chartType: 'line', crossModule: ['demand'] },
  { id: 39, text: "What's the relationship between price changes and inventory levels?", tags: ['cross-module', 'inventory'], metricKey: 'price_inventory_impact', chartType: 'line', crossModule: ['demand', 'supply-chain'] },
  { id: 40, text: "How do price changes affect shelf space productivity?", tags: ['cross-module', 'space'], metricKey: 'price_space_impact', chartType: 'bar', crossModule: ['space'] },
];

export const pricingPopularIds = [1, 2, 3, 10, 17, 33, 38];

// Assortment Questions (40+)
export const assortmentQuestions: ModuleQuestion[] = [
  // Core Assortment Planning
  { id: 1, text: "Which SKUs should be added to the assortment?", tags: ['sku', 'expansion'], metricKey: 'sku_opportunity', chartType: 'bar' },
  { id: 2, text: "What products should be discontinued based on performance?", tags: ['rationalization', 'performance'], metricKey: 'sku_performance', chartType: 'bar' },
  { id: 3, text: "How does category penetration vary by store type?", tags: ['category', 'penetration'], metricKey: 'category_penetration', chartType: 'bar' },
  { id: 4, text: "What's the optimal brand mix for each category?", tags: ['brand', 'mix'], metricKey: 'brand_share', chartType: 'pie' },
  { id: 5, text: "Which new products are performing above expectations?", tags: ['new-product', 'performance'], metricKey: 'new_product_sales', chartType: 'bar' },
  { id: 6, text: "What's the ideal assortment depth by store cluster?", tags: ['depth', 'cluster'], metricKey: 'assortment_depth', chartType: 'bar' },
  { id: 7, text: "How do regional preferences impact assortment decisions?", tags: ['regional', 'preferences'], metricKey: 'regional_preference', chartType: 'bar' },
  { id: 8, text: "What's the private label opportunity by category?", tags: ['private-label', 'opportunity'], metricKey: 'private_label_share', chartType: 'bar' },
  
  // SKU Rationalization
  { id: 9, text: "Which products have declining velocity trends?", tags: ['velocity', 'trend'], metricKey: 'velocity_trend', chartType: 'line' },
  { id: 10, text: "What's the optimal SKU count per category?", tags: ['sku-count', 'optimization'], metricKey: 'optimal_sku_count', chartType: 'bar' },
  { id: 11, text: "What's the bottom 10% of SKUs by velocity?", tags: ['bottom-performers', 'velocity'], metricKey: 'low_velocity_skus', chartType: 'bar' },
  { id: 12, text: "Which SKUs have high inventory but low sales velocity?", tags: ['dead-stock', 'inventory'], metricKey: 'dead_stock', chartType: 'bar' },
  { id: 13, text: "What's the SKU productivity by category?", tags: ['productivity', 'category'], metricKey: 'sku_productivity', chartType: 'bar' },
  { id: 14, text: "Which duplicate or overlapping SKUs can be consolidated?", tags: ['consolidation', 'overlap'], metricKey: 'sku_overlap', chartType: 'bar' },
  
  // Brand Portfolio Analysis
  { id: 15, text: "Which brands are over-represented vs their sales contribution?", tags: ['brand', 'efficiency'], metricKey: 'brand_space_efficiency', chartType: 'bar' },
  { id: 16, text: "What's the brand performance by category and region?", tags: ['brand', 'regional'], metricKey: 'brand_regional_perf', chartType: 'bar' },
  { id: 17, text: "How does brand loyalty vary across customer segments?", tags: ['brand', 'loyalty', 'segment'], metricKey: 'brand_loyalty', chartType: 'bar' },
  { id: 18, text: "What's the ideal price gap between private label and national brands?", tags: ['private-label', 'gap'], metricKey: 'pl_nb_gap', chartType: 'bar' },
  { id: 19, text: "Which national brand SKUs can be replaced with private label?", tags: ['private-label', 'substitution'], metricKey: 'pl_opportunity', chartType: 'bar' },
  
  // Category Management
  { id: 20, text: "Which categories need assortment expansion vs rationalization?", tags: ['strategy', 'category'], metricKey: 'assortment_strategy', chartType: 'bar' },
  { id: 21, text: "What's the category role analysis (destination, routine, seasonal)?", tags: ['category-role', 'strategy'], metricKey: 'category_role', chartType: 'pie' },
  { id: 22, text: "How does category performance vary by store format?", tags: ['category', 'format'], metricKey: 'category_format_perf', chartType: 'bar' },
  { id: 23, text: "What's the subcategory growth opportunity by region?", tags: ['subcategory', 'growth'], metricKey: 'subcategory_growth', chartType: 'bar' },
  { id: 24, text: "Which emerging trends should influence our assortment?", tags: ['trends', 'emerging'], metricKey: 'trend_signals', chartType: 'bar' },
  
  // Customer & Basket Analysis
  { id: 25, text: "What's the customer basket affinity for product pairings?", tags: ['affinity', 'basket'], metricKey: 'product_affinity', chartType: 'bar' },
  { id: 26, text: "How does assortment variety impact store performance?", tags: ['variety', 'performance'], metricKey: 'variety_impact', chartType: 'line' },
  { id: 27, text: "What products are frequently out-of-stock substituted?", tags: ['substitution', 'oos'], metricKey: 'substitution_rate', chartType: 'bar' },
  { id: 28, text: "What's the halo effect of key value items on category sales?", tags: ['halo', 'kvi'], metricKey: 'halo_impact', chartType: 'bar' },
  { id: 29, text: "Which products drive customer trips vs basket fill?", tags: ['trip-driver', 'basket-fill'], metricKey: 'trip_driver_analysis', chartType: 'bar' },
  { id: 30, text: "What's the market basket analysis for cross-sell opportunities?", tags: ['basket', 'cross-sell'], metricKey: 'cross_sell_opportunity', chartType: 'bar' },
  
  // Assortment Drivers & Signals
  { id: 31, text: "What market trends are driving category growth?", tags: ['market-trends', 'drivers'], metricKey: 'market_drivers', chartType: 'bar' },
  { id: 32, text: "How do competitor assortments compare to ours?", tags: ['competitive', 'assortment'], metricKey: 'competitive_assortment', chartType: 'bar' },
  { id: 33, text: "What's driving SKU proliferation in each category?", tags: ['proliferation', 'drivers'], metricKey: 'proliferation_drivers', chartType: 'bar' },
  { id: 34, text: "What seasonal assortment adjustments are needed?", tags: ['seasonal', 'adjustment'], metricKey: 'seasonal_assortment', chartType: 'line' },
  
  // Simulation / What-If
  { id: 35, text: "What if we remove the bottom 10% of SKUs by velocity?", tags: ['simulation', 'rationalization'], metricKey: 'simulated_efficiency', chartType: 'bar', isSimulation: true },
  { id: 36, text: "What if we add private label alternatives to top national brands?", tags: ['simulation', 'private-label'], metricKey: 'simulated_margin', chartType: 'bar', isSimulation: true },
  { id: 37, text: "What if we expand organic/natural product assortment by 20%?", tags: ['simulation', 'organic'], metricKey: 'simulated_organic', chartType: 'bar', isSimulation: true },
  { id: 38, text: "What if we localize assortment by regional preferences?", tags: ['simulation', 'localization'], metricKey: 'simulated_localization', chartType: 'bar', isSimulation: true },
  { id: 39, text: "What if we reduce SKU count by 15% per category?", tags: ['simulation', 'reduction'], metricKey: 'simulated_reduction', chartType: 'bar', isSimulation: true },
  
  // Cross-module
  { id: 40, text: "How does assortment depth impact space productivity?", tags: ['cross-module', 'space'], metricKey: 'assortment_space_efficiency', chartType: 'bar', crossModule: ['space'] },
  { id: 41, text: "What's the supply chain complexity impact of current assortment?", tags: ['cross-module', 'supply-chain'], metricKey: 'assortment_complexity', chartType: 'bar', crossModule: ['supply-chain'] },
  { id: 42, text: "How does assortment strategy affect demand forecasting?", tags: ['cross-module', 'demand'], metricKey: 'assortment_demand_impact', chartType: 'line', crossModule: ['demand'] },
];

export const assortmentPopularIds = [1, 2, 4, 10, 20, 25, 35];

// Demand Forecasting & Replenishment Questions (30+)
export const demandQuestions: ModuleQuestion[] = [
  // Core Demand Forecasting
  { id: 1, text: "What's the demand forecast for the next 4 weeks?", tags: ['forecast', 'demand'], metricKey: 'demand_forecast', chartType: 'line' },
  { id: 2, text: "Which products are at risk of stockout?", tags: ['stockout', 'risk'], metricKey: 'stockout_rate', chartType: 'bar' },
  { id: 3, text: "How accurate are our demand forecasts by category?", tags: ['accuracy', 'category'], metricKey: 'forecast_accuracy', chartType: 'bar' },
  { id: 4, text: "What's the optimal reorder point for fast-moving items?", tags: ['reorder', 'fast-moving'], metricKey: 'reorder_point', chartType: 'bar' },
  { id: 5, text: "How does seasonality affect demand patterns?", tags: ['seasonality', 'patterns'], metricKey: 'seasonal_demand', chartType: 'area' },
  { id: 6, text: "Which stores have the highest inventory turnover?", tags: ['turnover', 'store'], metricKey: 'inventory_turnover', chartType: 'bar' },
  { id: 7, text: "What's the optimal safety stock level by product?", tags: ['safety-stock', 'optimization'], metricKey: 'safety_stock', chartType: 'bar' },
  { id: 8, text: "How do promotions impact demand forecasting accuracy?", tags: ['promotions', 'accuracy'], metricKey: 'promo_forecast_impact', chartType: 'line' },
  
  // Extended Demand Forecasting
  { id: 9, text: "What's the demand trend for emerging vs declining categories?", tags: ['trend', 'category'], metricKey: 'category_trend', chartType: 'line' },
  { id: 10, text: "How does weather impact demand by category?", tags: ['weather', 'demand'], metricKey: 'weather_demand_impact', chartType: 'line' },
  { id: 11, text: "What's the bullwhip effect in our demand signal?", tags: ['bullwhip', 'variability'], metricKey: 'demand_variability', chartType: 'line' },
  { id: 12, text: "Which products have the most volatile demand?", tags: ['volatility', 'product'], metricKey: 'demand_volatility', chartType: 'bar' },
  { id: 13, text: "What's the forecast bias by category and model?", tags: ['bias', 'model'], metricKey: 'forecast_bias', chartType: 'bar' },
  { id: 14, text: "How does day-of-week affect demand patterns?", tags: ['day-of-week', 'pattern'], metricKey: 'dow_pattern', chartType: 'bar' },
  { id: 15, text: "What's the lead demand indicator for each category?", tags: ['leading', 'indicator'], metricKey: 'lead_indicator', chartType: 'line' },
  { id: 16, text: "How do local events impact store demand?", tags: ['events', 'local'], metricKey: 'event_impact', chartType: 'bar' },
  { id: 17, text: "Why is the forecast higher this month compared to last month?", tags: ['forecast', 'reasoning', 'drivers'], metricKey: 'forecast_explanation', chartType: 'bar' },
  { id: 18, text: "What external factors are driving current demand trends?", tags: ['external', 'drivers', 'signals'], metricKey: 'external_drivers', chartType: 'bar' },
  
  // Core Replenishment
  { id: 19, text: "What products need to be reordered this week?", tags: ['replenishment', 'reorder', 'urgent'], metricKey: 'reorder_list', chartType: 'bar' },
  { id: 20, text: "What's the days of supply analysis by category?", tags: ['dos', 'inventory', 'category'], metricKey: 'days_of_supply', chartType: 'bar' },
  { id: 21, text: "Which products are below their reorder point?", tags: ['reorder-point', 'critical'], metricKey: 'below_rop', chartType: 'bar' },
  { id: 22, text: "What's the optimal reorder quantity for each product?", tags: ['eoq', 'quantity', 'optimization'], metricKey: 'reorder_qty', chartType: 'bar' },
  { id: 23, text: "When should each product be reordered based on lead times?", tags: ['timing', 'lead-time', 'schedule'], metricKey: 'reorder_schedule', chartType: 'line' },
  { id: 24, text: "Which suppliers should we use for replenishment orders?", tags: ['supplier', 'selection', 'replenishment'], metricKey: 'supplier_recommendation', chartType: 'bar' },
  { id: 25, text: "What's the replenishment schedule by product category?", tags: ['schedule', 'frequency', 'category'], metricKey: 'replenishment_schedule', chartType: 'bar' },
  { id: 26, text: "Which orders need to be expedited to avoid stockouts?", tags: ['expedite', 'urgent', 'stockout'], metricKey: 'expedite_orders', chartType: 'bar' },
  { id: 27, text: "What's the fill rate performance by supplier?", tags: ['fill-rate', 'supplier', 'performance'], metricKey: 'supplier_fill_rate', chartType: 'bar' },
  { id: 28, text: "How much inventory investment is needed for next month?", tags: ['investment', 'inventory', 'planning'], metricKey: 'inventory_investment', chartType: 'bar' },
  
  // Safety Stock & Service Level
  { id: 29, text: "What safety stock adjustments are needed for high-variability items?", tags: ['safety-stock', 'variability', 'adjustment'], metricKey: 'safety_stock_adj', chartType: 'bar' },
  { id: 30, text: "What's our current service level by category?", tags: ['service-level', 'category', 'performance'], metricKey: 'service_level', chartType: 'bar' },
  { id: 31, text: "Which products need safety stock increases to meet 98% service level?", tags: ['service-level', 'safety-stock', 'target'], metricKey: 'safety_stock_gap', chartType: 'bar' },
  
  // Simulation
  { id: 32, text: "What if demand increases by 20% during holiday season?", tags: ['simulation', 'holiday'], metricKey: 'simulated_inventory_need', chartType: 'line', isSimulation: true },
  { id: 33, text: "What if we reduce safety stock by 15%?", tags: ['simulation', 'safety-stock'], metricKey: 'simulated_stockout_risk', chartType: 'bar', isSimulation: true },
  { id: 34, text: "What if supplier lead times increase by 3 days?", tags: ['simulation', 'lead-time'], metricKey: 'simulated_reorder_impact', chartType: 'bar', isSimulation: true },
  { id: 35, text: "What if we switch to weekly replenishment cycles?", tags: ['simulation', 'frequency'], metricKey: 'simulated_inventory_cost', chartType: 'bar', isSimulation: true },
  
  // Cross-module
  { id: 36, text: "How does demand volatility impact supply chain costs?", tags: ['cross-module', 'supply-chain'], metricKey: 'demand_supply_cost', chartType: 'bar', crossModule: ['supply-chain'] },
  { id: 37, text: "What's the relationship between demand forecast and space allocation?", tags: ['cross-module', 'space'], metricKey: 'demand_space_alignment', chartType: 'bar', crossModule: ['space'] },
  { id: 38, text: "How do pricing changes impact replenishment requirements?", tags: ['cross-module', 'pricing'], metricKey: 'pricing_replenishment_impact', chartType: 'line', crossModule: ['pricing'] },
];

export const demandPopularIds = [1, 2, 3, 5, 19, 20, 23, 32];

// Supply Chain Questions (16+)
export const supplyChainQuestions: ModuleQuestion[] = [
  // Core Supply Chain
  { id: 1, text: "Which suppliers have the best on-time delivery performance?", tags: ['supplier', 'delivery'], metricKey: 'on_time_delivery', chartType: 'bar' },
  { id: 2, text: "What's the average lead time by product category?", tags: ['lead-time', 'category'], metricKey: 'lead_time', chartType: 'bar' },
  { id: 3, text: "How can we optimize distribution routes?", tags: ['distribution', 'optimization'], metricKey: 'route_efficiency', chartType: 'bar' },
  { id: 4, text: "Which warehouses are operating at capacity?", tags: ['warehouse', 'capacity'], metricKey: 'warehouse_utilization', chartType: 'bar' },
  { id: 5, text: "What's the cost breakdown of our logistics operations?", tags: ['cost', 'logistics'], metricKey: 'logistics_cost', chartType: 'pie' },
  { id: 6, text: "How do supplier issues impact store availability?", tags: ['supplier', 'availability'], metricKey: 'supplier_fill_rate', chartType: 'bar' },
  { id: 7, text: "What's the perfect order rate by region?", tags: ['perfect-order', 'regional'], metricKey: 'perfect_order_rate', chartType: 'bar' },
  { id: 8, text: "How can we reduce transportation costs?", tags: ['transportation', 'cost'], metricKey: 'transport_cost_per_unit', chartType: 'bar' },
  // Extended Supply Chain
  { id: 9, text: "Which suppliers are single-source risks?", tags: ['risk', 'single-source'], metricKey: 'supplier_risk', chartType: 'bar' },
  { id: 10, text: "What's the carbon footprint by transportation mode?", tags: ['sustainability', 'carbon'], metricKey: 'carbon_footprint', chartType: 'pie' },
  { id: 11, text: "How does supplier reliability correlate with product availability?", tags: ['reliability', 'availability'], metricKey: 'reliability_availability', chartType: 'line' },
  { id: 12, text: "What's the total cost of ownership by supplier?", tags: ['tco', 'supplier'], metricKey: 'total_cost_ownership', chartType: 'bar' },
  { id: 13, text: "Which routes have the highest variability in transit time?", tags: ['transit', 'variability'], metricKey: 'transit_variability', chartType: 'bar' },
  { id: 14, text: "What's the optimal order frequency by supplier?", tags: ['order-frequency', 'optimization'], metricKey: 'optimal_frequency', chartType: 'bar' },
  { id: 15, text: "How do payment terms impact supplier performance?", tags: ['payment', 'performance'], metricKey: 'payment_performance', chartType: 'bar' },
  { id: 16, text: "What's the inbound logistics efficiency by DC?", tags: ['inbound', 'dc'], metricKey: 'inbound_efficiency', chartType: 'bar' },
  // Simulation
  { id: 17, text: "What if a key supplier has a 2-week disruption?", tags: ['simulation', 'disruption'], metricKey: 'simulated_impact', chartType: 'bar', isSimulation: true },
  { id: 18, text: "What if we consolidate shipments to reduce costs?", tags: ['simulation', 'consolidation'], metricKey: 'simulated_savings', chartType: 'bar', isSimulation: true },
  // Cross-module
  { id: 19, text: "How does supplier lead time impact pricing flexibility?", tags: ['cross-module', 'pricing'], metricKey: 'leadtime_pricing_impact', chartType: 'bar', crossModule: ['pricing'] },
  { id: 20, text: "What's the supply chain constraint on assortment expansion?", tags: ['cross-module', 'assortment'], metricKey: 'supply_assortment_constraint', chartType: 'bar', crossModule: ['assortment'] },
];

export const supplyChainPopularIds = [1, 2, 4, 5, 6, 17, 19];

// Space Planning Questions (16+)
export const spaceQuestions: ModuleQuestion[] = [
  // Core Space
  { id: 1, text: "Which categories generate the highest sales per square foot?", tags: ['sales', 'space'], metricKey: 'sales_per_sqft', chartType: 'bar' },
  { id: 2, text: "How should we allocate shelf space across categories?", tags: ['allocation', 'category'], metricKey: 'category_space_share', chartType: 'pie' },
  { id: 3, text: "What's the optimal number of facings for top products?", tags: ['facings', 'optimization'], metricKey: 'facings_per_sku', chartType: 'bar' },
  { id: 4, text: "How does planogram compliance impact sales?", tags: ['planogram', 'compliance'], metricKey: 'planogram_compliance', chartType: 'bar' },
  { id: 5, text: "Which store layouts drive the highest conversion?", tags: ['layout', 'conversion'], metricKey: 'store_conversion', chartType: 'bar' },
  { id: 6, text: "What's the GMROI by category and shelf position?", tags: ['gmroi', 'position'], metricKey: 'gmroi', chartType: 'bar' },
  { id: 7, text: "How do endcap displays impact category sales?", tags: ['endcap', 'impact'], metricKey: 'endcap_lift', chartType: 'bar' },
  { id: 8, text: "What's the optimal product adjacency for cross-selling?", tags: ['adjacency', 'cross-sell'], metricKey: 'adjacency_impact', chartType: 'bar' },
  // Extended Space
  { id: 9, text: "Which products are under-spaced relative to sales?", tags: ['under-space', 'opportunity'], metricKey: 'space_opportunity', chartType: 'bar' },
  { id: 10, text: "What's the eye-level premium for each category?", tags: ['eye-level', 'premium'], metricKey: 'eye_level_lift', chartType: 'bar' },
  { id: 11, text: "How does fixture type impact category performance?", tags: ['fixture', 'performance'], metricKey: 'fixture_performance', chartType: 'bar' },
  { id: 12, text: "What's the traffic flow pattern impact on category placement?", tags: ['traffic', 'placement'], metricKey: 'traffic_impact', chartType: 'bar' },
  { id: 13, text: "Which planograms need reset based on performance?", tags: ['reset', 'planogram'], metricKey: 'reset_priority', chartType: 'bar' },
  { id: 14, text: "What's the space-to-sales ratio by brand?", tags: ['space-sales', 'brand'], metricKey: 'space_sales_ratio', chartType: 'bar' },
  { id: 15, text: "How do seasonal resets impact category sales?", tags: ['seasonal', 'reset'], metricKey: 'seasonal_reset_impact', chartType: 'line' },
  { id: 16, text: "What's the promotional display ROI by location?", tags: ['promo-display', 'roi'], metricKey: 'display_roi', chartType: 'bar' },
  // Simulation
  { id: 17, text: "What if we increase facings for top 20% sellers by 50%?", tags: ['simulation', 'facings'], metricKey: 'simulated_sales_lift', chartType: 'bar', isSimulation: true },
  { id: 18, text: "What if we reallocate 10% of space from low performers to high performers?", tags: ['simulation', 'reallocation'], metricKey: 'simulated_productivity', chartType: 'bar', isSimulation: true },
  // Cross-module
  { id: 19, text: "How does shelf space allocation impact inventory turnover?", tags: ['cross-module', 'demand'], metricKey: 'space_turnover_impact', chartType: 'bar', crossModule: ['demand'] },
  { id: 20, text: "What's the relationship between space productivity and pricing?", tags: ['cross-module', 'pricing'], metricKey: 'space_pricing_correlation', chartType: 'line', crossModule: ['pricing'] },
];

export const spacePopularIds = [1, 2, 3, 4, 6, 17, 19];

// Cross-Module Analysis Questions (NEW)
export const crossModuleQuestions: ModuleQuestion[] = [
  { id: 1, text: "How does pricing strategy impact demand forecasting accuracy?", tags: ['pricing', 'demand', 'cross-module'], metricKey: 'pricing_demand_correlation', chartType: 'line', crossModule: ['pricing', 'demand'] },
  { id: 2, text: "What's the end-to-end margin impact from supplier to shelf?", tags: ['supply-chain', 'pricing', 'space', 'cross-module'], metricKey: 'e2e_margin', chartType: 'bar', crossModule: ['supply-chain', 'pricing', 'space'] },
  { id: 3, text: "How does assortment complexity impact supply chain efficiency?", tags: ['assortment', 'supply-chain', 'cross-module'], metricKey: 'assortment_supply_efficiency', chartType: 'bar', crossModule: ['assortment', 'supply-chain'] },
  { id: 4, text: "What's the optimal inventory-to-space ratio by category?", tags: ['demand', 'space', 'cross-module'], metricKey: 'inventory_space_ratio', chartType: 'bar', crossModule: ['demand', 'space'] },
  { id: 5, text: "How do promotional prices impact both demand and space productivity?", tags: ['pricing', 'demand', 'space', 'cross-module'], metricKey: 'promo_holistic_impact', chartType: 'bar', crossModule: ['pricing', 'demand', 'space'] },
  { id: 6, text: "What's the total cost-to-serve by product category?", tags: ['supply-chain', 'pricing', 'assortment', 'cross-module'], metricKey: 'cost_to_serve', chartType: 'bar', crossModule: ['supply-chain', 'pricing', 'assortment'] },
  { id: 7, text: "How does supplier reliability impact shelf availability and sales?", tags: ['supply-chain', 'space', 'cross-module'], metricKey: 'supplier_shelf_impact', chartType: 'bar', crossModule: ['supply-chain', 'space'] },
  { id: 8, text: "What's the ROI of each category considering all costs?", tags: ['all-modules', 'cross-module'], metricKey: 'category_holistic_roi', chartType: 'bar', crossModule: ['pricing', 'assortment', 'demand', 'supply-chain', 'space'] },
];

export const getQuestionsByModule = (moduleId: string): ModuleQuestion[] => {
  switch (moduleId) {
    case 'pricing': return pricingQuestions;
    case 'assortment': return assortmentQuestions;
    case 'demand': return demandQuestions;
    case 'supply-chain': return supplyChainQuestions;
    case 'space': return spaceQuestions;
    case 'cross-module': return crossModuleQuestions;
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

export const getSimulationQuestions = (moduleId: string): ModuleQuestion[] => {
  const questions = getQuestionsByModule(moduleId);
  return questions.filter(q => q.isSimulation);
};

export const getCrossModuleQuestions = (moduleId: string): ModuleQuestion[] => {
  const questions = getQuestionsByModule(moduleId);
  return questions.filter(q => q.crossModule && q.crossModule.length > 0);
};

export const getAllCrossModuleQuestions = (): ModuleQuestion[] => {
  return [
    ...crossModuleQuestions,
    ...pricingQuestions.filter(q => q.crossModule),
    ...assortmentQuestions.filter(q => q.crossModule),
    ...demandQuestions.filter(q => q.crossModule),
    ...supplyChainQuestions.filter(q => q.crossModule),
    ...spaceQuestions.filter(q => q.crossModule),
  ];
};
