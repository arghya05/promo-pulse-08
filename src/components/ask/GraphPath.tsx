import { ArrowRight, Network } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export type GraphNode = {
  id: string;
  label: string;
  modules: string[];
  keyField: string;
  datasets: string[];
  primary: boolean;
};

export type GraphEdge = {
  from: string;
  to: string;
  via: string;
  label: string;
  question: string;
};

/**
 * The entity traversal an answer actually walked. Every edge is clickable and
 * re-asks the question along that relationship.
 */
export function GraphPath({
  graph,
  onAsk,
}: {
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  onAsk: (question: string) => void;
}) {
  if (!graph?.nodes?.length) return null;

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Network className="h-4 w-4 text-primary" />
          Knowledge-graph traversal
        </div>
        <span className="text-xs text-muted-foreground">
          {graph.nodes.length} entities · {graph.edges.length} relationships walked
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {graph.nodes.map((node) => (
          <span
            key={node.id}
            title={`${node.keyField} · datasets: ${node.datasets.join(', ')}`}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              node.primary
                ? 'border-primary/40 bg-primary/10 font-medium text-primary'
                : 'border-border/70 bg-surface-raised text-muted-foreground'
            }`}
          >
            {node.label}
          </span>
        ))}
      </div>

      {graph.edges.length > 0 && (
        <div className="space-y-2">
          {graph.edges.map((edge, i) => (
            <button
              key={`${edge.from}-${edge.to}-${i}`}
              type="button"
              onClick={() => onAsk(edge.question)}
              className="group flex w-full flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-surface-raised px-3 py-2 text-left text-xs transition-all hover:border-primary/50 hover:shadow-sm"
            >
              <span className="font-medium">{edge.from}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">{edge.label}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{edge.to}</span>
              <Badge variant="outline" className="metric-value ml-auto font-normal">
                {edge.via}
              </Badge>
              <span className="basis-full pt-1 text-muted-foreground group-hover:text-primary">
                Follow this edge → {edge.question}
              </span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
