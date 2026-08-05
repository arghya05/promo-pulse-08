/**
 * Governance: column-level classification, masking, access policy, retention
 * and right-to-erasure. Answers inherit these policies — a masked column can
 * never surface as a cited value.
 */

export type Sensitivity = 'public' | 'internal' | 'confidential' | 'restricted';
export type MaskMode = 'none' | 'tokenized' | 'hashed' | 'partial' | 'aggregate-only' | 'blocked';

export type ClassifiedColumn = {
  id: string;
  object: string;
  column: string;
  /** Detector that assigned the class, with its confidence. */
  detector: string;
  confidence: number;
  category: 'Direct identifier' | 'Quasi-identifier' | 'Financial' | 'Contact' | 'Employment' | 'Operational';
  sensitivity: Sensitivity;
  mask: MaskMode;
  /** Roles allowed to read the unmasked value. */
  allowedRoles: string[];
  /** How the column may be used by the answer engine. */
  answerUse: string;
  rowCount: number;
  retentionDays: number;
  legalBasis: string;
};

export const CLASSIFIED_COLUMNS: ClassifiedColumn[] = [
  {
    id: 'cust-email',
    object: 'silver.customer_master',
    column: 'email',
    detector: 'Regex + domain validation',
    confidence: 0.99,
    category: 'Contact',
    sensitivity: 'restricted',
    mask: 'tokenized',
    allowedRoles: ['privacy_officer'],
    answerUse: 'Never cited; joins use the token, not the address',
    rowCount: 41_882_004,
    retentionDays: 730,
    legalBasis: 'Consent — loyalty programme terms',
  },
  {
    id: 'cust-phone',
    object: 'silver.customer_master',
    column: 'phone',
    detector: 'Pattern + NANP validation',
    confidence: 0.97,
    category: 'Contact',
    sensitivity: 'restricted',
    mask: 'partial',
    allowedRoles: ['privacy_officer', 'care_supervisor'],
    answerUse: 'Blocked from answers; last 4 digits only in the care console',
    rowCount: 33_401_118,
    retentionDays: 730,
    legalBasis: 'Consent — loyalty programme terms',
  },
  {
    id: 'cust-name',
    object: 'silver.customer_master',
    column: 'customer_name',
    detector: 'Name dictionary + column-name prior',
    confidence: 0.94,
    category: 'Direct identifier',
    sensitivity: 'restricted',
    mask: 'blocked',
    allowedRoles: ['privacy_officer'],
    answerUse: 'Blocked — segment answers name cohorts, never individuals',
    rowCount: 41_882_004,
    retentionDays: 730,
    legalBasis: 'Consent — loyalty programme terms',
  },
  {
    id: 'cust-ltv',
    object: 'gold.customer_value_daily',
    column: 'total_lifetime_value',
    detector: 'Financial-measure classifier',
    confidence: 0.91,
    category: 'Financial',
    sensitivity: 'confidential',
    mask: 'aggregate-only',
    allowedRoles: ['analyst', 'merchant', 'exec'],
    answerUse: 'Citable only at cohort grain with k ≥ 50; single-customer values refused',
    rowCount: 41_882_004,
    retentionDays: 1_825,
    legalBasis: 'Legitimate interest — commercial analytics',
  },
  {
    id: 'cust-demo',
    object: 'silver.customer_master',
    column: 'income_band, age_band, marital_status',
    detector: 'Quasi-identifier combination scan',
    confidence: 0.88,
    category: 'Quasi-identifier',
    sensitivity: 'confidential',
    mask: 'aggregate-only',
    allowedRoles: ['analyst', 'merchant'],
    answerUse: 'Suppressed when a segment slice falls under k = 50 (re-identification risk)',
    rowCount: 41_882_004,
    retentionDays: 730,
    legalBasis: 'Consent — profiling opt-in',
  },
  {
    id: 'emp-rate',
    object: 'silver.employee_master',
    column: 'hourly_rate',
    detector: 'Compensation classifier',
    confidence: 0.96,
    category: 'Employment',
    sensitivity: 'restricted',
    mask: 'blocked',
    allowedRoles: ['hr_partner'],
    answerUse: 'Blocked — labour answers use store-level hours and cost, never individual pay',
    rowCount: 402_118,
    retentionDays: 2_555,
    legalBasis: 'Employment contract',
  },
  {
    id: 'txn-card',
    object: 'bronze.pos_lines_typed',
    column: 'card_last4',
    detector: 'PAN-fragment detector',
    confidence: 0.99,
    category: 'Financial',
    sensitivity: 'restricted',
    mask: 'hashed',
    allowedRoles: ['fraud_analyst'],
    answerUse: 'Never leaves bronze; tender answers use payment method only',
    rowCount: 41_282_671,
    retentionDays: 395,
    legalBasis: 'PCI DSS — fraud investigation',
  },
  {
    id: 'store-sales',
    object: 'gold.kpi_measures_daily',
    column: 'net_sales',
    detector: 'Business-measure classifier',
    confidence: 0.99,
    category: 'Operational',
    sensitivity: 'internal',
    mask: 'none',
    allowedRoles: ['analyst', 'merchant', 'exec', 'supplier_read'],
    answerUse: 'Freely citable at every grain — the primary certified measure',
    rowCount: 2_641_880,
    retentionDays: 3_650,
    legalBasis: 'Company record',
  },
  {
    id: 'supplier-terms',
    object: 'silver.supplier_master',
    column: 'payment_terms, credit_limit',
    detector: 'Commercial-terms classifier',
    confidence: 0.9,
    category: 'Financial',
    sensitivity: 'confidential',
    mask: 'aggregate-only',
    allowedRoles: ['analyst', 'merchant'],
    answerUse: 'Blocked from supplier-facing sessions; internal answers only',
    rowCount: 4_118,
    retentionDays: 2_555,
    legalBasis: 'Contractual confidentiality',
  },
];

export type ErasureRequest = {
  id: string;
  receivedAt: string;
  regime: 'GDPR Art.17' | 'CCPA/CPRA' | 'Internal policy';
  /** Objects the subject's rows appear in, resolved from lineage. */
  objectsTouched: number;
  rowsErased: number;
  /** Aggregates preserved by replacing the subject with an anonymous cohort key. */
  aggregatesPreserved: boolean;
  slaDays: number;
  elapsedDays: number;
  status: 'complete' | 'in-progress';
  note: string;
};

export const ERASURE_REQUESTS: ErasureRequest[] = [
  {
    id: 'er-2026-0841',
    receivedAt: '2026-07-29',
    regime: 'GDPR Art.17',
    objectsTouched: 9,
    rowsErased: 1_884,
    aggregatesPreserved: true,
    slaDays: 30,
    elapsedDays: 7,
    status: 'complete',
    note: 'Identifiers purged from bronze→gold; sales rows re-keyed to an anonymous cohort so history stays additive',
  },
  {
    id: 'er-2026-0902',
    receivedAt: '2026-08-02',
    regime: 'CCPA/CPRA',
    objectsTouched: 9,
    rowsErased: 612,
    aggregatesPreserved: true,
    slaDays: 45,
    elapsedDays: 3,
    status: 'complete',
    note: 'Loyalty profile deleted; transaction facts retained anonymously under the tax-record exemption',
  },
  {
    id: 'er-2026-0917',
    receivedAt: '2026-08-04',
    regime: 'GDPR Art.17',
    objectsTouched: 9,
    rowsErased: 0,
    aggregatesPreserved: true,
    slaDays: 30,
    elapsedDays: 1,
    status: 'in-progress',
    note: 'Lineage sweep running across 9 objects plus the 90-day snapshot archive',
  },
];

export type AccessRule = {
  id: string;
  role: string;
  scope: string;
  grain: string;
  /** Enforcement point — the answer engine reads this, not a UI toggle. */
  enforcedAt: string;
  denies: string;
};

export const ACCESS_RULES: AccessRule[] = [
  {
    id: 'ar-exec',
    role: 'exec',
    scope: 'All banners, all regions',
    grain: 'Chain → region → store',
    enforcedAt: 'Semantic layer row policy + column mask',
    denies: 'Individual customer and employee attributes',
  },
  {
    id: 'ar-merchant',
    role: 'merchant',
    scope: 'Owned categories only',
    grain: 'Category → subcategory → SKU',
    enforcedAt: 'Row policy on category ownership table',
    denies: 'Other merchants’ categories, all restricted columns',
  },
  {
    id: 'ar-store',
    role: 'store_manager',
    scope: 'Own store',
    grain: 'Store → department → SKU',
    enforcedAt: 'Row policy on store assignment',
    denies: 'Peer-store detail (only anonymised benchmark deciles)',
  },
  {
    id: 'ar-supplier',
    role: 'supplier_read',
    scope: 'Own items only',
    grain: 'Item → chain aggregate',
    enforcedAt: 'Row policy on vendor mapping + aggregate-only masks',
    denies: 'Competing vendors, store-level detail, all cost and terms columns',
  },
];

export const SENSITIVITY_STYLES: Record<Sensitivity, { label: string; badge: string }> = {
  public: { label: 'Public', badge: 'bg-muted text-muted-foreground border-border' },
  internal: { label: 'Internal', badge: 'bg-primary/10 text-primary border-primary/30' },
  confidential: { label: 'Confidential', badge: 'bg-status-warning/10 text-status-warning border-status-warning/30' },
  restricted: { label: 'Restricted', badge: 'bg-destructive/10 text-destructive border-destructive/30' },
};

export const MASK_LABELS: Record<MaskMode, string> = {
  none: 'No mask',
  tokenized: 'Tokenized',
  hashed: 'Hashed (irreversible)',
  partial: 'Partially masked',
  'aggregate-only': 'Aggregate-only',
  blocked: 'Blocked from answers',
};

export function governanceSummary() {
  const total = CLASSIFIED_COLUMNS.length;
  const restricted = CLASSIFIED_COLUMNS.filter((c) => c.sensitivity === 'restricted').length;
  const masked = CLASSIFIED_COLUMNS.filter((c) => c.mask !== 'none').length;
  const coveragePct = total > 0 ? (masked / total) * 100 : 0;
  const citable = CLASSIFIED_COLUMNS.filter((c) => c.mask === 'none' || c.mask === 'aggregate-only');
  const avgConfidence =
    total > 0 ? CLASSIFIED_COLUMNS.reduce((s, c) => s + c.confidence, 0) / total : 0;
  const erasureComplete = ERASURE_REQUESTS.filter((e) => e.status === 'complete');
  const avgErasureDays =
    erasureComplete.length > 0
      ? erasureComplete.reduce((s, e) => s + e.elapsedDays, 0) / erasureComplete.length
      : 0;
  const slaMisses = ERASURE_REQUESTS.filter((e) => e.elapsedDays > e.slaDays).length;
  const rowsErased = ERASURE_REQUESTS.reduce((s, e) => s + e.rowsErased, 0);
  const kAnonThreshold = 50;

  return {
    total,
    restricted,
    masked,
    coveragePct,
    citableCount: citable.length,
    avgConfidence,
    avgErasureDays,
    slaMisses,
    rowsErased,
    kAnonThreshold,
    openRequests: ERASURE_REQUESTS.length - erasureComplete.length,
  };
}
