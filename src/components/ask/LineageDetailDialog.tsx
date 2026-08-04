import { ArrowDown, Calculator, Database, GitBranch, Layers, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LAYER_STYLES, lineageForTable } from '@/lib/lineage-layers';
import { buildCalculationWalk } from '@/lib/calculation-walk';
import type { LineageEntry } from '@/components/ask/LineageTrail';

/**
 * Full raw → gold → value lineage for a single cited number.
 * Shows the physical pipeline (source system → bronze landing → silver
 * conformed model → gold certified table → semantic metric), the quality
 * gates on each hop, and the exact scope/records the value was computed over.
 */
export function LineageDetailDialog({ entry, sql }: { entry: LineageEntry; sql?: string }) {
  const pipeline = lineageForTable(entry.table);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-surface-sunken"
        >
          <Layers className="h-3 w-3 text-primary" />
          Detailed lineage · raw → gold
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="space-y-1 border-b border-border/70 p-5 pb-4 text-left">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-base">
            <GitBranch className="h-4 w-4 text-primary" />
            How <span className="metric-value text-primary">{entry.value}</span> was produced
          </DialogTitle>
          <DialogDescription className="text-xs">
            {entry.metricLabel} · {entry.scope} · every hop below is a physical object in the merchandising lakehouse,
            not a description of one.
          </DialogDescription>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="secondary" className="gap-1 font-normal">
              <ShieldCheck className="h-3 w-3 text-status-good" />
              0 model-written digits
            </Badge>
            <Badge variant="outline" className="metric-value font-normal">
              {entry.recordsAnalysed.toLocaleString('en-US')} records read
            </Badge>
            <Badge variant="outline" className="metric-value font-normal">
              {entry.window.from ?? 'earliest'} → {entry.window.to ?? 'latest'}
            </Badge>
            <Badge variant="outline" className="font-normal capitalize">
              {entry.kind}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          <div className="space-y-4 p-5">
            <ol className="space-y-0">
              {pipeline.layers.map((layer, i) => (
                <li key={`${layer.layer}-${layer.object}`}>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${LAYER_STYLES[layer.layer].badge}`}
                      >
                        {layer.layer}
                      </span>
                      <span className="metric-value text-sm font-semibold text-foreground">{layer.object}</span>
                      <span className="text-[11px] text-muted-foreground">{layer.system}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{layer.transformation}</p>
                    <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
                      <div>
                        <span className="text-foreground/70">Grain</span> ·{' '}
                        <span className="metric-value">{layer.grain}</span>
                      </div>
                      <div>
                        <span className="text-foreground/70">Refresh</span> ·{' '}
                        <span className="metric-value">{layer.cadence}</span>
                      </div>
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-1">
                      {layer.checks.map((check) => (
                        <li
                          key={check}
                          className="inline-flex items-center gap-1 rounded border border-border/70 bg-surface-sunken px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          <ShieldCheck className="h-2.5 w-2.5 text-status-good" />
                          {check}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {i < pipeline.layers.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </div>
                  )}
                </li>
              ))}
            </ol>

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Database className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-semibold text-foreground">The value you are reading</span>
                <span className="metric-value text-sm font-semibold text-primary">{entry.value}</span>
              </div>
              <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                <div>
                  <span className="text-foreground/70">Certified metric</span> · {entry.metricLabel} (
                  <span className="metric-value">{entry.metric}</span>)
                </div>
                <div>
                  <span className="text-foreground/70">Formula executed in code</span> ·{' '}
                  <span className="metric-value">{entry.formula}</span>
                </div>
                <div>
                  <span className="text-foreground/70">Governed dataset</span> ·{' '}
                  <span className="metric-value">{entry.dataset}</span> → gold table{' '}
                  <span className="metric-value">{entry.table}</span> ({pipeline.goldLabel}) · {entry.module}
                </div>
                <div>
                  <span className="text-foreground/70">Row scope</span> · {entry.scope} · {entry.grain}
                </div>
                {entry.method && (
                  <div>
                    <span className="text-foreground/70">Projection method</span> · {entry.method}
                  </div>
                )}
                <div className="metric-value text-muted-foreground/70">placeholder {entry.ref}</div>
              </div>
            </div>

            {sql && (
              <div className="space-y-1">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  SQL-equivalent executed against the gold layer
                </div>
                <pre className="metric-value overflow-x-auto rounded-lg border border-border/70 bg-surface-sunken p-3 text-[11px] leading-relaxed">
                  {sql}
                </pre>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
