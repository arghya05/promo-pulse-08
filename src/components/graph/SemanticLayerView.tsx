import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  CERT_STATE_STYLES,
  METRIC_DEFINITIONS,
  PIPELINE_COSTS,
  semanticSummary,
} from '@/lib/semantic-cost';
import { LAYER_STYLES } from '@/lib/lineage-layers';
import { BadgeCheck, Coins, GitCompare, Gauge } from 'lucide-react';

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="metric-value mt-1 text-xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{hint}</div>
    </Card>
  );
}

const usd = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(2)}`;

export default function SemanticLayerView() {
  const s = useMemo(() => semanticSummary(), []);
  const [openMetric, setOpenMetric] = useState(METRIC_DEFINITIONS[0].id);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Answerable metrics"
          value={`${s.answerable}/${s.total}`}
          hint={`${s.provisional} provisional, ${s.draft} draft — outside the allow-list until certified`}
        />
        <Kpi
          label="Certified query share"
          value={`${s.certifiedQueryPct.toFixed(1)}%`}
          hint={`${s.queries.toLocaleString()} metric queries in 30 days, all compiled from one definition`}
        />
        <Kpi
          label="Definition versions"
          value={`${s.versionsRestated}/${s.versionsTotal} restated`}
          hint="A definition change either restates history or is published as a new version — never both silently"
        />
        <Kpi
          label="Compute cost"
          value={usd(s.monthlyCost)}
          hint={`${s.scannedTbPerDay.toFixed(1)} TB/day scanned · ${s.savingsPct.toFixed(1)}% avoided vs full rebuild · ${usd(s.costPerThousandAnswers)} per 1K answers`}
        />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BadgeCheck className="h-4 w-4 text-primary" /> Certified metric definitions
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          One expression, one grain, one owner per metric. Ask Maya may only cite a certified version, which is why
          two questions about the same measure can never disagree.
        </p>
        <div className="mt-3 space-y-2">
          {METRIC_DEFINITIONS.map((m) => {
            const tone = CERT_STATE_STYLES[m.state];
            const isOpen = openMetric === m.id;
            return (
              <div key={m.id} className="rounded-lg border border-border/70 bg-card">
                <button
                  type="button"
                  onClick={() => setOpenMetric(isOpen ? '' : m.id)}
                  className="flex w-full flex-wrap items-start justify-between gap-2 p-3 text-left"
                  aria-expanded={isOpen}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-snug">
                      {m.name} <span className="metric-value text-muted-foreground">{m.version}</span>
                    </div>
                    <div className="metric-value mt-0.5 text-[11px] text-muted-foreground">
                      {m.grain} · {m.sourceObject} · {m.queries30d.toLocaleString()} queries / 30d
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">{m.unit}</Badge>
                    <Badge variant="secondary" className={`text-[10px] ${tone.badge}`}>{tone.label}</Badge>
                  </div>
                </button>
                {isOpen && (
                  <div className="space-y-3 border-t border-border/70 p-3 text-xs">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Definition
                      </div>
                      <code className="metric-value mt-1 block rounded-md bg-muted/60 p-2 text-[11px] leading-relaxed">
                        {m.expression}
                      </code>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground">Owner: </span>{m.owner}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Certified: </span>
                        {m.certifiedAt ?? 'not certified'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Queryable dimensions
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {m.dimensions.map((d) => (
                          <Badge key={d} variant="secondary" className="metric-value text-[10px]">{d}</Badge>
                        ))}
                      </div>
                    </div>
                    {m.history.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          <GitCompare className="h-3 w-3" /> Version history
                        </div>
                        <ul className="mt-1 space-y-1">
                          {m.history.map((h) => (
                            <li key={h.version} className="flex flex-wrap items-center gap-1.5">
                              <span className="metric-value">{h.version}</span>
                              <span className="text-muted-foreground">{h.changedAt}</span>
                              <span>{h.change}</span>
                              <Badge variant="secondary" className="text-[10px]">
                                {h.restated ? 'history restated' : 'forward-only'}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="rounded-md border border-primary/25 bg-primary/5 p-2">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                        Answer guardrail
                      </div>
                      <p className="mt-1">{m.guardrail}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Coins className="h-4 w-4 text-primary" /> Compute economics per pipeline
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Incremental loads, partition pruning and clustering keep the estate at {usd(s.dailyCost)}/day instead of{' '}
          {usd(s.naiveMonthlyCost / 30)}/day for naive full rebuilds.
        </p>
        <ul className="mt-3 space-y-2">
          {PIPELINE_COSTS.map((p) => {
            const layerTone = (LAYER_STYLES as Record<string, { badge?: string }>)[p.layer]?.badge ?? '';
            const dailyCost = p.costPerRunUsd * p.runsPerDay;
            return (
              <li key={p.id} className="rounded-lg border border-border/70 bg-card p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="metric-value text-sm font-medium leading-snug">{p.pipeline}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      Partitioned by {p.partitioning} · clustered on {p.clustering}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className={`text-[10px] ${layerTone}`}>{p.layer}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{p.strategy}</Badge>
                  </div>
                </div>
                <Progress value={p.prunedPct} className="mt-2 h-1.5" />
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Gauge className="h-3 w-3" />
                  {p.prunedPct.toFixed(1)}% of bytes pruned · {p.bytesScannedGb.toLocaleString()} GB scanned vs{' '}
                  {p.fullScanGb.toLocaleString()} GB full · {p.runsPerDay}×/day · {usd(dailyCost)}/day
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
