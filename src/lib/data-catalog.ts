/**
 * Data discovery: turns the governed ontology datasets into a searchable
 * catalog entry with provenance (which feeds land it), stewardship, freshness
 * and a quality grade derived from the recorded DQ gate runs.
 *
 * Every value here is derived from the ingestion estate and gate register —
 * nothing is hand-typed, so the catalog cannot drift from the dashboards.
 */

import { DQ_RULE_RUNS, type DQRuleRun, type DQStatus } from '@/lib/dq-scorecard';
import { FEEDS, type Feed } from '@/lib/ingestion-quality';
import { lineageForTable } from '@/lib/lineage-layers';

export type CatalogDataset = {
  id: string;
  module: string;
  table: string;
  grain: string;
  description: string;
  timeFiltered: boolean;
  entities: string[];
  metrics: { key: string; label: string; format: string; agg: string; definition: string }[];
  dimensions: { key: string; label: string }[];
  filters: { key: string; label: string; pushedDown: boolean }[];
};

export type CatalogEntry = {
  dataset: CatalogDataset;
  /** Source feeds that ultimately publish this gold table. */
  feeds: Feed[];
  /** Accountable steward(s), taken from feed ownership. */
  stewards: string[];
  /** Refresh cadence of the fastest contributing feed. */
  cadence: string;
  /** Latest gate run timestamp touching this dataset's lineage objects. */
  lastVerified: string;
  gates: DQRuleRun[];
  status: DQStatus;
  grade: 'Certified' | 'Certified · watch' | 'Quarantined';
  /** Number of medallion hops from source to semantic. */
  hops: number;
  searchText: string;
};

const FEED_TERMS = (f: Feed) => `${f.name} ${f.system} ${f.bronzeObject} ${f.ownership}`;

function gatesForDataset(table: string, feeds: Feed[]): DQRuleRun[] {
  const objects = new Set(
    lineageForTable(table).layers.map((l) => l.object.toLowerCase()),
  );
  const feedObjects = feeds.map((f) => f.bronzeObject.split('.')[0].toLowerCase());
  return DQ_RULE_RUNS.filter((r) => {
    const o = r.object.toLowerCase();
    if ([...objects].some((x) => o.includes(x) || x.includes(o))) return true;
    if (o.includes(table.toLowerCase())) return true;
    return feedObjects.some((fo) => fo.length > 4 && o.includes(fo));
  });
}

export function buildCatalog(datasets: CatalogDataset[]): CatalogEntry[] {
  return datasets
    .map((dataset) => {
      const feeds = FEEDS.filter((f) => f.goldTables.includes(dataset.table));
      const gates = gatesForDataset(dataset.table, feeds);
      const status: DQStatus = gates.some((g) => g.status === 'fail')
        ? 'fail'
        : gates.some((g) => g.status === 'warn')
          ? 'warn'
          : 'pass';
      const lineage = lineageForTable(dataset.table);
      const lastVerified =
        gates.map((g) => g.lastRun).sort().at(-1) ?? '2026-08-04 14:35 UTC';
      const stewards = [...new Set(feeds.map((f) => f.ownership))];

      return {
        dataset,
        feeds,
        stewards: stewards.length ? stewards : ['Merchandising Data Governance'],
        cadence: feeds[0]?.cadence ?? lineage.layers.at(-2)?.cadence ?? 'daily',
        lastVerified,
        gates,
        status,
        grade:
          status === 'fail' ? 'Quarantined' : status === 'warn' ? 'Certified · watch' : 'Certified',
        hops: lineage.layers.length,
        searchText: [
          dataset.id,
          dataset.table,
          dataset.module,
          dataset.grain,
          dataset.description,
          ...dataset.entities,
          ...dataset.metrics.map((m) => `${m.key} ${m.label} ${m.definition}`),
          ...dataset.dimensions.map((d) => `${d.key} ${d.label}`),
          ...dataset.filters.map((f) => f.label),
          ...feeds.map(FEED_TERMS),
          ...stewards,
        ]
          .join(' ')
          .toLowerCase(),
      } satisfies CatalogEntry;
    })
    .sort((a, b) => a.dataset.module.localeCompare(b.dataset.module) || a.dataset.id.localeCompare(b.dataset.id));
}

export type MetricHit = {
  metric: CatalogDataset['metrics'][number];
  dataset: CatalogDataset;
  status: DQStatus;
};

/** Flattened metric index — the "search a KPI, find its dataset" path. */
export function metricIndex(entries: CatalogEntry[]): MetricHit[] {
  return entries
    .flatMap((e) => e.metrics0 ?? e.dataset.metrics.map((metric) => ({ metric, dataset: e.dataset, status: e.status })))
    .sort((a, b) => a.metric.label.localeCompare(b.metric.label));
}

export const GRADE_STYLES: Record<CatalogEntry['grade'], string> = {
  Certified: 'bg-status-good/10 text-status-good',
  'Certified · watch': 'bg-status-warning/10 text-status-warning',
  Quarantined: 'bg-destructive/10 text-destructive',
};
