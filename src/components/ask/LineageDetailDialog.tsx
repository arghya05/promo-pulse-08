import { ArrowDown, Calculator, Database, GitBranch, Layers, ShieldCheck, ClipboardCheck } from 'lucide-react';
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
import { AUDIT_STATUS_STYLES, buildCalculationAudit } from '@/lib/calculation-audit';
import type { LineageEntry } from '@/components/ask/LineageTrail';


/**
 * Full raw → gold → value lineage for a single cited number.
 * Shows the physical pipeline (source system → bronze landing → silver
 * conformed model → gold certified table → semantic metric), the quality
 * gates on each hop, and the exact scope/records the value was computed over.
 */
export function LineageDetailDialog({ entry, sql }: { entry: LineageEntry; sql?: string }) {
  const pipeline = lineageForTable(entry.table);
  const walk = buildCalculationWalk(entry);

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
            {/* Calculation across layers — the arithmetic, layer by layer */}
            <div className="space-y-2 rounded-lg border border-border bg-surface-sunken/60 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Calculator className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-semibold text-foreground">Calculation across layers</span>
                <span className="text-[11px] text-muted-foreground">
                  what the arithmetic does at each hop, and how many rows carry the value
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                      <th className="py-1.5 pr-3">Layer</th>
                      <th className="py-1.5 pr-3">Operation & expression</th>
                      <th className="py-1.5 pr-3 text-right">Rows</th>
                      <th className="py-1.5">Value carried</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walk.map((step) => (
                      <tr key={`${step.layer}-${step.object}`} className="border-b border-border/50 align-top">
                        <td className="py-2 pr-3">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${LAYER_STYLES[step.layer].badge}`}
                          >
                            {step.layer}
                          </span>
                          <p className="metric-value mt-1 max-w-[150px] break-words text-[10px] text-muted-foreground">
                            {step.object}
                          </p>
                        </td>
                        <td className="py-2 pr-3">
                          <p className="text-foreground/90">{step.operation}</p>
                          <code className="mt-1 block whitespace-pre-wrap break-words rounded bg-card px-1.5 py-1 font-mono text-[10px] text-muted-foreground">
                            {step.expression}
                          </code>
                        </td>
                        <td className="py-2 pr-3 text-right">
                          <p className="metric-value font-semibold text-foreground">
                            {step.rows === null ? '—' : step.rows.toLocaleString('en-US')}
                          </p>
                          <span
                            className={`mt-0.5 inline-block rounded px-1 py-0.5 text-[9px] uppercase ${
                              step.rowsBasis === 'exact'
                                ? 'bg-status-good/10 text-status-good'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {step.rowsBasis}
                          </span>
                          <p className="mt-1 max-w-[140px] text-[9px] leading-snug text-muted-foreground">
                            {step.rowsNote}
                          </p>
                        </td>
                        <td className="py-2 text-muted-foreground">{step.carries}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] leading-snug text-muted-foreground">
                <span className="font-semibold">exact</span> = rows the engine actually read or emitted.{' '}
                <span className="font-semibold">derived</span> = upstream count implied by the published grain fan-in
                ratio for this table, not a measured count.
              </p>
            </div>

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
