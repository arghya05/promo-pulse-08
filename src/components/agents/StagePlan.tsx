import { useState } from 'react';
import { Action, Guardrails } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NextStepPreview } from './NextStepPreview';
import { GuardrailsModal } from './GuardrailsModal';
import { TrendingUp, Check, Settings, RefreshCw, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StagePlanProps {
  actions: Action[];
  guardrails: Guardrails;
  isCompleted: boolean;
  onApprovePlan: () => void;
  onEditGuardrails: (guardrails: Guardrails) => void;
  onGenerateAlternatives: () => void;
}

const planOptions = [
  {
    id: 'plan-a',
    title: 'Emergency restocking',
    expectedROI: 14.2,
    risk: 'low' as const,
    effort: 'Medium',
    timeToImpact: '48h',
    guardrailStatus: 'pass' as const,
    actions: ['Trigger emergency PO for top 8 SKUs', 'Activate backup supplier', 'Redistribute stock']
  },
  {
    id: 'plan-b',
    title: 'Demand smoothing',
    expectedROI: 8.6,
    risk: 'med' as const,
    effort: 'Low',
    timeToImpact: '24h',
    guardrailStatus: 'pass' as const,
    actions: ['Enable substitute recommendations', 'Adjust allocation rules', 'Limit qty per customer']
  },
  {
    id: 'plan-c',
    title: 'Price adjustment',
    expectedROI: 5.2,
    risk: 'high' as const,
    effort: 'Low',
    timeToImpact: '4h',
    guardrailStatus: 'fail' as const,
    actions: ['Increase price 10%', 'Remove from promotions', 'Suppress from search']
  }
];

export function StagePlan({ 
  actions, 
  guardrails, 
  isCompleted, 
  onApprovePlan, 
  onEditGuardrails, 
  onGenerateAlternatives 
}: StagePlanProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('plan-a');
  const [showGuardrails, setShowGuardrails] = useState(false);
  const [showNextPreview, setShowNextPreview] = useState(false);

  const handleApprove = () => {
    setShowNextPreview(true);
    setTimeout(() => onApprovePlan(), 1500);
  };

  if (isCompleted) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="h-3.5 w-3.5 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              Plan approved: Emergency restocking (+₹14.2L expected)
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Plan Options */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3" />
            Plan options
            <Badge variant="secondary" className="text-[9px] ml-1">Planner Agent</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {planOptions.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all",
                selectedPlan === plan.id
                  ? "bg-primary/5 border-primary/30 shadow-sm"
                  : "hover:bg-muted/50"
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    selectedPlan === plan.id ? "border-primary bg-primary" : "border-muted-foreground"
                  )}>
                    {selectedPlan === plan.id && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                  </div>
                  <span className="text-sm font-medium">{plan.title}</span>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                  +₹{plan.expectedROI}L
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[9px]",
                    plan.risk === 'low' && "text-green-600 border-green-200",
                    plan.risk === 'med' && "text-amber-600 border-amber-200",
                    plan.risk === 'high' && "text-red-600 border-red-200"
                  )}
                >
                  {plan.risk === 'low' ? 'Low' : plan.risk === 'med' ? 'Medium' : 'High'} risk
                </Badge>
                <Badge variant="outline" className="text-[9px]">
                  {plan.effort} effort
                </Badge>
                <Badge variant="outline" className="text-[9px]">
                  {plan.timeToImpact} to impact
                </Badge>
                {plan.guardrailStatus === 'fail' && (
                  <Badge variant="outline" className="text-[9px] text-red-600 border-red-200 gap-0.5">
                    <Shield className="h-2 w-2" />
                    Guardrail violation
                  </Badge>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground">
                {plan.actions.join(' → ')}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Human Gate */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
              <TrendingUp className="h-3 w-3 text-amber-600" />
            </div>
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Choose a plan and constraints
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              className="gap-1.5 bg-primary hover:bg-primary/90"
              onClick={handleApprove}
              disabled={showNextPreview}
            >
              <Check className="h-3 w-3" />
              Approve plan → Prepare execution
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="gap-1.5"
              onClick={() => setShowGuardrails(true)}
            >
              <Settings className="h-3 w-3" />
              Edit constraints
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              className="gap-1.5"
              onClick={onGenerateAlternatives}
            >
              <RefreshCw className="h-3 w-3" />
              Generate alternative plans
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Next Step Preview */}
      {showNextPreview && (
        <NextStepPreview
          title="Preparing execution checklist"
          description="Execution agent will prepare change sets and identify approval requirements."
          eta="~20s"
        />
      )}

      {/* Guardrails Modal */}
      <GuardrailsModal
        open={showGuardrails}
        onOpenChange={setShowGuardrails}
        guardrails={guardrails}
        onSave={onEditGuardrails}
      />
    </div>
  );
}
