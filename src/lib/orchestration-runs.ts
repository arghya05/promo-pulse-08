/**
 * Pipeline orchestration: the DAG that lands, conforms and certifies every feed.
 *
 * Everything a reader sees is computed from the run rows below — attempt counts,
 * SLA breach, watermark lag, backfill coverage and CDC/SCD2 history health.
 * No number is hand-typed into the UI.
 */

export type RunState = 'success' | 'retried' | 'running' | 'failed' | 'skipped';

export type TaskRun = {
  id: string;
  /** DAG node name as scheduled. */
  task: string;
  layer: 'Source' | 'Bronze' | 'Silver' | 'Gold' | 'Semantic';
  /** Upstream DAG dependencies (task ids). */
  dependsOn: string[];
  state: RunState;
  attempts: number;
  maxAttempts: number;
  startedAt: string;
  durationSec: number;
  /** Median duration over the last 30 runs — used for drift detection. */
  medianSec: number;
  rowsIn: number;
  rowsOut: number;
  /** Idempotency strategy that makes a replay safe. */
  idempotency: string;
  /** Load pattern for the target object. */
  loadPattern: 'CDC merge' | 'SCD2 history' | 'Incremental append' | 'Full refresh' | 'Snapshot diff';
  note: string;
};

export const TASK_RUNS: TaskRun[] = [
  {
    id: 'land_pos',
    task: 'land.pos_drawer_files',
    layer: 'Source',
    dependsOn: [],
    state: 'retried',
    attempts: 2,
    maxAttempts: 4,
    startedAt: '2026-08-05 02:10 UTC',
    durationSec: 412,
    medianSec: 388,
    rowsIn: 41_286_904,
    rowsOut: 41_286_904,
    idempotency: 'Object key + drawer_close_ts dedupe; re-landing the same file is a no-op',
    loadPattern: 'Incremental append',
    note: '4 stores timed out on first attempt; second attempt landed all 1,486 drawers',
  },
  {
    id: 'land_inv',
    task: 'land.inventory_snapshots',
    layer: 'Source',
    dependsOn: [],
    state: 'success',
    attempts: 1,
    maxAttempts: 4,
    startedAt: '2026-08-05 02:10 UTC',
    durationSec: 168,
    medianSec: 171,
    rowsIn: 18_402_115,
    rowsOut: 18_402_115,
    idempotency: 'Snapshot keyed on (store, sku, snapshot_ts) — replay overwrites the same key',
    loadPattern: 'Snapshot diff',
    note: '11 store snapshots arrived stale and are carried forward with a staleness flag',
  },
  {
    id: 'land_supplier',
    task: 'land.supplier_asn_edi856',
    layer: 'Source',
    dependsOn: [],
    state: 'success',
    attempts: 1,
    maxAttempts: 4,
    startedAt: '2026-08-05 01:40 UTC',
    durationSec: 94,
    medianSec: 88,
    rowsIn: 612_884,
    rowsOut: 612_884,
    idempotency: 'EDI interchange control number is the natural dedupe key',
    loadPattern: 'Incremental append',
    note: '2 trading partners re-sent yesterday’s interchange; duplicates dropped on control number',
  },
  {
    id: 'bronze_pos',
    task: 'bronze.pos_lines_typed',
    layer: 'Bronze',
    dependsOn: ['land_pos'],
    state: 'success',
    attempts: 1,
    maxAttempts: 3,
    startedAt: '2026-08-05 02:18 UTC',
    durationSec: 305,
    medianSec: 297,
    rowsIn: 41_286_904,
    rowsOut: 41_282_671,
    idempotency: 'Partition-overwrite by business_date; safe to rerun any date',
    loadPattern: 'Incremental append',
    note: '4,233 unparseable lines routed to the quarantine table, not dropped',
  },
  {
    id: 'silver_sales',
    task: 'silver.sales_line_conformed',
    layer: 'Silver',
    dependsOn: ['bronze_pos', 'silver_product_scd'],
    state: 'success',
    attempts: 1,
    maxAttempts: 3,
    startedAt: '2026-08-05 02:26 UTC',
    durationSec: 528,
    medianSec: 441,
    rowsIn: 41_282_671,
    rowsOut: 40_913_450,
    idempotency: 'MERGE on (store_id, txn_id, line_no) — reruns update in place',
    loadPattern: 'CDC merge',
    note: 'Voids and replays collapsed; runtime 20% above median from the late-arriving replay window',
  },
  {
    id: 'silver_product_scd',
    task: 'silver.product_dim_scd2',
    layer: 'Silver',
    dependsOn: [],
    state: 'success',
    attempts: 1,
    maxAttempts: 3,
    startedAt: '2026-08-05 02:14 UTC',
    durationSec: 86,
    medianSec: 82,
    rowsIn: 148_902,
    rowsOut: 149_118,
    idempotency: 'Hash-diff on tracked attributes; unchanged rows produce no new version',
    loadPattern: 'SCD2 history',
    note: '216 new versions opened (cost and pack-size changes); prior versions end-dated, none overwritten',
  },
  {
    id: 'silver_inv',
    task: 'silver.inventory_position',
    layer: 'Silver',
    dependsOn: ['land_inv', 'silver_product_scd'],
    state: 'success',
    attempts: 1,
    maxAttempts: 3,
    startedAt: '2026-08-05 02:22 UTC',
    durationSec: 214,
    medianSec: 205,
    rowsIn: 18_402_115,
    rowsOut: 18_388_004,
    idempotency: 'MERGE on (store_id, sku, as_of_date)',
    loadPattern: 'CDC merge',
    note: '14,111 negative on-hand rows clamped to zero and logged as shrink adjustments',
  },
  {
    id: 'gold_kpi',
    task: 'gold.kpi_measures_daily',
    layer: 'Gold',
    dependsOn: ['silver_sales', 'silver_inv'],
    state: 'success',
    attempts: 1,
    maxAttempts: 2,
    startedAt: '2026-08-05 02:36 UTC',
    durationSec: 386,
    medianSec: 372,
    rowsIn: 59_301_454,
    rowsOut: 2_641_880,
    idempotency: 'Recomputed per business_date partition from silver — deterministic given the same watermark',
    loadPattern: 'Full refresh',
    note: 'Restated 2 prior business dates pulled in by the replay watermark',
  },
  {
    id: 'gold_osa',
    task: 'gold.availability_daily',
    layer: 'Gold',
    dependsOn: ['silver_inv', 'silver_sales'],
    state: 'running',
    attempts: 1,
    maxAttempts: 2,
    startedAt: '2026-08-05 02:44 UTC',
    durationSec: 141,
    medianSec: 233,
    rowsIn: 18_388_004,
    rowsOut: 0,
    idempotency: 'Partition-overwrite by as_of_date',
    loadPattern: 'Full refresh',
    note: 'In flight — 11 stale store snapshots will be excluded rather than counted as in-stock',
  },
  {
    id: 'semantic_certify',
    task: 'semantic.certify_metric_contracts',
    layer: 'Semantic',
    dependsOn: ['gold_kpi'],
    state: 'success',
    attempts: 1,
    maxAttempts: 2,
    startedAt: '2026-08-05 02:43 UTC',
    durationSec: 47,
    medianSec: 44,
    rowsIn: 2_641_880,
    rowsOut: 2_641_880,
    idempotency: 'Contract check is read-only; publishes an allow-list version',
    loadPattern: 'Full refresh',
    note: '38 of 39 metrics certified; competitor price index held at "provisional" pending crawl backfill',
  },
  {
    id: 'gold_competitor',
    task: 'gold.competitor_price_index',
    layer: 'Gold',
    dependsOn: [],
    state: 'failed',
    attempts: 3,
    maxAttempts: 3,
    startedAt: '2026-08-05 02:20 UTC',
    durationSec: 63,
    medianSec: 119,
    rowsIn: 18_204,
    rowsOut: 0,
    idempotency: 'MERGE on (sku, competitor, observed_date)',
    loadPattern: 'CDC merge',
    note: 'Crawl coverage 61% — below the 85% contract floor, so the gate refused to publish a partial index',
  },
];

export type FreshnessSla = {
  object: string;
  layer: TaskRun['layer'];
  /** Promised max age of the data behind an answer. */
  targetMin: number;
  actualMin: number;
  /** Event-time watermark the pipeline has closed. */
  watermark: string;
  /** How far behind event time the watermark sits. */
  watermarkLagMin: number;
  /** How long the pipeline waits for late events before sealing a partition. */
  lateArrivalWindow: string;
  lateRowsAccepted: number;
  lateRowsRejected: number;
};

export const FRESHNESS_SLAS: FreshnessSla[] = [
  {
    object: 'gold.kpi_measures_daily',
    layer: 'Gold',
    targetMin: 90,
    actualMin: 62,
    watermark: '2026-08-05 01:00 UTC',
    watermarkLagMin: 104,
    lateArrivalWindow: '72h grace, then sealed',
    lateRowsAccepted: 318_402,
    lateRowsRejected: 1_204,
  },
  {
    object: 'gold.availability_daily',
    layer: 'Gold',
    targetMin: 60,
    actualMin: 74,
    watermark: '2026-08-05 02:00 UTC',
    watermarkLagMin: 46,
    lateArrivalWindow: '6h grace (snapshot feed)',
    lateRowsAccepted: 41_118,
    lateRowsRejected: 8_902,
  },
  {
    object: 'silver.sales_line_conformed',
    layer: 'Silver',
    targetMin: 45,
    actualMin: 34,
    watermark: '2026-08-05 02:15 UTC',
    watermarkLagMin: 29,
    lateArrivalWindow: '72h grace, then sealed',
    lateRowsAccepted: 402_665,
    lateRowsRejected: 1_204,
  },
  {
    object: 'gold.competitor_price_index',
    layer: 'Gold',
    targetMin: 240,
    actualMin: 1_486,
    watermark: '2026-08-03 22:00 UTC',
    watermarkLagMin: 1_724,
    lateArrivalWindow: '24h grace',
    lateRowsAccepted: 0,
    lateRowsRejected: 0,
  },
];

export type BackfillJob = {
  id: string;
  reason: string;
  target: string;
  fromDate: string;
  toDate: string;
  partitionsTotal: number;
  partitionsDone: number;
  rowsRestated: number;
  /** Whether downstream answers were re-pointed after restatement. */
  downstreamRefreshed: boolean;
  status: 'complete' | 'in-progress' | 'queued';
};

export const BACKFILL_JOBS: BackfillJob[] = [
  {
    id: 'bf-replay-aug',
    reason: 'Late POS replay batch for 2 business dates (register re-transmit)',
    target: 'gold.kpi_measures_daily',
    fromDate: '2026-08-02',
    toDate: '2026-08-03',
    partitionsTotal: 2,
    partitionsDone: 2,
    rowsRestated: 318_402,
    downstreamRefreshed: true,
    status: 'complete',
  },
  {
    id: 'bf-cost-restate',
    reason: 'Supplier cost correction — 216 SCD2 versions re-opened with corrected landed cost',
    target: 'gold.kpi_measures_daily (margin)',
    fromDate: '2026-07-20',
    toDate: '2026-08-04',
    partitionsTotal: 16,
    partitionsDone: 11,
    rowsRestated: 1_204_886,
    downstreamRefreshed: false,
    status: 'in-progress',
  },
  {
    id: 'bf-crawl-gap',
    reason: 'Competitor crawl gap — rebuild index once coverage clears the 85% floor',
    target: 'gold.competitor_price_index',
    fromDate: '2026-08-03',
    toDate: '2026-08-05',
    partitionsTotal: 3,
    partitionsDone: 0,
    rowsRestated: 0,
    downstreamRefreshed: false,
    status: 'queued',
  },
];

export const RUN_STATE_STYLES: Record<RunState, { label: string; badge: string }> = {
  success: { label: 'Success', badge: 'bg-status-good/10 text-status-good border-status-good/30' },
  retried: { label: 'Retried', badge: 'bg-status-warning/10 text-status-warning border-status-warning/30' },
  running: { label: 'Running', badge: 'bg-primary/10 text-primary border-primary/30' },
  failed: { label: 'Failed', badge: 'bg-destructive/10 text-destructive border-destructive/30' },
  skipped: { label: 'Skipped', badge: 'bg-muted text-muted-foreground border-border' },
};

export function orchestrationSummary() {
  const total = TASK_RUNS.length;
  const failed = TASK_RUNS.filter((t) => t.state === 'failed').length;
  const retried = TASK_RUNS.filter((t) => t.state === 'retried').length;
  const running = TASK_RUNS.filter((t) => t.state === 'running').length;
  const settled = total - running;
  const succeeded = TASK_RUNS.filter((t) => t.state === 'success' || t.state === 'retried').length;
  const successRate = settled > 0 ? (succeeded / settled) * 100 : 0;
  const attempts = TASK_RUNS.reduce((s, t) => s + t.attempts, 0);
  const retryRatio = total > 0 ? attempts / total : 0;
  const slaBreached = FRESHNESS_SLAS.filter((s) => s.actualMin > s.targetMin).length;
  const worstSla = FRESHNESS_SLAS.reduce((worst, s) =>
    s.actualMin / s.targetMin > worst.actualMin / worst.targetMin ? s : worst,
  );
  const rowsProcessed = TASK_RUNS.reduce((s, t) => s + t.rowsIn, 0);
  const lateAccepted = FRESHNESS_SLAS.reduce((s, f) => s + f.lateRowsAccepted, 0);
  const lateRejected = FRESHNESS_SLAS.reduce((s, f) => s + f.lateRowsRejected, 0);
  const partitionsTotal = BACKFILL_JOBS.reduce((s, b) => s + b.partitionsTotal, 0);
  const partitionsDone = BACKFILL_JOBS.reduce((s, b) => s + b.partitionsDone, 0);
  const rowsRestated = BACKFILL_JOBS.reduce((s, b) => s + b.rowsRestated, 0);
  const driftTasks = TASK_RUNS.filter((t) => t.durationSec > t.medianSec * 1.15 && t.state !== 'running');

  return {
    total,
    failed,
    retried,
    running,
    successRate,
    retryRatio,
    slaBreached,
    worstSla,
    rowsProcessed,
    lateAccepted,
    lateRejected,
    partitionsTotal,
    partitionsDone,
    backfillCoverage: partitionsTotal > 0 ? (partitionsDone / partitionsTotal) * 100 : 100,
    rowsRestated,
    driftTasks,
  };
}

/** Longest dependency chain through the DAG — the answer's critical path. */
export function criticalPath(): TaskRun[] {
  const byId = new Map(TASK_RUNS.map((t) => [t.id, t]));
  const memo = new Map<string, TaskRun[]>();
  const walk = (id: string): TaskRun[] => {
    if (memo.has(id)) return memo.get(id)!;
    const task = byId.get(id);
    if (!task) return [];
    let best: TaskRun[] = [];
    let bestCost = -1;
    for (const dep of task.dependsOn) {
      const chain = walk(dep);
      const cost = chain.reduce((s, t) => s + t.durationSec, 0);
      if (cost > bestCost) {
        bestCost = cost;
        best = chain;
      }
    }
    const path = [...best, task];
    memo.set(id, path);
    return path;
  };
  let winner: TaskRun[] = [];
  let winnerCost = -1;
  for (const t of TASK_RUNS) {
    const path = walk(t.id);
    const cost = path.reduce((s, x) => s + x.durationSec, 0);
    if (cost > winnerCost) {
      winnerCost = cost;
      winner = path;
    }
  }
  return winner;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

export function formatLag(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
