import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  ACCESS_RULES,
  CLASSIFIED_COLUMNS,
  ERASURE_REQUESTS,
  MASK_LABELS,
  SENSITIVITY_STYLES,
  governanceSummary,
} from '@/lib/governance-pii';
import { formatCount } from '@/lib/orchestration-runs';
import { Eraser, KeyRound, Lock, Search, ShieldCheck } from 'lucide-react';

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="metric-value mt-1 text-xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{hint}</div>
    </Card>
  );
}

export default function GovernanceView() {
  const s = useMemo(() => governanceSummary(), []);
  const [query, setQuery] = useState('');

  const columns = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CLASSIFIED_COLUMNS;
    return CLASSIFIED_COLUMNS.filter((c) =>
      [c.object, c.column, c.category, c.sensitivity, MASK_LABELS[c.mask], c.answerUse]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Classified columns"
          value={`${s.masked}/${s.total} masked`}
          hint={`${s.restricted} restricted · average detector confidence ${(s.avgConfidence * 100).toFixed(1)}%`}
        />
        <Kpi
          label="Citable in answers"
          value={String(s.citableCount)}
          hint={`Everything else is blocked at the semantic layer, not by prompt instruction`}
        />
        <Kpi
          label="k-anonymity floor"
          value={`k ≥ ${s.kAnonThreshold}`}
          hint="Segment slices below the floor are suppressed instead of returned"
        />
        <Kpi
          label="Right to erasure"
          value={`${s.avgErasureDays.toFixed(1)}d avg`}
          hint={`${formatCount(s.rowsErased)} rows erased · ${s.openRequests} in progress · ${s.slaMisses} SLA misses`}
        />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="h-4 w-4 text-primary" /> Column classification & masking
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search columns, objects, masks"
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {s.coveragePct.toFixed(0)}% of classified columns carry a mask. The answer engine reads the same policy
          — a blocked column cannot become a cited number.
        </p>
        <ul className="mt-3 space-y-2">
          {columns.map((c) => {
            const tone = SENSITIVITY_STYLES[c.sensitivity];
            return (
              <li key={c.id} className="rounded-lg border border-border/70 bg-card p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="metric-value text-sm font-medium leading-snug">
                      {c.object}.<span className="text-primary">{c.column}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {c.detector} · confidence {(c.confidence * 100).toFixed(0)}% · {formatCount(c.rowCount)} rows ·
                      retention {c.retentionDays.toLocaleString()}d
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">{c.category}</Badge>
                    <Badge variant="secondary" className={`text-[10px] ${tone.badge}`}>{tone.label}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{MASK_LABELS[c.mask]}</Badge>
                  </div>
                </div>
                <div className="mt-2 grid gap-1.5 text-[11px] sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Answer use: </span>
                    {c.answerUse}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unmasked for: </span>
                    <span className="metric-value">{c.allowedRoles.join(', ')}</span>
                    <span className="text-muted-foreground"> · basis: {c.legalBasis}</span>
                  </div>
                </div>
              </li>
            );
          })}
          {columns.length === 0 && (
            <li className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No classified column matches “{query}”.
            </li>
          )}
        </ul>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <KeyRound className="h-4 w-4 text-primary" /> Access policy by role
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Row and column policies are enforced in the semantic layer, so the same question asked by two roles
            returns two correctly scoped answers.
          </p>
          <ul className="mt-3 space-y-2">
            {ACCESS_RULES.map((r) => (
              <li key={r.id} className="rounded-lg border border-border/70 p-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="metric-value text-sm font-medium">{r.role}</span>
                  <Badge variant="secondary" className="text-[10px]">{r.grain}</Badge>
                </div>
                <p className="mt-1 text-muted-foreground">Scope: {r.scope}</p>
                <p className="mt-1">Enforced at: {r.enforcedAt}</p>
                <p className="mt-1 text-muted-foreground">Denied: {r.denies}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Eraser className="h-4 w-4 text-primary" /> Retention & right to erasure
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Erasure walks the same lineage graph the answers use, so every copy of a subject is found. Facts are
            re-keyed to an anonymous cohort, which keeps history additive.
          </p>
          <ul className="mt-3 space-y-2">
            {ERASURE_REQUESTS.map((e) => {
              const pct = Math.min(100, (e.elapsedDays / e.slaDays) * 100);
              return (
                <li key={e.id} className="rounded-lg border border-border/70 p-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="metric-value text-sm font-medium">{e.id}</span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-[10px]">{e.regime}</Badge>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          e.status === 'complete'
                            ? 'bg-status-good/10 text-status-good border-status-good/30'
                            : 'bg-primary/10 text-primary border-primary/30'
                        }`}
                      >
                        {e.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-1 text-muted-foreground">{e.note}</p>
                  <Progress value={pct} className="mt-2 h-1.5" />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Received {e.receivedAt} · day {e.elapsedDays} of {e.slaDays} · {e.objectsTouched} objects swept ·{' '}
                    {formatCount(e.rowsErased)} rows erased ·{' '}
                    {e.aggregatesPreserved ? 'aggregates preserved' : 'aggregates restated'}
                  </p>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card className="flex items-start gap-2 border-primary/25 bg-primary/5 p-3 text-xs">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          Governance is upstream of the model: masks, row policies and the k-anonymity floor are applied when the
          facts are fetched, so a restricted value never reaches the narration step in the first place.
        </p>
      </Card>
    </div>
  );
}
