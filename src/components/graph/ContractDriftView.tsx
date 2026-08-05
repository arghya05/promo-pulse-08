import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  CONTRACT_DRIFTS,
  DRIFT_CLASS_STYLES,
  QUARANTINE_BATCHES,
  QUARANTINE_STATUS_STYLES,
  driftSummary,
} from '@/lib/contract-drift';
import { formatCount } from '@/lib/orchestration-runs';
import { FileWarning, Inbox, ShieldAlert, Undo2 } from 'lucide-react';

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="metric-value mt-1 text-xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{hint}</div>
    </Card>
  );
}

export default function ContractDriftView() {
  const s = useMemo(() => driftSummary(), []);
  const [openBatch, setOpenBatch] = useState<string>(QUARANTINE_BATCHES[0].id);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Drift events"
          value={String(s.total)}
          hint={`${s.breaking} breaking · ${s.autoPct.toFixed(0)}% absorbed without human intervention`}
        />
        <Kpi
          label="Quarantined rows"
          value={formatCount(s.quarantined)}
          hint={`${s.quarantineRatePct.toFixed(3)}% of inspected rows · ${s.openBatches} batches still open`}
        />
        <Kpi
          label="Replay recovery"
          value={`${s.recoveryPct.toFixed(1)}%`}
          hint={`${formatCount(s.recovered)} rows returned to the pipeline after the source fix`}
        />
        <Kpi
          label="Silently dropped"
          value={String(s.silentlyDropped)}
          hint="Contract rule: a bad row is held and named, never discarded — this number must stay at zero"
        />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FileWarning className="h-4 w-4 text-primary" /> Schema-contract enforcement
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Every feed is bound to a versioned contract. Additive changes are absorbed, type and unit changes are
          mapped, and a breaking change holds the batch before it can corrupt gold.
          {s.blockedDownstream.length > 0 && (
            <> Currently protecting: <span className="metric-value">{s.blockedDownstream.join(', ')}</span>.</>
          )}
        </p>
        <ul className="mt-3 space-y-2">
          {CONTRACT_DRIFTS.map((d) => {
            const tone = DRIFT_CLASS_STYLES[d.driftClass];
            return (
              <li key={d.id} className="rounded-lg border border-border/70 bg-card p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-snug">{d.feed}</div>
                    <div className="metric-value mt-0.5 text-[11px] text-muted-foreground">
                      {d.contract} {d.contractVersion} · detected {d.detectedAt}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className={`text-[10px] ${tone.badge}`}>{tone.label}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{d.action}</Badge>
                  </div>
                </div>
                <p className="metric-value mt-2 rounded-md bg-muted/50 p-2 text-[11px]">{d.change}</p>
                <p className="mt-2 text-xs leading-snug text-muted-foreground">{d.resolution}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span>{formatCount(d.rowsAffected)} rows in scope</span>
                  <span>·</span>
                  <span>protects</span>
                  {d.downstream.map((o) => (
                    <Badge key={o} variant="secondary" className="metric-value text-[10px]">{o}</Badge>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Inbox className="h-4 w-4 text-primary" /> Quarantine (dead-letter) queue
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Rows that fail a row-level rule are parked with the failing predicate and an owner, then replayed once
          the source is fixed. Answers stay correct because the held rows are disclosed, not assumed away.
        </p>
        <div className="mt-3 space-y-2">
          {QUARANTINE_BATCHES.map((q) => {
            const tone = QUARANTINE_STATUS_STYLES[q.replay.status];
            const isOpen = openBatch === q.id;
            const ratePct = (q.rowsQuarantined / q.rowsInBatch) * 100;
            const recoveredPct = q.rowsQuarantined > 0 ? (q.replay.rowsRecovered / q.rowsQuarantined) * 100 : 0;
            return (
              <div key={q.id} className="rounded-lg border border-border/70 bg-card">
                <button
                  type="button"
                  onClick={() => setOpenBatch(isOpen ? '' : q.id)}
                  className="flex w-full flex-wrap items-start justify-between gap-2 p-3 text-left"
                  aria-expanded={isOpen}
                >
                  <div className="min-w-0">
                    <div className="metric-value text-sm font-medium leading-snug">{q.object}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatCount(q.rowsQuarantined)} of {formatCount(q.rowsInBatch)} rows held ({ratePct.toFixed(3)}%) · first seen {q.firstSeen}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">{q.layer}</Badge>
                    <Badge variant="secondary" className={`text-[10px] ${tone.badge}`}>{tone.label}</Badge>
                  </div>
                </button>
                {isOpen && (
                  <div className="space-y-3 border-t border-border/70 p-3 text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        <ShieldAlert className="h-3 w-3" /> Rule that held the rows
                      </div>
                      <code className="metric-value mt-1 block rounded-md bg-muted/60 p-2 text-[11px]">{q.rule}</code>
                      <p className="mt-1.5 text-muted-foreground">{q.reason}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        <Undo2 className="h-3 w-3" /> Replay after fix
                      </div>
                      <p className="mt-1">{q.replay.fix}</p>
                      <Progress value={recoveredPct} className="mt-2 h-1.5" />
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatCount(q.replay.rowsRecovered)} of {formatCount(q.rowsQuarantined)} rows recovered
                        {q.replay.replayedAt ? ` · replayed ${q.replay.replayedAt}` : ' · awaiting source fix'} ·
                        owner {q.owner}
                      </p>
                    </div>
                    <div className="rounded-md border border-primary/25 bg-primary/5 p-2">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                        What answers do meanwhile
                      </div>
                      <p className="mt-1">{q.answerBehaviour}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
