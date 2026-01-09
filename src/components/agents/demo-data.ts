import { Problem, Action, Guardrails, ExpectedROI, RealizedROI, AuditEntry, Run, Playbook, ROIStats, TopResult } from './types';

export const demoProblems: Problem[] = [
  {
    id: 'prob-001',
    title: 'Stockout risk: 18 SKUs in 48h',
    modules: ['supply', 'forecast'],
    impact: 18.4,
    urgency: 'now',
    confidence: 'high',
    sla: '6h',
    owner: 'Supply',
    status: 'new',
    summary: 'Critical inventory shortfall detected across 18 high-velocity SKUs. Projected stockout within 48 hours will impact ₹18.4L in daily revenue.',
    whyNow: [
      'Demand spike: +34% vs forecast (last 72h)',
      'Lead time delay: 2 suppliers at +3 days',
      'Safety stock depleted in 4 DCs'
    ],
    rootCauses: [
      'Forecast model underestimated promotional lift',
      'Supplier capacity constrained due to raw material shortage',
      'Reorder point too low for current velocity',
      'Cross-docking delays at Mumbai hub',
      'Seasonal demand pattern not captured'
    ],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 'prob-002',
    title: 'Promo burn: 2 campaigns negative ROI',
    modules: ['promo', 'pricing'],
    impact: 9.2,
    urgency: '24h',
    confidence: 'med',
    sla: '12h',
    owner: 'Marketing',
    status: 'investigating',
    summary: 'Two active campaigns showing negative incremental ROI. Continuing will erode ₹9.2L in margin this week.',
    whyNow: [
      'Week 2 performance: -12% vs baseline',
      'Cannibalization detected in adjacent categories',
      'Competitor matched pricing within 24h'
    ],
    rootCauses: [
      'Discount depth exceeds price elasticity threshold',
      'Target segment overlap with loyalty program',
      'Timing conflict with competitor event',
      'Inventory constraints limiting featured SKU availability'
    ],
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
  },
  {
    id: 'prob-003',
    title: 'Price index drift: 42 SKUs overpriced',
    modules: ['pricing'],
    impact: 12.7,
    urgency: '24h',
    confidence: 'high',
    sla: '8h',
    owner: 'Pricing',
    status: 'new',
    summary: '42 SKUs now 8-15% above competitive index. Conversion rate dropped 23% on these items.',
    whyNow: [
      'Competitor price cuts: 3 major retailers',
      'Conversion drop: -23% WoW on affected SKUs',
      'Price perception score: -8 pts'
    ],
    rootCauses: [
      'Delayed competitive intelligence refresh',
      'Cost-plus rules overriding market signals',
      'Brand minimum pricing constraints outdated',
      'Regional price zones not aligned'
    ],
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
  },
  {
    id: 'prob-004',
    title: 'Forecast error spike: West region',
    modules: ['forecast', 'supply'],
    impact: 6.1,
    urgency: '7d',
    confidence: 'med',
    sla: '24h',
    owner: 'Planning',
    status: 'new',
    summary: 'MAPE increased to 28% in West region, up from 12% baseline. Causing both stockouts and excess.',
    whyNow: [
      'MAPE spike: 28% vs 12% baseline',
      'New store openings changed demand patterns',
      'Weather anomaly not in model features'
    ],
    rootCauses: [
      'Model not retrained after store network expansion',
      'Missing weather feature in forecast model',
      'Local event calendar not integrated',
      'Demand transfer between channels not captured'
    ],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    id: 'prob-005',
    title: 'Space productivity drop: 12 stores',
    modules: ['space', 'assortment'],
    impact: 4.9,
    urgency: '7d',
    confidence: 'low',
    sla: '48h',
    owner: 'Merchandising',
    status: 'new',
    summary: 'Sales per sq.ft. declined 18% in 12 underperforming stores. Planogram compliance issues detected.',
    whyNow: [
      'Sales/sqft: -18% vs chain average',
      'Planogram compliance: 67% (target 95%)',
      'Eye-level placement misalignment'
    ],
    rootCauses: [
      'Outdated planograms not reflecting local demand',
      'Fixture utilization below optimal',
      'Category adjacency rules violated',
      'Seasonal transition delay'
    ],
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
  },
  {
    id: 'prob-006',
    title: 'Assortment gap: missing search intents',
    modules: ['assortment'],
    impact: 8.3,
    urgency: '7d',
    confidence: 'med',
    sla: '72h',
    owner: 'Category',
    status: 'awaiting_approval',
    summary: 'Top 15 search terms have no matching products. Estimated ₹8.3L weekly opportunity loss.',
    whyNow: [
      'Search-to-sale conversion: 0% on top terms',
      'Competitor assortment expansion detected',
      'Customer reviews mentioning missing items'
    ],
    rootCauses: [
      'Search intent data not in assortment planning',
      'Vendor onboarding bottleneck',
      'Private label gaps in trending categories',
      'Range review cycle too long'
    ],
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000)
  },
  {
    id: 'prob-007',
    title: 'Markdown timing: 156 SKUs aging',
    modules: ['pricing', 'supply'],
    impact: 5.7,
    urgency: '24h',
    confidence: 'high',
    sla: '12h',
    owner: 'Pricing',
    status: 'new',
    summary: '156 SKUs approaching end-of-life with 8+ weeks of stock. Early markdown can recover ₹5.7L.',
    whyNow: [
      'Stock age: 8+ weeks for 156 SKUs',
      'Sell-through: 23% vs 60% target',
      'Season transition in 3 weeks'
    ],
    rootCauses: [
      'Initial buy quantity overestimated',
      'Markdown triggers not automated',
      'Style/color mix mismatch with demand',
      'Returns adding to aged inventory'
    ],
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
  },
  {
    id: 'prob-008',
    title: 'Vendor performance: 3 suppliers at risk',
    modules: ['supply'],
    impact: 7.8,
    urgency: '7d',
    confidence: 'med',
    sla: '48h',
    owner: 'Supply',
    status: 'new',
    summary: '3 key suppliers showing declining fill rates and quality issues. Supply continuity at risk.',
    whyNow: [
      'Fill rate: 72% vs 95% SLA',
      'Quality rejections: +140% MoM',
      'Lead time variance: +5 days avg'
    ],
    rootCauses: [
      'Supplier capacity overcommitted',
      'Quality control process breakdown',
      'Raw material sourcing issues',
      'Communication gaps in order management'
    ],
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000)
  }
];

export const demoActions: Record<string, Action[]> = {
  'prob-001': [
    { id: 'act-1', title: 'Trigger emergency PO for top 8 SKUs', upliftMin: 6.2, upliftMax: 8.1, risk: 'low', guardrailViolations: [], included: true },
    { id: 'act-2', title: 'Activate backup supplier for 5 SKUs', upliftMin: 3.8, upliftMax: 5.2, risk: 'med', guardrailViolations: [], included: true },
    { id: 'act-3', title: 'Redistribute stock from low-velocity stores', upliftMin: 2.1, upliftMax: 3.4, risk: 'low', guardrailViolations: [], included: true },
    { id: 'act-4', title: 'Enable substitute product recommendations', upliftMin: 1.2, upliftMax: 2.0, risk: 'low', guardrailViolations: [], included: false },
    { id: 'act-5', title: 'Temporarily increase reorder points +20%', upliftMin: 0.8, upliftMax: 1.5, risk: 'med', guardrailViolations: ['Exceeds inventory floor by 5%'], included: false }
  ],
  'prob-002': [
    { id: 'act-1', title: 'Reduce discount depth from 25% to 15%', upliftMin: 4.2, upliftMax: 5.8, risk: 'med', guardrailViolations: [], included: true },
    { id: 'act-2', title: 'Shift promo to loyalty-exclusive', upliftMin: 2.1, upliftMax: 3.5, risk: 'low', guardrailViolations: [], included: true },
    { id: 'act-3', title: 'Pause underperforming campaign', upliftMin: 1.8, upliftMax: 2.4, risk: 'low', guardrailViolations: [], included: true },
    { id: 'act-4', title: 'Reallocate budget to high-margin categories', upliftMin: 1.1, upliftMax: 1.9, risk: 'low', guardrailViolations: [], included: false }
  ],
  'prob-003': [
    { id: 'act-1', title: 'Match competitor prices on 20 key SKUs', upliftMin: 5.8, upliftMax: 7.2, risk: 'med', guardrailViolations: [], included: true },
    { id: 'act-2', title: 'Bundle with accessories for value perception', upliftMin: 2.4, upliftMax: 3.8, risk: 'low', guardrailViolations: [], included: true },
    { id: 'act-3', title: 'Apply price zone optimization', upliftMin: 1.9, upliftMax: 2.8, risk: 'low', guardrailViolations: [], included: true },
    { id: 'act-4', title: 'Negotiate brand minimum price reduction', upliftMin: 1.2, upliftMax: 2.1, risk: 'high', guardrailViolations: ['Requires brand approval'], included: false }
  ]
};

export const defaultGuardrails: Guardrails = {
  maxPriceChange: 15,
  minMargin: 12,
  vendorFundingCap: 500000,
  inventoryFloor: 2,
  serviceLevelTarget: 95,
  premiumBrandNoDiscount: true
};

export const demoExpectedROI: Record<string, ExpectedROI> = {
  'prob-001': {
    revenueUplift: 14.2,
    marginImpact: 2.8,
    costImpact: -0.4,
    confidence: 82,
    assumptions: ['Elasticity stable', 'Lead time 2d', 'No competitor action']
  },
  'prob-002': {
    revenueUplift: 7.8,
    marginImpact: 3.2,
    costImpact: 0.2,
    confidence: 68,
    assumptions: ['Cannibalization stops', 'Customer retention', 'No price war']
  },
  'prob-003': {
    revenueUplift: 10.1,
    marginImpact: -1.2,
    costImpact: 0,
    confidence: 78,
    assumptions: ['Conversion recovery', 'Competitor stable', 'Elasticity holds']
  }
};

export const demoAuditLog: AuditEntry[] = [
  { id: 'aud-1', timestamp: new Date(Date.now() - 30 * 60 * 1000), user: 'System', action: 'Problem detected', details: 'Discovery Agent identified stockout risk' },
  { id: 'aud-2', timestamp: new Date(Date.now() - 25 * 60 * 1000), user: 'System', action: 'Root cause analysis', details: 'Diagnosis Agent completed in 2.3s' },
  { id: 'aud-3', timestamp: new Date(Date.now() - 20 * 60 * 1000), user: 'System', action: 'Actions generated', details: 'Planner Agent proposed 5 actions' },
  { id: 'aud-4', timestamp: new Date(Date.now() - 15 * 60 * 1000), user: 'Priya S.', action: 'Viewed problem', details: 'Opened workspace' },
  { id: 'aud-5', timestamp: new Date(Date.now() - 10 * 60 * 1000), user: 'Priya S.', action: 'Modified guardrails', details: 'Changed max price change to 12%' }
];

export const demoRuns: Run[] = [
  {
    id: 'run-001',
    problemId: 'prob-prev-1',
    problemTitle: 'Stockout prevention: Electronics',
    playbook: 'Stockout Prevention',
    scope: 'North Region • Electronics',
    status: 'completed',
    approvals: ['Rahul M.', 'Supply Team'],
    startedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    eta: '—',
    result: '+₹12.4L recovered',
    actions: ['Emergency PO triggered', 'Stock redistributed', 'Backup supplier activated'],
    systemsTouched: ['OMS', 'WMS', 'Supplier Portal'],
    canRollback: false,
    notes: ['Completed ahead of schedule', 'Supplier responded within 4h']
  },
  {
    id: 'run-002',
    problemId: 'prob-prev-2',
    problemTitle: 'Price index correction: Apparel',
    playbook: 'Price Index Drift Fix',
    scope: 'All Regions • Apparel',
    status: 'running',
    approvals: ['Amit K.'],
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    eta: '4h remaining',
    result: undefined,
    actions: ['Price updates pushed', 'Competitive monitoring active'],
    systemsTouched: ['PIM', 'Ecom Platform', 'Store POS'],
    canRollback: true,
    notes: ['62% of stores updated']
  },
  {
    id: 'run-003',
    problemId: 'prob-prev-3',
    problemTitle: 'Promo optimization: FMCG',
    playbook: 'Promo Waste Reduction',
    scope: 'West Region • FMCG',
    status: 'pending',
    approvals: [],
    startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    eta: 'Awaiting approval',
    result: undefined,
    actions: ['Discount adjustment pending', 'Segment targeting ready'],
    systemsTouched: ['Campaign Manager', 'CRM'],
    canRollback: true,
    notes: ['Waiting for marketing approval']
  }
];

export const demoPlaybooks: Playbook[] = [
  {
    id: 'pb-001',
    name: 'Stockout Prevention',
    description: 'Proactively detect and prevent stockouts before they impact sales',
    icon: '📦',
    triggerConditions: ['Days of supply < 3', 'Velocity spike > 25%', 'Supplier delay detected'],
    dataRequired: ['Inventory levels', 'Demand forecast', 'Supplier lead times', 'PO status'],
    defaultActions: ['Trigger emergency PO', 'Activate backup supplier', 'Redistribute stock', 'Enable substitutes'],
    defaultGuardrails: { inventoryFloor: 2, serviceLevelTarget: 95 },
    approvalPolicy: 'Auto-approve if impact < ₹5L and risk = Low',
    roiMethod: 'Avoided stockout revenue + margin preservation',
    gradient: 'from-blue-500/10 to-cyan-500/10'
  },
  {
    id: 'pb-002',
    name: 'Promo Waste Reduction',
    description: 'Identify and fix promotions with negative or low ROI',
    icon: '🎯',
    triggerConditions: ['Promo ROI < 1.0', 'Cannibalization > 15%', 'Baseline erosion detected'],
    dataRequired: ['Promotion performance', 'Baseline sales', 'Customer segments', 'Competitor promos'],
    defaultActions: ['Adjust discount depth', 'Narrow targeting', 'Pause campaign', 'Reallocate budget'],
    defaultGuardrails: { minMargin: 12 },
    approvalPolicy: 'Requires Marketing approval',
    roiMethod: 'Incremental margin improvement',
    gradient: 'from-orange-500/10 to-amber-500/10'
  },
  {
    id: 'pb-003',
    name: 'Price Index Drift Fix',
    description: 'Detect and correct competitive price positioning issues',
    icon: '💰',
    triggerConditions: ['Price index > 105', 'Conversion drop > 10%', 'Competitor price change'],
    dataRequired: ['Competitor prices', 'Price elasticity', 'Conversion rates', 'Margin data'],
    defaultActions: ['Match key SKUs', 'Bundle for value', 'Zone optimization', 'Vendor negotiation'],
    defaultGuardrails: { maxPriceChange: 15, minMargin: 12 },
    approvalPolicy: 'Auto-approve if margin > 15%',
    roiMethod: 'Conversion recovery × margin',
    gradient: 'from-green-500/10 to-emerald-500/10'
  },
  {
    id: 'pb-004',
    name: 'Markdown Timing Optimizer',
    description: 'Optimize markdown timing to maximize recovery on aging inventory',
    icon: '⏰',
    triggerConditions: ['Stock age > 6 weeks', 'Sell-through < 40%', 'Season end approaching'],
    dataRequired: ['Stock age', 'Sell-through rates', 'Demand forecast', 'Margin by SKU'],
    defaultActions: ['Progressive markdown', 'Bundle clearance', 'Channel shift', 'Outlet routing'],
    defaultGuardrails: { minMargin: 5 },
    approvalPolicy: 'Auto-approve for clearance items',
    roiMethod: 'Recovery vs aged inventory write-off',
    gradient: 'from-purple-500/10 to-pink-500/10'
  },
  {
    id: 'pb-005',
    name: 'Assortment Gap Finder',
    description: 'Identify and fill assortment gaps based on demand signals',
    icon: '🔍',
    triggerConditions: ['Search-no-result > 100/day', 'Competitor has item', 'Review mentions'],
    dataRequired: ['Search data', 'Competitor assortment', 'Customer reviews', 'Vendor catalog'],
    defaultActions: ['Identify gaps', 'Source from vendors', 'Fast-track onboarding', 'Private label opportunity'],
    defaultGuardrails: {},
    approvalPolicy: 'Requires Category Manager approval',
    roiMethod: 'New item sales - sourcing cost',
    gradient: 'from-indigo-500/10 to-violet-500/10'
  }
];

export const demoROIStats: ROIStats = {
  totalROI: 284.6,
  roiThisWeek: 42.3,
  successRate: 87,
  avgTimeToAction: '4.2h'
};

export const demoTopResults: TopResult[] = [
  { id: 'win-1', title: 'Electronics stockout prevention', roi: 18.4, learning: 'Early detection key - 48h window optimal', isWin: true },
  { id: 'win-2', title: 'FMCG promo optimization', roi: 12.7, learning: 'Loyalty-exclusive promos 2x more efficient', isWin: true },
  { id: 'win-3', title: 'Apparel price correction', roi: 9.8, learning: 'Zone pricing recovered margin without volume loss', isWin: true },
  { id: 'miss-1', title: 'Home decor markdown timing', roi: -2.1, learning: 'Started too late - 4 week minimum buffer needed', isWin: false },
  { id: 'miss-2', title: 'Beauty assortment expansion', roi: -0.8, learning: 'Vendor onboarding delays missed trend window', isWin: false }
];

export const demoModelUpdates = [
  'Price elasticity model retrained with Q4 data (+3% accuracy)',
  'Added weather feature to demand forecast (West region)',
  'Updated competitive response lag from 48h to 24h'
];

export const demoGuardrailSuggestion = {
  title: 'Suggested: Lower max price change to 12%',
  reason: 'Last 3 runs with >15% change showed customer pushback'
};
