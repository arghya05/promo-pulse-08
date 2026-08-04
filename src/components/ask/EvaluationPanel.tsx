import { useState } from 'react';
import { CheckCircle2, ChevronDown, MinusCircle, RefreshCcw, ScanSearch, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export type EvalCheck = {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  fix: string | null;
};

export type Evaluation = {
  score: number;
  passed: boolean;
  verdict: string;
  checks: EvalCheck[];
  attempts: { attempt: number; score: number; verdict: string; rejectedClaims: number }[];
  selfCorrected: boolean;
  method: string;
};

const statusIcon = {
  pass: CheckCircle2,
  warn: MinusCircle,
  fail: XCircle,
} as const;

const statusColor = {
  pass: 'text-status-good',
  warn: 'text-status-warning',
  fail: 'text-status-bad',
} as const;

/**
 * Post-answer evaluation report. Every check is computed in code against the
 * executed facts, so the verdict is reproducible and never model-graded.
 */
export function EvaluationPanel({ evaluation }: { evaluation: Evaluation }) {
  const [open, setOpen] = useState(false);
  const passed = evaluation.checks.filter((c) => c.status === 'pass').length;

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 p-4 text-left transition-colors hover:bg-surface-sunken"
      >
        <ScanSearch className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Answer evaluation</span>
        <span className="metric-value text-sm font-semibold text-foreground">{evaluation.score}/100</span>
        <Badge
          variant="outline"
          className={`gap-1 font-normal ${evaluation.passed ? 'border-status-good/40 text-status-good' : 'border-status-warning/40 text-status-warning'}`}
        >
          {evaluation.passed ? 'Grounded' : 'Partial'}
        </Badge>
        <span className="metric-value text-xs text-muted-foreground">
          {passed}/{evaluation.checks.length} checks passed
        </span>
        {evaluation.selfCorrected && (
          <Badge variant="secondary" className="gap-1 font-normal">
            <RefreshCcw className="h-3 w-3" />
            self-corrected
          </Badge>
        )}
        <ChevronDown
          className={`ml-auto h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border/70 p-4 text-xs">
          <ul className="space-y-2">
            {evaluation.checks.map((check) => {
              const Icon = statusIcon[check.status];
              return (
                <li key={check.id} className="flex items-start gap-2 rounded-lg bg-surface-sunken p-2.5">
                  <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${statusColor[check.status]}`} />
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium text-foreground">{check.label}</div>
                    <div className="text-muted-foreground">{check.detail}</div>
                    {check.fix && (
                      <div className="text-muted-foreground/80">
                        Correction requested: <span className="italic">{check.fix}</span>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {evaluation.attempts.length > 1 && (
            <div className="space-y-1.5 rounded-lg border border-dashed border-border p-2.5">
              <div className="text-sm font-medium text-foreground">Self-correction trace</div>
              {evaluation.attempts.map((a) => (
                <div key={a.attempt} className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
                  <span className="metric-value">attempt {a.attempt}</span>
                  <span className="metric-value">{a.score}/100</span>
                  <span className="metric-value">{a.rejectedClaims} rejected</span>
                  <span className="basis-full">{a.verdict}</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-muted-foreground">{evaluation.method}</p>
        </div>
      )}
    </Card>
  );
}
