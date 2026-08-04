/**
 * Ingestion & data-quality profile for the Everline merchandising lakehouse.
 *
 * This describes the physical ingestion estate behind the knowledge graph:
 * which feeds land, how they land, what is checked at each medallion layer,
 * and — crucially — how messy real-world retail data is handled rather than
 * silently "cleaned away".
 */

export type Feed = {
  id: string;
  name: string;
  system: string;
  format: string;
  mode: 'Stream' | 'Micro-batch' | 'Batch' | 'API pull' | 'EDI';
  cadence: string;
  volume: string;
  bronzeObject: string;
  goldTables: string[];
  lateArrival: string;
  ownership: string;
};

export const FEEDS: Feed[] = [
  {
    id: 'pos',
    name: 'Store POS & self-checkout baskets',
    system: 'NCR / Toshiba POS · 1,486 stores',
    format: 'JSON lines (drawer close payload)',
    mode: 'Stream',
    cadence: 'micro-batch every 5 min · ≤42 min end-to-end',
    volume: '~68M basket lines / week',
    bronzeObject: 'raw_pos.basket_line_stream',
    goldTables: ['transactions', 'kpi_measures'],
    lateArrival: '72h watermark; store day re-stated on close-of-day file',
    ownership: 'Store Systems',
  },
  {
    id: 'ecom',
    name: 'Digital orders & fulfilment',
    system: 'Everline digital commerce · OMS',
    format: 'Kafka Avro events',
    mode: 'Stream',
    cadence: 'continuous',
    volume: '~2.1M orders / week',
    bronzeObject: 'raw_ecom.order_event',
    goldTables: ['orders', 'order_items', 'transactions'],
    lateArrival: 'event-time ordering, 24h replay window',
    ownership: 'Digital',
  },
  {
    id: 'inventory',
    name: 'Perpetual inventory & shelf positions',
    system: 'Manhattan WMS · store perpetual inventory',
    format: 'Parquet snapshot + delta',
    mode: 'Micro-batch',
    cadence: 'hourly snapshot, nightly full',
    volume: '~41M store × SKU positions / day',
    bronzeObject: 'raw_inv.position_snapshot',
    goldTables: ['inventory_levels', 'stock_age_tracking'],
    lateArrival: 'snapshot is authoritative; missing store falls back to last good snapshot and is flagged stale',
    ownership: 'Supply Chain Systems',
  },
  {
    id: 'vendor',
    name: 'Vendor cost, PO & delivery confirmations',
    system: 'Vendor EDI 832 / 850 / 856',
    format: 'X12 EDI',
    mode: 'EDI',
    cadence: 'daily per vendor window',
    volume: '~9,400 documents / day',
    bronzeObject: 'raw_vendor.edi_document',
    goldTables: ['supplier_orders', 'purchase_orders', 'products'],
    lateArrival: 'effective-dated; late cost restates margin for the affected days only',
    ownership: 'Merchandising Finance',
  },
  {
    id: 'master',
    name: 'Item, store & hierarchy master data',
    system: 'PIM / MDM',
    format: 'CDC change log',
    mode: 'Micro-batch',
    cadence: 'every 15 min',
    volume: '~120k changes / day',
    bronzeObject: 'raw_mdm.item_store_cdc',
    goldTables: ['products', 'stores'],
    lateArrival: 'slowly-changing dimension type 2 — no history overwritten',
    ownership: 'Master Data Governance',
  },
  {
    id: 'promo',
    name: 'Promotions, markdowns & trade funding',
    system: 'Promotion planning · trade agreement master',
    format: 'API pull (REST)',
    mode: 'API pull',
    cadence: '4× daily',
    volume: '~3,800 active offers',
    bronzeObject: 'raw_promo.offer_version',
    goldTables: ['promotions', 'markdowns', 'discounts'],
    lateArrival: 'offer versions immutable; retro edits land as new version',
    ownership: 'Promotion Planning',
  },
  {
    id: 'competitor',
    name: 'Competitor shelf pricing',
    system: 'Third-party price crawl panel',
    format: 'CSV drop (SFTP)',
    mode: 'Batch',
    cadence: 'weekly per market',
    volume: '~1.4M price observations / week',
    bronzeObject: 'raw_ext.competitor_price_drop',
    goldTables: ['competitor_prices', 'competitor_data'],
    lateArrival: 'observation-dated; stale >14 days excluded from gap metrics',
    ownership: 'Pricing',
  },
  {
    id: 'space',
    name: 'Planograms, fixtures & space compliance',
    system: 'Space planning (JDA-class)',
    format: 'XML planogram export',
    mode: 'Batch',
    cadence: 'per reset cycle',
    volume: '~5,900 planogram versions',
    bronzeObject: 'raw_space.planogram_export',
    goldTables: ['planograms', 'shelf_allocations', 'fixtures'],
    lateArrival: 'version + effective date; superseded versions retained',
    ownership: 'Space Planning',
  },
];

export type LayerStage = {
  layer: 'Source' | 'Bronze' | 'Silver' | 'Gold' | 'Semantic';
  title: string;
  intent: string;
  rules: string[];
  checks: { name: string; gate: string }[];
  onFailure: string;
};

export const INGESTION_STAGES: LayerStage[] = [
  {
    layer: 'Source',
    title: 'Source capture',
    intent: 'Take the feed exactly as the operational system emits it. No interpretation.',
    rules: [
      'Every feed has a named owning system, owner team and expected arrival window',
      'Payloads captured with source file hash, ingest timestamp and event time',
      'No column renames, no unit conversion, no filtering at capture',
    ],
    checks: [
      { name: 'Arrival SLA', gate: 'feed lands inside its window; missed window pages the owning team' },
      { name: 'Completeness signal', gate: 'store/vendor count in file vs expected roster' },
      { name: 'File integrity', gate: 'hash + row-count trailer must match' },
    ],
    onFailure: 'Feed marked late/incomplete; downstream layers keep the previous good version and mark freshness stale.',
  },
  {
    layer: 'Bronze',
    title: 'Raw landing (immutable)',
    intent: 'Append-only history of what actually arrived, so any number can be replayed.',
    rules: [
      'Insert-only — nothing is updated or deleted, corrections arrive as new rows',
      'Schema-on-read with a schema contract; unexpected columns retained, not dropped',
      'Duplicate file hashes rejected; duplicate rows kept and de-duplicated later with lineage',
    ],
    checks: [
      { name: 'Schema contract', gate: 'required fields present and typed; breaking change quarantines the batch' },
      { name: 'Duplicate file guard', gate: 'same source hash cannot land twice' },
      { name: 'Late-arrival watermark', gate: 'event time within the feed watermark or routed to late partition' },
    ],
    onFailure: 'Batch quarantined to raw_quarantine.* with the reject reason; nothing partially published.',
  },
  {
    layer: 'Silver',
    title: 'Curated & conformed',
    intent: 'Make messy operational rows comparable: conform keys, net the noise, keep the truth.',
    rules: [
      'Keys conformed to item/store/vendor master (SCD2) — unmatched keys quarantined, never guessed',
      'Voids and returns netted as signed rows; returns flagged, never deleted',
      'Tax split out, UOM normalised to selling unit, currency to USD at posting-date rate',
      'De-duplication on natural key + event time, keeping the latest version with a version trail',
      'Cost joined effective-dated so margin uses the cost that applied that day',
    ],
    checks: [
      { name: 'Referential integrity', gate: 'SKU + store resolve to master keys' },
      { name: 'Grain uniqueness', gate: 'no duplicate natural key at stated grain' },
      { name: 'Range bounds', gate: 'margin ≥ −100%, qty ≠ 0, price ≥ 0' },
      { name: 'Orphan rate', gate: 'unmatched rows < 0.5% or the model fails the run' },
    ],
    onFailure: 'Bad rows go to a quarantine table with reason codes; the model publishes only if orphan/dup thresholds hold.',
  },
  {
    layer: 'Gold',
    title: 'Certified marts',
    intent: 'One certified table per business fact, signed off and tied out to finance.',
    rules: [
      'Pre-aggregated to a declared grain (e.g. day × store × category)',
      'Last-year comp basis attached so YoY is computed on a like-for-like calendar',
      'Only certified measures published; ad-hoc columns stay in silver',
      'Restatements are versioned and dated — history is never silently rewritten',
    ],
    checks: [
      { name: 'GL tie-out', gate: 'net sales within 0.1% of the general ledger' },
      { name: 'Grain uniqueness', gate: 'primary key unique at the published grain' },
      { name: 'Comp basis present', gate: 'LY rows exist for every current-period key' },
      { name: 'Non-negative counts', gate: 'units, transactions and stock counts ≥ 0' },
    ],
    onFailure: 'Publish blocked and the previous certified snapshot stays live; the dataset shows as stale in the graph.',
  },
  {
    layer: 'Semantic',
    title: 'Governed semantic layer',
    intent: 'The only surface Maya can query — metrics as formulas over certified rows.',
    rules: [
      'Metric formulas executed in code, not written by the model',
      'Dataset allow-list: a metric can only be requested where it is certified',
      'Sample-size floor and time-window guard before any figure is narrated',
      'Every narrated number replaced from a computed placeholder, so 0 digits are model-written',
    ],
    checks: [
      { name: 'Metric allow-list', gate: 'metric certified on the requested dataset' },
      { name: 'Placeholder guardrail', gate: 'every figure resolved from code, else the answer is rejected' },
      { name: 'Sample-size floor', gate: 'below the floor the engine says so rather than estimating' },
    ],
    onFailure: 'Answer is withheld or downgraded to a stated-uncertainty response; nothing is estimated.',
  },
];

export type MessyPattern = {
  id: string;
  pattern: string;
  reality: string;
  detectedAt: LayerStage['layer'];
  handling: string;
  outcome: string;
  observed: string;
};

export const MESSY_DATA_PLAYBOOK: MessyPattern[] = [
  {
    id: 'dup-baskets',
    pattern: 'Duplicate basket replays',
    reality: 'A register resends its drawer file after a network drop, so the same basket lands twice.',
    detectedAt: 'Bronze',
    handling: 'File hash guard rejects the exact re-send; row-level de-dup on (store, register, basket, event time) at silver keeps the latest version.',
    outcome: 'Sales are counted once; both raw copies remain in bronze for audit.',
    observed: '0.31% of basket lines arrive as replays',
  },
  {
    id: 'unmapped-sku',
    pattern: 'Unmapped or new SKUs',
    reality: 'A store rings an item before PIM publishes it, so the SKU has no master record.',
    detectedAt: 'Silver',
    handling: 'Row is quarantined against an "unmatched item" bucket, not force-mapped; it re-enters automatically when the master record lands.',
    outcome: 'Category metrics never absorb a guessed hierarchy; the quarantine size is published.',
    observed: '~0.18% of lines pending item master',
  },
  {
    id: 'returns',
    pattern: 'Returns, voids & post-void corrections',
    reality: 'A cashier voids a line minutes later, or a customer returns three weeks later.',
    detectedAt: 'Silver',
    handling: 'Signed netting with a return flag; the return is attributed to the return date and linked to the original order where available.',
    outcome: 'Return rate is measurable instead of being hidden by deletions.',
    observed: 'return rate 1.9% of net sales',
  },
  {
    id: 'late-cost',
    pattern: 'Late or retro-active vendor cost',
    reality: 'Cost or allowance files arrive days after the sales they apply to.',
    detectedAt: 'Silver',
    handling: 'Effective-dated cost join plus a bounded restatement of the affected days only, versioned in gold.',
    outcome: 'Margin corrects transparently; prior answers can be replayed at the version they used.',
    observed: '2.4% of days restated within a 7-day window',
  },
  {
    id: 'missing-snapshot',
    pattern: 'Missing store inventory snapshot',
    reality: 'A store loses connectivity and skips its hourly perpetual inventory push.',
    detectedAt: 'Source',
    handling: 'Last good snapshot is carried with a staleness flag; the store is excluded from availability metrics past the tolerance.',
    outcome: 'On-shelf availability is not inflated by assuming stock is unchanged.',
    observed: '~11 stores/day carried stale, <0.8% of positions',
  },
  {
    id: 'negative-stock',
    pattern: 'Negative or impossible stock',
    reality: 'Shrink, mis-scans and cycle-count timing produce negative perpetual inventory.',
    detectedAt: 'Silver',
    handling: 'Value preserved but bounded for metrics; the negative is surfaced as a shrink/accuracy signal rather than clipped to zero silently.',
    outcome: 'Inventory accuracy stays auditable and shrink is quantified.',
    observed: '1.2% of store × SKU positions negative at some point',
  },
  {
    id: 'unit-mismatch',
    pattern: 'UOM & weighted-item mismatch',
    reality: 'Fresh items sell by weight but are ordered by case, so units are not comparable.',
    detectedAt: 'Silver',
    handling: 'Normalise to selling UOM with the item conversion factor; items missing a factor are excluded from unit metrics but kept for value metrics.',
    outcome: 'Units and sell-through stay comparable across fresh and packaged.',
    observed: '~9% of fresh lines weight-based',
  },
  {
    id: 'calendar',
    pattern: 'Shifting retail calendar & holidays',
    reality: 'Fiscal weeks move year to year, so raw date-on-date comparison is wrong.',
    detectedAt: 'Gold',
    handling: 'Comp basis built from the retail calendar (week/period alignment plus holiday shift), attached to every gold row.',
    outcome: 'YoY is like-for-like rather than calendar-naive.',
    observed: '53-week year handled explicitly',
  },
  {
    id: 'crawl-gaps',
    pattern: 'Sparse competitor crawl coverage',
    reality: 'The panel misses SKUs or markets in a given week.',
    detectedAt: 'Silver',
    handling: 'Observation-dated only — no interpolation; gaps stay gaps and observations older than 14 days drop out of gap metrics.',
    outcome: 'Price-gap answers state coverage instead of inventing a competitor price.',
    observed: 'weekly coverage 72–86% of tracked SKUs',
  },
  {
    id: 'schema-drift',
    pattern: 'Upstream schema drift',
    reality: 'A source system adds or renames a field without notice.',
    detectedAt: 'Bronze',
    handling: 'Schema contract fails the batch into quarantine; unknown columns are retained so nothing is lost while the contract is updated.',
    outcome: 'Silent nulls never reach gold; the feed shows as blocked, not empty.',
    observed: '3 contract breaks in the last 90 days, all caught at bronze',
  },
];
