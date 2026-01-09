import { cn } from '@/lib/utils';
import { Check, Circle, Lock, Loader2 } from 'lucide-react';

export type AgentStage = 'discovery' | 'diagnosis' | 'plan' | 'execute' | 'measure';
export type StageStatus = 'locked' | 'active' | 'completed' | 'skipped';

interface StageInfo {
  id: AgentStage;
  label: string;
  shortLabel: string;
}

const stages: StageInfo[] = [
  { id: 'discovery', label: 'Discovery', shortLabel: 'D1' },
  { id: 'diagnosis', label: 'Diagnosis', shortLabel: 'D2' },
  { id: 'plan', label: 'Plan', shortLabel: 'P' },
  { id: 'execute', label: 'Execute', shortLabel: 'E' },
  { id: 'measure', label: 'Measure', shortLabel: 'M' },
];

interface AgentPipelineRibbonProps {
  currentStage: AgentStage;
  stageStatuses: Record<AgentStage, StageStatus>;
  onStageClick?: (stage: AgentStage) => void;
  isProcessing?: boolean;
}

export function AgentPipelineRibbon({ 
  currentStage, 
  stageStatuses, 
  onStageClick,
  isProcessing 
}: AgentPipelineRibbonProps) {
  return (
    <div className="flex items-center justify-between gap-1 p-2 bg-muted/30 rounded-lg">
      {stages.map((stage, index) => {
        const status = stageStatuses[stage.id];
        const isActive = currentStage === stage.id;
        const isCompleted = status === 'completed';
        const isLocked = status === 'locked';
        const canClick = !isLocked && onStageClick;

        return (
          <div key={stage.id} className="flex items-center flex-1">
            <button
              onClick={() => canClick && onStageClick(stage.id)}
              disabled={isLocked}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md transition-all flex-1 min-w-0",
                isActive && "bg-primary text-primary-foreground shadow-sm",
                isCompleted && !isActive && "bg-primary/10 text-primary",
                isLocked && "opacity-40 cursor-not-allowed",
                !isActive && !isCompleted && !isLocked && "hover:bg-muted cursor-pointer"
              )}
            >
              <div className={cn(
                "shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium",
                isActive && "bg-primary-foreground/20",
                isCompleted && !isActive && "bg-primary/20",
                !isActive && !isCompleted && "bg-muted-foreground/20"
              )}>
                {isProcessing && isActive ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isCompleted ? (
                  <Check className="h-3 w-3" />
                ) : isLocked ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              <span className="text-xs font-medium truncate hidden sm:block">{stage.label}</span>
              <span className="text-xs font-medium sm:hidden">{stage.shortLabel}</span>
            </button>
            
            {index < stages.length - 1 && (
              <div className={cn(
                "w-4 h-0.5 mx-1 shrink-0",
                stageStatuses[stages[index + 1].id] !== 'locked' 
                  ? "bg-primary/30" 
                  : "bg-muted-foreground/20"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function getStageBadge(stage: AgentStage): string {
  return stages.find(s => s.id === stage)?.shortLabel || '';
}
