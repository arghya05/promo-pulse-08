import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, Shield, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { crossModuleProblems, CrossModuleProblem, alternativePlans, ModuleType, AGENT_DEFINITIONS, CrossModulePlan } from './cross-module-data';
import { useAgentOrchestrator, AgentArtifact } from './AgentOrchestrator';
import { LiveAgentPanel } from './LiveAgentPanel';
import { ArtifactViewerDialog } from './ArtifactViewerDialog';
import { CaseWorkspace, CasePhase } from './CaseWorkspace';
import { DigDeeperPanel } from './DigDeeperPanel';

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
  const [viewingArtifact, setViewingArtifact] = useState<AgentArtifact | null>(null);
  const [digDeeperOpen, setDigDeeperOpen] = useState(false);

  const selectedProblem = crossModuleProblems.find(p => p.id === selectedProblemId) || null;
  const { state, startDiscoveryPhase, approveGate } = useAgentOrchestrator(selectedProblem, mode);

  // Derive phase from orchestrator state - now properly tracks execution and measurement
  const phase: CasePhase = useMemo(() => {
    // Check if ROI agent completed = measure phase
    if (state.agents.roi?.status === 'completed') return 'measure';
    // Check if executor agent completed or running = execute phase
    if (state.agents.executor?.status === 'completed' || state.agents.executor?.status === 'running') return 'execute';
    // Check if we're waiting for execution approval or plan is approved
    if (state.gateDecisions.cross_module_plan === 'approved' || state.currentGate === 'execution') return 'execute';
    // Check if planner completed = options phase
    if (state.agents.planner?.status === 'completed' || state.gateDecisions.root_cause === 'approved') return 'options';
    // Check if diagnosis agents completed = diagnose phase  
    if (state.gateDecisions.data_assumptions === 'approved' || state.agents.rootcause?.status === 'completed') return 'diagnose';
    // Check if any agent has started = diagnose phase
    if (state.timeline.length > 0 && !state.isRunning) return 'diagnose';
    if (state.timeline.length > 0) return 'diagnose';
    return 'detect';
  }, [state]);

  // Derive running progress
  const { runProgress, currentAgentName } = useMemo(() => {
    let progress = 0;
    let agentName = '';
    const runningAgent = Object.entries(state.agents).find(([_, a]) => a.status === 'running');
    if (runningAgent) {
      const [id, agentState] = runningAgent;
      const def = AGENT_DEFINITIONS.find(d => d.id === id);
      agentName = def?.name || '';
      progress = agentState.progress;
    }
    return { runProgress: progress, currentAgentName: agentName };
  }, [state]);

  const handleStart = useCallback(() => {
    toast({ title: 'Running analysis...', description: 'Agents collecting signals' });
    startDiscoveryPhase();
  }, [startDiscoveryPhase, toast]);

  const handleApprove = useCallback(() => {
    if (state.currentGate) {
      approveGate(state.currentGate, 'approved');
      toast({ title: 'Approved', description: 'Proceeding to next phase...' });
    } else {
      // Auto-approve next gate based on current phase
      const gates = ['data_assumptions', 'root_cause', 'cross_module_plan', 'execution', 'measurement'] as const;
      const nextGate = gates.find(g => !state.gateDecisions[g]);
      if (nextGate) {
        approveGate(nextGate, 'approved');
        toast({ title: 'Approved', description: 'Proceeding to next phase...' });
      }
    }
  }, [state, approveGate, toast]);

  return (
    <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[500px]">
      {/* LEFT: Priority Inbox */}
      <div className={cn("shrink-0 transition-all duration-300", isInboxCollapsed ? "w-12" : "w-72")}>
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
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                        {problem.signals[0]?.value || 'Multiple signals detected'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <Badge className="text-[9px] bg-primary/10 text-primary">₹{problem.impact}L</Badge>
                        <Badge variant="outline" className={cn("text-[9px]", problem.urgency === 'critical' && "text-red-600 border-red-300")}>
                          {problem.urgency}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[9px]", problem.confidence >= 70 ? "" : "text-amber-600")}>
                          {problem.confidence}%
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          )}
        </Card>
      </div>

      {/* CENTER: Case Workspace with 5 tabs */}
      <Card className="flex-1 overflow-hidden">
        {selectedProblem ? (
          <CaseWorkspace
            problem={selectedProblem}
            phase={phase}
            isRunning={state.isRunning}
            runProgress={runProgress}
            currentAgentName={currentAgentName}
            onStart={handleStart}
            onApprove={handleApprove}
            onShowEvidence={() => setDigDeeperOpen(true)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select an issue to begin
          </div>
        )}
      </Card>

      {/* RIGHT: Agent Console */}
      <div className="w-72 shrink-0 hidden lg:block">
        <Card className="h-full flex flex-col">
          <CardHeader className="py-2 px-3 shrink-0 flex flex-row items-center justify-between">
            <h3 className="text-sm font-semibold">Agent Console</h3>
            {mode === 'autopilot' && (
              <Badge variant="outline" className="text-[9px] text-green-600">
                <Shield className="h-2.5 w-2.5 mr-0.5" />
                Autopilot: 5 policies
              </Badge>
            )}
          </CardHeader>
          <div className="flex-1 overflow-hidden">
            <LiveAgentPanel
              agents={state.agents}
              timeline={state.timeline}
              isRunning={state.isRunning}
              onViewArtifact={(artifact) => setViewingArtifact(artifact)}
            />
          </div>
        </Card>
      </div>

      {/* Modals */}
      <ArtifactViewerDialog
        artifact={viewingArtifact}
        open={!!viewingArtifact}
        onOpenChange={(open) => !open && setViewingArtifact(null)}
      />

      <DigDeeperPanel
        open={digDeeperOpen}
        onOpenChange={setDigDeeperOpen}
        problem={selectedProblem}
      />
    </div>
  );
}
