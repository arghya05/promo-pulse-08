import { useState } from 'react';
import { GitBranch } from 'lucide-react';
import { LineageDetailDialog } from '@/components/ask/LineageDetailDialog';


export type LineageEntry = {
  ref: string;
  kind: 'observed' | 'projected';
  value: string;
  metric: string;
  metricLabel: string;
  formula: string;
  scope: string;
  dataset: string;
  module: string;
  table: string;
  grain: string;
  window: { from: string | null; to: string | null };
  recordsAnalysed: number;
  method: string | null;
};

/**
 * Claim-level lineage: for every value cited in a sentence, show the chain
 * value -> metric formula -> row scope -> governed dataset -> physical table.
 */
export function LineageTrail({
  refs,
  lineage,
}: {
  refs?: string[];
  lineage?: Record<string, LineageEntry>;
}) {
  const [open, setOpen] = useState(false);
  const entries = (refs ?? []).map((r) => lineage?.[r]).filter(Boolean) as LineageEntry[];
  if (!entries.length) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
      >
        <GitBranch className="h-3 w-3" />
        {open ? 'Hide lineage' : `Trace lineage · ${entries.length}`}
      </button>

      {open && (
        <ul className="mt-2 space-y-2">
          {entries.map((e) => (
            <li key={e.ref} className="rounded-md border border-dashed border-border bg-surface-sunken p-2 text-[11px]">
              <div className="flex flex-wrap items-center gap-x-2">
                <span className="metric-value text-sm font-semibold text-foreground">{e.value}</span>
                <span className="text-muted-foreground">{e.metricLabel}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                    e.kind === 'projected'
                      ? 'bg-status-warning/10 text-status-warning'
                      : 'bg-status-good/10 text-status-good'
                  }`}
                >
                  {e.kind}
                </span>
              </div>
              <div className="mt-1 space-y-0.5 text-muted-foreground">
                <div>
                  <span className="text-foreground/70">Formula</span> · {e.formula}
                </div>
                <div>
                  <span className="text-foreground/70">Scope</span> · {e.scope} · {e.grain}
                </div>
                <div>
                  <span className="text-foreground/70">Source</span> ·{' '}
                  <span className="metric-value">{e.dataset}</span> → <span className="metric-value">{e.table}</span> ·{' '}
                  {e.module}
                </div>
                <div>
                  <span className="text-foreground/70">Window</span> ·{' '}
                  <span className="metric-value">
                    {e.window.from ?? '—'} → {e.window.to ?? '—'}
                  </span>{' '}
                  · <span className="metric-value">{e.recordsAnalysed.toLocaleString('en-US')}</span> records
                </div>
                {e.method && (
                  <div>
                    <span className="text-foreground/70">Method</span> · {e.method}
                  </div>
                )}
                <div className="metric-value text-muted-foreground/70">{e.ref}</div>
              </div>
              <div className="mt-2">
                <LineageDetailDialog entry={e} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
