import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  Shield,
  TrendingUp,
  Loader2,
  Play,
  RotateCcw,
  Eye,
  Sparkles,
  Package,
  Megaphone,
  DollarSign,
  Grid3X3,
  Search,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrossModuleProblem, CrossModulePlan, ModuleType, alternativePlans } from './cross-module-data';
import { PlanSelector, calculateROIScore } from './PlanSelector';

export { calculateROIScore };

function parseTimeToImpact(timeStr: string): number {
  const match = timeStr.match(/(\d+)/);
  if (!match) return 1;
  const num = parseInt(match[1]);
  if (timeStr.includes('h')) return num / 24;
  return num;
}

export type CaseStatus = 'idle' | 'running' | 'waiting_approval' | 'executing' | 'completed' | 'failed';
export type NextRequiredAction = 'start' | 'approve_assumptions' | 'approve_root_cause' | 'approve_plan' | 'approve_execution' | 'approve_measurement' | 'none';

interface ROIFirstDecisionCardProps {
  problem: CrossModuleProblem;
  status: CaseStatus;
  nextAction: NextRequiredAction;
  isRunning: boolean;
  runProgress?: number;
  currentAgentName?: string;
  onStart: () => void;
  onApprove: () => void;
  onEdit?: () => void;
  onDigDeeper?: () => void;
  onSelectPlan?: (planId: string) => void;
  fastPathEnabled?: boolean;
  onToggleFastPath?: (enabled: boolean) => void;
  selectedPlan?: CrossModulePlan | null;
}

const moduleIcons: Record<ModuleType, typeof Package> = {
  inventory: Package,
  allocation: Package,
  promo: Megaphone,
  pricing: DollarSign,
  assortment: Grid3X3,
  space: Grid3X3,
  demand: TrendingUp,
  supply: Package,
};

export function ROIFirstDecisionCard({
  problem,
  status,
  nextAction,
  isRunning,
  runProgress = 0,
  currentAgentName,
  onStart,
  onApprove,
  onEdit,
  onDigDeeper,
  onSelectPlan,
  fastPathEnabled = true,
  onToggleFastPath,
  selectedPlan,
}: ROIFirstDecisionCardProps) {
  const timeToImpactDays = parseTimeToImpact(problem.timeToImpact);
  
  // Get all available plans
  const allPlans = useMemo(() => {
    const alts = alternativePlans[problem.id] || [];
    const base = problem.crossModulePlan;
    if (base && !alts.find(p => p.id === base.id)) {
      return [base, ...alts];
    }
    return alts.length > 0 ? alts : (base ? [base] : []);
  }, [problem]);

  const plan = selectedPlan || allPlans[0];
  const roiScore = plan 
    ? calculateROIScore(plan.expectedROI, problem.confidence, timeToImpactDays, plan.riskScore)
    : calculateROIScore(problem.impact, problem.confidence, timeToImpactDays, 0.3);

  // Low confidence warning
  const showLowConfidenceWarning = problem.confidence < 70;

  const getStatusConfig = () => {
    switch (status) {
      case 'running':
        return { label: 'Running', color: 'bg-primary/10 text-primary', icon: Loader2, animate: true };
      case 'waiting_approval':
        return { label: 'Waiting for Approval', color: 'bg-amber-500/10 text-amber-600', icon: Clock, animate: false };
      case 'executing':
        return { label: 'Executing', color: 'bg-blue-500/10 text-blue-600', icon: Zap, animate: true };
      case 'completed':
        return { label: 'Completed', color: 'bg-green-500/10 text-green-600', icon: CheckCircle2, animate: false };
      case 'failed':
        return { label: 'Failed', color: 'bg-red-500/10 text-red-600', icon: AlertTriangle, animate: false };
      default:
        return { label: 'Ready', color: 'bg-muted text-muted-foreground', icon: Play, animate: false };
    }
  };

  const getCTAConfig = () => {
    switch (nextAction) {
      case 'start':
        return { label: 'Run Now', icon: Play, variant: 'default' as const };
      case 'approve_assumptions':
        return { label: 'Approve & Continue', icon: CheckCircle2, variant: 'default' as const };
      case 'approve_root_cause':
        return { label: 'Accept Root Cause & Continue', icon: CheckCircle2, variant: 'default' as const };
      case 'approve_plan':
        return { label: 'Approve Plan & Execute', icon: Zap, variant: 'default' as const };
      case 'approve_execution':
        return { label: 'Execute Now', icon: Zap, variant: 'default' as const };
      case 'approve_measurement':
        return { label: 'Accept Results', icon: CheckCircle2, variant: 'default' as const };
      default:
        return { label: 'View Details', icon: Eye, variant: 'outline' as const };
    }
  };

  const statusConfig = getStatusConfig();
  const ctaConfig = getCTAConfig();
  const StatusIcon = statusConfig.icon;
  const CTAIcon = ctaConfig.icon;

  // Get diagnosis
  const getDiagnosis = () => {
    if (problem.rootCauses.length > 0) {
      return problem.rootCauses[0].hypothesis;
    }
    return problem.summary.split('.')[0];
  };

  // Get execution preview
  const getExecutionPreview = () => {
    if (!plan) return [];
    return plan.actions.slice(0, 4).map(a => ({
      module: a.module,
      action: a.what,
      system: a.toolCall.system,
    }));
  };

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div className="flex items-center justify-between">
        <Badge className={cn("px-3 py-1 text-xs font-medium gap-1.5", statusConfig.color)}>
          <StatusIcon className={cn("h-3.5 w-3.5", statusConfig.animate && "animate-spin")} />
          {statusConfig.label}
          {isRunning && currentAgentName && (
            <span className="opacity-70">· {currentAgentName}</span>
          )}
        </Badge>
        
        {/* Fast Path Toggle */}
        {onToggleFastPath && (
          <button
            onClick={() => onToggleFastPath(!fastPathEnabled)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all",
              fastPathEnabled 
                ? "bg-primary/10 text-primary border border-primary/20" 
                : "bg-muted text-muted-foreground border border-transparent"
            )}
          >
            <Sparkles className="h-3 w-3" />
            {fastPathEnabled ? 'Fast Path ON' : 'Deep Dive'}
          </button>
        )}
      </div>

      {/* Low Confidence Warning */}
      {showLowConfidenceWarning && (
        <Card className="border-amber-500/30 bg-amber-50">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-700">Low Confidence ({problem.confidence}%)</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Data confidence is below 70%. Please review signals before proceeding.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Running Progress */}
      {isRunning && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-primary">
                {currentAgentName || 'Processing'}...
              </span>
              <span className="text-xs text-muted-foreground">{runProgress}%</span>
            </div>
            <Progress value={runProgress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Agents are analyzing data. Next: {nextAction === 'approve_assumptions' ? 'Data validation review' : 'Continue analysis'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 1. One-line Diagnosis */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Diagnosis</p>
              <p className="text-sm font-medium mt-0.5">{getDiagnosis()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Impact Summary */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="p-3 text-center">
          <p className="text-lg font-bold text-primary">₹{problem.impact}L</p>
          <p className="text-[10px] text-muted-foreground">Impact/day</p>
        </Card>
        <Card className="p-3 text-center">
          <p className={cn(
            "text-lg font-bold",
            problem.confidence >= 70 ? "text-foreground" : "text-amber-600"
          )}>
            {problem.confidence}%
          </p>
          <p className="text-[10px] text-muted-foreground">Confidence</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-lg font-bold">{problem.timeToImpact}</p>
          <p className="text-[10px] text-muted-foreground">Time to impact</p>
        </Card>
        <Card className="p-3 text-center">
          <p className={cn(
            "text-lg font-bold",
            (plan?.riskScore || 0) <= 0.25 ? "text-green-600" :
            (plan?.riskScore || 0) <= 0.5 ? "text-amber-600" : "text-red-600"
          )}>
            {((plan?.riskScore || 0.3) * 100).toFixed(0)}%
          </p>
          <p className="text-[10px] text-muted-foreground">Risk</p>
        </Card>
      </div>

      {/* 3. Plan Selector - Multiple selectable plans */}
      {allPlans.length > 0 && (
        <PlanSelector
          plans={allPlans}
          selectedPlanId={plan?.id || ''}
          onSelectPlan={(planId) => onSelectPlan?.(planId)}
          onEditPlan={onEdit ? () => onEdit() : undefined}
          confidence={problem.confidence}
          timeToImpactDays={timeToImpactDays}
          showComparison={!fastPathEnabled}
        />
      )}

      {/* 4. Approval Gate (only if needed) */}
      {status === 'waiting_approval' && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">
                {nextAction === 'approve_assumptions' && 'Confirm data assumptions are correct'}
                {nextAction === 'approve_root_cause' && 'Accept root cause analysis'}
                {nextAction === 'approve_plan' && 'Approve selected action plan'}
                {nextAction === 'approve_execution' && 'Final approval to execute'}
                {nextAction === 'approve_measurement' && 'Confirm measurement results'}
              </span>
            </div>
            
            {/* Assumptions for data gate */}
            {nextAction === 'approve_assumptions' && (
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[9px]">{problem.signals.length} signals collected</Badge>
                <Badge variant="outline" className="text-[9px]">4 DCs validated</Badge>
                <Badge variant="outline" className="text-[9px]">{problem.confidence}% data quality</Badge>
                <Badge variant="outline" className="text-[9px]">{problem.rootCauses.length} hypotheses</Badge>
              </div>
            )}

            {/* Guardrails check */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                4/5 guardrails passed
              </span>
              {plan && plan.riskScore > 0.3 && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                  1 warning (risk threshold)
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary CTA + Secondary Actions */}
      <div className="flex gap-2">
        <Button 
          onClick={nextAction === 'start' ? onStart : onApprove}
          disabled={isRunning}
          className="flex-1 gap-2"
          size="lg"
        >
          <CTAIcon className={cn("h-4 w-4", isRunning && "animate-spin")} />
          {ctaConfig.label}
        </Button>
        
        {status === 'waiting_approval' && onEdit && (
          <Button variant="outline" onClick={onEdit} disabled={isRunning} className="gap-1.5">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        )}
        
        {status === 'waiting_approval' && onDigDeeper && (
          <Button variant="outline" onClick={onDigDeeper} disabled={isRunning} className="gap-1.5">
            <Search className="h-4 w-4" />
            Dig Deeper
          </Button>
        )}

        {status === 'failed' && (
          <Button variant="outline" onClick={onStart} className="gap-1.5">
            <RotateCcw className="h-4 w-4" />
            Retry
          </Button>
        )}
      </div>

      {/* 5. What will execute */}
      {plan && plan.actions.length > 0 && (
        <Accordion type="single" collapsible className="border rounded-lg">
          <AccordionItem value="execution" className="border-0">
            <AccordionTrigger className="px-4 py-2 text-xs hover:no-underline">
              <span className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Execution Preview ({plan.actions.length} actions)
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="space-y-2">
                {getExecutionPreview().map((item, idx) => {
                  const Icon = moduleIcons[item.module] || Package;
                  return (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1">{item.action}</span>
                      <Badge variant="secondary" className="text-[9px]">{item.system}</Badge>
                    </div>
                  );
                })}
                {plan.actions.length > 4 && (
                  <p className="text-[10px] text-muted-foreground">+{plan.actions.length - 4} more actions</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
