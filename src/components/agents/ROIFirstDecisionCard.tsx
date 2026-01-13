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
  ArrowRight,
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
  ChevronRight,
  Package,
  Megaphone,
  DollarSign,
  Grid3X3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrossModuleProblem, CrossModulePlan, ModuleType, alternativePlans } from './cross-module-data';

// ROI Score calculation: (Expected_Impact × Confidence) / (Time_to_Impact_Days + 1) × (1 - Risk_Score)
export function calculateROIScore(impact: number, confidence: number, timeToImpactDays: number, riskScore: number): number {
  return (impact * (confidence / 100)) / (timeToImpactDays + 1) * (1 - riskScore);
}

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
  onRequestDeeper?: () => void;
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
  onRequestDeeper,
  fastPathEnabled = true,
  onToggleFastPath,
  selectedPlan,
}: ROIFirstDecisionCardProps) {
  const plan = selectedPlan || problem.crossModulePlan;
  const timeToImpactDays = parseTimeToImpact(problem.timeToImpact);
  const roiScore = plan 
    ? calculateROIScore(plan.expectedROI, problem.confidence, timeToImpactDays, plan.riskScore)
    : calculateROIScore(problem.impact, problem.confidence, timeToImpactDays, 0.3);

  const alternatives = alternativePlans[problem.id] || [];
  const bestPlan = alternatives.length > 0 
    ? alternatives.reduce((best, p) => calculateROIScore(p.expectedROI, problem.confidence, timeToImpactDays, p.riskScore) > calculateROIScore(best.expectedROI, problem.confidence, timeToImpactDays, best.riskScore) ? p : best)
    : plan;

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

  // Get diagnosis based on problem
  const getDiagnosis = () => {
    if (problem.rootCauses.length > 0) {
      return problem.rootCauses[0].hypothesis;
    }
    return problem.summary.split('.')[0];
  };

  // Get what will execute
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
          <p className="text-lg font-bold">{problem.confidence}%</p>
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

      {/* 3. Recommended Next Action (Highest ROI) */}
      {plan && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary text-primary-foreground text-[10px] gap-1">
                  <Sparkles className="h-3 w-3" />
                  Highest ROI
                </Badge>
                <span className="text-xs font-semibold">{plan.name}</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">ROI Score</p>
                <p className="text-lg font-bold text-primary">{roiScore.toFixed(1)}</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">{plan.description}</p>

            {/* 4. Why this is best */}
            <div className="space-y-1.5 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground">Why this is best:</p>
              <ul className="space-y-1">
                <li className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                  <span>Expected ROI: <strong>₹{plan.expectedROI}L</strong> in {plan.effortHours}h effort</span>
                </li>
                <li className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                  <span>Risk score {(plan.riskScore * 100).toFixed(0)}% — {plan.riskScore <= 0.3 ? 'safe for autopilot' : 'requires approval'}</span>
                </li>
                <li className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                  <span>Coordinates {plan.actions.length} actions across {new Set(plan.actions.map(a => a.module)).size} modules</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Approval Gate (only if needed) */}
      {status === 'waiting_approval' && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">
                {nextAction === 'approve_assumptions' && 'Confirm data assumptions are correct'}
                {nextAction === 'approve_root_cause' && 'Accept root cause analysis'}
                {nextAction === 'approve_plan' && 'Approve coordinated action plan'}
                {nextAction === 'approve_execution' && 'Final approval to execute'}
                {nextAction === 'approve_measurement' && 'Confirm measurement results'}
              </span>
            </div>
            
            {/* Quick assumptions for data gate */}
            {nextAction === 'approve_assumptions' && (
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[9px]">18 SKUs mapped</Badge>
                <Badge variant="outline" className="text-[9px]">4 DCs validated</Badge>
                <Badge variant="outline" className="text-[9px]">94% data quality</Badge>
                <Badge variant="outline" className="text-[9px]">3 suppliers linked</Badge>
              </div>
            )}

            {/* Guardrails check */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                4/5 guardrails passed
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                1 warning (stock cover)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary CTA */}
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
          <Button variant="outline" onClick={onEdit} disabled={isRunning}>
            Edit
          </Button>
        )}
        
        {status === 'waiting_approval' && onRequestDeeper && (
          <Button variant="outline" onClick={onRequestDeeper} disabled={isRunning}>
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

      {/* 6. What will execute */}
      {plan && plan.actions.length > 0 && (
        <Accordion type="single" collapsible className="border rounded-lg">
          <AccordionItem value="execution" className="border-0">
            <AccordionTrigger className="px-4 py-2 text-xs hover:no-underline">
              <span className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                What will execute ({plan.actions.length} actions)
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

      {/* 7. Alternatives (collapsed) */}
      {alternatives.length > 1 && (
        <Accordion type="single" collapsible className="border rounded-lg">
          <AccordionItem value="alternatives" className="border-0">
            <AccordionTrigger className="px-4 py-2 text-xs hover:no-underline">
              <span className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5" />
                Alternative plans ({alternatives.length - 1} more)
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="space-y-2">
                {alternatives.filter(p => p.id !== (plan?.id || bestPlan?.id)).map((alt) => {
                  const altScore = calculateROIScore(alt.expectedROI, problem.confidence, timeToImpactDays, alt.riskScore);
                  return (
                    <div key={alt.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-xs font-medium">{alt.name}</p>
                        <p className="text-[10px] text-muted-foreground">{alt.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold">₹{alt.expectedROI}L</p>
                        <Badge variant="outline" className={cn(
                          "text-[9px]",
                          alt.riskScore <= 0.25 ? "text-green-600" : alt.riskScore <= 0.5 ? "text-amber-600" : "text-red-600"
                        )}>
                          {(alt.riskScore * 100).toFixed(0)}% risk
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
