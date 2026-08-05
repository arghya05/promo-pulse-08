/**
 * Source onboarding cockpit — the deterministic "new feed live in 24h, answerable
 * on day 2" path.
 *
 * Everything here is computed from the profiled sample of a candidate source:
 *  - schema profile (types, null rate, cardinality, sample values)
 *  - field -> ontology mapping with a confidence score derived from name,
 *    type and value-shape evidence (no model guessing)
 *  - a data contract generated from the profile
 *  - DQ gates synthesised from the profile + mapping
 *  - a certification workflow with elapsed hours against the 48h target
 */

export type ProfiledField = {
  name: string;
  sqlType: 'string' | 'integer' | 'decimal' | 'timestamp' | 'date' | 'boolean';
  nullRate: number;
  distinctRatio: number;
  sample: string;
  /** Value-shape hint observed in the sample (keeps mapping evidence explicit). */
  shape?: 'sku-like' | 'store-like' | 'money' | 'quantity' | 'iso-timestamp' | 'code' | 'free-text';
};

export type CandidateSource = {
  id: string;
  name: string;
  vendor: string;
  connector: 'S3 / object drop' | 'Kafka topic' | 'REST API' | 'SFTP CSV' | 'JDBC / warehouse' | 'EDI VAN';
  auth: string;
  landingMode: 'Stream' | 'Micro-batch' | 'Batch' | 'API pull';
  cadence: string
  sampleRows: number;
  /** Hours since the connector was first authorised. */
  hoursSinceConnect: number;
  fields: ProfiledField[];
  targetEntities: string[];
  targetGold: string;
  ownership: string;
};

/** Ontology attributes a new field can bind to. */
export type OntologyTarget = {
  key: string;
  entity: string;
  label: string;
  expects: ProfiledField['sqlType'][];
  shapes: NonNullable<ProfiledField['shape']>[];
  /** Alias tokens that count as name evidence. */
  aliases: string[];
  required: boolean;
};

export const ONTOLOGY_TARGETS: OntologyTarget[] = [
  { key: 'product.sku', entity: 'Product', label: 'Product SKU', expects: ['string'], shapes: ['sku-like', 'code'], aliases: ['sku', 'item', 'upc', 'ean', 'article', 'product'], required: true },
  { key: 'store.code', entity: 'Store', label: 'Store code', expects: ['string', 'integer'], shapes: ['store-like', 'code'], aliases: ['store', 'site', 'location', 'branch', 'shop'], required: true },
  { key: 'time.event_ts', entity: 'Time', label: 'Event timestamp', expects: ['timestamp', 'date'], shapes: ['iso-timestamp'], aliases: ['ts', 'time', 'date', 'timestamp', 'datetime', 'posted'], required: true },
  { key: 'sales.units', entity: 'Transaction', label: 'Units', expects: ['integer', 'decimal'], shapes: ['quantity'], aliases: ['qty', 'quantity', 'units', 'pieces', 'eaches'], required: false },
  { key: 'sales.amount', entity: 'Transaction', label: 'Net amount', expects: ['decimal', 'integer'], shapes: ['money'], aliases: ['amount', 'sales', 'value', 'revenue', 'net', 'total'], required: false },
  { key: 'cost.unit_cost', entity: 'Product', label: 'Unit cost', expects: ['decimal'], shapes: ['money'], aliases: ['cost', 'cogs', 'landed'], required: false },
  { key: 'promo.offer_id', entity: 'Promotion', label: 'Offer id', expects: ['string'], shapes: ['code'], aliases: ['promo', 'offer', 'deal', 'campaign'], required: false },
  { key: 'inventory.on_hand', entity: 'Inventory', label: 'On-hand units', expects: ['integer', 'decimal'], shapes: ['quantity'], aliases: ['onhand', 'on_hand', 'stock', 'inventory', 'soh'], required: false },
  { key: 'vendor.code', entity: 'Supplier', label: 'Vendor code', expects: ['string'], shapes: ['code'], aliases: ['vendor', 'supplier', 'partner'], required: false },
  { key: 'currency.code', entity: 'Transaction', label: 'Currency', expects: ['string'], shapes: ['code'], aliases: ['currency', 'ccy'], required: false },
];

export const CANDIDATE_SOURCES: CandidateSource[] = [
  {
    id: 'wholesale-club',
    name: 'Wholesale club member transactions',
    vendor: 'Everline Club · club POS extract',
    connector: 'S3 / object drop',
    auth: 'IAM role assumption (no long-lived key)',
    landingMode: 'Micro-batch',
    cadence: 'every 15 min',
    sampleRows: 250_000,
    hoursSinceConnect: 31,
    ownership: 'Club Format Systems',
    targetEntities: ['Store', 'Product', 'Transaction', 'Time'],
    targetGold: 'transactions',
    fields: [
      { name: 'club_no', sqlType: 'string', nullRate: 0, distinctRatio: 0.0004, sample: 'CLB-0142', shape: 'store-like' },
      { name: 'item_upc', sqlType: 'string', nullRate: 0.004, distinctRatio: 0.11, sample: '0007874001234', shape: 'sku-like' },
      { name: 'txn_dttm', sqlType: 'timestamp', nullRate: 0, distinctRatio: 0.82, sample: '2026-08-04T18:22:41Z', shape: 'iso-timestamp' },
      { name: 'sold_qty', sqlType: 'decimal', nullRate: 0.001, distinctRatio: 0.0008, sample: '2.000', shape: 'quantity' },
      { name: 'ext_amt_cents', sqlType: 'integer', nullRate: 0, distinctRatio: 0.31, sample: '1798', shape: 'money' },
      { name: 'ccy', sqlType: 'string', nullRate: 0, distinctRatio: 0.000004, sample: 'USD', shape: 'code' },
      { name: 'member_tier_txt', sqlType: 'string', nullRate: 0.19, distinctRatio: 0.00002, sample: 'Business Plus', shape: 'free-text' },
    ],
  },
  {
    id: 'dsd-vendor',
    name: 'Direct-store-delivery vendor receipts',
    vendor: 'Snack & beverage DSD partners (23 vendors)',
    connector: 'EDI VAN',
    auth: 'AS2 certificate per trading partner',
    landingMode: 'Batch',
    cadence: 'per delivery window',
    sampleRows: 41_800,
    hoursSinceConnect: 19,
    ownership: 'Store Receiving',
    targetEntities: ['Store', 'Product', 'Supplier'],
    targetGold: 'supplier_orders',
    fields: [
      { name: 'ship_to_site', sqlType: 'string', nullRate: 0, distinctRatio: 0.03, sample: '01486', shape: 'store-like' },
      { name: 'vendor_duns', sqlType: 'string', nullRate: 0, distinctRatio: 0.0006, sample: '084213996', shape: 'code' },
      { name: 'vendor_item_no', sqlType: 'string', nullRate: 0.031, distinctRatio: 0.22, sample: 'PEP-2L-CLA', shape: 'code' },
      { name: 'delivery_date', sqlType: 'date', nullRate: 0, distinctRatio: 0.002, sample: '2026-08-03', shape: 'iso-timestamp' },
      { name: 'qty_cases', sqlType: 'integer', nullRate: 0, distinctRatio: 0.001, sample: '14', shape: 'quantity' },
      { name: 'unit_cost_usd', sqlType: 'decimal', nullRate: 0.062, distinctRatio: 0.04, sample: '11.4200', shape: 'money' },
      { name: 'bol_note', sqlType: 'string', nullRate: 0.71, distinctRatio: 0.63, sample: 'left at dock 3', shape: 'free-text' },
    ],
  },
  {
    id: 'loyalty-app',
    name: 'Loyalty app engagement events',
    vendor: 'Everline mobile · CDP export',
    connector: 'Kafka topic',
    auth: 'mTLS + SASL/OAUTHBEARER',
    landingMode: 'Stream',
    cadence: 'continuous',
    sampleRows: 1_200_000,
    hoursSinceConnect: 8,
    ownership: 'Loyalty & CRM',
    targetEntities: ['Customer', 'Promotion', 'Time'],
    targetGold: 'customer_journey',
    fields: [
      { name: 'event_time', sqlType: 'timestamp', nullRate: 0, distinctRatio: 0.94, sample: '2026-08-05T07:11:02.412Z', shape: 'iso-timestamp' },
      { name: 'offer_ref', sqlType: 'string', nullRate: 0.28, distinctRatio: 0.001, sample: 'OFF-2026-3391', shape: 'code' },
      { name: 'clipped_store', sqlType: 'string', nullRate: 0.44, distinctRatio: 0.002, sample: '0731', shape: 'store-like' },
      { name: 'basket_value', sqlType: 'decimal', nullRate: 0.52, distinctRatio: 0.4, sample: '64.19', shape: 'money' },
      { name: 'device_family', sqlType: 'string', nullRate: 0.02, distinctRatio: 0.00001, sample: 'iOS', shape: 'free-text' },
      { name: 'sku_viewed', sqlType: 'string', nullRate: 0.36, distinctRatio: 0.19, sample: '0004900002233', shape: 'sku-like' },
    ],
  },
];

/* ---------------------------------- mapping --------------------------------- */

export type FieldMapping = {
  field: ProfiledField;
  target: OntologyTarget | null;
  confidence: number;
  evidence: string[];
  decision: 'auto-bind' | 'review' | 'park as attribute';
  transform: string;
};

const tokenise = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

function scoreTarget(field: ProfiledField, target: OntologyTarget) {
  const tokens = tokenise(field.name);
  const evidence: string[] = [];
  let score = 0;

  const aliasHit = target.aliases.find((a) => tokens.some((t) => t === a || t.includes(a) || a.includes(t)));
  if (aliasHit) {
    const exact = tokens.includes(aliasHit);
    score += exact ? 0.5 : 0.34;
    evidence.push(`name token "${aliasHit}"${exact ? ' (exact)' : ' (partial)'}`);
  }
  if (target.expects.includes(field.sqlType)) {
    score += 0.24;
    evidence.push(`type ${field.sqlType} accepted`);
  }
  if (field.shape && target.shapes.includes(field.shape)) {
    score += 0.22;
    evidence.push(`value shape ${field.shape}`);
  }
  if (field.nullRate <= 0.02) {
    score += 0.06;
    evidence.push(`null rate ${(field.nullRate * 100).toFixed(1)}%`);
  }
  if (target.key.endsWith('.sku') || target.key.endsWith('.code')) {
    if (field.distinctRatio > 0 && field.distinctRatio < 0.5) {
      score += 0.04;
      evidence.push(`cardinality ratio ${field.distinctRatio.toFixed(4)} consistent with a key`);
    }
  }
  return { score: Math.min(score, 0.99), evidence };
}

function transformFor(field: ProfiledField, target: OntologyTarget | null) {
  if (!target) return 'retained as source attribute in bronze/silver, not published to gold';
  if (/cents$/.test(field.name)) return 'divide by 100 → USD decimal(18,4)';
  if (target.key === 'time.event_ts') return 'parse ISO-8601 → UTC timestamp, derive retail calendar keys';
  if (target.key === 'product.sku') return 'zero-pad to 13, resolve against item master SCD2, unmatched → quarantine';
  if (target.key === 'store.code') return 'zero-pad to 5, resolve against store master, unmatched → quarantine';
  if (target.key === 'vendor.code') return 'DUNS → vendor master surrogate key';
  if (target.key === 'sales.units' || target.key === 'inventory.on_hand') return 'normalise to selling UOM via item conversion factor';
  if (target.key === 'cost.unit_cost') return 'effective-dated join on delivery date; late cost restates affected days';
  if (target.key === 'currency.code') return 'ISO-4217 validation, convert to USD at posting-date rate';
  return 'cast to canonical type, trim, conform to ontology attribute';
}

export function mapFields(source: CandidateSource): FieldMapping[] {
  return source.fields.map((field) => {
    const scored = ONTOLOGY_TARGETS.map((t) => ({ target: t, ...scoreTarget(field, t) })).sort(
      (a, b) => b.score - a.score,
    );
    const best = scored[0];
    const target = best.score >= 0.4 ? best.target : null;
    const confidence = target ? best.score : best.score;
    return {
      field,
      target,
      confidence,
      evidence: target ? best.evidence : ['no alias, type and shape agreement above threshold'],
      decision: !target ? 'park as attribute' : confidence >= 0.8 ? 'auto-bind' : 'review',
      transform: transformFor(field, target),
    };
  });
}

/* --------------------------------- contract -------------------------------- */

export type ContractClause = { clause: string; value: string };

export function buildContract(source: CandidateSource, mappings: FieldMapping[]): ContractClause[] {
  const required = mappings.filter((m) => m.target?.required).map((m) => m.field.name);
  const keyFields = mappings
    .filter((m) => m.target && (m.target.key.includes('sku') || m.target.key.includes('code') || m.target.key === 'time.event_ts'))
    .map((m) => m.field.name);
  return [
    { clause: 'Contract id', value: `dc.${source.id}.v1` },
    { clause: 'Connector', value: `${source.connector} · ${source.auth}` },
    { clause: 'Landing', value: `${source.landingMode} · ${source.cadence}` },
    { clause: 'Bronze object', value: `raw_${source.id.replace(/-/g, '_')}.landed` },
    { clause: 'Declared grain', value: keyFields.join(' × ') || 'source row' },
    { clause: 'Required fields', value: required.join(', ') || '—' },
    { clause: 'Schema evolution', value: 'additive columns allowed and retained; type narrowing or rename quarantines the batch' },
    { clause: 'Late arrival', value: source.landingMode === 'Stream' ? 'event-time ordering, 24h replay window' : '72h watermark, restate affected days only' },
    { clause: 'PII handling', value: mappings.some((m) => /member|device|customer/.test(m.field.name)) ? 'tokenised at bronze; raw attribute never leaves the landing zone' : 'no PII detected in profile' },
    { clause: 'Ownership', value: `${source.ownership} (producer) · Merchandising Data Governance (steward)` },
    { clause: 'Publishes to', value: `gold.${source.targetGold}` },
  ];
}

/* ------------------------------ gate synthesis ----------------------------- */

export type SynthGate = {
  id: string;
  layer: 'Bronze' | 'Silver' | 'Gold';
  name: string;
  dimension: 'Completeness' | 'Validity' | 'Uniqueness' | 'Consistency' | 'Timeliness' | 'Accuracy';
  expression: string;
  threshold: string;
  onFail: 'quarantine batch' | 'quarantine rows' | 'block publish' | 'flag + continue';
  derivedFrom: string;
};

export function synthesiseGates(source: CandidateSource, mappings: FieldMapping[]): SynthGate[] {
  const gates: SynthGate[] = [
    {
      id: `${source.id}-hash`,
      layer: 'Bronze',
      name: 'Duplicate batch guard',
      dimension: 'Uniqueness',
      expression: 'source_hash NOT IN (SELECT source_hash FROM raw_ledger)',
      threshold: '0 repeats',
      onFail: 'quarantine batch',
      derivedFrom: 'connector is file/message based, so re-sends are physically possible',
    },
    {
      id: `${source.id}-contract`,
      layer: 'Bronze',
      name: 'Schema contract',
      dimension: 'Validity',
      expression: `required(${mappings.filter((m) => m.target?.required).map((m) => m.field.name).join(', ') || 'none'}) AND no_type_narrowing`,
      threshold: '100% of batches',
      onFail: 'quarantine batch',
      derivedFrom: 'required ontology attributes detected in the profile',
    },
  ];

  for (const m of mappings) {
    if (!m.target) continue;
    if (m.field.nullRate <= 0.02) {
      gates.push({
        id: `${source.id}-null-${m.field.name}`,
        layer: 'Silver',
        name: `Not-null · ${m.field.name}`,
        dimension: 'Completeness',
        expression: `${m.field.name} IS NOT NULL`,
        threshold: `null rate ≤ ${(Math.max(m.field.nullRate * 2, 0.001) * 100).toFixed(2)}%`,
        onFail: 'quarantine rows',
        derivedFrom: `observed null rate ${(m.field.nullRate * 100).toFixed(2)}% over ${source.sampleRows.toLocaleString()} sampled rows`,
      });
    }
    if (/sku|code|vendor/.test(m.target.key)) {
      gates.push({
        id: `${source.id}-ri-${m.field.name}`,
        layer: 'Silver',
        name: `Referential integrity · ${m.target.label}`,
        dimension: 'Consistency',
        expression: `${m.field.name} resolves to ${m.target.entity.toLowerCase()}_master (SCD2 effective row)`,
        threshold: 'orphan rate < 0.5%',
        onFail: 'quarantine rows',
        derivedFrom: `field bound to ${m.target.key} at ${(m.confidence * 100).toFixed(0)}% confidence`,
      });
    }
    if (m.target.key === 'sales.amount' || m.target.key === 'cost.unit_cost') {
      gates.push({
        id: `${source.id}-range-${m.field.name}`,
        layer: 'Silver',
        name: `Range bound · ${m.target.label}`,
        dimension: 'Validity',
        expression: `${m.field.name} >= 0 AND ${m.field.name} < 1e7`,
        threshold: '≥ 99.9% in bound',
        onFail: 'flag + continue',
        derivedFrom: 'monetary shape detected; cents/dollars scale ambiguity is a known defect class',
      });
    }
    if (m.target.key === 'time.event_ts') {
      gates.push({
        id: `${source.id}-fresh`,
        layer: 'Bronze',
        name: 'Freshness / watermark',
        dimension: 'Timeliness',
        expression: `max(${m.field.name}) >= now() - interval '${source.landingMode === 'Stream' ? '15 minutes' : '3 hours'}'`,
        threshold: source.landingMode === 'Stream' ? '≤ 15 min lag' : '≤ 3 h lag',
        onFail: 'flag + continue',
        derivedFrom: `declared cadence ${source.cadence}`,
      });
    }
  }

  gates.push(
    {
      id: `${source.id}-grain`,
      layer: 'Gold',
      name: 'Grain uniqueness',
      dimension: 'Uniqueness',
      expression: 'count(*) = count(distinct declared_grain)',
      threshold: '0 duplicates',
      onFail: 'block publish',
      derivedFrom: 'grain declared in the generated contract',
    },
    {
      id: `${source.id}-tieout`,
      layer: 'Gold',
      name: 'Control-total tie-out',
      dimension: 'Accuracy',
      expression: 'abs(gold_total - source_control_total) / source_control_total',
      threshold: '≤ 0.1%',
      onFail: 'block publish',
      derivedFrom: 'source emits a control total in its trailer/header',
    },
  );

  return gates;
}

/* ---------------------------- certification path --------------------------- */

export type CertStep = {
  id: string;
  label: string;
  detail: string;
  /** Hours from connector authorisation to completion of this step. */
  atHour: number;
  gate: string;
};

export const CERT_PATH: CertStep[] = [
  { id: 'connect', label: 'Connector authorised', detail: 'Credential vaulted, reachability + read-permission probe green.', atHour: 0, gate: 'connectivity probe' },
  { id: 'profile', label: 'Sample profiled', detail: 'Types, null rates, cardinality and value shapes computed on the sample.', atHour: 2, gate: 'profile coverage ≥ 100k rows or full source' },
  { id: 'map', label: 'Ontology mapping accepted', detail: 'Auto-bound fields ≥ 80% confidence; the rest reviewed by the steward.', atHour: 6, gate: 'all required attributes bound' },
  { id: 'contract', label: 'Contract signed', detail: 'Producer and steward accept grain, required fields and evolution policy.', atHour: 10, gate: 'producer + steward signature' },
  { id: 'gates', label: 'Gates deployed & first run green', detail: 'Synthesised gates run on a real batch; failures triaged.', atHour: 16, gate: 'no blocking gate failing' },
  { id: 'backfill', label: 'Backfill + reconciliation', detail: 'History replayed and tied out to the source control totals.', atHour: 26, gate: 'tie-out ≤ 0.1%' },
  { id: 'certify', label: 'Gold table certified', detail: 'Grain, comp basis and restatement policy signed off; snapshot versioned.', atHour: 34, gate: 'gold gates green 3 consecutive runs' },
  { id: 'semantic', label: 'Metrics allow-listed', detail: 'Metric formulas registered on the certified dataset in the semantic layer.', atHour: 40, gate: 'formula executes in code, sample-size floor set' },
  { id: 'answerable', label: 'Maya answerable', detail: 'Dataset enters the planner allow-list; lineage, audit and provenance resolve end-to-end.', atHour: 44, gate: 'audit controls pass on a canary question' },
];

export const SLA_TARGET_HOURS = 48;

export type OnboardingState = {
  source: CandidateSource;
  mappings: FieldMapping[];
  contract: ContractClause[];
  gates: SynthGate[];
  steps: (CertStep & { status: 'done' | 'active' | 'pending'; elapsed: number })[];
  requiredBound: boolean;
  autoBindRate: number;
  currentStep: CertStep;
  answerableAtHour: number;
  onTrack: boolean;
  hoursToAnswerable: number;
};

export function buildOnboarding(source: CandidateSource): OnboardingState {
  const mappings = mapFields(source);
  const contract = buildContract(source, mappings);
  const gates = synthesiseGates(source, mappings);

  const requiredTargets = ONTOLOGY_TARGETS.filter((t) => t.required && source.targetEntities.includes(t.entity));
  const requiredBound = requiredTargets.every((t) =>
    mappings.some((m) => m.target?.key === t.key && m.confidence >= 0.4),
  );
  const bound = mappings.filter((m) => m.target);
  const autoBindRate = bound.length
    ? mappings.filter((m) => m.decision === 'auto-bind').length / mappings.length
    : 0;

  const h = source.hoursSinceConnect;
  const steps = CERT_PATH.map((s, i) => {
    const next = CERT_PATH[i + 1];
    const status: 'done' | 'active' | 'pending' =
      h >= (next?.atHour ?? Infinity) ? 'done' : h >= s.atHour ? 'active' : 'pending';
    return { ...s, status, elapsed: Math.max(0, Math.min(h, next?.atHour ?? h) - s.atHour) };
  });
  const currentStep = steps.find((s) => s.status === 'active') ?? steps[steps.length - 1];
  const answerableAtHour = CERT_PATH[CERT_PATH.length - 1].atHour;

  return {
    source,
    mappings,
    contract,
    gates,
    steps,
    requiredBound,
    autoBindRate,
    currentStep,
    answerableAtHour,
    onTrack: answerableAtHour <= SLA_TARGET_HOURS && requiredBound,
    hoursToAnswerable: Math.max(0, answerableAtHour - h),
  };
}

export const GATE_FAIL_STYLE: Record<SynthGate['onFail'], string> = {
  'quarantine batch': 'bg-destructive/10 text-destructive border-destructive/30',
  'block publish': 'bg-destructive/10 text-destructive border-destructive/30',
  'quarantine rows': 'bg-status-warning/10 text-status-warning border-status-warning/30',
  'flag + continue': 'bg-primary/10 text-primary border-primary/30',
};
