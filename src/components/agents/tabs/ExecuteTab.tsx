import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle2, 
  Clock, 
  Loader2, 
  AlertTriangle, 
  RotateCcw,
  User,
  Bot,
  Shield,
  ChevronDown,
  ChevronUp,
  Package,
  Megaphone,
  DollarSign,
  Grid3X3,
  TrendingUp,
  Zap,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrossModulePlan, CrossModuleAction, ModuleType } from '../cross-module-data';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ExecuteTabProps {
  plan: CrossModulePlan | null;
  onApproveAll?: () => void;
  onApproveAction?: (actionId: string) => void;
  onRequestChanges?: () => void;
  executionState?: Record<string, ActionExecutionState>;
}

interface ActionExecutionState {
  status: 'proposed' | 'approved' | 'executing' | 'done' | 'failed';
  retryCount?: number;
  error?: string;
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

const moduleLabels: Record<ModuleType, string> = {
  inventory: 'Inventory',
  allocation: 'Allocation',
  promo: 'Promotions',
  pricing: 'Pricing',
  assortment: 'Assortment',
  space: 'Space',
  demand: 'Demand',
  supply: 'Supply',
};

export function ExecuteTab({ 
  plan, 
  onApproveAll, 
  onApproveAction, 
  onRequestChanges,
  executionState = {},
}: ExecuteTabProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['all']));
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p className="text-sm">Select an option to view the execution plan</p>
      </div>
    );
  }

  // Group actions by module
  const actionsByModule = plan.actions.reduce((acc, action) => {
    if (!acc[action.module]) {
      acc[action.module] = [];
    }
    acc[action.module].push(action);
    return acc;
  }, {} as Record<ModuleType, CrossModuleAction[]>);

  const modules = Object.keys(actionsByModule) as ModuleType[];

  const toggleModule = (module: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(module)) {
        next.delete(module);
      } else {
        next.add(module);
      }
      return next;
    });
  };

  const toggleAction = (actionId: string) => {
    setSelectedActions(prev => {
      const next = new Set(prev);
      if (next.has(actionId)) {
        next.delete(actionId);
      } else {
        next.add(actionId);
      }
      return next;
    });
  };

  // Count safe actions (low risk, no approval required)
  const safeActions = plan.actions.filter(a => !a.approvalRequired && a.risk === 'low');
  const pendingApproval = plan.actions.filter(a => a.approvalRequired);

  const getStatusConfig = (status: ActionExecutionState['status']) => {
    switch (status) {
      case 'proposed':
        return { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Proposed' };
      case 'approved':
        return { icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Approved' };
      case 'executing':
        return { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Executing' };
      case 'done':
        return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Done' };
      case 'failed':
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', label: 'Failed' };
      default:
        return { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Pending' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{plan.name}</h3>
          <p className="text-xs text-muted-foreground">
            {plan.actions.length} actions across {modules.length} modules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[9px] text-green-600">
            <Bot className="h-2.5 w-2.5 mr-0.5" />
            {safeActions.length} autopilot-safe
          </Badge>
          {pendingApproval.length > 0 && (
            <Badge variant="outline" className="text-[9px] text-amber-600">
              <Lock className="h-2.5 w-2.5 mr-0.5" />
              {pendingApproval.length} need approval
            </Badge>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {onApproveAll && (
          <Button size="sm" className="gap-1.5" onClick={onApproveAll}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve All Safe Actions
          </Button>
        )}
        {selectedActions.size > 0 && onApproveAction && (
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5"
            onClick={() => selectedActions.forEach(id => onApproveAction(id))}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve Selected ({selectedActions.size})
          </Button>
        )}
        {onRequestChanges && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onRequestChanges}>
            <RotateCcw className="h-3.5 w-3.5" />
            Request Changes
          </Button>
        )}
      </div>

      {/* Actions grouped by module */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-3 pr-3">
          {modules.map(module => {
            const Icon = moduleIcons[module];
            const actions = actionsByModule[module];
            const isExpanded = expandedModules.has('all') || expandedModules.has(module);

            return (
              <Collapsible key={module} open={isExpanded}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader 
                      className="py-2 px-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleModule(module)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">{moduleLabels[module]}</span>
                          <Badge variant="secondary" className="text-[9px]">
                            {actions.length} actions
                          </Badge>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-3 px-3 space-y-2">
                      {actions.map(action => {
                        const state = executionState[action.id] || { status: 'proposed' };
                        const statusConfig = getStatusConfig(state.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                          <div 
                            key={action.id}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border transition-all",
                              statusConfig.bg
                            )}
                          >
                            <Checkbox
                              checked={selectedActions.has(action.id)}
                              onCheckedChange={() => toggleAction(action.id)}
                              disabled={state.status !== 'proposed'}
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium">{action.what}</span>
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-[9px]", statusConfig.color)}
                                >
                                  <StatusIcon className={cn(
                                    "h-2.5 w-2.5 mr-0.5",
                                    state.status === 'executing' && "animate-spin"
                                  )} />
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              
                              <p className="text-xs text-muted-foreground mt-0.5">{action.why}</p>

                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                {/* Owner */}
                                <span className="flex items-center gap-1 text-[10px]">
                                  {action.approvalRequired ? (
                                    <>
                                      <User className="h-2.5 w-2.5" />
                                      Human
                                    </>
                                  ) : (
                                    <>
                                      <Bot className="h-2.5 w-2.5" />
                                      Agent
                                    </>
                                  )}
                                </span>

                                {/* Guardrails */}
                                <span className="flex items-center gap-1 text-[10px]">
                                  <Shield className="h-2.5 w-2.5" />
                                  {action.risk === 'low' ? 'Within limits' : 
                                   action.risk === 'medium' ? 'Near threshold' : 'Above threshold'}
                                </span>

                                {/* Impact */}
                                <span className="text-[10px] font-medium text-primary">
                                  ₹{action.expectedImpact}L
                                </span>

                                {/* Time */}
                                <span className="text-[10px] text-muted-foreground">
                                  {action.timeToImpact}
                                </span>

                                {/* Rollback */}
                                {state.status === 'done' && (
                                  <Badge variant="outline" className="text-[9px] text-green-600">
                                    <RotateCcw className="h-2 w-2 mr-0.5" />
                                    Rollback available
                                  </Badge>
                                )}
                              </div>

                              {/* Approval reason */}
                              {action.approvalRequired && action.approvalReason && state.status === 'proposed' && (
                                <div className="mt-2 p-2 bg-amber-50 rounded text-[10px] text-amber-700">
                                  <Lock className="h-2.5 w-2.5 inline mr-1" />
                                  {action.approvalReason}
                                </div>
                              )}

                              {/* Error */}
                              {state.status === 'failed' && state.error && (
                                <div className="mt-2 p-2 bg-red-50 rounded text-[10px] text-red-700">
                                  <AlertTriangle className="h-2.5 w-2.5 inline mr-1" />
                                  {state.error}
                                  {state.retryCount !== undefined && state.retryCount > 0 && (
                                    <span className="ml-2">({state.retryCount} retries)</span>
                                  )}
                                </div>
                              )}

                              {/* Tool call preview */}
                              <div className="mt-2 p-2 bg-muted/50 rounded text-[9px] font-mono">
                                <span className="text-primary">{action.toolCall.system}</span>
                                <span className="text-muted-foreground">.</span>
                                <span className="text-blue-600">{action.toolCall.method}</span>
                                <span className="text-muted-foreground">()</span>
                              </div>
                            </div>

                            {/* Approve button for individual action */}
                            {state.status === 'proposed' && action.approvalRequired && onApproveAction && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="shrink-0 text-[10px] h-7"
                                onClick={() => onApproveAction(action.id)}
                              >
                                Approve
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
