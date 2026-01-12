import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Play, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { crossModuleProblems, CrossModuleProblem, alternativePlans, ModuleType } from './cross-module-data';
import { useAgentOrchestrator } from './AgentOrchestrator';
import { LiveAgentPanel } from './LiveAgentPanel';
import { ApprovalGateCard, CompletedGate } from './ApprovalGateCard';
import { CrossModulePlanBoard, PlanSelector } from './CrossModulePlanBoard';
import { AgentPipelineRibbon, AgentStage, StageStatus } from './AgentPipelineRibbon';
import { EvidenceStrip } from './EvidenceStrip';

interface RadarViewProps {
  mode: 'advisory' | 'autopilot';
  onCreateRun: (problemId: string, problemTitle: string, playbook: string) => void;
}

const moduleColors: Record<ModuleType, string> = {
  inventory: 'bg-blue-500/10 text-blue-600',
  allocation: 'bg-cyan-500/10 text-cyan-600',
  promo: 'bg-orange-500/10 text-orange-600',
  pricing: 'bg-green-500/10 text-green-600',
  assortment: 'bg-purple-500/10 text-purple-600',
  space: 'bg-pink-500/10 text-pink-600',
  demand: 'bg-indigo-500/10 text-indigo-600',
  supply: 'bg-teal-500/10 text-teal-600',
};

export function RadarView({ mode, onCreateRun }: RadarViewProps) {
  const { toast } = useToast();
  const [selectedProblemId, setSelectedProblemId] = useState<string>(crossModuleProblems[0].id);
  const [isInboxCollapsed, setIsInboxCollapsed] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan-b');
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set(['a1', 'a2', 'a3', 'a4', 'a5']));

  const selectedProblem = crossModuleProblems.find(p => p.id === selectedProblemId) || null;
  const { state, startDiscoveryPhase, approveGate } = useAgentOrchestrator(selectedProblem, mode);

  const handleRunNow = useCallback(() => {
    toast({ title: 'Starting agent pipeline...', description: 'Discovery agents queued' });
    startDiscoveryPhase();
  }, [startDiscoveryPhase, toast]);

  const handleGateDecision = useCallback((decision: 'approved' | 'revised' | 'escalated' | 'skipped') => {
    if (state.currentGate) {
      approveGate(state.currentGate, decision);
      if (decision === 'approved') {
        toast({ title: 'Approved', description: 'Proceeding to next phase...' });
      }
    }
  }, [state.currentGate, approveGate, toast]);

  const getCurrentStage = (): AgentStage => {
    if (state.gateDecisions.measurement) return 'measure';
    if (state.gateDecisions.execution || state.currentGate === 'measurement') return 'measure';
    if (state.gateDecisions.cross_module_plan || state.currentGate === 'execution') return 'execute';
    if (state.gateDecisions.root_cause || state.currentGate === 'cross_module_plan') return 'plan';
    if (state.gateDecisions.data_assumptions || state.currentGate === 'root_cause') return 'diagnosis';
    return 'discovery';
  };

  const getStageStatuses = (): Record<AgentStage, StageStatus> => {
    const currentStage = getCurrentStage();
    const stageOrder: AgentStage[] = ['discovery', 'diagnosis', 'plan', 'execute', 'measure'];
    const currentIdx = stageOrder.indexOf(currentStage);
    
    return stageOrder.reduce((acc, stage, idx) => {
      if (idx < currentIdx) acc[stage] = 'completed';
      else if (idx === currentIdx) acc[stage] = state.isRunning ? 'active' : 'active';
      else acc[stage] = 'locked';
      return acc;
    }, {} as Record<AgentStage, StageStatus>);
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[500px]">
      {/* LEFT: Priority Inbox */}
      <div className={cn("shrink-0 transition-all duration-300", isInboxCollapsed ? "w-12" : "w-80")}>
        <Card className="h-full flex flex-col">
          <CardHeader className="py-2 px-3 flex flex-row items-center justify-between shrink-0">
            {!isInboxCollapsed && <h3 className="text-sm font-semibold">Priority Inbox</h3>}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsInboxCollapsed(!isInboxCollapsed)}>
              {isInboxCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </CardHeader>
          {!isInboxCollapsed && (
            <CardContent className="flex-1 p-2 pt-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-2 pr-2">
                  {crossModuleProblems.map((problem) => (
                    <button
                      key={problem.id}
                      onClick={() => setSelectedProblemId(problem.id)}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-all",
                        selectedProblemId === problem.id
                          ? "bg-primary/5 border-primary/30"
                          : "bg-background hover:bg-muted/30 border-transparent"
                      )}
                    >
                      <p className="text-sm font-medium leading-tight line-clamp-2">{problem.title}</p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <Badge className="text-[9px] bg-primary/10 text-primary">₹{problem.impact}L</Badge>
                        <Badge variant="outline" className={cn("text-[9px]", problem.urgency === 'critical' && "text-red-600 border-red-300")}>
                          {problem.urgency}
                        </Badge>
                        <Badge variant="outline" className="text-[9px]">{problem.confidence}%</Badge>
                      </div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {problem.modules.slice(0, 3).map(m => (
                          <Badge key={m} variant="secondary" className={cn("text-[8px] px-1", moduleColors[m])}>
                            {m.slice(0, 4)}
                          </Badge>
                        ))}
                        {problem.modules.length > 3 && (
                          <Badge variant="secondary" className="text-[8px]">+{problem.modules.length - 3}</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          )}
        </Card>
      </div>

      {/* CENTER: Case Workspace */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        {selectedProblem ? (
          <>
            <CardHeader className="py-3 px-4 space-y-3 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold">{selectedProblem.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge className="bg-primary/10 text-primary">₹{selectedProblem.impact}L/day</Badge>
                    <Badge variant="outline" className={cn("text-[10px]", selectedProblem.urgency === 'critical' && "text-red-600")}>
                      {selectedProblem.timeToImpact} to impact
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{selectedProblem.confidence}% confidence</Badge>
                  </div>
                </div>
                <Button onClick={handleRunNow} disabled={state.isRunning || state.timeline.length > 0} className="gap-2">
                  <Play className="h-4 w-4" />
                  Run Now
                </Button>
              </div>
              <EvidenceStrip
                sources={selectedProblem.signals.map(s => ({ id: s.id, name: s.source, freshness: 'Live' }))}
                assumptions={[{ id: 'a1', text: 'No inbound <24h', details: 'Checked supplier portal' }]}
              />
              <AgentPipelineRibbon
                currentStage={getCurrentStage()}
                stageStatuses={getStageStatuses()}
                isProcessing={state.isRunning}
              />
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-4 pt-0">
              <ScrollArea className="h-full pr-3">
                <div className="space-y-4">
                  {/* Completed Gates */}
                  {state.gateDecisions.data_assumptions && (
                    <CompletedGate gate="data_assumptions" decision={state.gateDecisions.data_assumptions} />
                  )}
                  {state.gateDecisions.root_cause && (
                    <CompletedGate gate="root_cause" decision={state.gateDecisions.root_cause} />
                  )}

                  {/* Current Gate */}
                  {state.currentGate && !state.isRunning && (
                    <ApprovalGateCard
                      gate={state.currentGate}
                      onDecision={handleGateDecision}
                      mode={mode}
                      autoApproveEligible={selectedProblem.confidence >= 80 && (selectedProblem.crossModulePlan?.riskScore || 0) <= 0.3}
                    />
                  )}

                  {/* Cross-Module Plan (when in plan stage) */}
                  {getCurrentStage() === 'plan' && selectedProblem.crossModulePlan && state.gateDecisions.root_cause && (
                    <div className="space-y-4">
                      <PlanSelector
                        plans={alternativePlans[selectedProblem.id] || []}
                        selectedPlanId={selectedPlanId}
                        onSelectPlan={setSelectedPlanId}
                      />
                      <Separator />
                      <CrossModulePlanBoard
                        plan={selectedProblem.crossModulePlan}
                        selectedActions={selectedActions}
                        onToggleAction={(id) => setSelectedActions(prev => {
                          const next = new Set(prev);
                          if (next.has(id)) next.delete(id); else next.add(id);
                          return next;
                        })}
                        onViewEvidence={() => {}}
                        showToolCalls
                      />
                    </div>
                  )}

                  {/* Empty state */}
                  {state.timeline.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <p className="text-sm">Click "Run Now" to start the agent pipeline</p>
                      <p className="text-xs mt-1">Agents will analyze this cross-module opportunity</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select an issue to begin
          </div>
        )}
      </Card>

      {/* RIGHT: Agent Console */}
      <div className="w-80 shrink-0 hidden lg:block">
        <LiveAgentPanel
          agents={state.agents}
          timeline={state.timeline}
          isRunning={state.isRunning}
        />
      </div>
    </div>
  );
}
