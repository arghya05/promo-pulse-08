import { useState, useCallback, useEffect } from 'react';
import { 
  AgentId, 
  AGENT_DEFINITIONS, 
  CrossModuleProblem,
  ApprovalGate,
} from './cross-module-data';

export type AgentStatus = 'idle' | 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed';

export interface AgentState {
  id: AgentId;
  status: AgentStatus;
  progress: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
  artifact?: AgentArtifact;
  error?: string;
}

export interface AgentArtifact {
  type: 'ranking' | 'evidence' | 'entity_map' | 'anomalies' | 'guardrails' | 'hypotheses' | 'plan' | 'risk' | 'execution' | 'roi';
  title: string;
  summary: string;
  data: any;
  timestamp: Date;
}

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'agent_start' | 'agent_complete' | 'agent_fail' | 'artifact' | 'approval_request' | 'approval_granted' | 'approval_denied' | 'tool_call' | 'user_action';
  agentId?: AgentId;
  message: string;
  details?: string;
  payload?: any;
}

export interface OrchestratorState {
  isRunning: boolean;
  currentProblem: CrossModuleProblem | null;
  agents: Record<AgentId, AgentState>;
  timeline: TimelineEvent[];
  currentGate: ApprovalGate | null;
  gateDecisions: Record<ApprovalGate, 'approved' | 'revised' | 'escalated' | 'skipped' | null>;
  mode: 'advisory' | 'autopilot';
}

const AGENT_RUN_TIMES: Record<AgentId, number> = {
  discovery: 1200,
  signals: 1800,
  entity: 1400,
  anomaly: 2200,
  guardrails: 1000,
  rootcause: 2500,
  planner: 3000,
  risk: 1200,
  executor: 4000,
  roi: 1500,
};

export function useAgentOrchestrator(problem: CrossModuleProblem | null, mode: 'advisory' | 'autopilot') {
  const [state, setState] = useState<OrchestratorState>(() => initializeState(problem, mode));

  // Reset when problem changes
  useEffect(() => {
    setState(initializeState(problem, mode));
  }, [problem?.id, mode]);

  const addTimelineEvent = useCallback((event: Omit<TimelineEvent, 'id' | 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      timeline: [
        { ...event, id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: new Date() },
        ...prev.timeline,
      ],
    }));
  }, []);

  const updateAgent = useCallback((agentId: AgentId, updates: Partial<AgentState>) => {
    setState(prev => ({
      ...prev,
      agents: {
        ...prev.agents,
        [agentId]: { ...prev.agents[agentId], ...updates },
      },
    }));
  }, []);

  const runAgent = useCallback(async (agentId: AgentId): Promise<AgentArtifact> => {
    const runTime = AGENT_RUN_TIMES[agentId];
    const def = AGENT_DEFINITIONS.find(d => d.id === agentId)!;
    
    updateAgent(agentId, { status: 'running', progress: 0, startedAt: new Date() });
    addTimelineEvent({ type: 'agent_start', agentId, message: `${def.name} started`, details: def.description });

    // Simulate progress
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      await new Promise(r => setTimeout(r, runTime / steps));
      updateAgent(agentId, { progress: (i / steps) * 100 });
    }

    const artifact = generateArtifact(agentId, state.currentProblem);
    updateAgent(agentId, { status: 'completed', progress: 100, completedAt: new Date(), artifact });
    addTimelineEvent({ type: 'agent_complete', agentId, message: `${def.name} completed`, details: artifact.summary });
    addTimelineEvent({ type: 'artifact', agentId, message: `Generated: ${artifact.title}`, payload: artifact });

    return artifact;
  }, [state.currentProblem, updateAgent, addTimelineEvent]);

  const startDiscoveryPhase = useCallback(async () => {
    if (!state.currentProblem) return;
    
    setState(prev => ({ ...prev, isRunning: true }));
    
    // Queue all discovery-phase agents
    ['discovery', 'signals', 'entity', 'anomaly'].forEach(id => {
      updateAgent(id as AgentId, { status: 'queued' });
    });

    // Run discovery agent
    await runAgent('discovery');
    await runAgent('signals');
    await runAgent('entity');
    await runAgent('anomaly');

    // Wait for approval
    setState(prev => ({ 
      ...prev, 
      currentGate: 'data_assumptions',
      isRunning: false,
    }));
    addTimelineEvent({ type: 'approval_request', message: 'Waiting for approval: Data Assumptions', details: 'Review entity mappings and data quality' });
  }, [state.currentProblem, runAgent, updateAgent, addTimelineEvent]);

  const startDiagnosisPhase = useCallback(async () => {
    setState(prev => ({ ...prev, isRunning: true, currentGate: null }));
    
    ['guardrails', 'rootcause'].forEach(id => {
      updateAgent(id as AgentId, { status: 'queued' });
    });

    await runAgent('guardrails');
    await runAgent('rootcause');

    setState(prev => ({ 
      ...prev, 
      currentGate: 'root_cause',
      isRunning: false,
    }));
    addTimelineEvent({ type: 'approval_request', message: 'Waiting for approval: Root Cause', details: 'Select hypothesis to address' });
  }, [runAgent, updateAgent, addTimelineEvent]);

  const startPlanningPhase = useCallback(async () => {
    setState(prev => ({ ...prev, isRunning: true, currentGate: null }));
    
    updateAgent('planner', { status: 'queued' });
    updateAgent('risk', { status: 'queued' });

    await runAgent('planner');
    await runAgent('risk');

    const riskArtifact = state.agents.risk.artifact;
    const canAutoApprove = mode === 'autopilot' && 
      state.currentProblem?.confidence >= 80 && 
      (riskArtifact?.data?.riskScore || 0) <= 0.30;

    if (canAutoApprove) {
      addTimelineEvent({ type: 'approval_granted', message: 'Auto-approved: Cross-Module Plan', details: 'Met autopilot criteria' });
      setState(prev => ({ 
        ...prev, 
        gateDecisions: { ...prev.gateDecisions, cross_module_plan: 'approved' },
        currentGate: 'execution',
        isRunning: false,
      }));
    } else {
      setState(prev => ({ 
        ...prev, 
        currentGate: 'cross_module_plan',
        isRunning: false,
      }));
      addTimelineEvent({ type: 'approval_request', message: 'Waiting for approval: Cross-Module Plan', details: 'Review coordinated actions' });
    }
  }, [mode, state.currentProblem, state.agents.risk, runAgent, updateAgent, addTimelineEvent]);

  const startExecutionPhase = useCallback(async () => {
    setState(prev => ({ ...prev, isRunning: true, currentGate: null }));
    
    updateAgent('executor', { status: 'queued' });
    await runAgent('executor');

    setState(prev => ({ 
      ...prev, 
      currentGate: 'measurement',
      isRunning: false,
    }));
  }, [runAgent, updateAgent]);

  const startMeasurementPhase = useCallback(async () => {
    setState(prev => ({ ...prev, isRunning: true, currentGate: null }));
    
    updateAgent('roi', { status: 'queued' });
    await runAgent('roi');

    setState(prev => ({ ...prev, isRunning: false }));
    addTimelineEvent({ type: 'agent_complete', message: 'Measurement complete', details: 'ROI tracking activated' });
  }, [runAgent, updateAgent, addTimelineEvent]);

  const approveGate = useCallback(async (gate: ApprovalGate, decision: 'approved' | 'revised' | 'escalated' | 'skipped') => {
    setState(prev => ({ 
      ...prev, 
      gateDecisions: { ...prev.gateDecisions, [gate]: decision },
      currentGate: null,
    }));

    addTimelineEvent({ 
      type: decision === 'approved' ? 'approval_granted' : decision === 'revised' ? 'user_action' : 'approval_denied', 
      message: `${gate.replace('_', ' ')}: ${decision}`,
      details: decision === 'approved' ? 'Proceeding to next phase' : `User selected: ${decision}`,
    });

    if (decision === 'approved') {
      // Auto-advance to next phase
      switch (gate) {
        case 'data_assumptions':
          await startDiagnosisPhase();
          break;
        case 'root_cause':
          await startPlanningPhase();
          break;
        case 'cross_module_plan':
          // Wait for explicit execution approval
          setState(prev => ({ ...prev, currentGate: 'execution' }));
          break;
        case 'execution':
          await startExecutionPhase();
          break;
        case 'measurement':
          await startMeasurementPhase();
          break;
      }
    }
  }, [addTimelineEvent, startDiagnosisPhase, startPlanningPhase, startExecutionPhase, startMeasurementPhase]);

  const logToolCall = useCallback((action: string, system: string, payload: any, status: 'success' | 'failed' | 'retrying') => {
    addTimelineEvent({
      type: 'tool_call',
      message: `${action} → ${system}`,
      details: status === 'success' ? 'Completed' : status === 'retrying' ? 'Retrying...' : 'Failed',
      payload: { action, system, payload, status },
    });
  }, [addTimelineEvent]);

  return {
    state,
    startDiscoveryPhase,
    approveGate,
    logToolCall,
    addTimelineEvent,
  };
}

function initializeState(problem: CrossModuleProblem | null, mode: 'advisory' | 'autopilot'): OrchestratorState {
  const agents: Record<AgentId, AgentState> = {} as any;
  AGENT_DEFINITIONS.forEach(def => {
    agents[def.id] = { id: def.id, status: 'idle', progress: 0 };
  });

  return {
    isRunning: false,
    currentProblem: problem,
    agents,
    timeline: [],
    currentGate: null,
    gateDecisions: {
      data_assumptions: null,
      root_cause: null,
      cross_module_plan: null,
      execution: null,
      measurement: null,
    },
    mode,
  };
}

function generateArtifact(agentId: AgentId, problem: CrossModuleProblem | null): AgentArtifact {
  const now = new Date();
  
  switch (agentId) {
    case 'discovery':
      return {
        type: 'ranking',
        title: 'Priority Ranking',
        summary: `${problem?.discoveryScore.totalScore || 0}/100 priority score`,
        data: problem?.discoveryScore,
        timestamp: now,
      };
    case 'signals':
      return {
        type: 'evidence',
        title: 'Evidence Pack',
        summary: `${problem?.signals.length || 0} signals collected`,
        data: problem?.signals,
        timestamp: now,
      };
    case 'entity':
      return {
        type: 'entity_map',
        title: 'Entity Resolution',
        summary: 'SKU/DC/Vendor mappings validated',
        data: { skusMapped: 18, dcsCovered: 4, vendorsLinked: 3, dataQuality: 94 },
        timestamp: now,
      };
    case 'anomaly':
      return {
        type: 'anomalies',
        title: 'Anomaly Report',
        summary: `${problem?.signals.filter(s => s.type === 'anomaly').length || 0} anomalies detected`,
        data: problem?.signals.filter(s => s.type === 'anomaly'),
        timestamp: now,
      };
    case 'guardrails':
      return {
        type: 'guardrails',
        title: 'Guardrails Check',
        summary: '4/5 guardrails passed',
        data: { passed: 4, warnings: 1, failed: 0 },
        timestamp: now,
      };
    case 'rootcause':
      return {
        type: 'hypotheses',
        title: 'Root Cause Hypotheses',
        summary: `${problem?.rootCauses.length || 0} hypotheses ranked`,
        data: problem?.rootCauses,
        timestamp: now,
      };
    case 'planner':
      return {
        type: 'plan',
        title: 'Cross-Module Plan',
        summary: `${problem?.crossModulePlan?.actions.length || 0} coordinated actions`,
        data: problem?.crossModulePlan,
        timestamp: now,
      };
    case 'risk':
      return {
        type: 'risk',
        title: 'Risk Assessment',
        summary: `Risk score: ${((problem?.crossModulePlan?.riskScore || 0) * 100).toFixed(0)}%`,
        data: { riskScore: problem?.crossModulePlan?.riskScore || 0, safeToAutoExecute: (problem?.crossModulePlan?.riskScore || 1) <= 0.3, reasons: ['All actions within guardrails', 'Historical success rate: 87%'] },
        timestamp: now,
      };
    case 'executor':
      return {
        type: 'execution',
        title: 'Execution Log',
        summary: `${problem?.crossModulePlan?.actions.length || 0} tool calls executed`,
        data: { executed: problem?.crossModulePlan?.actions.length || 0, successful: (problem?.crossModulePlan?.actions.length || 0) - 1, retried: 1, failed: 0 },
        timestamp: now,
      };
    case 'roi':
      return {
        type: 'roi',
        title: 'ROI Report',
        summary: `Expected: ₹${problem?.crossModulePlan?.expectedROI || 0}L`,
        data: { expected: problem?.crossModulePlan?.expectedROI || 0, realized: (problem?.crossModulePlan?.expectedROI || 0) * 0.94, confidence: 82, method: 'A/B Test' },
        timestamp: now,
      };
    default:
      return { type: 'evidence', title: 'Unknown', summary: '', data: null, timestamp: now };
  }
}
