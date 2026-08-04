import { Brain, Database, FlaskConical, Route, ScanSearch, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';

export type ReasoningStep = {
  id: string;
  stage: 'plan' | 'execute' | 'simulate' | 'narrate' | 'guard' | 'evaluate' | string;
  label: string;
  detail: string;
  ms: number;
};

const STAGE_ICON: Record<string, typeof Brain> = {
  plan: Route,
  execute: Database,
  simulate: FlaskConical,
  narrate: Brain,
  guard: ShieldCheck,
  evaluate: ScanSearch,
};

/** The visible chain of steps that produced the answer — not one opaque paragraph. */
export function ReasoningChain({ steps }: { steps: ReasoningStep[] }) {
  if (!steps?.length) return null;
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Route className="h-4 w-4 text-primary" />
          How this answer was produced
        </div>
        <span className="metric-value text-xs text-muted-foreground">{steps.length} steps</span>
      </div>

      <ol className="space-y-0">
        {steps.map((step, i) => {
          const Icon = STAGE_ICON[step.stage] ?? Brain;
          const last = i === steps.length - 1;
          return (
            <li key={`${step.id}-${i}`} className="relative flex gap-3 pb-3 last:pb-0">
              {!last && <span className="absolute left-[11px] top-6 bottom-0 w-px bg-border" aria-hidden />}
              <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-surface-raised">
                <Icon className="h-3 w-3 text-primary" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-medium leading-tight">{step.label}</span>
                  <span className="metric-value text-[11px] uppercase tracking-wide text-muted-foreground">
                    {step.stage} · {step.ms}ms
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{step.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
