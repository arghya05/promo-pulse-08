/**
 * Semantic layer and compute economics.
 *
 * The semantic layer is the single place a metric is defined: one expression,
 * one grain, one owner, a version history and a certification state. Ask Maya
 * may only cite a certified metric version. Alongside it, the cost model shows
 * what each pipeline costs to run and what the incremental/partitioning design
 * saves versus a full rebuild.
 */

export type CertState = 'certified' | 'provisional' | 'deprecated' | 'draft';

export type MetricDefinition = {
  id: string;
  name: string;
  version: string;
  /** The literal expression the semantic layer compiles. */
  expression: string;
  grain: string;
  unit: string;
  owner: string;
  sourceObject: string;
  dimensions: string[];
  state: CertState;
  certifiedAt: string | null;
  /** Prior versions with what changed and whether history was restated. */
  history: { version: string; changedAt: string; change: string; restated: boolean }[];
  /** Guardrail the answer engine applies when citing this metric. */
  guardrail: string;
  queries30d: number;
};

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    id: 'm-net-sales',
    name: 'Net sales',
    version: 'v3.1',
    expression: 'SUM(gross_sales - returns - line_discounts) — excludes tax and tender fees',
    grain: 'store × sku × business_date',
    unit: 'USD',
    owner: 'Finance — merchandising controllership',
    sourceObject: 'gold.kpi_measures_daily',
    dimensions: ['banner', 'region', 'store', 'category', 'sku', 'business_date'],
    state: 'certified',
    certifiedAt: '2026-08-05 02:43 UTC',
    history: [
      { version: 'v3.1', changedAt: '2026-06-14', change: 'Tender fees moved out of net sales into cost', restated: true },
      { version: 'v3.0', changedAt: '2026-02-02', change: 'Returns netted at line level instead of header', restated: true },
    ],
    guardrail: 'Cited to the cent from the certified table; never recomputed by the model',
    queries30d: 18_402,
  },
  {
    id: 'm-gross-margin',
    name: 'Gross margin %',
    version: 'v2.4',
    expression: '(net_sales - landed_cogs) / NULLIF(net_sales, 0) — landed cost from the SCD2 version live on the sale date',
    grain: 'store × sku × business_date',
    unit: '%',
    owner: 'Finance — merchandising controllership',
    sourceObject: 'gold.kpi_measures_daily',
    dimensions: ['banner', 'region', 'store', 'category', 'sku', 'business_date'],
    state: 'certified',
    certifiedAt: '2026-08-05 02:43 UTC',
    history: [
      { version: 'v2.4', changedAt: '2026-07-20', change: 'Landed cost precision pinned to 2dp with half-up rounding', restated: true },
      { version: 'v2.3', changedAt: '2026-03-11', change: 'Vendor funding allocated to margin, not to sales', restated: true },
    ],
    guardrail: 'Margin answers disclose the cost-restatement backfill still running for 5 of 16 partitions',
    queries30d: 12_884,
  },
  {
    id: 'm-osa',
    name: 'On-shelf availability',
    version: 'v1.9',
    expression: '1 - (store_sku_hours_with_zero_on_hand / eligible_store_sku_hours) over ranged, non-discontinued items',
    grain: 'store × sku × hour',
    unit: '%',
    owner: 'Supply chain — availability',
    sourceObject: 'gold.availability_daily',
    dimensions: ['banner', 'region', 'store', 'category', 'sku', 'as_of_date'],
    state: 'certified',
    certifiedAt: '2026-08-05 02:43 UTC',
    history: [
      { version: 'v1.9', changedAt: '2026-05-30', change: 'Stale snapshots excluded rather than assumed in stock', restated: false },
    ],
    guardrail: 'Excludes 11 stores on stale snapshots and states the exclusion in the answer',
    queries30d: 9_118,
  },
  {
    id: 'm-otd',
    name: 'Supplier on-time delivery',
    version: 'v2.0',
    expression: 'COUNT(actual_delivery <= expected_delivery) / COUNT(*) on receipted ASN lines',
    grain: 'supplier × po_line',
    unit: '%',
    owner: 'Supply chain — vendor performance',
    sourceObject: 'gold.otd_daily',
    dimensions: ['supplier', 'dc', 'category', 'week'],
    state: 'certified',
    certifiedAt: '2026-08-05 02:43 UTC',
    history: [
      { version: 'v2.0', changedAt: '2026-04-08', change: 'GLN crosswalk applied so partner renames stop splitting history', restated: true },
    ],
    guardrail: 'Held batches for 12 renamed partners are replayed before the metric is cited',
    queries30d: 4_206,
  },
  {
    id: 'm-price-index',
    name: 'Competitive price index',
    version: 'v1.4',
    expression: 'weighted_avg(our_price / competitor_price) on matched SKUs with ≥ 85% crawl coverage',
    grain: 'sku × competitor × observed_date',
    unit: 'index',
    owner: 'Pricing — competitive intelligence',
    sourceObject: 'gold.competitor_price_index',
    dimensions: ['competitor', 'category', 'sku', 'observed_date'],
    state: 'provisional',
    certifiedAt: null,
    history: [
      { version: 'v1.4', changedAt: '2026-08-04', change: 'Unit-drift guard added after a cents-vs-dollars crawl break', restated: false },
    ],
    guardrail: 'Not answerable as a current figure — answers cite the last certified index with its as-of date',
    queries30d: 2_884,
  },
  {
    id: 'm-forecast-mape',
    name: 'Forecast MAPE',
    version: 'v1.2',
    expression: 'mean(|actual - forecast| / NULLIF(actual, 0)) overstore-sku-weeks with actual > 0',
    grain: 'store × sku × week',
    unit: '%',
    owner: 'Demand planning',
    sourceObject: 'gold.forecast_accuracy_daily',
    dimensions: ['region', 'category', 'store', 'week'],
    state: 'certified',
    certifiedAt: '2026-08-05 02:43 UTC',
    history: [
      { version: 'v1.2', changedAt: '2026-06-01', change: 'Zero-actual weeks excluded to stop MAPE blowing up', restated: false },
    ],
    guardrail: 'Sample-size floor of 30 store-sku-weeks before a slice may be cited',
    queries30d: 3_402,
  },
  {
    id: 'm-shrink',
    name: 'Shrink rate',
    version: 'v0.4',
    expression: '(book_on_hand - counted_on_hand) * landed_cost / net_sales',
    grain: 'store × department × count_cycle',
    unit: '%',
    owner: 'Loss prevention',
    sourceObject: 'silver.inventory_position',
    dimensions: ['store', 'department', 'count_cycle'],
    state: 'draft',
    certifiedAt: null,
    history: [],
    guardrail: 'Not in the answer allow-list — 1,902 store-SKUs await cycle counts',
    queries30d: 0,
  },
];

export type PipelineCost = {
  id: string;
  pipeline: string;
  layer: 'Bronze' | 'Silver' | 'Gold' | 'Semantic';
  strategy: 'Incremental' | 'CDC merge' | 'SCD2' | 'Full refresh';
  partitioning: string;
  clustering: string;
  /** Bytes actually scanned by the last run. */
  bytesScannedGb: number;
  /** Bytes a naive full rebuild would have scanned. */
  fullScanGb: number;
  costPerRunUsd: number;
  runsPerDay: number;
  /** Share of scanned bytes eliminated by partition/cluster pruning. */
  prunedPct: number;
};

export const PIPELINE_COSTS: PipelineCost[] = [
  {
    id: 'c-bronze-pos',
    pipeline: 'bronze.pos_lines_typed',
    layer: 'Bronze',
    strategy: 'Incremental',
    partitioning: 'business_date (daily)',
    clustering: 'store_id, sku',
    bytesScannedGb: 412,
    fullScanGb: 18_400,
    costPerRunUsd: 2.06,
    runsPerDay: 24,
    prunedPct: 97.8,
  },
  {
    id: 'c-silver-sales',
    pipeline: 'silver.sales_line_conformed',
    layer: 'Silver',
    strategy: 'CDC merge',
    partitioning: 'business_date (daily) + 72h replay window',
    clustering: 'store_id, sku',
    bytesScannedGb: 688,
    fullScanGb: 21_200,
    costPerRunUsd: 3.44,
    runsPerDay: 24,
    prunedPct: 96.8,
  },
  {
    id: 'c-silver-product',
    pipeline: 'silver.product_dim_scd2',
    layer: 'Silver',
    strategy: 'SCD2',
    partitioning: 'is_current + valid_from month',
    clustering: 'sku',
    bytesScannedGb: 18,
    fullScanGb: 96,
    costPerRunUsd: 0.09,
    runsPerDay: 4,
    prunedPct: 81.3,
  },
  {
    id: 'c-gold-kpi',
    pipeline: 'gold.kpi_measures_daily',
    layer: 'Gold',
    strategy: 'Full refresh',
    partitioning: 'business_date (daily, rebuilt per touched date)',
    clustering: 'region, category',
    bytesScannedGb: 902,
    fullScanGb: 6_800,
    costPerRunUsd: 4.51,
    runsPerDay: 6,
    prunedPct: 86.7,
  },
  {
    id: 'c-gold-osa',
    pipeline: 'gold.availability_daily',
    layer: 'Gold',
    strategy: 'Incremental',
    partitioning: 'as_of_date (daily)',
    clustering: 'store_id, category',
    bytesScannedGb: 344,
    fullScanGb: 4_100,
    costPerRunUsd: 1.72,
    runsPerDay: 24,
    prunedPct: 91.6,
  },
  {
    id: 'c-semantic',
    pipeline: 'semantic.metric_serving_cache',
    layer: 'Semantic',
    strategy: 'Incremental',
    partitioning: 'metric × grain × date',
    clustering: 'metric_id',
    bytesScannedGb: 46,
    fullScanGb: 1_900,
    costPerRunUsd: 0.23,
    runsPerDay: 96,
    prunedPct: 97.6,
  },
];

export const CERT_STATE_STYLES: Record<CertState, { label: string; badge: string }> = {
  certified: { label: 'Certified', badge: 'bg-status-good/10 text-status-good border-status-good/30' },
  provisional: { label: 'Provisional', badge: 'bg-status-warning/10 text-status-warning border-status-warning/30' },
  deprecated: { label: 'Deprecated', badge: 'bg-destructive/10 text-destructive border-destructive/30' },
  draft: { label: 'Draft', badge: 'bg-muted text-muted-foreground border-border' },
};

export function semanticSummary() {
  const total = METRIC_DEFINITIONS.length;
  const certified = METRIC_DEFINITIONS.filter((m) => m.state === 'certified');
  const answerable = certified.length;
  const versionsRestated = METRIC_DEFINITIONS.flatMap((m) => m.history).filter((h) => h.restated).length;
  const versionsTotal = METRIC_DEFINITIONS.flatMap((m) => m.history).length;
  const queries = METRIC_DEFINITIONS.reduce((s, m) => s + m.queries30d, 0);
  const certifiedQueries = certified.reduce((s, m) => s + m.queries30d, 0);
  const certifiedQueryPct = queries > 0 ? (certifiedQueries / queries) * 100 : 0;

  const dailyCost = PIPELINE_COSTS.reduce((s, p) => s + p.costPerRunUsd * p.runsPerDay, 0);
  const scanned = PIPELINE_COSTS.reduce((s, p) => s + p.bytesScannedGb * p.runsPerDay, 0);
  const naive = PIPELINE_COSTS.reduce((s, p) => s + p.fullScanGb * p.runsPerDay, 0);
  const savingsPct = naive > 0 ? ((naive - scanned) / naive) * 100 : 0;
  const naiveCost = scanned > 0 ? dailyCost * (naive / scanned) : dailyCost;
  const costPerThousandAnswers = queries > 0 ? ((dailyCost * 30) / queries) * 1_000 : 0;

  return {
    total,
    answerable,
    provisional: METRIC_DEFINITIONS.filter((m) => m.state === 'provisional').length,
    draft: METRIC_DEFINITIONS.filter((m) => m.state === 'draft').length,
    versionsTotal,
    versionsRestated,
    queries,
    certifiedQueryPct,
    dailyCost,
    monthlyCost: dailyCost * 30,
    naiveMonthlyCost: naiveCost * 30,
    savingsPct,
    scannedTbPerDay: scanned / 1_024,
    costPerThousandAnswers,
  };
}
