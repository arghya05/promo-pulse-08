import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  BACKFILL_JOBS,
  FRESHNESS_SLAS,
  RUN_STATE_STYLES,
  TASK_RUNS,
  criticalPath,
  formatCount,
  formatDuration,
  formatLag,
  orchestrationSummary,
  type TaskRun,
} from '@/lib/orchestration-runs';
import { LAYER_STYLES } from '@/lib/lineage-layers';
import { Clock, GitBranch, History, RefreshCw, Timer } from 'lucide-react';

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="metric-value mt-1 text-xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{hint}</div>
    </Card>
  );
}

function RunRow({ run, onSelect, selected }: { run: TaskRun; onSelect: () => void; selected: boolean }) {
  const tone = RUN_STATE_STYLES[run.state];
  const layerTone = (LAYER_STYLES as Record<string, { badge?: string }>)[run.layer]?.badge ?? '';
  const drift = run.state !== 'running' && run.durationSec > run.medianSec * 1.15;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`w-full rounded-lg border p-3 text-left transition ${
          selected ? 'border-primary/40 bg-primary/5' : 'border-border/70 bg-card hover:bg-muted/40'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="metric-value text-sm font-medium leading-snug">{run.task}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {run.startedAt} · {formatDuration(run.durationSec)} (median {formatDuration(run.medianSec)})
              {drift ? ' · slower than median' : ''}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className={`text-[10px] ${layerTone}`}>{run.layer}</Badge>
            <Badge variant="secondary" className="text-[10px]">{run.loadPattern}</Badge>
            <Badge variant="secondary" className={`text-[10px] ${tone.badge}`}>{tone.label}</Badge>
          </div>
        </div>
        <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-3">
          <div>Attempts <span className="metric-value text-foreground">{run.attempts}/{run.maxAttempts}</span></div>
          <div>Rows in <span className="metric-value text-foreground">{formatCount(run.rowsIn)}</span></div>
          <div>Rows out <span className="metric-value text-foreground">{formatCount(run.rowsOut)}</span></div>
        </div>
      </button>
    </li>
  );
}

export default function OrchestrationView() {
  const s = useMemo(() => orchestrationSummary(), []);
  const path = useMemo(() => criticalPath(), []);
  const [selectedId, setSelectedId] = useState(TASK_RUNS[0].id);
  const selected = TASK_RUNS.find((t) => t.id === selectedId)!;
  const pathSeconds = path.reduce((sum, t) => sum + t.durationSec, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Run success"
          value={`${s.successRate.toFixed(1)}%`}
          hint={`${s.total} tasks · ${s.failed} failed · ${s.retried} recovered by retry · ${s.running} in flight`}
        />
        <Kpi
          label="Freshness SLA"
          value={`${FRESHNESS_SLAS.length - s.slaBreached}/${FRESHNESS_SLAS.length} met`}
          hint={`Worst: ${s.worstSla.object} at ${formatLag(s.worstSla.actualMin)} against a ${formatLag(s.worstSla.targetMin)} promise`}
        />
        <Kpi
          label="Late-arriving rows"
          value={formatCount(s.lateAccepted)}
          hint={`Accepted inside the grace window · ${formatCount(s.lateRejected)} rejected past watermark seal`}
        />
        <Kpi
          label="Backfill coverage"
          value={`${s.backfillCoverage.toFixed(0)}%`}
          hint={`${s.partitionsDone}/${s.partitionsTotal} partitions rebuilt · ${formatCount(s.rowsRestated)} rows restated`}
        />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <GitBranch className="h-4 w-4 text-primary" /> Critical path to an answer
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Longest dependency chain in the DAG — {path.length} tasks, {formatDuration(pathSeconds)} of compute
          between a register drawer closing and a certified metric.
        </p>
        <ol className="mt-3 flex flex-wrap items-center gap-1.5">
          {path.map((t, i) => (
            <li key={t.id} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedId(t.id)}
                className="metric-value rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-[11px] hover:bg-muted"
              >
                {t.task} · {formatDuration(t.durationSec)}
              </button>
              {i < path.length - 1 && <span className="text-muted-foreground">→</span>}
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <RefreshCw className="h-4 w-4 text-primary" /> DAG run log
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {s.retryRatio.toFixed(2)} attempts per task on average. Every task is idempotent, so a retry or
            replay produces the same result rather than double-counting.
          </p>
          <ul className="mt-3 space-y-2">
            {TASK_RUNS.map((run) => (
              <RunRow key={run.id} run={run} selected={run.id === selectedId} onSelect={() => setSelectedId(run.id)} />
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="text-sm font-semibold">Task detail</div>
            <div className="metric-value mt-1 text-sm">{selected.task}</div>
            <dl className="mt-3 space-y-2 text-xs">
              <div>
                <dt className="text-muted-foreground">Load pattern</dt>
                <dd>{selected.loadPattern}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Idempotency</dt>
                <dd>{selected.idempotency}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Depends on</dt>
                <dd className="metric-value">
                  {selected.dependsOn.length ? selected.dependsOn.join(', ') : 'no upstream (root task)'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">What happened</dt>
                <dd>{selected.note}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-primary" /> Freshness & watermarks
            </div>
            <ul className="mt-3 space-y-2">
              {FRESHNESS_SLAS.map((f) => {
                const breached = f.actualMin > f.targetMin;
                const pct = Math.min(100, (f.actualMin / f.targetMin) * 100);
                return (
                  <li key={f.object} className="rounded-lg border border-border/70 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="metric-value text-xs">{f.object}</span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          breached
                            ? 'bg-destructive/10 text-destructive border-destructive/30'
                            : 'bg-status-good/10 text-status-good border-status-good/30'
                        }`}
                      >
                        {formatLag(f.actualMin)} / {formatLag(f.targetMin)}
                      </Badge>
                    </div>
                    <Progress value={pct} className="mt-2 h-1.5" />
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      Watermark {f.watermark} ({formatLag(f.watermarkLagMin)} behind event time) ·{' '}
                      {f.lateArrivalWindow} · {formatCount(f.lateRowsAccepted)} late rows accepted,{' '}
                      {formatCount(f.lateRowsRejected)} rejected
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <History className="h-4 w-4 text-primary" /> Backfill & restatement
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          When history changes, partitions are rebuilt and downstream answers re-pointed. Until a restatement
          finishes, answers on the affected measure disclose it.
        </p>
        <ul className="mt-3 grid gap-2 md:grid-cols-3">
          {BACKFILL_JOBS.map((b) => {
            const pct = b.partitionsTotal > 0 ? (b.partitionsDone / b.partitionsTotal) * 100 : 0;
            return (
              <li key={b.id} className="rounded-lg border border-border/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="metric-value text-xs">{b.target}</span>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {b.status}
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{b.reason}</p>
                <Progress value={pct} className="mt-2 h-1.5" />
                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  {b.fromDate} → {b.toDate} · {b.partitionsDone}/{b.partitionsTotal} partitions ·{' '}
                  {formatCount(b.rowsRestated)} rows restated ·{' '}
                  {b.downstreamRefreshed ? 'downstream refreshed' : 'downstream refresh pending'}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
