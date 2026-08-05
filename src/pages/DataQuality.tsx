import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Filter,
  Layers,
  Network,
  Search,
  ShieldCheck,
  Table2,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartCapture } from '@/components/charts/ChartCapture';
import { QualityScorecard } from '@/components/graph/QualityScorecard';
import {
  DQ_RULE_RUNS,
  DQ_STATUS_STYLES,
  formatRows,
  layerScorecard,
  type DQRuleRun,
  type DQStatus,
} from '@/lib/dq-scorecard';
import {
  buildGateCsv,
  buildMarkdownReport,
  dimensionScores,
  downloadFile,
  dqSummary,
  feedHealth,
} from '@/lib/dq-report';

const StatusBadge = ({ status }: { status: DQStatus }) => (
  <Badge variant="outline" className={`${DQ_STATUS_STYLES[status].badge} border-0 text-[10px] font-semibold`}>
    {DQ_STATUS_STYLES[status].label}
  </Badge>
);

function RadialGauge({ value, label }: { value: number; label: string }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-semibold text-foreground">{value.toFixed(1)}%</span>
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

const DIMENSIONS: DQRuleRun['dimension'][] = [
  'Completeness',
  'Uniqueness',
  'Validity',
  'Consistency',
  'Timeliness',
  'Accuracy',
  'Governance',
];

export default function DataQuality({ embedded = false }: { embedded?: boolean } = {}) {
  const summary = useMemo(() => dqSummary(), []);
  const layers = useMemo(() => layerScorecard(), []);
  const dims = useMemo(() => dimensionScores(), []);
  const feeds = useMemo(() => feedHealth(), []);
  const [layerFilter, setLayerFilter] = useState<string>('all');
  const [dimensionFilter, setDimensionFilter] = useState<DQRuleRun['dimension'] | 'all'>('all');
  const [search, setSearch] = useState('');

  const filteredGates = useMemo(() => {
    const base = layerFilter === 'all' ? DQ_RULE_RUNS : DQ_RULE_RUNS.filter((r) => r.layer === layerFilter);
    return base.filter((r) => {
      const matchesDimension = dimensionFilter === 'all' || r.dimension === dimensionFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.rule.toLowerCase().includes(q) ||
        r.object.toLowerCase().includes(q) ||
        r.expression.toLowerCase().includes(q) ||
        r.dimension.toLowerCase().includes(q);
      return matchesDimension && matchesSearch;
    });
  }, [layerFilter, dimensionFilter, search]);

  const stamp = new Date().toISOString().slice(0, 10);

  const dimChart = dims.map((d) => ({
    name: d.dimension,
    score: Number(d.scorePct.toFixed(1)),
    rowsFailed: d.rowsFailed,
  }));

  const statusPie = [
    { name: 'Pass', value: summary.passed, fill: 'hsl(var(--status-good))' },
    { name: 'Warn', value: summary.warned, fill: 'hsl(var(--status-warning))' },
    { name: 'Fail', value: summary.failed, fill: 'hsl(var(--destructive))' },
  ].filter((s) => s.value > 0);

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className={`flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between${embedded ? ' hidden' : ''}`}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight">Data Quality</h1>
              <p className="text-xs text-muted-foreground">
                Everline merchandising lakehouse · gate runs behind every number Maya cites
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" /> Last gate run 2026-08-04 14:41 UTC
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground">
            <Network className="h-3 w-3" /> {feeds.length} feeds
          </span>
          <Link
            to="/data?tab=graph"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground hover:text-primary"
          >
            <Layers className="h-3 w-3" /> Ingestion lineage
          </Link>
        </div>
      </div>

      {/* Score strip */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-[auto_1fr_auto]">
            <div className="flex items-center gap-5 border-b border-border p-5 lg:border-b-0 lg:border-r">
              <RadialGauge value={summary.trustScore} label="Trust score" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Trust score</p>
                <p className="text-xs text-muted-foreground">
                  70% gate pass rate + 30% clean-row rate
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.passed} pass · {summary.warned} warn · {summary.failed} fail
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4 lg:grid-cols-3">
              {[
                {
                  label: 'Gates on last run',
                  value: `${summary.passed}/${summary.gates}`,
                  note: `${summary.warned} warn · ${summary.failed} fail`,
                  icon: CheckCircle2,
                  tone: summary.failed ? 'text-destructive' : 'text-status-good',
                },
                {
                  label: 'Rows evaluated',
                  value: formatRows(summary.rowsEvaluated),
                  note: `${formatRows(summary.rowsFailed)} failed (${(100 - summary.cleanRowPct).toFixed(2)}%)`,
                  icon: Table2,
                  tone: 'text-primary',
                },
                {
                  label: 'Open incidents',
                  value: String(summary.openIncidents.length),
                  note: summary.openIncidents.length ? 'Quarantined or flagged' : 'All clear',
                  icon: AlertTriangle,
                  tone: summary.openIncidents.length ? 'text-status-warning' : 'text-status-good',
                },
              ].map((k) => {
                const Icon = k.icon;
                return (
                  <div
                    key={k.label}
                    className="flex flex-col justify-center gap-1 bg-card p-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {k.label}
                      <Icon className={`h-3.5 w-3.5 ${k.tone}`} />
                    </div>
                    <span className={`font-mono text-xl font-semibold ${k.tone}`}>{k.value}</span>
                    <span className="text-[11px] text-muted-foreground">{k.note}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col justify-center gap-2 border-t border-border p-5 lg:border-t-0 lg:border-l">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile(`everline-dq-gates-${stamp}.csv`, buildGateCsv(), 'text/csv')}
              >
                <Download className="mr-2 h-3.5 w-3.5" /> Gate register (CSV)
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  downloadFile(`everline-dq-report-${stamp}.md`, buildMarkdownReport(), 'text/markdown')
                }
              >
                <FileText className="mr-2 h-3.5 w-3.5" /> Download full report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="layers">Layer scorecard</TabsTrigger>
          <TabsTrigger value="feeds">Source feeds</TabsTrigger>
          <TabsTrigger value="gates">Gate register</TabsTrigger>
          <TabsTrigger value="incidents">
            Incidents
            {summary.openIncidents.length > 0 && (
              <span className="ml-1.5 rounded-full bg-status-warning/15 px-1.5 text-[10px] font-semibold text-status-warning">
                {summary.openIncidents.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* -------------------------------------------------- Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pass rate by quality dimension</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartCapture label="DQ pass rate by dimension">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dimChart} layout="vertical" margin={{ left: 24, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          unit="%"
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={92}
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <ReTooltip
                          contentStyle={{
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          formatter={(v: number) => [`${v}%`, 'Gate pass rate']}
                        />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={16}>
                          {dimChart.map((d) => (
                            <Cell
                              key={d.name}
                              fill={
                                d.score === 100
                                  ? 'hsl(var(--status-good))'
                                  : d.score >= 60
                                    ? 'hsl(var(--status-warning))'
                                    : 'hsl(var(--destructive))'
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCapture>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Gate status mix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPie}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={2}
                      >
                        {statusPie.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ReTooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex justify-center gap-4 text-[11px]">
                  {statusPie.map((s) => (
                    <div key={s.name} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.fill }} />
                      <span className="text-muted-foreground">
                        {s.name} · <span className="metric-value font-medium text-foreground">{s.value}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4 text-primary" /> Rows checked vs rows failed, by layer
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {layers.map((l) => {
                const passRate = l.gates ? (l.passed / l.gates) * 100 : 0;
                return (
                  <div
                    key={l.layer}
                    className="group rounded-lg border border-border p-3 transition-colors hover:border-primary/30 hover:bg-muted/20"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold">{l.layer}</span>
                      <StatusBadge status={l.status} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <p className="font-mono text-lg font-semibold">{formatRows(l.rowsEvaluated)}</p>
                      <span className="text-[10px] text-muted-foreground">rows</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full ${l.failed ? 'bg-destructive' : l.warned ? 'bg-status-warning' : 'bg-status-good'}`}
                        style={{ width: `${Math.max(l.failRatePct, l.rowsFailed ? 1.5 : 0)}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      {formatRows(l.rowsFailed)} failed · {l.failRatePct.toFixed(2)}%
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                      <span className="text-status-good">{l.passed} pass</span>
                      {l.warned > 0 && <span className="text-status-warning">{l.warned} warn</span>}
                      {l.failed > 0 && <span className="text-destructive">{l.failed} fail</span>}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Dimension detail</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {dims.map((d) => (
                <div
                  key={d.dimension}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 transition-colors hover:border-primary/30"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{d.dimension}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {d.gates} gates · {formatRows(d.rowsEvaluated)} rows
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-semibold">{d.scorePct.toFixed(0)}%</p>
                    <p className="text-[10px] text-muted-foreground">{formatRows(d.rowsFailed)} failed</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------------------------------------------------- Layers */}
        <TabsContent value="layers">
          <QualityScorecard />
        </TabsContent>

        {/* -------------------------------------------------- Feeds */}
        <TabsContent value="feeds">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Feed-level health on the latest cycle</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {feeds.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-col gap-2 rounded-lg border border-border p-3 transition-colors hover:border-primary/30 hover:bg-muted/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-snug">{f.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {f.system} · {f.cadence}
                      </p>
                    </div>
                    <StatusBadge status={f.status} />
                  </div>
                  <p className="text-[11px] leading-snug text-foreground/80">{f.note}</p>
                  <div className="mt-auto flex items-center justify-between border-t border-border/70 pt-2 text-[10px] text-muted-foreground">
                    <span className="metric-value">{f.volume}</span>
                    <span>Owner: {f.owner}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------------------------------------------------- Gate register */}
        <TabsContent value="gates" className="space-y-3">
          <Card>
            <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-sm">
                Gate register · <span className="metric-value font-normal">{filteredGates.length}</span> of{' '}
                {DQ_RULE_RUNS.length} gates
              </CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search gates, objects, rules…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <Filter className="h-3 w-3" /> Layer
                </span>
                {['all', 'Source', 'Bronze', 'Silver', 'Gold', 'Semantic'].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLayerFilter(l)}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                      layerFilter === l
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {l === 'all' ? 'All layers' : l}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <ShieldCheck className="h-3 w-3" /> Dimension
                </span>
                {(['all', ...DIMENSIONS] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDimensionFilter(d)}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                      dimensionFilter === d
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {d === 'all' ? 'All dimensions' : d}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                    <th className="py-2.5 pl-4 pr-3">Layer</th>
                    <th className="py-2.5 pr-3">Gate</th>
                    <th className="py-2.5 pr-3">Dimension</th>
                    <th className="py-2.5 pr-3">Rule evaluated</th>
                    <th className="py-2.5 pr-3 text-right">Rows</th>
                    <th className="py-2.5 pr-3 text-right">Failed</th>
                    <th className="py-2.5 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGates.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={`border-b border-border/60 align-top transition-colors hover:bg-muted/30 ${
                        idx % 2 === 1 ? 'bg-muted/20' : 'bg-card'
                      }`}
                    >
                      <td className="py-3 pl-4 pr-3 text-[11px] text-muted-foreground">{r.layer}</td>
                      <td className="py-3 pr-3">
                        <p className="font-medium">{r.rule}</p>
                        <p className="text-[10px] text-muted-foreground">{r.object}</p>
                      </td>
                      <td className="py-3 pr-3 text-[11px] text-muted-foreground">{r.dimension}</td>
                      <td className="py-3 pr-3">
                        <code className="block max-w-[320px] whitespace-pre-wrap break-words rounded bg-muted px-1.5 py-1 font-mono text-[10px]">
                          {r.expression}
                        </code>
                        <p className="mt-1 text-[10px] text-muted-foreground">Threshold: {r.threshold}</p>
                      </td>
                      <td className="py-3 pr-3 text-right font-mono">{formatRows(r.rowsEvaluated)}</td>
                      <td className="py-3 pr-3 text-right font-mono">{formatRows(r.rowsFailed)}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                  {filteredGates.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                        No gates match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------------------------------------------------- Incidents */}
        <TabsContent value="incidents" className="space-y-3">
          {summary.openIncidents.length === 0 && (
            <Card>
              <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-status-good" />
                Every gate passed on its latest run.
              </CardContent>
            </Card>
          )}
          <div className="relative space-y-4 pl-4">
            <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
            {summary.openIncidents.map((i) => (
              <Card
                key={i.id}
                className={`relative ml-4 border-l-4 ${
                  i.status === 'fail' ? 'border-l-destructive' : 'border-l-status-warning'
                }`}
              >
                <span
                  className={`absolute -left-[21px] top-5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-card ${
                    i.status === 'fail' ? 'bg-destructive' : 'bg-status-warning'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-card" />
                </span>
                <CardContent className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={i.status} />
                    <span className="text-sm font-semibold">{i.rule}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {i.layer} · {i.dimension}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Object <code className="font-mono">{i.object}</code> · last run {i.lastRun}
                  </p>
                  <code className="block whitespace-pre-wrap break-words rounded bg-muted px-2 py-1.5 font-mono text-[10px]">
                    {i.expression}
                  </code>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-border p-2">
                      <p className="text-[10px] text-muted-foreground">Rows affected</p>
                      <p className="font-mono text-sm font-semibold">
                        {i.rowsFailed.toLocaleString('en-US')}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-2">
                      <p className="text-[10px] text-muted-foreground">Of rows evaluated</p>
                      <p className="font-mono text-sm font-semibold">
                        {i.rowsEvaluated.toLocaleString('en-US')}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-2">
                      <p className="text-[10px] text-muted-foreground">Threshold</p>
                      <p className="text-xs font-medium">{i.threshold}</p>
                    </div>
                  </div>
                  <p className="text-xs leading-snug">
                    <span className="font-semibold">Action taken: </span>
                    {i.action}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
