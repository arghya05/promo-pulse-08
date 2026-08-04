/**
 * Report generation for the data-quality dashboard.
 *
 * Everything is derived from the recorded gate runs — no figure is typed by
 * hand here, so the exported report always matches what the dashboard shows.
 */

import { DQ_RULE_RUNS, layerScorecard, type DQRuleRun, type DQStatus } from '@/lib/dq-scorecard';
import { FEEDS } from '@/lib/ingestion-quality';

export type DimensionScore = {
  dimension: DQRuleRun['dimension'];
  gates: number;
  passed: number;
  warned: number;
  failed: number;
  rowsEvaluated: number;
  rowsFailed: number;
  scorePct: number;
};

export function dimensionScores(): DimensionScore[] {
  const map = new Map<DQRuleRun['dimension'], DQRuleRun[]>();
  for (const r of DQ_RULE_RUNS) {
    map.set(r.dimension, [...(map.get(r.dimension) ?? []), r]);
  }
  return [...map.entries()]
    .map(([dimension, runs]) => {
      const passed = runs.filter((r) => r.status === 'pass').length;
      return {
        dimension,
        gates: runs.length,
        passed,
        warned: runs.filter((r) => r.status === 'warn').length,
        failed: runs.filter((r) => r.status === 'fail').length,
        rowsEvaluated: runs.reduce((n, r) => n + r.rowsEvaluated, 0),
        rowsFailed: runs.reduce((n, r) => n + r.rowsFailed, 0),
        scorePct: (passed / runs.length) * 100,
      };
    })
    .sort((a, b) => a.scorePct - b.scorePct);
}

export type DQSummary = {
  gates: number;
  passed: number;
  warned: number;
  failed: number;
  rowsEvaluated: number;
  rowsFailed: number;
  cleanRowPct: number;
  /** Weighted trust score: gate pass rate (70%) + clean-row rate (30%). */
  trustScore: number;
  openIncidents: DQRuleRun[];
  generatedAt: string;
};

export function dqSummary(): DQSummary {
  const gates = DQ_RULE_RUNS.length;
  const passed = DQ_RULE_RUNS.filter((r) => r.status === 'pass').length;
  const warned = DQ_RULE_RUNS.filter((r) => r.status === 'warn').length;
  const failed = DQ_RULE_RUNS.filter((r) => r.status === 'fail').length;
  const rowsEvaluated = DQ_RULE_RUNS.reduce((n, r) => n + r.rowsEvaluated, 0);
  const rowsFailed = DQ_RULE_RUNS.reduce((n, r) => n + r.rowsFailed, 0);
  const cleanRowPct = rowsEvaluated ? ((rowsEvaluated - rowsFailed) / rowsEvaluated) * 100 : 100;
  const gatePct = (passed / gates) * 100;
  return {
    gates,
    passed,
    warned,
    failed,
    rowsEvaluated,
    rowsFailed,
    cleanRowPct,
    trustScore: gatePct * 0.7 + cleanRowPct * 0.3,
    openIncidents: DQ_RULE_RUNS.filter((r) => r.status !== 'pass').sort((a, b) =>
      a.status === b.status ? b.rowsFailed - a.rowsFailed : a.status === 'fail' ? -1 : 1,
    ),
    generatedAt: new Date().toISOString(),
  };
}

/** Feed-level rollup: which gates touch objects fed by each source system. */
export type FeedHealth = {
  id: string;
  name: string;
  system: string;
  cadence: string;
  volume: string;
  owner: string;
  status: DQStatus;
  note: string;
};

const FEED_GATE_HINTS: Record<string, string[]> = {
  pos: ['src-arrival-pos', 'bz-dup-file', 'sv-ri-item', 'sv-grain', 'sv-margin-bound', 'gd-gl-tieout'],
  ecom: ['bz-watermark'],
  inventory: ['src-roster-inv', 'sv-neg-stock', 'gd-nonneg'],
  vendor: ['src-integrity-edi', 'gd-otd'],
  master: ['sv-ri-item'],
  loyalty: ['sm-sample-floor'],
  competitor: ['bz-schema-contract', 'gd-comp-freshness'],
  space: ['gd-pk'],
};

export function feedHealth(): FeedHealth[] {
  return FEEDS.map((f) => {
    const runs = DQ_RULE_RUNS.filter((r) => (FEED_GATE_HINTS[f.id] ?? []).includes(r.id));
    const status: DQStatus = runs.some((r) => r.status === 'fail')
      ? 'fail'
      : runs.some((r) => r.status === 'warn')
        ? 'warn'
        : 'pass';
    const worst = runs.find((r) => r.status === 'fail') ?? runs.find((r) => r.status === 'warn');
    return {
      id: f.id,
      name: f.name,
      system: f.system,
      cadence: f.cadence,
      volume: f.volume,
      owner: f.ownership,
      status,
      note: worst ? `${worst.rule} — ${worst.action}` : `All ${runs.length || 1} gates clean on the latest run`,
    };
  });
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildGateCsv(): string {
  const header = [
    'layer',
    'gate',
    'object',
    'dimension',
    'status',
    'rule_expression',
    'threshold',
    'rows_evaluated',
    'rows_failed',
    'fail_rate_pct',
    'action_taken',
    'last_run',
  ];
  const rows = DQ_RULE_RUNS.map((r) =>
    [
      r.layer,
      r.rule,
      r.object,
      r.dimension,
      r.status,
      r.expression,
      r.threshold,
      r.rowsEvaluated,
      r.rowsFailed,
      r.rowsEvaluated ? ((r.rowsFailed / r.rowsEvaluated) * 100).toFixed(4) : '0',
      r.action,
      r.lastRun,
    ].map(csvCell).join(','),
  );
  return [header.join(','), ...rows].join('\n');
}

export function buildMarkdownReport(): string {
  const s = dqSummary();
  const layers = layerScorecard();
  const dims = dimensionScores();
  const feeds = feedHealth();
  const n = (v: number) => v.toLocaleString('en-US');

  const lines: string[] = [
    '# Data Quality Report',
    '',
    '**Everline Retail Group — merchandising lakehouse**  ',
    `Generated ${new Date(s.generatedAt).toUTCString()}`,
    '',
    '## Executive summary',
    '',
    `- Trust score: **${s.trustScore.toFixed(1)}%** (70% gate pass rate + 30% clean-row rate)`,
    `- Gates evaluated: **${s.gates}** — ${s.passed} pass, ${s.warned} warn, ${s.failed} fail`,
    `- Rows evaluated: **${n(s.rowsEvaluated)}**, rows failing a rule: **${n(s.rowsFailed)}** (${(100 - s.cleanRowPct).toFixed(2)}%)`,
    `- Open incidents: **${s.openIncidents.length}**`,
    '',
    '## Layer scorecard',
    '',
    '| Layer | Gates | Pass | Warn | Fail | Rows evaluated | Rows failed | Fail rate |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...layers.map(
      (l) =>
        `| ${l.layer} | ${l.gates} | ${l.passed} | ${l.warned} | ${l.failed} | ${n(l.rowsEvaluated)} | ${n(l.rowsFailed)} | ${l.failRatePct.toFixed(2)}% |`,
    ),
    '',
    '## Quality dimensions',
    '',
    '| Dimension | Gates | Pass rate | Rows failed |',
    '| --- | --- | --- | --- |',
    ...dims.map(
      (d) => `| ${d.dimension} | ${d.gates} | ${d.scorePct.toFixed(0)}% | ${n(d.rowsFailed)} |`,
    ),
    '',
    '## Source feed health',
    '',
    '| Feed | System | Cadence | Status | Note |',
    '| --- | --- | --- | --- | --- |',
    ...feeds.map((f) => `| ${f.name} | ${f.system} | ${f.cadence} | ${f.status.toUpperCase()} | ${f.note} |`),
    '',
    '## Open incidents',
    '',
  ];

  if (!s.openIncidents.length) {
    lines.push('None — every gate passed on its latest run.');
  } else {
    for (const i of s.openIncidents) {
      lines.push(
        `### [${i.status.toUpperCase()}] ${i.layer} · ${i.rule}`,
        '',
        `- Object: \`${i.object}\``,
        `- Dimension: ${i.dimension}`,
        `- Rule evaluated: \`${i.expression}\``,
        `- Threshold: ${i.threshold}`,
        `- Rows affected: ${n(i.rowsFailed)} of ${n(i.rowsEvaluated)} (${i.rowsEvaluated ? ((i.rowsFailed / i.rowsEvaluated) * 100).toFixed(2) : '0'}%)`,
        `- Action taken: ${i.action}`,
        `- Last run: ${i.lastRun}`,
        '',
      );
    }
  }

  lines.push(
    '## Full gate register',
    '',
    '| Layer | Gate | Status | Rows evaluated | Rows failed | Rule |',
    '| --- | --- | --- | --- | --- | --- |',
    ...DQ_RULE_RUNS.map(
      (r) =>
        `| ${r.layer} | ${r.rule} | ${r.status.toUpperCase()} | ${n(r.rowsEvaluated)} | ${n(r.rowsFailed)} | \`${r.expression}\` |`,
    ),
    '',
    '_Every figure in this report is computed from the recorded gate runs. Failing rows are quarantined, held out or flagged — never silently corrected._',
  );

  return lines.join('\n');
}

export function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
