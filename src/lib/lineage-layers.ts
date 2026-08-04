/**
 * Medallion lineage map: how a value travels from the raw source system
 * (bronze landing) through conformed silver models into the governed gold
 * dataset that Maya is allowed to query.
 *
 * This is the physical pipeline description for Everline Retail Group's
 * merchandising lakehouse. Every governed dataset resolves to exactly one
 * gold object, and every gold object declares the silver models, bronze
 * landings and source systems behind it, plus the data-quality gates that
 * must pass before the layer is published.
 */

export type LineageLayer = {
  layer: 'Source' | 'Bronze' | 'Silver' | 'Gold' | 'Semantic';
  object: string;
  system: string;
  transformation: string;
  grain: string;
  cadence: string;
  checks: string[];
};

type TableLineage = {
  /** Human label of the physical gold table. */
  goldLabel: string;
  layers: LineageLayer[];
};

const SEMANTIC_LAYER: LineageLayer = {
  layer: 'Semantic',
  object: 'retail-ontology (certified metrics)',
  system: 'Maya governed semantic layer',
  transformation:
    'Metric formula applied in code over the gold rows returned by the plan — the model may not write digits',
  grain: 'metric × requested dimension',
  cadence: 'per question',
  checks: ['Metric on dataset allow-list', 'Placeholder guardrail replaced every figure', 'Sample-size floor enforced'],
};

const POS_INGEST: LineageLayer[] = [
  {
    layer: 'Source',
    object: 'Store POS registers & self-checkout (1,486 stores)',
    system: 'NCR / Toshiba POS · Everline digital commerce',
    transformation: 'Scan-level baskets streamed on close of drawer; digital orders posted on capture',
    grain: 'basket line',
    cadence: 'near real-time (≤ 42 min end-to-end)',
    checks: ['Register heartbeat', 'Store day-close reconciliation'],
  },
  {
    layer: 'Bronze',
    object: 'raw_pos.basket_line_stream',
    system: 'Lakehouse landing (append-only, immutable)',
    transformation: 'Raw payload landed as-received with ingest timestamp and source file hash — no edits',
    grain: 'basket line as scanned',
    cadence: 'micro-batch every 5 min',
    checks: ['Schema contract', 'Duplicate file hash rejected', 'Late-arrival watermark'],
  },
];

const POS_SILVER: LineageLayer = {
    layer: 'Silver',
    object: 'stg_pos.transaction_line (conformed)',
    system: 'dbt models · lakehouse',
    transformation:
      'Voids/returns netted, tax split out, SKU + store conformed to master keys, COGS joined from vendor cost file to derive line margin',
    grain: 'transaction line × SKU × store',
    cadence: 'hourly',
    checks: ['Referential integrity to product & store master', 'Returns flagged not deleted', 'Margin ≥ −100% bound'],
};

const COST_FEED: LineageLayer = {
  layer: 'Source',
  object: 'Vendor cost & trade-funding files',
  system: 'Vendor EDI 832 / trade agreement master',
  transformation: 'Landed cost and allowance terms per SKU × vendor, effective-dated',
  grain: 'SKU × vendor × effective date',
  cadence: 'daily',
  checks: ['Effective-date continuity', 'Cost > 0'],
};

/** POS ingest -> vendor cost feed -> conformed silver, in pipeline order. */
const POS: LineageLayer[] = [...POS_INGEST, COST_FEED, POS_SILVER];

const TABLE_LINEAGE: Record<string, TableLineage> = {
  kpi_measures: {
    goldLabel: 'Certified daily P&L / KPI fact',
    layers: [
      ...POS,
      {
        layer: 'Gold',
        object: 'kpi_measures',
        system: 'Certified merchandising mart',
        transformation:
          'Transaction lines aggregated to day × store × category, joined to last-year comp basis, margin and rate metrics pre-computed and signed off by Finance',
        grain: 'day × store × category',
        cadence: 'daily 04:10 local, restated on day-close',
        checks: ['Net sales tie-out to GL within 0.1%', 'LY comp basis present', 'No negative unit counts'],
      },
      SEMANTIC_LAYER,
    ],
  },
  transactions: {
    goldLabel: 'POS line-item fact',
    layers: [
      ...POS,
      {
        layer: 'Gold',
        object: 'transactions',
        system: 'Certified merchandising mart',
        transformation:
          'Conformed lines published with promotion attribution, discount type, COGS and margin so SKU-level questions resolve to named products',
        grain: 'transaction line × SKU × store × promotion',
        cadence: 'hourly',
        checks: ['Promotion key resolvable', 'Discount ≤ gross amount', 'Net sales = gross − discount − tax'],
      },
      SEMANTIC_LAYER,
    ],
  },
  inventory_levels: {
    goldLabel: 'Perpetual inventory position',
    layers: [
      {
        layer: 'Source',
        object: 'Store perpetual inventory & DC WMS',
        system: 'Manhattan WMS · store back-office counts',
        transformation: 'On-hand movements, receipts, adjustments and cycle counts emitted per event',
        grain: 'inventory movement',
        cadence: 'every 15 min',
        checks: ['Movement type valid', 'Cycle-count variance capture'],
      },
      {
        layer: 'Bronze',
        object: 'raw_inv.position_snapshot',
        system: 'Lakehouse landing',
        transformation: 'Snapshot files landed unchanged per store per cycle',
        grain: 'store × SKU snapshot',
        cadence: '15 min',
        checks: ['File completeness per store', 'Snapshot timestamp monotonic'],
      },
      {
        layer: 'Silver',
        object: 'stg_inv.on_hand_position',
        system: 'dbt models',
        transformation:
          'Latest snapshot per store × SKU selected, in-transit netted, shelf vs backroom split, reorder point joined from replenishment parameters',
        grain: 'store × SKU',
        cadence: 'hourly',
        checks: ['One row per store × SKU', 'Stock level ≥ 0', 'Reorder point present for active SKUs'],
      },
      {
        layer: 'Gold',
        object: 'inventory_levels',
        system: 'Certified availability mart',
        transformation:
          'Shelf availability, stockout risk band and weeks-of-cover derived against trailing demand to publish the on-shelf availability position',
        grain: 'store × SKU snapshot',
        cadence: 'hourly',
        checks: ['OSA within 0–100%', 'Risk band derived not typed', 'Never-out SKUs monitored'],
      },
      SEMANTIC_LAYER,
    ],
  },
  supplier_orders: {
    goldLabel: 'Supplier order & OTD fact',
    layers: [
      {
        layer: 'Source',
        object: 'Purchase orders, ASNs and DC receipts',
        system: 'Vendor EDI 850/856/861 · DC receiving',
        transformation: 'Order placed, shipment advised and receipt confirmed events captured per PO line',
        grain: 'PO line event',
        cadence: 'continuous',
        checks: ['EDI envelope validation', 'PO line uniqueness'],
      },
      {
        layer: 'Bronze',
        object: 'raw_scm.po_events',
        system: 'Lakehouse landing',
        transformation: 'EDI payloads landed as received, one row per document',
        grain: 'EDI document',
        cadence: 'continuous',
        checks: ['Document type allow-list', 'Duplicate control number rejected'],
      },
      {
        layer: 'Silver',
        object: 'stg_scm.order_lifecycle',
        system: 'dbt models',
        transformation:
          'Order → ship → receipt events stitched into one lifecycle row; expected vs actual delivery dates aligned to the vendor lead-time agreement',
        grain: 'PO line',
        cadence: 'hourly',
        checks: ['Actual date ≥ order date', 'Lifecycle has terminal status', 'Vendor key resolvable'],
      },
      {
        layer: 'Gold',
        object: 'supplier_orders',
        system: 'Certified supply-chain mart',
        transformation:
          'On-time flag, fill rate and lead-time variance computed per line and rolled to supplier reliability',
        grain: 'PO line × supplier × SKU',
        cadence: 'daily 03:30',
        checks: ['On-time flag derived from dates only', 'Quantity > 0', 'Cost reconciles to invoice'],
      },
      SEMANTIC_LAYER,
    ],
  },
  demand_forecasts: {
    goldLabel: 'Demand forecast fact',
    layers: [
      ...POS_INGEST,
      {
        layer: 'Silver',
        object: 'stg_fcst.demand_features',
        system: 'Feature store · dbt models',
        transformation:
          'Cleansed demand history with promotion, price, holiday and weather features; outliers winsorised and stockout periods masked so lost sales do not train the model down',
        grain: 'store × SKU × week',
        cadence: 'weekly + daily refresh',
        checks: ['No feature nulls in training window', 'Stockout masking applied', 'Holiday calendar joined'],
      },
      {
        layer: 'Gold',
        object: 'demand_forecasts',
        system: 'Certified forecasting mart',
        transformation:
          'Statistical forecast published with confidence interval; actuals backfilled to score MAPE and bias per store/SKU/week',
        grain: 'store × SKU × forecast week',
        cadence: 'weekly publish, daily actual backfill',
        checks: ['CI low ≤ forecast ≤ CI high', 'Accuracy scored only on closed weeks', 'Model version recorded'],
      },
      SEMANTIC_LAYER,
    ],
  },
  competitor_prices: {
    goldLabel: 'Competitive price observation fact',
    layers: [
      {
        layer: 'Source',
        object: 'Competitor shelf & site price observations',
        system: 'Third-party price audit panel · web collection',
        transformation: 'Observed competitor price per banner captured with observation date and collection source',
        grain: 'competitor × SKU observation',
        cadence: 'weekly per banner',
        checks: ['Observation dated', 'Banner in panel scope'],
      },
      {
        layer: 'Bronze',
        object: 'raw_comp.price_observations',
        system: 'Lakehouse landing',
        transformation: 'Vendor extract landed unchanged with provider batch ID',
        grain: 'observation row',
        cadence: 'weekly',
        checks: ['Provider batch complete', 'Currency = USD'],
      },
      {
        layer: 'Silver',
        object: 'stg_comp.matched_price',
        system: 'dbt models',
        transformation:
          'Competitor items matched to Everline SKUs on EAN/size-equivalence, unit-price normalised, unmatched observations discarded rather than guessed',
        grain: 'competitor × SKU',
        cadence: 'weekly',
        checks: ['Match confidence ≥ threshold', 'Unit of measure normalised', 'Price > 0'],
      },
      {
        layer: 'Gold',
        object: 'competitor_prices',
        system: 'Certified pricing mart',
        transformation: 'Our price joined from the price master and the price gap % computed per SKU × banner',
        grain: 'SKU × competitor × observation date',
        cadence: 'weekly',
        checks: ['Gap % = (our − comp) / comp', 'Our price effective-dated to observation'],
      },
      SEMANTIC_LAYER,
    ],
  },
  shelf_allocations: {
    goldLabel: 'Planogram shelf allocation fact',
    layers: [
      {
        layer: 'Source',
        object: 'Planogram authoring & store compliance audits',
        system: 'JDA/Blue Yonder space planning · store audit app',
        transformation: 'Authored planogram versions plus audited in-store compliance photos and counts',
        grain: 'planogram position',
        cadence: 'per planogram release',
        checks: ['Version approved', 'Fixture dimensions present'],
      },
      {
        layer: 'Bronze',
        object: 'raw_space.planogram_export',
        system: 'Lakehouse landing',
        transformation: 'Space-planning exports landed per version, unchanged',
        grain: 'position row',
        cadence: 'per release',
        checks: ['Position uniqueness', 'Facings ≥ 1'],
      },
      {
        layer: 'Silver',
        object: 'stg_space.position_conformed',
        system: 'dbt models',
        transformation:
          'Positions conformed to SKU master, eye-level bands derived from shelf height, linear/cubic space computed from fixture geometry',
        grain: 'planogram × shelf × SKU',
        cadence: 'per release',
        checks: ['Allocated width ≤ fixture width', 'Shelf number within fixture', 'SKU active'],
      },
      {
        layer: 'Gold',
        object: 'shelf_allocations',
        system: 'Certified space mart',
        transformation:
          'Space joined to POS velocity to publish sales per square foot and space-to-sales index per position',
        grain: 'planogram × SKU position',
        cadence: 'weekly',
        checks: ['Sales per sqft finite', 'Space-to-sales index bounded', 'Category totals reconcile'],
      },
      SEMANTIC_LAYER,
    ],
  },
  markdowns: {
    goldLabel: 'Markdown & clearance fact',
    layers: [
      {
        layer: 'Source',
        object: 'Markdown authorisations & price file',
        system: 'Price management system',
        transformation: 'Approved markdown events per SKU × store with reason code and effective dates',
        grain: 'markdown event',
        cadence: 'daily',
        checks: ['Reason code valid', 'Markdown price < original'],
      },
      {
        layer: 'Silver',
        object: 'stg_price.markdown_events',
        system: 'dbt models',
        transformation: 'Overlapping markdowns resolved to the effective one, depth % recomputed from prices',
        grain: 'SKU × store × effective date',
        cadence: 'daily',
        checks: ['No overlapping active events', 'Depth % recomputed not trusted'],
      },
      {
        layer: 'Gold',
        object: 'markdowns',
        system: 'Certified pricing mart',
        transformation: 'Markdown depth joined to stock age and sell-through to publish clearance effectiveness',
        grain: 'markdown × SKU × store',
        cadence: 'daily',
        checks: ['Depth 0–100%', 'Stock age band present'],
      },
      SEMANTIC_LAYER,
    ],
  },
  stock_age_tracking: {
    goldLabel: 'Stock age fact',
    layers: [
      {
        layer: 'Source',
        object: 'Receipt-dated inventory movements',
        system: 'Manhattan WMS · store receiving',
        transformation: 'Receipt dates retained per unit cohort to age the on-hand',
        grain: 'receipt cohort',
        cadence: 'daily',
        checks: ['Receipt date present', 'Cohort quantity ≥ 0'],
      },
      {
        layer: 'Silver',
        object: 'stg_inv.stock_cohorts',
        system: 'dbt models',
        transformation: 'FIFO consumption applied to cohorts, age in days computed against the snapshot date',
        grain: 'SKU × store × cohort',
        cadence: 'daily',
        checks: ['FIFO consumption balances to on-hand', 'Age ≥ 0'],
      },
      {
        layer: 'Gold',
        object: 'stock_age_tracking',
        system: 'Certified availability mart',
        transformation: 'Cohorts bucketed into age bands with cost and retail value at risk',
        grain: 'SKU × store × age band',
        cadence: 'daily',
        checks: ['Band totals equal on-hand', 'Value at cost ≤ value at retail'],
      },
      SEMANTIC_LAYER,
    ],
  },
  forecast_accuracy_tracking: {
    goldLabel: 'Forecast accuracy fact',
    layers: [
      {
        layer: 'Silver',
        object: 'stg_fcst.forecast_vs_actual',
        system: 'dbt models',
        transformation: 'Published forecasts joined to realised POS actuals only for fully closed weeks',
        grain: 'store × SKU × week',
        cadence: 'weekly',
        checks: ['Only closed weeks scored', 'Actuals sourced from certified POS'],
      },
      {
        layer: 'Gold',
        object: 'forecast_accuracy_tracking',
        system: 'Certified forecasting mart',
        transformation: 'MAPE, bias and RMSE computed per category/store with sample sizes retained',
        grain: 'category × store × week',
        cadence: 'weekly',
        checks: ['Sample size ≥ floor before publishing', 'MAPE ≥ 0', 'Bias signed'],
      },
      SEMANTIC_LAYER,
    ],
  },
  customer_journey: {
    goldLabel: 'Loyalty response fact',
    layers: [
      {
        layer: 'Source',
        object: 'Loyalty app, email/CRM and offer redemption events',
        system: 'CRM · loyalty platform',
        transformation: 'Touchpoints and redemptions captured per household with channel and action',
        grain: 'touchpoint event',
        cadence: 'continuous',
        checks: ['Consent flag respected', 'Household key present'],
      },
      {
        layer: 'Silver',
        object: 'stg_crm.touchpoint_conformed',
        system: 'dbt models',
        transformation:
          'Events deduplicated, household conformed to the loyalty master, promotion key resolved from the offer catalogue',
        grain: 'household × touchpoint',
        cadence: 'hourly',
        checks: ['No duplicate event IDs', 'Promotion key resolvable', 'PII excluded from the mart'],
      },
      {
        layer: 'Gold',
        object: 'customer_journey',
        system: 'Certified customer mart',
        transformation: 'Conversion attributed to promotion and segment for response and incrementality reads',
        grain: 'household × promotion × touchpoint',
        cadence: 'hourly',
        checks: ['Converted flag derived from basket link', 'Segment assigned'],
      },
      SEMANTIC_LAYER,
    ],
  },
};

/** Generic pipeline used when a gold table has no bespoke lineage entry. */
function genericLineage(table: string): TableLineage {
  return {
    goldLabel: `Certified ${table.replace(/_/g, ' ')} fact`,
    layers: [
      {
        layer: 'Source',
        object: 'Operational system of record',
        system: 'Everline enterprise applications',
        transformation: 'Business events captured at the point of transaction',
        grain: 'source event',
        cadence: 'daily',
        checks: ['Schema contract', 'Source completeness'],
      },
      {
        layer: 'Bronze',
        object: `raw.${table}`,
        system: 'Lakehouse landing (immutable)',
        transformation: 'Extract landed as-received with ingest metadata — nothing edited',
        grain: 'source row',
        cadence: 'daily',
        checks: ['Duplicate batch rejected', 'Row count vs manifest'],
      },
      {
        layer: 'Silver',
        object: `stg.${table}`,
        system: 'dbt models',
        transformation: 'Keys conformed to master data, types cast, invalid rows quarantined rather than corrected',
        grain: 'conformed row',
        cadence: 'daily',
        checks: ['Referential integrity', 'Null keys quarantined'],
      },
      {
        layer: 'Gold',
        object: table,
        system: 'Certified merchandising mart',
        transformation: 'Business rules and certified measures applied, published for governed querying',
        grain: 'published grain',
        cadence: 'daily',
        checks: ['Measure bounds', 'Grain uniqueness'],
      },
      SEMANTIC_LAYER,
    ],
  };
}

export function lineageForTable(table: string): TableLineage {
  return TABLE_LINEAGE[table] ?? genericLineage(table);
}

export const LAYER_STYLES: Record<LineageLayer['layer'], { badge: string; dot: string }> = {
  Source: { badge: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
  Bronze: { badge: 'bg-chart-4/10 text-chart-4', dot: 'bg-chart-4' },
  Silver: { badge: 'bg-chart-2/10 text-chart-2', dot: 'bg-chart-2' },
  Gold: { badge: 'bg-status-warning/10 text-status-warning', dot: 'bg-status-warning' },
  Semantic: { badge: 'bg-primary/10 text-primary', dot: 'bg-primary' },
};
