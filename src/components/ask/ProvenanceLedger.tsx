import { useState } from 'react';
import { ChevronDown, FileSearch, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export type Provenance = {
  datasetDescription: string;
  table: string;
  dateField: string | null;
  entities: string[];
  metrics: { key: string; label: string; agg: string; formula: string }[];
  sql: string;
};

/**
 * Per-number lineage: dataset -> table -> filters -> rows scanned -> formula,
 * plus the SQL-equivalent of the governed query. Nothing here is model-written.
 */
export function ProvenanceLedger({
  provenance,
  dataset,
  recordsAnalysed,
  filters,
  window,
}: {
  provenance: Provenance;
  dataset: string;
  recordsAnalysed: number;
  filters: Record<string, string>;
  window: { from: string | null; to: string | null };
}) {
  const [open, setOpen] = useState(false);
  const filterList = Object.entries(filters ?? {});

  return (
    <Card className="overflow-hidden border-dashed">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 p-3 text-left text-xs transition-colors hover:bg-surface-sunken"
      >
        <FileSearch className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Provenance ledger</span>
        <span className="metric-value text-muted-foreground">{dataset}</span>
        <span className="metric-value text-muted-foreground">
          {recordsAnalysed.toLocaleString('en-US')} rows scanned
        </span>
        <Badge variant="secondary" className="gap-1 font-normal">
          <ShieldCheck className="h-3 w-3 text-status-good" />
          0 model-written digits
        </Badge>
        <ChevronDown
          className={`ml-auto h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border/70 p-3 text-xs">
          <p className="text-muted-foreground">{provenance.datasetDescription}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Lineage</div>
              <div className="metric-value">
                {provenance.entities.join(' → ') || 'entity'} → {dataset} → {provenance.table}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Scope applied</div>
              <div className="metric-value">
                {provenance.dateField
                  ? `${provenance.dateField} ${window.from ?? 'earliest'} → ${window.to ?? 'latest'}`
                  : 'snapshot dataset (no time filter)'}
              </div>
              <div className="metric-value text-muted-foreground">
                {filterList.length
                  ? filterList.map(([k, v]) => `${k}=${v}`).join(', ')
                  : 'no filters — full population'}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Metric formulas</div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {provenance.metrics.map((m) => (
                    <tr key={m.key} className="border-b border-border/50 last:border-0">
                      <td className="py-1 pr-3 font-medium">{m.label}</td>
                      <td className="metric-value py-1 pr-3 text-muted-foreground">{m.agg}</td>
                      <td className="py-1 text-muted-foreground">{m.formula}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {provenance.sql && (
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                SQL-equivalent of the governed query
              </div>
              <pre className="metric-value overflow-x-auto rounded-lg border border-border/70 bg-surface-sunken p-3 text-[11px] leading-relaxed">
                {provenance.sql}
              </pre>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
