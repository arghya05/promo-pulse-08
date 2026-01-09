import { useState, useMemo } from 'react';
import { Problem, Action, Guardrails, AuditEntry } from './types';
import { AgentStage, StageStatus, AgentPipelineRibbon } from './AgentPipelineRibbon';
import { HumanGateCard, GateDecision, discoveryGateOptions, diagnosisGateOptions, planGateOptions, measureGateOptions } from './HumanGateCard';
import { EvidenceDrawer } from './EvidenceDrawer';
import { GuardrailsModal } from './GuardrailsModal';
import { RunProgressPanel } from './RunProgressPanel';
import { ActionRow } from './ActionRow';
import { demoExpectedROI, demoAuditLog, demoActions, defaultGuardrails } from './demo-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  Sparkles,
  Lightbulb,
  TrendingUp,
  FileText,
  Shield,
  Zap,
  Play,
  Send,
  FlaskConical,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Check,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface StepperWorkflowProps {
  problem: Problem;
  onStageChange: (stage: AgentStage) => void;
  onCreateRun: (problemId: string, problemTitle: string, playbook: string) => void;
}

const approvers = [
  { id: 'riya', name: 'Riya (Pricing Lead)', team: 'Pricing' },
  { id: 'kunal', name: 'Kunal (Growth)', team: 'Marketing' },
  { id: 'meera', name: 'Meera (SCM)', team: 'Supply' },
];

export function StepperWorkflow({ problem, onStageChange, onCreateRun }: StepperWorkflowProps) {
  const { toast } = useToast();
  
  // Stage management
  const [currentStage, setCurrentStage] = useState<AgentStage>('discovery');
  const [stageDecisions, setStageDecisions] = useState<Record<AgentStage, GateDecision | null>>({
    discovery: null,
    diagnosis: null,
    plan: null,
    execute: null,
    measure: null,
  });
  
  // UI state
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [guardrailsOpen, setGuardrailsOpen] = useState(false);
  const [showAllCauses, setShowAllCauses] = useState(false);
  const [showAllActions, setShowAllActions] = useState(false);
  const [askAgentInput, setAskAgentInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runCompleted, setRunCompleted] = useState(false);
  
  // Data state
  const [actions, setActions] = useState<Action[]>(demoActions[problem.id] || []);
  const [guardrails, setGuardrails] = useState<Guardrails>(defaultGuardrails);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(demoAuditLog);
  const [selectedCauses, setSelectedCauses] = useState<Set<number>>(new Set([0, 1]));

  const stageStatuses = useMemo<Record<AgentStage, StageStatus>>(() => {
    const getStatus = (stage: AgentStage): StageStatus => {
      if (stageDecisions[stage]) return 'completed';
      if (stage === currentStage) return 'active';
      
      const stageOrder: AgentStage[] = ['discovery', 'diagnosis', 'plan', 'execute', 'measure'];
      const currentIdx = stageOrder.indexOf(currentStage);
      const stageIdx = stageOrder.indexOf(stage);
      
      if (stageIdx < currentIdx) return 'completed';
      return 'locked';
    };

    return {
      discovery: getStatus('discovery'),
      diagnosis: getStatus('diagnosis'),
      plan: getStatus('plan'),
      execute: getStatus('execute'),
      measure: getStatus('measure'),
    };
  }, [currentStage, stageDecisions]);

  const expectedROI = demoExpectedROI[problem.id];
  const includedActions = actions.filter(a => a.included);
  const totalUplift = includedActions.reduce((sum, a) => sum + (a.upliftMin + a.upliftMax) / 2, 0);
  const violations = actions.flatMap(a => a.guardrailViolations).filter(Boolean);

  const handleStageDecision = (stage: AgentStage, decision: GateDecision) => {
    setStageDecisions(prev => ({ ...prev, [stage]: decision }));
    
    // Add to audit log
    const newEntry: AuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date(),
      user: 'You',
      action: `${decision === 'approve' ? 'Approved' : decision === 'revise' ? 'Requested revision for' : 'Escalated'} ${stage}`,
      details: `${stage.charAt(0).toUpperCase() + stage.slice(1)} stage ${decision === 'approve' ? 'approved' : 'action taken'}`
    };
    setAuditLog(prev => [newEntry, ...prev]);

    if (decision === 'approve') {
      const stageOrder: AgentStage[] = ['discovery', 'diagnosis', 'plan', 'execute', 'measure'];
      const currentIdx = stageOrder.indexOf(stage);
      if (currentIdx < stageOrder.length - 1) {
        const nextStage = stageOrder[currentIdx + 1];
        setCurrentStage(nextStage);
        onStageChange(nextStage);
      }
    }

    if (decision === 'escalate') {
      toast({
        title: 'Escalated to analyst',
        description: 'A task has been created and assigned',
      });
    }

    if (decision === 'revise') {
      toast({
        title: 'Revision requested',
        description: 'Agent is refining the analysis...',
      });
    }
  };

  const handleExecutionPath = (path: 'fast' | 'safe' | 'delegate') => {
    if (path === 'fast' || path === 'safe') {
      setIsRunning(true);
      setStageDecisions(prev => ({ ...prev, execute: 'approve' }));
      
      const newEntry: AuditEntry = {
        id: `aud-${Date.now()}`,
        timestamp: new Date(),
        user: 'You',
        action: `Approved execution (${path === 'fast' ? 'Fast Track' : 'Safe Mode'})`,
        details: `${includedActions.length} actions approved`
      };
      setAuditLog(prev => [newEntry, ...prev]);
      
      onCreateRun(problem.id, problem.title, 'Custom Run');
    } else {
      setStageDecisions(prev => ({ ...prev, execute: 'escalate' }));
      toast({
        title: 'Sent for approval',
        description: 'Routing to approvers based on action type',
      });
    }
  };

  const handleRunComplete = () => {
    setIsRunning(false);
    setRunCompleted(true);
    setCurrentStage('measure');
    onStageChange('measure');
  };

  const handleToggleAction = (actionId: string) => {
    setActions(prev => prev.map(a =>
      a.id === actionId ? { ...a, included: !a.included } : a
    ));
  };

  const handleAskAgent = () => {
    if (!askAgentInput.trim()) return;
    toast({
      title: 'Agent updating plan',
      description: `Processing: "${askAgentInput}"`,
    });
    setAskAgentInput('');
  };

  const visibleCauses = showAllCauses ? problem.rootCauses : problem.rootCauses.slice(0, 2);
  const visibleActions = showAllActions ? actions : actions.slice(0, 3);

  return (
    <div className="h-full flex flex-col">
      {/* Pipeline Ribbon */}
      <AgentPipelineRibbon
        currentStage={currentStage}
        stageStatuses={stageStatuses}
        onStageClick={(stage) => {
          if (stageStatuses[stage] !== 'locked') {
            setCurrentStage(stage);
            onStageChange(stage);
          }
        }}
        isProcessing={isRunning}
      />

      <ScrollArea className="flex-1 mt-4">
        <div className="space-y-4 pr-3">
          {/* Issue Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold truncate">{problem.title}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  ₹{problem.impact}L impact
                </Badge>
                <Badge variant="outline" className={cn(
                  "text-[10px]",
                  problem.urgency === 'now' && "bg-red-500/10 text-red-600 border-red-200"
                )}>
                  {problem.urgency === 'now' ? 'Urgent' : problem.urgency}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {problem.confidence} confidence
                </Badge>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5 shrink-0"
              onClick={() => setEvidenceOpen(true)}
            >
              <FileText className="h-3.5 w-3.5" />
              Evidence
            </Button>
          </div>

          <Separator />

          {/* Step Content based on current stage */}
          {currentStage === 'discovery' && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3" />
                    What triggered this
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm mb-3">{problem.summary}</p>
                  <div className="space-y-2">
                    {problem.whyNow.map((signal, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs p-2 bg-muted/30 rounded">
                        <Sparkles className="h-3 w-3 text-primary shrink-0" />
                        <span>{signal}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <HumanGateCard
                title="Evaluate discovery"
                options={discoveryGateOptions}
                onDecision={(decision) => handleStageDecision('discovery', decision)}
                currentDecision={stageDecisions.discovery}
              />
            </div>
          )}

          {currentStage === 'diagnosis' && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Lightbulb className="h-3 w-3" />
                    Root cause hypotheses
                    <Badge variant="secondary" className="text-[9px] ml-1">Diagnosis Agent</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {visibleCauses.map((cause, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedCauses(prev => {
                          const next = new Set(prev);
                          if (next.has(i)) next.delete(i);
                          else next.add(i);
                          return next;
                        });
                      }}
                      className={cn(
                        "w-full flex items-start gap-2 text-xs p-2.5 rounded border transition-all text-left",
                        selectedCauses.has(i) 
                          ? "bg-primary/5 border-primary/30" 
                          : "bg-muted/30 border-transparent hover:border-muted"
                      )}
                    >
                      <div className={cn(
                        "shrink-0 w-4 h-4 rounded border flex items-center justify-center mt-0.5",
                        selectedCauses.has(i) && "bg-primary border-primary"
                      )}>
                        {selectedCauses.has(i) && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                      </div>
                      <div className="flex-1">
                        <span className="text-muted-foreground mr-1">{i + 1}.</span>
                        {cause}
                      </div>
                      <Badge variant="outline" className="text-[9px] shrink-0">
                        {i === 0 ? '92%' : i === 1 ? '78%' : '54%'}
                      </Badge>
                    </button>
                  ))}
                  
                  {problem.rootCauses.length > 2 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-xs h-7"
                      onClick={() => setShowAllCauses(!showAllCauses)}
                    >
                      {showAllCauses ? (
                        <><ChevronUp className="h-3 w-3 mr-1" />Show less</>
                      ) : (
                        <><ChevronDown className="h-3 w-3 mr-1" />Show {problem.rootCauses.length - 2} more</>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <HumanGateCard
                title="Evaluate root cause analysis"
                options={diagnosisGateOptions}
                onDecision={(decision) => handleStageDecision('diagnosis', decision)}
                currentDecision={stageDecisions.diagnosis}
              />
            </div>
          )}

          {currentStage === 'plan' && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3" />
                      Recommended actions
                      <Badge variant="secondary" className="text-[9px] ml-1">Planner Agent</Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Est. uplift:
                      </span>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        ₹{totalUplift.toFixed(1)}L
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {visibleActions.map((action, i) => (
                    <ActionRow
                      key={action.id}
                      action={action}
                      index={i + 1}
                      onToggle={handleToggleAction}
                    />
                  ))}
                  
                  {actions.length > 3 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-xs h-7"
                      onClick={() => setShowAllActions(!showAllActions)}
                    >
                      {showAllActions ? (
                        <><ChevronUp className="h-3 w-3 mr-1" />Show less</>
                      ) : (
                        <><ChevronDown className="h-3 w-3 mr-1" />View all {actions.length} actions</>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Guardrails summary */}
              <Card className={cn(
                violations.length > 0 ? "border-amber-500/30" : "border-green-500/30"
              )}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className={cn(
                      "h-4 w-4",
                      violations.length > 0 ? "text-amber-600" : "text-green-600"
                    )} />
                    <span className="text-xs font-medium">
                      {violations.length > 0 
                        ? `${violations.length} guardrail violation(s)` 
                        : 'All guardrails passed'}
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => setGuardrailsOpen(true)}
                  >
                    Edit Guardrails
                  </Button>
                </CardContent>
              </Card>

              {/* Ask agent */}
              <div className="flex gap-2">
                <Input
                  placeholder="Ask agent to modify plan..."
                  value={askAgentInput}
                  onChange={(e) => setAskAgentInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAgent()}
                  className="h-8 text-xs"
                />
                <Button size="sm" variant="outline" className="h-8" onClick={handleAskAgent}>
                  <MessageSquare className="h-3 w-3" />
                </Button>
              </div>

              <HumanGateCard
                title="Evaluate action plan"
                options={planGateOptions}
                onDecision={(decision) => handleStageDecision('plan', decision)}
                currentDecision={stageDecisions.plan}
              />
            </div>
          )}

          {currentStage === 'execute' && !isRunning && !runCompleted && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Zap className="h-3 w-3" />
                    Change Set
                    <Badge variant="secondary" className="text-[9px] ml-1">Execution Agent</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="text-xs space-y-1.5">
                    <p><strong>{includedActions.length}</strong> actions will be applied</p>
                    <p className="text-muted-foreground">
                      Systems: Pricing Engine, Inventory Manager, WMS
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold">Choose execution path</h4>
                    
                    <button
                      onClick={() => handleExecutionPath('fast')}
                      className="w-full p-3 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all text-left"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Fast Track</span>
                        <Badge variant="outline" className="text-[9px] ml-auto">Recommended</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Execute immediately. Low-risk actions only.
                      </p>
                    </button>

                    <button
                      onClick={() => handleExecutionPath('safe')}
                      className="w-full p-3 rounded-lg border hover:bg-muted/30 transition-all text-left"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="h-4 w-4" />
                        <span className="text-sm font-medium">Safe Mode</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Create tickets and wait for system confirmations.
                      </p>
                    </button>

                    <button
                      onClick={() => handleExecutionPath('delegate')}
                      className="w-full p-3 rounded-lg border hover:bg-muted/30 transition-all text-left"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-medium">Delegate for Approval</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Route to: {approvers.find(a => a.team === problem.owner)?.name || 'Team Lead'}
                      </p>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {(currentStage === 'execute' && isRunning) && (
            <RunProgressPanel
              isRunning={isRunning}
              runId={`RUN-${Date.now().toString().slice(-6)}`}
              onComplete={handleRunComplete}
              onCancel={() => setIsRunning(false)}
            />
          )}

          {currentStage === 'measure' && (
            <div className="space-y-4">
              <Card className="border-green-500/30 bg-green-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-1.5">
                    <Check className="h-3 w-3" />
                    Results Summary
                    <Badge variant="secondary" className="text-[9px] ml-1">Measurement Agent</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-background rounded-lg">
                      <p className="text-[10px] text-muted-foreground mb-1">Expected</p>
                      <p className="text-lg font-bold text-primary">₹{totalUplift.toFixed(1)}L</p>
                    </div>
                    <div className="p-3 bg-background rounded-lg">
                      <p className="text-[10px] text-muted-foreground mb-1">Realized</p>
                      <p className="text-lg font-bold text-green-600">₹{(totalUplift * 0.94).toFixed(1)}L</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">Method: A/B Test</Badge>
                    <Badge variant="outline" className="text-[10px]">p-value: 0.02</Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-xs space-y-1">
                    <p><strong>Side effects:</strong></p>
                    <p className="text-muted-foreground">• Margin: +1.2% improvement</p>
                    <p className="text-muted-foreground">• Inventory: -0.3 days cover (within limits)</p>
                  </div>
                </CardContent>
              </Card>

              <HumanGateCard
                title="Evaluate results"
                options={measureGateOptions}
                onDecision={(decision) => handleStageDecision('measure', decision)}
                currentDecision={stageDecisions.measure}
              />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Drawers and Modals */}
      <EvidenceDrawer
        open={evidenceOpen}
        onOpenChange={setEvidenceOpen}
        auditLog={auditLog}
        assumptions={expectedROI?.assumptions || []}
        problemId={problem.id}
      />

      <GuardrailsModal
        open={guardrailsOpen}
        onOpenChange={setGuardrailsOpen}
        guardrails={guardrails}
        onSave={setGuardrails}
        violations={violations}
      />
    </div>
  );
}
