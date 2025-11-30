// Question Library - 50 hardcoded questions with metadata

export interface Question {
  id: number;
  question: string;
  tags: string[];
  metric_key: string;
  chart_type: "bar" | "line" | "combo" | "waterfall" | "funnel" | "scatter" | "table";
  sql_or_fn: string;
  followup1: string;
  followup2: string;
}

export const questionLibrary: Question[] = [
  { id: 1, question: "Top 5 promotions by ROI last month?", tags: ["roi", "top"], metric_key: "roi", chart_type: "bar", sql_or_fn: "topPromosByROI", followup1: "Bottom 5 ROI", followup2: "Vendor funding impact" },
  { id: 2, question: "Top 5 by incremental margin last quarter?", tags: ["margin", "top"], metric_key: "incremental_margin", chart_type: "bar", sql_or_fn: "topPromosByMargin", followup1: "Add funding", followup2: "Per store" },
  { id: 3, question: "Which promos lost money (ROI < 1) in past 8 weeks?", tags: ["roi", "risk"], metric_key: "roi", chart_type: "bar", sql_or_fn: "lostMoneyPromos", followup1: "Root causes", followup2: "Fix recommendations" },
  { id: 4, question: "Optimal discount depth for Soda-12pk to maximize margin?", tags: ["optimization", "depth"], metric_key: "optimal_depth", chart_type: "line", sql_or_fn: "optimalDepth", followup1: "Maximize revenue", followup2: "Simulate display" },
  { id: 5, question: "Category-level promo ROI for Snacks in May?", tags: ["category", "roi"], metric_key: "category_roi", chart_type: "combo", sql_or_fn: "categoryROI", followup1: "Brand drill-down", followup2: "Compare Beverages" },
  { id: 6, question: "Promo calendar Region North next month (predicted lift)?", tags: ["calendar", "forecast"], metric_key: "predicted_lift", chart_type: "line", sql_or_fn: "promoCalendar", followup1: "Flag low-ROI", followup2: "Re-allocate spend" },
  { id: 7, question: "Impact of display vs feature on Beverages last quarter?", tags: ["mechanics", "beverages"], metric_key: "display_feature", chart_type: "bar", sql_or_fn: "displayVsFeature", followup1: "By store", followup2: "By brand" },
  { id: 8, question: "Effect of vendor funding on ROI last quarter?", tags: ["funding", "roi"], metric_key: "vendor_impact", chart_type: "waterfall", sql_or_fn: "vendorFundingImpact", followup1: "Without funding", followup2: "Under-funded vendors?" },
  { id: 9, question: "Top 10 price-off promos by units lifted?", tags: ["units", "price_off"], metric_key: "units_lift", chart_type: "bar", sql_or_fn: "topUnitLifts", followup1: "Convert to margin", followup2: "Add halo" },
  { id: 10, question: "Stores that overspend with weak lifts?", tags: ["efficiency", "store"], metric_key: "spend_efficiency", chart_type: "scatter", sql_or_fn: "overspendStores", followup1: "Depth fixes", followup2: "List risky promos" },
  { id: 11, question: "Best mechanic (price-off/BOGO/bundle/coupon) for Dairy?", tags: ["mechanics", "dairy"], metric_key: "mechanic_compare", chart_type: "bar", sql_or_fn: "bestMechanic", followup1: "By brand", followup2: "By store cluster" },
  { id: 12, question: "Weeks where halo to soda >5% from chips promos?", tags: ["halo", "soda"], metric_key: "halo_effect", chart_type: "line", sql_or_fn: "haloWeeks", followup1: "Net of cannibal", followup2: "Driver SKUs?" },
  { id: 13, question: "Products most cannibalized during Pasta Sauce promos?", tags: ["cannibalization", "pasta"], metric_key: "cannibal_effect", chart_type: "bar", sql_or_fn: "cannibalProducts", followup1: "Reduce overlap?", followup2: "Display-only?" },
  { id: 14, question: "Coupon redemption rate by promo last month?", tags: ["coupon", "redemption"], metric_key: "redemption_rate", chart_type: "funnel", sql_or_fn: "couponRedemption", followup1: "Leak step", followup2: "Fix suggestions" },
  { id: 15, question: "Margin impact of 20% vs 30% depth for Top-selling Yogurt?", tags: ["depth", "dairy"], metric_key: "depth_compare", chart_type: "line", sql_or_fn: "depthComparison", followup1: "Add feature", followup2: "Store split" },
  { id: 16, question: "Which brand benefited most from holiday promos Q4?", tags: ["holiday", "brand"], metric_key: "holiday_lift", chart_type: "bar", sql_or_fn: "holidayBrands", followup1: "Non-holiday baseline", followup2: "Repeat next year?" },
  { id: 17, question: "Are we over-promoting low-elasticity products?", tags: ["elasticity", "efficiency"], metric_key: "elast_check", chart_type: "scatter", sql_or_fn: "overPromoting", followup1: "Cut list", followup2: "Depth optimizer" },
  { id: 18, question: "Region comparison: promo spend vs incremental margin YTD?", tags: ["region", "efficiency"], metric_key: "region_efficiency", chart_type: "waterfall", sql_or_fn: "regionComparison", followup1: "Normalize by revenue", followup2: "Store view" },
  { id: 19, question: "Which promos improved basket size the most?", tags: ["basket", "cross-sell"], metric_key: "basket_growth", chart_type: "bar", sql_or_fn: "basketPromos", followup1: "Attach-rate details", followup2: "Repeat cadence?" },
  { id: 20, question: "Vendor-funded promos with ROI ≥ 2 to scale?", tags: ["funding", "scalable"], metric_key: "scalable_promos", chart_type: "bar", sql_or_fn: "scalablePromos", followup1: "6-week plan", followup2: "Risk check" },
  { id: 21, question: "Promotion fatigue: did repeated deals lose lift?", tags: ["fatigue", "cadence"], metric_key: "fatigue_check", chart_type: "line", sql_or_fn: "promotionFatigue", followup1: "Optimal cadence", followup2: "New mechanic" },
  { id: 22, question: "Best weekday to start promos for Frozen?", tags: ["timing", "frozen"], metric_key: "weekday_effect", chart_type: "line", sql_or_fn: "bestWeekday", followup1: "By store", followup2: "Holiday-adjusted" },
  { id: 23, question: "Are we profitable after markdown + funding for Produce?", tags: ["profitability", "produce"], metric_key: "net_profit", chart_type: "waterfall", sql_or_fn: "produceProfitability", followup1: "Per SKU", followup2: "Display-only swap" },
  { id: 24, question: "Which promos drove new vs repeat (proxy) customers?", tags: ["customer", "acquisition"], metric_key: "new_vs_repeat", chart_type: "bar", sql_or_fn: "newVsRepeat", followup1: "By category", followup2: "By store" },
  { id: 25, question: "Best combo: feature + display vs either alone (Beverages)?", tags: ["combo", "beverages"], metric_key: "combo_effect", chart_type: "bar", sql_or_fn: "featureDisplayCombo", followup1: "Cost-adjusted ROI", followup2: "Depth 20 vs 30" },
  { id: 26, question: "Which promos increased stockout risk?", tags: ["inventory", "risk"], metric_key: "stockout_risk", chart_type: "line", sql_or_fn: "stockoutRisk", followup1: "Mitigation plan", followup2: "Move inventory" },
  { id: 27, question: "BOGO effectiveness vs price-off in Snacks?", tags: ["mechanics", "snacks"], metric_key: "bogo_vs_priceoff", chart_type: "bar", sql_or_fn: "bogoComparison", followup1: "By brand", followup2: "Depth equivalence" },
  { id: 28, question: "Bundle (chips+soda) performance last 12 weeks?", tags: ["bundle", "performance"], metric_key: "bundle_perf", chart_type: "bar", sql_or_fn: "bundlePerformance", followup1: "Margin view", followup2: "By store" },
  { id: 29, question: "Top store clusters by promo ROI?", tags: ["store", "cluster"], metric_key: "cluster_roi", chart_type: "bar", sql_or_fn: "storeClusterROI", followup1: "Drivers", followup2: "Replicate playbook" },
  { id: 30, question: "Where did promos widen market share (proxy units)?", tags: ["share", "growth"], metric_key: "share_growth", chart_type: "line", sql_or_fn: "shareGrowth", followup1: "By category", followup2: "Competitor proxy" },
  { id: 31, question: "Depth optimizer recommendations for Beverages this month?", tags: ["optimization", "beverages"], metric_key: "depth_optimizer", chart_type: "line", sql_or_fn: "depthOptimizer", followup1: "Lock plan", followup2: "Margin risk" },
  { id: 32, question: "Net halo−cannibal for Snacks?", tags: ["halo", "snacks"], metric_key: "net_halo_cannibal", chart_type: "waterfall", sql_or_fn: "netHaloCannibal", followup1: "Leading SKUs", followup2: "Reduce cannibal loss" },
  { id: 33, question: "Top promos by A/B uplift vs forecast?", tags: ["forecast", "variance"], metric_key: "uplift_variance", chart_type: "bar", sql_or_fn: "forecastVariance", followup1: "Confidence bands", followup2: "Repeat cadence" },
  { id: 34, question: "Vendor ranking by ROI and funding fairness?", tags: ["vendor", "ranking"], metric_key: "vendor_ranking", chart_type: "scatter", sql_or_fn: "vendorRanking", followup1: "Renegotiate list", followup2: "Allocate spend" },
  { id: 35, question: "Which promos underperformed predicted lift?", tags: ["underperform", "forecast"], metric_key: "underperform", chart_type: "bar", sql_or_fn: "underperformedPromos", followup1: "Root cause", followup2: "New mechanic" },
  { id: 36, question: "Holiday vs non-holiday promo efficiency?", tags: ["holiday", "efficiency"], metric_key: "holiday_efficiency", chart_type: "combo", sql_or_fn: "holidayEfficiency", followup1: "Per category", followup2: "Adjust next calendar" },
  { id: 37, question: "Coupon leakage (issued→redeemed)?", tags: ["coupon", "leakage"], metric_key: "coupon_leakage", chart_type: "funnel", sql_or_fn: "couponLeakage", followup1: "Targeting", followup2: "Channel shift" },
  { id: 38, question: "Core vs long-tail SKU promo return?", tags: ["sku", "pareto"], metric_key: "core_longtail", chart_type: "bar", sql_or_fn: "coreLongtail", followup1: "Rebalance spend", followup2: "Depth caps" },
  { id: 39, question: "Best new item starter pack?", tags: ["new_item", "launch"], metric_key: "launch_pack", chart_type: "table", sql_or_fn: "newItemStarter", followup1: "Week-by-week plan", followup2: "Attach items" },
  { id: 40, question: "Where can we cut promos with minimal sales loss?", tags: ["efficiency", "cut"], metric_key: "cut_candidates", chart_type: "bar", sql_or_fn: "cutCandidates", followup1: "Risk bands", followup2: "Exec summary" },
  { id: 41, question: "Affluence index effect on promo response?", tags: ["affluence", "response"], metric_key: "affluence_effect", chart_type: "scatter", sql_or_fn: "affluenceEffect", followup1: "Neighborhood targeting", followup2: "Depth tiers" },
  { id: 42, question: "Elasticity outliers to watch?", tags: ["elasticity", "outliers"], metric_key: "elast_outliers", chart_type: "bar", sql_or_fn: "elasticityOutliers", followup1: "Audit data", followup2: "Pilot depth" },
  { id: 43, question: "Feature-only wins (no discount)?", tags: ["feature", "no_discount"], metric_key: "feature_only", chart_type: "bar", sql_or_fn: "featureOnlyWins", followup1: "Replicate SKUs", followup2: "Add display" },
  { id: 44, question: "Promos that drove repeat purchases week+1?", tags: ["repeat", "loyalty"], metric_key: "repeat_purchase", chart_type: "line", sql_or_fn: "repeatPurchase", followup1: "By category", followup2: "Cadence adjust" },
  { id: 45, question: "Spend efficiency trend YTD?", tags: ["efficiency", "trend"], metric_key: "efficiency_trend", chart_type: "line", sql_or_fn: "efficiencyTrend", followup1: "By region", followup2: "By category" },
  { id: 46, question: "Vendor funding gaps vs expected?", tags: ["funding", "gap"], metric_key: "funding_gap", chart_type: "waterfall", sql_or_fn: "fundingGaps", followup1: "Recovery plan", followup2: "Next negotiation" },
  { id: 47, question: "Top 5 risks in next month's plan?", tags: ["risk", "forecast"], metric_key: "top_risks", chart_type: "table", sql_or_fn: "topRisks", followup1: "Auto-fix options", followup2: "Escalate to CFO" },
  { id: 48, question: "Attach rate change for soda during chips promos?", tags: ["attach", "cross_sell"], metric_key: "attach_rate", chart_type: "line", sql_or_fn: "attachRate", followup1: "Basket lift $", followup2: "Try bundle" },
  { id: 49, question: "Where did display outperform feature?", tags: ["display", "feature"], metric_key: "display_vs_feature", chart_type: "bar", sql_or_fn: "displayOutperform", followup1: "By store", followup2: "By brand" },
  { id: 50, question: "Executive promo scorecard for this month?", tags: ["executive", "scorecard"], metric_key: "scorecard", chart_type: "combo", sql_or_fn: "executiveScorecard", followup1: "Category drill-down", followup2: "Low-ROI list" },
  
  // Predictive Analytics & Forecasting
  { id: 51, question: "Forecast next month's sales by category with promotion impact?", tags: ["forecast", "predictive"], metric_key: "sales_forecast", chart_type: "line", sql_or_fn: "salesForecast", followup1: "By store", followup2: "Confidence intervals" },
  { id: 52, question: "Which customers have highest propensity to respond to promotions?", tags: ["propensity", "targeting"], metric_key: "response_propensity", chart_type: "scatter", sql_or_fn: "responsePropensity", followup1: "By segment", followup2: "Contact strategy" },
  { id: 53, question: "Predict churn risk for high-value customers without promotions?", tags: ["churn", "predictive"], metric_key: "churn_risk", chart_type: "bar", sql_or_fn: "churnRisk", followup1: "Win-back offers", followup2: "Retention ROI" },
  { id: 54, question: "Customer lifetime value prediction by segment with promo frequency?", tags: ["ltv", "predictive"], metric_key: "ltv_prediction", chart_type: "bar", sql_or_fn: "ltvPrediction", followup1: "Optimal cadence", followup2: "Segment targeting" },
  { id: 55, question: "Forecast demand spike for seasonal products next quarter?", tags: ["forecast", "seasonal"], metric_key: "seasonal_forecast", chart_type: "line", sql_or_fn: "seasonalForecast", followup1: "Inventory prep", followup2: "Promo calendar" },
  { id: 56, question: "Market basket prediction: what products will customers buy together?", tags: ["basket", "predictive"], metric_key: "basket_prediction", chart_type: "table", sql_or_fn: "basketPrediction", followup1: "Bundle recommendations", followup2: "Cross-sell promos" },
  { id: 57, question: "Price elasticity forecast: optimal price points for next campaign?", tags: ["elasticity", "forecast"], metric_key: "price_elasticity_forecast", chart_type: "line", sql_or_fn: "elasticityForecast", followup1: "Revenue maximize", followup2: "Margin optimize" },
  { id: 58, question: "Predict which promotions will underperform before launch?", tags: ["forecast", "risk"], metric_key: "promo_risk_score", chart_type: "bar", sql_or_fn: "promoRiskScore", followup1: "Mitigation plan", followup2: "Redesign mechanics" },
  { id: 59, question: "Customer conversion probability by promotion type and segment?", tags: ["conversion", "propensity"], metric_key: "conversion_propensity", chart_type: "scatter", sql_or_fn: "conversionPropensity", followup1: "Targeting rules", followup2: "Channel mix" },
  { id: 60, question: "Forecast incremental margin impact of planned promotions Q2?", tags: ["forecast", "margin"], metric_key: "margin_forecast", chart_type: "waterfall", sql_or_fn: "marginForecast", followup1: "Scenario analysis", followup2: "Budget allocation" },
  { id: 61, question: "Predict promotion fatigue point by customer segment?", tags: ["fatigue", "predictive"], metric_key: "fatigue_prediction", chart_type: "line", sql_or_fn: "fatiguePrediction", followup1: "Optimal frequency", followup2: "Refresh strategy" },
  { id: 62, question: "Anomaly detection: which promotions deviate from expected patterns?", tags: ["anomaly", "detection"], metric_key: "anomaly_detection", chart_type: "scatter", sql_or_fn: "anomalyDetection", followup1: "Root cause analysis", followup2: "Correction plan" },
  { id: 63, question: "Trend analysis: are promotion returns improving or declining?", tags: ["trend", "analytics"], metric_key: "trend_analysis", chart_type: "line", sql_or_fn: "trendAnalysis", followup1: "By category", followup2: "Action items" },
  { id: 64, question: "Cross-category cannibalization forecast for upcoming campaigns?", tags: ["cannibalization", "forecast"], metric_key: "cannibal_forecast", chart_type: "waterfall", sql_or_fn: "cannibalForecast", followup1: "Mitigation strategy", followup2: "Timing adjustments" },
  { id: 65, question: "Predict optimal promotion mix to maximize portfolio ROI?", tags: ["optimization", "portfolio"], metric_key: "portfolio_optimization", chart_type: "combo", sql_or_fn: "portfolioOptimization", followup1: "Budget constraints", followup2: "Risk-adjusted" },
  { id: 66, question: "Customer acquisition propensity score by promotion offer?", tags: ["acquisition", "propensity"], metric_key: "acquisition_propensity", chart_type: "bar", sql_or_fn: "acquisitionPropensity", followup1: "New customer offers", followup2: "CAC optimization" },
  { id: 67, question: "Forecast store-level performance variance for next campaign?", tags: ["forecast", "variance"], metric_key: "store_variance_forecast", chart_type: "scatter", sql_or_fn: "storeVarianceForecast", followup1: "Localization needs", followup2: "Resource allocation" },
  { id: 68, question: "Predictive LTV by promo exposure: heavy vs light promotion users?", tags: ["ltv", "exposure"], metric_key: "ltv_by_exposure", chart_type: "bar", sql_or_fn: "ltvByExposure", followup1: "Optimal exposure", followup2: "Segment strategy" },
  { id: 69, question: "Time series forecast: when will promotion ROI peak this year?", tags: ["forecast", "timing"], metric_key: "roi_peak_forecast", chart_type: "line", sql_or_fn: "roiPeakForecast", followup1: "Calendar optimization", followup2: "Budget timing" },
  { id: 70, question: "Predict incremental units by promotion depth: 10% vs 20% vs 30%?", tags: ["forecast", "depth"], metric_key: "depth_forecast", chart_type: "line", sql_or_fn: "depthForecast", followup1: "Margin comparison", followup2: "Break-even analysis" }
];

export const popularQuestionIds = [1, 3, 4, 6, 11, 14, 20, 50, 51, 52, 58, 65];
