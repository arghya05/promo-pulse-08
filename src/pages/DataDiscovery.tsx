import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  Database,
  Gauge,
  Layers,
  Loader2,
  MessagesSquare,
  Ruler,
  Search,
  ShieldCheck,
  Table2,
  Users,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import {
  buildCatalog,
  metricIndex,
  GRADE_STYLES,
  type CatalogDataset,
  type CatalogEntry,
} from '@/lib/data-catalog';
import { DQ_STATUS_STYLES, formatRows } from '@/lib/dq-scorecard';
import { LAYER_STYLES, lineageForTable } from '@/lib/lineage-layers';

export default function DataDiscovery({ embedded = false }: { embedded?: boolean } = {}) {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<CatalogDataset[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [module, setModule] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error: err } = await supabase.functions.invoke('ask-anything', { method: 'GET' });
      if (!active) return;
      if (err) {
        setError(err.message);
        return;
      }
      setDatasets(((data as { datasets?: CatalogDataset[] })?.datasets ?? []) as CatalogDataset[]);
    })();
    return () => {
      active = false;
    };
  }, []);

  const catalog = useMemo(() => buildCatalog(datasets ?? []), [datasets]);
  const modules = useMemo(
    () => [...new Set(catalog.map((c) => c.dataset.module))].sort(),
    [catalog],
  );

  const q = query.trim().toLowerCase();
  const filtered = catalog.filter(
    (c) => (module === 'all' || c.dataset.module === module) && (!q || c.searchText.includes(q)),
  );
  const metrics = useMemo(
    () => metricIndex(catalog).filter((m) => {
      if (module !== 'all' && m.dataset.module !== module) return false;
      if (!q) return true;
      return `${m.metric.key} ${m.metric.label} ${m.metric.definition} ${m.dataset.table}`
        .toLowerCase()
        .includes(q);
    }),
    [catalog, module, q],
  );

  const totals = {
    datasets: catalog.length,
    metrics: catalog.reduce((n, c) => n + c.dataset.metrics.length, 0),
    dimensions: catalog.reduce((n, c) => n + c.dataset.dimensions.length, 0),
    certified: catalog.filter((c) => c.grade === 'Certified').length,
  };

  const open = openId ? catalog.find((c) => c.dataset.id === openId) ?? null : null;

  return (
    <div className={embedded ? 'w-full space-y-6' : 'mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8'}>
      <header className="space-y-3">
        <div className={`flex flex-wrap items-end justify-between gap-3${embedded ? ' hidden' : ''}`}>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Database className="h-3.5 w-3.5" /> Data discovery
            </div>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Governed data catalog
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Search every certified dataset, metric and dimension Maya is allowed to query — with its
              source feeds, steward, refresh cadence and live quality grade.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/data?tab=quality">
                <ShieldCheck className="mr-2 h-4 w-4" /> Data quality
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/data?tab=graph">
                <Layers className="mr-2 h-4 w-4" /> Lineage &amp; ingestion
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Governed datasets', value: totals.datasets, icon: Table2 },
            { label: 'Certified metrics', value: totals.metrics, icon: Gauge },
            { label: 'Dimensions', value: totals.dimensions, icon: Ruler },
            { label: 'Fully certified', value: `${totals.certified}/${totals.datasets}`, icon: ShieldCheck },
          ].map((k) => (
            <Card key={k.label} className="border-border/70">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10">
                  <k.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-lg font-semibold leading-none">{k.value}</div>
                  <div className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
                    {k.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search datasets, metrics, dimensions, source systems, stewards…"
            className="pl-9"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['all', ...modules].map((m) => (
            <button
              key={m}
              onClick={() => setModule(m)}
              className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                module === m
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {m === 'all' ? 'All modules' : m.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">
            Could not load the catalog: {error}
          </CardContent>
        </Card>
      )}

      {!datasets && !error && (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      )}

      {datasets && (
        <Tabs defaultValue="datasets">
          <TabsList>
            <TabsTrigger value="datasets">Datasets ({filtered.length})</TabsTrigger>
            <TabsTrigger value="metrics">Metrics ({metrics.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="datasets" className="mt-4">
            {filtered.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4" /> No dataset matches “{query}”.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filtered.map((entry) => (
                  <DatasetCard
                    key={entry.dataset.id}
                    entry={entry}
                    onOpen={() => setOpenId(entry.dataset.id)}
                    onAsk={() =>
                      navigate(
                        `/ask?q=${encodeURIComponent(
                          `Summarise ${entry.dataset.description.toLowerCase()} for the latest period`,
                        )}`,
                      )
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="mt-4">
            <Card className="border-border/70">
              <CardContent className="p-0">
                <div className="max-h-[560px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/60 backdrop-blur">
                      <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-2.5 font-semibold">Metric</th>
                        <th className="px-4 py-2.5 font-semibold">Definition</th>
                        <th className="px-4 py-2.5 font-semibold">Agg</th>
                        <th className="px-4 py-2.5 font-semibold">Dataset</th>
                        <th className="px-4 py-2.5 font-semibold">Quality</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((m, i) => (
                        <tr
                          key={`${m.dataset.id}-${m.metric.key}`}
                          className={i % 2 ? 'bg-muted/20' : undefined}
                        >
                          <td className="px-4 py-2.5">
                            <div className="font-medium">{m.metric.label}</div>
                            <div className="font-mono text-[11px] text-muted-foreground">{m.metric.key}</div>
                          </td>
                          <td className="max-w-[380px] px-4 py-2.5 text-xs text-muted-foreground">
                            {m.metric.definition}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="font-mono text-[11px] uppercase text-muted-foreground">
                              {m.metric.agg}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <button
                              onClick={() => setOpenId(m.dataset.id)}
                              className="font-mono text-[11px] text-primary hover:underline"
                            >
                              {m.dataset.table}
                            </button>
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge
                              variant="outline"
                              className={`${DQ_STATUS_STYLES[m.status].badge} border-0 text-[10px] font-semibold`}
                            >
                              {DQ_STATUS_STYLES[m.status].label}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {open && <DatasetDetail entry={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function DatasetCard({
  entry,
  onOpen,
  onAsk,
}: {
  entry: CatalogEntry;
  onOpen: () => void;
  onAsk: () => void;
}) {
  const { dataset } = entry;
  return (
    <Card className="group border-border/70 transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate font-display text-base">{dataset.id}</CardTitle>
            <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{dataset.table}</div>
          </div>
          <Badge variant="outline" className={`${GRADE_STYLES[entry.grade]} shrink-0 border-0 text-[10px] font-semibold`}>
            {entry.grade}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-2 text-xs text-muted-foreground">{dataset.description}</p>
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <Badge variant="secondary" className="capitalize">{dataset.module.replace(/-/g, ' ')}</Badge>
          <Badge variant="outline">{dataset.metrics.length} metrics</Badge>
          <Badge variant="outline">{dataset.dimensions.length} dimensions</Badge>
          <Badge variant="outline">{entry.hops} medallion hops</Badge>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> <span className="truncate">{entry.stewards[0]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> <span className="truncate">{entry.cadence}</span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="truncate">
              {entry.gates.length} gates · verified {entry.lastVerified}
            </span>
          </div>
        </dl>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={onOpen}>
            Details <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onAsk}>
            <MessagesSquare className="mr-1.5 h-3.5 w-3.5" /> Ask
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DatasetDetail({ entry, onClose }: { entry: CatalogEntry; onClose: () => void }) {
  const { dataset } = entry;
  const lineage = lineageForTable(dataset.table);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/20 backdrop-blur-sm">
      <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-background shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-background/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {dataset.module.replace(/-/g, ' ')} · {dataset.grain}
            </div>
            <h2 className="truncate font-display text-lg font-semibold">{dataset.id}</h2>
            <div className="font-mono text-[11px] text-muted-foreground">{dataset.table}</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${GRADE_STYLES[entry.grade]} border-0 text-[10px] font-semibold`}>
              {entry.grade}
            </Badge>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <p className="text-sm text-muted-foreground">{dataset.description}</p>

          <section className="grid grid-cols-2 gap-3 text-xs">
            <Field label="Steward" value={entry.stewards.join(', ')} />
            <Field label="Refresh" value={entry.cadence} />
            <Field label="Last verified" value={entry.lastVerified} />
            <Field label="Time filtered" value={dataset.timeFiltered ? 'Yes' : 'No'} />
          </section>

          <Section title="Source feeds">
            {entry.feeds.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Derived dataset — published from conformed silver models, no direct landing feed.
              </p>
            ) : (
              <ul className="space-y-2">
                {entry.feeds.map((f) => (
                  <li key={f.id} className="rounded-lg border border-border/70 p-3">
                    <div className="text-sm font-medium">{f.name}</div>
                    <div className="text-[11px] text-muted-foreground">{f.system} · {f.mode}</div>
                    <div className="mt-1 font-mono text-[11px] text-muted-foreground">{f.bronzeObject}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{f.volume} · {f.cadence}</div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Medallion lineage">
            <ol className="space-y-2">
              {lineage.layers.map((l, i) => (
                <li key={`${l.layer}-${i}`} className="flex gap-3">
                  <div className="mt-1 flex flex-col items-center">
                    <span className={`h-2 w-2 rounded-full ${LAYER_STYLES[l.layer].dot}`} />
                    {i < lineage.layers.length - 1 && <span className="mt-1 h-full w-px bg-border" />}
                  </div>
                  <div className="min-w-0 pb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${LAYER_STYLES[l.layer].badge} border-0 text-[10px] font-semibold`}>
                        {l.layer}
                      </Badge>
                      <span className="truncate font-mono text-[11px]">{l.object}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{l.transformation}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section title={`Quality gates (${entry.gates.length})`}>
            {entry.gates.length === 0 ? (
              <p className="text-xs text-muted-foreground">No gate is registered against this object yet.</p>
            ) : (
              <ul className="space-y-2">
                {entry.gates.map((g) => (
                  <li key={g.id} className="rounded-lg border border-border/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{g.rule}</span>
                      <Badge variant="outline" className={`${DQ_STATUS_STYLES[g.status].badge} border-0 text-[10px] font-semibold`}>
                        {DQ_STATUS_STYLES[g.status].label}
                      </Badge>
                    </div>
                    <code className="mt-1 block break-words rounded bg-muted px-2 py-1 text-[10px]">{g.expression}</code>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {formatRows(g.rowsFailed)} failed of {formatRows(g.rowsEvaluated)} · {g.action}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Metrics">
            <ul className="space-y-1.5">
              {dataset.metrics.map((m) => (
                <li key={m.key} className="rounded-md border border-border/60 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{m.label}</span>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">{m.agg} · {m.format}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{m.definition}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Dimensions & filters">
            <div className="flex flex-wrap gap-1.5">
              {dataset.dimensions.map((d) => (
                <Badge key={d.key} variant="secondary" className="text-[10px]">{d.label}</Badge>
              ))}
              {dataset.filters.map((f) => (
                <Badge key={f.key} variant="outline" className="text-[10px]">
                  {f.label}{f.pushedDown ? ' · pushed down' : ''}
                </Badge>
              ))}
            </div>
          </Section>

          <Section title="Linked entities">
            <div className="flex flex-wrap gap-1.5">
              {dataset.entities.map((e) => (
                <Badge key={e} variant="outline" className="text-[10px] capitalize">{e.replace(/_/g, ' ')}</Badge>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border/70 px-3 py-2">
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="truncate text-xs font-medium">{value}</div>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</h3>
    {children}
  </section>
);
