import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { IngestionView } from '@/components/graph/IngestionView';
import { MessyDataLab } from '@/components/graph/MessyDataLab';
import { ReliabilityForecastView } from '@/components/graph/ReliabilityForecastView';

import { ArrowRight, Database, Loader2, Network, Table2 } from 'lucide-react';

type Catalog = {
  entities: { id: string; label: string; keyField: string; modules: string[]; datasets: string[] }[];
  edges: { from: string; to: string; via: string; label: string; question: string }[];
  datasets: {
    id: string;
    module: string;
    grain: string;
    description: string;
    table: string;
    timeFiltered: boolean;
    entities: string[];
    metrics: { key: string; label: string; format: string; agg: string; definition: string }[];
    dimensions: { key: string; label: string }[];
    filters: { key: string; label: string; pushedDown: boolean }[];
  }[];
};

/** Radial layout so the graph reads as a map rather than a list. */
function useLayout(entities: Catalog['entities']) {
  return useMemo(() => {
    const cx = 50;
    const cy = 50;
    const r = 36;
    return new Map(
      entities.map((e, i) => {
        const angle = (i / Math.max(entities.length, 1)) * Math.PI * 2 - Math.PI / 2;
        return [e.id, { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }];
      }),
    );
  }, [entities]);
}

export default function OntologyGraph() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<'graph' | 'ingestion' | 'forecast' | 'messy'>('graph');

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error: err } = await supabase.functions.invoke('ask-anything', { method: 'GET' });
      if (!active) return;
      if (err) {
        setError(err.message);
        return;
      }
      setCatalog(data as Catalog);
    })();
    return () => {
      active = false;
    };
  }, []);

  const entities = catalog?.entities ?? [];
  const positions = useLayout(entities);

  const activeEntity = selected ? entities.find((e) => e.id === selected) ?? null : null;
  const relatedEdges = (catalog?.edges ?? []).filter(
    (e) => !selected || e.from === selected || e.to === selected,
  );
  const relatedDatasets = (catalog?.datasets ?? []).filter(
    (d) => !selected || d.entities.includes(selected),
  );

  const totalMetrics = (catalog?.datasets ?? []).reduce((sum, d) => sum + d.metrics.length, 0);

  return (
    <>
      <div className="space-y-6 p-4 md:p-6">
        <header className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Retail knowledge graph</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            The semantic layer every answer is grounded in — entities, typed relationships, governed
            datasets and the physical tables behind them.
          </p>
        </header>
        <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Network className="h-4 w-4 text-primary" />
            Ontology at a glance
          </div>
          <span className="metric-value">{entities.length} entities</span>
          <span className="metric-value">{catalog?.edges.length ?? 0} typed relationships</span>
          <span className="metric-value">{catalog?.datasets.length ?? 0} governed datasets</span>
          <span className="metric-value">{totalMetrics} certified metrics</span>
          <span className="basis-full">
            Nothing outside this graph is queryable. The planner may only select from these names; every
            number is computed in code from the tables shown here.
          </span>
        </Card>

        <div className="inline-flex flex-wrap rounded-lg border border-border/70 bg-card p-1 text-xs">
          {([
            { id: 'graph', label: 'Entity map & datasets' },
            { id: 'ingestion', label: 'Data ingestion & quality' },
            { id: 'forecast', label: 'Predictive reliability' },
            { id: 'messy', label: 'Messy-data lab' },
          ] as const).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setView(t.id)}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                view === t.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>



        {error && (
          <Card className="p-4 text-sm text-status-critical">Could not load the ontology: {error}</Card>
        )}

        {!catalog && !error && (
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Skeleton className="h-[420px] w-full rounded-xl" />
            <Skeleton className="h-[420px] w-full rounded-xl" />
          </div>
        )}

        {catalog && view === 'graph' && (
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold">Entity map</div>
                {selected ? (
                  <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                    Clear selection
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">Click an entity to trace it</span>
                )}
              </div>

              <svg viewBox="0 0 100 100" className="aspect-square w-full">
                {(catalog.edges ?? []).map((edge, i) => {
                  const a = positions.get(edge.from);
                  const b = positions.get(edge.to);
                  if (!a || !b) return null;
                  const dim = selected && edge.from !== selected && edge.to !== selected;
                  return (
                    <line
                      key={i}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="currentColor"
                      className={dim ? 'text-border' : 'text-primary'}
                      strokeWidth={dim ? 0.25 : 0.55}
                      strokeOpacity={dim ? 0.5 : 0.75}
                    />
                  );
                })}
                {entities.map((entity) => {
                  const p = positions.get(entity.id)!;
                  const active = selected === entity.id;
                  return (
                    <g
                      key={entity.id}
                      onClick={() => setSelected(active ? null : entity.id)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={active ? 4.4 : 3.4}
                        className={active ? 'fill-primary' : 'fill-card stroke-primary'}
                        strokeWidth={0.5}
                      />
                      <text
                        x={p.x}
                        y={p.y - 5.6}
                        textAnchor="middle"
                        className="fill-foreground"
                        style={{ fontSize: 3.1, fontWeight: active ? 700 : 500 }}
                      >
                        {entity.label}
                      </text>
                      <text
                        x={p.x}
                        y={p.y + 7.2}
                        textAnchor="middle"
                        className="fill-muted-foreground"
                        style={{ fontSize: 2.4 }}
                      >
                        {entity.keyField}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="flex flex-wrap gap-2">
                {entities.map((entity) => (
                  <button
                    key={entity.id}
                    type="button"
                    onClick={() => setSelected(selected === entity.id ? null : entity.id)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      selected === entity.id
                        ? 'border-primary/50 bg-primary/10 font-medium text-primary'
                        : 'border-border/70 bg-surface-raised text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {entity.label}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="space-y-4 p-4">
              <div className="space-y-1">
                <div className="text-sm font-semibold">
                  {activeEntity ? activeEntity.label : 'All relationships'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeEntity
                    ? `Joins on ${activeEntity.keyField} · modules: ${activeEntity.modules.join(', ')}`
                    : 'Every typed edge in the graph. Select an entity to narrow it.'}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                {relatedEdges.map((edge, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => navigate(`/ask?q=${encodeURIComponent(edge.question)}`)}
                    disabled={!edge.question}
                    className="group flex w-full flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-surface-raised px-3 py-2 text-left text-xs transition-all hover:border-primary/50 hover:shadow-sm disabled:cursor-default disabled:opacity-70"
                  >
                    <span className="font-medium">{edge.from}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{edge.label}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{edge.to}</span>
                    <Badge variant="outline" className="metric-value ml-auto font-normal">
                      {edge.via}
                    </Badge>
                    {edge.question && (
                      <span className="basis-full pt-1 text-muted-foreground group-hover:text-primary">
                        Ask Maya → {edge.question}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {catalog && view === 'graph' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Database className="h-4 w-4 text-primary" />
              Governed datasets{activeEntity ? ` touching ${activeEntity.label}` : ''}
              <span className="metric-value text-xs font-normal text-muted-foreground">
                {relatedDatasets.length} of {catalog.datasets.length}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {relatedDatasets.map((ds) => (
                <Card key={ds.id} className="flex flex-col gap-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="metric-value text-sm font-semibold">{ds.id}</span>
                    <Badge variant="secondary" className="font-normal">
                      {ds.module}
                    </Badge>
                    {ds.timeFiltered ? (
                      <Badge variant="outline" className="font-normal">
                        time-filtered
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-normal">
                        snapshot
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">{ds.description}</p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Table2 className="h-3.5 w-3.5" />
                    <span className="metric-value">{ds.table}</span>
                    <span>· {ds.grain}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {ds.entities.map((e) => (
                      <span
                        key={e}
                        className="rounded-full border border-border/70 px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {e}
                      </span>
                    ))}
                  </div>

                  <Separator />

                  <div className="mt-auto space-y-2 text-xs">
                    <div>
                      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Metrics ({ds.metrics.length})
                      </span>
                      <div className="mt-1 space-y-1">
                        {ds.metrics.slice(0, 4).map((m) => (
                          <div key={m.key} className="flex items-start gap-2">
                            <span className="metric-value shrink-0 font-medium">{m.key}</span>
                            <span className="text-muted-foreground">{m.definition}</span>
                          </div>
                        ))}
                        {ds.metrics.length > 4 && (
                          <div className="text-muted-foreground">
                            +{ds.metrics.length - 4} more certified metrics
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-muted-foreground">
                      <span className="text-[11px] uppercase tracking-wide">Dimensions</span>{' '}
                      <span className="metric-value">{ds.dimensions.map((d) => d.key).join(', ')}</span>
                    </div>
                    <div className="text-muted-foreground">
                      <span className="text-[11px] uppercase tracking-wide">Filters</span>{' '}
                      <span className="metric-value">{ds.filters.map((f) => f.key).join(', ')}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {catalog && view === 'ingestion' && <IngestionView datasets={catalog.datasets} />}

        {view === 'forecast' && <ReliabilityForecastView />}
        {view === 'messy' && <MessyDataLab />}


        {!catalog && !error && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading the semantic layer…
          </div>
        )}
      </div>
    </>
  );
}
