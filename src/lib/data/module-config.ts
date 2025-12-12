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

// Pricing Questions
const pricingQuestions: ModuleQuestion[] = [
  { id: 1, text: "What is the optimal price point for our top-selling products?", tags: ['pricing', 'optimization'], metricKey: 'optimal_price', chartType: 'bar', followUps: ['How does price elasticity vary by category?', 'What margin improvement can we achieve?'] },
  { id: 2, text: "How does price elasticity vary across product categories?", tags: ['elasticity', 'category'], metricKey: 'price_elasticity', chartType: 'bar', followUps: ['Which products are most price sensitive?', 'What is the optimal discount depth?'] },
  { id: 3, text: "What's our competitive price positioning vs major retailers?", tags: ['competitive', 'positioning'], metricKey: 'competitive_index', chartType: 'bar', followUps: ['Which categories need price adjustment?', 'What is our price gap by region?'] },
  { id: 4, text: "Which products have the highest margin opportunity?", tags: ['margin', 'opportunity'], metricKey: 'margin_percent', chartType: 'bar', followUps: ['What price increase would optimize margin?', 'Which brands have pricing power?'] },
  { id: 5, text: "How do price changes impact sales volume?", tags: ['price', 'volume'], metricKey: 'volume_impact', chartType: 'line', followUps: ['What is the revenue-maximizing price?', 'How quickly do customers respond to price changes?'] },
  { id: 6, text: "What's the optimal markdown strategy for seasonal items?", tags: ['markdown', 'seasonal'], metricKey: 'markdown_rate', chartType: 'area', followUps: ['When should markdowns begin?', 'What is the optimal markdown cadence?'] },
  { id: 7, text: "Which regions are most price sensitive?", tags: ['regional', 'sensitivity'], metricKey: 'price_sensitivity', chartType: 'bar', followUps: ['Should we use regional pricing?', 'What drives regional price sensitivity?'] },
  { id: 8, text: "How does our private label pricing compare to national brands?", tags: ['private-label', 'comparison'], metricKey: 'price_gap', chartType: 'bar', followUps: ['What is the optimal private label price gap?', 'Which categories have private label opportunity?'] },
];

// Assortment Questions
const assortmentQuestions: ModuleQuestion[] = [
  { id: 1, text: "Which SKUs should be added to the assortment?", tags: ['sku', 'expansion'], metricKey: 'sku_opportunity', chartType: 'bar', followUps: ['What categories have assortment gaps?', 'Which competitor products should we match?'] },
  { id: 2, text: "What products should be discontinued based on performance?", tags: ['rationalization', 'performance'], metricKey: 'sku_performance', chartType: 'bar', followUps: ['What is the bottom 10% SKU contribution?', 'Which products have declining velocity?'] },
  { id: 3, text: "How does category penetration vary by store type?", tags: ['category', 'penetration'], metricKey: 'category_penetration', chartType: 'bar', followUps: ['Which stores need assortment expansion?', 'What is the penetration gap vs competitors?'] },
  { id: 4, text: "What's the optimal brand mix for each category?", tags: ['brand', 'mix'], metricKey: 'brand_share', chartType: 'pie', followUps: ['Are we over-indexed on any brands?', 'What is the ideal national vs private label split?'] },
  { id: 5, text: "Which new products are performing above expectations?", tags: ['new-product', 'performance'], metricKey: 'new_product_sales', chartType: 'bar', followUps: ['What drives new product success?', 'Which launches should be expanded?'] },
  { id: 6, text: "What's the ideal assortment depth by store cluster?", tags: ['depth', 'cluster'], metricKey: 'assortment_depth', chartType: 'bar', followUps: ['Which stores are over-assorted?', 'What is the right SKU count by category?'] },
  { id: 7, text: "How do regional preferences impact assortment decisions?", tags: ['regional', 'preferences'], metricKey: 'regional_preference', chartType: 'bar', followUps: ['Which products need regional customization?', 'What local brands should we add?'] },
  { id: 8, text: "What's the private label opportunity by category?", tags: ['private-label', 'opportunity'], metricKey: 'private_label_share', chartType: 'bar', followUps: ['Which categories should expand private label?', 'What is the margin lift from private label?'] },
];

// Demand Forecasting Questions
const demandQuestions: ModuleQuestion[] = [
  { id: 1, text: "What's the demand forecast for the next 4 weeks?", tags: ['forecast', 'demand'], metricKey: 'demand_forecast', chartType: 'line', followUps: ['How does forecast compare to last year?', 'Which products have highest uncertainty?'] },
  { id: 2, text: "Which products are at risk of stockout?", tags: ['stockout', 'risk'], metricKey: 'stockout_rate', chartType: 'bar', followUps: ['What is the revenue at risk?', 'Which stores have supply issues?'] },
  { id: 3, text: "How accurate are our demand forecasts by category?", tags: ['accuracy', 'category'], metricKey: 'forecast_accuracy', chartType: 'bar', followUps: ['What drives forecast error?', 'How can we improve accuracy?'] },
  { id: 4, text: "What's the optimal reorder point for fast-moving items?", tags: ['reorder', 'fast-moving'], metricKey: 'reorder_point', chartType: 'bar', followUps: ['What safety stock level is optimal?', 'How does lead time impact reorder points?'] },
  { id: 5, text: "How does seasonality affect demand patterns?", tags: ['seasonality', 'patterns'], metricKey: 'seasonal_demand', chartType: 'area', followUps: ['What is the seasonal index by category?', 'When should we build seasonal inventory?'] },
  { id: 6, text: "Which stores have the highest inventory turnover?", tags: ['turnover', 'store'], metricKey: 'inventory_turnover', chartType: 'bar', followUps: ['What drives high turnover stores?', 'Which stores need inventory reduction?'] },
  { id: 7, text: "What's the optimal safety stock level by product?", tags: ['safety-stock', 'optimization'], metricKey: 'safety_stock', chartType: 'bar', followUps: ['How much working capital is in safety stock?', 'Can we reduce safety stock without stockouts?'] },
  { id: 8, text: "How do promotions impact demand forecasting accuracy?", tags: ['promotions', 'accuracy'], metricKey: 'promo_forecast_impact', chartType: 'line', followUps: ['What is the promotional lift by category?', 'How can we better forecast promo demand?'] },
];

// Supply Chain Questions
const supplyChainQuestions: ModuleQuestion[] = [
  { id: 1, text: "Which suppliers have the best on-time delivery performance?", tags: ['supplier', 'delivery'], metricKey: 'on_time_delivery', chartType: 'bar', followUps: ['What is the cost of late deliveries?', 'Which suppliers need performance improvement?'] },
  { id: 2, text: "What's the average lead time by product category?", tags: ['lead-time', 'category'], metricKey: 'lead_time', chartType: 'bar', followUps: ['How can we reduce lead times?', 'Which categories have longest lead times?'] },
  { id: 3, text: "How can we optimize distribution routes?", tags: ['distribution', 'optimization'], metricKey: 'route_efficiency', chartType: 'bar', followUps: ['What is the cost per mile by route?', 'Which routes are underutilized?'] },
  { id: 4, text: "Which warehouses are operating at capacity?", tags: ['warehouse', 'capacity'], metricKey: 'warehouse_utilization', chartType: 'bar', followUps: ['What is the cost of over-capacity?', 'Which products consume most space?'] },
  { id: 5, text: "What's the cost breakdown of our logistics operations?", tags: ['cost', 'logistics'], metricKey: 'logistics_cost', chartType: 'pie', followUps: ['Where are the biggest cost savings opportunities?', 'How do our costs compare to industry benchmarks?'] },
  { id: 6, text: "How do supplier issues impact store availability?", tags: ['supplier', 'availability'], metricKey: 'supplier_fill_rate', chartType: 'bar', followUps: ['Which products need backup suppliers?', 'What is the revenue impact of supplier issues?'] },
  { id: 7, text: "What's the perfect order rate by region?", tags: ['perfect-order', 'regional'], metricKey: 'perfect_order_rate', chartType: 'bar', followUps: ['What causes imperfect orders?', 'How can we improve order accuracy?'] },
  { id: 8, text: "How can we reduce transportation costs?", tags: ['transportation', 'cost'], metricKey: 'transport_cost_per_unit', chartType: 'bar', followUps: ['What is the optimal delivery frequency?', 'Should we use more local suppliers?'] },
];

// Space Planning Questions
const spaceQuestions: ModuleQuestion[] = [
  { id: 1, text: "Which categories generate the highest sales per square foot?", tags: ['sales', 'space'], metricKey: 'sales_per_sqft', chartType: 'bar', followUps: ['Which categories are underperforming their space?', 'How does performance vary by store format?'] },
  { id: 2, text: "How should we allocate shelf space across categories?", tags: ['allocation', 'category'], metricKey: 'category_space_share', chartType: 'pie', followUps: ['Which categories need more space?', 'What is the optimal category adjacency?'] },
  { id: 3, text: "What's the optimal number of facings for top products?", tags: ['facings', 'optimization'], metricKey: 'facings_per_sku', chartType: 'bar', followUps: ['Which products are under-spaced?', 'How do facings impact sales velocity?'] },
  { id: 4, text: "How does planogram compliance impact sales?", tags: ['planogram', 'compliance'], metricKey: 'planogram_compliance', chartType: 'bar', followUps: ['Which stores have lowest compliance?', 'What is the sales lift from 100% compliance?'] },
  { id: 5, text: "Which store layouts drive the highest conversion?", tags: ['layout', 'conversion'], metricKey: 'store_conversion', chartType: 'bar', followUps: ['What layout elements drive conversion?', 'How does traffic flow impact sales?'] },
  { id: 6, text: "What's the GMROI by category and shelf position?", tags: ['gmroi', 'position'], metricKey: 'gmroi', chartType: 'bar', followUps: ['Which shelf positions are most valuable?', 'How should we price premium positions?'] },
  { id: 7, text: "How do endcap displays impact category sales?", tags: ['endcap', 'impact'], metricKey: 'endcap_lift', chartType: 'bar', followUps: ['Which products perform best on endcaps?', 'What is the optimal endcap rotation?'] },
  { id: 8, text: "What's the optimal product adjacency for cross-selling?", tags: ['adjacency', 'cross-sell'], metricKey: 'adjacency_impact', chartType: 'bar', followUps: ['Which product pairs drive basket size?', 'How should we organize for cross-sell?'] },
];

// Popular question IDs by module
const modulePopularIds: Record<string, number[]> = {
  pricing: [1, 2, 3, 4, 6, 7],
  assortment: [1, 2, 3, 4, 5, 8],
  demand: [1, 2, 3, 5, 6, 7],
  'supply-chain': [1, 2, 4, 5, 6, 7],
  space: [1, 2, 3, 4, 6, 7],
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
