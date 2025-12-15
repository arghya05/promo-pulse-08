// Module-specific search suggestions and templates
import { TrendingUp, Calendar, BarChart3, Target, Clock, MapPin, Users, Package, Truck, DollarSign, ShoppingCart, Layers, Box, Warehouse, Route, Percent, Scale, Grid3X3, Sparkles, Crown } from "lucide-react";

export interface SuggestionTemplate {
  text: string;
  icon: any;
  variation: string;
}

// Executive module suggestions - strategic cross-functional
export const executiveSuggestions: Record<string, SuggestionTemplate[]> = {
  "top": [
    { text: "Top {n} categories by revenue contribution", icon: DollarSign, variation: "revenue" },
    { text: "Top {n} regions by YoY growth", icon: TrendingUp, variation: "growth" },
    { text: "Top {n} stores by performance", icon: Target, variation: "stores" },
    { text: "Top {n} brands by market share", icon: BarChart3, variation: "brands" },
    { text: "Top {n} suppliers by reliability", icon: Truck, variation: "suppliers" },
    { text: "Top {n} categories by margin %", icon: Percent, variation: "margin" },
  ],
  "what": [
    { text: "What is overall merchandising performance this quarter?", icon: BarChart3, variation: "performance" },
    { text: "What is our margin vs budget by category?", icon: DollarSign, variation: "margin" },
    { text: "What is the total inventory investment?", icon: Warehouse, variation: "inventory" },
    { text: "What is our competitive position by category?", icon: Target, variation: "competitive" },
    { text: "What is the P&L by category end-to-end?", icon: DollarSign, variation: "pnl" },
    { text: "What is our market share trend?", icon: TrendingUp, variation: "share" },
  ],
  "how": [
    { text: "How is store performance varying by region?", icon: MapPin, variation: "regional" },
    { text: "How does pricing affect demand forecasts?", icon: TrendingUp, variation: "pricing" },
    { text: "How effective is our promotional spend?", icon: BarChart3, variation: "promo" },
    { text: "How does assortment depth impact costs?", icon: Layers, variation: "assortment" },
    { text: "How does supplier performance affect availability?", icon: Truck, variation: "supply" },
  ],
  "which": [
    { text: "Which categories are underperforming?", icon: Target, variation: "underperform" },
    { text: "Which stores need intervention?", icon: MapPin, variation: "stores" },
    { text: "Which suppliers pose risk?", icon: Truck, variation: "risk" },
    { text: "Which promotions have best ROI?", icon: TrendingUp, variation: "promo" },
    { text: "Which SKUs drive growth?", icon: Package, variation: "sku" },
  ],
  "compare": [
    { text: "Compare performance by region", icon: MapPin, variation: "region" },
    { text: "Compare consumables vs non-consumables", icon: Package, variation: "category" },
    { text: "Compare this quarter vs last year", icon: Calendar, variation: "yoy" },
    { text: "Compare our pricing vs competitors", icon: BarChart3, variation: "competitive" },
  ],
  "forecast": [
    { text: "Forecast next quarter revenue", icon: TrendingUp, variation: "revenue" },
    { text: "Forecast demand by category", icon: Clock, variation: "demand" },
    { text: "Forecast margin trajectory", icon: DollarSign, variation: "margin" },
  ],
  "simulate": [
    { text: "What if we increase promo spend by 10%?", icon: Sparkles, variation: "promo" },
    { text: "What if we rationalize bottom 10% SKUs?", icon: Package, variation: "sku" },
    { text: "What if we implement dynamic pricing?", icon: DollarSign, variation: "pricing" },
    { text: "What if we consolidate suppliers?", icon: Truck, variation: "supplier" },
  ],
};

// Pricing module suggestions
export const pricingSuggestions: Record<string, SuggestionTemplate[]> = {
  "top": [
    { text: "Top {n} products by margin", icon: DollarSign, variation: "margin" },
    { text: "Top {n} products by price elasticity", icon: TrendingUp, variation: "elasticity" },
    { text: "Top {n} opportunities for price increase", icon: TrendingUp, variation: "opportunity" },
    { text: "Top {n} competitive price gaps", icon: Target, variation: "competitive" },
    { text: "Top {n} markdown candidates", icon: Percent, variation: "markdown" },
  ],
  "what": [
    { text: "What's the optimal price for top sellers?", icon: Target, variation: "optimal" },
    { text: "What products have the highest margin?", icon: DollarSign, variation: "margin" },
    { text: "What's our price gap vs Walmart?", icon: BarChart3, variation: "competitive" },
    { text: "What's the price elasticity by category?", icon: TrendingUp, variation: "elasticity" },
  ],
  "which": [
    { text: "Which products need price adjustment?", icon: Target, variation: "adjust" },
    { text: "Which categories are price sensitive?", icon: Package, variation: "sensitive" },
    { text: "Which regions are most competitive?", icon: MapPin, variation: "regional" },
    { text: "Which private label products can increase price?", icon: DollarSign, variation: "private" },
  ],
  "how": [
    { text: "How do price changes impact volume?", icon: TrendingUp, variation: "volume" },
    { text: "How does our pricing compare to competitors?", icon: BarChart3, variation: "compare" },
    { text: "How effective are markdowns?", icon: Percent, variation: "markdown" },
    { text: "How price sensitive is Dairy category?", icon: Package, variation: "dairy" },
  ],
  "compare": [
    { text: "Compare our prices vs Kroger", icon: BarChart3, variation: "kroger" },
    { text: "Compare prices by region", icon: MapPin, variation: "region" },
    { text: "Compare private label vs national brand pricing", icon: Package, variation: "brand" },
    { text: "Compare price elasticity by category", icon: TrendingUp, variation: "category" },
  ],
  "optimize": [
    { text: "Optimize pricing for maximum margin", icon: DollarSign, variation: "margin" },
    { text: "Optimize markdown strategy for seasonal items", icon: Calendar, variation: "seasonal" },
    { text: "Optimize competitive positioning", icon: Target, variation: "competitive" },
  ],
};

// Supply Chain module suggestions
export const supplyChainSuggestions: Record<string, SuggestionTemplate[]> = {
  "top": [
    { text: "Top {n} suppliers by on-time delivery", icon: Truck, variation: "delivery" },
    { text: "Top {n} suppliers by reliability score", icon: Target, variation: "reliability" },
    { text: "Top {n} routes by efficiency", icon: Route, variation: "routes" },
    { text: "Top {n} warehouses by utilization", icon: Warehouse, variation: "warehouse" },
    { text: "Top {n} products by lead time", icon: Clock, variation: "leadtime" },
  ],
  "what": [
    { text: "What's the average lead time by category?", icon: Clock, variation: "leadtime" },
    { text: "What's our supplier reliability score?", icon: Target, variation: "reliability" },
    { text: "What's the logistics cost breakdown?", icon: DollarSign, variation: "cost" },
    { text: "What's the perfect order rate by region?", icon: MapPin, variation: "region" },
  ],
  "which": [
    { text: "Which suppliers have delivery issues?", icon: Truck, variation: "issues" },
    { text: "Which routes need optimization?", icon: Route, variation: "routes" },
    { text: "Which warehouses are at capacity?", icon: Warehouse, variation: "capacity" },
    { text: "Which products have supply chain risk?", icon: Package, variation: "risk" },
  ],
  "how": [
    { text: "How can we reduce transportation costs?", icon: DollarSign, variation: "cost" },
    { text: "How do supplier issues impact availability?", icon: Box, variation: "availability" },
    { text: "How efficient are our distribution routes?", icon: Route, variation: "efficiency" },
    { text: "How can we improve supplier performance?", icon: TrendingUp, variation: "improve" },
  ],
  "compare": [
    { text: "Compare suppliers by performance", icon: BarChart3, variation: "suppliers" },
    { text: "Compare lead times by product category", icon: Clock, variation: "category" },
    { text: "Compare logistics costs by region", icon: MapPin, variation: "region" },
    { text: "Compare on-time delivery by supplier", icon: Truck, variation: "delivery" },
  ],
  "optimize": [
    { text: "Optimize distribution routes", icon: Route, variation: "routes" },
    { text: "Optimize inventory replenishment", icon: Box, variation: "inventory" },
    { text: "Optimize supplier selection", icon: Target, variation: "suppliers" },
  ],
};

// Demand Forecasting module suggestions
export const demandSuggestions: Record<string, SuggestionTemplate[]> = {
  "top": [
    { text: "Top {n} products at stockout risk", icon: Target, variation: "stockout" },
    { text: "Top {n} forecasts by accuracy", icon: TrendingUp, variation: "accuracy" },
    { text: "Top {n} products by demand variance", icon: BarChart3, variation: "variance" },
    { text: "Top {n} stores by inventory turnover", icon: Warehouse, variation: "turnover" },
  ],
  "what": [
    { text: "What's the demand forecast for next 4 weeks?", icon: Clock, variation: "forecast" },
    { text: "What's our forecast accuracy by category?", icon: Target, variation: "accuracy" },
    { text: "What's the optimal reorder point?", icon: Box, variation: "reorder" },
    { text: "What's the safety stock level needed?", icon: Warehouse, variation: "safety" },
  ],
  "which": [
    { text: "Which products are at stockout risk?", icon: Target, variation: "stockout" },
    { text: "Which categories show seasonal patterns?", icon: Calendar, variation: "seasonal" },
    { text: "Which stores have highest turnover?", icon: Warehouse, variation: "turnover" },
    { text: "Which forecasts need improvement?", icon: TrendingUp, variation: "improve" },
  ],
  "how": [
    { text: "How does seasonality affect demand?", icon: Calendar, variation: "seasonal" },
    { text: "How accurate are our forecasts?", icon: Target, variation: "accuracy" },
    { text: "How do promotions impact demand?", icon: BarChart3, variation: "promo" },
    { text: "How can we reduce overstock?", icon: Box, variation: "overstock" },
  ],
  "forecast": [
    { text: "Forecast demand for next month", icon: Clock, variation: "month" },
    { text: "Forecast seasonal demand patterns", icon: Calendar, variation: "seasonal" },
    { text: "Forecast inventory requirements", icon: Warehouse, variation: "inventory" },
    { text: "Forecast stockout probability", icon: Target, variation: "stockout" },
  ],
  "compare": [
    { text: "Compare forecast vs actuals", icon: BarChart3, variation: "accuracy" },
    { text: "Compare demand by store", icon: MapPin, variation: "store" },
    { text: "Compare seasonal patterns by category", icon: Calendar, variation: "seasonal" },
  ],
};

// Assortment module suggestions
export const assortmentSuggestions: Record<string, SuggestionTemplate[]> = {
  "top": [
    { text: "Top {n} SKUs to add to assortment", icon: ShoppingCart, variation: "add" },
    { text: "Top {n} SKUs to discontinue", icon: Target, variation: "discontinue" },
    { text: "Top {n} new products by performance", icon: TrendingUp, variation: "new" },
    { text: "Top {n} categories by penetration", icon: Package, variation: "penetration" },
  ],
  "what": [
    { text: "What's the optimal brand mix?", icon: Package, variation: "brand" },
    { text: "What products should be discontinued?", icon: Target, variation: "discontinue" },
    { text: "What's the private label opportunity?", icon: DollarSign, variation: "private" },
    { text: "What's the ideal assortment depth?", icon: Layers, variation: "depth" },
  ],
  "which": [
    { text: "Which SKUs should be added?", icon: ShoppingCart, variation: "add" },
    { text: "Which new products are performing well?", icon: TrendingUp, variation: "new" },
    { text: "Which categories need more depth?", icon: Layers, variation: "depth" },
    { text: "Which brands are underrepresented?", icon: Package, variation: "brands" },
  ],
  "how": [
    { text: "How does category penetration vary by store?", icon: MapPin, variation: "store" },
    { text: "How do regional preferences impact assortment?", icon: MapPin, variation: "regional" },
    { text: "How is private label performing?", icon: Package, variation: "private" },
    { text: "How effective is our brand mix?", icon: BarChart3, variation: "mix" },
  ],
  "compare": [
    { text: "Compare category performance", icon: BarChart3, variation: "category" },
    { text: "Compare assortment by store cluster", icon: MapPin, variation: "cluster" },
    { text: "Compare private label vs national brands", icon: Package, variation: "brand" },
  ],
  "optimize": [
    { text: "Optimize assortment by store type", icon: MapPin, variation: "store" },
    { text: "Optimize brand mix by category", icon: Package, variation: "brand" },
    { text: "Optimize SKU count by store size", icon: Layers, variation: "size" },
  ],
};

// Space Planning module suggestions
export const spaceSuggestions: Record<string, SuggestionTemplate[]> = {
  "top": [
    { text: "Top {n} categories by sales per sqft", icon: DollarSign, variation: "sales" },
    { text: "Top {n} products for endcap placement", icon: Grid3X3, variation: "endcap" },
    { text: "Top {n} planograms by compliance", icon: Target, variation: "compliance" },
    { text: "Top {n} fixtures by utilization", icon: Warehouse, variation: "fixture" },
    { text: "Top {n} SKUs for eye-level placement", icon: Target, variation: "eyelevel" },
    { text: "Top {n} aisles by traffic index", icon: TrendingUp, variation: "traffic" },
  ],
  "what": [
    { text: "What's the optimal shelf allocation?", icon: Grid3X3, variation: "shelf" },
    { text: "What's our planogram compliance?", icon: Target, variation: "compliance" },
    { text: "What's the GMROI by shelf position?", icon: DollarSign, variation: "gmroi" },
    { text: "What's the optimal number of facings?", icon: Layers, variation: "facings" },
    { text: "What's the revenue per linear foot?", icon: DollarSign, variation: "revenue" },
    { text: "What's our out-of-shelf rate?", icon: Box, variation: "oos" },
    { text: "What's the space-to-sales index?", icon: BarChart3, variation: "index" },
  ],
  "which": [
    { text: "Which categories need more space?", icon: Package, variation: "space" },
    { text: "Which layouts drive highest conversion?", icon: TrendingUp, variation: "layout" },
    { text: "Which endcaps perform best?", icon: Grid3X3, variation: "endcap" },
    { text: "Which products belong at eye level?", icon: Target, variation: "eyelevel" },
    { text: "Which planograms need reset?", icon: Calendar, variation: "reset" },
    { text: "Which aisles have lowest traffic?", icon: Route, variation: "traffic" },
    { text: "Which fixtures are underperforming?", icon: Warehouse, variation: "fixture" },
  ],
  "how": [
    { text: "How should we allocate shelf space?", icon: Grid3X3, variation: "allocate" },
    { text: "How do endcaps impact category sales?", icon: TrendingUp, variation: "endcap" },
    { text: "How effective is our planogram?", icon: Target, variation: "planogram" },
    { text: "How can we optimize cross-selling?", icon: ShoppingCart, variation: "crosssell" },
    { text: "How does eye-level placement boost sales?", icon: TrendingUp, variation: "eyelevel" },
    { text: "How does vertical blocking affect sales?", icon: Layers, variation: "blocking" },
    { text: "How do seasonal resets impact performance?", icon: Calendar, variation: "seasonal" },
  ],
  "compare": [
    { text: "Compare sales per sqft by category", icon: BarChart3, variation: "category" },
    { text: "Compare fixture performance", icon: Grid3X3, variation: "fixture" },
    { text: "Compare eye-level vs other positions", icon: Layers, variation: "position" },
    { text: "Compare power aisle vs regular aisle", icon: Route, variation: "aisle" },
    { text: "Compare planogram versions", icon: Target, variation: "version" },
  ],
  "optimize": [
    { text: "Optimize shelf space allocation", icon: Grid3X3, variation: "space" },
    { text: "Optimize product adjacency", icon: Package, variation: "adjacency" },
    { text: "Optimize planogram for sales per sqft", icon: DollarSign, variation: "sales" },
    { text: "Optimize checkout impulse zone", icon: ShoppingCart, variation: "impulse" },
    { text: "Optimize endcap rotation schedule", icon: Calendar, variation: "rotation" },
  ],
  "simulate": [
    { text: "What if we increase Dairy space by 20%?", icon: Sparkles, variation: "dairy" },
    { text: "What if we add 2 facings for top SKUs?", icon: Layers, variation: "facings" },
    { text: "What if we move Snacks to eye level?", icon: Target, variation: "snacks" },
    { text: "What if we consolidate endcap rotation?", icon: Calendar, variation: "endcap" },
  ],
};

// Promotion module suggestions (original)
export const promotionSuggestions: Record<string, SuggestionTemplate[]> = {
  "top": [
    { text: "Top {n} promotions by ROI", icon: TrendingUp, variation: "roi" },
    { text: "Top {n} promotions by margin", icon: BarChart3, variation: "margin" },
    { text: "Top {n} promotions by lift", icon: TrendingUp, variation: "lift" },
    { text: "Top {n} promotions this month", icon: Calendar, variation: "month" },
    { text: "Top {n} promotions this quarter", icon: Calendar, variation: "quarter" },
    { text: "Top {n} promotions by category", icon: Package, variation: "category" },
    { text: "Top {n} promotions by region", icon: MapPin, variation: "region" },
  ],
  "show": [
    { text: "Show me top performing promotions", icon: TrendingUp, variation: "performance" },
    { text: "Show me promotions by month", icon: Calendar, variation: "month" },
    { text: "Show me ROI trends over time", icon: TrendingUp, variation: "trends" },
    { text: "Show me underperforming promotions", icon: Target, variation: "risk" },
  ],
  "which": [
    { text: "Which promotions have best ROI?", icon: TrendingUp, variation: "roi" },
    { text: "Which promotions are losing money?", icon: Target, variation: "risk" },
    { text: "Which categories perform best?", icon: Package, variation: "category" },
    { text: "Which promotion types work best?", icon: BarChart3, variation: "type" },
  ],
  "what": [
    { text: "What's our overall ROI this month?", icon: TrendingUp, variation: "roi" },
    { text: "What's driving ROI performance?", icon: Target, variation: "drivers" },
    { text: "What promotions should we run next?", icon: Sparkles, variation: "recommend" },
    { text: "What's the optimal discount depth?", icon: BarChart3, variation: "optimize" },
  ],
  "how": [
    { text: "How is Dairy performing?", icon: Package, variation: "dairy" },
    { text: "How effective are BOGO promotions?", icon: BarChart3, variation: "bogo" },
    { text: "How are customer segments responding?", icon: Users, variation: "segment" },
  ],
  "compare": [
    { text: "Compare promotions by category", icon: Package, variation: "category" },
    { text: "Compare BOGO vs percent off", icon: BarChart3, variation: "type" },
    { text: "Compare Q1 vs Q2 performance", icon: Calendar, variation: "quarter" },
  ],
  "forecast": [
    { text: "Forecast next month's ROI", icon: Clock, variation: "month" },
    { text: "Forecast sales for upcoming promotions", icon: TrendingUp, variation: "sales" },
    { text: "Forecast customer response rate", icon: Users, variation: "customer" },
  ],
};

export const getSuggestionsByModule = (moduleId: string): Record<string, SuggestionTemplate[]> => {
  switch (moduleId) {
    case 'executive': return executiveSuggestions;
    case 'pricing': return pricingSuggestions;
    case 'supply-chain': return supplyChainSuggestions;
    case 'demand': return demandSuggestions;
    case 'assortment': return assortmentSuggestions;
    case 'space': return spaceSuggestions;
    case 'promotion': return promotionSuggestions;
    default: return promotionSuggestions;
  }
};

// Module-specific chat greetings and quick starts
export interface ModuleChatContent {
  greeting: string;
  capabilities: string[];
  quickStarts: Array<{ text: string; icon: any; tag: string }>;
  placeholder: string;
}

export const moduleChatContent: Record<string, ModuleChatContent> = {
  executive: {
    greeting: "Welcome to Executive Insights! I provide strategic 360-degree visibility across all merchandising functions with full drill-down from enterprise to SKU level. Ask about revenue, margins, market share, competitive positioning, or any strategic KPI.",
    capabilities: [
      "I analyze cross-functional business health: revenue, margins, EBITDA, working capital, ROA",
      "Strategic insights across pricing, promotions, demand, supply chain, and space planning",
      "Drill from enterprise → region → store → category → brand → SKU",
      "Simulate strategic scenarios and assess cross-functional business impacts"
    ],
    quickStarts: [
      { text: "What is overall merchandising performance this quarter vs last year?", icon: BarChart3, tag: "PERFORMANCE" },
      { text: "What is our margin performance vs budget by category?", icon: DollarSign, tag: "MARGIN" },
      { text: "What are the top 10 categories by revenue contribution?", icon: TrendingUp, tag: "REVENUE" },
      { text: "How does our pricing compare to key competitors across categories?", icon: Target, tag: "COMPETITIVE" },
      { text: "What is the executive summary of merchandising health metrics?", icon: Crown, tag: "HEALTH" },
      { text: "Show me worst performing categories and their root causes", icon: Target, tag: "RISK" },
    ],
    placeholder: "Ask strategic C-suite questions: revenue, margins, competitive position, category performance, business health..."
  },
  pricing: {
    greeting: "Welcome! Let's optimize your pricing strategy - I can analyze margins, price elasticity, and competitive positioning.",
    capabilities: [
      "I can analyze price elasticity, competitive gaps, and margin opportunities",
      "Ask me about optimal price points, markdown strategies, or competitor positioning"
    ],
    quickStarts: [
      { text: "What's the optimal price for top sellers?", icon: Target, tag: "OPTIMIZE" },
      { text: "Price elasticity by product category", icon: TrendingUp, tag: "ELASTICITY" },
      { text: "Competitive positioning vs Walmart", icon: BarChart3, tag: "COMPARE" },
      { text: "Which products have highest margin?", icon: DollarSign, tag: "MARGIN" },
    ],
    placeholder: "Ask about pricing, margins, elasticity, competitors..."
  },
  "supply-chain": {
    greeting: "Welcome! Let's optimize your supply chain - I can analyze supplier performance, lead times, and logistics efficiency.",
    capabilities: [
      "I can analyze supplier performance, lead times, and logistics efficiency",
      "Ask me about delivery rates, route optimization, or inventory availability"
    ],
    quickStarts: [
      { text: "Which suppliers have best delivery performance?", icon: Truck, tag: "DELIVERY" },
      { text: "Average lead time by product category", icon: Clock, tag: "LEAD-TIME" },
      { text: "How can we optimize distribution routes?", icon: Route, tag: "OPTIMIZE" },
      { text: "Logistics cost breakdown analysis", icon: DollarSign, tag: "COST" },
    ],
    placeholder: "Ask about suppliers, lead times, logistics, routes..."
  },
  demand: {
    greeting: "Welcome! Let's optimize your demand forecasting - I can analyze predictions, accuracy, and inventory levels.",
    capabilities: [
      "I can analyze demand patterns, forecast accuracy, and inventory levels",
      "Ask me about stockout risks, seasonal patterns, or reorder points"
    ],
    quickStarts: [
      { text: "Demand forecast for next 4 weeks", icon: Clock, tag: "FORECAST" },
      { text: "Which products are at stockout risk?", icon: Target, tag: "RISK" },
      { text: "Forecast accuracy by category", icon: TrendingUp, tag: "ACCURACY" },
      { text: "Seasonal demand patterns analysis", icon: Calendar, tag: "SEASONAL" },
    ],
    placeholder: "Ask about forecasts, inventory, stockouts, seasonality..."
  },
  assortment: {
    greeting: "Welcome! Let's optimize your product assortment - I can analyze SKU performance, category gaps, and brand mix.",
    capabilities: [
      "I can analyze SKU performance, category penetration, and brand mix",
      "Ask me about new products, discontinuation candidates, or assortment depth"
    ],
    quickStarts: [
      { text: "Which SKUs should be added to assortment?", icon: ShoppingCart, tag: "EXPAND" },
      { text: "Bottom-performing SKUs to discontinue", icon: Target, tag: "RATIONALIZE" },
      { text: "Optimal brand mix by category", icon: Package, tag: "BRAND-MIX" },
      { text: "New product performance analysis", icon: TrendingUp, tag: "PERFORMANCE" },
    ],
    placeholder: "Ask about SKUs, categories, brands, assortment depth..."
  },
  space: {
    greeting: "Welcome to Space Planning Intelligence! I can help optimize your shelf allocation, planogram compliance, fixture utilization, and store layouts to maximize sales per square foot.",
    capabilities: [
      "I can analyze sales/sqft, GMROI by position, planogram compliance, and fixture performance",
      "Ask about optimal facings, eye-level placement, endcap strategy, or cross-sell adjacencies",
      "I can simulate shelf space changes and forecast impact on category performance"
    ],
    quickStarts: [
      { text: "Categories with highest sales per sqft", icon: DollarSign, tag: "SALES/SQFT" },
      { text: "Eye-level placement impact on sales", icon: Target, tag: "EYE-LEVEL" },
      { text: "Planogram compliance by store", icon: Target, tag: "COMPLIANCE" },
      { text: "Optimal shelf space allocation", icon: Grid3X3, tag: "ALLOCATE" },
      { text: "Endcap display performance", icon: TrendingUp, tag: "ENDCAP" },
      { text: "Cross-sell adjacency opportunities", icon: ShoppingCart, tag: "CROSS-SELL" },
    ],
    placeholder: "Ask about shelf space, planograms, eye-level, endcaps, fixtures, adjacencies..."
  },
  promotion: {
    greeting: "Welcome! Let's analyze your promotion performance - I can help with ROI, lift, and optimization.",
    capabilities: [
      "I can analyze promotion ROI, lift, and margin impact",
      "Ask me about top performers, underperforming campaigns, or optimization opportunities"
    ],
    quickStarts: [
      { text: "Top promotions by ROI this month", icon: TrendingUp, tag: "WINNERS" },
      { text: "Which promotions are losing money?", icon: Target, tag: "RISK" },
      { text: "Compare Dairy vs Beverages ROI", icon: BarChart3, tag: "COMPARE" },
      { text: "Optimal discount depth for Snacks", icon: DollarSign, tag: "OPTIMIZE" },
    ],
    placeholder: "Ask about promotions, ROI, lift, margins..."
  }
};

export const getModuleChatContent = (moduleId: string): ModuleChatContent => {
  return moduleChatContent[moduleId] || moduleChatContent.promotion;
};
