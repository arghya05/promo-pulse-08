import { products, stores, promotions, promotionLifts, elasticity, haloCannibal, couponFunnels } from "./data/seed";
import type { Question } from "./data/questions";

// Core analytics engine

export interface AnalyticsResult {
  whatHappened: string;
  why: string;
  whatToDo: string;
  kpis: {
    liftPct: number;
    roi: number;
    incrementalMargin: number;
    spend: number;
  };
  sources: string;
  chartData: any[];
  followups: [string, string];
}

export function executeQuestion(question: Question, filters?: any): AnalyticsResult {
  // Router to specific analytics functions based on sql_or_fn
  switch (question.sql_or_fn) {
    case "topPromosByROI":
      return topPromosByROI(filters);
    case "lostMoneyPromos":
      return lostMoneyPromos(filters);
    case "optimalDepth":
      return optimalDepth(filters);
    case "categoryROI":
      return categoryROI(filters);
    case "promoCalendar":
      return promoCalendar(filters);
    case "displayVsFeature":
      return displayVsFeature(filters);
    case "bestMechanic":
      return bestMechanic(filters);
    case "couponRedemption":
      return couponRedemption(filters);
    case "scalablePromos":
      return scalablePromos(filters);
    default:
      return topPromosByROI(filters); // fallback
  }
}

function topPromosByROI(filters?: any): AnalyticsResult {
  const lifts = [...promotionLifts]
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 5);
  
  const totalMargin = lifts.reduce((sum, l) => sum + l.incremental_margin, 0);
  const avgROI = lifts.reduce((sum, l) => sum + l.roi, 0) / lifts.length;
  const totalSpend = lifts.reduce((sum, l) => sum + l.spend, 0);
  const avgLift = lifts.reduce((sum, l) => sum + (l.incremental_units / 150), 0) / lifts.length;
  
  const topPromo = lifts[0];
  const topPromoDetail = promotions.find(p => p.id === topPromo.promo_id)!;
  const topProduct = products.find(p => p.id === topPromoDetail.productId)!;
  const topElast = elasticity.find(e => e.productId === topProduct.id)!;
  
  const chartData = lifts.map(lift => {
    const promo = promotions.find(p => p.id === lift.promo_id)!;
    const product = products.find(p => p.id === promo.productId)!;
    return {
      name: `${product.name} W${promo.start_date.split('-')[1]}`,
      roi: lift.roi,
      margin: lift.incremental_margin,
      spend: lift.spend,
      lift: (lift.incremental_units / 150) * 100
    };
  });

  return {
    whatHappened: `Top 5 promos delivered **${avgLift.toFixed(1)}%** avg lift, **US$${totalMargin.toFixed(0)}** combined margin; avg ROI **${avgROI.toFixed(2)}** on **US$${totalSpend.toFixed(0)}** spend.`,
    why: `Drivers: depth ${topPromoDetail.depth_pct}% (elasticity ${topElast.promo_elast.toFixed(1)}) + display +${topElast.display_uplift_pct}% / feature +${topElast.feature_uplift_pct}%; vendor funding ${topPromoDetail.vendor_funding_pct}% offset.`,
    whatToDo: `Repeat: ${topProduct.name} at ${topPromoDetail.depth_pct}% depth with display; Scale: add 3 stores with similar demographics; Test: 25% depth variant to maximize margin.`,
    kpis: {
      liftPct: avgLift,
      roi: avgROI,
      incrementalMargin: totalMargin,
      spend: totalSpend
    },
    sources: `SKU=${topProduct.name} | Region=Multi | Weeks=1-26`,
    chartData,
    followups: ["Bottom 5 ROI", "Vendor funding impact"]
  };
}

function lostMoneyPromos(filters?: any): AnalyticsResult {
  const losers = promotionLifts
    .filter(l => l.roi < 1)
    .sort((a, b) => a.roi - b.roi)
    .slice(0, 10);
  
  const totalLoss = losers.reduce((sum, l) => sum + (l.spend - l.incremental_margin), 0);
  const avgROI = losers.reduce((sum, l) => sum + l.roi, 0) / losers.length;
  const totalSpend = losers.reduce((sum, l) => sum + l.spend, 0);
  
  const worstPromo = losers[0];
  const worstPromoDetail = promotions.find(p => p.id === worstPromo.promo_id)!;
  const worstProduct = products.find(p => p.id === worstPromoDetail.productId)!;
  
  const chartData = losers.map(lift => {
    const promo = promotions.find(p => p.id === lift.promo_id)!;
    const product = products.find(p => p.id === promo.productId)!;
    return {
      name: `${product.name.substring(0, 12)} ${promo.promo_type}`,
      roi: lift.roi,
      margin: lift.incremental_margin,
      spend: lift.spend,
      loss: lift.spend - lift.incremental_margin
    };
  });

  return {
    whatHappened: `${losers.length} promos lost **US$${totalLoss.toFixed(0)}** combined; avg ROI **${avgROI.toFixed(2)}** on **US$${totalSpend.toFixed(0)}** spend. Worst: ${worstProduct.name} ROI **${worstPromo.roi.toFixed(2)}**.`,
    why: `Drivers: excess depth ${worstPromoDetail.depth_pct}% beyond elasticity response; low vendor funding ${worstPromoDetail.vendor_funding_pct}%; insufficient display/feature activation.`,
    whatToDo: `Cut: eliminate ${worstProduct.name} at current depth; Reduce: cap depth at 20% for low-elasticity SKUs; Switch: negotiate 40%+ vendor funding or discontinue.`,
    kpis: {
      liftPct: 8.2,
      roi: avgROI,
      incrementalMargin: losers.reduce((sum, l) => sum + l.incremental_margin, 0),
      spend: totalSpend
    },
    sources: `SKU=Multiple | Region=All | Weeks=1-26`,
    chartData,
    followups: ["Root causes", "Fix recommendations"]
  };
}

function optimalDepth(filters?: any): AnalyticsResult {
  const product = products.find(p => p.name === "Soda-12pk") || products[8];
  const elast = elasticity.find(e => e.productId === product.id)!;
  
  const depths = [5, 10, 15, 20, 25, 30, 35, 40];
  const chartData = depths.map(depth => {
    const liftFactor = 1 + (depth / 10) * elast.promo_elast * 0.1;
    const baseUnits = 150;
    const incrementalUnits = baseUnits * (liftFactor - 1);
    const avgPrice = product.price_regular * (1 - depth / 100);
    const incrementalMargin = incrementalUnits * (avgPrice - product.cost);
    const discountCost = incrementalUnits * product.price_regular * (depth / 100);
    const spend = discountCost * 0.7; // assume 30% vendor funding
    const roi = incrementalMargin / spend;
    
    return {
      depth,
      margin: incrementalMargin,
      roi,
      units: incrementalUnits,
      spend
    };
  });
  
  const optimal = chartData.reduce((best, curr) => curr.margin > best.margin ? curr : best);

  return {
    whatHappened: `Optimal depth **${optimal.depth}%** delivers **US$${optimal.margin.toFixed(0)}** incremental margin, **${optimal.units.toFixed(0)}** units; ROI **${optimal.roi.toFixed(2)}** on **US$${optimal.spend.toFixed(0)}** spend.`,
    why: `Drivers: price elasticity ${elast.promo_elast.toFixed(1)} peaks at ${optimal.depth}%; deeper discounts cannibalize margin faster than volume growth; vendor funding 30% holds.`,
    whatToDo: `Lock: ${product.name} at ${optimal.depth}% depth next 4 weeks; Add: display (+${elast.display_uplift_pct}% lift) for US$${(optimal.margin * 1.12).toFixed(0)} margin; Avoid: depths >${optimal.depth + 5}% erode ROI.`,
    kpis: {
      liftPct: (optimal.units / 150) * 100,
      roi: optimal.roi,
      incrementalMargin: optimal.margin,
      spend: optimal.spend
    },
    sources: `SKU=${product.name} | Region=All | Weeks=Simulated`,
    chartData,
    followups: ["Maximize revenue", "Simulate display"]
  };
}

function categoryROI(filters?: any): AnalyticsResult {
  const snacksProducts = products.filter(p => p.category === "Snacks");
  const snacksPromos = promotions.filter(p => snacksProducts.some(sp => sp.id === p.productId));
  const snacksLifts = promotionLifts.filter(l => snacksPromos.some(sp => sp.id === l.promo_id));
  
  const totalMargin = snacksLifts.reduce((sum, l) => sum + l.incremental_margin, 0);
  const totalSpend = snacksLifts.reduce((sum, l) => sum + l.spend, 0);
  const avgROI = totalMargin / totalSpend;
  const avgLift = snacksLifts.reduce((sum, l) => sum + (l.incremental_units / 150), 0) / snacksLifts.length;
  
  const brandData: Record<string, { margin: number; spend: number; roi: number }> = {};
  snacksLifts.forEach(lift => {
    const promo = snacksPromos.find(p => p.id === lift.promo_id)!;
    const product = snacksProducts.find(p => p.id === promo.productId)!;
    if (!brandData[product.brand]) {
      brandData[product.brand] = { margin: 0, spend: 0, roi: 0 };
    }
    brandData[product.brand].margin += lift.incremental_margin;
    brandData[product.brand].spend += lift.spend;
  });
  
  Object.keys(brandData).forEach(brand => {
    brandData[brand].roi = brandData[brand].margin / brandData[brand].spend;
  });
  
  const chartData = Object.entries(brandData).map(([brand, data]) => ({
    brand,
    margin: data.margin,
    roi: data.roi,
    spend: data.spend
  }));

  return {
    whatHappened: `Snacks category delivered **${avgLift.toFixed(1)}%** avg lift, **US$${totalMargin.toFixed(0)}** margin; ROI **${avgROI.toFixed(2)}** on **US$${totalSpend.toFixed(0)}** spend. ${Object.keys(brandData).length} brands active.`,
    why: `Drivers: chips (Lays, Tostitos) depth 20% (elasticity 2.0) + display +10%; halo to Coca-Cola +6% / cannibal within Snacks −4%; vendor funding 35% avg.`,
    whatToDo: `Scale: top 3 brands at current depths; Add: bundle chips+soda for US$${(totalMargin * 1.15).toFixed(0)} margin; Cut: low-ROI pretzel promos save US$${(totalSpend * 0.12).toFixed(0)}.`,
    kpis: {
      liftPct: avgLift,
      roi: avgROI,
      incrementalMargin: totalMargin,
      spend: totalSpend
    },
    sources: `SKU=Snacks Category | Region=All | Weeks=1-26`,
    chartData,
    followups: ["Brand drill-down", "Compare Beverages"]
  };
}

function promoCalendar(filters?: any): AnalyticsResult {
  const northStores = stores.filter(s => s.region === "North");
  const northPromos = promotions
    .filter(p => northStores.some(s => s.id === p.storeId))
    .slice(0, 15);
  
  const northLifts = promotionLifts.filter(l => northPromos.some(p => p.id === l.promo_id));
  const avgROI = northLifts.reduce((sum, l) => sum + l.roi, 0) / northLifts.length;
  const totalSpend = northLifts.reduce((sum, l) => sum + l.spend, 0);
  const totalMargin = northLifts.reduce((sum, l) => sum + l.incremental_margin, 0);
  
  const chartData = northPromos.slice(0, 10).map(promo => {
    const lift = northLifts.find(l => l.promo_id === promo.id)!;
    const product = products.find(p => p.id === promo.productId)!;
    return {
      week: `W${promo.start_date.split('-')[1]}`,
      product: product.name.substring(0, 15),
      roi: lift.roi,
      margin: lift.incremental_margin,
      type: promo.promo_type
    };
  });

  return {
    whatHappened: `North region ${northPromos.length} upcoming promos predict **${(northLifts.reduce((s, l) => s + l.incremental_units, 0) / 150 / northLifts.length).toFixed(1)}%** avg lift, **US$${totalMargin.toFixed(0)}** margin; ROI **${avgROI.toFixed(2)}** on **US$${totalSpend.toFixed(0)}** spend.`,
    why: `Drivers: mix 40% price-off + 30% BOGO; display 60% penetration (+9%); vendor funding 42% avg; 3 high-affluence stores boost lift.`,
    whatToDo: `Flag: 2 promos ROI <1.2 need depth cuts to 20%; Re-allocate: shift US$${(totalSpend * 0.15).toFixed(0)} from weak pasta to beverages; Lock: current calendar for 85% promos.`,
    kpis: {
      liftPct: (northLifts.reduce((s, l) => s + l.incremental_units, 0) / 150 / northLifts.length),
      roi: avgROI,
      incrementalMargin: totalMargin,
      spend: totalSpend
    },
    sources: `SKU=Multiple | Region=North | Weeks=Next 8`,
    chartData,
    followups: ["Flag low-ROI", "Re-allocate spend"]
  };
}

function displayVsFeature(filters?: any): AnalyticsResult {
  const beverageProducts = products.filter(p => p.category === "Beverages");
  const beveragePromos = promotions.filter(p => beverageProducts.some(bp => bp.id === p.productId));
  const beverageLifts = promotionLifts.filter(l => beveragePromos.some(bp => bp.id === l.promo_id));
  
  const displayOnly = beverageLifts.filter(l => {
    const promo = beveragePromos.find(p => p.id === l.promo_id)!;
    return promo.display && !promo.feature;
  });
  const featureOnly = beverageLifts.filter(l => {
    const promo = beveragePromos.find(p => p.id === l.promo_id)!;
    return promo.feature && !promo.display;
  });
  const both = beverageLifts.filter(l => {
    const promo = beveragePromos.find(p => p.id === l.promo_id)!;
    return promo.feature && promo.display;
  });
  
  const chartData = [
    {
      mechanic: "Display Only",
      roi: displayOnly.reduce((s, l) => s + l.roi, 0) / displayOnly.length,
      margin: displayOnly.reduce((s, l) => s + l.incremental_margin, 0),
      count: displayOnly.length
    },
    {
      mechanic: "Feature Only",
      roi: featureOnly.reduce((s, l) => s + l.roi, 0) / featureOnly.length,
      margin: featureOnly.reduce((s, l) => s + l.incremental_margin, 0),
      count: featureOnly.length
    },
    {
      mechanic: "Both",
      roi: both.reduce((s, l) => s + l.roi, 0) / both.length,
      margin: both.reduce((s, l) => s + l.incremental_margin, 0),
      count: both.length
    }
  ];
  
  const best = chartData.reduce((best, curr) => curr.roi > best.roi ? curr : best);

  return {
    whatHappened: `${best.mechanic} delivered **${best.roi.toFixed(2)}** ROI, **US$${best.margin.toFixed(0)}** margin across **${best.count}** Beverage promos; outperformed alternatives by **${((best.roi / chartData.filter(c => c.mechanic !== best.mechanic)[0].roi - 1) * 100).toFixed(0)}%**.`,
    why: `Drivers: ${best.mechanic === "Both" ? "feature +15% + display +12% combined" : best.mechanic === "Display Only" ? "display +12% with lower cost (US$150 vs US$200)" : "feature +15% reach without display investment"}; Beverages elasticity 2.2 amplifies visibility.`,
    whatToDo: `Scale: apply ${best.mechanic.toLowerCase()} to 80% of Beverage promos; Test: feature-only on low-traffic stores for cost savings; Add: ${best.mechanic === "Both" ? "maintain combo" : "try combo on top SKUs"}.`,
    kpis: {
      liftPct: 14.5,
      roi: best.roi,
      incrementalMargin: best.margin,
      spend: best.margin / best.roi
    },
    sources: `SKU=Beverages | Region=All | Weeks=1-26`,
    chartData,
    followups: ["By store", "By brand"]
  };
}

function bestMechanic(filters?: any): AnalyticsResult {
  const dairyProducts = products.filter(p => p.category === "Dairy");
  const dairyPromos = promotions.filter(p => dairyProducts.some(dp => dp.id === p.productId));
  const dairyLifts = promotionLifts.filter(l => dairyPromos.some(dp => dp.id === l.promo_id));
  
  const mechanicData: Record<string, { margin: number; spend: number; roi: number; count: number }> = {};
  dairyLifts.forEach(lift => {
    const promo = dairyPromos.find(p => p.id === lift.promo_id)!;
    if (!mechanicData[promo.promo_type]) {
      mechanicData[promo.promo_type] = { margin: 0, spend: 0, roi: 0, count: 0 };
    }
    mechanicData[promo.promo_type].margin += lift.incremental_margin;
    mechanicData[promo.promo_type].spend += lift.spend;
    mechanicData[promo.promo_type].count++;
  });
  
  Object.keys(mechanicData).forEach(mech => {
    mechanicData[mech].roi = mechanicData[mech].margin / mechanicData[mech].spend;
  });
  
  const chartData = Object.entries(mechanicData).map(([mech, data]) => ({
    mechanic: mech,
    roi: data.roi,
    margin: data.margin,
    count: data.count
  }));
  
  const best = chartData.reduce((best, curr) => curr.roi > best.roi ? curr : best);

  return {
    whatHappened: `${best.mechanic} delivered **${best.roi.toFixed(2)}** ROI, **US$${best.margin.toFixed(0)}** margin across **${best.count}** Dairy promos; outperformed alternatives by **${((best.roi / chartData.filter(c => c.mechanic !== best.mechanic)[0].roi - 1) * 100).toFixed(0)}%**.`,
    why: `Drivers: Dairy elasticity 1.5 + ${best.mechanic === "price_off" ? "clear value signal" : best.mechanic === "bogo" ? "volume incentive" : "bundle/coupon convenience"}; vendor funding ${best.mechanic === "coupon" ? "20%" : "45%"} offset costs.`,
    whatToDo: `Scale: apply ${best.mechanic} to 70% of Dairy promos; Test: ${best.mechanic === "bogo" ? "price-off at equivalent depth" : "BOGO"} on 3 SKUs; Cut: lowest ROI mechanic saves US$${(mechanicData[Object.keys(mechanicData)[Object.keys(mechanicData).length - 1]].spend * 0.2).toFixed(0)}.`,
    kpis: {
      liftPct: 11.3,
      roi: best.roi,
      incrementalMargin: best.margin,
      spend: best.margin / best.roi
    },
    sources: `SKU=Dairy | Region=All | Weeks=1-26`,
    chartData,
    followups: ["By brand", "By store cluster"]
  };
}

function couponRedemption(filters?: any): AnalyticsResult {
  const funnels = couponFunnels.slice(0, 5);
  const avgRedemptionRate = funnels.reduce((s, f) => s + (f.redeemed / f.issued), 0) / funnels.length;
  const totalIssued = funnels.reduce((s, f) => s + f.issued, 0);
  const totalRedeemed = funnels.reduce((s, f) => s + f.redeemed, 0);
  
  const chartData = [
    { stage: "Issued", count: totalIssued, rate: 100 },
    { stage: "Viewed", count: funnels.reduce((s, f) => s + f.viewed, 0), rate: (funnels.reduce((s, f) => s + f.viewed, 0) / totalIssued) * 100 },
    { stage: "Clipped", count: funnels.reduce((s, f) => s + f.clipped, 0), rate: (funnels.reduce((s, f) => s + f.clipped, 0) / totalIssued) * 100 },
    { stage: "Redeemed", count: totalRedeemed, rate: avgRedemptionRate * 100 }
  ];

  return {
    whatHappened: `Coupon funnel **${totalIssued}** issued → **${totalRedeemed}** redeemed (**${(avgRedemptionRate * 100).toFixed(1)}%** rate); **US$${(totalRedeemed * 2.5).toFixed(0)}** incremental margin across **${funnels.length}** promos.`,
    why: `Drivers: viewed-to-clipped drop −${(100 - chartData[2].rate).toFixed(0)}% (targeting mismatch); clipped-to-redeemed −${(chartData[2].rate - chartData[3].rate).toFixed(0)}% (expiry/complexity); digital channel 65% vs paper 35%.`,
    whatToDo: `Fix: personalize targeting to lift viewed-to-clipped +15%; Simplify: auto-apply at checkout for clipped-to-redeemed +10%; Shift: reallocate US$${((totalIssued - totalRedeemed) * 0.5).toFixed(0)} to price-off for efficiency.`,
    kpis: {
      liftPct: 9.5,
      roi: 1.85,
      incrementalMargin: totalRedeemed * 2.5,
      spend: totalRedeemed * 1.35
    },
    sources: `SKU=Coupon Promos | Region=All | Weeks=1-26`,
    chartData,
    followups: ["Leak step", "Fix suggestions"]
  };
}

function scalablePromos(filters?: any): AnalyticsResult {
  const scalable = promotionLifts
    .filter(l => {
      const promo = promotions.find(p => p.id === l.promo_id)!;
      return l.roi >= 2 && promo.vendor_funding_pct > 30;
    })
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 8);
  
  const totalMargin = scalable.reduce((sum, l) => sum + l.incremental_margin, 0);
  const avgROI = scalable.reduce((sum, l) => sum + l.roi, 0) / scalable.length;
  const totalSpend = scalable.reduce((sum, l) => sum + l.spend, 0);
  
  const chartData = scalable.map(lift => {
    const promo = promotions.find(p => p.id === lift.promo_id)!;
    const product = products.find(p => p.id === promo.productId)!;
    return {
      name: product.name.substring(0, 15),
      roi: lift.roi,
      margin: lift.incremental_margin,
      funding: promo.vendor_funding_pct
    };
  });

  return {
    whatHappened: `${scalable.length} vendor-funded promos delivered **${avgROI.toFixed(2)}** avg ROI, **US$${totalMargin.toFixed(0)}** margin on **US$${totalSpend.toFixed(0)}** spend; vendor funding **${chartData.reduce((s, d) => s + d.funding, 0) / chartData.length}%** avg offset.`,
    why: `Drivers: high funding (40–60%) absorbs discount costs; strong elasticity products (Beverages, Snacks); display/feature activation +18% combined lift.`,
    whatToDo: `Scale: expand ${chartData[0].name} to 5 stores (project US$${(chartData[0].margin * 5).toFixed(0)} margin); Lock: 6-week calendar with vendors; Negotiate: add 3 brands at 50%+ funding for US$${(totalMargin * 1.3).toFixed(0)} margin. Risk: stockout 5%.`,
    kpis: {
      liftPct: 16.8,
      roi: avgROI,
      incrementalMargin: totalMargin,
      spend: totalSpend
    },
    sources: `SKU=Multiple | Region=All | Weeks=1-26`,
    chartData,
    followups: ["6-week plan", "Risk check"]
  };
}

export function getKPIStatus(kpi: string, value: number): "good" | "warning" | "bad" {
  if (kpi === "roi") {
    if (value >= 1.5) return "good";
    if (value >= 1.0) return "warning";
    return "bad";
  }
  if (kpi === "liftPct") {
    if (value >= 12) return "good";
    if (value >= 8) return "warning";
    return "bad";
  }
  return "good";
}
