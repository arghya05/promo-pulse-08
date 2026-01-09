import { useState, useCallback } from 'react';
import { Problem, AgentMode } from './types';
import { AgentStage } from './AgentPipelineRibbon';
import { IssueInboxList } from './IssueInboxList';
import { StepperWorkflow } from './StepperWorkflow';
import { demoProblems } from './demo-data';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RadarViewProps {
  mode: AgentMode;
  onCreateRun: (problemId: string, problemTitle: string, playbook: string) => void;
}

export function RadarView({ mode, onCreateRun }: RadarViewProps) {
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(demoProblems[0]?.id || null);
  const [problems] = useState<Problem[]>(demoProblems);
  const [isInboxCollapsed, setIsInboxCollapsed] = useState(false);
  const [problemStages, setProblemStages] = useState<Record<string, AgentStage>>({});

  const selectedProblem = problems.find(p => p.id === selectedProblemId);

  const handleStageChange = useCallback((stage: AgentStage) => {
    if (selectedProblemId) {
      setProblemStages(prev => ({ ...prev, [selectedProblemId]: stage }));
    }
  }, [selectedProblemId]);

  return (
    <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[500px]">
      {/* LEFT: Priority Inbox */}
      <div className={cn(
        "shrink-0 transition-all duration-300",
        isInboxCollapsed ? "w-14" : "w-72"
      )}>
        <IssueInboxList
          problems={problems}
          selectedId={selectedProblemId}
          onSelect={setSelectedProblemId}
          isCollapsed={isInboxCollapsed}
          onToggleCollapse={() => setIsInboxCollapsed(!isInboxCollapsed)}
          problemStages={problemStages}
        />
      </div>

      {/* CENTER: Agent Workflow Canvas */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-4 h-full">
          {selectedProblem ? (
            <StepperWorkflow
              problem={selectedProblem}
              onStageChange={handleStageChange}
              onCreateRun={onCreateRun}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Select an issue to begin
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
