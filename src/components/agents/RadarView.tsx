import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { crossModuleProblems, CrossModuleProblem, alternativePlans, ModuleType, AGENT_DEFINITIONS } from './cross-module-data';
import { useAgentOrchestrator, AgentState, AgentArtifact } from './AgentOrchestrator';
import { LiveAgentPanel } from './LiveAgentPanel';
import { ROIFirstDecisionCard, CaseStatus, NextRequiredAction } from './ROIFirstDecisionCard';
import { ArtifactViewerDialog } from './ArtifactViewerDialog';

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
  const [fastPathEnabled, setFastPathEnabled] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan-b');
  const [viewingArtifact, setViewingArtifact] = useState<AgentArtifact | null>(null);

  const selectedProblem = crossModuleProblems.find(p => p.id === selectedProblemId) || null;
  const { state, startDiscoveryPhase, approveGate } = useAgentOrchestrator(selectedProblem, mode);

  // Derive case status and next action from orchestrator state
  const { caseStatus, nextAction, runProgress, currentAgentName } = useMemo(() => {
    let status: CaseStatus = 'idle';
    let action: NextRequiredAction = 'start';
    let progress = 0;
    let agentName = '';

    // Calculate progress from running agents
    const runningAgent = Object.entries(state.agents).find(([_, a]) => a.status === 'running');
    if (runningAgent) {
      const [id, agentState] = runningAgent;
      const def = AGENT_DEFINITIONS.find(d => d.id === id);
      agentName = def?.name || '';
      progress = agentState.progress;
    }

    // Determine overall status
    if (state.isRunning) {
      status = 'running';
      // Determine what's next based on current gate
      if (state.currentGate === 'data_assumptions') {
        action = 'approve_assumptions';
      } else if (state.currentGate === 'root_cause') {
        action = 'approve_root_cause';
      } else if (state.currentGate === 'cross_module_plan') {
        action = 'approve_plan';
      } else if (state.currentGate === 'execution') {
        action = 'approve_execution';
      } else if (state.currentGate === 'measurement') {
        action = 'approve_measurement';
      }
    } else if (state.currentGate) {
      status = 'waiting_approval';
      switch (state.currentGate) {
        case 'data_assumptions':
          action = 'approve_assumptions';
          break;
        case 'root_cause':
          action = 'approve_root_cause';
          break;
        case 'cross_module_plan':
          action = 'approve_plan';
          break;
        case 'execution':
          action = 'approve_execution';
          break;
        case 'measurement':
          action = 'approve_measurement';
          break;
      }
    } else if (state.gateDecisions.measurement) {
      status = 'completed';
      action = 'none';
    } else if (state.timeline.length > 0) {
      // In between phases
      status = 'running';
    }

    // Check for failed agents
    const failedAgent = Object.values(state.agents).find(a => a.status === 'failed');
    if (failedAgent) {
      status = 'failed';
    }

    return { caseStatus: status, nextAction: action, runProgress: progress, currentAgentName: agentName };
  }, [state]);

  const handleStart = useCallback(() => {
    toast({ title: 'Starting agent pipeline...', description: 'Discovery agents queued' });
    startDiscoveryPhase();
  }, [startDiscoveryPhase, toast]);

  const handleApprove = useCallback(() => {
    if (state.currentGate) {
      approveGate(state.currentGate, 'approved');
      toast({ 
        title: 'Approved', 
        description: 'Proceeding to next phase automatically...',
      });
    }
  }, [state.currentGate, approveGate, toast]);

  const handleEdit = useCallback(() => {
    toast({ title: 'Edit mode', description: 'Opening constraints editor...' });
  }, [toast]);

  const handleRequestDeeper = useCallback(() => {
    if (state.currentGate) {
      approveGate(state.currentGate, 'revised');
      toast({ title: 'Requesting deeper analysis', description: 'Agents will dig deeper...' });
    }
  }, [state.currentGate, approveGate, toast]);

  const selectedPlan = useMemo(() => {
    const plans = alternativePlans[selectedProblemId] || [];
    return plans.find(p => p.id === selectedPlanId) || selectedProblem?.crossModulePlan || null;
  }, [selectedProblemId, selectedPlanId, selectedProblem]);

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

      {/* CENTER: ROI-First Decision Card */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        {selectedProblem ? (
          <>
            <CardHeader className="py-3 px-4 shrink-0 border-b">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold">{selectedProblem.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {selectedProblem.modules.map(m => (
                      <Badge key={m} variant="secondary" className={cn("text-[9px]", moduleColors[m])}>
                        {m}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-4">
              <ScrollArea className="h-full pr-3">
                <ROIFirstDecisionCard
                  problem={selectedProblem}
                  status={caseStatus}
                  nextAction={nextAction}
                  isRunning={state.isRunning}
                  runProgress={runProgress}
                  currentAgentName={currentAgentName}
                  onStart={handleStart}
                  onApprove={handleApprove}
                  onEdit={handleEdit}
                  onRequestDeeper={handleRequestDeeper}
                  fastPathEnabled={fastPathEnabled}
                  onToggleFastPath={setFastPathEnabled}
                  selectedPlan={selectedPlan}
                />
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
          onViewArtifact={(artifact) => setViewingArtifact(artifact)}
        />
      </div>

      {/* Artifact Viewer Dialog */}
      <ArtifactViewerDialog
        artifact={viewingArtifact}
        open={!!viewingArtifact}
        onOpenChange={(open) => !open && setViewingArtifact(null)}
      />
    </div>
  );
}
