import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  Database,
  Info,
  Lightbulb,
  Network,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { companyProfile } from '@/lib/data/company-profile';
import { toast } from 'sonner';

type FactValue = {
  metric: string;
  label: string;
  value: number | null;
  formatted: string;
  format: string;
};

type FactRow = { ref: string; label: string; values: Record<string, FactValue> };

type FactSet = {
  id: string;
  dataset: string;
  module: string;
  grain: string;
  dimensionLabel: string | null;
  filters: Record<string, string>;
  window: { from: string | null; to: string | null };
  recordsAnalysed: number;
  tables: string[];
  notes: string[];
  total: FactRow;
  rows: FactRow[];
};

type Claim = { text: string; refs: string[]; impact?: string };

type ScenarioSet = {
  id: string;
  kind: 'forecast' | 'price' | 'promotion' | 'planogram' | 'assortment' | 'replenishment';
  module: string;
  title: string;
  method: string;
  entity: string;
  scope: Record<string, string>;
  levers: Record<string, string>;
  assumptions: string[];
  window: { from: string | null; to: string | null };
  recordsAnalysed: number;
  tables: string[];
  notes: string[];
  total: FactRow;
  rows: FactRow[];
  chartMetric: string;
};

type AskResponse = {
  question: string;
  persona?: string;
  answerable: boolean;
  interpretation?: string;
  headline?: string;
  insights?: Claim[];
  drivers?: Claim[];
  projection?: Claim[];
  actions?: Claim[];
  caveats?: string[];
  facts?: FactSet[];
  scenarios?: ScenarioSet[];
  mode?: 'predictive' | 'descriptive';
  ontologyPath?: { from: string; to: string; via: string; label: string }[];
  modulesTouched?: string[];
  guardrail?: {
    verifiedClaims: number;
    rejectedClaims: number;
    rejected?: { text: string; reason: string }[];
    rule: string;
  };
  errors?: string[];
  elapsedMs?: number;
  error?: string;
};

const SUGGESTIONS = [
  'Which categories are driving margin down this quarter, and are out-of-stocks involved?',
  'Forecast dairy demand for the next 13 weeks and tell me what to buy',
  'What if I cut beverage prices 5% — what happens to sales and margin?',
  'Should I run 20% off snacks for 2 weeks? Model the ROI',
  'Which SKUs should I delist in pantry, and what is the margin impact?',
  'Reset the produce planogram: where should facings move and what is it worth?',
  'What safety stock and reorder points do I need at 97% service in meat?',
  'Am I priced competitively on beverages versus competitors?',
];

const SCENARIO_LABEL: Record<ScenarioSet['kind'], string> = {
  forecast: 'Forecast simulation',
  price: 'Price elasticity simulation',
  promotion: 'Promotion ROI simulation',
  planogram: 'Space / planogram simulation',
  assortment: 'Assortment rationalisation',
  replenishment: 'Replenishment optimisation',
};


function ClaimList({
  title,
  icon: Icon,
  claims,
}: {
  title: string;
  icon: typeof Lightbulb;
  claims?: Claim[];
}) {
  if (!claims?.length) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      <ul className="space-y-2">
        {claims.map((claim, i) => (
          <li
            key={`${title}-${i}`}
            className="animate-fade-up rounded-lg border border-border/70 bg-surface-raised p-3 text-sm leading-relaxed"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span>{claim.text}</span>
            {claim.impact && (
              <div className="mt-1 text-xs text-muted-foreground">Expected impact: {claim.impact}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FactChart({ fact }: { fact: FactSet }) {
  const metricKey = useMemo(() => {
    const first = fact.rows[0];
    if (!first) return null;
    const numeric = Object.values(first.values).find((v) => v.value !== null);
    return numeric?.metric ?? null;
  }, [fact]);

  if (!metricKey || fact.rows.length < 2) return null;
  const metricLabel = fact.rows[0].values[metricKey]?.label ?? metricKey;
  const data = fact.rows.slice(0, 10).map((row) => ({
    name: row.label.length > 22 ? `${row.label.slice(0, 21)}…` : row.label,
    value: row.values[metricKey]?.value ?? 0,
    formatted: row.values[metricKey]?.formatted ?? '',
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={54}
          />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={64} />
          <ChartTooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(_v: number, _n, entry: any) => [entry?.payload?.formatted ?? '', metricLabel]}
          />
          <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function FactPanel({ fact }: { fact: FactSet }) {
  const metrics = Object.values(fact.total.values);
  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Database className="h-4 w-4 text-primary" />
          {fact.dataset}
          <Badge variant="secondary" className="font-normal">
            {fact.module}
          </Badge>
        </div>
        <div className="metric-value text-xs text-muted-foreground">
          {fact.recordsAnalysed.toLocaleString('en-US')} records · {fact.grain}
        </div>
      </div>

      {(fact.window.from || fact.window.to) && (
        <div className="text-xs text-muted-foreground">
          Window {fact.window.from ?? 'earliest'} → {fact.window.to ?? 'latest'}
          {Object.keys(fact.filters).length > 0 && (
            <> · Filters {Object.entries(fact.filters).map(([k, v]) => `${k}=${v}`).join(', ')}</>
          )}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.metric} className="rounded-lg border border-border/70 bg-surface-sunken p-3">
            <div className="text-xs text-muted-foreground">{m.label}</div>
            <div className="metric-value text-lg font-semibold">{m.formatted}</div>
          </div>
        ))}
      </div>

      <FactChart fact={fact} />

      {fact.rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">{fact.dimensionLabel ?? 'Segment'}</th>
                {Object.values(fact.rows[0].values).map((v) => (
                  <th key={v.metric} className="py-2 pr-3 text-right">
                    {v.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fact.rows.map((row) => (
                <tr key={row.ref} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-3">{row.label}</td>
                  {Object.values(row.values).map((v) => (
                    <td key={v.metric} className="metric-value py-2 pr-3 text-right">
                      {v.formatted}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {fact.notes.length > 0 && (
        <div className="space-y-1 text-xs text-muted-foreground">
          {fact.notes.map((n, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{n}</span>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground">Source tables: {fact.tables.join(', ')}</div>
    </Card>
  );
}

function ScenarioChart({ scenario }: { scenario: ScenarioSet }) {
  const metricKey = useMemo(() => {
    const first = scenario.rows[0];
    if (!first) return null;
    if (first.values[scenario.chartMetric]?.value !== null && first.values[scenario.chartMetric]) return scenario.chartMetric;
    return Object.values(first.values).find((v) => v.value !== null)?.metric ?? null;
  }, [scenario]);

  if (!metricKey || scenario.rows.length < 2) return null;
  const metricLabel = scenario.rows[0].values[metricKey]?.label ?? metricKey;
  const data = scenario.rows.slice(0, 10).map((row) => ({
    name: row.label.length > 22 ? `${row.label.slice(0, 21)}…` : row.label,
    value: row.values[metricKey]?.value ?? 0,
    formatted: row.values[metricKey]?.formatted ?? '',
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={54}
          />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={64} />
          <ChartTooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(_v: number, _n, entry: any) => [entry?.payload?.formatted ?? '', metricLabel]}
          />
          <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ScenarioPanel({ scenario }: { scenario: ScenarioSet }) {
  const metrics = Object.values(scenario.total.values);
  const levers = Object.entries(scenario.levers);
  const scope = Object.entries(scenario.scope);

  return (
    <Card className="space-y-4 border-primary/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FlaskConical className="h-4 w-4 text-primary" />
          {scenario.title}
          <Badge variant="secondary" className="font-normal">
            {SCENARIO_LABEL[scenario.kind]}
          </Badge>
        </div>
        <div className="metric-value text-xs text-muted-foreground">
          {scenario.recordsAnalysed.toLocaleString('en-US')} baseline records · by {scenario.entity}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {levers.map(([k, v]) => (
          <span key={k} className="rounded-full border border-primary/40 bg-primary/5 px-2.5 py-1">
            <span className="text-muted-foreground">{k}</span> <span className="metric-value font-medium">{v}</span>
          </span>
        ))}
        {scope.map(([k, v]) => (
          <span key={k} className="rounded-full border border-border/70 bg-surface-raised px-2.5 py-1 text-muted-foreground">
            {k}: {v}
          </span>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">
        Baseline window {scenario.window.from ?? 'earliest'} → {scenario.window.to ?? 'latest'}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.metric} className="rounded-lg border border-primary/20 bg-surface-sunken p-3">
            <div className="text-xs text-muted-foreground">{m.label}</div>
            <div className="metric-value text-lg font-semibold">{m.formatted}</div>
          </div>
        ))}
      </div>

      <ScenarioChart scenario={scenario} />

      {scenario.rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">{scenario.entity}</th>
                {Object.values(scenario.rows[0].values).map((v) => (
                  <th key={v.metric} className="py-2 pr-3 text-right">
                    {v.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scenario.rows.map((row) => (
                <tr key={row.ref} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-3">{row.label}</td>
                  {Object.values(row.values).map((v) => (
                    <td key={v.metric} className="metric-value py-2 pr-3 text-right">
                      {v.formatted}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-2 rounded-lg border border-border/70 bg-surface-sunken p-3 text-xs text-muted-foreground">
        <div className="flex items-start gap-1.5">
          <Calculator className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
          <span>
            <span className="font-medium text-foreground">Model: </span>
            {scenario.method}
          </span>
        </div>
        {scenario.assumptions.map((a, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{a}</span>
          </div>
        ))}
        {scenario.notes.map((n, i) => (
          <div key={`n${i}`} className="flex items-start gap-1.5">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-status-warning" />
            <span>{n}</span>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">Source tables: {scenario.tables.join(', ')}</div>
    </Card>
  );
}



export default function AskMaya() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const ask = async (raw: string) => {
    const q = raw.trim();
    if (!q || loading) return;
    setLoading(true);
    setAnswer(null);
    try {
      const { data, error } = await supabase.functions.invoke('ask-anything', {
        body: { question: q },
      });
      if (error) throw error;
      const payload = data as AskResponse;
      if (payload?.error) throw new Error(payload.error);
      setAnswer(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach the answer engine';
      toast.error(message.includes('429') ? 'Rate limit reached — try again shortly.' : message);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight">Ask Maya anything</h1>
            <p className="text-sm text-muted-foreground">
              Ontology-grounded answers across every merchandising module — every figure computed from{' '}
              {companyProfile.banner} data, never written by the model.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="h-3 w-3" /> Zero-hallucination guardrail
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Network className="h-3 w-3" /> Retail ontology graph
          </Badge>
          <span>
            {companyProfile.fiscalYear} · {companyProfile.fiscalPeriod} · {companyProfile.dataFreshness.latencyMinutes}m latency
          </span>
        </div>
      </header>

      <Card className="space-y-3 p-4">
        <Textarea
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              ask(question);
            }
          }}
          placeholder="e.g. Which stores are losing margin on fresh, and is availability the cause?"
          className="min-h-[88px] resize-none border-border/70 bg-surface-sunken text-sm"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.slice(0, 3).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuestion(s);
                  ask(s);
                }}
                className="rounded-full border border-border/70 bg-surface-raised px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {s.length > 46 ? `${s.slice(0, 45)}…` : s}
              </button>
            ))}
          </div>
          <Button onClick={() => ask(question)} disabled={loading || !question.trim()} className="gap-2">
            <Send className="h-4 w-4" />
            {loading ? 'Grounding…' : 'Ask Maya'}
          </Button>
        </div>
      </Card>

      {loading && (
        <Card className="space-y-3 p-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-40 w-full" />
          <div className="text-xs text-muted-foreground">
            Planning against the ontology, executing governed queries, then verifying every number…
          </div>
        </Card>
      )}

      {answer && !loading && (
        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {answer.persona ?? 'Executive'} view
              </div>
              <h2 className="font-display text-xl font-semibold leading-snug">
                {answer.headline ?? 'No grounded answer available'}
              </h2>
              {answer.interpretation && (
                <p className="text-sm text-muted-foreground">{answer.interpretation}</p>
              )}
            </div>

            {answer.modulesTouched?.length ? (
              <div className="flex flex-wrap gap-2">
                {answer.modulesTouched.map((m) => (
                  <Badge key={m} variant="secondary" className="font-normal">
                    {m}
                  </Badge>
                ))}
              </div>
            ) : null}

            <Separator />

            <div className="grid gap-6 lg:grid-cols-2">
              <ClaimList title="What the data shows" icon={Lightbulb} claims={answer.insights} />
              <ClaimList title="Why it is happening" icon={TrendingUp} claims={answer.drivers} />
            </div>
            <ClaimList title="Recommended actions" icon={Target} claims={answer.actions} />

            {answer.caveats?.length ? (
              <div className="space-y-1 rounded-lg border border-border/70 bg-surface-sunken p-3 text-xs text-muted-foreground">
                {answer.caveats.map((c, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-status-warning" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>

          {answer.guardrail && (
            <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-status-good" />
                Guardrail report
              </div>
              <span className="metric-value">{answer.guardrail.verifiedClaims} verified claims</span>
              <span className="metric-value">{answer.guardrail.rejectedClaims} rejected</span>
              {answer.elapsedMs ? (
                <span className="metric-value">{(answer.elapsedMs / 1000).toFixed(1)}s</span>
              ) : null}
              <span className="basis-full">{answer.guardrail.rule}</span>
            </Card>
          )}

          {answer.ontologyPath?.length ? (
            <Card className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Network className="h-4 w-4 text-primary" />
                Ontology path used
              </div>
              <div className="flex flex-wrap gap-2">
                {answer.ontologyPath.map((edge, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-border/70 bg-surface-raised px-3 py-1.5 text-xs"
                  >
                    <span className="font-medium">{edge.from}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{edge.to}</span>
                    <span className="text-muted-foreground">· {edge.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {answer.facts?.map((fact) => <FactPanel key={fact.id} fact={fact} />)}

          {answer.errors?.length ? (
            <Card className="space-y-1 p-4 text-xs text-muted-foreground">
              {answer.errors.map((e, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-status-warning" />
                  <span>{e}</span>
                </div>
              ))}
            </Card>
          ) : null}
        </div>
      )}

      {!answer && !loading && (
        <Card className="space-y-3 p-4">
          <div className="text-sm font-semibold">Try a cross-module question</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuestion(s);
                  ask(s);
                }}
                className="rounded-lg border border-border/70 bg-surface-raised p-3 text-left text-sm transition-colors hover:border-primary/50"
              >
                {s}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
