/**
 * Calculation walk: how the arithmetic behind a single cited number is carried
 * layer by layer, from raw source rows through bronze/silver/gold aggregation
 * into the semantic metric formula that produced the final figure.
 *
 * Row counts that are known exactly (the gold rows the plan actually read, and
 * the single semantic output value) are marked `exact`. Upstream counts are
 * derived from the declared grain fan-in ratio for that gold table and are
 * marked `derived` so a reader never mistakes them for measured counts.
 */

import type { LineageEntry } from '@/components/ask/LineageTrail';
import { lineageForTable, type LineageLayer } from '@/lib/lineage-layers';

export type CalcStep = {
  layer: LineageLayer['layer'];
  object: string;
  /** What the arithmetic does to the value at this layer. */
  operation: string;
  /** The literal expression evaluated at this layer. */
  expression: string;
  rows: number | null;
  rowsBasis: 'exact' | 'derived' | 'n/a';
  rowsNote: string;
  /** State of the value as it leaves this layer. */
  carries: string;
};

/**
 * Declared grain fan-in: how many upstream rows collapse into one gold row for
 * each certified table. These are the published grain ratios of the mart.
 */
const FAN_IN: Record<string, { silver: number; bronze: number; label: string }> = {
  kpi_measures: { silver: 340, bronze: 352, label: 'transaction lines per day × store × category' },
  transactions: { silver: 1, bronze: 1.04, label: 'scanned basket lines per published line (voids netted)' },
  inventory_levels: { silver: 24, bronze: 24, label: 'hourly stock snapshots per published store × SKU day' },
  supplier_orders: { silver: 1, bronze: 1.02, label: 'EDI 850/856 segments per published order line' },
  competitor_prices: { silver: 1, bronze: 1.18, label: 'crawl observations per published price point' },
  demand_forecasts: { silver: 8, bronze: 8, label: 'model run rows per published forecast row' },
  forecast_accuracy_tracking: { silver: 42, bronze: 42, label: 'forecast-vs-actual pairs per accuracy row' },
  customer_journey: { silver: 1.6, bronze: 1.9, label: 'touchpoint events per published household × promotion row' },
  markdowns: { silver: 1, bronze: 1.05, label: 'price-action records per published markdown' },
  shelf_allocations: { silver: 1, bronze: 1, label: 'planogram positions per published facing' },
};

const DEFAULT_FAN_IN = { silver: 12, bronze: 12.5, label: 'source rows per published gold row' };

function aggregationVerb(formula: string): string {
  const f = formula.toLowerCase();
  if (f.includes('sum')) return 'SUM';
  if (f.includes('avg') || f.includes('mean') || f.includes('/')) return 'weighted average';
  if (f.includes('count')) return 'COUNT';
  return 'aggregate';
}

export function buildCalculationWalk(entry: LineageEntry): CalcStep[] {
  const pipeline = lineageForTable(entry.table);
  const fan = FAN_IN[entry.table] ?? DEFAULT_FAN_IN;
  const goldRows = entry.recordsAnalysed;
  const verb = aggregationVerb(entry.formula);

  const steps: CalcStep[] = [];
  let seenPrimarySource = false;

  for (const layer of pipeline.layers) {
    if (layer.layer === 'Source') {
      // Secondary source feeds (cost, master data) are joined in, not counted
      // into the row volume that carries the measure.
      if (seenPrimarySource) {
        steps.push({
          layer: 'Source',
          object: layer.object,
          operation: 'Reference feed — joined onto the measure at the silver layer, adds attributes not rows',
          expression: 'LEFT JOIN on business key + effective date (no fan-out permitted)',
          rows: null,
          rowsBasis: 'n/a',
          rowsNote: 'lookup feed — contributes attributes, not measure rows',
          carries: 'effective-dated cost / reference attributes used by the formula',
        });
        continue;
      }
      seenPrimarySource = true;
      steps.push({
        layer: 'Source',
        object: layer.object,
        operation: 'Value originates as individual business events — no arithmetic yet',
        expression: 'event captured at point of transaction (no aggregation)',
        rows: Math.round(goldRows * fan.bronze),
        rowsBasis: 'derived',
        rowsNote: `gold rows × ${fan.bronze} declared fan-in (${fan.label})`,
        carries: 'raw measures exactly as recorded by the source system',
      });
      continue;
    }

    if (layer.layer === 'Bronze') {
      steps.push({
        layer: 'Bronze',
        object: layer.object,
        operation: 'Landed as-received; duplicate batches rejected, nothing summed or edited',
        expression: 'INSERT … AS RECEIVED (append-only, ingest_ts + file hash added)',
        rows: Math.round(goldRows * fan.bronze),
        rowsBasis: 'derived',
        rowsNote: 'same row count as source — landing is 1:1',
        carries: 'raw measure values, unmodified and replay-safe',
      });
      continue;
    }

    if (layer.layer === 'Silver') {
      steps.push({
        layer: 'Silver',
        object: layer.object,
        operation: 'Conform + net: bad rows quarantined (not corrected), returns/voids netted, keys resolved',
        expression:
          'net_value = gross − returns − voids − tax; keys joined to product/store master; invalid rows routed to quarantine',
        rows: Math.round(goldRows * fan.silver),
        rowsBasis: 'derived',
        rowsNote: `gold rows × ${fan.silver} declared fan-in — quarantined rows excluded from the total`,
        carries: 'clean, keyed, netted measures at transaction grain',
      });
      continue;
    }

    if (layer.layer === 'Gold') {
      steps.push({
        layer: 'Gold',
        object: layer.object,
        operation: `${verb} to the certified grain, then filtered to this answer's scope`,
        expression: `GROUP BY ${layer.grain} → filter: ${entry.scope}${
          entry.window.from || entry.window.to
            ? ` · window ${entry.window.from ?? 'earliest'} → ${entry.window.to ?? 'latest'}`
            : ''
        }`,
        rows: goldRows,
        rowsBasis: 'exact',
        rowsNote: 'rows the plan actually read from the certified table',
        carries: `certified measures at ${layer.grain}`,
      });
      continue;
    }

    // Semantic
    steps.push({
      layer: 'Semantic',
      object: `${entry.metricLabel} (${entry.metric})`,
      operation: 'Metric formula evaluated in TypeScript over the gold rows — the model writes no digits',
      expression: entry.formula,
      rows: 1,
      rowsBasis: 'exact',
      rowsNote: 'single output value substituted into the answer placeholder',
      carries: `${entry.value}${entry.kind === 'projected' ? ` (projected · ${entry.method ?? 'scenario model'})` : ''}`,
    });
  }

  return steps;
}
