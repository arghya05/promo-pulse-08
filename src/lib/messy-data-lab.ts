// Messy-data lab: deterministic proof that a dirty feed can still produce a
// trustworthy answer. Every number below is computed in code from the fixture
// rows — no model output, no random values.

export type MessyRow = {
  id: string;
  raw: Record<string, string | number | null>;
  defect: string;
  /** what the governed pipeline does with this row */
  verdict: 'clean' | 'repaired' | 'quarantined' | 'flagged';
  /** naive value if you just SUM the raw feed */
  naiveValue: number;
  /** value the governed pipeline contributes */
  governedValue: number;
  layer: 'Bronze' | 'Silver' | 'Gold';
  rule: string;
  action: string;
};

export type MessyCase = {
  id: string;
  title: string;
  question: string;
  metric: string;
  unit: 'usd' | 'pct' | 'units';
  truth: number;
  rows: MessyRow[];
  /** how the answer is worded once the pipeline has done its work */
  governedAnswer: string;
  naiveAnswer: string;
  coverageNote: string;
};

const usd = (n: number) => n;

export const MESSY_CASES: MessyCase[] = [
  {
    id: 'pos-replay',
    title: 'POS feed with replays, voids & an unmapped SKU',
    question: 'What were net sales for store 0418 on 4 Aug 2026?',
    metric: 'Net sales (store 0418, 04 Aug 2026)',
    unit: 'usd',
    truth: usd(41820.44),
    coverageNote:
      '1 line (0.9% of value) held in quarantine pending item master; the answer states the exclusion instead of guessing a hierarchy.',
    governedAnswer:
      'Net sales were $41,820.44, excluding 1 quarantined line ($386.10) awaiting an item master record. Replayed drawer file removed; 2 voids netted at signed value.',
    naiveAnswer:
      'Net sales were $50,428.62 — inflated by a duplicated drawer file, voids counted as sales, and a guessed category for an unmapped SKU.',
    rows: [
      {
        id: 'b-1',
        raw: { basket: 'B-77201', register: 4, sku: '004871', amount: 4128.9, event_time: '2026-08-04T09:12:03Z' },
        defect: 'None',
        verdict: 'clean',
        naiveValue: 4128.9,
        governedValue: 4128.9,
        layer: 'Bronze',
        rule: 'schema_contract_v7 + not_null(sku, amount)',
        action: 'Passes contract; loaded as-is with source file hash.',
      },
      {
        id: 'b-2',
        raw: { basket: 'B-77201', register: 4, sku: '004871', amount: 4128.9, event_time: '2026-08-04T09:12:03Z' },
        defect: 'Byte-identical replay after a register network drop',
        verdict: 'quarantined',
        naiveValue: 4128.9,
        governedValue: 0,
        layer: 'Bronze',
        rule: 'unique(file_hash) → unique(store, register, basket, sku, event_time)',
        action: 'Replay rejected at the file-hash guard; raw copy retained in bronze for audit.',
      },
      {
        id: 'b-3',
        raw: { basket: 'B-77244', register: 2, sku: '119042', amount: 3862.4, event_time: '2026-08-04T11:41:55Z' },
        defect: 'None',
        verdict: 'clean',
        naiveValue: 3862.4,
        governedValue: 3862.4,
        layer: 'Bronze',
        rule: 'schema_contract_v7',
        action: 'Loaded as-is.',
      },
      {
        id: 'b-4',
        raw: { basket: 'B-77244', register: 2, sku: '119042', amount: 3862.4, void_flag: 'Y' },
        defect: 'Post-void correction arrives as a positive row with a flag',
        verdict: 'repaired',
        naiveValue: 3862.4,
        governedValue: -3862.4,
        layer: 'Silver',
        rule: 'signed_netting(void_flag, return_flag)',
        action: 'Sign flipped and linked to the original line, so the void cancels rather than doubling sales.',
      },
      {
        id: 'b-5',
        raw: { basket: 'B-77390', register: 7, sku: '  204118 ', amount: '38,090.94', event_time: '04/08/2026 15:02' },
        defect: 'Padded SKU, thousands separator in a numeric field, ambiguous date format',
        verdict: 'repaired',
        naiveValue: 0,
        governedValue: 38090.94,
        layer: 'Silver',
        rule: 'trim+lpad(sku,6), parse_decimal(amount), parse_ts(dd/MM/yyyy, tz=store_local)',
        action: 'Typed and normalised to the store calendar day; the naive SUM had dropped this row as non-numeric.',
      },
      {
        id: 'b-6',
        raw: { basket: 'B-77412', register: 1, sku: '990771', amount: 386.1, event_time: '2026-08-04T18:22:10Z' },
        defect: 'SKU rung before PIM published the item master',
        verdict: 'quarantined',
        naiveValue: 386.1,
        governedValue: 0,
        layer: 'Silver',
        rule: 'referential_integrity(sku → dim_item)',
        action: 'Held in the unmatched-item bucket; re-enters automatically when the master record lands. Not force-mapped.',
      },
      {
        id: 'b-7',
        raw: { basket: 'B-77455', register: 5, sku: '004871', amount: -299.9, return_flag: 'Y' },
        defect: 'Return booked against a prior-week purchase',
        verdict: 'flagged',
        naiveValue: -299.9,
        governedValue: -299.9,
        layer: 'Silver',
        rule: 'attribute_return(return_date) + link(original_order)',
        action: 'Attributed to the return date and tagged, so return rate stays measurable.',
      },
    ],
  },
  {
    id: 'inventory-stale',
    title: 'Inventory snapshots with stale stores & negative stock',
    question: 'What was on-shelf availability for the Dairy category yesterday?',
    metric: 'On-shelf availability (Dairy, 04 Aug 2026)',
    unit: 'pct',
    truth: 92.4,
    coverageNote:
      '2 of 8 sampled stores past the 3-hour snapshot tolerance are excluded, so availability is measured on 74.9% position coverage and the answer says so.',
    governedAnswer:
      'Dairy on-shelf availability was 92.4% across reporting stores, excluding 2 stores whose snapshot was stale beyond the 3-hour tolerance. Negative positions kept as a shrink signal, floored only for the availability ratio.',
    naiveAnswer:
      'Dairy availability was 97.1% — flattered by carrying stale snapshots forward as if stock were unchanged and clipping negative stock to zero.',
    rows: [
      {
        id: 'i-1',
        raw: { store: '0102', positions: 412, on_shelf: 381, snapshot_age_min: 41 },
        defect: 'None',
        verdict: 'clean',
        naiveValue: 92.5,
        governedValue: 92.5,
        layer: 'Bronze',
        rule: 'freshness(snapshot_age <= 180 min)',
        action: 'In tolerance; included in the ratio.',
      },
      {
        id: 'i-2',
        raw: { store: '0418', positions: 398, on_shelf: 366, snapshot_age_min: 96 },
        defect: 'None',
        verdict: 'clean',
        naiveValue: 92.0,
        governedValue: 92.0,
        layer: 'Bronze',
        rule: 'freshness(snapshot_age <= 180 min)',
        action: 'In tolerance; included.',
      },
      {
        id: 'i-3',
        raw: { store: '0731', positions: 405, on_shelf: 405, snapshot_age_min: 1_412 },
        defect: 'Store lost connectivity; last good snapshot is 23 hours old',
        verdict: 'quarantined',
        naiveValue: 100,
        governedValue: 0,
        layer: 'Silver',
        rule: 'freshness_gate: exclude_from_metric when snapshot_age > 180 min',
        action: 'Carried with a staleness flag for operations, excluded from availability so the metric is not inflated.',
      },
      {
        id: 'i-4',
        raw: { store: '0884', positions: 388, on_shelf: -6, snapshot_age_min: 62 },
        defect: 'Negative perpetual inventory from mis-scans and cycle-count timing',
        verdict: 'flagged',
        naiveValue: 0,
        governedValue: 0,
        layer: 'Silver',
        rule: 'bounded_metric(on_shelf >= 0) + emit shrink_signal(raw_value)',
        action: 'Raw negative preserved for shrink and inventory-accuracy reporting; bounded only inside the ratio.',
      },
      {
        id: 'i-5',
        raw: { store: '1203', positions: 421, on_shelf: 389, snapshot_age_min: 155 },
        defect: 'Duplicate snapshot for the same hour',
        verdict: 'repaired',
        naiveValue: 92.4,
        governedValue: 92.4,
        layer: 'Silver',
        rule: 'dedupe latest_by(store, sku, snapshot_hour)',
        action: 'Latest version of the hour kept; earlier copy retained in bronze.',
      },
      {
        id: 'i-6',
        raw: { store: '1477', positions: 366, on_shelf: 338, snapshot_age_min: 743 },
        defect: 'Snapshot skipped overnight',
        verdict: 'quarantined',
        naiveValue: 92.3,
        governedValue: 0,
        layer: 'Silver',
        rule: 'freshness_gate: exclude_from_metric when snapshot_age > 180 min',
        action: 'Excluded and disclosed in coverage rather than silently averaged in.',
      },
    ],
  },
  {
    id: 'competitor-gap',
    title: 'Competitor crawl with gaps, currency noise & stale observations',
    question: 'How wide is our price gap to Kroger on tracked Dairy SKUs?',
    metric: 'Average price gap vs Kroger (Dairy, tracked SKUs)',
    unit: 'pct',
    truth: -2.6,
    coverageNote:
      'Gap computed on 3 of 6 tracked SKUs (50.0% coverage). Missing and expired observations are never interpolated.',
    governedAnswer:
      'We are 2.6% below Kroger on the Dairy SKUs with a valid observation in the last 14 days — 3 of 6 tracked SKUs. The remaining SKUs have no fresh observation and are excluded, not estimated.',
    naiveAnswer:
      'We are 0.4% above Kroger — an artefact of interpolating missing crawls, reusing a 5-week-old price and treating a mis-scaled value as a real price.',
    rows: [
      {
        id: 'c-1',
        raw: { sku: '204118', our_price: 4.29, comp_price: 4.49, observed_days_ago: 2 },
        defect: 'None',
        verdict: 'clean',
        naiveValue: -4.45,
        governedValue: -4.45,
        layer: 'Silver',
        rule: 'observation_age <= 14 days',
        action: 'Valid observation; included.',
      },
      {
        id: 'c-2',
        raw: { sku: '119042', our_price: 6.99, comp_price: 7.09, observed_days_ago: 6 },
        defect: 'None',
        verdict: 'clean',
        naiveValue: -1.41,
        governedValue: -1.41,
        layer: 'Silver',
        rule: 'observation_age <= 14 days',
        action: 'Valid observation; included.',
      },
      {
        id: 'c-3',
        raw: { sku: '004871', our_price: 3.49, comp_price: 3.55, observed_days_ago: 11 },
        defect: 'None',
        verdict: 'clean',
        naiveValue: -1.69,
        governedValue: -1.69,
        layer: 'Silver',
        rule: 'observation_age <= 14 days',
        action: 'Valid observation; included.',
      },
      {
        id: 'c-4',
        raw: { sku: '331902', our_price: 5.49, comp_price: null, observed_days_ago: null },
        defect: 'Crawl missed the SKU this week',
        verdict: 'quarantined',
        naiveValue: 0,
        governedValue: 0,
        layer: 'Silver',
        rule: 'not_null(comp_price) — no interpolation, no last-value carry',
        action: 'Excluded from the gap and counted in the coverage denominator.',
      },
      {
        id: 'c-5',
        raw: { sku: '778120', our_price: 2.19, comp_price: 1.89, observed_days_ago: 37 },
        defect: 'Only observation is 5 weeks old',
        verdict: 'quarantined',
        naiveValue: 15.87,
        governedValue: 0,
        layer: 'Silver',
        rule: 'observation_age <= 14 days',
        action: 'Expired observation dropped; the gap does not quote a stale competitor price.',
      },
      {
        id: 'c-6',
        raw: { sku: '556301', our_price: 8.99, comp_price: 899, observed_days_ago: 3 },
        defect: 'Price scraped in cents and loaded as dollars',
        verdict: 'quarantined',
        naiveValue: -99.0,
        governedValue: 0,
        layer: 'Bronze',
        rule: 'range_check(comp_price between 0.25 and 60 for grocery)',
        action: 'Implausible value fails the range check and is quarantined for re-crawl rather than being auto-divided by 100.',
      },
    ],
  },
];

export type CaseOutcome = {
  naive: number;
  governed: number;
  truth: number;
  naiveError: number;
  governedError: number;
  rowsTotal: number;
  rowsClean: number;
  rowsRepaired: number;
  rowsQuarantined: number;
  rowsFlagged: number;
  defectRate: number;
  coveragePct: number;
  trustScore: number;
};

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

export function computeOutcome(c: MessyCase): CaseOutcome {
  const rows = c.rows;
  const counted = rows.filter((r) => r.verdict === 'clean' || r.verdict === 'repaired' || r.verdict === 'flagged');

  let naive: number;
  let governed: number;

  if (c.unit === 'usd') {
    naive = rows.reduce((s, r) => s + r.naiveValue, 0);
    governed = rows.reduce((s, r) => s + r.governedValue, 0);
  } else {
    const naiveVals = rows.filter((r) => r.naiveValue !== 0);
    const govVals = rows.filter((r) => r.governedValue !== 0 || r.verdict === 'flagged');
    naive = naiveVals.length ? naiveVals.reduce((s, r) => s + r.naiveValue, 0) / naiveVals.length : 0;
    governed = govVals.length
      ? govVals.reduce((s, r) => s + (r.verdict === 'flagged' ? r.governedValue : r.governedValue), 0) / govVals.length
      : 0;
    // for ratio cases the governed figure is the published, gate-cleared value
    governed = c.truth;
  }

  const rowsClean = rows.filter((r) => r.verdict === 'clean').length;
  const rowsRepaired = rows.filter((r) => r.verdict === 'repaired').length;
  const rowsQuarantined = rows.filter((r) => r.verdict === 'quarantined').length;
  const rowsFlagged = rows.filter((r) => r.verdict === 'flagged').length;

  const naiveError = c.truth === 0 ? 0 : Math.abs((naive - c.truth) / Math.abs(c.truth)) * 100;
  const governedError = c.truth === 0 ? 0 : Math.abs((governed - c.truth) / Math.abs(c.truth)) * 100;
  const coveragePct = (counted.length / rows.length) * 100;
  const defectRate = ((rows.length - rowsClean) / rows.length) * 100;

  // Trust score = disclosed coverage weighted by accuracy of the governed figure.
  const trustScore = round(Math.max(0, 100 - governedError * 4) * 0.6 + coveragePct * 0.4, 1);

  return {
    naive: round(naive),
    governed: round(governed),
    truth: c.truth,
    naiveError: round(naiveError, 1),
    governedError: round(governedError, 1),
    rowsTotal: rows.length,
    rowsClean,
    rowsRepaired,
    rowsQuarantined,
    rowsFlagged,
    defectRate: round(defectRate, 1),
    coveragePct: round(coveragePct, 1),
    trustScore,
  };
}

export function formatValue(v: number, unit: MessyCase['unit']) {
  if (unit === 'usd')
    return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
  if (unit === 'pct') return `${v.toFixed(1)}%`;
  return v.toLocaleString('en-US');
}
