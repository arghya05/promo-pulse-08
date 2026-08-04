import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { LAYER_STYLES } from '@/lib/lineage-layers';
import {
  DQ_STATUS_STYLES,
  formatRows,
  layerScorecard,
  type DQRuleRun,
  type DQStatus,
} from '@/lib/dq-scorecard';
import { AlertOctagon, AlertTriangle, CheckCircle2, Gauge } from 'lucide-react';

const STATUS_ICON: Record<DQStatus, typeof CheckCircle2> = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: AlertOctagon,
};

function RuleRow({ run }: { run: DQRuleRun }) {
  const tone = DQ_STATUS_STYLES[run.status];
  const Icon = STATUS_ICON[run.status];
  return (
    <li className="rounded-lg border border-border/70 bg-card p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${tone.badge.split(' ')[1]}`} />
          <div className="min-w-0">
            <div className="text-sm font-medium leading-snug">{run.rule}</div>
            <div className="metric-value text-[11px] text-muted-foreground">{run.object}</div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px]">
            {run.dimension}
          </Badge>
          <Badge variant="secondary" className={`text-[10px] ${tone.badge}`}>
            {tone.label}
          </Badge>
        </div>
      </div>

      <div className="mt-2 rounded-md bg-muted/60 p-2">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Rule evaluated — rows matching this predicate fail the gate
        </div>
        <code className="metric-value mt-0.5 block break-words text-[11px] text-foreground/85">
          {run.expression}
        </code>
      </div>

      <div className="mt-2 grid gap-x-6 gap-y-1 text-[11px] text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
        <span>
          Rows evaluated ·{' '}
          <span className="metric-value text-foreground/85">{formatRows(run.rowsEvaluated)}</span>
        </span>
        <span>
          Rows failed ·{' '}
          <span className={`metric-value ${run.rowsFailed ? 'text-foreground' : 'text-foreground/85'}`}>
            {formatRows(run.rowsFailed)}
          </span>{' '}
          <span className="metric-value">
            ({run.rowsEvaluated ? ((run.rowsFailed / run.rowsEvaluated) * 100).toFixed(2) : '0.00'}%)
          </span>
        </span>
        <span>
          Threshold · <span className="metric-value text-foreground/85">{run.threshold}</span>
        </span>
        <span>
          Last run · <span className="metric-value text-foreground/85">{run.lastRun}</span>
        </span>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">Action taken</span> · {run.action}
      </div>
    </li>
  );
}

export function QualityScorecard() {
  const scores = useMemo(() => layerScorecard(), []);
  const [active, setActive] = useState<DQRuleRun['layer']>('Silver');
  const activeScore = scores.find((s) => s.layer === active) ?? scores[0];

  const totals = useMemo(
    () => ({
      gates: scores.reduce((n, s) => n + s.gates, 0),
      passed: scores.reduce((n, s) => n + s.passed, 0),
      warned: scores.reduce((n, s) => n + s.warned, 0),
      failed: scores.reduce((n, s) => n + s.failed, 0),
      rows: scores.reduce((n, s) => n + s.rowsEvaluated, 0),
      bad: scores.reduce((n, s) => n + s.rowsFailed, 0),
    }),
    [scores],
  );

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Gauge className="h-4 w-4 text-primary" />
          Data-quality scorecard — last run per layer
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <Badge variant="secondary" className={`text-[10px] ${DQ_STATUS_STYLES.pass.badge}`}>
            {totals.passed} pass
          </Badge>
          <Badge variant="secondary" className={`text-[10px] ${DQ_STATUS_STYLES.warn.badge}`}>
            {totals.warned} warn
          </Badge>
          <Badge variant="secondary" className={`text-[10px] ${DQ_STATUS_STYLES.fail.badge}`}>
            {totals.failed} fail
          </Badge>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {totals.gates} standing gates evaluated {formatRows(totals.rows)} rows in the latest run;{' '}
        {formatRows(totals.bad)} rows tripped a rule and were quarantined, held out or flagged — never
        silently corrected. Pick a layer to see the exact predicate behind each result.
      </p>

      {/* Layer summary tiles */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {scores.map((s) => {
          const tone = DQ_STATUS_STYLES[s.status];
          const selected = s.layer === active;
          return (
            <button
              key={s.layer}
              type="button"
              onClick={() => setActive(s.layer)}
              className={`rounded-lg border p-3 text-left transition ${
                selected
                  ? 'border-primary/50 bg-primary/5 shadow-sm'
                  : 'border-border/70 hover:border-primary/30'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary" className={`text-[10px] ${LAYER_STYLES[s.layer].badge}`}>
                  {s.layer.toUpperCase()}
                </Badge>
                <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
              </div>
              <div className="metric-value mt-2 text-lg leading-none">
                {s.passed}
                <span className="text-sm text-muted-foreground">/{s.gates}</span>
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">gates passed</div>
              <div className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
                <div>
                  Rows checked ·{' '}
                  <span className="metric-value text-foreground/85">{formatRows(s.rowsEvaluated)}</span>
                </div>
                <div>
                  Rows failed ·{' '}
                  <span className="metric-value text-foreground/85">{formatRows(s.rowsFailed)}</span>{' '}
                  <span className="metric-value">({s.failRatePct.toFixed(2)}%)</span>
                </div>
                {(s.warned > 0 || s.failed > 0) && (
                  <div className="metric-value">
                    {s.warned > 0 && <span className="text-status-warning">{s.warned} warn</span>}
                    {s.warned > 0 && s.failed > 0 && ' · '}
                    {s.failed > 0 && <span className="text-destructive">{s.failed} fail</span>}
                  </div>
                )}
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${tone.dot}`}
                  style={{ width: `${s.gates ? (s.passed / s.gates) * 100 : 0}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Rule-level detail for the selected layer */}
      {activeScore && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className={`text-[10px] ${LAYER_STYLES[activeScore.layer].badge}`}>
              {activeScore.layer.toUpperCase()}
            </Badge>
            <span>
              {activeScore.gates} gates · {activeScore.passed} pass · {activeScore.warned} warn ·{' '}
              {activeScore.failed} fail · {formatRows(activeScore.rowsFailed)} of{' '}
              {formatRows(activeScore.rowsEvaluated)} rows affected
            </span>
          </div>
          <ul className="mt-2 space-y-2">
            {activeScore.runs.map((run) => (
              <RuleRow key={run.id} run={run} />
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
