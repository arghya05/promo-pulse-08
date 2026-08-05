import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, CheckCircle2, FlaskConical, ShieldCheck, Sparkles } from 'lucide-react';
import {
  MESSY_CASES,
  computeOutcome,
  formatValue,
  type MessyRow,
} from '@/lib/messy-data-lab';

const verdictStyle: Record<MessyRow['verdict'], { label: string; cls: string }> = {
  clean: { label: 'clean', cls: 'bg-status-good/10 text-status-good border-status-good/30' },
  repaired: { label: 'repaired', cls: 'bg-primary/10 text-primary border-primary/30' },
  quarantined: { label: 'quarantined', cls: 'bg-status-critical/10 text-status-critical border-status-critical/30' },
  flagged: { label: 'flagged', cls: 'bg-status-warn/10 text-status-warn border-status-warn/30' },
};

function rawPreview(raw: MessyRow['raw']) {
  return Object.entries(raw)
    .map(([k, v]) => `${k}=${v === null ? 'NULL' : String(v)}`)
    .join('  ·  ');
}

export function MessyDataLab() {
  const [caseId, setCaseId] = useState(MESSY_CASES[0].id);
  const [governed, setGoverned] = useState(true);

  const activeCase = useMemo(
    () => MESSY_CASES.find((c) => c.id === caseId) ?? MESSY_CASES[0],
    [caseId],
  );
  const outcome = useMemo(() => computeOutcome(activeCase), [activeCase]);

  const shown = governed ? outcome.governed : outcome.naive;
  const shownError = governed ? outcome.governedError : outcome.naiveError;

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            <div>
              <div className="text-sm font-semibold">Messy-data lab</div>
              <div className="text-xs text-muted-foreground">
                Deliberately dirty fixture feeds, run through the same gates as production. Toggle the
                pipeline off to see what an ungoverned SUM would have answered.
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-1.5 text-xs">
            <Switch checked={governed} onCheckedChange={setGoverned} />
            <span className="font-medium">{governed ? 'Governed pipeline on' : 'Raw feed, no gates'}</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {MESSY_CASES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCaseId(c.id)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                c.id === caseId
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border/70 text-muted-foreground hover:text-foreground'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card className="space-y-4 p-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Question</div>
            <div className="text-sm font-semibold">{activeCase.question}</div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/70 p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {governed ? 'Governed answer' : 'Ungoverned answer'}
              </div>
              <div className="metric-value text-xl font-semibold">
                {formatValue(shown, activeCase.unit)}
              </div>
              <div
                className={`text-[11px] ${
                  shownError <= 0.01 ? 'text-status-good' : 'text-status-critical'
                }`}
              >
                {shownError <= 0.01 ? 'matches audited truth' : `${shownError}% off audited truth`}
              </div>
            </div>
            <div className="rounded-lg border border-border/70 p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Audited truth</div>
              <div className="metric-value text-xl font-semibold">
                {formatValue(outcome.truth, activeCase.unit)}
              </div>
              <div className="text-[11px] text-muted-foreground">recomputed from source rows</div>
            </div>
            <div className="rounded-lg border border-border/70 p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Trust score</div>
              <div className="metric-value text-xl font-semibold">{outcome.trustScore}</div>
              <div className="text-[11px] text-muted-foreground">
                accuracy 60% · disclosed coverage 40%
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs leading-relaxed">
            <div className="mb-1 flex items-center gap-1.5 font-semibold">
              {governed ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-status-good" /> What Maya says
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-status-critical" /> What an ungoverned SUM says
                </>
              )}
            </div>
            {governed ? activeCase.governedAnswer : activeCase.naiveAnswer}
          </div>

          {governed && (
            <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-xs leading-relaxed">
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Coverage disclosure
              </div>
              {activeCase.coverageNote}
            </div>
          )}
        </Card>

        <Card className="space-y-3 p-4">
          <div className="text-sm font-semibold">Batch verdict</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Rows in batch', value: outcome.rowsTotal },
              { label: 'Defect rate', value: `${outcome.defectRate}%` },
              { label: 'Clean', value: outcome.rowsClean },
              { label: 'Repaired', value: outcome.rowsRepaired },
              { label: 'Quarantined', value: outcome.rowsQuarantined },
              { label: 'Flagged', value: outcome.rowsFlagged },
              { label: 'Metric coverage', value: `${outcome.coveragePct}%` },
              { label: 'Metric', value: activeCase.metric, wide: true },
            ].map((s) => (
              <div
                key={s.label}
                className={`rounded-lg border border-border/70 p-2.5 ${s.wide ? 'col-span-2' : ''}`}
              >
                <div className="text-[11px] text-muted-foreground">{s.label}</div>
                <div className={s.wide ? 'text-xs font-medium' : 'metric-value text-base font-semibold'}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
            Quality is not "clean data in" — it is every defect being named, routed and disclosed. A
            {' '}{outcome.defectRate}% defect rate still yields an exact answer because bad rows are quarantined
            rather than averaged, and coverage is published with the number.
          </div>
        </Card>
      </div>

      <Card className="p-0">
        <div className="border-b border-border/70 p-4 text-sm font-semibold">
          Row-level remediation walk
        </div>
        <div className="divide-y divide-border/60">
          {activeCase.rows.map((row) => {
            const v = verdictStyle[row.verdict];
            const contributes = governed ? row.governedValue : row.naiveValue;
            return (
              <div key={row.id} className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${v.cls}`}>
                    {v.label}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    caught at {row.layer}
                  </Badge>
                  <span className="text-xs font-semibold">{row.defect}</span>
                  <span className="ml-auto metric-value text-xs text-muted-foreground">
                    contributes {formatValue(contributes, activeCase.unit)}
                  </span>
                </div>
                <div className="overflow-x-auto rounded-md border border-border/70 bg-muted/30 p-2">
                  <code className="metric-value whitespace-nowrap text-[11px] text-muted-foreground">
                    {rawPreview(row.raw)}
                  </code>
                </div>
                <div className="grid gap-2 text-xs sm:grid-cols-2">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Rule</div>
                    <code className="metric-value text-[11px]">{row.rule}</code>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Action</div>
                    <div className="flex items-start gap-1.5 leading-relaxed">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-good" />
                      <span>{row.action}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
