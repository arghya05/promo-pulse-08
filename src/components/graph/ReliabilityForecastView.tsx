import { useMemo, useState } from 'react';
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Brain, CircleAlert, GitBranch, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import {
  BAND_STYLES,
  answerRisk,
  estateSummary,
  forecastEstate,
  type FeedForecast,
} from '@/lib/reliability-forecast';

function TrendIcon({ trend }: { trend: FeedForecast['trend'] }) {
  if (trend === 'degrading') return <TrendingUp className="h-3.5 w-3.5 text-status-warning" />;
  if (trend === 'improving') return <TrendingDown className="h-3.5 w-3.5 text-status-good" />;
  return <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />;
}

function ForecastChart({ forecast }: { forecast: FeedForecast }) {
  const stroke = BAND_STYLES[forecast.band].stroke;
  const data = forecast.history.map((p) => ({
    day: p.day.slice(5),
    observed: p.projected ? null : p.failRate,
    projected: p.projected ? p.failRate : null,
  }));
  // Bridge the seam so the projected area starts where the observed one ends.
  const seam = data.findIndex((d) => d.projected !== null);
  if (seam > 0) data[seam - 1].projected = data[seam - 1].observed;

  return (
    <div className="h-28 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`rf-${forecast.feed.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.32} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" tick={{ fontSize: 9 }} interval={4} stroke="hsl(var(--muted-foreground))" />
          <YAxis width={28} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" unit="%" />
          <Tooltip
            contentStyle={{
              fontSize: 11,
              borderRadius: 8,
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
            }}
            formatter={(v: number) => [`${v}%`, 'gate fail rate']}
          />
          <ReferenceLine
            y={forecast.tolerance}
            stroke="hsl(var(--destructive))"
            strokeDasharray="3 3"
            strokeOpacity={0.7}
            label={{ value: 'tolerance', fontSize: 9, fill: 'hsl(var(--muted-foreground))', position: 'right' }}
          />
          <Area
            type="monotone"
            dataKey="observed"
            stroke={stroke}
            strokeWidth={2}
            fill={`url(#rf-${forecast.feed.id})`}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="projected"
            stroke={stroke}
            strokeWidth={2}
            strokeDasharray="4 3"
            fill="none"
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReliabilityForecastView() {
  const forecasts = useMemo(() => forecastEstate(), []);
  const risks = useMemo(() => answerRisk(forecasts), [forecasts]);
  const summary = useMemo(() => estateSummary(forecasts, risks), [forecasts, risks]);
  const [selected, setSelected] = useState<string>(forecasts[0]?.feed.id ?? '');
  const active = forecasts.find((f) => f.feed.id === selected) ?? forecasts[0];

  return (
    <div className="space-y-4">
      <Card className="grid gap-4 p-4 md:grid-cols-[1.1fr_2fr]">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Brain className="h-4 w-4 text-primary" />
            Predictive reliability
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Gate history per feed is extrapolated in code (EWMA + trend) against each feed's tolerance, then
            propagated through the graph — feed → bronze → silver → gold table → certified metric — so the
            answers about to lose ground are known <em>before</em> the gate trips.
          </p>
          <div className="flex items-baseline gap-2">
            <span className="metric-value text-3xl font-semibold">{summary.reliability}</span>
            <span className="text-xs text-muted-foreground">estate reliability (0-100)</span>
          </div>
          <Progress value={summary.reliability} className="h-1.5" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Feeds forecast', value: `${summary.feeds}`, hint: '14d history · 7d horizon' },
            {
              label: 'Predicted breaches',
              value: `${summary.atRisk + summary.breaching}`,
              hint:
                summary.earliestBreach === null
                  ? 'none inside horizon'
                  : summary.earliestBreach === 0
                    ? 'one breaching now'
                    : `earliest in ${summary.earliestBreach}d`,
            },

            { label: 'Gold tables exposed', value: `${summary.tablesExposed}`, hint: 'inherit the risk' },
            { label: 'Question themes', value: `${summary.themesExposed}`, hint: 'answers pre-degraded' },
          ].map((k) => (
            <div key={k.label} className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="metric-value text-xl font-semibold">{k.value}</div>
              <div className="text-[11px] font-medium">{k.label}</div>
              <div className="text-[10px] text-muted-foreground">{k.hint}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-3">
          {forecasts.map((f) => {
            const band = BAND_STYLES[f.band];
            const isActive = f.feed.id === active?.feed.id;
            return (
              <Card
                key={f.feed.id}
                onClick={() => setSelected(f.feed.id)}
                className={`cursor-pointer space-y-3 p-4 transition ${
                  isActive ? 'ring-1 ring-primary/40' : 'hover:border-primary/30'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${band.dot}`} />
                      <span className="truncate text-sm font-semibold">{f.feed.name}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {f.feed.system} · {f.feed.mode} · {f.gates.length} standing gates
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`${band.badge} text-[10px]`}>
                      {band.label}
                    </Badge>
                    <span className="metric-value text-sm font-semibold">{f.breachProbability}%</span>
                  </div>
                </div>

                <ForecastChart forecast={f} />

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] sm:grid-cols-4">
                  <div>
                    <div className="text-muted-foreground">Now</div>
                    <div className="metric-value font-semibold">{f.currentFailRate}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Forecast +7d</div>
                    <div className="metric-value font-semibold">{f.forecastFailRate}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Tolerance</div>
                    <div className="metric-value font-semibold">{f.tolerance}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Breach in</div>
                    <div className="metric-value flex items-center gap-1 font-semibold">
                      {f.daysToBreach === null ? '—' : f.daysToBreach === 0 ? 'live' : `${f.daysToBreach}d`}
                      <TrendIcon trend={f.trend} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          {active && (
            <Card className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CircleAlert className="h-4 w-4 text-status-warning" />
                Leading signal
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{active.leadingSignal}</p>

              <div className="space-y-1 rounded-lg border border-border/60 bg-muted/30 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Pre-emptive transformation
                </div>
                <p className="text-xs leading-relaxed">{active.preemptiveAction}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <GitBranch className="h-3.5 w-3.5" />
                  Graph blast radius
                </div>
                {active.impacted.map((a) => (
                  <div
                    key={a.table}
                    className="flex items-center justify-between rounded-md border border-border/50 px-2.5 py-1.5 text-[11px]"
                  >
                    <span className="metric-value">{a.table}</span>
                    <span className="text-muted-foreground">{a.hops} medallion hops</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 rounded-lg border border-primary/25 bg-primary/5 p-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  How answers behave
                </div>
                <p className="text-xs leading-relaxed">{active.answerBehaviour}</p>
              </div>
            </Card>
          )}

          <Card className="space-y-3 p-4">
            <div className="text-sm font-semibold">Answer-readiness by certified table</div>
            <div className="space-y-2">
              {risks.map((r) => {
                const band = BAND_STYLES[r.band];
                return (
                  <div key={r.table} className="space-y-1 rounded-lg border border-border/50 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="metric-value truncate text-xs font-semibold">{r.table}</span>
                      <Badge variant="secondary" className={`${band.badge} text-[10px]`}>
                        trust {r.trustScore}
                      </Badge>
                    </div>
                    <Progress value={r.trustScore} className="h-1" />
                    <div className="flex flex-wrap gap-1">
                      {r.questionThemes.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
