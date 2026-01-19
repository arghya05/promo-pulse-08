import { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  LayoutDashboard, 
  List, 
  Search, 
  Zap, 
  BarChart3,
  Play,
  CheckCircle2,
  Eye,
  Loader2,
  ArrowRight,
  Radar,
  Stethoscope,
  ListChecks,
  Circle,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrossModuleProblem, CrossModulePlan, alternativePlans } from './cross-module-data';
import { CaseSummaryStrip } from './CaseSummaryStrip';
import { OptionsTab } from './tabs/OptionsTab';
import { DeepDiggerTab } from './tabs/DeepDiggerTab';
import { ExecuteTab } from './tabs/ExecuteTab';
import { MeasureTab } from './tabs/MeasureTab';

export type CasePhase = 'detect' | 'diagnose' | 'options' | 'execute' | 'measure';

interface CaseWorkspaceProps {
  problem: CrossModuleProblem;
  phase: CasePhase;
  isRunning: boolean;
  runProgress?: number;
  currentAgentName?: string;
  onStart: () => void;
  onApprove: () => void;
  onShowEvidence: () => void;
}

// Inline stepper component
const steps: { id: CasePhase; label: string; icon: typeof Radar }[] = [
  { id: 'detect', label: 'Detect', icon: Radar },
  { id: 'diagnose', label: 'Diagnose', icon: Stethoscope },
  { id: 'options', label: 'Options', icon: ListChecks },
  { id: 'execute', label: 'Execute', icon: Zap },
  { id: 'measure', label: 'Measure', icon: BarChart3 },
];

const phaseOrder: CasePhase[] = ['detect', 'diagnose', 'options', 'execute', 'measure'];

function PhaseStepper({ currentPhase, isRunning }: { currentPhase: CasePhase; isRunning: boolean }) {
  const currentIndex = phaseOrder.indexOf(currentPhase);

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = step.id === currentPhase;
        const isComplete = index < currentIndex;
        const isPending = index > currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium transition-all",
              isActive && "bg-primary text-primary-foreground",
              isComplete && "bg-green-100 text-green-700",
              isPending && "bg-muted text-muted-foreground"
            )}>
              {isActive && isRunning ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isComplete ? (
                <Check className="h-3 w-3" />
              ) : isActive ? (
                <Icon className="h-3 w-3" />
              ) : (
                <Circle className="h-2.5 w-2.5" />
              )}
              <span className={cn(isPending && "hidden sm:inline")}>{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "w-4 h-0.5 mx-0.5",
                index < currentIndex ? "bg-green-400" : "bg-border"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Map phase to tab
const phaseToTab: Record<CasePhase, string> = {
  detect: 'summary',
  diagnose: 'summary',
  options: 'options',
  execute: 'execute',
  measure: 'measure',
};

export function CaseWorkspace({
  problem,
  phase,
  isRunning,
  runProgress = 0,
  currentAgentName,
  onStart,
  onApprove,
  onShowEvidence,
}: CaseWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('opt-profit');

  useEffect(() => {
    const targetTab = phaseToTab[phase];
    if (targetTab !== activeTab) {
      setActiveTab(targetTab);
    }
  }, [phase]);

  const selectedPlan = useMemo(() => {
    const plans = alternativePlans[problem.id] || [];
    return plans.find(p => p.id === selectedPlanId) || problem.crossModulePlan;
  }, [problem, selectedPlanId]);

  const getCTA = () => {
    if (isRunning) return { label: `Analyzing${currentAgentName ? `: ${currentAgentName}` : '...'}`, icon: Loader2, disabled: true };
    switch (phase) {
      case 'detect': return { label: 'Run Analysis', icon: Play, disabled: false };
      case 'diagnose': return { label: 'View Options', icon: ArrowRight, disabled: false };
      case 'options': return { label: 'Approve & Execute', icon: Zap, disabled: false };
      case 'execute': return { label: 'Monitor Outcomes', icon: BarChart3, disabled: false };
      case 'measure': return { label: 'View Results', icon: Eye, disabled: false };
      default: return { label: 'Run Analysis', icon: Play, disabled: false };
    }
  };

  const cta = getCTA();
  const CTAIcon = cta.icon;

  const handleCTA = () => {
    if (phase === 'detect') onStart();
    else if (phase === 'options') onApprove();
    else if (phase === 'diagnose') setActiveTab('options');
    else if (phase === 'execute') onApprove();
    else if (phase === 'measure') setActiveTab('measure');
  };

  const isExecuted = phase === 'measure' || phase === 'execute';

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-4 pt-3 pb-2 border-b bg-muted/30">
        <PhaseStepper currentPhase={phase} isRunning={isRunning} />
      </div>

      <div className="shrink-0 p-4 border-b">
        <CaseSummaryStrip problem={problem} onShowEvidence={onShowEvidence} />
      </div>

      {isRunning && (
        <div className="shrink-0 px-4 py-2 bg-primary/5 border-b">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">{currentAgentName || 'Processing'}...</p>
              <Progress value={runProgress} className="h-1 mt-1" />
            </div>
            <span className="text-xs text-muted-foreground">{runProgress}%</span>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 px-4 pt-3 border-b">
          <TabsList className="grid w-full grid-cols-5 h-9">
            <TabsTrigger value="summary" className="text-xs gap-1.5">
              <LayoutDashboard className="h-3 w-3" />Summary
            </TabsTrigger>
            <TabsTrigger value="options" className="text-xs gap-1.5">
              <List className="h-3 w-3" />Options
              {phase === 'options' && <Badge className="ml-1 h-4 px-1 text-[8px] bg-primary">!</Badge>}
            </TabsTrigger>
            <TabsTrigger value="digger" className="text-xs gap-1.5">
              <Search className="h-3 w-3" />Deep Digger
            </TabsTrigger>
            <TabsTrigger value="execute" className="text-xs gap-1.5">
              <Zap className="h-3 w-3" />Execute
            </TabsTrigger>
            <TabsTrigger value="measure" className="text-xs gap-1.5">
              <BarChart3 className="h-3 w-3" />Measure
              {phase === 'measure' && <Badge className="ml-1 h-4 px-1 text-[8px] bg-green-500">✓</Badge>}
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            <TabsContent value="summary" className="mt-0 space-y-4">
              <div className={cn(
                "rounded-lg p-3",
                phase === 'detect' && "bg-blue-50 border border-blue-200",
                phase === 'diagnose' && "bg-amber-50 border border-amber-200",
              )}>
                <p className="text-sm font-medium">
                  {phase === 'detect' && "Ready to analyze. Click 'Run Analysis' to start."}
                  {phase === 'diagnose' && "Analysis complete. Review options or dig deeper."}
                  {phase === 'options' && "Review and select an execution plan."}
                  {phase === 'execute' && "Plan approved. Executing actions..."}
                  {phase === 'measure' && "Execution complete. Tracking outcomes."}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Diagnosis</h4>
                <p className="text-sm">{problem.rootCauses[0]?.hypothesis || problem.summary}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">What's Changing</h4>
                <ul className="space-y-1">
                  {problem.signals.slice(0, 4).map(s => (
                    <li key={s.id} className="text-sm flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{s.value} <span className="text-muted-foreground">({s.delta})</span></span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button size="lg" className="w-full gap-2 mt-4" onClick={handleCTA} disabled={cta.disabled || isRunning}>
                <CTAIcon className={cn("h-4 w-4", isRunning && "animate-spin")} />
                {cta.label}
              </Button>
            </TabsContent>

            <TabsContent value="options" className="mt-0">
              <OptionsTab
                problem={problem}
                selectedPlanId={selectedPlanId}
                onSelectPlan={setSelectedPlanId}
                onViewPlan={(id) => { setSelectedPlanId(id); setActiveTab('execute'); }}
                onApprovePlan={(id) => { setSelectedPlanId(id); onApprove(); }}
              />
            </TabsContent>

            <TabsContent value="digger" className="mt-0">
              <DeepDiggerTab problem={problem} />
            </TabsContent>

            <TabsContent value="execute" className="mt-0">
              <ExecuteTab plan={selectedPlan} onApproveAll={onApprove} />
            </TabsContent>

            <TabsContent value="measure" className="mt-0">
              <MeasureTab problem={problem} plan={selectedPlan} isExecuted={isExecuted} />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
