import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileSignature,
  Loader2,
  PlugZap,
  ShieldCheck,
  Sparkles,
  Timer,
} from 'lucide-react';
import {
  CANDIDATE_SOURCES,
  GATE_FAIL_STYLE,
  SLA_TARGET_HOURS,
  buildOnboarding,
} from '@/lib/source-onboarding';

const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

export function SourceOnboardingCockpit() {
  const [sourceId, setSourceId] = useState(CANDIDATE_SOURCES[0].id);
  const source = useMemo(
    () => CANDIDATE_SOURCES.find((s) => s.id === sourceId) ?? CANDIDATE_SOURCES[0],
    [sourceId],
  );
  const state = useMemo(() => buildOnboarding(source), [source]);

  const blockingGates = state.gates.filter(
    (g) => g.onFail === 'block publish' || g.onFail === 'quarantine batch',
  ).length;

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <PlugZap className="h-4 w-4 text-primary" />
            <div>
              <div className="text-sm font-semibold">Source onboarding cockpit</div>
              <div className="max-w-3xl text-xs text-muted-foreground">
                Connector → profile → ontology mapping → generated contract → synthesised gates →
                certification → answerable in Maya. Every mapping confidence, gate threshold and hour
                below is computed from the profiled sample, not authored by hand.
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              state.onTrack
                ? 'border-status-good/30 bg-status-good/10 text-status-good'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }
          >
            {state.onTrack ? 'on track for 48h' : 'at risk'}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {CANDIDATE_SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSourceId(s.id)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                s.id === sourceId
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border/70 text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </Card>

      {/* KPI rail */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Timer,
            label: 'Answerable at',
            value: `${state.answerableAtHour}h`,
            note: `target ${SLA_TARGET_HOURS}h · ${state.hoursToAnswerable}h remaining`,
          },
          {
            icon: Clock,
            label: 'Elapsed since connect',
            value: `${source.hoursSinceConnect}h`,
            note: state.currentStep.label,
          },
          {
            icon: Sparkles,
            label: 'Auto-bound fields',
            value: pct(state.autoBindRate),
            note: `${state.mappings.filter((m) => m.decision === 'review').length} to review · required attributes ${state.requiredBound ? 'bound' : 'missing'}`,
          },
          {
            icon: ShieldCheck,
            label: 'Gates synthesised',
            value: String(state.gates.length),
            note: `${blockingGates} blocking · ${state.gates.length - blockingGates} row-level or advisory`,
          },
        ].map((k) => (
          <Card key={k.label} className="space-y-1 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <k.icon className="h-3.5 w-3.5 text-primary" />
              {k.label}
            </div>
            <div className="metric-value text-2xl font-semibold">{k.value}</div>
            <div className="text-xs text-muted-foreground">{k.note}</div>
          </Card>
        ))}
      </div>

      {/* Certification timeline */}
      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">Land → certify → answerable</div>
          <div className="text-xs text-muted-foreground">
            {source.hoursSinceConnect}h of {SLA_TARGET_HOURS}h SLA consumed
          </div>
        </div>
        <Progress value={Math.min(100, (source.hoursSinceConnect / SLA_TARGET_HOURS) * 100)} className="h-1.5" />
        <ol className="space-y-2">
          {state.steps.map((s) => (
            <li key={s.id} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
              <div className="pt-0.5">
                {s.status === 'done' ? (
                  <CheckCircle2 className="h-4 w-4 text-status-good" />
                ) : s.status === 'active' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground/60" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{s.label}</span>
                  <span className="metric-value text-xs text-muted-foreground">T+{s.atHour}h</span>
                  {s.status === 'active' && (
                    <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                      in progress
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{s.detail}</div>
                <div className="pt-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">Exit gate:</span> {s.gate}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Mapping */}
        <Card className="space-y-3 p-4">
          <div className="text-sm font-semibold">Field → ontology mapping</div>
          <div className="text-xs text-muted-foreground">
            {source.sampleRows.toLocaleString()} rows profiled from {source.connector}. Confidence is a
            weighted sum of name-token, type and value-shape evidence; below 40% nothing is bound.
          </div>
          <div className="space-y-2">
            {state.mappings.map((m) => (
              <div key={m.field.name} className="rounded-lg border border-border/60 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="metric-value rounded bg-muted px-1.5 py-0.5 text-xs">{m.field.name}</code>
                  <span className="text-xs text-muted-foreground">{m.field.sqlType}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium">
                    {m.target ? `${m.target.entity} · ${m.target.label}` : 'unmapped attribute'}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      m.decision === 'auto-bind'
                        ? 'border-status-good/30 bg-status-good/10 text-status-good'
                        : m.decision === 'review'
                          ? 'border-status-warning/30 bg-status-warning/10 text-status-warning'
                          : 'border-border/70 text-muted-foreground'
                    }
                  >
                    {m.decision} · {pct(m.confidence)}
                  </Badge>
                </div>
                <div className="pt-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">Evidence:</span> {m.evidence.join(' · ')}
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">Transform:</span> {m.transform}
                </div>
                <div className="metric-value pt-1 text-xs text-muted-foreground">
                  null {(m.field.nullRate * 100).toFixed(2)}% · distinct ratio{' '}
                  {m.field.distinctRatio.toFixed(5)} · sample “{m.field.sample}”
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          {/* Contract */}
          <Card className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileSignature className="h-4 w-4 text-primary" /> Generated data contract
            </div>
            <dl className="space-y-1.5 text-xs">
              {state.contract.map((c) => (
                <div key={c.clause} className="flex gap-3 border-b border-border/40 pb-1.5 last:border-0">
                  <dt className="w-32 shrink-0 text-muted-foreground">{c.clause}</dt>
                  <dd className="min-w-0 flex-1">{c.value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {/* Gates */}
          <Card className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" /> Auto-synthesised DQ gates
            </div>
            <div className="text-xs text-muted-foreground">
              Derived from the profile and the accepted mapping — thresholds are set from observed rates,
              not defaults.
            </div>
            <div className="space-y-2">
              {state.gates.map((g) => (
                <div key={g.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-border/70 text-muted-foreground">
                      {g.layer}
                    </Badge>
                    <span className="text-xs font-medium">{g.name}</span>
                    <span className="text-xs text-muted-foreground">{g.dimension}</span>
                    <Badge variant="outline" className={GATE_FAIL_STYLE[g.onFail]}>
                      {g.onFail}
                    </Badge>
                  </div>
                  <code className="metric-value mt-1.5 block break-words rounded bg-muted px-2 py-1 text-xs">
                    {g.expression}
                  </code>
                  <div className="pt-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">Threshold:</span> {g.threshold} ·{' '}
                    <span className="font-medium text-foreground/80">why:</span> {g.derivedFrom}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
