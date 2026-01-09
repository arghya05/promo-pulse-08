// Agents Command Center Types

export type UrgencyLevel = 'now' | '24h' | '7d';
export type ConfidenceLevel = 'high' | 'med' | 'low';
export type RiskLevel = 'low' | 'med' | 'high';
export type ProblemStatus = 'new' | 'investigating' | 'awaiting_approval' | 'running' | 'completed';
export type ModuleTag = 'pricing' | 'promo' | 'supply' | 'forecast' | 'space' | 'assortment';
export type AgentMode = 'advisory' | 'autopilot';

export interface Problem {
  id: string;
  title: string;
  modules: ModuleTag[];
  impact: number; // in lakhs (₹)
  urgency: UrgencyLevel;
  confidence: ConfidenceLevel;
  sla: string;
  owner: string;
  status: ProblemStatus;
  summary: string;
  whyNow: string[];
  rootCauses: string[];
  createdAt: Date;
}

export interface Action {
  id: string;
  title: string;
  upliftMin: number;
  upliftMax: number;
  risk: RiskLevel;
  guardrailViolations: string[];
  included: boolean;
}

export interface Guardrails {
  maxPriceChange: number;
  minMargin: number;
  vendorFundingCap: number;
  inventoryFloor: number;
  serviceLevelTarget: number;
  premiumBrandNoDiscount: boolean;
}

export interface ExpectedROI {
  revenueUplift: number;
  marginImpact: number;
  costImpact: number;
  confidence: number;
  assumptions: string[];
}

export interface RealizedROI {
  revenueUplift: number;
  marginImpact: number;
  inventoryEffect: number;
  experimentMethod: 'A/B' | 'Matched' | 'Synthetic';
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  details?: string;
}

export interface Run {
  id: string;
  problemId: string;
  problemTitle: string;
  playbook: string;
  scope: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  approvals: string[];
  startedAt: Date;
  eta?: string;
  result?: string;
  actions: string[];
  systemsTouched: string[];
  canRollback: boolean;
  notes: string[];
}

export interface Playbook {
  id: string;
  name: string;
  description: string;
  icon: string;
  triggerConditions: string[];
  dataRequired: string[];
  defaultActions: string[];
  defaultGuardrails: Partial<Guardrails>;
  approvalPolicy: string;
  roiMethod: string;
  gradient: string;
}

export interface ROIStats {
  totalROI: number;
  roiThisWeek: number;
  successRate: number;
  avgTimeToAction: string;
}

export interface TopResult {
  id: string;
  title: string;
  roi: number;
  learning: string;
  isWin: boolean;
}
