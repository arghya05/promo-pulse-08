// Cross-Module Mock Datasets for Agentic Command Center
// These datasets drive the discovery agent's transparent scoring

// === CORE DATA STRUCTURES ===

export interface CrossModuleProblem {
  id: string;
  title: string;
  summary: string;
  modules: ModuleType[];
  impact: number; // in lakhs ₹
  urgency: 'critical' | 'high' | 'medium';
  confidence: number; // 0-100
  timeToImpact: string;
  owner: string;
  status: 'new' | 'investigating' | 'planning' | 'executing' | 'measuring';
  discoveryScore: DiscoveryScore;
  signals: Signal[];
  rootCauses: RootCause[];
  crossModulePlan: CrossModulePlan | null;
  createdAt: Date;
}

export type ModuleType = 'inventory' | 'allocation' | 'promo' | 'pricing' | 'assortment' | 'space' | 'demand' | 'supply';

export interface DiscoveryScore {
  impactScore: number; // 0-40
  urgencyScore: number; // 0-25
  confidenceScore: number; // 0-20
  crossModuleComplexity: number; // 0-15 (more modules = higher priority)
  totalScore: number;
  breakdown: string[];
}

export interface Signal {
  id: string;
  type: 'anomaly' | 'trend' | 'alert' | 'correlation';
  source: string;
  value: string;
  delta: string;
  timestamp: Date;
  confidence: number;
}

export interface RootCause {
  id: string;
  hypothesis: string;
  probability: number;
  evidence: EvidenceLink[];
  affectedModules: ModuleType[];
}

export interface EvidenceLink {
  id: string;
  type: 'data' | 'chart' | 'table' | 'metric';
  title: string;
  source: string;
  snippet?: string;
}

export interface CrossModulePlan {
  id: string;
  name: string;
  description: string;
  expectedROI: number;
  riskScore: number; // 0-1
  effortHours: number;
  actions: CrossModuleAction[];
}

export interface CrossModuleAction {
  id: string;
  module: ModuleType;
  what: string;
  why: string;
  evidenceId: string;
  dependsOn: string[];
  approvalRequired: boolean;
  approvalReason?: string;
  expectedImpact: number;
  timeToImpact: string;
  risk: 'low' | 'medium' | 'high';
  toolCall: ToolCall;
}

export interface ToolCall {
  system: string;
  method: string;
  payload: Record<string, any>;
  expectedResponse: Record<string, any>;
}

// === AGENT DEFINITIONS ===

export type AgentId = 'discovery' | 'signals' | 'entity' | 'anomaly' | 'guardrails' | 'rootcause' | 'planner' | 'risk' | 'executor' | 'roi';

export interface AgentDefinition {
  id: AgentId;
  name: string;
  shortName: string;
  description: string;
  inputsFrom: AgentId[];
  outputArtifact: string;
}

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  { id: 'discovery', name: 'Discovery Agent', shortName: 'A0', description: 'Cross-Merch Radar - ranks plays with transparent scoring', inputsFrom: [], outputArtifact: 'priority_ranking' },
  { id: 'signals', name: 'Signal Collector', shortName: 'A1', description: 'Builds Evidence Pack (tables/snippets/deltas)', inputsFrom: ['discovery'], outputArtifact: 'evidence_pack' },
  { id: 'entity', name: 'Entity Resolver', shortName: 'A2', description: 'Mapping checks + data quality flags', inputsFrom: ['signals'], outputArtifact: 'entity_map' },
  { id: 'anomaly', name: 'Anomaly Detector', shortName: 'A3', description: 'Demand/supply/price/promo anomalies + confidence', inputsFrom: ['entity'], outputArtifact: 'anomaly_report' },
  { id: 'guardrails', name: 'Guardrails Agent', shortName: 'A4', description: 'Margin floor, budget caps, SLA, stock cover, compliance', inputsFrom: ['anomaly'], outputArtifact: 'guardrails_check' },
  { id: 'rootcause', name: 'Root Cause Synthesizer', shortName: 'A5', description: '1-3 hypotheses with probability + evidence links', inputsFrom: ['anomaly', 'guardrails'], outputArtifact: 'hypotheses' },
  { id: 'planner', name: 'Cross-Module Planner (STAR)', shortName: 'A6', description: 'Generates coordinated plans across modules', inputsFrom: ['rootcause', 'guardrails'], outputArtifact: 'cross_module_plan' },
  { id: 'risk', name: 'Risk Checker', shortName: 'A7', description: 'Risk score + "safe to auto-execute?" + why', inputsFrom: ['planner'], outputArtifact: 'risk_assessment' },
  { id: 'executor', name: 'Execution Orchestrator', shortName: 'A8', description: 'Tool calls + retry + rollback suggestion', inputsFrom: ['risk'], outputArtifact: 'execution_log' },
  { id: 'roi', name: 'ROI & Attribution Tracker', shortName: 'A9', description: 'Expected vs realized + attribution confidence', inputsFrom: ['executor'], outputArtifact: 'roi_report' },
];

// === MOCK DATASETS ===

export const mockSalesData = {
  lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000),
  totalTransactions: 847562,
  revenueToday: 4.2, // crores
  topCategories: [
    { name: 'Electronics', revenue: 1.8, growth: -2.3 },
    { name: 'Apparel', revenue: 0.9, growth: 5.1 },
    { name: 'FMCG', revenue: 0.8, growth: -8.2 },
    { name: 'Home', revenue: 0.7, growth: 1.4 },
  ],
};

export const mockInventoryData = {
  lastUpdate: new Date(Date.now() - 1 * 60 * 60 * 1000),
  totalSKUs: 42847,
  stockoutRisk: 18,
  excessStock: 156,
  avgDaysOfSupply: 12.4,
  criticalSKUs: [
    { sku: 'ELEC-TV-55-SAM', name: 'Samsung 55" Smart TV', stock: 12, velocity: 8.4, daysRemaining: 1.4 },
    { sku: 'ELEC-MOB-IPH-15', name: 'iPhone 15 Pro', stock: 24, velocity: 18.2, daysRemaining: 1.3 },
    { sku: 'ELEC-LAP-MAC-M3', name: 'MacBook Air M3', stock: 8, velocity: 5.1, daysRemaining: 1.6 },
  ],
};

export const mockSupplierData = {
  lastUpdate: new Date(Date.now() - 4 * 60 * 60 * 1000),
  activeSuppliers: 284,
  avgLeadTime: 5.2,
  delayedOrders: 12,
  suppliers: [
    { id: 'SUP-001', name: 'Samsung Electronics', leadTime: 7, delayDays: 3, fillRate: 0.72 },
    { id: 'SUP-002', name: 'Apple India', leadTime: 5, delayDays: 2, fillRate: 0.85 },
    { id: 'SUP-003', name: 'LG Electronics', leadTime: 6, delayDays: 0, fillRate: 0.94 },
  ],
};

export const mockForecastData = {
  lastUpdate: new Date(Date.now() - 6 * 60 * 60 * 1000),
  overallMAPE: 14.2,
  regionalMAPE: {
    north: 12.1,
    south: 13.8,
    east: 15.4,
    west: 28.3, // anomaly
  },
  demandSpikes: [
    { category: 'Electronics', region: 'West', spike: 34, vsBaseline: '+34%' },
    { category: 'FMCG', region: 'North', spike: -12, vsBaseline: '-12%' },
  ],
};

export const mockPriceData = {
  lastUpdate: new Date(Date.now() - 3 * 60 * 60 * 1000),
  avgPriceIndex: 102.4,
  overpriced: 42,
  underpriced: 18,
  competitorChanges: [
    { competitor: 'Amazon', changes: 156, avgDelta: -4.2 },
    { competitor: 'Flipkart', changes: 89, avgDelta: -3.1 },
    { competitor: 'Croma', changes: 34, avgDelta: -2.8 },
  ],
};

export const mockPromoData = {
  lastUpdate: new Date(Date.now() - 1 * 60 * 60 * 1000),
  activeCampaigns: 24,
  negativeROI: 2,
  avgROI: 1.42,
  campaigns: [
    { id: 'PROMO-001', name: 'Diwali Electronics Sale', roi: -0.82, spend: 4.2, status: 'active' },
    { id: 'PROMO-002', name: 'FMCG Bundle Offer', roi: -0.34, spend: 2.1, status: 'active' },
    { id: 'PROMO-003', name: 'Apparel Clearance', roi: 2.4, spend: 1.8, status: 'active' },
  ],
};

// === DEMO PROBLEMS ===

export const crossModuleProblems: CrossModuleProblem[] = [
  {
    id: 'cm-001',
    title: 'Stockout risk: 18 SKUs in 48h',
    summary: 'Critical inventory shortfall across 18 high-velocity SKUs. Projected stockout within 48h impacts ₹18.4L daily revenue. Requires coordinated action across Inventory, Allocation, Promo, and Pricing.',
    modules: ['inventory', 'allocation', 'promo', 'pricing'],
    impact: 18.4,
    urgency: 'critical',
    confidence: 87,
    timeToImpact: '48h',
    owner: 'Supply Chain',
    status: 'new',
    discoveryScore: {
      impactScore: 36, // High revenue at risk
      urgencyScore: 24, // Critical timeline
      confidenceScore: 17, // High confidence data
      crossModuleComplexity: 12, // 4 modules
      totalScore: 89,
      breakdown: [
        'Impact: ₹18.4L/day × 2 days = ₹36.8L exposure → 36/40 pts',
        'Urgency: <48h window, critical timeline → 24/25 pts',
        'Confidence: 87% data confidence (multi-source validated) → 17/20 pts',
        'Complexity: 4 modules involved (Inventory, Allocation, Promo, Pricing) → 12/15 pts',
      ],
    },
    signals: [
      { id: 's1', type: 'anomaly', source: 'Inventory System', value: '18 SKUs < safety stock', delta: '-34% vs last week', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), confidence: 94 },
      { id: 's2', type: 'trend', source: 'Demand Forecast', value: 'Demand spike +34%', delta: '+34% vs forecast', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), confidence: 82 },
      { id: 's3', type: 'alert', source: 'Supplier Portal', value: 'Lead time +3 days', delta: '5d → 8d', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), confidence: 91 },
      { id: 's4', type: 'correlation', source: 'DC Analytics', value: '4 DCs depleted', delta: '0% buffer', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), confidence: 88 },
    ],
    rootCauses: [
      { id: 'rc1', hypothesis: 'Supplier capacity constraint due to raw material shortage', probability: 92, evidence: [
        { id: 'e1', type: 'data', title: 'Supplier fill rate dropped to 72%', source: 'Supplier Portal', snippet: 'Samsung: 72% fill rate (vs 95% SLA)' },
        { id: 'e2', type: 'table', title: 'Delayed PO breakdown', source: 'OMS' },
      ], affectedModules: ['inventory', 'supply'] },
      { id: 'rc2', hypothesis: 'Demand spike from viral social media trend', probability: 78, evidence: [
        { id: 'e3', type: 'chart', title: 'Social mentions vs sales correlation', source: 'Brand Monitor' },
        { id: 'e4', type: 'metric', title: '+340% search volume', source: 'Google Trends' },
      ], affectedModules: ['demand', 'inventory'] },
      { id: 'rc3', hypothesis: 'DC imbalance - stock concentrated in wrong regions', probability: 54, evidence: [
        { id: 'e5', type: 'table', title: 'DC stock distribution', source: 'WMS' },
      ], affectedModules: ['allocation', 'inventory'] },
    ],
    crossModulePlan: {
      id: 'plan-a',
      name: 'Fast & Low-Risk Recovery',
      description: 'Coordinated response: expedite + reallocate + pause promotions + hold prices',
      expectedROI: 14.8,
      riskScore: 0.22,
      effortHours: 4,
      actions: [
        {
          id: 'a1', module: 'inventory', what: 'Create emergency PO for top 8 critical SKUs',
          why: 'Immediate replenishment to prevent 48h stockout', evidenceId: 'e1',
          dependsOn: [], approvalRequired: false, expectedImpact: 6.2,
          timeToImpact: '24-48h', risk: 'low',
          toolCall: { system: 'OMS', method: 'createPurchaseOrder', payload: { skus: ['ELEC-TV-55-SAM', 'ELEC-MOB-IPH-15'], priority: 'emergency', supplier: 'SUP-001', quantity: { 'ELEC-TV-55-SAM': 200, 'ELEC-MOB-IPH-15': 500 } }, expectedResponse: { poId: 'PO-2024-EM-001', status: 'confirmed', eta: '24h' } }
        },
        {
          id: 'a2', module: 'allocation', what: 'Transfer 240 units from low-velocity stores',
          why: 'Redistribute existing stock to high-demand locations', evidenceId: 'e5',
          dependsOn: [], approvalRequired: false, expectedImpact: 3.4,
          timeToImpact: '12-24h', risk: 'low',
          toolCall: { system: 'WMS', method: 'createTransferOrder', payload: { fromStores: ['STR-042', 'STR-089'], toStores: ['STR-001', 'STR-003'], skus: ['ELEC-TV-55-SAM'], quantities: [120, 120] }, expectedResponse: { transferId: 'TRF-2024-001', status: 'scheduled', eta: '18h' } }
        },
        {
          id: 'a3', module: 'promo', what: 'Pause Diwali Electronics Sale campaign',
          why: 'Reduce demand pressure while supply recovers', evidenceId: 'e3',
          dependsOn: ['a1'], approvalRequired: true, approvalReason: 'Customer-facing change requires Marketing approval',
          expectedImpact: 2.8, timeToImpact: '2h', risk: 'medium',
          toolCall: { system: 'Campaign Manager', method: 'pauseCampaign', payload: { campaignId: 'PROMO-001', reason: 'stockout_prevention', resumeAfter: '72h' }, expectedResponse: { status: 'paused', savedSpend: 2.1 } }
        },
        {
          id: 'a4', module: 'pricing', what: 'Hold prices on 8 critical SKUs (no markdown)',
          why: 'Maintain margin while supply constrained', evidenceId: 'e1',
          dependsOn: ['a3'], approvalRequired: false, expectedImpact: 1.2,
          timeToImpact: 'immediate', risk: 'low',
          toolCall: { system: 'PIM', method: 'freezePrices', payload: { skus: ['ELEC-TV-55-SAM', 'ELEC-MOB-IPH-15'], duration: '72h', reason: 'supply_constraint' }, expectedResponse: { frozen: 8, until: '72h' } }
        },
        {
          id: 'a5', module: 'assortment', what: 'Enable substitute recommendations for OOS items',
          why: 'Capture demand with alternatives when primary OOS', evidenceId: 'e4',
          dependsOn: [], approvalRequired: false, expectedImpact: 1.2,
          timeToImpact: '1h', risk: 'low',
          toolCall: { system: 'Reco Engine', method: 'enableSubstitutes', payload: { primarySKUs: ['ELEC-TV-55-SAM'], substituteSKUs: ['ELEC-TV-55-LG', 'ELEC-TV-55-SON'], priority: 'high' }, expectedResponse: { enabled: true, coveragePercent: 94 } }
        },
      ],
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'cm-002',
    title: 'Promo burn: 2 campaigns negative ROI',
    summary: 'Two active campaigns showing -₹9.2L incremental loss. High cannibalization and baseline erosion detected. Requires Promo, Pricing, and Assortment coordination.',
    modules: ['promo', 'pricing', 'assortment'],
    impact: 9.2,
    urgency: 'high',
    confidence: 72,
    timeToImpact: '7d',
    owner: 'Marketing',
    status: 'new',
    discoveryScore: {
      impactScore: 28,
      urgencyScore: 18,
      confidenceScore: 14,
      crossModuleComplexity: 9,
      totalScore: 69,
      breakdown: [
        'Impact: ₹9.2L loss ongoing → 28/40 pts',
        'Urgency: 7d runway for correction → 18/25 pts',
        'Confidence: 72% (cannibalization hard to isolate) → 14/20 pts',
        'Complexity: 3 modules (Promo, Pricing, Assortment) → 9/15 pts',
      ],
    },
    signals: [
      { id: 's1', type: 'anomaly', source: 'Promo Analytics', value: 'ROI -0.82x', delta: '-182% vs target', timestamp: new Date(), confidence: 78 },
      { id: 's2', type: 'trend', source: 'Basket Analysis', value: '23% cannibalization', delta: '+15% vs prev promos', timestamp: new Date(), confidence: 71 },
    ],
    rootCauses: [
      { id: 'rc1', hypothesis: 'Discount depth exceeds price elasticity optimum', probability: 84, evidence: [], affectedModules: ['promo', 'pricing'] },
      { id: 'rc2', hypothesis: 'Target segment overlap with existing loyalty benefits', probability: 68, evidence: [], affectedModules: ['promo', 'assortment'] },
    ],
    crossModulePlan: null,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
  },
  {
    id: 'cm-003',
    title: 'Price drift: 42 SKUs overpriced vs competition',
    summary: '42 SKUs now 8-15% above competitive index. Conversion dropped 23%. Coordinated Pricing, Demand, and Promo response needed.',
    modules: ['pricing', 'demand', 'promo'],
    impact: 12.7,
    urgency: 'high',
    confidence: 85,
    timeToImpact: '3d',
    owner: 'Pricing',
    status: 'new',
    discoveryScore: {
      impactScore: 32,
      urgencyScore: 20,
      confidenceScore: 17,
      crossModuleComplexity: 9,
      totalScore: 78,
      breakdown: [
        'Impact: ₹12.7L conversion loss → 32/40 pts',
        'Urgency: 3d response window → 20/25 pts',
        'Confidence: 85% competitive data validated → 17/20 pts',
        'Complexity: 3 modules → 9/15 pts',
      ],
    },
    signals: [
      { id: 's1', type: 'alert', source: 'Competitive Intel', value: '42 SKUs >108% index', delta: '+8-15%', timestamp: new Date(), confidence: 89 },
      { id: 's2', type: 'trend', source: 'Conversion Funnel', value: '-23% conversion', delta: '-23% WoW', timestamp: new Date(), confidence: 84 },
    ],
    rootCauses: [
      { id: 'rc1', hypothesis: 'Delayed competitive response - 3 major competitors cut prices', probability: 88, evidence: [], affectedModules: ['pricing'] },
      { id: 'rc2', hypothesis: 'Cost-plus rules overriding market signals', probability: 72, evidence: [], affectedModules: ['pricing'] },
    ],
    crossModulePlan: null,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
];

// === APPROVAL GATES ===

export type ApprovalGate = 'data_assumptions' | 'root_cause' | 'cross_module_plan' | 'execution' | 'measurement';

export interface GateDefinition {
  id: ApprovalGate;
  stage: 'discovery' | 'diagnosis' | 'plan' | 'execute' | 'measure';
  title: string;
  description: string;
  options: GateOption[];
  autoApproveCondition?: string;
}

export interface GateOption {
  id: string;
  label: string;
  consequence: string;
  icon: 'approve' | 'revise' | 'escalate' | 'skip';
  isPrimary?: boolean;
}

export const APPROVAL_GATES: GateDefinition[] = [
  {
    id: 'data_assumptions',
    stage: 'discovery',
    title: 'Approve Data Assumptions',
    description: 'Validate the data sources and assumptions used by Entity Resolver',
    options: [
      { id: 'approve', label: 'Confirm assumptions', consequence: 'Proceed to diagnosis', icon: 'approve', isPrimary: true },
      { id: 'revise', label: 'Flag data issue', consequence: 'Re-run with constraints', icon: 'revise' },
      { id: 'skip', label: 'Dismiss case', consequence: 'Archive and move to next', icon: 'skip' },
    ],
  },
  {
    id: 'root_cause',
    stage: 'diagnosis',
    title: 'Approve Root Cause',
    description: 'Select which hypothesis to address first',
    options: [
      { id: 'approve', label: 'Accept root cause', consequence: 'Generate cross-module plan', icon: 'approve', isPrimary: true },
      { id: 'revise', label: 'Ask agent to dig deeper', consequence: 'Run additional analysis', icon: 'revise' },
      { id: 'escalate', label: 'Escalate to analyst', consequence: 'Create task and pause', icon: 'escalate' },
    ],
  },
  {
    id: 'cross_module_plan',
    stage: 'plan',
    title: 'Approve Cross-Module Plan',
    description: 'Review and approve the coordinated action plan',
    options: [
      { id: 'approve', label: 'Approve plan', consequence: 'Prepare for execution', icon: 'approve', isPrimary: true },
      { id: 'revise', label: 'Edit constraints', consequence: 'Re-generate with changes', icon: 'revise' },
      { id: 'escalate', label: 'Request alternatives', consequence: 'Generate Plan B & C', icon: 'escalate' },
    ],
    autoApproveCondition: 'confidence ≥ 0.80 AND risk_score ≤ 0.30 AND guardrails pass',
  },
  {
    id: 'execution',
    stage: 'execute',
    title: 'Approve Execution',
    description: 'Final approval before executing tool calls',
    options: [
      { id: 'approve', label: 'Execute all actions', consequence: 'Run tool calls sequentially', icon: 'approve', isPrimary: true },
      { id: 'revise', label: 'Execute safe only', consequence: 'Skip high-risk actions', icon: 'revise' },
      { id: 'escalate', label: 'Delegate approval', consequence: 'Route to team leads', icon: 'escalate' },
    ],
  },
  {
    id: 'measurement',
    stage: 'measure',
    title: 'Confirm Measurement Window',
    description: 'Set the measurement period for ROI tracking',
    options: [
      { id: 'approve', label: 'Accept results', consequence: 'Close case and log ROI', icon: 'approve', isPrimary: true },
      { id: 'revise', label: 'Extend measurement', consequence: 'Continue tracking', icon: 'revise' },
      { id: 'escalate', label: 'Dispute results', consequence: 'Request manual review', icon: 'escalate' },
    ],
  },
];

// === ALTERNATIVE PLANS ===

export const alternativePlans: Record<string, CrossModulePlan[]> = {
  'cm-001': [
    {
      id: 'plan-a',
      name: 'A) Fast & Low-Risk',
      description: 'Transfer + allocation + substitutions. No promo changes.',
      expectedROI: 11.2,
      riskScore: 0.15,
      effortHours: 3,
      actions: [],
    },
    {
      id: 'plan-b',
      name: 'B) Profit-Protect',
      description: 'Pause promo + selective price hold + reallocation.',
      expectedROI: 14.8,
      riskScore: 0.28,
      effortHours: 4,
      actions: [],
    },
    {
      id: 'plan-c',
      name: 'C) Growth Mode',
      description: 'Expedite + keep promo for top stores + controlled substitution.',
      expectedROI: 18.4,
      riskScore: 0.42,
      effortHours: 6,
      actions: [],
    },
  ],
};

// === GUARDRAILS ===

export interface GuardrailRule {
  id: string;
  name: string;
  category: 'margin' | 'budget' | 'compliance' | 'operations';
  threshold: string;
  currentValue: string;
  status: 'pass' | 'warning' | 'fail';
}

export const defaultGuardrailRules: GuardrailRule[] = [
  { id: 'g1', name: 'Minimum margin floor', category: 'margin', threshold: '≥12%', currentValue: '14.2%', status: 'pass' },
  { id: 'g2', name: 'Budget cap per action', category: 'budget', threshold: '≤₹5L', currentValue: '₹2.1L', status: 'pass' },
  { id: 'g3', name: 'Stock cover minimum', category: 'operations', threshold: '≥2 days', currentValue: '1.4 days', status: 'warning' },
  { id: 'g4', name: 'Service level SLA', category: 'operations', threshold: '≥95%', currentValue: '96.2%', status: 'pass' },
  { id: 'g5', name: 'Customer-facing change approval', category: 'compliance', threshold: 'Required for promo/price', currentValue: 'Pending', status: 'warning' },
];
