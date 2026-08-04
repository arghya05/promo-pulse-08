/**
 * Data-quality scorecard: the last run of every standing gate, per medallion
 * layer, with the exact rule expression that was evaluated, how many rows it
 * looked at, how many failed and what the engine did about it.
 *
 * These are the gate results behind the freshness/trust badges shown on
 * answers — a reader can see which specific rule tripped rather than a generic
 * "data quality: ok".
 */

export type DQStatus = 'pass' | 'warn' | 'fail';

export type DQRuleRun = {
  id: string;
  layer: 'Source' | 'Bronze' | 'Silver' | 'Gold' | 'Semantic';
  /** Short gate name as it appears in the pipeline. */
  rule: string;
  /** Which object the gate guards. */
  object: string;
  dimension: 'Completeness' | 'Uniqueness' | 'Validity' | 'Consistency' | 'Timeliness' | 'Accuracy' | 'Governance';
  /** The literal predicate evaluated — rows matching it are failures. */
  expression: string;
  /** Threshold above which the gate is not a pass. */
  threshold: string;
  rowsEvaluated: number;
  rowsFailed: number;
  status: DQStatus;
  /** What happened to the failing rows / the batch. */
  action: string;
  lastRun: string;
};

export const DQ_RULE_RUNS: DQRuleRun[] = [
  // ---------------------------------------------------------------- Source
  {
    id: 'src-arrival-pos',
    layer: 'Source',
    rule: 'Arrival SLA — POS drawer files',
    object: 'POS registers (1,486 stores)',
    dimension: 'Timeliness',
    expression: 'ingest_ts - drawer_close_ts > interval \'42 minutes\'',
    threshold: '≤ 0.5% of store-days late',
    rowsEvaluated: 1486,
    rowsFailed: 4,
    status: 'pass',
    action: '4 stores retried inside the window; no restatement needed',
    lastRun: '2026-08-04 14:35 UTC',
  },
  {
    id: 'src-roster-inv',
    layer: 'Source',
    rule: 'Completeness signal — store roster',
    object: 'raw_inv hourly snapshot push',
    dimension: 'Completeness',
    expression: 'expected_store_roster EXCEPT stores_present_in_file',
    threshold: '≤ 15 stores missing per cycle',
    rowsEvaluated: 1486,
    rowsFailed: 11,
    status: 'warn',
    action: '11 stores carried on last good snapshot and flagged stale; excluded from OSA past tolerance',
    lastRun: '2026-08-04 14:00 UTC',
  },
  {
    id: 'src-integrity-edi',
    layer: 'Source',
    rule: 'File integrity — EDI trailer',
    object: 'Vendor EDI 832/850/856',
    dimension: 'Validity',
    expression: 'trailer_row_count <> actual_row_count OR envelope_hash mismatch',
    threshold: '0 tolerated',
    rowsEvaluated: 9418,
    rowsFailed: 0,
    status: 'pass',
    action: 'All 9,418 documents balanced against their trailers',
    lastRun: '2026-08-04 06:20 UTC',
  },

  // ---------------------------------------------------------------- Bronze
  {
    id: 'bz-schema-contract',
    layer: 'Bronze',
    rule: 'Schema contract',
    object: 'raw_ext.competitor_price_drop',
    dimension: 'Validity',
    expression: 'required_field IS MISSING OR declared_type <> observed_type',
    threshold: '0 breaking changes',
    rowsEvaluated: 1_412_800,
    rowsFailed: 1_412_800,
    status: 'fail',
    action:
      'Provider renamed unit_price → shelf_price: whole batch quarantined to raw_quarantine.competitor_price_drop, contract update in flight. Price-gap answers state coverage from the prior week.',
    lastRun: '2026-08-03 23:10 UTC',
  },
  {
    id: 'bz-dup-file',
    layer: 'Bronze',
    rule: 'Duplicate file guard',
    object: 'raw_pos.basket_line_stream',
    dimension: 'Uniqueness',
    expression: 'source_file_hash IN (SELECT source_file_hash FROM ingested_files)',
    threshold: '0 duplicate hashes admitted',
    rowsEvaluated: 41_602,
    rowsFailed: 128,
    status: 'pass',
    action: '128 exact re-sends rejected at the door (register network retries); originals already landed',
    lastRun: '2026-08-04 14:40 UTC',
  },
  {
    id: 'bz-watermark',
    layer: 'Bronze',
    rule: 'Late-arrival watermark',
    object: 'raw_ecom.order_event',
    dimension: 'Timeliness',
    expression: 'event_ts < ingest_ts - interval \'24 hours\'',
    threshold: '≤ 1% routed to late partition',
    rowsEvaluated: 302_140,
    rowsFailed: 1_884,
    status: 'pass',
    action: '1,884 events routed to the late partition and replayed into silver with a version trail',
    lastRun: '2026-08-04 14:30 UTC',
  },

  // ---------------------------------------------------------------- Silver
  {
    id: 'sv-ri-item',
    layer: 'Silver',
    rule: 'Referential integrity — item master',
    object: 'stg_pos.transaction_line',
    dimension: 'Consistency',
    expression: 'product_sku NOT IN (SELECT product_sku FROM dim_item WHERE scd_current)',
    threshold: 'orphan rate < 0.5%',
    rowsEvaluated: 9_740_512,
    rowsFailed: 17_533,
    status: 'pass',
    action: '0.18% quarantined to the unmatched-item bucket; re-enters automatically when PIM publishes',
    lastRun: '2026-08-04 13:15 UTC',
  },
  {
    id: 'sv-grain',
    layer: 'Silver',
    rule: 'Grain uniqueness',
    object: 'stg_pos.transaction_line',
    dimension: 'Uniqueness',
    expression: 'count(*) > 1 GROUP BY store, register, basket_id, line_no, event_ts',
    threshold: '0 duplicates after de-dup',
    rowsEvaluated: 9_740_512,
    rowsFailed: 0,
    status: 'pass',
    action: '30,195 replayed lines collapsed to latest version before the check; no residual duplicates',
    lastRun: '2026-08-04 13:15 UTC',
  },
  {
    id: 'sv-margin-bound',
    layer: 'Silver',
    rule: 'Range bound — margin',
    object: 'stg_pos.transaction_line',
    dimension: 'Validity',
    expression: 'margin_pct < -100 OR unit_price < 0 OR quantity = 0',
    threshold: '≤ 0.05%',
    rowsEvaluated: 9_740_512,
    rowsFailed: 2_146,
    status: 'warn',
    action:
      '2,146 lines awaiting an effective-dated vendor cost (0.02%): held out of margin metrics, retained for sales; restated when the cost file lands',
    lastRun: '2026-08-04 13:15 UTC',
  },
  {
    id: 'sv-uom',
    layer: 'Silver',
    rule: 'UOM conversion present',
    object: 'stg_pos.transaction_line (fresh)',
    dimension: 'Consistency',
    expression: 'selling_uom <> buying_uom AND conversion_factor IS NULL',
    threshold: '≤ 1% of fresh lines',
    rowsEvaluated: 876_640,
    rowsFailed: 5_402,
    status: 'pass',
    action: '5,402 weight-based lines without a factor excluded from unit metrics, kept for value metrics',
    lastRun: '2026-08-04 13:15 UTC',
  },
  {
    id: 'sv-neg-stock',
    layer: 'Silver',
    rule: 'Negative perpetual inventory',
    object: 'stg_inv.on_hand_position',
    dimension: 'Accuracy',
    expression: 'stock_level < 0',
    threshold: '≤ 1.5% of positions',
    rowsEvaluated: 41_284_900,
    rowsFailed: 495_418,
    status: 'warn',
    action: 'Preserved as a shrink/count-accuracy signal, bounded for availability metrics, never clipped silently',
    lastRun: '2026-08-04 14:05 UTC',
  },

  // ---------------------------------------------------------------- Gold
  {
    id: 'gd-gl-tieout',
    layer: 'Gold',
    rule: 'GL tie-out — net sales',
    object: 'kpi_measures',
    dimension: 'Accuracy',
    expression: 'abs(mart_net_sales - gl_net_sales) / gl_net_sales > 0.001',
    threshold: 'within 0.1% per store-day',
    rowsEvaluated: 46_066,
    rowsFailed: 12,
    status: 'pass',
    action: '12 store-days outside tolerance from late cost; flagged for restatement, version pinned',
    lastRun: '2026-08-04 04:10 local',
  },
  {
    id: 'gd-pk',
    layer: 'Gold',
    rule: 'Primary key uniqueness at published grain',
    object: 'kpi_measures (day × store × category)',
    dimension: 'Uniqueness',
    expression: 'count(*) > 1 GROUP BY measure_date, store_id, category',
    threshold: '0 tolerated',
    rowsEvaluated: 46_066,
    rowsFailed: 0,
    status: 'pass',
    action: 'Grain intact — publish allowed',
    lastRun: '2026-08-04 04:10 local',
  },
  {
    id: 'gd-comp-basis',
    layer: 'Gold',
    rule: 'LY comp basis present',
    object: 'kpi_measures',
    dimension: 'Completeness',
    expression: 'net_sales_ly IS NULL AND measure_date >= comp_start',
    threshold: '≥ 98% coverage',
    rowsEvaluated: 46_066,
    rowsFailed: 703,
    status: 'pass',
    action: '98.5% coverage — 703 rows are new stores with no LY; YoY excludes them and says so',
    lastRun: '2026-08-04 04:10 local',
  },
  {
    id: 'gd-nonneg',
    layer: 'Gold',
    rule: 'Non-negative counts',
    object: 'kpi_measures · inventory_levels',
    dimension: 'Validity',
    expression: 'units_sold < 0 OR transactions_count < 0 OR stock_level < 0',
    threshold: '0 tolerated in gold',
    rowsEvaluated: 1_284_610,
    rowsFailed: 0,
    status: 'pass',
    action: 'Bounded at silver; nothing negative published',
    lastRun: '2026-08-04 04:10 local',
  },
  {
    id: 'gd-otd',
    layer: 'Gold',
    rule: 'On-time flag derived from dates only',
    object: 'supplier_orders',
    dimension: 'Governance',
    expression: 'on_time <> (actual_delivery_date <= expected_delivery_date)',
    threshold: '0 tolerated',
    rowsEvaluated: 128_940,
    rowsFailed: 0,
    status: 'pass',
    action: 'No manually typed on-time flags detected',
    lastRun: '2026-08-04 03:30 local',
  },
  {
    id: 'gd-comp-freshness',
    layer: 'Gold',
    rule: 'Observation freshness',
    object: 'competitor_prices',
    dimension: 'Timeliness',
    expression: 'current_date - observation_date > 14',
    threshold: '≥ 70% of tracked SKUs fresh',
    rowsEvaluated: 96_420,
    rowsFailed: 34_708,
    status: 'warn',
    action: 'Stale observations dropped from gap metrics; coverage now 64% after the bronze contract break',
    lastRun: '2026-08-04 05:00 local',
  },

  // -------------------------------------------------------------- Semantic
  {
    id: 'sm-allowlist',
    layer: 'Semantic',
    rule: 'Metric allow-list',
    object: 'retail-ontology metric requests',
    dimension: 'Governance',
    expression: 'requested_metric NOT IN certified_metrics(dataset)',
    threshold: '0 uncertified metrics executed',
    rowsEvaluated: 3_182,
    rowsFailed: 41,
    status: 'pass',
    action: '41 requests refused and re-planned onto a certified dataset instead of approximated',
    lastRun: 'rolling · last 7 days',
  },
  {
    id: 'sm-placeholder',
    layer: 'Semantic',
    rule: 'Placeholder guardrail (0 model-written digits)',
    object: 'narrated answers',
    dimension: 'Governance',
    expression: 'answer contains a numeral not resolved from a computed placeholder',
    threshold: '0 tolerated',
    rowsEvaluated: 3_182,
    rowsFailed: 0,
    status: 'pass',
    action: 'Every figure substituted from code; 27 drafts rewritten before release',
    lastRun: 'rolling · last 7 days',
  },
  {
    id: 'sm-sample-floor',
    layer: 'Semantic',
    rule: 'Sample-size floor',
    object: 'fact executions',
    dimension: 'Completeness',
    expression: 'records_scanned < sample_floor(metric)',
    threshold: 'below floor → state uncertainty',
    rowsEvaluated: 3_182,
    rowsFailed: 96,
    status: 'pass',
    action: '96 answers downgraded to a stated-uncertainty response rather than estimating',
    lastRun: 'rolling · last 7 days',
  },
];

export type LayerScore = {
  layer: DQRuleRun['layer'];
  gates: number;
  passed: number;
  warned: number;
  failed: number;
  rowsEvaluated: number;
  rowsFailed: number;
  failRatePct: number;
  status: DQStatus;
  runs: DQRuleRun[];
};

const LAYER_ORDER: DQRuleRun['layer'][] = ['Source', 'Bronze', 'Silver', 'Gold', 'Semantic'];

export function layerScorecard(): LayerScore[] {
  return LAYER_ORDER.map((layer) => {
    const runs = DQ_RULE_RUNS.filter((r) => r.layer === layer);
    const rowsEvaluated = runs.reduce((n, r) => n + r.rowsEvaluated, 0);
    const rowsFailed = runs.reduce((n, r) => n + r.rowsFailed, 0);
    const failed = runs.filter((r) => r.status === 'fail').length;
    const warned = runs.filter((r) => r.status === 'warn').length;
    return {
      layer,
      gates: runs.length,
      passed: runs.filter((r) => r.status === 'pass').length,
      warned,
      failed,
      rowsEvaluated,
      rowsFailed,
      failRatePct: rowsEvaluated ? (rowsFailed / rowsEvaluated) * 100 : 0,
      status: failed > 0 ? 'fail' : warned > 0 ? 'warn' : 'pass',
      runs,
    };
  });
}

export const DQ_STATUS_STYLES: Record<DQStatus, { badge: string; label: string; dot: string }> = {
  pass: { badge: 'bg-status-good/10 text-status-good', label: 'Pass', dot: 'bg-status-good' },
  warn: { badge: 'bg-status-warning/10 text-status-warning', label: 'Warn', dot: 'bg-status-warning' },
  fail: { badge: 'bg-destructive/10 text-destructive', label: 'Fail', dot: 'bg-destructive' },
};

export function formatRows(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return n.toLocaleString('en-US');
}
