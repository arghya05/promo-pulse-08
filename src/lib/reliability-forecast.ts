/**
 * Predictive data reliability: forecasts where the ingestion estate is about to
 * break, then propagates that risk through the knowledge graph (feed → bronze →
 * silver → gold table → governed dataset → certified metric) so we can say, in
 * advance, which *answers* are about to become untrustworthy.
 *
 * Everything here is deterministic. The 14-day gate history is generated from a
 * stable hash of the feed id plus its observed gate results, so the charts never
 * drift between renders, and the forecast is a plain EWMA + trend extrapolation
 * executed in code — no model writes a number.
 */

import { DQ_RULE_RUNS, type DQRuleRun, type DQStatus } from '@/lib/dq-scorecard';
import { FEEDS, type Feed } from '@/lib/ingestion-quality';
import { lineageForTable } from '@/lib/lineage-layers';

export type RiskBand = 'stable' | 'watch' | 'at-risk' | 'breaching';

export type HistoryPoint = {
  /** ISO date (YYYY-MM-DD). */
  day: string;
  /** Share of gate-evaluated rows that failed, in percent. */
  failRate: number;
  /** Minutes of latency against the feed's arrival window. */
  latency: number;
  projected?: boolean;
};

export type ImpactedAsset = {
  table: string;
  /** Certified metrics that resolve through this table, if known. */
  hops: number;
};

export type FeedForecast = {
  feed: Feed;
  gates: DQRuleRun[];
  status: DQStatus;
  /** Observed failure rate on the latest gate runs, in percent. */
  currentFailRate: number;
  /** Code-computed forecast of the failure rate 7 days out, in percent. */
  forecastFailRate: number;
  /** Probability (0-100) that a standing gate breaches inside the next 7 days. */
  breachProbability: number;
  /** Days until the forecast crosses the feed's tolerance, null if it does not. */
  daysToBreach: number | null;
  /** Tolerance the forecast is compared against, in percent. */
  tolerance: number;
  band: RiskBand;
  trend: 'improving' | 'flat' | 'degrading';
  history: HistoryPoint[];
  /** Leading indicator that drives the forecast. */
  leadingSignal: string;
  /** Pre-emptive transformation/ingestion action, executed before the breach. */
  preemptiveAction: string;
  /** Gold tables, then datasets and answers, that inherit this risk. */
  impacted: ImpactedAsset[];
  /** How the semantic layer degrades an answer if the breach lands. */
  answerBehaviour: string;
};

export type AnswerRisk = {
  table: string;
  band: RiskBand;
  trustScore: number;
  feeds: string[];
  /** Question themes that route through this table. */
  questionThemes: string[];
  guardrail: string;
};

/* ------------------------------------------------------------------ helpers */

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Deterministic 0..1 sequence seeded by a string. */
function seeded(seed: string, i: number): number {
  return (hash(`${seed}:${i}`) % 10_000) / 10_000;
}

const TOLERANCE: Record<string, number> = {
  pos: 0.5,
  ecom: 1,
  inventory: 1.2,
  vendor: 0.4,
  master: 0.8,
  promo: 0.6,
  competitor: 2,
  space: 1,
};

const LEADING_SIGNAL: Record<string, string> = {
  pos: 'Register replay volume rising 3 days running — drawer files re-sent after network drops',
  ecom: 'Late-partition share creeping toward the 24h replay watermark on fulfilment events',
  inventory: 'Store snapshot no-shows trending up; stale-carry count above the 7-day mean',
  vendor: 'EDI 832 cost files arriving later in their vendor window, restating more days',
  master: 'CDC backlog on item master growing — new SKUs ringing before PIM publishes',
  promo: 'Offer-version churn up; retro edits landing as new versions after sales post',
  competitor: 'Crawl coverage falling below 78% and a live schema break on the price drop',
  space: 'Planogram exports arriving after reset effective dates on two banners',
};

const PREEMPTIVE: Record<string, string> = {
  pos: 'Widen the de-dup key to include register session id and pre-warm the close-of-day restatement job',
  ecom: 'Extend the replay window to 36h for the affected fulfilment nodes and re-key event-time ordering',
  inventory: 'Shorten the staleness tolerance to 2 cycles so OSA excludes carried stores earlier',
  vendor: 'Pin effective-dated cost to the posting date and stage a bounded 7-day margin restatement',
  master: 'Raise CDC micro-batch frequency to 5 min and hold unmatched rows in the item quarantine bucket',
  promo: 'Version-lock offers at read time so funding is joined at the version the sale used',
  competitor: 'Ship the shelf_price contract update and mark gap metrics coverage-limited until the batch clears',
  space: 'Gate publish on effective date, keep the superseded planogram version live for compliance metrics',
};

const ANSWER_BEHAVIOUR: Record<string, string> = {
  pos: 'Sales and margin answers stay live but state a restated-window caveat for the affected store-days',
  ecom: 'Digital answers narrow to the settled window; unsettled orders are excluded, not estimated',
  inventory: 'Availability answers exclude stale stores and report the coverage they were computed on',
  vendor: 'Margin answers are held to the prior certified cost version until the restatement publishes',
  master: 'Category rollups exclude unmatched SKUs and disclose the quarantine size in the answer',
  promo: 'Promo lift answers cite the offer version used and refuse to blend versions',
  competitor: 'Price-gap answers state coverage and decline to infer a missing competitor price',
  space: 'Space compliance answers pin to the effective planogram version and flag pending resets',
};

const QUESTION_THEMES: Record<string, string[]> = {
  transactions: ['Sales performance', 'Basket & mix', 'Margin decomposition'],
  kpi_measures: ['Executive KPI landing', 'YoY comp', 'Forecast vs plan'],
  orders: ['Digital demand', 'Fulfilment reliability'],
  order_items: ['Attachment & mix', 'Digital assortment'],
  inventory_levels: ['On-shelf availability', 'Stockout risk', 'Replenishment planning'],
  stock_age_tracking: ['Markdown & clearance', 'Ageing exposure'],
  supplier_orders: ['Supplier OTIF', 'Supply risk'],
  purchase_orders: ['Open order coverage', 'Inbound plan'],
  products: ['Assortment productivity', 'Item economics'],
  stores: ['Store & cluster comparison'],
  promotions: ['Promotion what-if', 'Trade funding ROI'],
  markdowns: ['Markdown optimisation'],
  discounts: ['Discount leakage'],
  competitor_prices: ['Price gap & index', 'Price simulation'],
  competitor_data: ['Competitive position'],
  planograms: ['Planogram optimisation'],
  shelf_allocations: ['Space productivity'],
  fixtures: ['Fixture compliance'],
};

const BAND_ORDER: RiskBand[] = ['stable', 'watch', 'at-risk', 'breaching'];

function bandFor(breachProbability: number, status: DQStatus): RiskBand {
  if (status === 'fail') return 'breaching';
  if (breachProbability >= 60) return 'at-risk';
  if (breachProbability >= 30) return 'watch';
  return 'stable';
}

function isoDay(offsetFromToday: number): string {
  const base = Date.UTC(2026, 7, 4); // pipeline "today" = 2026-08-04, matches gate runs
  return new Date(base + offsetFromToday * 86_400_000).toISOString().slice(0, 10);
}

function gatesForFeed(feed: Feed): DQRuleRun[] {
  const bronzePrefix = feed.bronzeObject.split('.')[0].toLowerCase();
  const bronzeObject = feed.bronzeObject.toLowerCase();
  return DQ_RULE_RUNS.filter((run) => {
    const object = run.object.toLowerCase();
    if (object.includes(bronzeObject) || bronzeObject.includes(object)) return true;
    if (bronzePrefix.length > 4 && object.includes(bronzePrefix)) return true;
    return feed.goldTables.some((t) => object.includes(t.toLowerCase()));
  });
}

/* ----------------------------------------------------------------- forecast */

export function forecastFeed(feed: Feed): FeedForecast {
  const gates = gatesForFeed(feed);
  const status: DQStatus = gates.some((g) => g.status === 'fail')
    ? 'fail'
    : gates.some((g) => g.status === 'warn')
      ? 'warn'
      : 'pass';

  const rowsEvaluated = gates.reduce((s, g) => s + g.rowsEvaluated, 0) || 1;
  const rowsFailed = gates.reduce((s, g) => s + g.rowsFailed, 0);
  const observed = Math.min(100, (rowsFailed / rowsEvaluated) * 100);
  const tolerance = TOLERANCE[feed.id] ?? 1;

  // Degradation pressure: warn/fail gates push the synthetic history upward.
  const pressure = status === 'fail' ? 1 : status === 'warn' ? 0.45 : 0.12;

  const observedHistory: HistoryPoint[] = Array.from({ length: 14 }, (_, i) => {
    const day = isoDay(i - 13);
    const ramp = (i / 13) * pressure;
    const noise = (seeded(feed.id, i) - 0.5) * 0.35;
    const anchor = status === 'fail' ? Math.min(observed, 8) : observed;
    const failRate = Math.max(0.01, anchor * (0.55 + ramp) + noise * tolerance);
    const latency = Math.max(
      0,
      Math.round((8 + ramp * 26 + seeded(`${feed.id}-lat`, i) * 9) * (status === 'pass' ? 0.7 : 1)),
    );
    return { day, failRate: Number(failRate.toFixed(3)), latency };
  });

  // EWMA level + linear trend on the last 7 observations.
  const alpha = 0.42;
  let level = observedHistory[0].failRate;
  observedHistory.forEach((p) => {
    level = alpha * p.failRate + (1 - alpha) * level;
  });
  const tail = observedHistory.slice(-7);
  const slope =
    tail.reduce((s, p, i) => s + (p.failRate - tail[0].failRate) * (i - 3), 0) / 28 || 0;

  const projected: HistoryPoint[] = Array.from({ length: 7 }, (_, i) => {
    const step = i + 1;
    const failRate = Math.max(0.01, level + slope * step * 1.35);
    return {
      day: isoDay(step),
      failRate: Number(failRate.toFixed(3)),
      latency: Math.max(0, Math.round(observedHistory[13].latency + slope * step * 40)),
      projected: true,
    };
  });

  const forecastFailRate = projected[projected.length - 1].failRate;
  const crossing = projected.findIndex((p) => p.failRate >= tolerance);
  const daysToBreach = status === 'fail' ? 0 : crossing === -1 ? null : crossing + 1;

  const headroom = tolerance === 0 ? 1 : forecastFailRate / tolerance;
  const breachProbability =
    status === 'fail'
      ? 100
      : Math.max(2, Math.min(97, Math.round(headroom * 62 + (slope > 0 ? 18 : -6) + pressure * 14)));

  const trend = slope > 0.012 ? 'degrading' : slope < -0.012 ? 'improving' : 'flat';

  return {
    feed,
    gates,
    status,
    currentFailRate: observedHistory[observedHistory.length - 1].failRate,
    forecastFailRate,
    breachProbability,
    daysToBreach,
    tolerance,
    band: bandFor(breachProbability, status),
    trend,
    history: [...observedHistory, ...projected],
    leadingSignal: LEADING_SIGNAL[feed.id] ?? 'Gate failure rate trending against tolerance',
    preemptiveAction: PREEMPTIVE[feed.id] ?? 'Tighten the silver conformance rule and stage a bounded restatement',
    impacted: feed.goldTables.map((table) => ({ table, hops: lineageForTable(table).layers.length })),
    answerBehaviour:
      ANSWER_BEHAVIOUR[feed.id] ?? 'Answer is degraded to a stated-uncertainty response rather than estimated',
  };
}

export function forecastEstate(): FeedForecast[] {
  return FEEDS.map(forecastFeed).sort(
    (a, b) =>
      BAND_ORDER.indexOf(b.band) - BAND_ORDER.indexOf(a.band) ||
      b.breachProbability - a.breachProbability,
  );
}

/** Propagates feed risk onto the gold tables that answers are computed from. */
export function answerRisk(forecasts: FeedForecast[]): AnswerRisk[] {
  const byTable = new Map<string, { feeds: FeedForecast[] }>();
  forecasts.forEach((f) =>
    f.feed.goldTables.forEach((table) => {
      const entry = byTable.get(table) ?? { feeds: [] };
      entry.feeds.push(f);
      byTable.set(table, entry);
    }),
  );

  return [...byTable.entries()]
    .map(([table, { feeds }]) => {
      const worst = feeds.reduce((a, b) =>
        BAND_ORDER.indexOf(b.band) > BAND_ORDER.indexOf(a.band) ? b : a,
      );
      const risk = feeds.reduce((s, f) => s + f.breachProbability, 0) / feeds.length;
      return {
        table,
        band: worst.band,
        trustScore: Math.max(12, Math.round(100 - risk * 0.78)),
        feeds: feeds.map((f) => f.feed.name),
        questionThemes: QUESTION_THEMES[table] ?? ['Cross-module analysis'],
        guardrail: worst.answerBehaviour,
      } satisfies AnswerRisk;
    })
    .sort(
      (a, b) => BAND_ORDER.indexOf(b.band) - BAND_ORDER.indexOf(a.band) || a.trustScore - b.trustScore,
    );
}

export type EstateSummary = {
  feeds: number;
  atRisk: number;
  breaching: number;
  /** Weighted estate reliability, 0-100. */
  reliability: number;
  /** Earliest predicted breach across the estate, in days. */
  earliestBreach: number | null;
  tablesExposed: number;
  themesExposed: number;
};

export function estateSummary(forecasts: FeedForecast[], risks: AnswerRisk[]): EstateSummary {
  const atRisk = forecasts.filter((f) => f.band === 'at-risk').length;
  const breaching = forecasts.filter((f) => f.band === 'breaching').length;
  const reliability = Math.round(
    forecasts.reduce((s, f) => s + (100 - f.breachProbability * 0.8), 0) / (forecasts.length || 1),
  );
  const breaches = forecasts
    .map((f) => f.daysToBreach)
    .filter((d): d is number => d !== null);
  const exposed = risks.filter((r) => r.band === 'at-risk' || r.band === 'breaching');
  return {
    feeds: forecasts.length,
    atRisk,
    breaching,
    reliability,
    earliestBreach: breaches.length ? Math.min(...breaches) : null,
    tablesExposed: exposed.length,
    themesExposed: new Set(exposed.flatMap((r) => r.questionThemes)).size,
  };
}

export const BAND_STYLES: Record<RiskBand, { label: string; badge: string; dot: string; stroke: string }> = {
  stable: {
    label: 'Stable',
    badge: 'bg-status-good/10 text-status-good',
    dot: 'bg-status-good',
    stroke: 'hsl(var(--status-good))',
  },
  watch: {
    label: 'Watch',
    badge: 'bg-status-warning/10 text-status-warning',
    dot: 'bg-status-warning',
    stroke: 'hsl(var(--status-warning))',
  },
  'at-risk': {
    label: 'At risk',
    badge: 'bg-status-warning/15 text-status-warning',
    dot: 'bg-status-warning',
    stroke: 'hsl(var(--status-warning))',
  },
  breaching: {
    label: 'Breaching',
    badge: 'bg-destructive/10 text-destructive',
    dot: 'bg-destructive',
    stroke: 'hsl(var(--destructive))',
  },
};
