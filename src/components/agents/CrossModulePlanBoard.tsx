import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Package,
  Shuffle,
  Megaphone,
  DollarSign,
  Grid3X3,
  LayoutGrid,
  ArrowRight,
  AlertTriangle,
  Shield,
  FileText,
  Clock,
  Link2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrossModuleAction, ModuleType, CrossModulePlan } from './cross-module-data';
import { useState } from 'react';

interface CrossModulePlanBoardProps {
  plan: CrossModulePlan;
  selectedActions: Set<string>;
  onToggleAction: (actionId: string) => void;
  onViewEvidence: (evidenceId: string) => void;
  showToolCalls?: boolean;
}

const moduleConfig: Record<ModuleType, { icon: typeof Package; label: string; color: string; bg: string }> = {
  inventory: { icon: Package, label: 'Inventory/Replenishment', color: 'text-blue-600', bg: 'bg-blue-500/10 border-blue-500/20' },
  allocation: { icon: Shuffle, label: 'Allocation/Transfers', color: 'text-cyan-600', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  promo: { icon: Megaphone, label: 'Promo', color: 'text-orange-600', bg: 'bg-orange-500/10 border-orange-500/20' },
  pricing: { icon: DollarSign, label: 'Pricing', color: 'text-green-600', bg: 'bg-green-500/10 border-green-500/20' },
  assortment: { icon: Grid3X3, label: 'Assortment/Substitution', color: 'text-purple-600', bg: 'bg-purple-500/10 border-purple-500/20' },
  space: { icon: LayoutGrid, label: 'Space/Planogram', color: 'text-pink-600', bg: 'bg-pink-500/10 border-pink-500/20' },
  demand: { icon: Package, label: 'Demand', color: 'text-indigo-600', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  supply: { icon: Package, label: 'Supply Chain', color: 'text-teal-600', bg: 'bg-teal-500/10 border-teal-500/20' },
};

export function CrossModulePlanBoard({
  plan,
  selectedActions,
  onToggleAction,
  onViewEvidence,
  showToolCalls = false,
}: CrossModulePlanBoardProps) {
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());

  // Group actions by module
  const actionsByModule = plan.actions.reduce((acc, action) => {
    if (!acc[action.module]) acc[action.module] = [];
    acc[action.module].push(action);
    return acc;
  }, {} as Record<ModuleType, CrossModuleAction[]>);

  const moduleOrder: ModuleType[] = ['inventory', 'allocation', 'promo', 'pricing', 'assortment', 'space'];

  const toggleExpand = (actionId: string) => {
    setExpandedActions(prev => {
      const next = new Set(prev);
      if (next.has(actionId)) next.delete(actionId);
      else next.add(actionId);
      return next;
    });
  };

  const selectedCount = selectedActions.size;
  const totalImpact = plan.actions
    .filter(a => selectedActions.has(a.id))
    .reduce((sum, a) => sum + a.expectedImpact, 0);

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div>
          <h3 className="text-sm font-semibold">{plan.name}</h3>
          <p className="text-xs text-muted-foreground">{plan.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Selected</p>
            <p className="text-sm font-semibold">{selectedCount}/{plan.actions.length} actions</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Expected ROI</p>
            <p className="text-sm font-bold text-primary">₹{totalImpact.toFixed(1)}L</p>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              plan.riskScore <= 0.25 ? "bg-green-500/10 text-green-600 border-green-500/30" :
              plan.riskScore <= 0.5 ? "bg-amber-500/10 text-amber-600 border-amber-500/30" :
              "bg-red-500/10 text-red-600 border-red-500/30"
            )}
          >
            Risk: {(plan.riskScore * 100).toFixed(0)}%
          </Badge>
        </div>
      </div>

      {/* Module Columns */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-4 pr-3">
          {moduleOrder.map(moduleType => {
            const actions = actionsByModule[moduleType];
            if (!actions?.length) return null;

            const config = moduleConfig[moduleType];
            const Icon = config.icon;

            return (
              <Card key={moduleType} className={cn("border", config.bg)}>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs font-semibold flex items-center gap-2">
                    <Icon className={cn("h-3.5 w-3.5", config.color)} />
                    <span className={config.color}>{config.label}</span>
                    <Badge variant="secondary" className="text-[9px] ml-auto">
                      {actions.length} action{actions.length > 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-3 space-y-2">
                  {actions.map((action) => (
                    <ActionCard
                      key={action.id}
                      action={action}
                      isSelected={selectedActions.has(action.id)}
                      isExpanded={expandedActions.has(action.id)}
                      onToggle={() => onToggleAction(action.id)}
                      onExpand={() => toggleExpand(action.id)}
                      onViewEvidence={() => onViewEvidence(action.evidenceId)}
                      showToolCall={showToolCalls}
                      allActions={plan.actions}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

interface ActionCardProps {
  action: CrossModuleAction;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onViewEvidence: () => void;
  showToolCall: boolean;
  allActions: CrossModuleAction[];
}

function ActionCard({
  action,
  isSelected,
  isExpanded,
  onToggle,
  onExpand,
  onViewEvidence,
  showToolCall,
  allActions,
}: ActionCardProps) {
  const dependencyNames = action.dependsOn.map(depId => {
    const dep = allActions.find(a => a.id === depId);
    return dep?.what.slice(0, 30) + '...' || depId;
  });

  return (
    <div className={cn(
      "p-3 rounded-lg border transition-all",
      isSelected ? "bg-primary/5 border-primary/30" : "bg-background border-transparent hover:border-border"
    )}>
      <div className="flex items-start gap-2">
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={onToggle}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          {/* What */}
          <p className="text-sm font-medium leading-tight">{action.what}</p>
          
          {/* Why */}
          <p className="text-xs text-muted-foreground mt-1">{action.why}</p>

          {/* Badges Row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className="text-[9px]">
              ₹{action.expectedImpact}L
            </Badge>
            <Badge variant="outline" className="text-[9px] flex items-center gap-0.5">
              <Clock className="h-2 w-2" />
              {action.timeToImpact}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn(
                "text-[9px]",
                action.risk === 'low' ? "bg-green-500/10 text-green-600" :
                action.risk === 'medium' ? "bg-amber-500/10 text-amber-600" :
                "bg-red-500/10 text-red-600"
              )}
            >
              {action.risk} risk
            </Badge>
            {action.approvalRequired && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-600">
                      <Shield className="h-2 w-2 mr-0.5" />
                      Approval
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <p className="text-xs">{action.approvalReason}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Dependencies */}
          {dependencyNames.length > 0 && (
            <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
              <Link2 className="h-2.5 w-2.5" />
              <span>Depends on:</span>
              {dependencyNames.map((name, i) => (
                <Badge key={i} variant="secondary" className="text-[9px]">{name}</Badge>
              ))}
            </div>
          )}

          {/* Expandable Tool Call */}
          {showToolCall && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] gap-1 p-0"
                onClick={onExpand}
              >
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                View tool call
              </Button>
              
              {isExpanded && (
                <div className="mt-2 p-2 bg-muted/50 rounded text-[10px] font-mono">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[9px]">{action.toolCall.system}</Badge>
                    <span className="text-primary">{action.toolCall.method}</span>
                  </div>
                  <pre className="whitespace-pre-wrap text-muted-foreground overflow-x-auto">
                    {JSON.stringify(action.toolCall.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[10px] shrink-0"
          onClick={onViewEvidence}
        >
          <FileText className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// Plan selector for choosing between alternatives
interface PlanSelectorProps {
  plans: CrossModulePlan[];
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
}

export function PlanSelector({ plans, selectedPlanId, onSelectPlan }: PlanSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {plans.map((plan) => (
        <button
          key={plan.id}
          onClick={() => onSelectPlan(plan.id)}
          className={cn(
            "p-3 rounded-lg border text-left transition-all",
            selectedPlanId === plan.id 
              ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" 
              : "bg-muted/30 border-transparent hover:border-border"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">{plan.name}</span>
            {selectedPlanId === plan.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{plan.description}</p>
          <div className="flex items-center gap-2">
            <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20">
              ₹{plan.expectedROI}L ROI
            </Badge>
            <Badge 
              variant="outline" 
              className={cn(
                "text-[9px]",
                plan.riskScore <= 0.25 ? "text-green-600" :
                plan.riskScore <= 0.5 ? "text-amber-600" :
                "text-red-600"
              )}
            >
              {(plan.riskScore * 100).toFixed(0)}% risk
            </Badge>
          </div>
        </button>
      ))}
    </div>
  );
}
