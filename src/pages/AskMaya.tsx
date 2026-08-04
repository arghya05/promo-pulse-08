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
  Calculator,
  CheckCircle2,
  Command as CommandIcon,
  Database,
  FlaskConical,
  Info,
  Lightbulb,
  Loader2,
  Network,
  RotateCcw,
  Send,
  ShieldCheck,
  Square,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { companyProfile, netSalesTrend } from '@/lib/data/company-profile';
import { Sparkline } from '@/components/shell/Sparkline';
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
  kind:
    | 'forecast'
    | 'price'
    | 'promotion'
    | 'planogram'
    | 'assortment'
    | 'replenishment'
    | 'markdown'
    | 'supplier_risk'
    | 'stockout_risk'
    | 'plan';
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
  'What markdown depth clears aged bakery stock in 6 weeks at 85% sell-through?',
  'Which suppliers put my next quarter at risk, and how much buffer should I add?',
  'How much sales will I lose to stockouts in produce over the next 4 weeks?',
  'Will we land the quarter on plan at +3% growth, and where is the gap?',
];

const SCENARIO_LABEL: Record<ScenarioSet['kind'], string> = {
  forecast: 'Forecast simulation',
  price: 'Price elasticity simulation',
  promotion: 'Promotion ROI simulation',
  planogram: 'Space / planogram simulation',
  assortment: 'Assortment rationalisation',
  replenishment: 'Replenishment optimisation',
  markdown: 'Markdown / clearance optimisation',
  supplier_risk: 'Supplier reliability outlook',
  stockout_risk: 'Availability & lost-sales risk',
  plan: 'Plan landing & gap-to-plan',
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

const STAGES = [
  { key: 'plan', label: 'Planning against the retail ontology' },
  { key: 'execute', label: 'Executing governed queries on POS & inventory' },
  { key: 'simulate', label: 'Running deterministic simulations' },
  { key: 'narrate', label: 'Composing the answer' },
  { key: 'verify', label: 'Verifying every figure against the database' },
];

function GroundingCard({ question }: { question: string }) {
  const [stage, setStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 2600);
    const e = setInterval(() => setElapsed((v) => v + 0.1), 100);
    return () => {
      clearInterval(t);
      clearInterval(e);
    };
  }, []);

  return (
    <Card className="animate-fade-up space-y-4 border-primary/25 p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Grounding answer
        </div>
        <span className="metric-value text-xs text-muted-foreground">{elapsed.toFixed(1)}s</span>
      </div>
      <p className="text-sm text-muted-foreground">{question}</p>
      <ul className="space-y-2">
        {STAGES.map((s, i) => (
          <li
            key={s.key}
            className={`flex items-center gap-2 text-xs transition-colors ${
              i < stage ? 'text-muted-foreground' : i === stage ? 'text-foreground' : 'text-muted-foreground/50'
            }`}
          >
            {i < stage ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-status-good" />
            ) : i === stage ? (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary animate-pulse-dot" />
            ) : (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-border" />
            )}
            {s.label}
          </li>
        ))}
      </ul>
      <div className="space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-32 w-full" />
      </div>
    </Card>
  );
}

function AnswerBlock({ answer }: { answer: AskResponse }) {
  return (
    <div className="animate-fade-up space-y-5">
      <Card className="space-y-4 p-4 md:p-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <span>{answer.persona ?? 'Executive'} view</span>
            {answer.mode && (
              <Badge variant="outline" className="gap-1 text-[10px] font-normal uppercase">
                {answer.mode === 'predictive' ? <FlaskConical className="h-3 w-3" /> : <Database className="h-3 w-3" />}
                {answer.mode}
              </Badge>
            )}
          </div>
          <h2 className="font-display text-lg font-semibold leading-snug md:text-xl">
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
        <ClaimList title="What the simulation projects" icon={FlaskConical} claims={answer.projection} />
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

      {answer.scenarios?.map((sc) => <ScenarioPanel key={sc.id} scenario={sc} />)}
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
  );
}

type Turn =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; answer: AskResponse }
  | { id: string; role: 'error'; text: string };

export default function AskMaya() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns.length, pending]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const recent = useMemo(
    () => turns.filter((t): t is Extract<Turn, { role: 'user' }> => t.role === 'user').slice(-4).reverse(),
    [turns],
  );

  const ask = async (raw: string) => {
    const q = raw.trim();
    if (!q || loading) return;
    const id = ++requestId.current;
    setQuestion('');
    setTurns((prev) => [...prev, { id: `u-${id}`, role: 'user', text: q }]);
    setPending(q);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ask-anything', {
        body: { question: q },
      });
      if (error) throw error;
      const payload = data as AskResponse;
      if (payload?.error) throw new Error(payload.error);
      if (requestId.current !== id) return;
      setTurns((prev) => [...prev, { id: `a-${id}`, role: 'assistant', answer: payload }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach the answer engine';
      const friendly = message.includes('429')
        ? 'Rate limit reached — try again shortly.'
        : message.includes('402')
          ? 'AI credits exhausted for this workspace.'
          : message;
      if (requestId.current === id) {
        setTurns((prev) => [...prev, { id: `e-${id}`, role: 'error', text: friendly }]);
      }
      toast.error(friendly);
    } finally {
      if (requestId.current === id) {
        setPending(null);
        setLoading(false);
        inputRef.current?.focus();
      }
    }
  };

  const stop = () => {
    requestId.current += 1;
    setPending(null);
    setLoading(false);
    inputRef.current?.focus();
  };

  const reset = () => {
    requestId.current += 1;
    setTurns([]);
    setPending(null);
    setLoading(false);
    setQuestion('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-border/70 bg-gradient-surface px-4 py-3 md:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <Network className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-semibold tracking-tight">
                Ask Maya anything
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                Every figure computed from {companyProfile.banner} data · {companyProfile.fiscalYear} ·{' '}
                {companyProfile.fiscalPeriod} · {companyProfile.dataFreshness.latencyMinutes}m latency
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg border border-border/70 bg-card/70 px-2.5 py-1.5 lg:flex">
              <Sparkline data={netSalesTrend} className="text-chart-1" />
              <div className="leading-tight">
                <div className="font-mono text-xs font-semibold">$3.24B</div>
                <div className="text-[10px] text-muted-foreground">Net sales · 12-wk</div>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="leading-tight">
                <div className="flex items-center gap-1 font-mono text-xs font-semibold">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-good opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-good" />
                  </span>
                  {companyProfile.dataFreshness.latencyMinutes}m
                </div>
                <div className="text-[10px] text-muted-foreground">Feed latency</div>
              </div>
            </div>
            <Badge variant="outline" className="gap-1 text-xs font-normal">
              <ShieldCheck className="h-3 w-3 text-status-good" /> Zero-hallucination
            </Badge>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setPaletteOpen(true)}>
              <CommandIcon className="h-3.5 w-3.5" />
              Browse questions
              <kbd className="ml-1 hidden rounded border border-border/70 bg-surface-sunken px-1.5 text-[10px] md:inline">
                ⌘K
              </kbd>
            </Button>
            {turns.length > 0 && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={reset}>
                <RotateCcw className="h-3.5 w-3.5" />
                New
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Transcript */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
        <div className="mx-auto w-full max-w-5xl space-y-5">
          {turns.length === 0 && !pending && (
            <div className="animate-fade-up space-y-4">
              <div className="rounded-xl border border-border/70 bg-gradient-surface p-5">
                <h2 className="font-display text-base font-semibold">
                  Ask about anything across the six modules
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Descriptive, diagnostic, predictive or prescriptive — the planner maps your
                  question onto the retail ontology, the engine computes every number in code, and a
                  guardrail rejects any figure the model tried to write itself.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    style={{ animationDelay: `${i * 35}ms` }}
                    className="group animate-fade-up rounded-lg border border-border/70 bg-surface-raised p-3 text-left text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow"
                  >
                    <span className="flex items-start gap-2">
                      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      {s}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((turn) => {
            if (turn.role === 'user') {
              return (
                <div key={turn.id} className="flex animate-fade-up justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-elegant">
                    {turn.text}
                  </div>
                </div>
              );
            }
            if (turn.role === 'error') {
              return (
                <Card key={turn.id} className="flex animate-fade-up items-start gap-2 border-status-bad/40 p-4 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-bad" />
                  <span>{turn.text}</span>
                </Card>
              );
            }
            return <AnswerBlock key={turn.id} answer={turn.answer} />;
          })}

          {pending && <GroundingCard question={pending} />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border/70 bg-card/80 px-4 py-3 backdrop-blur-md md:px-6">
        <div className="mx-auto w-full max-w-5xl space-y-2">
          {recent.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recent.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => ask(t.text)}
                  className="max-w-full truncate rounded-full border border-border/70 bg-surface-raised px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  {t.text.length > 52 ? `${t.text.slice(0, 51)}…` : t.text}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 rounded-xl border border-border/70 bg-surface-sunken p-2 transition-colors focus-within:border-primary/50">
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
              rows={1}
              placeholder="Ask anything — e.g. which stores are losing margin on fresh, and is availability the cause?"
              className="max-h-40 min-h-[40px] resize-none border-0 bg-transparent p-2 text-sm shadow-none focus-visible:ring-0"
            />
            {loading ? (
              <Button variant="secondary" size="icon" onClick={stop} aria-label="Stop">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={() => ask(question)}
                disabled={!question.trim()}
                aria-label="Ask Maya"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Enter to send · Shift+Enter for a new line · ⌘K to browse governed questions
          </p>
        </div>
      </div>

      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Search governed questions…" />
        <CommandList>
          <CommandEmpty>No matching question — type your own in the composer.</CommandEmpty>
          <CommandGroup heading="Cross-module questions">
            {SUGGESTIONS.map((s) => (
              <CommandItem
                key={s}
                value={s}
                onSelect={() => {
                  setPaletteOpen(false);
                  ask(s);
                }}
              >
                <ArrowRight className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                {s}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

