import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  Compass,
  FlaskConical,
  Layers,
  Network,
  PlugZap,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import OntologyGraph from '@/pages/OntologyGraph';
import DataDiscovery from '@/pages/DataDiscovery';
import DataQuality from '@/pages/DataQuality';

type TabId =
  | 'graph'
  | 'discover'
  | 'quality'
  | 'ingestion'
  | 'onboarding'
  | 'forecast'
  | 'messy';

const TABS: { id: TabId; label: string; hint: string; icon: typeof Network }[] = [
  { id: 'graph', label: 'Knowledge graph', hint: 'Entities, relationships, governed datasets', icon: Network },
  { id: 'discover', label: 'Discovery', hint: 'Searchable catalog of datasets & metrics', icon: Compass },
  { id: 'quality', label: 'Quality', hint: 'Gate runs, dimensions, incidents, reports', icon: ShieldCheck },
  { id: 'ingestion', label: 'Ingestion & transformation', hint: 'Feeds, medallion layers, cleaning rules', icon: Layers },
  { id: 'onboarding', label: 'Source onboarding', hint: 'Connector → contract → answerable in 48h', icon: PlugZap },
  { id: 'forecast', label: 'Predictive reliability', hint: 'Forecast breaches and blast radius', icon: TrendingUp },
  { id: 'messy', label: 'Messy-data lab', hint: 'Governed vs ungoverned on dirty batches', icon: FlaskConical },
];

/** Sub-tabs that live inside the ontology-graph page component. */
const GRAPH_VIEWS = { graph: 'graph', ingestion: 'ingestion', onboarding: 'onboarding', forecast: 'forecast', messy: 'messy' } as const;

export default function DataEngineering() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab') as TabId | null;
  const tab: TabId = TABS.some((t) => t.id === raw) ? (raw as TabId) : 'graph';
  const active = useMemo(() => TABS.find((t) => t.id === tab)!, [tab]);

  const select = (id: TabId) => {
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next, { replace: true });
  };

  const graphView = (GRAPH_VIEWS as Record<string, string>)[tab];

  return (
    <div className="space-y-5 p-4 md:p-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Activity className="h-3.5 w-3.5" /> Data engineering
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Data foundation console
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          One place for the whole estate: the retail knowledge graph every answer is grounded in, the
          governed catalog, ingestion and transformation across the medallion layers, quality gates,
          new-source onboarding and predictive reliability.
        </p>
      </header>

      <Card className="p-1.5">
        <nav className="flex flex-wrap gap-1" aria-label="Data engineering sections">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => select(t.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </Card>

      <p className="text-xs text-muted-foreground">{active.hint}</p>

      {graphView ? (
        <OntologyGraph
          embedded
          view={graphView as 'graph' | 'ingestion' | 'onboarding' | 'forecast' | 'messy'}
          onViewChange={(v) => select(v as TabId)}
        />
      ) : tab === 'discover' ? (
        <DataDiscovery embedded />
      ) : (
        <DataQuality embedded />
      )}
    </div>
  );
}
