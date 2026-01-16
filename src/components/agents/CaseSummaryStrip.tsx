import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  Shield, 
  ExternalLink,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrossModuleProblem, ModuleType } from './cross-module-data';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CaseSummaryStripProps {
  problem: CrossModuleProblem;
  onShowAssumptions?: () => void;
  onShowEvidence?: () => void;
}

const moduleColors: Record<ModuleType, string> = {
  inventory: 'bg-blue-500/10 text-blue-600',
  allocation: 'bg-cyan-500/10 text-cyan-600',
  promo: 'bg-orange-500/10 text-orange-600',
  pricing: 'bg-green-500/10 text-green-600',
  assortment: 'bg-purple-500/10 text-purple-600',
  space: 'bg-pink-500/10 text-pink-600',
  demand: 'bg-indigo-500/10 text-indigo-600',
  supply: 'bg-teal-500/10 text-teal-600',
};

export function CaseSummaryStrip({ problem, onShowAssumptions, onShowEvidence }: CaseSummaryStripProps) {
  const primaryDriver = problem.rootCauses[0]?.hypothesis || 'Analysis pending';
  
  // Calculate guardrails coverage based on confidence
  const guardrailsCoverage = Math.round((problem.confidence / 100) * 5);

  return (
    <div className="bg-muted/30 border rounded-lg p-3 space-y-2">
      {/* Problem title + modules */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="font-semibold text-sm">{problem.title}</span>
          </div>
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {problem.modules.map(m => (
              <Badge key={m} variant="secondary" className={cn("text-[9px]", moduleColors[m])}>
                {m}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-3 text-center">
        {/* Impact */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-background rounded-md p-2 cursor-help">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  <span className="text-sm font-bold text-primary">₹{problem.impact}L</span>
                </div>
                <p className="text-[9px] text-muted-foreground">Impact/day</p>
                {onShowAssumptions && (
                  <button 
                    onClick={onShowAssumptions}
                    className="text-[8px] text-primary hover:underline flex items-center gap-0.5 mx-auto mt-0.5"
                  >
                    <Info className="h-2 w-2" />
                    assumptions
                  </button>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Range: ₹{(problem.impact * 0.85).toFixed(1)}L - ₹{(problem.impact * 1.15).toFixed(1)}L</p>
              <p className="text-[10px] text-muted-foreground">Based on last 30d velocity</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Confidence */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-background rounded-md p-2 cursor-help">
                <div className="flex items-center justify-center gap-1">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  <span className={cn(
                    "text-sm font-bold",
                    problem.confidence >= 70 ? "text-foreground" : "text-amber-600"
                  )}>
                    {problem.confidence}%
                  </span>
                </div>
                <p className="text-[9px] text-muted-foreground">Confidence</p>
                <p className="text-[8px] text-muted-foreground">{problem.signals.length} signals</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">Data sources:</p>
              <ul className="text-[10px] text-muted-foreground">
                {problem.signals.slice(0, 3).map(s => (
                  <li key={s.id}>• {s.source} ({s.confidence}%)</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Time to impact */}
        <div className="bg-background rounded-md p-2">
          <span className="text-sm font-bold">{problem.timeToImpact}</span>
          <p className="text-[9px] text-muted-foreground">Time to impact</p>
          <p className="text-[8px] text-muted-foreground">{problem.urgency}</p>
        </div>

        {/* Guardrails */}
        <div className="bg-background rounded-md p-2">
          <div className="flex items-center justify-center gap-1">
            <Shield className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-bold">{guardrailsCoverage}/5</span>
          </div>
          <p className="text-[9px] text-muted-foreground">Guardrails</p>
          <p className="text-[8px] text-muted-foreground">
            {guardrailsCoverage >= 4 ? 'All safe' : guardrailsCoverage >= 3 ? '1 warning' : `${5 - guardrailsCoverage} warnings`}
          </p>
        </div>
      </div>

      {/* Primary driver */}
      <div className="flex items-center gap-2 bg-background rounded-md p-2">
        <span className="text-[10px] text-muted-foreground shrink-0">Primary driver:</span>
        <span className="text-xs font-medium flex-1 truncate">{primaryDriver.slice(0, 60)}...</span>
        {onShowEvidence && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 px-2 text-[9px] gap-1 shrink-0"
            onClick={onShowEvidence}
          >
            <ExternalLink className="h-2.5 w-2.5" />
            evidence
          </Button>
        )}
      </div>
    </div>
  );
}
