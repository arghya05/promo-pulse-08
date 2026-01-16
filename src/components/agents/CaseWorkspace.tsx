import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutDashboard, 
  List, 
  Search, 
  Zap, 
  BarChart3,
  Play,
  CheckCircle2,
  Eye,
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
  isExecuted: boolean;
  onStart: () => void;
  onApprove: () => void;
  onShowEvidence: () => void;
}

export function CaseWorkspace({
  problem,
  phase,
  isRunning,
  isExecuted,
  onStart,
  onApprove,
  onShowEvidence,
}: CaseWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('opt-profit');

  // Get selected plan
  const selectedPlan = useMemo(() => {
    const plans = alternativePlans[problem.id] || [];
    return plans.find(p => p.id === selectedPlanId) || problem.crossModulePlan;
  }, [problem, selectedPlanId]);

  // Dynamic CTA based on phase
  const getCTA = () => {
    if (isRunning) return { label: 'Analyzing...', icon: Play, disabled: true };
    switch (phase) {
      case 'detect': return { label: 'Run Analysis', icon: Play, disabled: false };
      case 'diagnose': return { label: 'View Options', icon: List, disabled: false };
      case 'options': return { label: `Approve & Execute`, icon: Zap, disabled: false };
      case 'execute': return { label: 'Monitor Outcomes', icon: Eye, disabled: false };
      case 'measure': return { label: 'Re-run Analysis', icon: Play, disabled: false };
      default: return { label: 'Run Analysis', icon: Play, disabled: false };
    }
  };

  const cta = getCTA();
  const CTAIcon = cta.icon;

  const handleCTA = () => {
    if (phase === 'detect') {
      onStart();
    } else if (phase === 'options') {
      onApprove();
      setActiveTab('execute');
    } else if (phase === 'diagnose') {
      setActiveTab('options');
    } else if (phase === 'execute') {
      setActiveTab('measure');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Summary Strip - Always visible */}
      <div className="shrink-0 p-4 border-b">
        <CaseSummaryStrip 
          problem={problem} 
          onShowEvidence={onShowEvidence}
        />
      </div>

      {/* Tabbed Workspace */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 px-4 pt-3 border-b">
          <TabsList className="grid w-full grid-cols-5 h-9">
            <TabsTrigger value="summary" className="text-xs gap-1.5">
              <LayoutDashboard className="h-3 w-3" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="options" className="text-xs gap-1.5">
              <List className="h-3 w-3" />
              Options
            </TabsTrigger>
            <TabsTrigger value="digger" className="text-xs gap-1.5">
              <Search className="h-3 w-3" />
              Deep Digger
            </TabsTrigger>
            <TabsTrigger value="execute" className="text-xs gap-1.5">
              <Zap className="h-3 w-3" />
              Execute
            </TabsTrigger>
            <TabsTrigger value="measure" className="text-xs gap-1.5">
              <BarChart3 className="h-3 w-3" />
              Measure
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            <TabsContent value="summary" className="mt-0 space-y-4">
              {/* Diagnosis */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Diagnosis</h4>
                <p className="text-sm">{problem.rootCauses[0]?.hypothesis || problem.summary}</p>
              </div>

              {/* What's changing */}
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

              {/* Primary CTA */}
              <Button 
                size="lg" 
                className="w-full gap-2 mt-4" 
                onClick={handleCTA}
                disabled={cta.disabled || isRunning}
              >
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
                onApprovePlan={(id) => { setSelectedPlanId(id); onApprove(); setActiveTab('execute'); }}
              />
            </TabsContent>

            <TabsContent value="digger" className="mt-0">
              <DeepDiggerTab problem={problem} />
            </TabsContent>

            <TabsContent value="execute" className="mt-0">
              <ExecuteTab 
                plan={selectedPlan}
                onApproveAll={onApprove}
              />
            </TabsContent>

            <TabsContent value="measure" className="mt-0">
              <MeasureTab 
                problem={problem}
                plan={selectedPlan}
                isExecuted={isExecuted}
              />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
