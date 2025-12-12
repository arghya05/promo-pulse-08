// Module-specific configuration for the Merchandising AI platform
import { 
  Tag, 
  DollarSign, 
  LayoutGrid, 
  TrendingUp, 
  Truck, 
  Grid3X3,
  LucideIcon
} from 'lucide-react';

export interface Module {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  path: string;
}

export const modules: Module[] = [
  {
    id: 'promotion',
    name: 'Promotion Intelligence',
    description: 'Analyze promotion ROI, effectiveness, and customer response',
    icon: Tag,
    color: 'text-orange-500',
    gradient: 'from-orange-500/20 to-orange-600/10',
    path: '/promotion'
  },
  {
    id: 'pricing',
    name: 'Pricing Optimization',
    description: 'Optimize pricing strategies, elasticity analysis, and competitive positioning',
    icon: DollarSign,
    color: 'text-green-500',
    gradient: 'from-green-500/20 to-green-600/10',
    path: '/pricing'
  },
  {
    id: 'assortment',
    name: 'Assortment Planning',
    description: 'Plan product mix, category management, and SKU rationalization',
    icon: LayoutGrid,
    color: 'text-blue-500',
    gradient: 'from-blue-500/20 to-blue-600/10',
    path: '/assortment'
  },
  {
    id: 'demand',
    name: 'Demand Forecasting',
    description: 'Forecast demand, plan replenishment, and optimize inventory levels',
    icon: TrendingUp,
    color: 'text-purple-500',
    gradient: 'from-purple-500/20 to-purple-600/10',
    path: '/demand'
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain',
    description: 'Optimize logistics, supplier management, and distribution',
    icon: Truck,
    color: 'text-cyan-500',
    gradient: 'from-cyan-500/20 to-cyan-600/10',
    path: '/supply-chain'
  },
  {
    id: 'space',
    name: 'Space Planning',
    description: 'Design planograms, optimize shelf space, and maximize sales per square foot',
    icon: Grid3X3,
    color: 'text-pink-500',
    gradient: 'from-pink-500/20 to-pink-600/10',
    path: '/space'
  }
];

export const getModuleById = (id: string): Module | undefined => {
  return modules.find(m => m.id === id);
};

// Module-specific question configurations
export interface ModuleQuestion {
  id: number;
  text: string;
  tags: string[];
  metricKey: string;
  chartType: 'bar' | 'line' | 'pie' | 'area';
  followUps: string[];
}

// Pricing Questions - leveraging price_change_history, competitor_prices, products
const pricingQuestions: ModuleQuestion[] = [
  // Price Optimization
  { id: 1, text: "What is the optimal price point for our top-selling products?", tags: ['pricing', 'optimization'], metricKey: 'optimal_price', chartType: 'bar', followUps: ['How does price elasticity vary by category?', 'What margin improvement can we achieve?'] },
  { id: 2, text: "How does price elasticity vary across product categories?", tags: ['elasticity', 'category'], metricKey: 'price_elasticity', chartType: 'bar', followUps: ['Which products are most price sensitive?', 'What is the optimal discount depth?'] },
  { id: 3, text: "Which products can sustain a price increase without volume loss?", tags: ['pricing-power', 'increase'], metricKey: 'price_elasticity', chartType: 'bar', followUps: ['What is the maximum price ceiling?', 'How do competitors price similar items?'] },
  
  // Competitive Pricing
  { id: 4, text: "What's our competitive price positioning vs Walmart, Kroger, Target?", tags: ['competitive', 'positioning'], metricKey: 'competitive_index', chartType: 'bar', followUps: ['Which categories need price adjustment?', 'What is our price gap by region?'] },
  { id: 5, text: "Where is our price gap vs competitors hurting sales?", tags: ['price-gap', 'sales-impact'], metricKey: 'price_gap', chartType: 'bar', followUps: ['What products are we losing to competitors?', 'What price reduction would recover share?'] },
  { id: 6, text: "Which competitor price moves should we respond to?", tags: ['competitive', 'response'], metricKey: 'competitor_price', chartType: 'bar', followUps: ['What is the impact of not responding?', 'Which products are price-sensitive to competitors?'] },
  
  // Price Change Analysis
  { id: 7, text: "How have recent price changes impacted sales volume?", tags: ['price-change', 'impact'], metricKey: 'volume_impact', chartType: 'line', followUps: ['Which price changes were successful?', 'What is the optimal price change frequency?'] },
  { id: 8, text: "What's the revenue impact of our price changes last quarter?", tags: ['price-change', 'revenue'], metricKey: 'revenue', chartType: 'bar', followUps: ['Which price changes drove growth?', 'What should we roll back?'] },
  { id: 9, text: "Which price reductions failed to drive expected volume lift?", tags: ['price-reduction', 'failure'], metricKey: 'volume_impact', chartType: 'bar', followUps: ['Why did these price cuts fail?', 'Should we reverse these changes?'] },
  
  // Margin & Profitability
  { id: 10, text: "Which products have the highest margin opportunity?", tags: ['margin', 'opportunity'], metricKey: 'margin_percent', chartType: 'bar', followUps: ['What price increase would optimize margin?', 'Which brands have pricing power?'] },
  { id: 11, text: "How does margin vary by price tier (value vs premium)?", tags: ['margin', 'tier'], metricKey: 'margin_percent', chartType: 'bar', followUps: ['Where should we focus margin improvement?', 'What is the optimal tier mix?'] },
  
  // Markdown Strategy
  { id: 12, text: "What's the optimal markdown strategy for seasonal items?", tags: ['markdown', 'seasonal'], metricKey: 'markdown_rate', chartType: 'area', followUps: ['When should markdowns begin?', 'What is the optimal markdown cadence?'] },
  { id: 13, text: "How much revenue are we losing to unnecessary markdowns?", tags: ['markdown', 'waste'], metricKey: 'markdown_rate', chartType: 'bar', followUps: ['Which products are over-marked-down?', 'How can we reduce markdown waste?'] },
  
  // Private Label & Regional
  { id: 14, text: "How does our private label pricing compare to national brands?", tags: ['private-label', 'comparison'], metricKey: 'price_gap', chartType: 'bar', followUps: ['What is the optimal private label price gap?', 'Which categories have private label opportunity?'] },
  { id: 15, text: "Which regions are most price sensitive?", tags: ['regional', 'sensitivity'], metricKey: 'price_sensitivity', chartType: 'bar', followUps: ['Should we use regional pricing?', 'What drives regional price sensitivity?'] },
  { id: 16, text: "What is our price image perception vs key competitors?", tags: ['price-image', 'perception'], metricKey: 'competitive_index', chartType: 'bar', followUps: ['Where do customers perceive us as expensive?', 'How can we improve price image?'] },
];

// Assortment Questions - leveraging products, transactions, inventory_levels
const assortmentQuestions: ModuleQuestion[] = [
  // SKU Optimization
  { id: 1, text: "Which SKUs should be added to the assortment based on market gaps?", tags: ['sku', 'expansion'], metricKey: 'sku_opportunity', chartType: 'bar', followUps: ['What categories have assortment gaps?', 'Which competitor products should we match?'] },
  { id: 2, text: "What products should be discontinued based on performance?", tags: ['rationalization', 'performance'], metricKey: 'sku_performance', chartType: 'bar', followUps: ['What is the bottom 10% SKU contribution?', 'Which products have declining velocity?'] },
  { id: 3, text: "Which duplicate SKUs are cannibalizing each other?", tags: ['cannibalization', 'duplicate'], metricKey: 'sku_count', chartType: 'bar', followUps: ['How much sales overlap exists?', 'Which SKU should we keep?'] },
  
  // Category Management
  { id: 4, text: "How does category penetration vary by store type?", tags: ['category', 'penetration'], metricKey: 'category_penetration', chartType: 'bar', followUps: ['Which stores need assortment expansion?', 'What is the penetration gap vs competitors?'] },
  { id: 5, text: "What categories are growing fastest and need assortment expansion?", tags: ['category', 'growth'], metricKey: 'category_growth', chartType: 'bar', followUps: ['What SKUs should we add?', 'Where is demand outpacing supply?'] },
  { id: 6, text: "Which categories are over-assorted with too many similar products?", tags: ['over-assortment', 'efficiency'], metricKey: 'assortment_efficiency', chartType: 'bar', followUps: ['How many SKUs can we cut?', 'What is the efficiency impact?'] },
  
  // Brand Mix
  { id: 7, text: "What's the optimal brand mix for each category?", tags: ['brand', 'mix'], metricKey: 'brand_share', chartType: 'pie', followUps: ['Are we over-indexed on any brands?', 'What is the ideal national vs private label split?'] },
  { id: 8, text: "Which brands are losing share and should be reduced?", tags: ['brand', 'share-loss'], metricKey: 'brand_share', chartType: 'bar', followUps: ['Why is share declining?', 'What should replace the lost share?'] },
  { id: 9, text: "What's the private label opportunity by category?", tags: ['private-label', 'opportunity'], metricKey: 'private_label_share', chartType: 'bar', followUps: ['Which categories should expand private label?', 'What is the margin lift from private label?'] },
  
  // New Products
  { id: 10, text: "Which new products are performing above expectations?", tags: ['new-product', 'success'], metricKey: 'new_product_sales', chartType: 'bar', followUps: ['What drives new product success?', 'Which launches should be expanded?'] },
  { id: 11, text: "Which new product launches failed and why?", tags: ['new-product', 'failure'], metricKey: 'new_product_sales', chartType: 'bar', followUps: ['Should we cut these products?', 'What can we learn for future launches?'] },
  
  // Store Clustering
  { id: 12, text: "What's the ideal assortment depth by store cluster?", tags: ['depth', 'cluster'], metricKey: 'assortment_depth', chartType: 'bar', followUps: ['Which stores are over-assorted?', 'What is the right SKU count by category?'] },
  { id: 13, text: "How do regional preferences impact assortment decisions?", tags: ['regional', 'preferences'], metricKey: 'regional_preference', chartType: 'bar', followUps: ['Which products need regional customization?', 'What local brands should we add?'] },
  
  // Product Velocity
  { id: 14, text: "What is the product velocity by category and brand?", tags: ['velocity', 'turnover'], metricKey: 'product_velocity', chartType: 'bar', followUps: ['Which slow movers should be cut?', 'What drives velocity differences?'] },
  { id: 15, text: "Which slow-moving products are tying up shelf space?", tags: ['slow-movers', 'space'], metricKey: 'product_velocity', chartType: 'bar', followUps: ['What is the opportunity cost?', 'How should we reallocate space?'] },
  { id: 16, text: "What products have the highest customer loyalty and repeat purchase?", tags: ['loyalty', 'repeat'], metricKey: 'repeat_purchase', chartType: 'bar', followUps: ['Why are these products sticky?', 'How can we increase loyalty elsewhere?'] },
];

// Demand Forecasting Questions - leveraging demand_forecasts, forecast_accuracy_tracking, inventory_levels
const demandQuestions: ModuleQuestion[] = [
  // Forecasting
  { id: 1, text: "What's the demand forecast for the next 4 weeks?", tags: ['forecast', 'demand'], metricKey: 'demand_forecast', chartType: 'line', followUps: ['How does forecast compare to last year?', 'Which products have highest uncertainty?'] },
  { id: 2, text: "How accurate are our demand forecasts by category?", tags: ['accuracy', 'category'], metricKey: 'forecast_accuracy', chartType: 'bar', followUps: ['What drives forecast error?', 'How can we improve accuracy?'] },
  { id: 3, text: "What is our forecast bias - are we over or under-forecasting?", tags: ['bias', 'accuracy'], metricKey: 'forecast_bias', chartType: 'bar', followUps: ['Which categories have systematic bias?', 'How can we correct the bias?'] },
  { id: 4, text: "Which forecast model performs best for each category?", tags: ['model', 'performance'], metricKey: 'mape', chartType: 'bar', followUps: ['Should we switch models?', 'What factors improve model fit?'] },
  
  // Stockout Prevention
  { id: 5, text: "Which products are at risk of stockout this week?", tags: ['stockout', 'risk'], metricKey: 'stockout_rate', chartType: 'bar', followUps: ['What is the revenue at risk?', 'Which stores have supply issues?'] },
  { id: 6, text: "How much revenue did we lose to stockouts last month?", tags: ['stockout', 'revenue-loss'], metricKey: 'stockout_rate', chartType: 'bar', followUps: ['Which products had most stockouts?', 'What caused the stockouts?'] },
  { id: 7, text: "What's the optimal reorder point for fast-moving items?", tags: ['reorder', 'fast-moving'], metricKey: 'reorder_point', chartType: 'bar', followUps: ['What safety stock level is optimal?', 'How does lead time impact reorder points?'] },
  
  // Inventory Optimization
  { id: 8, text: "Which products are overstocked and tying up capital?", tags: ['overstock', 'capital'], metricKey: 'overstock_rate', chartType: 'bar', followUps: ['How much capital is tied up?', 'What is the markdown risk?'] },
  { id: 9, text: "What's the optimal safety stock level by product?", tags: ['safety-stock', 'optimization'], metricKey: 'safety_stock', chartType: 'bar', followUps: ['How much working capital is in safety stock?', 'Can we reduce safety stock without stockouts?'] },
  { id: 10, text: "Which stores have the highest inventory turnover?", tags: ['turnover', 'store'], metricKey: 'inventory_turnover', chartType: 'bar', followUps: ['What drives high turnover stores?', 'Which stores need inventory reduction?'] },
  { id: 11, text: "How many days of stock do we have by category?", tags: ['days-of-stock', 'category'], metricKey: 'stock_days', chartType: 'bar', followUps: ['Where are we carrying too much?', 'What is the target days of stock?'] },
  
  // Seasonality & Trends
  { id: 12, text: "How does seasonality affect demand patterns?", tags: ['seasonality', 'patterns'], metricKey: 'seasonal_demand', chartType: 'area', followUps: ['What is the seasonal index by category?', 'When should we build seasonal inventory?'] },
  { id: 13, text: "What demand trends should we plan for next quarter?", tags: ['trends', 'planning'], metricKey: 'demand_variability', chartType: 'line', followUps: ['Which products are trending up?', 'What is driving trend changes?'] },
  
  // Promo Impact
  { id: 14, text: "How do promotions impact demand forecasting accuracy?", tags: ['promotions', 'accuracy'], metricKey: 'promo_forecast_impact', chartType: 'line', followUps: ['What is the promotional lift by category?', 'How can we better forecast promo demand?'] },
  { id: 15, text: "What is the fill rate by product and store?", tags: ['fill-rate', 'store'], metricKey: 'fill_rate', chartType: 'bar', followUps: ['Which stores have fill rate issues?', 'What is causing low fill rates?'] },
  { id: 16, text: "Which products have the highest demand variability?", tags: ['variability', 'risk'], metricKey: 'demand_variability', chartType: 'bar', followUps: ['How should we buffer for variability?', 'What causes the variability?'] },
];

// Supply Chain Questions - leveraging suppliers, supplier_orders, shipping_routes, inventory_levels
const supplyChainQuestions: ModuleQuestion[] = [
  // Supplier Performance
  { id: 1, text: "Which suppliers have the best on-time delivery performance?", tags: ['supplier', 'delivery'], metricKey: 'on_time_delivery', chartType: 'bar', followUps: ['What is the cost of late deliveries?', 'Which suppliers need performance improvement?'] },
  { id: 2, text: "What is each supplier's reliability score and fill rate?", tags: ['supplier', 'reliability'], metricKey: 'supplier_reliability', chartType: 'bar', followUps: ['Which suppliers are underperforming?', 'Should we diversify suppliers?'] },
  { id: 3, text: "Which suppliers are causing the most stockouts?", tags: ['supplier', 'stockouts'], metricKey: 'supplier_fill_rate', chartType: 'bar', followUps: ['What products need backup suppliers?', 'What is the revenue impact?'] },
  { id: 4, text: "How does supplier lead time compare to contract terms?", tags: ['lead-time', 'compliance'], metricKey: 'lead_time', chartType: 'bar', followUps: ['Which suppliers are not meeting SLAs?', 'What penalties should we enforce?'] },
  
  // Lead Time & Orders
  { id: 5, text: "What's the average lead time by product category?", tags: ['lead-time', 'category'], metricKey: 'lead_time', chartType: 'bar', followUps: ['How can we reduce lead times?', 'Which categories have longest lead times?'] },
  { id: 6, text: "How many supplier orders are past due this week?", tags: ['orders', 'past-due'], metricKey: 'order_cycle_time', chartType: 'bar', followUps: ['What products are affected?', 'How should we escalate?'] },
  { id: 7, text: "What is the perfect order rate by supplier?", tags: ['perfect-order', 'supplier'], metricKey: 'perfect_order_rate', chartType: 'bar', followUps: ['What causes imperfect orders?', 'How can we improve order accuracy?'] },
  
  // Distribution & Routes
  { id: 8, text: "How can we optimize distribution routes to reduce costs?", tags: ['distribution', 'optimization'], metricKey: 'route_efficiency', chartType: 'bar', followUps: ['What is the cost per mile by route?', 'Which routes are underutilized?'] },
  { id: 9, text: "What is the average transit time by shipping route?", tags: ['transit-time', 'routes'], metricKey: 'avg_transit_time', chartType: 'bar', followUps: ['Which routes are slowest?', 'Can we use alternative routes?'] },
  { id: 10, text: "How does transportation mode impact cost and speed?", tags: ['transportation', 'mode'], metricKey: 'transport_cost_per_unit', chartType: 'bar', followUps: ['When should we use expedited shipping?', 'What is the optimal mode mix?'] },
  
  // Logistics Costs
  { id: 11, text: "What's the cost breakdown of our logistics operations?", tags: ['cost', 'logistics'], metricKey: 'logistics_cost', chartType: 'pie', followUps: ['Where are the biggest cost savings opportunities?', 'How do our costs compare to industry benchmarks?'] },
  { id: 12, text: "How can we reduce transportation costs per unit?", tags: ['transportation', 'cost'], metricKey: 'transport_cost_per_unit', chartType: 'bar', followUps: ['What is the optimal delivery frequency?', 'Should we use more local suppliers?'] },
  { id: 13, text: "What is our carbon footprint by shipping route?", tags: ['sustainability', 'carbon'], metricKey: 'carbon_footprint', chartType: 'bar', followUps: ['How can we reduce emissions?', 'What is the cost of green alternatives?'] },
  
  // Warehouse & Capacity
  { id: 14, text: "Which warehouses are operating at capacity?", tags: ['warehouse', 'capacity'], metricKey: 'warehouse_utilization', chartType: 'bar', followUps: ['What is the cost of over-capacity?', 'Which products consume most space?'] },
  { id: 15, text: "What is the regional perfect order rate?", tags: ['perfect-order', 'regional'], metricKey: 'perfect_order_rate', chartType: 'bar', followUps: ['What causes regional variation?', 'How can we improve consistency?'] },
  { id: 16, text: "How do supplier issues impact store availability?", tags: ['supplier', 'availability'], metricKey: 'supplier_fill_rate', chartType: 'bar', followUps: ['Which products need backup suppliers?', 'What is the revenue impact of supplier issues?'] },
];

// Space Planning Questions - leveraging planograms, shelf_allocations, fixtures, store_performance
const spaceQuestions: ModuleQuestion[] = [
  // Space Productivity
  { id: 1, text: "Which categories generate the highest sales per square foot?", tags: ['sales', 'space'], metricKey: 'sales_per_sqft', chartType: 'bar', followUps: ['Which categories are underperforming their space?', 'How does performance vary by store format?'] },
  { id: 2, text: "What is the GMROI by category and shelf position?", tags: ['gmroi', 'position'], metricKey: 'gmroi', chartType: 'bar', followUps: ['Which shelf positions are most valuable?', 'How should we price premium positions?'] },
  { id: 3, text: "Which products are underperforming their allocated space?", tags: ['underperformance', 'space'], metricKey: 'sales_per_sqft', chartType: 'bar', followUps: ['Should we reduce their space?', 'What should replace them?'] },
  
  // Planogram Optimization
  { id: 4, text: "How should we allocate shelf space across categories?", tags: ['allocation', 'category'], metricKey: 'category_space_share', chartType: 'pie', followUps: ['Which categories need more space?', 'What is the optimal category adjacency?'] },
  { id: 5, text: "What's the optimal number of facings for top products?", tags: ['facings', 'optimization'], metricKey: 'facings_per_sku', chartType: 'bar', followUps: ['Which products are under-spaced?', 'How do facings impact sales velocity?'] },
  { id: 6, text: "How does planogram compliance impact sales?", tags: ['planogram', 'compliance'], metricKey: 'planogram_compliance', chartType: 'bar', followUps: ['Which stores have lowest compliance?', 'What is the sales lift from 100% compliance?'] },
  { id: 7, text: "Which planograms need updating based on sales data?", tags: ['planogram', 'update'], metricKey: 'planogram_compliance', chartType: 'bar', followUps: ['What changes would improve sales?', 'When was the last planogram reset?'] },
  
  // Shelf Position
  { id: 8, text: "How does eye-level placement impact product sales?", tags: ['eye-level', 'placement'], metricKey: 'eye_level_performance', chartType: 'bar', followUps: ['Which products should be at eye level?', 'What is the premium for eye level?'] },
  { id: 9, text: "What is the out-of-shelf rate by category?", tags: ['out-of-shelf', 'availability'], metricKey: 'out_of_shelf', chartType: 'bar', followUps: ['What causes out-of-shelf?', 'What is the revenue impact?'] },
  { id: 10, text: "What shelf capacity utilization do we have by aisle?", tags: ['capacity', 'utilization'], metricKey: 'shelf_capacity_utilization', chartType: 'bar', followUps: ['Which aisles are overcrowded?', 'Where can we add products?'] },
  
  // Store Layout
  { id: 11, text: "Which store layouts drive the highest conversion?", tags: ['layout', 'conversion'], metricKey: 'store_conversion', chartType: 'bar', followUps: ['What layout elements drive conversion?', 'How does traffic flow impact sales?'] },
  { id: 12, text: "How do endcap displays impact category sales?", tags: ['endcap', 'impact'], metricKey: 'endcap_lift', chartType: 'bar', followUps: ['Which products perform best on endcaps?', 'What is the optimal endcap rotation?'] },
  { id: 13, text: "What is the optimal fixture type for each category?", tags: ['fixtures', 'category'], metricKey: 'fixture_performance', chartType: 'bar', followUps: ['Which fixtures need replacement?', 'What is the ROI of new fixtures?'] },
  
  // Cross-Selling & Impulse
  { id: 14, text: "What's the optimal product adjacency for cross-selling?", tags: ['adjacency', 'cross-sell'], metricKey: 'adjacency_impact', chartType: 'bar', followUps: ['Which product pairs drive basket size?', 'How should we organize for cross-sell?'] },
  { id: 15, text: "What is the impulse purchase rate by checkout position?", tags: ['impulse', 'checkout'], metricKey: 'impulse_purchase_rate', chartType: 'bar', followUps: ['Which products work best at checkout?', 'How can we increase impulse sales?'] },
  { id: 16, text: "How does aisle traffic pattern affect category sales?", tags: ['traffic', 'aisle'], metricKey: 'aisle_traffic', chartType: 'bar', followUps: ['Which aisles have low traffic?', 'How can we improve traffic flow?'] },
];

// Popular question IDs by module
const modulePopularIds: Record<string, number[]> = {
  pricing: [1, 2, 4, 5, 7, 10, 12, 14],
  assortment: [1, 2, 4, 7, 10, 12, 14, 16],
  demand: [1, 2, 5, 6, 8, 10, 12, 14],
  'supply-chain': [1, 2, 5, 8, 11, 12, 14, 16],
  space: [1, 2, 4, 5, 6, 8, 11, 14],
};

// Module-specific personas
export const getModulePersonas = (moduleId: string) => {
  const baseExecutive = {
    label: 'Executive',
    description: 'Strategic insights across all categories',
    icon: '👔',
    categories: null as string[] | null,
  };

  switch (moduleId) {
    case 'pricing':
      return {
        executive: baseExecutive,
        consumables: { label: 'Pricing Manager - Consumables', description: 'Pricing strategy for grocery', icon: '🥛', categories: ['Dairy', 'Beverages', 'Snacks', 'Produce', 'Frozen', 'Bakery', 'Pantry'] },
        non_consumables: { label: 'Pricing Manager - Non-Consumables', description: 'Pricing for non-food', icon: '🧴', categories: ['Personal Care', 'Home Care', 'Household'] },
      };
    case 'assortment':
      return {
        executive: baseExecutive,
        consumables: { label: 'Category Manager - Consumables', description: 'Assortment for grocery', icon: '🥛', categories: ['Dairy', 'Beverages', 'Snacks', 'Produce', 'Frozen', 'Bakery', 'Pantry'] },
        non_consumables: { label: 'Category Manager - Non-Consumables', description: 'Assortment for non-food', icon: '🧴', categories: ['Personal Care', 'Home Care', 'Household'] },
      };
    case 'demand':
      return {
        executive: baseExecutive,
        consumables: { label: 'Demand Planner - Consumables', description: 'Forecasting for grocery', icon: '🥛', categories: ['Dairy', 'Beverages', 'Snacks', 'Produce', 'Frozen', 'Bakery', 'Pantry'] },
        non_consumables: { label: 'Demand Planner - Non-Consumables', description: 'Forecasting for non-food', icon: '🧴', categories: ['Personal Care', 'Home Care', 'Household'] },
      };
    case 'supply-chain':
      return {
        executive: baseExecutive,
        consumables: { label: 'Logistics Manager', description: 'Distribution and transportation', icon: '🚚', categories: ['Dairy', 'Beverages', 'Snacks', 'Produce', 'Frozen', 'Bakery', 'Pantry'] },
        non_consumables: { label: 'Warehouse Manager', description: 'Inventory and storage', icon: '🏭', categories: ['Personal Care', 'Home Care', 'Household'] },
      };
    case 'space':
      return {
        executive: baseExecutive,
        consumables: { label: 'Store Operations', description: 'Store layout for grocery', icon: '🏪', categories: ['Dairy', 'Beverages', 'Snacks', 'Produce', 'Frozen', 'Bakery', 'Pantry'] },
        non_consumables: { label: 'Visual Merchandising', description: 'Planogram for non-food', icon: '📐', categories: ['Personal Care', 'Home Care', 'Household'] },
      };
    default:
      return {
        executive: baseExecutive,
        consumables: { label: 'Category Manager - Consumables', description: 'Tactical analysis for grocery', icon: '🥛', categories: ['Dairy', 'Beverages', 'Snacks', 'Produce', 'Frozen', 'Bakery', 'Pantry'] },
        non_consumables: { label: 'Category Manager - Non-Consumables', description: 'Tactical analysis for non-food', icon: '🧴', categories: ['Personal Care', 'Home Care', 'Household'] },
      };
  }
};

// Get questions for a module
export const getModuleQuestions = (moduleId: string): ModuleQuestion[] => {
  switch (moduleId) {
    case 'pricing': return pricingQuestions;
    case 'assortment': return assortmentQuestions;
    case 'demand': return demandQuestions;
    case 'supply-chain': return supplyChainQuestions;
    case 'space': return spaceQuestions;
    default: return [];
  }
};

// Get popular question IDs for a module
export const getModulePopularIds = (moduleId: string): number[] => {
  return modulePopularIds[moduleId] || [];
};

// Get edge function name for a module
export const getModuleEdgeFunction = (moduleId: string): string => {
  if (moduleId === 'promotion') {
    return 'analyze-question';
  }
  return 'analyze-module-question';
};
