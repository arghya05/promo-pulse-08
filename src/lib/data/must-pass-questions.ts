// Must-Pass Questions from Merch Observation AI requirements
// These are the critical questions every module must answer with full data-backed KPIs

export interface MustPassQuestion {
  id: string;
  module: string;
  question: string;
  expectedOutput: string[];
  requiredKPIs: string[];
  priority: 'critical' | 'high' | 'medium';
  category: string;
  acceptanceCriteria: string[];
}

// 12 Must-Pass Questions with enhanced acceptance criteria from requirements matrix
export const mustPassQuestions: MustPassQuestion[] = [
  // ASSORTMENT PLANNING
  {
    id: 'mp-assort-1',
    module: 'assortment',
    category: 'SKU Performance',
    question: 'Identify bottom-performing SKUs for {category} in {date_range}',
    expectedOutput: [
      'List of bottom-performing SKUs ranked by performance',
      'SKU-level attention ranking (High/Medium/Low)',
      'Sell-through % for each SKU',
      'Underperformance drivers (low sales, negative/low margin, overstock, poor sell-through)',
      'Actionable insights (markdown, promotion, delisting recommendation)'
    ],
    requiredKPIs: ['sell_through_rate', 'gross_margin_pct', 'units_sold', 'stock_level', 'weeks_of_supply'],
    priority: 'critical',
    acceptanceCriteria: [
      'Add SKU-level ranking (High/Medium/Low attention)',
      'Include sell-through %',
      'Allow filtering strictly by selected category when required',
      'Clear identification of underperformance drivers'
    ]
  },
  {
    id: 'mp-assort-2',
    module: 'assortment',
    category: 'SKU Attention',
    question: 'Which SKUs need immediate attention in {category} for {date_range}?',
    expectedOutput: [
      'Clear list of SKUs ranked by priority (High/Medium/Low)',
      'Explanation of why each SKU is flagged',
      'Action recommendation (Promote, Reprice, Markdown, Maintain, Delist)',
      'Same KPI logic as bottom-performing SKUs analysis'
    ],
    requiredKPIs: ['sell_through_rate', 'gross_margin_pct', 'units_sold', 'stock_level', 'weeks_of_supply'],
    priority: 'critical',
    acceptanceCriteria: [
      'Prioritized SKU list with High/Medium/Low ranking',
      'Clear explanation of why each SKU is flagged',
      'Specific action recommendation per SKU'
    ]
  },
  {
    id: 'mp-assort-3',
    module: 'assortment',
    category: 'Brand Mix',
    question: 'Recommend the optimum brand mix for {category} in {date_range}',
    expectedOutput: [
      'Recommended brand mix % for each category',
      'Current vs optimal brand contribution (Sales share, GM share, SKU count share)',
      'Identification of over-represented and under-represented brands',
      'Clear rationale for recommendations (performance, demand, profitability)',
      'Constraints/guardrails section (min presence, profitability, inventory risk)'
    ],
    requiredKPIs: ['brand_share', 'gross_margin_pct', 'revenue', 'sku_count', 'contribution_margin'],
    priority: 'high',
    acceptanceCriteria: [
      'Provide recommended brand mix % per category',
      'Show current vs optimal brand contribution',
      'Include rationale for changes'
    ]
  },

  // DEMAND FORECASTING
  {
    id: 'mp-demand-1',
    module: 'demand',
    category: 'Reorder',
    question: 'What should we reorder for each category this month?',
    expectedOutput: [
      'List of products to be reordered by category',
      'Recommended reorder quantity per SKU',
      'Clear explanation of why reorder is required (stockout risk, WOS, lead time)',
      'Forecast demand and safety stock assumption',
      'Service-level target (configurable)'
    ],
    requiredKPIs: ['forecast_units', 'weeks_of_supply', 'safety_stock', 'lead_time', 'stockout_risk'],
    priority: 'critical',
    acceptanceCriteria: [
      'Output list of products to be reordered by category',
      'Include recommended reorder quantity per SKU',
      'Explain why reorder is required with specific metrics'
    ]
  },
  {
    id: 'mp-demand-2',
    module: 'demand',
    category: 'Forecast',
    question: 'Generate demand forecast for next 4 weeks for {category}',
    expectedOutput: [
      'Forecasted demand (Units and/or Sales) for each of the next 4 weeks by category',
      'Week-over-week demand trend',
      'Forecasted Units and Forecasted Sales',
      'Week-over-Week Growth %',
      'Forecast vs Last Year %',
      'Accuracy diagnostics (MAPE/WAPE) if historical exists',
      'Key risks and forecast drivers (seasonality, promo, trend)'
    ],
    requiredKPIs: ['forecast_units', 'forecast_sales', 'wow_growth', 'yoy_variance', 'mape'],
    priority: 'critical',
    acceptanceCriteria: [
      'Generate 4-week forecast (not 12-week)',
      'Include Week-over-Week Growth %',
      'Include Forecast vs Last Year %',
      'Strong forecast diagnostics and insights'
    ]
  },

  // PRICING
  {
    id: 'mp-pricing-1',
    module: 'pricing',
    category: 'Margin Analysis',
    question: 'Which categories had declining margins vs last quarter and why?',
    expectedOutput: [
      'List of categories with declining margin trends',
      'Margin change (%) vs prior quarter explicitly',
      'Categories ranked by margin decline',
      'Identification of key drivers (increased discounts, cost increase, mix shift, low-margin SKU growth)'
    ],
    requiredKPIs: ['gross_margin_pct', 'margin_change_pct', 'discount_rate', 'cost_change_pct', 'mix_impact'],
    priority: 'critical',
    acceptanceCriteria: [
      'Show margin change vs prior quarter explicitly',
      'Rank categories by margin decline',
      'Identify key drivers (discounts, cost, mix shift)'
    ]
  },
  {
    id: 'mp-pricing-2',
    module: 'pricing',
    category: 'Price Optimization',
    question: 'Recommend optimal price points for top SKUs in {category}',
    expectedOutput: [
      'List of top-selling products with current vs recommended price',
      'Expected impact of price change on sales and margin',
      'Scenario-based analysis',
      'Constraints/guardrails (MAP/MRP, min margin%, competitor parity)'
    ],
    requiredKPIs: ['current_price', 'recommended_price', 'price_elasticity', 'expected_units', 'expected_margin'],
    priority: 'high',
    acceptanceCriteria: [
      'Output list of top products with current vs recommended price',
      'Include expected impact of price change',
      'Match expected outcome format'
    ]
  },

  // PROMOTION
  {
    id: 'mp-promo-1',
    module: 'promotion',
    category: 'Promo ROI',
    question: 'Analyze past promotions and identify low ROI / zero-margin promos for last quarter',
    expectedOutput: [
      'List of promotions with negative incremental margin or ROI',
      'Promo list ranked by ROI',
      'Flag sold-at-zero-margin cases',
      'Incremental lift, promo spend, discount depth, incremental margin',
      'Baseline comparison and ROI calculations',
      'Clear recommendations to avoid similar losses'
    ],
    requiredKPIs: ['promo_roi', 'incremental_margin', 'promo_spend', 'discount_depth', 'baseline_sales', 'lift_pct'],
    priority: 'critical',
    acceptanceCriteria: [
      'Provide promotion-level granularity (not just product level)',
      'Include baseline comparison',
      'Calculate ROI for each promotion',
      'Identify quantified loss per promotion'
    ]
  },
  {
    id: 'mp-promo-2',
    module: 'promotion',
    category: 'Cannibalization',
    question: 'Calculate cannibalization for each promo in {date_range}',
    expectedOutput: [
      'Cannibalization value per promotion',
      'Cannibalization rate (%)',
      'Identification of impacted SKUs/categories',
      'Net incremental sales after cannibalization',
      'Halo effect where applicable',
      'Baseline vs promo vs control logic'
    ],
    requiredKPIs: ['cannibalization_pct', 'halo_effect', 'net_incremental_sales', 'baseline_sales', 'promo_sales'],
    priority: 'high',
    acceptanceCriteria: [
      'Provide promotion-level cannibalization calculations',
      'Include net incremental impact',
      'Show baseline comparisons'
    ]
  },

  // SPACE PLANNING
  {
    id: 'mp-space-1',
    module: 'space',
    category: 'Space Productivity',
    question: 'Which categories have highest sales per square foot?',
    expectedOutput: [
      'Ranked list of categories by sales per square foot',
      'Category-level allocated square footage',
      'Category-level sales per square foot calculation',
      'Comparison across categories and stores',
      'Identification of over- and under-utilized space',
      'Recommendations to reallocate space'
    ],
    requiredKPIs: ['sales_per_sqft', 'allocated_sqft', 'revenue', 'space_utilization', 'productivity_index'],
    priority: 'critical',
    acceptanceCriteria: [
      'Include Category-level allocated square footage',
      'Include Category-level sales per square foot calculation',
      'Provide Ranking of categories by sales per square foot'
    ]
  },
  {
    id: 'mp-space-2',
    module: 'space',
    category: 'GMROI',
    question: 'Compare GMROI across categories for last quarter',
    expectedOutput: [
      'GMROI calculated for each category',
      'Categories ranked by GMROI',
      'Category-level gross margin',
      'Category-level average inventory cost',
      'GMROI formula and calculation details',
      'Inventory-focused recommendations',
      'Clear identification of high- and low-GMROI categories'
    ],
    requiredKPIs: ['gmroi', 'gross_margin', 'avg_inventory_cost', 'inventory_turn', 'sell_through_rate'],
    priority: 'critical',
    acceptanceCriteria: [
      'Address inventory return efficiency',
      'Include Category-level gross margin',
      'Include Category-level average inventory cost',
      'Provide GMROI calculation details',
      'Include inventory-focused recommendations'
    ]
  },

  // SUPPLY CHAIN
  {
    id: 'mp-supply-1',
    module: 'supply-chain',
    category: 'Supplier Performance',
    question: 'Which suppliers have the best on-time delivery %, and what is the sales impact?',
    expectedOutput: [
      'List of suppliers ranked by on-time delivery %',
      'On-time delivery % clearly displayed per supplier',
      'Comparison across suppliers, categories, or locations',
      'Identification of consistently high-performing suppliers',
      'Visibility into late vs on-time deliveries (count or %)',
      'Sales-performance linkage (on-time delivery → product availability → sales performance)',
      'Revenue protection or uplift quantification'
    ],
    requiredKPIs: ['on_time_delivery_pct', 'fill_rate', 'in_stock_pct', 'revenue_impact', 'availability_pct'],
    priority: 'critical',
    acceptanceCriteria: [
      'Include expected sales-performance linkage',
      'Show on-time delivery → product availability → sales performance connection',
      'Quantify revenue protection or uplift'
    ]
  }
];

// Get must-pass questions by module
export const getMustPassQuestionsByModule = (moduleId: string): MustPassQuestion[] => {
  return mustPassQuestions.filter(q => q.module === moduleId);
};

// Get all critical must-pass questions
export const getCriticalMustPassQuestions = (): MustPassQuestion[] => {
  return mustPassQuestions.filter(q => q.priority === 'critical');
};

// Format question with placeholders filled
export const formatMustPassQuestion = (
  question: MustPassQuestion, 
  params: { category?: string; date_range?: string } = {}
): string => {
  let formatted = question.question;
  if (params.category) {
    formatted = formatted.replace('{category}', params.category);
  } else {
    formatted = formatted.replace('{category}', 'all categories');
  }
  if (params.date_range) {
    formatted = formatted.replace('{date_range}', params.date_range);
  } else {
    formatted = formatted.replace('{date_range}', 'last 4 weeks');
  }
  return formatted;
};

// Standard KPI definitions for consistent answers
export const standardKPIDefinitions: Record<string, { formula: string; description: string }> = {
  // Core Sales KPIs
  revenue: { formula: 'SUM(revenue)', description: 'Total revenue from sales' },
  units_sold: { formula: 'SUM(units)', description: 'Total units sold' },
  gross_margin: { formula: 'SUM(revenue - cost)', description: 'Revenue minus cost of goods sold' },
  gross_margin_pct: { formula: 'Gross Margin / Revenue × 100', description: 'Gross margin as percentage of revenue' },
  
  // Inventory KPIs
  sell_through_rate: { formula: 'Units Sold / (Units Sold + On-hand Units) × 100', description: 'Percentage of inventory sold in the period' },
  weeks_of_supply: { formula: 'On-hand Units / Weekly Forecast Units', description: 'How many weeks current inventory will last' },
  inventory_turn: { formula: 'COGS / Average Inventory', description: 'How many times inventory sold and replaced' },
  stockout_rate: { formula: 'Stockout Days / Total Days × 100', description: 'Percentage of time product was out of stock' },
  
  // Space Planning KPIs
  gmroi: { formula: 'Gross Margin / Avg Inventory Cost', description: 'Return on inventory investment' },
  sales_per_sqft: { formula: 'Sales / Allocated Sq Ft', description: 'Revenue per square foot of space' },
  allocated_sqft: { formula: 'SUM(fixture capacity sqft)', description: 'Total square footage allocated to category' },
  
  // Supply Chain KPIs
  on_time_delivery_pct: { formula: 'On-time Deliveries / Total Deliveries × 100', description: 'Percentage of orders delivered by promised date' },
  fill_rate: { formula: 'SUM(qty_received) / SUM(qty_ordered) × 100', description: 'Percentage of ordered quantity actually received' },
  in_stock_pct: { formula: '(Total SKUs - Stockout SKUs) / Total SKUs × 100', description: 'Percentage of SKUs in stock' },
  
  // Promotion KPIs
  promo_roi: { formula: 'Incremental Gross Margin / Promo Spend', description: 'Return on promotional investment' },
  incremental_lift: { formula: '(Promo Period Sales - Baseline Sales) / Baseline Sales × 100', description: 'Sales increase from promotion' },
  cannibalization_pct: { formula: 'Lost Sales in Related SKUs / Lift in Promoted SKU × 100', description: 'Sales cannibalized from other products' },
  baseline_sales: { formula: 'Avg(Non-promo period sales)', description: 'Sales baseline without promotion' },
  
  // Pricing KPIs
  price_elasticity: { formula: '% Change in Quantity / % Change in Price', description: 'Price sensitivity of demand' },
  margin_change_pct: { formula: '(Current Margin - Prior Margin) / Prior Margin × 100', description: 'Percentage change in margin vs prior period' },
  
  // Demand Forecasting KPIs
  forecast_accuracy: { formula: '1 - MAPE', description: 'Accuracy of demand forecast' },
  mape: { formula: 'Mean(|Actual - Forecast| / Actual) × 100', description: 'Mean Absolute Percentage Error' },
  forecast_units: { formula: 'Predicted units for future period', description: 'Forecasted demand in units' },
  wow_growth: { formula: '(This Week - Last Week) / Last Week × 100', description: 'Week-over-week growth percentage' }
};
