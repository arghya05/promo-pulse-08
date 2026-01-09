import { useState, useCallback } from 'react';
import { Problem, AgentMode, Guardrails } from './types';
import { AgentStage } from './AgentPipelineRibbon';
import { IssueInboxList } from './IssueInboxList';
import { AgentConsolePanel, AgentInfo, TimelineEntry } from './AgentConsolePanel';
import { StageDiscovery } from './StageDiscovery';
import { StageDiagnosis } from './StageDiagnosis';
import { StagePlan } from './StagePlan';
import { StageExecute } from './StageExecute';
import { StageMeasure } from './StageMeasure';
import { EvidenceStrip } from './EvidenceStrip';
import { AgentPipelineRibbon, StageStatus } from './AgentPipelineRibbon';
import { demoProblems, demoActions, defaultGuardrails } from './demo-data';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface RadarViewProps {
  mode: AgentMode;
  onCreateRun: (problemId: string, problemTitle: string, playbook: string) => void;
}

const defaultAgents: AgentInfo[] = [
  { id: 'signal', name: 'Signal Collector', status: 'completed', summary: '3 anomalies detected' },
  { id: 'entity', name: 'Entity Resolver', status: 'completed', summary: 'SKU/DC mapped' },
  { id: 'anomaly', name: 'Anomaly Detector', status: 'completed', summary: 'High severity' },
  { id: 'forecast', name: 'Forecast Validator', status: 'queued' },
  { id: 'rootcause', name: 'Root Cause Synthesizer', status: 'queued' },
  { id: 'planner', name: 'Plan Optimizer', status: 'queued' },
  { id: 'guardrails', name: 'Risk & Guardrails Checker', status: 'queued' },
  { id: 'executor', name: 'Execution Orchestrator', status: 'queued' },
  { id: 'roi', name: 'ROI & Attribution Tracker', status: 'queued' },
];

const defaultSources = [
  { id: 's1', name: 'Sales', freshness: '2h ago' },
  { id: 's2', name: 'DC Inventory', freshness: '1h ago' },
  { id: 's3', name: 'Supplier ETA', freshness: '4h ago' },
];

const defaultAssumptions = [
  { id: 'a1', text: 'No inbound <24h', details: 'No shipments expected in the next 24 hours' },
  { id: 'a2', text: 'Elasticity stable', details: 'Price elasticity assumed stable from last 30 days' },
];

export function RadarView({ mode, onCreateRun }: RadarViewProps) {
  const { toast } = useToast();
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(demoProblems[0]?.id || null);
  const [problems] = useState<Problem[]>(demoProblems);
  const [isInboxCollapsed, setIsInboxCollapsed] = useState(false);
  const [problemStages, setProblemStages] = useState<Record<string, AgentStage>>({});
  const [stageCompletions, setStageCompletions] = useState<Record<AgentStage, boolean>>({
    discovery: false, diagnosis: false, plan: false, execute: false, measure: false
  });
  const [currentStage, setCurrentStage] = useState<AgentStage>('discovery');
  const [isRunning, setIsRunning] = useState(false);
  const [guardrails, setGuardrails] = useState<Guardrails>(defaultGuardrails);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([
    { id: 't1', timestamp: new Date(Date.now() - 300000), type: 'system', message: 'Problem detected', details: 'Anomaly Detector triggered' },
    { id: 't2', timestamp: new Date(Date.now() - 180000), type: 'agent', message: 'Signal Collector completed', details: '3 signals identified' },
  ]);
  const [agents, setAgents] = useState<AgentInfo[]>(defaultAgents);

  const selectedProblem = problems.find(p => p.id === selectedProblemId);
  const actions = selectedProblemId ? demoActions[selectedProblemId] || [] : [];

  const addTimelineEntry = (type: TimelineEntry['type'], message: string, details?: string) => {
    setTimeline(prev => [{ id: `t-${Date.now()}`, timestamp: new Date(), type, message, details }, ...prev]);
  };

  const updateAgentStatus = (agentId: string, status: AgentInfo['status'], summary?: string) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status, summary: summary || a.summary } : a));
  };

  const stageStatuses: Record<AgentStage, StageStatus> = {
    discovery: stageCompletions.discovery ? 'completed' : currentStage === 'discovery' ? 'active' : 'locked',
    diagnosis: stageCompletions.diagnosis ? 'completed' : currentStage === 'diagnosis' ? 'active' : stageCompletions.discovery ? 'active' : 'locked',
    plan: stageCompletions.plan ? 'completed' : currentStage === 'plan' ? 'active' : stageCompletions.diagnosis ? 'active' : 'locked',
    execute: stageCompletions.execute ? 'completed' : currentStage === 'execute' ? 'active' : stageCompletions.plan ? 'active' : 'locked',
    measure: stageCompletions.measure ? 'completed' : currentStage === 'measure' ? 'active' : stageCompletions.execute ? 'active' : 'locked',
  };

  const handleDiscoveryConfirm = () => {
    setStageCompletions(prev => ({ ...prev, discovery: true }));
    setCurrentStage('diagnosis');
    addTimelineEntry('user', 'User confirmed priority');
    updateAgentStatus('rootcause', 'running');
    toast({ title: 'Discovery confirmed', description: 'Running Diagnosis agents...' });
    setTimeout(() => updateAgentStatus('rootcause', 'completed', '3 hypotheses'), 1500);
  };

  const handleDiagnosisSelect = () => {
    setStageCompletions(prev => ({ ...prev, diagnosis: true }));
    setCurrentStage('plan');
    addTimelineEntry('user', 'Root cause selected', 'Supplier delay (92%)');
    updateAgentStatus('planner', 'running');
    setTimeout(() => { updateAgentStatus('planner', 'completed', '3 plans generated'); updateAgentStatus('guardrails', 'completed'); }, 1500);
  };

  const handlePlanApprove = () => {
    setStageCompletions(prev => ({ ...prev, plan: true }));
    setCurrentStage('execute');
    addTimelineEntry('user', 'Plan approved', 'Emergency restocking selected');
    updateAgentStatus('executor', 'running');
  };

  const handleExecuteRun = () => {
    setIsRunning(true);
    addTimelineEntry('user', 'Execution approved', '5 actions approved');
  };

  const handleRunComplete = () => {
    setIsRunning(false);
    setStageCompletions(prev => ({ ...prev, execute: true }));
    setCurrentStage('measure');
    addTimelineEntry('agent', 'Execution completed', '5 actions applied');
    updateAgentStatus('executor', 'completed', '5 actions applied');
    updateAgentStatus('roi', 'running');
    setTimeout(() => updateAgentStatus('roi', 'completed', '+₹14.8L realized'), 2000);
    onCreateRun(selectedProblemId!, selectedProblem?.title || '', 'Custom');
  };

  const handleMeasureClose = () => {
    setStageCompletions(prev => ({ ...prev, measure: true }));
    addTimelineEntry('user', 'Incident closed', 'Saved as playbook');
    toast({ title: 'Incident closed', description: 'Results saved to ROI Tracker' });
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[500px]">
      {/* LEFT: Priority Inbox */}
      <div className={cn("shrink-0 transition-all duration-300", isInboxCollapsed ? "w-14" : "w-72")}>
        <IssueInboxList
          problems={problems}
          selectedId={selectedProblemId}
          onSelect={setSelectedProblemId}
          isCollapsed={isInboxCollapsed}
          onToggleCollapse={() => setIsInboxCollapsed(!isInboxCollapsed)}
          problemStages={problemStages}
        />
      </div>

      {/* CENTER: Guided Pipeline */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        {selectedProblem ? (
          <>
            <CardHeader className="pb-3 space-y-3">
              {/* Issue Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">{selectedProblem.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge className="bg-primary/10 text-primary border-primary/20">₹{selectedProblem.impact}L/day</Badge>
                    <Badge variant="outline" className={cn("text-[10px]", selectedProblem.urgency === 'now' && "bg-red-500/10 text-red-600")}>
                      {selectedProblem.urgency === 'now' ? 'Urgent' : selectedProblem.urgency}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{selectedProblem.confidence} confidence</Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> Updated 2h ago
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Evidence Strip */}
              <EvidenceStrip sources={defaultSources} assumptions={defaultAssumptions} />
              
              {/* Pipeline Ribbon */}
              <AgentPipelineRibbon
                currentStage={currentStage}
                stageStatuses={stageStatuses}
                onStageClick={(stage) => stageStatuses[stage] !== 'locked' && setCurrentStage(stage)}
                isProcessing={isRunning}
              />
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-4 pt-0">
              <ScrollArea className="h-full pr-3">
                {currentStage === 'discovery' && (
                  <StageDiscovery
                    problem={selectedProblem}
                    isCompleted={stageCompletions.discovery}
                    onConfirm={handleDiscoveryConfirm}
                    onRecheck={() => toast({ title: 'Recheck started' })}
                    onDismiss={() => toast({ title: 'Issue dismissed' })}
                  />
                )}
                {currentStage === 'diagnosis' && (
                  <StageDiagnosis
                    problem={selectedProblem}
                    isCompleted={stageCompletions.diagnosis}
                    onSelectCause={handleDiagnosisSelect}
                    onDigDeeper={() => toast({ title: 'Running deeper analysis...' })}
                    onGoBack={() => setCurrentStage('discovery')}
                  />
                )}
                {currentStage === 'plan' && (
                  <StagePlan
                    actions={actions}
                    guardrails={guardrails}
                    isCompleted={stageCompletions.plan}
                    onApprovePlan={handlePlanApprove}
                    onEditGuardrails={setGuardrails}
                    onGenerateAlternatives={() => toast({ title: 'Generating alternatives...' })}
                  />
                )}
                {currentStage === 'execute' && (
                  <StageExecute
                    actions={actions}
                    isCompleted={stageCompletions.execute}
                    isRunning={isRunning}
                    autopilotEnabled={mode === 'autopilot'}
                    onApproveAndRun={handleExecuteRun}
                    onSafeMode={() => { handleExecuteRun(); toast({ title: 'Safe Mode enabled' }); }}
                    onSendForApproval={() => toast({ title: 'Sent for approval' })}
                    onCancel={() => setCurrentStage('plan')}
                    onRunComplete={handleRunComplete}
                  />
                )}
                {currentStage === 'measure' && (
                  <StageMeasure
                    isCompleted={stageCompletions.measure}
                    onAcceptResults={() => {}}
                    onDisputeMeasurement={() => toast({ title: 'Dispute filed' })}
                    onSaveAsPlaybook={handleMeasureClose}
                    onCreateMonitoringRule={() => toast({ title: 'Monitoring rule created' })}
                    onCloseIncident={handleMeasureClose}
                  />
                )}
              </ScrollArea>
            </CardContent>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Select an issue to begin
          </div>
        )}
      </Card>

      {/* RIGHT: Agent Console */}
      <div className="w-80 shrink-0 hidden lg:block">
        <AgentConsolePanel
          agents={agents}
          timeline={timeline}
          currentStage={currentStage}
        />
      </div>
    </div>
  );
}
