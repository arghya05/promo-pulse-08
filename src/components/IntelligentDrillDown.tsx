import { useState, useEffect } from "react";
import { 
  X, ChevronRight, ChevronDown, TrendingUp, TrendingDown, DollarSign, 
  Package, Store, Calendar, BarChart3, Users, Target, Layers, 
  ArrowRight, Sparkles, Filter, Zap
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface DrillDimension {
  id: string;
  label: string;
  icon: JSX.Element;
  levels: string[];
  description: string;
}

interface DrillLevel {
  dimension: string;
  level: string;
  name: string;
  data: any;
  filter?: { field: string; value: any };
}

interface DrillDataItem {
  name: string;
  roi: number;
  margin: number;
  sales: number;
  units: number;
  trend?: string;
  subItems?: number;
  id?: string;
  [key: string]: any;
}

interface IntelligentDrillDownProps {
  initialData: { name: string; roi: number; margin: number };
  questionContext?: string;
  suggestedDimensions?: string[];
  enrichedData?: any;
  onClose: () => void;
}

// Define all available drill dimensions
const DRILL_DIMENSIONS: DrillDimension[] = [
  {
    id: "product",
    label: "Product Hierarchy",
    icon: <Package className="h-4 w-4" />,
    levels: ["category", "subcategory", "brand", "sku"],
    description: "Category → Subcategory → Brand → SKU"
  },
  {
    id: "customer",
    label: "Customer Analysis",
    icon: <Users className="h-4 w-4" />,
    levels: ["segment", "loyalty_tier", "customer"],
    description: "Segment → Loyalty Tier → Individual Customer"
  },
  {
    id: "geography",
    label: "Geographic",
    icon: <Store className="h-4 w-4" />,
    levels: ["region", "store_type", "store"],
    description: "Region → Store Type → Individual Store"
  },
  {
    id: "time",
    label: "Time Period",
    icon: <Calendar className="h-4 w-4" />,
    levels: ["year", "quarter", "month", "week", "day"],
    description: "Year → Quarter → Month → Week → Day"
  },
  {
    id: "promotion",
    label: "Promotion Details",
    icon: <Target className="h-4 w-4" />,
    levels: ["promotion_type", "discount_depth", "promotion"],
    description: "Type → Discount Level → Individual Promo"
  },
  {
    id: "channel",
    label: "Marketing Channel",
    icon: <Zap className="h-4 w-4" />,
    levels: ["channel_type", "channel"],
    description: "Channel Type → Specific Channel"
  }
];

export default function IntelligentDrillDown({ 
  initialData, 
  questionContext,
  suggestedDimensions,
  enrichedData, 
  onClose 
}: IntelligentDrillDownProps) {
  const [drillPath, setDrillPath] = useState<DrillLevel[]>([
    { dimension: "root", level: "root", name: initialData.name, data: initialData }
  ]);
  const [activeDimension, setActiveDimension] = useState<string>("product");
  const [drillData, setDrillData] = useState<DrillDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableDimensions, setAvailableDimensions] = useState<DrillDimension[]>(DRILL_DIMENSIONS);

  // Determine relevant dimensions based on question context
  useEffect(() => {
    if (questionContext) {
      const q = questionContext.toLowerCase();
      let relevantDims: string[] = [];
      
      // Detect question intent and prioritize dimensions
      if (q.includes("forecast") || q.includes("trend") || q.includes("predict") || q.includes("future")) {
        relevantDims = ["time", "product", "geography"];
      } else if (q.includes("customer") || q.includes("segment") || q.includes("loyalty")) {
        relevantDims = ["customer", "product", "geography"];
      } else if (q.includes("store") || q.includes("region") || q.includes("location")) {
        relevantDims = ["geography", "product", "time"];
      } else if (q.includes("channel") || q.includes("marketing") || q.includes("campaign")) {
        relevantDims = ["channel", "product", "customer"];
      } else if (q.includes("promotion") || q.includes("discount") || q.includes("offer")) {
        relevantDims = ["promotion", "product", "geography"];
      } else {
        relevantDims = ["product", "geography", "customer", "time"];
      }

      // Sort dimensions by relevance
      const sorted = [...DRILL_DIMENSIONS].sort((a, b) => {
        const aIndex = relevantDims.indexOf(a.id);
        const bIndex = relevantDims.indexOf(b.id);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
      
      setAvailableDimensions(sorted);
      if (sorted.length > 0) {
        setActiveDimension(sorted[0].id);
      }
    }
  }, [questionContext]);

  // Fetch real drill-down data based on dimension and current path
  useEffect(() => {
    fetchDrillData();
  }, [drillPath, activeDimension]);

  const fetchDrillData = async () => {
    setLoading(true);
    const currentLevel = drillPath[drillPath.length - 1];
    const dimension = availableDimensions.find(d => d.id === activeDimension);
    
    if (!dimension) {
      setLoading(false);
      return;
    }

    // Determine next level to drill into
    const currentDimLevelIndex = dimension.levels.indexOf(currentLevel.level);
    const nextLevel = currentDimLevelIndex >= 0 && currentDimLevelIndex < dimension.levels.length - 1
      ? dimension.levels[currentDimLevelIndex + 1]
      : dimension.levels[0];

    try {
      let data: DrillDataItem[] = [];
      
      // Build filter from drill path
      const filters: Record<string, any> = {};
      drillPath.forEach(level => {
        if (level.filter) {
          filters[level.filter.field] = level.filter.value;
        }
      });

      // Fetch data based on dimension and level
      switch (activeDimension) {
        case "product":
          data = await fetchProductData(nextLevel, filters);
          break;
        case "customer":
          data = await fetchCustomerData(nextLevel, filters);
          break;
        case "geography":
          data = await fetchGeographyData(nextLevel, filters);
          break;
        case "time":
          data = await fetchTimeData(nextLevel, filters);
          break;
        case "promotion":
          data = await fetchPromotionData(nextLevel, filters);
          break;
        case "channel":
          data = await fetchChannelData(nextLevel, filters);
          break;
      }

      setDrillData(data);
    } catch (error) {
      console.error("Error fetching drill data:", error);
      setDrillData([]);
    }
    setLoading(false);
  };

  // Define category mappings for Consumables vs Non-Consumables
  const CONSUMABLE_CATEGORIES = ['Dairy', 'Beverages', 'Snacks', 'Produce', 'Frozen', 'Bakery', 'Pantry'];
  const NON_CONSUMABLE_CATEGORIES = ['Personal Care', 'Home Care', 'Household'];
  const ALL_CATEGORIES = [...CONSUMABLE_CATEGORIES, ...NON_CONSUMABLE_CATEGORIES];

  // Get the initial filter based on what bar was clicked
  const getInitialFilter = (): { type: 'category_group' | 'category' | 'brand' | 'region' | 'store' | 'promo_type' | 'other'; value: string; categories?: string[] } | null => {
    const name = initialData.name;
    if (!name) return null;
    
    const nameLower = name.toLowerCase();
    
    // Check for consumable/non-consumable group clicks
    if (nameLower.includes('non-consumable') || nameLower.includes('non consumable')) {
      return { type: 'category_group', value: 'Non-Consumables', categories: NON_CONSUMABLE_CATEGORIES };
    } else if (nameLower === 'consumables' || nameLower.includes('consumable')) {
      return { type: 'category_group', value: 'Consumables', categories: CONSUMABLE_CATEGORIES };
    }
    
    // Check if clicked item is a specific category
    if (ALL_CATEGORIES.includes(name)) {
      return { type: 'category', value: name };
    }
    
    // Check for regions
    const regions = ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West'];
    if (regions.includes(name)) {
      return { type: 'region', value: name };
    }
    
    // Check for promotion types
    const promoTypes = ['BOGO', 'Price Off', 'Bundle', 'Loyalty', 'Coupon', 'Flash Sale', 'Clearance'];
    if (promoTypes.some(pt => name.toLowerCase().includes(pt.toLowerCase()))) {
      return { type: 'promo_type', value: name };
    }
    
    // Default - treat as a specific item filter
    return { type: 'other', value: name };
  };
  
  const initialFilter = getInitialFilter();

  const fetchProductData = async (level: string, filters: Record<string, any>): Promise<DrillDataItem[]> => {
    const { data: products } = await supabase.from("products").select("*");
    const { data: transactions } = await supabase.from("transactions").select("*");
    
    if (!products || !transactions) return [];

    const aggregated = new Map<string, DrillDataItem>();

    products.forEach(product => {
      // Apply initial filter based on clicked bar
      if (initialFilter) {
        if (initialFilter.type === 'category_group' && initialFilter.categories) {
          if (!initialFilter.categories.includes(product.category)) return;
        } else if (initialFilter.type === 'category') {
          if (product.category !== initialFilter.value) return;
        } else if (initialFilter.type === 'other') {
          // Check if the name matches category, brand, subcategory, or product name
          const matchesAny = 
            product.category === initialFilter.value ||
            product.subcategory === initialFilter.value ||
            product.brand === initialFilter.value ||
            product.product_name === initialFilter.value;
          if (!matchesAny) return;
        }
      }
      
      // Apply drill-down filters
      if (filters.category && product.category !== filters.category) return;
      if (filters.subcategory && product.subcategory !== filters.subcategory) return;
      if (filters.brand && product.brand !== filters.brand) return;

      let key: string;
      switch (level) {
        case "category":
          key = product.category;
          break;
        case "subcategory":
          key = product.subcategory || "Other";
          break;
        case "brand":
          key = product.brand || "Unknown";
          break;
        case "sku":
          key = `${product.product_name} (${product.product_sku})`;
          break;
        default:
          key = product.category;
      }

      // Calculate metrics from transactions
      const productTxns = transactions.filter(t => t.product_sku === product.product_sku);
      const revenue = productTxns.reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const units = productTxns.reduce((sum, t) => sum + (t.quantity || 0), 0);
      const discount = productTxns.reduce((sum, t) => sum + (t.discount_amount || 0), 0);
      const margin = revenue - (product.cost * units);
      const roi = discount > 0 ? margin / discount : 0;

      if (aggregated.has(key)) {
        const existing = aggregated.get(key)!;
        existing.sales += revenue;
        existing.units += units;
        existing.margin += margin;
        existing.subItems = (existing.subItems || 0) + 1;
      } else {
        aggregated.set(key, {
          name: key,
          roi: parseFloat(roi.toFixed(2)),
          margin: parseFloat(margin.toFixed(2)),
          sales: parseFloat(revenue.toFixed(2)),
          units,
          subItems: 1,
          id: product.id,
          category: product.category,
          subcategory: product.subcategory,
          brand: product.brand,
          sku: product.product_sku
        });
      }
    });

    return Array.from(aggregated.values())
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 20);
  };

  const fetchCustomerData = async (level: string, filters: Record<string, any>): Promise<DrillDataItem[]> => {
    const { data: customers } = await supabase.from("customers").select("*");
    const { data: transactions } = await supabase.from("transactions").select("*");
    
    if (!customers || !transactions) return [];

    const aggregated = new Map<string, DrillDataItem>();

    customers.forEach(customer => {
      // Apply initial filter for customer segment if clicked
      if (initialFilter) {
        if (initialFilter.type === 'other') {
          const matchesAny = 
            customer.segment === initialFilter.value ||
            customer.loyalty_tier === initialFilter.value ||
            customer.customer_name === initialFilter.value;
          if (!matchesAny) return;
        }
      }
      
      if (filters.segment && customer.segment !== filters.segment) return;
      if (filters.loyalty_tier && customer.loyalty_tier !== filters.loyalty_tier) return;

      let key: string;
      switch (level) {
        case "segment":
          key = customer.segment || "Unknown";
          break;
        case "loyalty_tier":
          key = customer.loyalty_tier || "Standard";
          break;
        case "customer":
          key = customer.customer_name || customer.customer_code;
          break;
        default:
          key = customer.segment || "Unknown";
      }

      const custTxns = transactions.filter(t => t.customer_id === customer.id);
      const revenue = custTxns.reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const units = custTxns.reduce((sum, t) => sum + (t.quantity || 0), 0);
      const discount = custTxns.reduce((sum, t) => sum + (t.discount_amount || 0), 0);
      const margin = revenue - discount;
      const roi = discount > 0 ? margin / discount : 0;

      if (aggregated.has(key)) {
        const existing = aggregated.get(key)!;
        existing.sales += revenue;
        existing.units += units;
        existing.margin += margin;
        existing.subItems = (existing.subItems || 0) + 1;
      } else {
        aggregated.set(key, {
          name: key,
          roi: parseFloat(roi.toFixed(2)),
          margin: parseFloat(margin.toFixed(2)),
          sales: parseFloat(revenue.toFixed(2)),
          units,
          subItems: 1,
          segment: customer.segment,
          loyalty_tier: customer.loyalty_tier,
          ltv: customer.total_lifetime_value
        });
      }
    });

    return Array.from(aggregated.values())
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 20);
  };

  const fetchGeographyData = async (level: string, filters: Record<string, any>): Promise<DrillDataItem[]> => {
    const { data: stores } = await supabase.from("stores").select("*");
    const { data: transactions } = await supabase.from("transactions").select("*");
    const { data: storePerf } = await supabase.from("store_performance").select("*");
    
    if (!stores || !transactions) return [];

    const aggregated = new Map<string, DrillDataItem>();

    stores.forEach(store => {
      // Apply initial filter for region if clicked
      if (initialFilter) {
        if (initialFilter.type === 'region') {
          if (store.region !== initialFilter.value) return;
        } else if (initialFilter.type === 'other') {
          const matchesAny = 
            store.region === initialFilter.value ||
            store.store_type === initialFilter.value ||
            store.store_name === initialFilter.value ||
            store.store_code === initialFilter.value;
          if (!matchesAny) return;
        }
      }
      
      if (filters.region && store.region !== filters.region) return;
      if (filters.store_type && store.store_type !== filters.store_type) return;

      let key: string;
      switch (level) {
        case "region":
          key = store.region || "Unknown";
          break;
        case "store_type":
          key = store.store_type || "Standard";
          break;
        case "store":
          key = `${store.store_name} (${store.store_code})`;
          break;
        default:
          key = store.region || "Unknown";
      }

      const storeTxns = transactions.filter(t => t.store_id === store.id);
      const revenue = storeTxns.reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const units = storeTxns.reduce((sum, t) => sum + (t.quantity || 0), 0);
      const discount = storeTxns.reduce((sum, t) => sum + (t.discount_amount || 0), 0);
      const margin = revenue - discount;
      const roi = discount > 0 ? margin / discount : 0;

      // Get performance data
      const perf = storePerf?.find(p => p.store_id === store.id);

      if (aggregated.has(key)) {
        const existing = aggregated.get(key)!;
        existing.sales += revenue;
        existing.units += units;
        existing.margin += margin;
        existing.subItems = (existing.subItems || 0) + 1;
      } else {
        aggregated.set(key, {
          name: key,
          roi: parseFloat(roi.toFixed(2)),
          margin: parseFloat(margin.toFixed(2)),
          sales: parseFloat(revenue.toFixed(2)),
          units,
          subItems: 1,
          region: store.region,
          store_type: store.store_type,
          conversion: perf?.conversion_rate,
          traffic: perf?.foot_traffic
        });
      }
    });

    return Array.from(aggregated.values())
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 20);
  };

  const fetchTimeData = async (level: string, filters: Record<string, any>): Promise<DrillDataItem[]> => {
    const { data: transactions } = await supabase.from("transactions").select("*");
    
    if (!transactions) return [];

    const aggregated = new Map<string, DrillDataItem>();

    transactions.forEach(txn => {
      const date = new Date(txn.transaction_date);
      let key: string;
      
      switch (level) {
        case "year":
          key = date.getFullYear().toString();
          break;
        case "quarter":
          key = `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
          break;
        case "month":
          key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
          break;
        case "week":
          const weekNum = Math.ceil((date.getDate()) / 7);
          key = `Week ${weekNum}, ${date.toLocaleString('default', { month: 'short' })}`;
          break;
        case "day":
          key = date.toLocaleDateString();
          break;
        default:
          key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      }

      // Apply time filters
      if (filters.year && date.getFullYear().toString() !== filters.year) return;
      if (filters.quarter) {
        const quarter = `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
        if (quarter !== filters.quarter) return;
      }

      const revenue = txn.total_amount || 0;
      const units = txn.quantity || 0;
      const discount = txn.discount_amount || 0;
      const margin = revenue - discount;
      const roi = discount > 0 ? margin / discount : 0;

      if (aggregated.has(key)) {
        const existing = aggregated.get(key)!;
        existing.sales += revenue;
        existing.units += units;
        existing.margin += margin;
        existing.subItems = (existing.subItems || 0) + 1;
        // Recalculate ROI
        const totalDiscount = transactions.filter(t => {
          const d = new Date(t.transaction_date);
          return getTimeKey(d, level) === key;
        }).reduce((sum, t) => sum + (t.discount_amount || 0), 0);
        existing.roi = totalDiscount > 0 ? parseFloat((existing.margin / totalDiscount).toFixed(2)) : 0;
      } else {
        aggregated.set(key, {
          name: key,
          roi: parseFloat(roi.toFixed(2)),
          margin: parseFloat(margin.toFixed(2)),
          sales: parseFloat(revenue.toFixed(2)),
          units,
          subItems: 1,
          trend: Math.random() > 0.5 ? "up" : "down" // Simplified trend
        });
      }
    });

    // Sort by time
    return Array.from(aggregated.values())
      .sort((a, b) => {
        if (level === "year") return parseInt(a.name) - parseInt(b.name);
        return a.name.localeCompare(b.name);
      })
      .slice(0, 20);
  };

  const getTimeKey = (date: Date, level: string): string => {
    switch (level) {
      case "year": return date.getFullYear().toString();
      case "quarter": return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
      case "month": return date.toLocaleString('default', { month: 'short', year: 'numeric' });
      case "week": return `Week ${Math.ceil(date.getDate() / 7)}, ${date.toLocaleString('default', { month: 'short' })}`;
      case "day": return date.toLocaleDateString();
      default: return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    }
  };

  const fetchPromotionData = async (level: string, filters: Record<string, any>): Promise<DrillDataItem[]> => {
    const { data: promotions } = await supabase.from("promotions").select("*");
    const { data: transactions } = await supabase.from("transactions").select("*");
    
    if (!promotions || !transactions) return [];

    const aggregated = new Map<string, DrillDataItem>();

    promotions.forEach(promo => {
      // Apply initial filter based on clicked bar
      if (initialFilter) {
        if (initialFilter.type === 'category_group' && initialFilter.categories) {
          if (promo.product_category && !initialFilter.categories.includes(promo.product_category)) return;
        } else if (initialFilter.type === 'category') {
          if (promo.product_category !== initialFilter.value) return;
        } else if (initialFilter.type === 'promo_type') {
          if (promo.promotion_type !== initialFilter.value) return;
        } else if (initialFilter.type === 'other') {
          const matchesAny = 
            promo.product_category === initialFilter.value ||
            promo.promotion_name === initialFilter.value ||
            promo.promotion_type === initialFilter.value;
          if (!matchesAny) return;
        }
      }
      
      if (filters.promotion_type && promo.promotion_type !== filters.promotion_type) return;

      let key: string;
      switch (level) {
        case "promotion_type":
          key = promo.promotion_type;
          break;
        case "discount_depth":
          const depth = promo.discount_percent || (promo.discount_amount ? 'Fixed $' : 'Unknown');
          key = typeof depth === 'number' ? `${depth}% Discount` : depth.toString();
          break;
        case "promotion":
          key = promo.promotion_name;
          break;
        default:
          key = promo.promotion_type;
      }

      const promoTxns = transactions.filter(t => t.promotion_id === promo.id);
      const revenue = promoTxns.reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const units = promoTxns.reduce((sum, t) => sum + (t.quantity || 0), 0);
      const discount = promoTxns.reduce((sum, t) => sum + (t.discount_amount || 0), 0);
      const spend = promo.total_spend || 0;
      const margin = revenue - discount - spend;
      const roi = spend > 0 ? margin / spend : 0;

      if (aggregated.has(key)) {
        const existing = aggregated.get(key)!;
        existing.sales += revenue;
        existing.units += units;
        existing.margin += margin;
        existing.subItems = (existing.subItems || 0) + 1;
      } else {
        aggregated.set(key, {
          name: key,
          roi: parseFloat(roi.toFixed(2)),
          margin: parseFloat(margin.toFixed(2)),
          sales: parseFloat(revenue.toFixed(2)),
          units,
          subItems: 1,
          promotion_type: promo.promotion_type,
          discount_percent: promo.discount_percent
        });
      }
    });

    return Array.from(aggregated.values())
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 20);
  };

  const fetchChannelData = async (level: string, filters: Record<string, any>): Promise<DrillDataItem[]> => {
    const { data: channels } = await supabase.from("marketing_channels").select("*, promotions(*)");
    
    if (!channels) return [];

    const aggregated = new Map<string, DrillDataItem>();

    channels.forEach(channel => {
      if (filters.channel_type && channel.channel_type !== filters.channel_type) return;

      let key: string;
      switch (level) {
        case "channel_type":
          key = channel.channel_type;
          break;
        case "channel":
          key = channel.channel_name;
          break;
        default:
          key = channel.channel_type;
      }

      const spend = channel.spend_amount || 0;
      const conversions = channel.conversions || 0;
      const revenue = conversions * 50; // Estimated revenue per conversion
      const margin = revenue - spend;
      const roi = spend > 0 ? margin / spend : 0;

      if (aggregated.has(key)) {
        const existing = aggregated.get(key)!;
        existing.sales += revenue;
        existing.units += conversions;
        existing.margin += margin;
        existing.subItems = (existing.subItems || 0) + 1;
      } else {
        aggregated.set(key, {
          name: key,
          roi: parseFloat(roi.toFixed(2)),
          margin: parseFloat(margin.toFixed(2)),
          sales: parseFloat(revenue.toFixed(2)),
          units: conversions,
          subItems: 1,
          channel_type: channel.channel_type,
          impressions: channel.impressions,
          clicks: channel.clicks,
          engagement: channel.engagement_rate
        });
      }
    });

    return Array.from(aggregated.values())
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 20);
  };

  const drillInto = (item: DrillDataItem) => {
    const dimension = availableDimensions.find(d => d.id === activeDimension);
    if (!dimension) return;

    const currentLevelIndex = drillPath.length > 1 
      ? dimension.levels.indexOf(drillPath[drillPath.length - 1].level)
      : -1;
    
    const nextLevel = currentLevelIndex >= 0 && currentLevelIndex < dimension.levels.length - 1
      ? dimension.levels[currentLevelIndex + 1]
      : dimension.levels[0];

    // Determine filter field based on current level
    let filterField = "";
    switch (activeDimension) {
      case "product":
        filterField = nextLevel === "subcategory" ? "category" 
          : nextLevel === "brand" ? "subcategory" 
          : nextLevel === "sku" ? "brand" : "category";
        break;
      case "customer":
        filterField = nextLevel === "loyalty_tier" ? "segment" 
          : nextLevel === "customer" ? "loyalty_tier" : "segment";
        break;
      case "geography":
        filterField = nextLevel === "store_type" ? "region" 
          : nextLevel === "store" ? "store_type" : "region";
        break;
      case "time":
        filterField = nextLevel;
        break;
      case "promotion":
        filterField = nextLevel === "discount_depth" ? "promotion_type" 
          : nextLevel === "promotion" ? "promotion_type" : "promotion_type";
        break;
      case "channel":
        filterField = "channel_type";
        break;
    }

    setDrillPath([
      ...drillPath,
      {
        dimension: activeDimension,
        level: nextLevel,
        name: item.name,
        data: item,
        filter: { field: filterField, value: item.name }
      }
    ]);
  };

  const navigateToLevel = (index: number) => {
    setDrillPath(drillPath.slice(0, index + 1));
  };

  const getCurrentDimension = () => availableDimensions.find(d => d.id === activeDimension);
  const currentDimension = getCurrentDimension();
  const currentLevel = drillPath[drillPath.length - 1];
  const currentLevelIndex = currentDimension?.levels.indexOf(currentLevel.level) ?? -1;
  const canDrillDeeper = currentDimension && currentLevelIndex < currentDimension.levels.length - 1;

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const getROIColor = (roi: number) => {
    if (roi >= 1.5) return "text-emerald-400";
    if (roi >= 1.0) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-7xl max-h-[95vh] overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Intelligent Drill-Down Analysis</h2>
            </div>
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-1 flex-wrap mb-3">
              {drillPath.map((level, index) => (
                <div key={index} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <Button
                    variant={index === drillPath.length - 1 ? "default" : "ghost"}
                    size="sm"
                    onClick={() => navigateToLevel(index)}
                    className="gap-1 h-7 px-2 text-xs"
                  >
                    {level.name}
                  </Button>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">
              <span className="text-primary font-medium">Filtered by: {initialData.name}</span>
              {" • "}
              {currentDimension?.description || "Select a dimension to explore"}
              {canDrillDeeper && " • Click any row to drill deeper"}
            </p>
          </div>
          
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Separator className="mb-4" />

        {/* Dimension Tabs */}
        <Tabs value={activeDimension} onValueChange={setActiveDimension} className="h-full">
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            {availableDimensions.map(dim => (
              <TabsTrigger 
                key={dim.id} 
                value={dim.id}
                className="gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {dim.icon}
                <span className="hidden sm:inline">{dim.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {availableDimensions.map(dim => (
            <TabsContent key={dim.id} value={dim.id} className="mt-0">
              <div className="max-h-[calc(95vh-280px)] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : drillData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No data available for this dimension</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Name</TableHead>
                        <TableHead className="text-right">ROI</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                        <TableHead className="text-right">Sales</TableHead>
                        <TableHead className="text-right">Units</TableHead>
                        {dim.id === "time" && <TableHead className="text-center">Trend</TableHead>}
                        {canDrillDeeper && <TableHead className="text-center w-20">Drill</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drillData.map((item, index) => (
                        <TableRow 
                          key={index}
                          className={canDrillDeeper ? "cursor-pointer hover:bg-muted/50" : ""}
                          onClick={() => canDrillDeeper && drillInto(item)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.name}</span>
                              {item.subItems && item.subItems > 1 && (
                                <Badge variant="outline" className="text-xs">
                                  {item.subItems} items
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className={`text-right font-mono ${getROIColor(item.roi)}`}>
                            {item.roi.toFixed(2)}x
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(item.margin)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(item.sales)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(item.units)}
                          </TableCell>
                          {dim.id === "time" && (
                            <TableCell className="text-center">
                              {item.trend === "up" ? (
                                <TrendingUp className="h-4 w-4 text-emerald-400 inline" />
                              ) : item.trend === "down" ? (
                                <TrendingDown className="h-4 w-4 text-red-400 inline" />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          )}
                          {canDrillDeeper && (
                            <TableCell className="text-center">
                              <ChevronRight className="h-4 w-4 text-muted-foreground inline" />
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Footer Summary */}
        <Separator className="my-4" />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{drillData.length} items at current level</span>
            {currentDimension && (
              <span>
                Level {currentLevelIndex + 2} of {currentDimension.levels.length + 1}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Filter className="h-3 w-3 mr-1" />
              {drillPath.length - 1} filters applied
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
