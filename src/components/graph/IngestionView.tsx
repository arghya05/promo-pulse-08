import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { LAYER_STYLES, lineageForTable } from '@/lib/lineage-layers';
import { FEEDS, INGESTION_STAGES, MESSY_DATA_PLAYBOOK } from '@/lib/ingestion-quality';
import { QualityScorecard } from '@/components/graph/QualityScorecard';
import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  Database,
  Layers,
  Radio,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { DQ_STATUS_STYLES, layerScorecard } from '@/lib/dq-scorecard';
import { feedHealth } from '@/lib/dq-report';

type Props = {
  /** Governed datasets from the ontology catalog, used for the per-dataset trace. */
  datasets: { id: string; module: string; table: string; grain: string }[];
};

const MODE_TONE: Record<string, string> = {
  Stream: 'bg-status-good/10 text-status-good',
  'Micro-batch': 'bg-chart-2/10 text-chart-2',
  Batch: 'bg-muted text-muted-foreground',
  'API pull': 'bg-chart-4/10 text-chart-4',
  EDI: 'bg-chart-3/10 text-chart-3',
};

function StatusBadge({ status }: { status: 'pass' | 'warn' | 'fail' }) {
  return (
    <Badge variant="outline" className={`${DQ_STATUS_STYLES[status].badge} border-0 text-[10px] font-semibold`}>
      {DQ_STATUS_STYLES[status].label}
    </Badge>
  );
}

export function IngestionView({ datasets }: Props) {
  const [tableChoice, setTableChoice] = useState<string | null>(null);
  const [messySearch, setMessySearch] = useState('');

  const tables = useMemo(() => {
    const seen = new Map<string, { table: string; modules: Set<string> }>();
    for (const d of datasets) {
      const entry = seen.get(d.table) ?? { table: d.table, modules: new Set<string>() };
      entry.modules.add(d.module);
      seen.set(d.table, entry);
    }
    return [...seen.values()].sort((a, b) => a.table.localeCompare(b.table));
  }, [datasets]);

  const activeTable = tableChoice ?? tables[0]?.table ?? 'kpi_measures';
  const lineage = lineageForTable(activeTable);

  const totalChecks = INGESTION_STAGES.reduce((n, s) => n + s.checks.length, 0);
  const layerCard = layerScorecard();
  const feedsHealth = feedHealth();

  const filteredMessy = useMemo(() => {
    const q = messySearch.trim().toLowerCase();
    if (!q) return MESSY_DATA_PLAYBOOK;
    return MESSY_DATA_PLAYBOOK.filter(
      (m) =>
        m.pattern.toLowerCase().includes(q) ||
        m.reality.toLowerCase().includes(q) ||
        m.handling.toLowerCase().includes(q) ||
        m.outcome.toLowerCase().includes(q),
    );
  }, [messySearch]);

  return (
    <div className="space-y-6">
      {/* Score strip */}
      <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Layers className="h-4 w-4 text-primary" />
          Ingestion estate
        </div>
        <span className="metric-value">{FEEDS.length} source feeds</span>
        <span className="metric-value">5 medallion layers</span>
        <span className="metric-value">{totalChecks} standing quality gates</span>
        <span className="metric-value">{MESSY_DATA_PLAYBOOK.length} messy-data patterns handled</span>
        <span className="basis-full">
          Nothing is queried until it has passed every gate below. When a gate fails the layer does not
          publish — the previous certified version stays live and the dataset is flagged stale, so an
          answer is never built on half-loaded data.
        </span>
      </Card>

      <QualityScorecard />

      {/* Pipeline stepper */}
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Database className="h-4 w-4 text-primary" />
          Medallion pipeline
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Raw → Bronze → Silver → Gold → Semantic. Each layer runs its own gates; a failed gate blocks
          downstream publication.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {INGESTION_STAGES.map((stage, i) => {
            const card = layerCard.find((l) => l.layer === stage.layer);
            return (
              <div
                key={stage.layer}
                className="relative rounded-lg border border-border p-3 transition-colors hover:border-primary/30 hover:bg-muted/20"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className={`text-[10px] ${LAYER_STYLES[stage.layer].badge}`}>
                    {stage.layer.toUpperCase()}
                  </Badge>
                  {card && <StatusBadge status={card.status} />}
                </div>
                <p className="mt-2 text-xs font-medium leading-snug">{stage.title}</p>
                <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2">{stage.intent}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <ShieldCheck className="h-3 w-3" />
                  {stage.checks.length} gates
                </div>
                {card && (
                  <div className="mt-2 flex gap-2 text-[10px]">
                    <span className="text-status-good">{card.passed} pass</span>
                    {card.warned > 0 && <span className="text-status-warning">{card.warned} warn</span>}
                    {card.failed > 0 && <span className="text-destructive">{card.failed} fail</span>}
                  </div>
                )}
                {i < INGESTION_STAGES.length - 1 && (
                  <div className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-muted-foreground lg:block">
                    <ArrowDown className="h-3.5 w-3.5 rotate-[-90deg]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Feeds landing into the lakehouse */}
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Radio className="h-4 w-4 text-primary" />
          Source feeds
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Every operational system that lands data, how it lands, and what it feeds in the certified layer.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {FEEDS.map((f) => {
            const health = feedsHealth.find((h) => h.id === f.id);
            return (
              <div
                key={f.id}
                className="flex h-full flex-col rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium leading-snug">{f.name}</span>
                  <Badge variant="secondary" className={`shrink-0 text-[10px] ${MODE_TONE[f.mode] ?? ''}`}>
                    {f.mode}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  {health && <StatusBadge status={health.status} />}
                  <span>{f.system}</span>
                </div>
                <Separator className="my-2" />
                <dl className="space-y-1 text-[11px] text-muted-foreground">
                  <div>
                    <dt className="inline uppercase tracking-wide">Format</dt>{' '}
                    <dd className="metric-value inline text-foreground/80">{f.format}</dd>
                  </div>
                  <div>
                    <dt className="inline uppercase tracking-wide">Cadence</dt>{' '}
                    <dd className="metric-value inline text-foreground/80">{f.cadence}</dd>
                  </div>
                  <div>
                    <dt className="inline uppercase tracking-wide">Volume</dt>{' '}
                    <dd className="metric-value inline text-foreground/80">{f.volume}</dd>
                  </div>
                  <div>
                    <dt className="inline uppercase tracking-wide">Bronze</dt>{' '}
                    <dd className="metric-value inline text-foreground/80">{f.bronzeObject}</dd>
                  </div>
                  <div>
                    <dt className="inline uppercase tracking-wide">Late data</dt>{' '}
                    <dd className="inline">{f.lateArrival}</dd>
                  </div>
                </dl>
                {health && (
                  <div className="mt-2 rounded-md border border-border bg-muted/40 p-2 text-[11px] text-muted-foreground">
                    {health.note}
                  </div>
                )}
                <div className="mt-auto pt-2">
                  <div className="flex flex-wrap gap-1">
                    {f.goldTables.map((t) => (
                      <span key={t} className="metric-value rounded bg-muted px-1.5 py-0.5 text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Owner · {f.ownership}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Layer by layer: intent, transformations, checks, failure behaviour */}
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Layer by layer — transformations & quality gates
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Raw → curated → certified → semantic. Each layer states what it is allowed to change, what must
          pass, and what happens when it does not.
        </p>
        <div className="mt-3 space-y-2">
          {INGESTION_STAGES.map((stage, i) => (
            <div key={stage.layer}>
              <div className="rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className={`text-[10px] ${LAYER_STYLES[stage.layer].badge}`}>
                    {stage.layer.toUpperCase()}
                  </Badge>
                  <span className="metric-value text-sm font-medium">{stage.title}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{stage.intent}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Transformations allowed here
                    </div>
                    <ul className="mt-1 space-y-1 text-xs">
                      {stage.rules.map((r) => (
                        <li key={r} className="flex gap-2">
                          <span
                            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${LAYER_STYLES[stage.layer].dot}`}
                          />
                          <span className="text-muted-foreground">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Data-quality gates ({stage.checks.length})
                    </div>
                    <ul className="mt-1 space-y-1 text-xs">
                      {stage.checks.map((c) => (
                        <li key={c.name} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-status-good" />
                          <span>
                            <span className="metric-value font-medium">{c.name}</span>{' '}
                            <span className="text-muted-foreground">— {c.gate}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 rounded-md bg-muted/60 p-2 text-xs">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-status-warning" />
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground/80">On failure</span> · {stage.onFailure}
                  </span>
                </div>
              </div>
              {i < INGESTION_STAGES.length - 1 && (
                <div className="flex justify-center py-1 text-muted-foreground">
                  <ArrowDown className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Per certified table: the physical hops */}
      <Card className="p-4">
        <div className="text-sm font-semibold">Trace a certified table</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick a gold table to see the exact physical objects behind it, in pipeline order.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tables.map((t) => (
            <button
              key={t.table}
              type="button"
              onClick={() => setTableChoice(t.table)}
              className={`metric-value rounded-md border px-2 py-1 text-[11px] transition ${
                t.table === activeTable
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {t.table}
            </button>
          ))}
        </div>
        <div className="relative mt-4 space-y-3 pl-3">
          <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border" />
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">{lineage.goldLabel}</span> ·{' '}
            {lineage.layers.length} hops
          </div>
          {lineage.layers.map((l, i) => (
            <div key={`${l.layer}-${l.object}-${i}`} className="relative ml-4 rounded-lg border border-border p-3">
              <span
                className={`absolute -left-[19px] top-4 flex h-2.5 w-2.5 rounded-full border-2 border-card ${LAYER_STYLES[l.layer].dot.replace('bg-', 'bg-')}`}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className={`text-[10px] ${LAYER_STYLES[l.layer].badge}`}>
                  {l.layer.toUpperCase()}
                </Badge>
                <span className="metric-value text-sm">{l.object}</span>
                <span className="text-xs text-muted-foreground">{l.system}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{l.transformation}</p>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-muted-foreground">
                <span>
                  Grain · <span className="metric-value">{l.grain}</span>
                </span>
                <span>
                  Refresh · <span className="metric-value">{l.cadence}</span>
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {l.checks.map((c) => (
                  <span
                    key={c}
                    className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                  >
                    <CheckCircle2 className="h-2.5 w-2.5 text-status-good" />
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Messy data playbook */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-status-warning" />
            How messy data is handled
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search messy-data patterns…"
              value={messySearch}
              onChange={(e) => setMessySearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
            {messySearch && (
              <button
                type="button"
                onClick={() => setMessySearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Real grocery data arrives duplicated, late, negative, unmapped and mis-unitised. Nothing is
          quietly cleaned away — each pattern has a stated rule, and rows that cannot be resolved are
          quarantined with a reason instead of being guessed.
        </p>
        <Accordion type="single" collapsible className="mt-2">
          {filteredMessy.map((m) => (
            <AccordionItem key={m.id} value={m.id}>
              <AccordionTrigger className="py-3 text-left text-sm hover:no-underline">
                <span className="flex flex-1 flex-wrap items-center gap-2 pr-2">
                  <span className="font-medium">{m.pattern}</span>
                  <Badge variant="secondary" className={`text-[10px] ${LAYER_STYLES[m.detectedAt].badge}`}>
                    caught at {m.detectedAt.toLowerCase()}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {m.handling.toLowerCase().includes('quarantine')
                      ? 'quarantined'
                      : m.handling.toLowerCase().includes('block')
                        ? 'blocked'
                        : 'handled'}
                  </Badge>
                  <span className="metric-value text-[11px] text-muted-foreground">{m.observed}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 text-xs text-muted-foreground">
                <div>
                  <span className="text-[11px] uppercase tracking-wide">What actually happens</span>
                  <div className="mt-0.5">{m.reality}</div>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wide">Handling rule</span>
                  <div className="mt-0.5">{m.handling}</div>
                </div>
                <div className="flex gap-2 rounded-md bg-muted/60 p-2">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-status-good" />
                  <span>
                    <span className="font-medium text-foreground/80">Effect on answers</span> · {m.outcome}
                  </span>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
          {filteredMessy.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No messy-data patterns match.</p>
          )}
        </Accordion>
      </Card>
    </div>
  );
}
