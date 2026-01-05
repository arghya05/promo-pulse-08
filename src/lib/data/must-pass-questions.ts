// Must-Pass Questions from Merch Observation AI requirements
// These are the critical questions every module must answer with full data-backed KPIs

export interface MustPassQuestion {
  id: string;
  module: string;
  question: string;
  expectedOutput: string[];
  requiredKPIs: string[];
  priority: 'critical' | 'high' | 'medium';
}

// 12 Must-Pass Questions from the requirements document
export const mustPassQuestions: MustPassQuestion[] = [
  // ASSORTMENT PLANNING
  {
    id: 'mp-assort-1',
    module: 'assortment',
    question: 'Identify bottom-performing SKUs for {category} in {date_range}',
    expectedOutput: [
      'Bottom SKUs ranked by performance',
      'Underperformance drivers (low sales, negative/low margin, overstock, poor sell-through)',
      'SKU-level attention ranking (High/Med/Low)',
      'Sell-through %',
      'Actionable insights (markdown, promotion, delist)'
    ],
    requiredKPIs: ['sell_through_rate', 'gross_margin', 'units_sold', 'inventory_turn'],
    priority: 'critical'
  },
  {
    id: 'mp-assort-2',
    module: 'assortment',
    question: 'Which SKUs need immediate attention in {category} for {date_range}?',
    expectedOutput: [
      'Prioritized SKU list (High/Med/Low attention)',
      'Explanation of why each SKU is flagged',
      'Action recommendation per SKU'
    ],
    requiredKPIs: ['sell_through_rate', 'margin_percent', 'weeks_of_supply', 'velocity'],
    priority: 'critical'
  },
  {
    id: 'mp-assort-3',
    module: 'assortment',
    question: 'Recommend the optimum brand mix for {category} in {date_range}',
    expectedOutput: [
      'Recommended brand mix % per category',
      'Current vs optimal brand contribution',
      'Sales share, GM share, SKU count share',
      'Constraints/guardrails (min presence, profitability, inventory risk)'
    ],
    requiredKPIs: ['brand_share', 'gross_margin', 'revenue', 'sku_count'],
    priority: 'high'
  },

  // DEMAND FORECASTING
  {
    id: 'mp-demand-1',
    module: 'demand',
    question: 'What should we reorder for each category this month?',
    expectedOutput: [
      'Reorder recommendations with quantities',
      'Reasons (stockout risk, WOS, lead time)',
      'Forecast demand',
      'Safety stock assumption',
      'Service-level target'
    ],
    requiredKPIs: ['forecast_units', 'weeks_of_supply', 'safety_stock', 'lead_time', 'stockout_risk'],
    priority: 'critical'
  },
  {
    id: 'mp-demand-2',
    module: 'demand',
    question: 'Generate demand forecast for next 12 weeks for {category}',
    expectedOutput: [
      'Forecast table by week',
      'Confidence band',
      'Forecast drivers (seasonality, promo, trend)',
      'Accuracy diagnostics (MAPE/WAPE)',
      'Key risks'
    ],
    requiredKPIs: ['forecast_units', 'mape', 'confidence_interval', 'seasonality_factor'],
    priority: 'critical'
  },

  // PRICING
  {
    id: 'mp-pricing-1',
    module: 'pricing',
    question: 'Which categories had declining margins vs last quarter and why?',
    expectedOutput: [
      'Categories ranked by margin decline',
      'Margin change vs prior quarter explicitly',
      'Drivers: price change vs cost change vs promo depth vs mix'
    ],
    requiredKPIs: ['gross_margin', 'margin_change', 'price_change', 'cost_change', 'promo_depth'],
    priority: 'critical'
  },
  {
    id: 'mp-pricing-2',
    module: 'pricing',
    question: 'Recommend optimal price points for top SKUs in {category}',
    expectedOutput: [
      'Recommended price per SKU',
      'Expected impact on units, revenue, margin',
      'Scenario-based analysis',
      'Constraints (MAP/MRP, min margin%, competitor parity)'
    ],
    requiredKPIs: ['optimal_price', 'elasticity', 'revenue_impact', 'margin_impact', 'competitive_price'],
    priority: 'high'
  },

  // PROMOTION
  {
    id: 'mp-promo-1',
    module: 'promotion',
    question: 'Analyze past promotions and identify low ROI / zero-margin promos',
    expectedOutput: [
      'Promo list ranked by ROI',
      'Flag sold-at-zero-margin cases',
      'Incremental lift',
      'Promo spend',
      'Discount depth',
      'Incremental margin'
    ],
    requiredKPIs: ['promo_roi', 'incremental_lift', 'promo_spend', 'discount_depth', 'incremental_margin'],
    priority: 'critical'
  },
  {
    id: 'mp-promo-2',
    module: 'promotion',
    question: 'Calculate cannibalization for each promo in {date_range}',
    expectedOutput: [
      'Cannibalization % per promo',
      'Halo effect where applicable',
      'Baseline vs promo vs control logic'
    ],
    requiredKPIs: ['cannibalization_rate', 'halo_effect', 'baseline_sales', 'promo_sales'],
    priority: 'high'
  },

  // SPACE PLANNING
  {
    id: 'mp-space-1',
    module: 'space',
    question: 'Which categories have highest sales per square foot?',
    expectedOutput: [
      'Categories ranked by Sales/SqFt',
      'Allocated sqft per category',
      'Sales/SqFt calculation',
      'Recommendations to reallocate space'
    ],
    requiredKPIs: ['sales_per_sqft', 'allocated_sqft', 'revenue', 'space_productivity'],
    priority: 'critical'
  },
  {
    id: 'mp-space-2',
    module: 'space',
    question: 'Compare GMROI across categories for last quarter',
    expectedOutput: [
      'GMROI per category',
      'Category ranking',
      'Gross margin',
      'Avg inventory cost',
      'GMROI formula explanation',
      'Inventory-focused recommendations'
    ],
    requiredKPIs: ['gmroi', 'gross_margin', 'avg_inventory_cost', 'inventory_turn'],
    priority: 'critical'
  },

  // SUPPLY CHAIN
  {
    id: 'mp-supply-1',
    module: 'supply-chain',
    question: 'Which suppliers have the best on-time delivery %, and what is the sales impact?',
    expectedOutput: [
      'Suppliers ranked by OTD%',
      'Late vs on-time counts',
      'In-stock % correlation',
      'Stockouts caused by late deliveries',
      'Estimated lost sales / revenue protection'
    ],
    requiredKPIs: ['on_time_delivery_rate', 'fill_rate', 'stockout_rate', 'lost_sales', 'in_stock_rate'],
    priority: 'critical'
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
  revenue: { formula: 'SUM(revenue)', description: 'Total revenue from sales' },
  units_sold: { formula: 'SUM(units)', description: 'Total units sold' },
  gross_margin: { formula: 'SUM(revenue - cost)', description: 'Revenue minus cost of goods sold' },
  gross_margin_pct: { formula: 'Gross Margin / Revenue × 100', description: 'Gross margin as percentage of revenue' },
  sell_through_rate: { formula: 'Units Sold / (Units Sold + On-hand Units) × 100', description: 'Percentage of inventory sold in the period' },
  weeks_of_supply: { formula: 'On-hand Units / Weekly Forecast Units', description: 'How many weeks current inventory will last' },
  gmroi: { formula: 'Gross Margin / Avg Inventory Cost', description: 'Return on inventory investment' },
  sales_per_sqft: { formula: 'Sales / Allocated Sq Ft', description: 'Revenue per square foot of space' },
  on_time_delivery_rate: { formula: 'On-time Deliveries / Total Deliveries × 100', description: 'Percentage of orders delivered by promised date' },
  fill_rate: { formula: 'SUM(qty_received) / SUM(qty_ordered) × 100', description: 'Percentage of ordered quantity actually received' },
  promo_roi: { formula: 'Incremental Gross Margin / Promo Spend', description: 'Return on promotional investment' },
  incremental_lift: { formula: '(Promo Period Sales - Baseline Sales) / Baseline Sales × 100', description: 'Sales increase from promotion' },
  cannibalization_rate: { formula: 'Lost Sales in Related SKUs / Lift in Promoted SKU × 100', description: 'Sales cannibalized from other products' },
  stockout_rate: { formula: 'Stockout Days / Total Days × 100', description: 'Percentage of time product was out of stock' },
  inventory_turn: { formula: 'COGS / Average Inventory', description: 'How many times inventory sold and replaced' }
};
