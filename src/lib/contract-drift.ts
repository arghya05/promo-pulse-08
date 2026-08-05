/**
 * Schema-contract enforcement and the quarantine (dead-letter) queue.
 *
 * Every producer feed is bound to a versioned contract. When the producer
 * changes shape, the drift is classified as additive (auto-absorbed),
 * compatible (mapped) or breaking (batch held). Rows that fail row-level
 * validation land in quarantine with the exact rule, and are replayed once the
 * fix ships — nothing is silently dropped.
 */

export type DriftClass = 'additive' | 'compatible' | 'breaking';
export type DriftAction = 'absorbed' | 'mapped' | 'held' | 'awaiting-producer';

export type ContractDrift = {
  id: string;
  feed: string;
  contract: string;
  contractVersion: string;
  detectedAt: string;
  change: string;
  driftClass: DriftClass;
  action: DriftAction;
  /** What the enforcement layer did, in pipeline terms. */
  resolution: string;
  rowsAffected: number;
  /** Downstream gold/semantic objects that would have broken without enforcement. */
  downstream: string[];
  autoResolved: boolean;
};

export const CONTRACT_DRIFTS: ContractDrift[] = [
  {
    id: 'drift-pos-col',
    feed: 'POS drawer files (register export v4)',
    contract: 'contract.pos_line',
    contractVersion: 'v4.2 → v4.3',
    detectedAt: '2026-08-05 02:12 UTC',
    change: 'New column `loyalty_offer_id` appeared after column 34',
    driftClass: 'additive',
    action: 'absorbed',
    resolution: 'Column added to bronze as nullable, contract auto-bumped to v4.3; no downstream change',
    rowsAffected: 41_286_904,
    downstream: ['silver.sales_line_conformed'],
    autoResolved: true,
  },
  {
    id: 'drift-inv-type',
    feed: 'Inventory hourly snapshot',
    contract: 'contract.inventory_snapshot',
    contractVersion: 'v2.1',
    detectedAt: '2026-08-05 02:11 UTC',
    change: '`on_hand_qty` arrived as string with thousands separators ("1,204")',
    driftClass: 'compatible',
    action: 'mapped',
    resolution: 'Cast rule applied at bronze: strip separators → integer; 3 unparseable values quarantined',
    rowsAffected: 18_402_115,
    downstream: ['silver.inventory_position', 'gold.availability_daily'],
    autoResolved: true,
  },
  {
    id: 'drift-supplier-key',
    feed: 'Supplier ASN (EDI 856)',
    contract: 'contract.supplier_asn',
    contractVersion: 'v3.0',
    detectedAt: '2026-08-04 21:48 UTC',
    change: '`vendor_code` changed grain — 6-char legacy code replaced by 9-char GLN for 12 partners',
    driftClass: 'breaking',
    action: 'held',
    resolution: 'Batch held at bronze; crosswalk table extended for 12 partners, then released and replayed',
    rowsAffected: 84_206,
    downstream: ['silver.supplier_performance', 'gold.otd_daily'],
    autoResolved: false,
  },
  {
    id: 'drift-crawl-schema',
    feed: 'Competitor price crawl',
    contract: 'contract.competitor_observation',
    contractVersion: 'v1.4',
    detectedAt: '2026-08-04 18:02 UTC',
    change: 'Price field switched from dollars to cents for one retailer; `currency_unit` absent',
    driftClass: 'breaking',
    action: 'awaiting-producer',
    resolution: 'Feed marked provisional; index publish blocked so no answer can cite a 100× wrong price',
    rowsAffected: 18_204,
    downstream: ['gold.competitor_price_index', 'semantic.price_index_metric'],
    autoResolved: false,
  },
  {
    id: 'drift-cost-precision',
    feed: 'Vendor cost master',
    contract: 'contract.item_cost',
    contractVersion: 'v2.6',
    detectedAt: '2026-08-03 06:20 UTC',
    change: 'Landed cost precision reduced from 4dp to 2dp',
    driftClass: 'compatible',
    action: 'mapped',
    resolution: 'Rounding half-up pinned in the transform; margin restatement queued as a backfill',
    rowsAffected: 149_118,
    downstream: ['gold.kpi_measures_daily'],
    autoResolved: true,
  },
];

export type QuarantineBatch = {
  id: string;
  object: string;
  layer: 'Bronze' | 'Silver';
  /** The failing rule, as a predicate. */
  rule: string;
  reason: string;
  rowsQuarantined: number;
  rowsInBatch: number;
  firstSeen: string;
  /** Owner responsible for the source fix. */
  owner: string;
  replay: {
    status: 'replayed' | 'pending-fix' | 'replaying' | 'expired';
    fix: string;
    rowsRecovered: number;
    replayedAt: string | null;
  };
  /** What answers do while these rows sit outside the gold layer. */
  answerBehaviour: string;
};

export const QUARANTINE_BATCHES: QuarantineBatch[] = [
  {
    id: 'q-pos-parse',
    object: 'bronze.pos_lines_typed',
    layer: 'Bronze',
    rule: "try_cast(line_total AS numeric) IS NULL OR txn_id IS NULL",
    reason: 'Truncated drawer files from 4 stores produced unparseable trailing lines',
    rowsQuarantined: 4_233,
    rowsInBatch: 41_286_904,
    firstSeen: '2026-08-05 02:19 UTC',
    owner: 'Store systems — POS platform team',
    replay: {
      status: 'replayed',
      fix: 'Stores re-transmitted complete drawer files; parser re-run on the quarantined keys only',
      rowsRecovered: 4_233,
      replayedAt: '2026-08-05 03:04 UTC',
    },
    answerBehaviour: 'None — rows recovered before the gold build, so sales answers are complete',
  },
  {
    id: 'q-sku-unknown',
    object: 'silver.sales_line_conformed',
    layer: 'Silver',
    rule: 'sku NOT IN (SELECT sku FROM silver.product_dim_scd2 WHERE is_current)',
    reason: 'New-item setup lag — 288 SKUs scanned before the item master published',
    rowsQuarantined: 66_119,
    rowsInBatch: 41_282_671,
    firstSeen: '2026-08-05 02:31 UTC',
    owner: 'Merchandising — item setup',
    replay: {
      status: 'replaying',
      fix: 'Item master published 288 SKUs; referential replay running against the held keys',
      rowsRecovered: 51_402,
      replayedAt: null,
    },
    answerBehaviour: 'Category totals cite the certified figure and disclose 0.16% of lines pending item setup',
  },
  {
    id: 'q-negative-stock',
    object: 'silver.inventory_position',
    layer: 'Silver',
    rule: 'on_hand_qty < 0',
    reason: 'Negative on-hand from unrecorded shrink and mis-scanned receipts',
    rowsQuarantined: 14_111,
    rowsInBatch: 18_402_115,
    firstSeen: '2026-08-05 02:25 UTC',
    owner: 'Store operations — inventory control',
    replay: {
      status: 'pending-fix',
      fix: 'Cycle-count tasks raised for 1,902 store-SKUs; rows clamp to zero and flag until counted',
      rowsRecovered: 0,
      replayedAt: null,
    },
    answerBehaviour: 'Availability answers exclude the clamped store-SKUs rather than counting them in stock',
  },
  {
    id: 'q-crawl-unit',
    object: 'bronze.competitor_observations',
    layer: 'Bronze',
    rule: 'competitor_price > our_price * 20 OR competitor_price < our_price / 20',
    reason: 'Cents-vs-dollars unit drift on one retailer produced 100× outliers',
    rowsQuarantined: 7_118,
    rowsInBatch: 18_204,
    firstSeen: '2026-08-04 18:06 UTC',
    owner: 'Pricing — competitive intelligence',
    replay: {
      status: 'pending-fix',
      fix: 'Producer must emit `currency_unit`; a unit-inference rule is drafted but not certified',
      rowsRecovered: 0,
      replayedAt: null,
    },
    answerBehaviour: 'Price-index questions refuse the number and answer from the last certified index with its date',
  },
];

export const DRIFT_CLASS_STYLES: Record<DriftClass, { label: string; badge: string }> = {
  additive: { label: 'Additive', badge: 'bg-status-good/10 text-status-good border-status-good/30' },
  compatible: { label: 'Compatible', badge: 'bg-primary/10 text-primary border-primary/30' },
  breaking: { label: 'Breaking', badge: 'bg-destructive/10 text-destructive border-destructive/30' },
};

export const QUARANTINE_STATUS_STYLES: Record<
  QuarantineBatch['replay']['status'],
  { label: string; badge: string }
> = {
  replayed: { label: 'Replayed', badge: 'bg-status-good/10 text-status-good border-status-good/30' },
  replaying: { label: 'Replaying', badge: 'bg-primary/10 text-primary border-primary/30' },
  'pending-fix': { label: 'Pending fix', badge: 'bg-status-warning/10 text-status-warning border-status-warning/30' },
  expired: { label: 'Expired', badge: 'bg-destructive/10 text-destructive border-destructive/30' },
};

export function driftSummary() {
  const total = CONTRACT_DRIFTS.length;
  const breaking = CONTRACT_DRIFTS.filter((d) => d.driftClass === 'breaking').length;
  const auto = CONTRACT_DRIFTS.filter((d) => d.autoResolved).length;
  const autoPct = total > 0 ? (auto / total) * 100 : 0;
  const blockedDownstream = new Set(
    CONTRACT_DRIFTS.filter((d) => !d.autoResolved).flatMap((d) => d.downstream),
  );

  const quarantined = QUARANTINE_BATCHES.reduce((s, q) => s + q.rowsQuarantined, 0);
  const recovered = QUARANTINE_BATCHES.reduce((s, q) => s + q.replay.rowsRecovered, 0);
  const inspected = QUARANTINE_BATCHES.reduce((s, q) => s + q.rowsInBatch, 0);
  const openBatches = QUARANTINE_BATCHES.filter((q) => q.replay.status !== 'replayed').length;

  return {
    total,
    breaking,
    autoPct,
    blockedDownstream: [...blockedDownstream],
    quarantined,
    recovered,
    recoveryPct: quarantined > 0 ? (recovered / quarantined) * 100 : 100,
    quarantineRatePct: inspected > 0 ? (quarantined / inspected) * 100 : 0,
    openBatches,
    /** Rows dropped without a record — the number that must stay at zero. */
    silentlyDropped: 0,
  };
}
