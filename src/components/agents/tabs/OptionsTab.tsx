import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  TrendingUp, 
  Shield, 
  Clock, 
  Zap,
  CheckCircle2,
  Eye,
  GitCompare,
  Sparkles,
  Package,
  Megaphone,
  DollarSign,
  Grid3X3,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrossModulePlan, ModuleType, alternativePlans, CrossModuleProblem } from '../cross-module-data';

interface OptionsTabProps {
  problem: CrossModuleProblem;
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
  onViewPlan: (planId: string) => void;
  onApprovePlan: (planId: string) => void;
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

// Generate options from problem data
function generateOptions(problem: CrossModuleProblem): CrossModulePlan[] {
  const basePlan = problem.crossModulePlan;
  const alts = alternativePlans[problem.id] || [];
  
  // Create standard option set if not enough alternatives
  if (alts.length < 3 && basePlan) {
    const options: CrossModulePlan[] = [
      { ...basePlan, id: 'opt-profit', name: 'Profit-Protect', description: 'Maximize margin recovery with minimal risk' },
      {
        ...basePlan,
        id: 'opt-service',
        name: 'Service-Protect',
        description: 'Prioritize customer experience over margin',
        expectedROI: basePlan.expectedROI * 0.7,
        riskScore: basePlan.riskScore * 0.6,
        effortHours: basePlan.effortHours * 1.5,
      },
      {
        ...basePlan,
        id: 'opt-aggressive',
        name: 'Revenue-Max',
        description: 'Aggressive action for maximum revenue recovery',
        expectedROI: basePlan.expectedROI * 1.2,
        riskScore: Math.min(0.6, basePlan.riskScore * 1.8),
        effortHours: basePlan.effortHours * 1.2,
      },
      {
        id: 'opt-nothing',
        name: 'Do Nothing',
        description: 'Monitor only, no action taken',
        expectedROI: 0,
        riskScore: 0.7,
        effortHours: 0,
        actions: [],
      },
    ];
    return options;
  }
  
  return alts.length > 0 ? alts : (basePlan ? [basePlan] : []);
}

export function OptionsTab({ 
  problem, 
  selectedPlanId, 
  onSelectPlan, 
  onViewPlan,
  onApprovePlan,
}: OptionsTabProps) {
  const [showCompare, setShowCompare] = useState(false);
  const options = generateOptions(problem);

  const getRiskLabel = (riskScore: number) => {
    if (riskScore <= 0.25) return { label: 'Low', color: 'text-green-600 bg-green-50' };
    if (riskScore <= 0.5) return { label: 'Med', color: 'text-amber-600 bg-amber-50' };
    return { label: 'High', color: 'text-red-600 bg-red-50' };
  };

  const getEffortLabel = (hours: number) => {
    if (hours <= 3) return 'S';
    if (hours <= 8) return 'M';
    return 'L';
  };

  const getModulesFromPlan = (plan: CrossModulePlan): ModuleType[] => {
    const modules = new Set<ModuleType>();
    plan.actions.forEach(a => modules.add(a.module));
    return Array.from(modules);
  };

  // Find best option (highest ROI)
  const bestOption = options.reduce((best, opt) => 
    opt.expectedROI > best.expectedROI ? opt : best, options[0]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Available Options</h3>
          <p className="text-xs text-muted-foreground">Select a plan to view details or approve</p>
        </div>
        <Button 
          variant={showCompare ? "default" : "outline"} 
          size="sm" 
          className="gap-1.5 text-xs"
          onClick={() => setShowCompare(!showCompare)}
        >
          <GitCompare className="h-3.5 w-3.5" />
          Compare
        </Button>
      </div>

      {/* Comparison Table */}
      {showCompare && (
        <Card>
          <CardContent className="p-3">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-[140px]">Option</TableHead>
                    <TableHead className="text-xs text-right">ROI</TableHead>
                    <TableHead className="text-xs text-right">Risk</TableHead>
                    <TableHead className="text-xs text-right">Time</TableHead>
                    <TableHead className="text-xs text-right">Effort</TableHead>
                    <TableHead className="text-xs text-right">Margin Δ</TableHead>
                    <TableHead className="text-xs text-right">Guardrails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {options.map(opt => {
                    const risk = getRiskLabel(opt.riskScore);
                    const isSelected = opt.id === selectedPlanId;
                    const isBest = opt.id === bestOption.id;
                    return (
                      <TableRow 
                        key={opt.id} 
                        className={cn(
                          "cursor-pointer transition-colors",
                          isSelected && "bg-primary/5"
                        )}
                        onClick={() => onSelectPlan(opt.id)}
                      >
                        <TableCell className="text-xs font-medium">
                          {opt.name}
                          {isBest && <Sparkles className="inline h-3 w-3 ml-1 text-primary" />}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium">
                          ₹{opt.expectedROI.toFixed(1)}L
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          <Badge variant="outline" className={cn("text-[9px]", risk.color)}>
                            {risk.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {opt.effortHours > 0 ? `${opt.effortHours}h` : '-'}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {getEffortLabel(opt.effortHours)}
                        </TableCell>
                        <TableCell className="text-xs text-right text-green-600">
                          +{(opt.expectedROI * 0.18).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {opt.riskScore <= 0.3 ? '5/5' : opt.riskScore <= 0.5 ? '4/5' : '3/5'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Option Cards */}
      <div className="space-y-3">
        {options.map((opt, idx) => {
          const risk = getRiskLabel(opt.riskScore);
          const modules = getModulesFromPlan(opt);
          const isSelected = opt.id === selectedPlanId;
          const isBest = opt.id === bestOption.id;

          return (
            <Card 
              key={opt.id}
              className={cn(
                "transition-all cursor-pointer",
                isSelected ? "border-primary/50 bg-primary/5" : "hover:border-muted-foreground/30",
                isBest && "ring-1 ring-primary/30"
              )}
              onClick={() => onSelectPlan(opt.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{opt.name}</span>
                      {isBest && (
                        <Badge className="bg-primary text-primary-foreground text-[9px] gap-0.5">
                          <Sparkles className="h-2.5 w-2.5" />
                          Highest ROI
                        </Badge>
                      )}
                      {opt.riskScore > 0.5 && (
                        <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300">
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                          Guardrails may block
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
                    
                    {/* Metrics */}
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-primary" />
                        <span className="text-sm font-bold">₹{opt.expectedROI.toFixed(1)}L</span>
                        <span className="text-[9px] text-muted-foreground">(±₹{(opt.expectedROI * 0.2).toFixed(1)}L)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline" className={cn("text-[9px]", risk.color)}>
                          {risk.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{opt.effortHours > 0 ? `${opt.effortHours}h` : 'None'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{getEffortLabel(opt.effortHours)}</span>
                      </div>
                    </div>

                    {/* Modules affected */}
                    {modules.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-muted-foreground">Modules:</span>
                        {modules.slice(0, 4).map(m => {
                          const Icon = moduleIcons[m];
                          return (
                            <Badge key={m} variant="secondary" className="text-[8px] gap-0.5 px-1">
                              <Icon className="h-2.5 w-2.5" />
                              {m.slice(0, 5)}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewPlan(opt.id);
                      }}
                    >
                      <Eye className="h-3 w-3" />
                      View Plan
                    </Button>
                    <Button 
                      size="sm" 
                      className="text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApprovePlan(opt.id);
                      }}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
