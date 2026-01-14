import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  RefreshCw,
  Package,
  Megaphone,
  DollarSign,
  Grid3X3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrossModulePlan, CrossModuleAction, ModuleType } from './cross-module-data';
import { calculateROIScore } from './PlanSelector';

interface EditPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: CrossModulePlan | null;
  confidence: number;
  timeToImpactDays: number;
  onSave: (updatedPlan: CrossModulePlan) => void;
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

export function EditPlanModal({
  open,
  onOpenChange,
  plan,
  confidence,
  timeToImpactDays,
  onSave,
}: EditPlanModalProps) {
  const [enabledActions, setEnabledActions] = useState<Set<string>>(new Set());
  const [riskTolerance, setRiskTolerance] = useState(30);
  const [marginFloor, setMarginFloor] = useState(18);
  const [changes, setChanges] = useState<string[]>([]);

  // Initialize state when plan changes
  useEffect(() => {
    if (plan) {
      setEnabledActions(new Set(plan.actions.map(a => a.id)));
      setRiskTolerance(Math.round(plan.riskScore * 100));
      setChanges([]);
    }
  }, [plan]);

  // Calculate adjusted metrics
  const adjustedMetrics = useMemo(() => {
    if (!plan) return null;

    const activeActions = plan.actions.filter(a => enabledActions.has(a.id));
    const newROI = activeActions.reduce((sum, a) => sum + a.expectedImpact, 0);
    const avgRisk = activeActions.length > 0
      ? activeActions.reduce((sum, a) => sum + (a.risk === 'high' ? 0.6 : a.risk === 'medium' ? 0.4 : 0.2), 0) / activeActions.length
      : 0;
    
    // Adjust risk based on tolerance slider
    const adjustedRisk = avgRisk * (riskTolerance / 30);
    const clampedRisk = Math.min(1, Math.max(0, adjustedRisk));
    
    const roiScore = calculateROIScore(newROI, confidence, timeToImpactDays, clampedRisk);

    // Check guardrails
    const guardrails = {
      marginFloor: { passed: marginFloor >= 15, value: marginFloor, threshold: 15 },
      riskCap: { passed: clampedRisk <= 0.5, value: clampedRisk * 100, threshold: 50 },
      minActions: { passed: activeActions.length >= 2, value: activeActions.length, threshold: 2 },
    };

    const allPassed = Object.values(guardrails).every(g => g.passed);

    return {
      newROI,
      adjustedRisk: clampedRisk,
      roiScore,
      guardrails,
      allPassed,
      activeCount: activeActions.length,
    };
  }, [plan, enabledActions, riskTolerance, marginFloor, confidence, timeToImpactDays]);

  const handleToggleAction = (actionId: string) => {
    const action = plan?.actions.find(a => a.id === actionId);
    setEnabledActions(prev => {
      const next = new Set(prev);
      if (next.has(actionId)) {
        next.delete(actionId);
        setChanges(c => [...c, `Disabled: ${action?.what.slice(0, 40)}...`]);
      } else {
        next.add(actionId);
        setChanges(c => [...c, `Enabled: ${action?.what.slice(0, 40)}...`]);
      }
      return next;
    });
  };

  const handleRiskChange = (value: number[]) => {
    const newVal = value[0];
    if (newVal !== riskTolerance) {
      setChanges(c => [...c, `Risk tolerance: ${riskTolerance}% → ${newVal}%`]);
      setRiskTolerance(newVal);
    }
  };

  const handleMarginChange = (value: number[]) => {
    const newVal = value[0];
    if (newVal !== marginFloor) {
      setChanges(c => [...c, `Margin floor: ${marginFloor}% → ${newVal}%`]);
      setMarginFloor(newVal);
    }
  };

  const handleSave = () => {
    if (!plan || !adjustedMetrics) return;

    const updatedPlan: CrossModulePlan = {
      ...plan,
      expectedROI: adjustedMetrics.newROI,
      riskScore: adjustedMetrics.adjustedRisk,
      actions: plan.actions.filter(a => enabledActions.has(a.id)),
    };

    onSave(updatedPlan);
    onOpenChange(false);
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Plan: {plan.name}
          </DialogTitle>
          <DialogDescription>
            Toggle actions, adjust thresholds, and see impact recalculated in real-time.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-4">
            {/* Live Metrics */}
            {adjustedMetrics && (
              <Card className={cn(
                "border-l-4",
                adjustedMetrics.allPassed ? "border-l-green-500 bg-green-50/50" : "border-l-amber-500 bg-amber-50/50"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Live Impact Preview</span>
                    {changes.length > 0 && (
                      <Badge variant="outline" className="text-[9px] gap-1">
                        <RefreshCw className="h-2.5 w-2.5" />
                        {changes.length} change{changes.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-primary">₹{adjustedMetrics.newROI.toFixed(1)}L</p>
                      <p className="text-[10px] text-muted-foreground">Expected ROI</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{adjustedMetrics.roiScore.toFixed(1)}</p>
                      <p className="text-[10px] text-muted-foreground">ROI Score</p>
                    </div>
                    <div>
                      <p className={cn(
                        "text-lg font-bold",
                        adjustedMetrics.adjustedRisk <= 0.25 ? "text-green-600" :
                        adjustedMetrics.adjustedRisk <= 0.5 ? "text-amber-600" : "text-red-600"
                      )}>
                        {(adjustedMetrics.adjustedRisk * 100).toFixed(0)}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">Risk</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{adjustedMetrics.activeCount}</p>
                      <p className="text-[10px] text-muted-foreground">Actions</p>
                    </div>
                  </div>

                  {/* Guardrail Status */}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t flex-wrap">
                    {Object.entries(adjustedMetrics.guardrails).map(([key, g]) => (
                      <span key={key} className={cn(
                        "flex items-center gap-1 text-[10px]",
                        g.passed ? "text-green-600" : "text-amber-600"
                      )}>
                        {g.passed ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        {key === 'marginFloor' && `Margin ≥${g.threshold}%`}
                        {key === 'riskCap' && `Risk ≤${g.threshold}%`}
                        {key === 'minActions' && `≥${g.threshold} actions`}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Change Explanation */}
            {changes.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-medium mb-1">Because you changed:</p>
                <ul className="space-y-0.5">
                  {changes.slice(-3).map((change, i) => (
                    <li key={i} className="text-xs text-muted-foreground">• {change}</li>
                  ))}
                </ul>
                {adjustedMetrics && (
                  <p className="text-xs font-medium mt-2 text-primary">
                    I adjusted ROI to ₹{adjustedMetrics.newROI.toFixed(1)}L and risk to {(adjustedMetrics.adjustedRisk * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            )}

            {/* Thresholds */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Thresholds</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Risk Tolerance</Label>
                  <span className="text-sm font-medium">{riskTolerance}%</span>
                </div>
                <Slider
                  value={[riskTolerance]}
                  onValueChange={handleRiskChange}
                  min={10}
                  max={60}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Margin Floor</Label>
                  <span className="text-sm font-medium">{marginFloor}%</span>
                </div>
                <Slider
                  value={[marginFloor]}
                  onValueChange={handleMarginChange}
                  min={10}
                  max={30}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                Actions ({enabledActions.size}/{plan.actions.length} enabled)
              </h4>
              
              <div className="space-y-2">
                {plan.actions.map((action) => {
                  const Icon = moduleIcons[action.module] || Package;
                  const isEnabled = enabledActions.has(action.id);
                  
                  return (
                    <div
                      key={action.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-all",
                        isEnabled ? "bg-background" : "bg-muted/30 opacity-60"
                      )}
                    >
                      <Checkbox
                        id={action.id}
                        checked={isEnabled}
                        onCheckedChange={() => handleToggleAction(action.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <Label htmlFor={action.id} className="text-sm font-medium cursor-pointer">
                            {action.what}
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{action.why}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[9px]">₹{action.expectedImpact}L</Badge>
                          <Badge variant="outline" className="text-[9px]">{action.timeToImpact}</Badge>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[9px]",
                              action.risk === 'low' ? "text-green-600" :
                              action.risk === 'medium' ? "text-amber-600" : "text-red-600"
                            )}
                          >
                            {action.risk} risk
                          </Badge>
                          {action.approvalRequired && (
                            <Badge variant="outline" className="text-[9px] text-amber-600">Needs approval</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!adjustedMetrics?.allPassed}
            className="gap-1.5"
          >
            <CheckCircle2 className="h-4 w-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
