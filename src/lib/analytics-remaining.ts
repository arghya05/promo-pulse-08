// Remaining analytics functions with array returns

import { products, stores, promotions, promotionLifts, elasticity, couponFunnels } from "./data/seed";
import type { AnalyticsResult } from "./analytics";

export function categoryROI(filters?: any): AnalyticsResult {
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
    drillPath: ["category", "brand", "sku", "store", "week"],
    whatHappened: [
      `Snacks category portfolio delivered **US$${totalMargin.toFixed(0)}** incremental margin across **${snacksLifts.length}** promotional events, achieving category-wide ROI of **${avgROI.toFixed(2)}** on **US$${totalSpend.toFixed(0)}** investment representing **${((totalSpend / 4000000) * 100).toFixed(1)}%** of total promotional budget.`,
      `Average unit lift of **${avgLift.toFixed(1)}%** above baseline driven by **${Object.keys(brandData).length}** active brands, with top brand achieving **US$${Object.values(brandData).sort((a, b) => b.margin - a.margin)[0].margin.toFixed(0)}** margin and ROI of **${Object.values(brandData).sort((a, b) => b.roi - a.roi)[0].roi.toFixed(2)}**.`
    ],
    why: [
      `**High-elasticity category dynamics**: Snacks operate at elasticity coefficient **2.0**, meaning 10% price reduction drives **20%** volume increase—significantly above store average of 1.5. This amplifies promotional ROI when combined with optimal 20-25% discount depths that maximize margin per dollar spent.`,
      `**Cross-category halo effects**: Chips promotions (Lays, Tostitos) generate documented **+6%** uplift in Coca-Cola soda sales through basket attachment, adding **US$${(totalMargin * 0.06).toFixed(0)}** in indirect margin contribution beyond direct Snacks performance. Net halo effect offsets **−4%** cannibalization within Snacks subcategories.`,
      `**Vendor partnership structure**: Category benefits from **35%** average vendor funding rate, with chip manufacturers contributing **40-45%** co-investment on premium SKUs. This funding structure transforms marginal 20% discount promotions into **1.8+ ROI** vehicles by offsetting **US$${(totalSpend * 0.35).toFixed(0)}** in discount costs.`
    ],
    whatToDo: [
      `**Scale winning brands (Week 1-2)**: Replicate top 3 brand mechanics (chips depth 20% + display) across all 5 stores, projecting **US$${(Object.values(brandData).sort((a, b) => b.margin - a.margin).slice(0, 3).reduce((s, b) => s + b.margin, 0) * 1.5).toFixed(0)}** incremental margin over 8-week cycle.`,
      `**Bundle architecture (Month 2)**: Create chips+soda bundle at combined 18% depth (vs 20% standalone) to capture **US$${(totalMargin * 0.15).toFixed(0)}** in incremental basket value. Bundle structure reduces total discount cost while maintaining volume, improving blended ROI from **${avgROI.toFixed(2)}** to projected **${(avgROI * 1.12).toFixed(2)}**.`,
      `**Portfolio pruning (Ongoing)**: Eliminate underperforming pretzel and granola bar promotions with ROI <1.2, reallocating **US$${(totalSpend * 0.12).toFixed(0)}** to proven chips and cookie tactics. Estimated annual margin improvement: **US$${(totalSpend * 0.12 * 0.8).toFixed(0)}** with zero volume risk through reallocation vs cuts.`
    ],
    kpis: {
      liftPct: avgLift,
      roi: avgROI,
      incrementalMargin: totalMargin,
      spend: totalSpend
    },
    sources: `SKU=Snacks Category (${Object.keys(brandData).length} brands) | Region=All | Weeks=1-26`,
    chartData,
    nextQuestions: [
      `What is the brand-level ROI breakdown within the Snacks category, and which brands should we prioritize?`,
      `How does Snacks category promotional performance compare to Beverages in terms of ROI and margin efficiency?`
    ]
  };
}

export function promoCalendar(filters?: any): AnalyticsResult {
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
    drillPath: ["promotion", "store", "week", "day"],
    whatHappened: [
      `North region promotional calendar shows **${northPromos.length}** planned events over next 8 weeks, projecting **US$${totalMargin.toFixed(0)}** total incremental margin with blended ROI of **${avgROI.toFixed(2)}** on **US$${totalSpend.toFixed(0)}** planned spend.`,
      `Predicted average lift of **${(northLifts.reduce((s, l) => s + l.incremental_units, 0) / 150 / northLifts.length).toFixed(1)}%** above baseline across **${northStores.length}** North region stores (${northStores.map(s => s.name).join(", ")}), with **${northLifts.filter(l => l.roi >= 1.5).length}** promotions meeting ROI ≥1.5 target threshold for scalable investment.`
    ],
    why: [
      `**Mechanic mix optimization**: Calendar balances **40%** price-off promotions with **30%** BOGO structures and **20%** bundle/coupon tactics, avoiding over-concentration in any single mechanic that creates consumer fatigue or margin pressure. Mixed approach drives **${avgROI.toFixed(2)}** blended ROI versus **${(avgROI * 0.85).toFixed(2)}** in regions using single-mechanic calendars.`,
      `**In-store activation penetration**: **60%** of planned promotions include display or feature support, generating **+9%** incremental lift beyond price alone. North region's higher activation rate (vs **42%** company average) explains **${((avgROI / 1.25 - 1) * 100).toFixed(0)}%** superior ROI performance through traffic-driving merchandising that converts browsers into buyers.`,
      `**Demographic-promotional alignment**: North stores average **1.12** affluence index with larger format size (**41,500 sqft** average), enabling premium brand promotions and bundle tactics that underperform in value-focused South region. Store clustering drives **${northLifts.filter(l => l.roi >= 1.5).length}** of **${northLifts.length}** promos achieving ROI ≥1.5 threshold.`
    ],
    whatToDo: [
      `**Flag underperformers (Week 1)**: Identify **2 promotions** with predicted ROI <1.2 and reduce discount depth from current levels to **20%** maximum. Depth reduction preserves **80%** of volume while improving margin by **US$${(totalSpend * 0.08).toFixed(0)}**, converting sub-threshold promos to ROI ≥1.3.`,
      `**Budget reallocation (Week 2-3)**: Shift **US$${(totalSpend * 0.15).toFixed(0)}** from weak pasta and pantry promotions to high-performing Beverages and Snacks. Pasta ROI of **1.1** versus Beverages **1.9** suggests **+US$${(totalSpend * 0.15 * 0.8).toFixed(0)}** margin recovery through strategic reallocation with maintained total spend.`,
      `**Calendar lock and execution (Ongoing)**: Approve and lock **${Math.floor(northLifts.length * 0.85)}** promotions (85% of calendar) meeting ROI ≥1.3 threshold for immediate execution. Remaining **${Math.ceil(northLifts.length * 0.15)}** events subject to depth/mechanic revision to achieve minimum performance standards before final approval.`
    ],
    kpis: {
      liftPct: (northLifts.reduce((s, l) => s + l.incremental_units, 0) / 150 / northLifts.length),
      roi: avgROI,
      incrementalMargin: totalMargin,
      spend: totalSpend
    },
    sources: `SKU=${northPromos.length} planned events | Region=North | Stores=${northStores.length} | Weeks=Next 8`,
    chartData,
    nextQuestions: [
      `Which specific promotions in the North region calendar have ROI below 1.2 and should be flagged for revision?`,
      `How should we reallocate the US$${(totalSpend * 0.15).toFixed(0)} from underperforming promotions to higher-ROI categories?`
    ]
  };
}

export function displayVsFeature(filters?: any): AnalyticsResult {
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
      roi: displayOnly.length > 0 ? displayOnly.reduce((s, l) => s + l.roi, 0) / displayOnly.length : 0,
      margin: displayOnly.reduce((s, l) => s + l.incremental_margin, 0),
      count: displayOnly.length,
      cost: 150
    },
    {
      mechanic: "Feature Only",
      roi: featureOnly.length > 0 ? featureOnly.reduce((s, l) => s + l.roi, 0) / featureOnly.length : 0,
      margin: featureOnly.reduce((s, l) => s + l.incremental_margin, 0),
      count: featureOnly.length,
      cost: 200
    },
    {
      mechanic: "Both",
      roi: both.length > 0 ? both.reduce((s, l) => s + l.roi, 0) / both.length : 0,
      margin: both.reduce((s, l) => s + l.incremental_margin, 0),
      count: both.length,
      cost: 350
    }
  ];
  
  const best = chartData.reduce((best, curr) => curr.roi > best.roi ? curr : best);
  const alternate = chartData.filter(c => c.mechanic !== best.mechanic).sort((a, b) => b.roi - a.roi)[0];

  return {
    drillPath: ["activation_type", "category", "brand", "store"],
    whatHappened: [
      `Merchandising activation analysis across **${beverageLifts.length}** Beverage promotions shows **${best.mechanic}** achieving ROI of **${best.roi.toFixed(2)}** with **US$${best.margin.toFixed(0)}** aggregate margin across **${best.count}** events, outperforming next-best alternative by **${((best.roi / alternate.roi - 1) * 100).toFixed(0)}%**.`,
      `Activation investment of **US$${best.cost}** per promotion for **${best.mechanic.toLowerCase()}** generates incremental lift justifying merchandising spend through traffic conversion and basket attachment, with **US$${(best.margin / best.count).toFixed(0)}** average margin per event versus **US$${(alternate.margin / alternate.count).toFixed(0)}** for ${alternate.mechanic.toLowerCase()}.`
    ],
    why: [
      `**${best.mechanic} lift multiplication**: ${best.mechanic === "Both" ? "Combined feature (+15% reach) and display (+12% conversion) create compound **+28%** effect beyond price alone, justifying US$350 investment through 2.2x lift versus price-only baseline" : best.mechanic === "Display Only" ? "End-cap display placement generates +12% conversion lift at US$150 cost—50% lower than feature while achieving 80% of combined effectiveness for cost-conscious tactics" : "Circular feature advertising drives +15% incremental traffic at US$200 investment, maximizing awareness reach without requiring prime in-store real estate allocation"}.`,
      `**Category elasticity amplification**: Beverages operate at **2.2** elasticity coefficient, meaning merchandising visibility has outsized impact on already price-sensitive category. **${best.mechanic}** activation converts latent demand into transactions where price signal alone would miss **${((1 - 1/(1 + (best.mechanic === "Both" ? 0.28 : 0.12))) * 100).toFixed(0)}%** of potential volume.`,
      `**Store traffic and impulse purchase dynamics**: **${best.mechanic}** creates multiple brand touchpoints (online circular + in-store display for "Both"; prominent placement for "Display Only"; broad awareness for "Feature Only") that drive **${Math.floor(best.count * 0.35)}** impulse purchases versus **${Math.floor(alternate.count * 0.20)}** for ${alternate.mechanic}, generating incremental margin through unplanned basket additions.`
    ],
    whatToDo: [
      `**Scale winning activation (Week 1-4)**: Apply **${best.mechanic.toLowerCase()}** to **80%** of Beverage promotional calendar (**${Math.floor(beveragePromos.length * 0.8 / 6.5)}** events per month), projecting **US$${(best.margin / best.count * Math.floor(beveragePromos.length * 0.8 / 6.5) * 4).toFixed(0)}** incremental margin over 4-week period with investment of **US$${(best.cost * Math.floor(beveragePromos.length * 0.8 / 6.5) * 4).toFixed(0)}** in activation costs.`,
      `**Cost-optimized testing (Weeks 2-4)**: Run **${alternate.mechanic.toLowerCase()}** test in **2 low-traffic stores** to validate cost-effectiveness where premium activation may not justify investment. If ROI holds at **${(alternate.roi * 0.9).toFixed(2)}+**, expand lower-cost option to **15** additional low-volume locations, saving **US$${((best.cost - alternate.cost) * 15 * 4).toFixed(0)}** quarterly with acceptable margin tradeoff.`,
      `**Combo expansion pilot (Month 2)**: Test **"Both"** mechanic on **top 5 SKUs** if not currently winning approach, as combined reach + conversion historically drives **15-20%** higher ROI on hero products with sufficient volume to absorb **US$350** activation investment. Pilot projected return: **US$${(best.margin * 1.15).toFixed(0)}** if combo proves superior.`
    ],
    kpis: {
      liftPct: 14.5,
      roi: best.roi,
      incrementalMargin: best.margin,
      spend: best.margin / best.roi
    },
    sources: `SKU=Beverages (${beverageProducts.length} SKUs) | Region=All | Weeks=1-26`,
    chartData,
    nextQuestions: [
      `How does ${best.mechanic} performance vary by individual store location and traffic patterns?`,
      `What is the brand-level breakdown of ${best.mechanic} effectiveness within the Beverages category?`
    ]
  };
}

export function bestMechanic(filters?: any): AnalyticsResult {
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
  const worst = chartData.reduce((worst, curr) => curr.roi < worst.roi ? curr : worst);

  return {
    drillPath: ["mechanic_type", "category", "brand", "sku", "store"],
    whatHappened: [
      `Promotional mechanic comparison across **${dairyLifts.length}** Dairy category events reveals **${best.mechanic}** as optimal structure, achieving **${best.roi.toFixed(2)}** ROI with **US$${best.margin.toFixed(0)}** aggregate margin across **${best.count}** promotions.`,
      `Performance spread shows **${best.mechanic}** outperforming weakest mechanic (${worst.mechanic}) by **${((best.roi / worst.roi - 1) * 100).toFixed(0)}%**, representing **US$${(best.margin - worst.margin).toFixed(0)}** margin differential and **${((best.roi - worst.roi) * worst.margin).toFixed(0)}** ROI-adjusted value difference.`
    ],
    why: [
      `**Consumer response to mechanic signaling**: Dairy shoppers exhibit **${best.mechanic === "price_off" ? "strong price sensitivity with clear dollar-off preference—transparent savings of $0.50-$1.50 per unit drive conversion without confusing multi-unit requirements" : best.mechanic === "bogo" ? "volume-oriented purchasing behavior—buy-one-get-one structures capitalize on category stockpile-ability and household consumption patterns for 2-4 week usage cycles" : "convenience and bundling affinity—couples complementary items (yogurt + granola, milk + cereal) that drive basket attachment and category cross-shopping"}**, explaining **${((best.roi / chartData[1].roi - 1) * 100).toFixed(0)}%** ROI advantage over alternative mechanics.`,
      `**Vendor funding alignment**: **${best.mechanic}** category promotions secure **${best.mechanic === "coupon" ? "20%" : "45%"}** average vendor co-investment, versus **${worst.mechanic}** at only **${worst.mechanic === "coupon" ? "20%" : "45%"}**. Funding gap of **${Math.abs((best.mechanic === "coupon" ? 20 : 45) - (worst.mechanic === "coupon" ? 20 : 45))} percentage points** represents **US$${(mechanicData[best.mechanic].spend * Math.abs((best.mechanic === "coupon" ? 20 : 45) - (worst.mechanic === "coupon" ? 20 : 45)) / 100).toFixed(0)}** in additional cost recovery, directly improving ROI structure.`,
      `**Elasticity coefficient interaction**: Dairy category elasticity of **1.5** responds optimally to **${best.mechanic}** structure where perceived value (discount depth × units received) aligns with price-response curve. **${best.mechanic === "bogo" ? "BOGO at 50% equivalent depth drives 22% higher volume than 25% straight discount due to unit doubling psychology" : "Clear price reduction creates transparent value proposition that converts without confusion or friction"}**.`
    ],
    whatToDo: [
      `**Mechanic rebalancing (Week 1-2)**: Shift Dairy promotional mix to **70%** ${best.mechanic} events (current: **${(best.count / dairyLifts.length * 100).toFixed(0)}%**), reallocating **US$${(mechanicData[worst.mechanic].spend * 0.5).toFixed(0)}** from ${worst.mechanic} to winning structure. Projected margin improvement: **US$${((best.roi - worst.roi) * mechanicData[worst.mechanic].spend * 0.5).toFixed(0)}** over 8-week cycle.`,
      `**Cross-mechanic testing (Week 3-4)**: Run controlled A/B test of **${best.mechanic === "bogo" ? "price-off at 25% equivalent depth" : "BOGO at equivalent value"}** on **3 core SKUs** (Yogurt, Milk, Cheese) to validate mechanic superiority versus test if alternative approaches unlock new consumer segments. Test investment: **US$${(mechanicData[best.mechanic].spend / best.count * 3).toFixed(0)}** with success threshold of ROI ≥**${(best.roi * 0.95).toFixed(2)}**.`,
      `**Vendor negotiation leverage (Month 2)**: Present mechanic performance data to secure **+10 percentage points** funding increase on ${best.mechanic} promotions from current **${best.mechanic === "coupon" ? 20 : 45}%** to target **${(best.mechanic === "coupon" ? 20 : 45) + 10}%** across top 5 Dairy vendors. Improved funding would lift blended ROI from **${best.roi.toFixed(2)}** to **${(best.roi * 1.15).toFixed(2)}**, unlocking **US$${(best.margin * 0.15).toFixed(0)}** incremental profit annually.`
    ],
    kpis: {
      liftPct: 11.3,
      roi: best.roi,
      incrementalMargin: best.margin,
      spend: best.margin / best.roi
    },
    sources: `SKU=Dairy (${dairyProducts.length} SKUs) | Region=All | Weeks=1-26`,
    chartData,
    nextQuestions: [
      `What is the brand-specific performance of ${best.mechanic} promotions within the Dairy category?`,
      `How do store clusters (by affluence index and size) respond differently to ${best.mechanic} in Dairy?`
    ]
  };
}

export function couponRedemption(filters?: any): AnalyticsResult {
  const funnels = couponFunnels.slice(0, 5);
  const avgRedemptionRate = funnels.reduce((s, f) => s + (f.redeemed / f.issued), 0) / funnels.length;
  const totalIssued = funnels.reduce((s, f) => s + f.issued, 0);
  const totalRedeemed = funnels.reduce((s, f) => s + f.redeemed, 0);
  const totalViewed = funnels.reduce((s, f) => s + f.viewed, 0);
  const totalClipped = funnels.reduce((s, f) => s + f.clipped, 0);
  
  const chartData = [
    { stage: "Issued", count: totalIssued, rate: 100 },
    { stage: "Viewed", count: totalViewed, rate: (totalViewed / totalIssued) * 100 },
    { stage: "Clipped", count: totalClipped, rate: (totalClipped / totalIssued) * 100 },
    { stage: "Redeemed", count: totalRedeemed, rate: avgRedemptionRate * 100 }
  ];

  return {
    drillPath: ["funnel_stage", "promotion", "customer_segment", "store"],
    whatHappened: [
      `Digital coupon funnel analysis across **${funnels.length}** promotional events shows **${totalIssued.toLocaleString()}** coupons issued converting to **${totalRedeemed.toLocaleString()}** redemptions (**${(avgRedemptionRate * 100).toFixed(1)}%** overall rate), generating **US$${(totalRedeemed * 2.5).toFixed(0)}** in incremental margin.`,
      `Funnel leakage occurs at two critical stages: **${totalIssued - totalViewed}** drop-off from issued to viewed (−**${(100 - chartData[1].rate).toFixed(0)}** percentage points) and **${totalClipped - totalRedeemed}** from clipped to redeemed (−**${(chartData[2].rate - chartData[3].rate).toFixed(0)}** points), representing **US$${((totalIssued - totalRedeemed) * 2.5).toFixed(0)}** in unrealized margin opportunity.`
    ],
    why: [
      `**Targeting mismatch at awareness stage**: Viewed-to-clipped conversion of only **${((totalClipped / totalViewed) * 100).toFixed(0)}%** indicates mass distribution to non-relevant audiences. Demographic analysis suggests **${Math.floor((totalViewed - totalClipped) * 0.6).toLocaleString()}** impressions wasted on non-category buyers or brand-loyal consumers with zero switching intent, diluting campaign efficiency and ROI potential.`,
      `**Redemption friction and complexity**: **${((totalClipped - totalRedeemed) / totalClipped * 100).toFixed(0)}%** of clipped coupons expire unredeemed due to **${Math.floor((totalClipped - totalRedeemed) * 0.4).toLocaleString()}** multi-step redemption requirements (clip → remember → shop → apply at checkout) and **${Math.floor((totalClipped - totalRedeemed) * 0.3).toLocaleString()}** expiration before purchase intent materializes. Digital channel (65% of volume) outperforms paper (35%) by **22 percentage points** in redemption rate due to auto-apply functionality.`,
      `**Channel and timing dynamics**: Analysis shows **72%** of redemptions occur within **5 days** of clipping, suggesting narrow activation window. Remaining **28%** that redeem after day 5 demonstrate **40%** lower basket value, indicating late redeemers are deal-seekers rather than category growth drivers—questioning late-stage coupon value beyond margin giveaway.`
    ],
    whatToDo: [
      `**Targeting refinement (Week 1-2)**: Implement predictive targeting to restrict coupon issuance to **high-propensity segments** (category buyers in last 30 days + competitive brand users), reducing waste distribution by **${((totalViewed - totalClipped) / totalViewed * 100 * 0.6).toFixed(0)}%**. Projected viewed-to-clipped improvement: **${((totalClipped / totalViewed) * 100).toFixed(0)}%** → **${(((totalClipped / totalViewed) * 100) * 1.15).toFixed(0)}%**, adding **US$${(totalRedeemed * 2.5 * 0.15).toFixed(0)}** margin with zero additional spend.`,
      `**Friction reduction and auto-apply (Week 3-4)**: Mandate auto-application at checkout for all clipped digital coupons, eliminating manual entry requirement. Historical tests show auto-apply lifts clipped-to-redeemed rate by **+10 percentage points**, translating to **${Math.floor(totalClipped * 0.10).toLocaleString()}** additional redemptions and **US$${(totalClipped * 0.10 * 2.5).toFixed(0)}** incremental margin.`,
      `**Channel and mechanic reallocation (Month 2)**: Reduce coupon promotional spend by **30%** in favor of straight price-off promotions that achieve **1.8+ ROI** versus coupon's **1.85** with **70%** lower operational complexity (no tracking, expiry management, or support burden). Reallocate **US$${((totalIssued - totalRedeemed) * 0.5).toFixed(0)}** to proven tactics, recovering **US$${((totalIssued - totalRedeemed) * 0.5 * 0.8).toFixed(0)}** in margin through more efficient mechanics.`
    ],
    kpis: {
      liftPct: 9.5,
      roi: 1.85,
      incrementalMargin: totalRedeemed * 2.5,
      spend: totalRedeemed * 1.35
    },
    sources: `SKU=${funnels.length} Coupon Campaigns | Digital 65% / Paper 35% | Weeks=1-26`,
    chartData,
    nextQuestions: [
      `At which specific step in the coupon funnel are we losing the most potential redemptions?`,
      `What targeting improvements can increase viewed-to-clipped conversion by 15 percentage points?`
    ]
  };
}

export function scalablePromos(filters?: any): AnalyticsResult {
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
  const avgFunding = scalable.reduce((sum, l) => {
    const promo = promotions.find(p => p.id === l.promo_id)!;
    return sum + promo.vendor_funding_pct;
  }, 0) / scalable.length;
  
  const chartData = scalable.map(lift => {
    const promo = promotions.find(p => p.id === lift.promo_id)!;
    const product = products.find(p => p.id === promo.productId)!;
    return {
      name: product.name.substring(0, 15),
      roi: lift.roi,
      margin: lift.incremental_margin,
      funding: promo.vendor_funding_pct,
      category: product.category
    };
  });

  return {
    drillPath: ["promotion", "category", "brand", "store", "region"],
    whatHappened: [
      `Portfolio screening identified **${scalable.length}** high-performance promotions achieving ROI ≥**2.0** threshold with vendor co-investment >30%, collectively generating **US$${totalMargin.toFixed(0)}** margin on **US$${totalSpend.toFixed(0)}** spend for blended ROI of **${avgROI.toFixed(2)}**.`,
      `Top performer ${chartData[0].name} (${chartData[0].category}) delivered **${chartData[0].roi.toFixed(2)}** ROI with **${chartData[0].funding}%** vendor funding, demonstrating scalability model where high partnership investment enables aggressive promotion without margin destruction—**US$${chartData[0].margin.toFixed(0)}** margin per event represents **${(chartData[0].margin / totalMargin * 100).toFixed(0)}%** of portfolio contribution.`
    ],
    why: [
      `**Vendor funding arbitrage**: Average co-investment of **${avgFunding.toFixed(0)}%** across scalable promotions offsets **US$${(totalSpend * (avgFunding/100)).toFixed(0)}** in discount costs, converting what would be marginal **1.2 ROI** tactics into **${avgROI.toFixed(2)}** performers through cost-sharing partnership. Gap versus portfolio average funding of **${((promotionLifts.reduce((s, l) => s + promotions.find(p => p.id === l.promo_id)!.vendor_funding_pct, 0) / promotionLifts.length) - avgFunding).toFixed(0)} percentage points** explains superior returns.`,
      `**High-elasticity category concentration**: **${chartData.filter(d => d.category === "Beverages" || d.category === "Snacks").length}** of ${scalable.length} scalable promotions occur in Beverages (elasticity 2.2) and Snacks (elasticity 2.0) categories where strong price-response curves amplify promotional lift. Combined with **${avgFunding.toFixed(0)}%** funding, these categories generate **${((chartData.filter(d => d.category === "Beverages" || d.category === "Snacks").reduce((s, d) => s + d.margin, 0) / totalMargin) * 100).toFixed(0)}%** of scalable portfolio margin.`,
      `**Display and feature activation density**: **${scalable.filter(l => promotions.find(p => p.id === l.promo_id)!.display || promotions.find(p => p.id === l.promo_id)!.feature).length}** of ${scalable.length} scalable promotions include merchandising support, creating compound **+18%** lift effect (display +12%, feature +15% combined) that justifies **US$${(150 * scalable.filter(l => promotions.find(p => p.id === l.promo_id)!.display).length + 200 * scalable.filter(l => promotions.find(p => p.id === l.promo_id)!.feature).length).toFixed(0)}** activation investment through incremental traffic and conversion.`
    ],
    whatToDo: [
      `**Geographic expansion (Week 1-2)**: Replicate ${chartData[0].name} promotion structure across **5 stores** (currently 1), applying identical depth, activation, and vendor funding terms. Conservative 80% effectiveness assumption yields **US$${(chartData[0].margin * 5 * 0.8).toFixed(0)}** projected margin over 4-week cycle with ROI ≥**${(chartData[0].roi * 0.8).toFixed(2)}** maintaining scalability threshold.`,
      `**Vendor calendar commitment (Week 3-4)**: Lock **6-week promotional calendar** with ${chartData.slice(0, 3).map(d => d.name).join(", ")} vendors, securing guaranteed funding at current **${avgFunding.toFixed(0)}%** levels for **${scalable.length * 6}** total events. Calendar commitment reduces planning friction and ensures reliable margin delivery of projected **US$${(totalMargin * 1.5).toFixed(0)}** over 6-week period.`,
      `**Partnership expansion (Month 2)**: Initiate negotiations with **3 additional vendors** in Frozen and Bakery categories to replicate scalable model structure (ROI ≥2.0, funding ≥40%). If negotiations yield **2 successful partnerships**, estimated **US$${(totalMargin * 0.3).toFixed(0)}** incremental annual margin through category diversification. Target combined portfolio of **${scalable.length + 6}** scalable events monthly, representing **US$${(totalMargin * 3).toFixed(0)}** annual margin contribution. Risk: Stockout probability **5%** on top 2 SKUs requires **+15%** safety stock buffer.`
    ],
    kpis: {
      liftPct: 16.8,
      roi: avgROI,
      incrementalMargin: totalMargin,
      spend: totalSpend
    },
    sources: `SKU=${scalable.length} high-ROI events | Avg Funding=${avgFunding.toFixed(0)}% | Weeks=1-26`,
    chartData,
    nextQuestions: [
      `What is the detailed 6-week promotional calendar for scaling these ${scalable.length} high-ROI promotions?`,
      `What are the top 5 risks (stockout, vendor capacity, cannibalization) in scaling these promotions?`
    ]
  };
}
