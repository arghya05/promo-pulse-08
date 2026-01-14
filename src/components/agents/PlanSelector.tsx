import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle2, 
  Shield, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrossModulePlan, ModuleType } from './cross-module-data';

// ROI Score: (Expected_Impact × Confidence) / (Time_to_Impact_Days + 1) × (1 - Risk_Score)
export function calculateROIScore(impact: number, confidence: number, timeToImpactDays: number, riskScore: number): number {
  return (impact * (confidence / 100)) / (timeToImpactDays + 1) * (1 - riskScore);
}

interface PlanSelectorProps {
  plans: CrossModulePlan[];
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
  onEditPlan?: (planId: string) => void;
  confidence: number;
  timeToImpactDays: number;
  showComparison?: boolean;
}

export function PlanSelector({
  plans,
  selectedPlanId,
  onSelectPlan,
  onEditPlan,
  confidence,
  timeToImpactDays,
  showComparison = false,
}: PlanSelectorProps) {
  const [expanded, setExpanded] = useState(false);

  // Sort plans by ROI score
  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      const scoreA = calculateROIScore(a.expectedROI, confidence, timeToImpactDays, a.riskScore);
      const scoreB = calculateROIScore(b.expectedROI, confidence, timeToImpactDays, b.riskScore);
      return scoreB - scoreA;
    });
  }, [plans, confidence, timeToImpactDays]);

  const bestPlan = sortedPlans[0];
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const getRiskLabel = (riskScore: number) => {
    if (riskScore <= 0.25) return { label: 'Low Risk', color: 'text-green-600 bg-green-50 border-green-200' };
    if (riskScore <= 0.5) return { label: 'Medium Risk', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { label: 'High Risk', color: 'text-red-600 bg-red-50 border-red-200' };
  };

  const getPlanTypeLabel = (plan: CrossModulePlan, index: number) => {
    if (index === 0) return 'Highest ROI';
    if (plan.riskScore <= 0.2) return 'Conservative';
    if (plan.riskScore >= 0.5) return 'Aggressive';
    return 'Balanced';
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          Available Plans ({plans.length})
        </h4>
        {plans.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Collapse' : 'Compare All'}
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        )}
      </div>

      {/* Plans */}
      <RadioGroup value={selectedPlanId} onValueChange={onSelectPlan} className="space-y-2">
        {sortedPlans.map((plan, index) => {
          const roiScore = calculateROIScore(plan.expectedROI, confidence, timeToImpactDays, plan.riskScore);
          const riskInfo = getRiskLabel(plan.riskScore);
          const isBest = plan.id === bestPlan.id;
          const isSelected = plan.id === selectedPlanId;
          const planType = getPlanTypeLabel(plan, index);

          // Show all if expanded, otherwise show only selected + best
          if (!expanded && !isSelected && !isBest && index > 0) {
            return null;
          }

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative transition-all cursor-pointer",
                isSelected
                  ? "border-primary/50 bg-primary/5 shadow-sm"
                  : "hover:border-muted-foreground/30"
              )}
              onClick={() => onSelectPlan(plan.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {/* Radio */}
                  <RadioGroupItem value={plan.id} id={plan.id} className="mt-0.5" />
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Label htmlFor={plan.id} className="font-medium text-sm cursor-pointer">
                        {plan.name}
                      </Label>
                      {isBest && (
                        <Badge className="bg-primary text-primary-foreground text-[9px] gap-0.5 px-1.5">
                          <Sparkles className="h-2.5 w-2.5" />
                          {planType}
                        </Badge>
                      )}
                      {!isBest && (
                        <Badge variant="outline" className="text-[9px]">
                          {planType}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {plan.description}
                    </p>

                    {/* Metrics Row */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs font-medium">
                        ₹{plan.expectedROI}L ROI
                      </span>
                      <Badge variant="outline" className={cn("text-[9px] border", riskInfo.color)}>
                        <Shield className="h-2.5 w-2.5 mr-0.5" />
                        {riskInfo.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {plan.effortHours}h effort
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {plan.actions.length} actions
                      </span>
                    </div>

                    {/* Trade-offs (show when expanded or selected) */}
                    {(expanded || isSelected) && plan.id !== bestPlan.id && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-[10px] text-muted-foreground">
                          <span className="font-medium">vs Best Plan: </span>
                          {plan.expectedROI < bestPlan.expectedROI && (
                            <span className="text-amber-600">
                              -₹{(bestPlan.expectedROI - plan.expectedROI).toFixed(1)}L ROI
                            </span>
                          )}
                          {plan.riskScore !== bestPlan.riskScore && (
                            <span className={plan.riskScore < bestPlan.riskScore ? "text-green-600 ml-2" : "text-red-600 ml-2"}>
                              {plan.riskScore < bestPlan.riskScore ? 'Lower' : 'Higher'} risk
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ROI Score + Edit */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-primary">{roiScore.toFixed(1)}</p>
                    <p className="text-[9px] text-muted-foreground">ROI Score</p>
                    {onEditPlan && isSelected && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 mt-1 text-[10px] gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditPlan(plan.id);
                        }}
                      >
                        <Pencil className="h-2.5 w-2.5" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </RadioGroup>

      {/* Comparison Table (when expanded) */}
      {expanded && showComparison && plans.length > 1 && (
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left py-1">Plan</th>
                  <th className="text-right py-1">ROI</th>
                  <th className="text-right py-1">Risk</th>
                  <th className="text-right py-1">Effort</th>
                  <th className="text-right py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlans.map((plan) => {
                  const isSelected = plan.id === selectedPlanId;
                  return (
                    <tr 
                      key={plan.id} 
                      className={cn(
                        "border-t",
                        isSelected && "bg-primary/5"
                      )}
                    >
                      <td className="py-1.5 font-medium">
                        {plan.name}
                        {plan.id === bestPlan.id && <Sparkles className="inline h-3 w-3 ml-1 text-primary" />}
                      </td>
                      <td className="text-right py-1.5 font-medium">₹{plan.expectedROI}L</td>
                      <td className="text-right py-1.5">
                        <span className={plan.riskScore <= 0.25 ? "text-green-600" : plan.riskScore <= 0.5 ? "text-amber-600" : "text-red-600"}>
                          {(plan.riskScore * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="text-right py-1.5">{plan.effortHours}h</td>
                      <td className="text-right py-1.5">{plan.actions.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
