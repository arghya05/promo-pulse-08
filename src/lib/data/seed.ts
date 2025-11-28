// Seeded grocery promotion data - ~$4M annual revenue, 5 stores, 50 SKUs, 26 weeks

export interface Product {
  id: number;
  upc: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price_regular: number;
  cost: number;
  margin_target_pct: number;
}

export interface Store {
  id: number;
  name: string;
  region: string;
  size_sqft: number;
  affluence_index: number;
}

export interface Promotion {
  id: number;
  productId: number;
  storeId: number;
  start_date: string;
  end_date: string;
  promo_type: string;
  depth_pct: number;
  vendor_funding_pct: number;
  feature: boolean;
  display: boolean;
  coupon: boolean;
  mechanics_json: any;
}

export interface SalesFact {
  id: number;
  date: string;
  productId: number;
  storeId: number;
  units: number;
  net_sales: number;
  promo_flag: boolean;
  promo_id: number | null;
}

export interface Elasticity {
  productId: number;
  own_price_elast: number;
  promo_elast: number;
  display_uplift_pct: number;
  feature_uplift_pct: number;
}

export interface HaloCannibal {
  productId: number;
  halo_productId: number | null;
  halo_uplift_pct: number;
  cannibal_productId: number | null;
  cannibal_uplift_neg_pct: number;
}

export interface PromotionLift {
  id: number;
  promo_id: number;
  incremental_units: number;
  incremental_sales: number;
  incremental_margin: number;
  roi: number;
  spend: number;
}

export interface CouponFunnel {
  promo_id: number;
  issued: number;
  viewed: number;
  clipped: number;
  redeemed: number;
}

export const products: Product[] = [
  // Dairy (8 SKUs)
  { id: 1, upc: "001", name: "Yogurt-500g", brand: "Dannon", category: "Dairy", subcategory: "Yogurt", price_regular: 4.99, cost: 3.20, margin_target_pct: 30 },
  { id: 2, upc: "002", name: "Milk-1gal", brand: "Organic Valley", category: "Dairy", subcategory: "Milk", price_regular: 5.49, cost: 3.80, margin_target_pct: 28 },
  { id: 3, upc: "003", name: "Cheese-8oz", brand: "Kraft", category: "Dairy", subcategory: "Cheese", price_regular: 6.29, cost: 4.10, margin_target_pct: 32 },
  { id: 4, upc: "004", name: "Butter-16oz", brand: "Land O Lakes", category: "Dairy", subcategory: "Butter", price_regular: 5.79, cost: 3.90, margin_target_pct: 30 },
  { id: 5, upc: "005", name: "Cream-Cheese-8oz", brand: "Philadelphia", category: "Dairy", subcategory: "Cream Cheese", price_regular: 3.99, cost: 2.60, margin_target_pct: 31 },
  { id: 6, upc: "006", name: "Sour-Cream-16oz", brand: "Daisy", category: "Dairy", subcategory: "Sour Cream", price_regular: 3.49, cost: 2.20, margin_target_pct: 33 },
  { id: 7, upc: "007", name: "Greek-Yogurt-32oz", brand: "Chobani", category: "Dairy", subcategory: "Yogurt", price_regular: 7.99, cost: 5.20, margin_target_pct: 32 },
  { id: 8, upc: "008", name: "Cottage-Cheese-16oz", brand: "Breakstone", category: "Dairy", subcategory: "Cottage Cheese", price_regular: 4.79, cost: 3.00, margin_target_pct: 33 },
  
  // Beverages (8 SKUs)
  { id: 9, upc: "009", name: "Soda-12pk", brand: "Coca-Cola", category: "Beverages", subcategory: "Soda", price_regular: 5.99, cost: 3.50, margin_target_pct: 38 },
  { id: 10, upc: "010", name: "PL-Cola-12pk", brand: "Store Brand", category: "Beverages", subcategory: "Soda", price_regular: 3.99, cost: 2.50, margin_target_pct: 34 },
  { id: 11, upc: "011", name: "Orange-Juice-64oz", brand: "Tropicana", category: "Beverages", subcategory: "Juice", price_regular: 4.99, cost: 3.20, margin_target_pct: 33 },
  { id: 12, upc: "012", name: "Energy-Drink-4pk", brand: "Red Bull", category: "Beverages", subcategory: "Energy", price_regular: 7.49, cost: 4.80, margin_target_pct: 34 },
  { id: 13, upc: "013", name: "Bottled-Water-24pk", brand: "Aquafina", category: "Beverages", subcategory: "Water", price_regular: 5.49, cost: 3.10, margin_target_pct: 40 },
  { id: 14, upc: "014", name: "Sports-Drink-8pk", brand: "Gatorade", category: "Beverages", subcategory: "Sports", price_regular: 6.99, cost: 4.20, margin_target_pct: 37 },
  { id: 15, upc: "015", name: "Iced-Tea-1gal", brand: "Pure Leaf", category: "Beverages", subcategory: "Tea", price_regular: 3.79, cost: 2.40, margin_target_pct: 34 },
  { id: 16, upc: "016", name: "Coffee-12oz", brand: "Starbucks", category: "Beverages", subcategory: "Coffee", price_regular: 9.99, cost: 6.50, margin_target_pct: 32 },
  
  // Snacks (8 SKUs)
  { id: 17, upc: "017", name: "Potato-Chips-13oz", brand: "Lays", category: "Snacks", subcategory: "Chips", price_regular: 4.99, cost: 2.80, margin_target_pct: 40 },
  { id: 18, upc: "018", name: "Tortilla-Chips-13oz", brand: "Tostitos", category: "Snacks", subcategory: "Chips", price_regular: 4.49, cost: 2.50, margin_target_pct: 41 },
  { id: 19, upc: "019", name: "Pretzels-16oz", brand: "Snyders", category: "Snacks", subcategory: "Pretzels", price_regular: 3.99, cost: 2.20, margin_target_pct: 42 },
  { id: 20, upc: "020", name: "Cookies-14oz", brand: "Oreo", category: "Snacks", subcategory: "Cookies", price_regular: 4.79, cost: 2.90, margin_target_pct: 37 },
  { id: 21, upc: "021", name: "Crackers-12oz", brand: "Ritz", category: "Snacks", subcategory: "Crackers", price_regular: 3.99, cost: 2.30, margin_target_pct: 39 },
  { id: 22, upc: "022", name: "Granola-Bars-10ct", brand: "Nature Valley", category: "Snacks", subcategory: "Bars", price_regular: 5.49, cost: 3.40, margin_target_pct: 36 },
  { id: 23, upc: "023", name: "Trail-Mix-16oz", brand: "Planters", category: "Snacks", subcategory: "Mix", price_regular: 6.99, cost: 4.30, margin_target_pct: 36 },
  { id: 24, upc: "024", name: "Popcorn-6pk", brand: "SkinnyPop", category: "Snacks", subcategory: "Popcorn", price_regular: 5.99, cost: 3.60, margin_target_pct: 37 },

  // Produce (6 SKUs)
  { id: 25, upc: "025", name: "Bananas-3lb", brand: "Fresh", category: "Produce", subcategory: "Fruit", price_regular: 2.99, cost: 1.80, margin_target_pct: 38 },
  { id: 26, upc: "026", name: "Apples-3lb", brand: "Fresh", category: "Produce", subcategory: "Fruit", price_regular: 4.99, cost: 3.00, margin_target_pct: 37 },
  { id: 27, upc: "027", name: "Salad-Mix-10oz", brand: "Dole", category: "Produce", subcategory: "Salad", price_regular: 3.99, cost: 2.50, margin_target_pct: 35 },
  { id: 28, upc: "028", name: "Tomatoes-2lb", brand: "Fresh", category: "Produce", subcategory: "Vegetable", price_regular: 3.49, cost: 2.10, margin_target_pct: 37 },
  { id: 29, upc: "029", name: "Potatoes-5lb", brand: "Fresh", category: "Produce", subcategory: "Vegetable", price_regular: 5.49, cost: 3.30, margin_target_pct: 38 },
  { id: 30, upc: "030", name: "Carrots-2lb", brand: "Fresh", category: "Produce", subcategory: "Vegetable", price_regular: 2.99, cost: 1.70, margin_target_pct: 40 },

  // Frozen (6 SKUs)
  { id: 31, upc: "031", name: "Pizza-26oz", brand: "DiGiorno", category: "Frozen", subcategory: "Pizza", price_regular: 7.99, cost: 5.20, margin_target_pct: 32 },
  { id: 32, upc: "032", name: "Ice-Cream-48oz", brand: "Ben & Jerry's", category: "Frozen", subcategory: "Ice Cream", price_regular: 6.99, cost: 4.50, margin_target_pct: 33 },
  { id: 33, upc: "033", name: "Frozen-Vegetables-16oz", brand: "Birds Eye", category: "Frozen", subcategory: "Vegetables", price_regular: 3.49, cost: 2.10, margin_target_pct: 37 },
  { id: 34, upc: "034", name: "Frozen-Dinners-12oz", brand: "Lean Cuisine", category: "Frozen", subcategory: "Dinners", price_regular: 4.99, cost: 3.20, margin_target_pct: 34 },
  { id: 35, upc: "035", name: "Frozen-Waffles-12ct", brand: "Eggo", category: "Frozen", subcategory: "Breakfast", price_regular: 4.29, cost: 2.70, margin_target_pct: 35 },
  { id: 36, upc: "036", name: "Frozen-Fries-32oz", brand: "Ore-Ida", category: "Frozen", subcategory: "Sides", price_regular: 3.99, cost: 2.40, margin_target_pct: 37 },

  // Bakery (5 SKUs)
  { id: 37, upc: "037", name: "Bread-20oz", brand: "Wonder", category: "Bakery", subcategory: "Bread", price_regular: 2.99, cost: 1.80, margin_target_pct: 38 },
  { id: 38, upc: "038", name: "Bagels-6ct", brand: "Thomas", category: "Bakery", subcategory: "Bagels", price_regular: 3.99, cost: 2.50, margin_target_pct: 35 },
  { id: 39, upc: "039", name: "Muffins-4ct", brand: "Bake Shop", category: "Bakery", subcategory: "Muffins", price_regular: 4.99, cost: 3.10, margin_target_pct: 36 },
  { id: 40, upc: "040", name: "Croissants-6ct", brand: "Bake Shop", category: "Bakery", subcategory: "Pastries", price_regular: 5.99, cost: 3.80, margin_target_pct: 34 },
  { id: 41, upc: "041", name: "Tortillas-10ct", brand: "Mission", category: "Bakery", subcategory: "Tortillas", price_regular: 3.49, cost: 2.00, margin_target_pct: 40 },

  // Pantry (5 SKUs)
  { id: 42, upc: "042", name: "Pasta-16oz", brand: "Barilla", category: "Pantry", subcategory: "Pasta", price_regular: 2.49, cost: 1.50, margin_target_pct: 38 },
  { id: 43, upc: "043", name: "Pasta-Sauce-24oz", brand: "Prego", category: "Pantry", subcategory: "Sauce", price_regular: 3.49, cost: 2.10, margin_target_pct: 37 },
  { id: 44, upc: "044", name: "Cereal-18oz", brand: "General Mills", category: "Pantry", subcategory: "Cereal", price_regular: 4.99, cost: 3.10, margin_target_pct: 36 },
  { id: 45, upc: "045", name: "Peanut-Butter-18oz", brand: "Jif", category: "Pantry", subcategory: "Spreads", price_regular: 4.49, cost: 2.70, margin_target_pct: 37 },
  { id: 46, upc: "046", name: "Rice-32oz", brand: "Uncle Bens", category: "Pantry", subcategory: "Rice", price_regular: 5.99, cost: 3.60, margin_target_pct: 38 },

  // Household (4 SKUs)
  { id: 47, upc: "047", name: "Paper-Towels-6ct", brand: "Bounty", category: "Household", subcategory: "Paper", price_regular: 12.99, cost: 8.50, margin_target_pct: 32 },
  { id: 48, upc: "048", name: "Dish-Soap-24oz", brand: "Dawn", category: "Household", subcategory: "Cleaning", price_regular: 3.99, cost: 2.40, margin_target_pct: 38 },
  { id: 49, upc: "049", name: "Laundry-Detergent-50oz", brand: "Tide", category: "Household", subcategory: "Laundry", price_regular: 13.99, cost: 9.10, margin_target_pct: 33 },
  { id: 50, upc: "050", name: "Trash-Bags-30ct", brand: "Glad", category: "Household", subcategory: "Bags", price_regular: 11.99, cost: 7.80, margin_target_pct: 33 }
];

export const stores: Store[] = [
  { id: 1, name: "North Main", region: "North", size_sqft: 45000, affluence_index: 1.15 },
  { id: 2, name: "North Plaza", region: "North", size_sqft: 38000, affluence_index: 1.08 },
  { id: 3, name: "South Center", region: "South", size_sqft: 52000, affluence_index: 0.98 },
  { id: 4, name: "South Market", region: "South", size_sqft: 41000, affluence_index: 0.92 },
  { id: 5, name: "South Express", region: "South", size_sqft: 28000, affluence_index: 0.88 }
];

export const elasticity: Elasticity[] = products.map((p, idx) => ({
  productId: p.id,
  own_price_elast: p.category === "Beverages" ? -1.8 : p.category === "Snacks" ? -1.6 : p.category === "Dairy" ? -1.2 : -1.4,
  promo_elast: p.category === "Beverages" ? 2.2 : p.category === "Snacks" ? 2.0 : p.category === "Dairy" ? 1.5 : 1.7,
  display_uplift_pct: p.category === "Beverages" ? 12 : p.category === "Snacks" ? 10 : 7,
  feature_uplift_pct: p.category === "Beverages" ? 15 : p.category === "Snacks" ? 13 : 9
}));

export const haloCannibal: HaloCannibal[] = [
  { productId: 17, halo_productId: 9, halo_uplift_pct: 6, cannibal_productId: 18, cannibal_uplift_neg_pct: -4 },
  { productId: 9, halo_productId: 17, halo_uplift_pct: 5, cannibal_productId: 10, cannibal_uplift_neg_pct: -8 },
  { productId: 42, halo_productId: 43, halo_uplift_pct: 8, cannibal_productId: null, cannibal_uplift_neg_pct: 0 },
  { productId: 1, halo_productId: null, halo_uplift_pct: 0, cannibal_productId: 7, cannibal_uplift_neg_pct: -6 }
];

// Generate promotions - 8-12 per month, varied mechanics
function generatePromotions(): Promotion[] {
  const promos: Promotion[] = [];
  let id = 1;
  
  const promoTypes = ["price_off", "bogo", "bundle", "coupon", "display_only"];
  const depths = [10, 15, 20, 25, 30];
  
  for (let week = 1; week <= 26; week++) {
    const numPromos = Math.floor(Math.random() * 5) + 8; // 8-12 promos per week
    for (let i = 0; i < numPromos; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const store = stores[Math.floor(Math.random() * stores.length)];
      const promoType = promoTypes[Math.floor(Math.random() * promoTypes.length)];
      const depth = depths[Math.floor(Math.random() * depths.length)];
      const hasFeature = Math.random() > 0.6;
      const hasDisplay = Math.random() > 0.5;
      
      promos.push({
        id: id++,
        productId: product.id,
        storeId: store.id,
        start_date: `2024-${String(Math.floor((week - 1) / 4) + 1).padStart(2, '0')}-${String(((week - 1) % 4) * 7 + 1).padStart(2, '0')}`,
        end_date: `2024-${String(Math.floor((week - 1) / 4) + 1).padStart(2, '0')}-${String(((week - 1) % 4) * 7 + 7).padStart(2, '0')}`,
        promo_type: promoType,
        depth_pct: depth,
        vendor_funding_pct: Math.random() > 0.5 ? Math.floor(Math.random() * 40) + 20 : 0,
        feature: hasFeature,
        display: hasDisplay,
        coupon: promoType === "coupon",
        mechanics_json: { type: promoType, depth }
      });
    }
  }
  
  return promos;
}

export const promotions = generatePromotions();

// Generate promotion lifts with realistic ROI distribution
export const promotionLifts: PromotionLift[] = promotions.map((promo, idx) => {
  const product = products.find(p => p.id === promo.productId)!;
  const elast = elasticity.find(e => e.productId === promo.productId)!;
  
  const baseUnits = Math.floor(Math.random() * 200) + 100;
  const depthEffect = (promo.depth_pct / 10) * elast.promo_elast * 0.1;
  const displayBonus = promo.display ? elast.display_uplift_pct / 100 : 0;
  const featureBonus = promo.feature ? elast.feature_uplift_pct / 100 : 0;
  
  const liftFactor = 1 + depthEffect + displayBonus + featureBonus;
  const incrementalUnits = Math.floor(baseUnits * (liftFactor - 1));
  const avgPrice = product.price_regular * (1 - promo.depth_pct / 100);
  const incrementalSales = incrementalUnits * avgPrice;
  const incrementalMargin = incrementalUnits * (avgPrice - product.cost);
  
  const discountCost = incrementalUnits * product.price_regular * (promo.depth_pct / 100);
  const vendorFunding = discountCost * (promo.vendor_funding_pct / 100);
  const displayCost = promo.display ? 150 : 0;
  const featureCost = promo.feature ? 200 : 0;
  const spend = discountCost - vendorFunding + displayCost + featureCost;
  
  const roi = incrementalMargin / Math.max(spend, 1);
  
  return {
    id: idx + 1,
    promo_id: promo.id,
    incremental_units: incrementalUnits,
    incremental_sales: incrementalSales,
    incremental_margin: incrementalMargin,
    roi: roi,
    spend: spend
  };
});

// Coupon funnels for coupon promos
export const couponFunnels: CouponFunnel[] = promotions
  .filter(p => p.coupon)
  .map(promo => {
    const issued = Math.floor(Math.random() * 2000) + 3000;
    const viewed = Math.floor(issued * (Math.random() * 0.2 + 0.6));
    const clipped = Math.floor(viewed * (Math.random() * 0.3 + 0.4));
    const redeemed = Math.floor(clipped * (Math.random() * 0.3 + 0.2));
    
    return {
      promo_id: promo.id,
      issued,
      viewed,
      clipped,
      redeemed
    };
  });
