import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  Check, 
  Circle,
  X,
  Pause
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExecutionStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  system?: string;
}

interface RunProgressPanelProps {
  isRunning: boolean;
  runId?: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function RunProgressPanel({ 
  isRunning, 
  runId, 
  onComplete,
  onCancel 
}: RunProgressPanelProps) {
  const [steps, setSteps] = useState<ExecutionStep[]>([
    { id: '1', label: 'Validating actions', status: 'pending' },
    { id: '2', label: 'Applying price changes', status: 'pending', system: 'Pricing Engine' },
    { id: '3', label: 'Updating inventory rules', status: 'pending', system: 'WMS' },
    { id: '4', label: 'Creating tickets', status: 'pending', system: 'Ticketing' },
    { id: '5', label: 'Finalizing run', status: 'pending' },
  ]);
  
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      setSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));
      setCurrentStepIndex(-1);
      setProgress(0);
      return;
    }

    // Simulate step progression
    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        const next = prev + 1;
        if (next >= steps.length) {
          clearInterval(interval);
          onComplete?.();
          return prev;
        }
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isRunning, steps.length, onComplete]);

  useEffect(() => {
    setSteps(prev => prev.map((step, idx) => ({
      ...step,
      status: idx < currentStepIndex ? 'completed' : 
              idx === currentStepIndex ? 'running' : 'pending'
    })));
    setProgress(currentStepIndex >= 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0);
  }, [currentStepIndex, steps.length]);

  const allCompleted = currentStepIndex >= steps.length - 1 && steps[steps.length - 1]?.status === 'completed';

  if (!isRunning && currentStepIndex === -1) {
    return null;
  }

  return (
    <Card className={cn(
      "border-2 transition-colors",
      allCompleted ? "border-green-500/30 bg-green-500/5" : "border-primary/30 bg-primary/5"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            {allCompleted ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-green-700 dark:text-green-400">Run Complete</span>
              </>
            ) : (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Executing...</span>
              </>
            )}
          </CardTitle>
          {runId && (
            <Badge variant="outline" className="text-[10px]">{runId}</Badge>
          )}
        </div>
        <Progress value={progress} className="h-1.5 mt-2" />
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="space-y-2">
          {steps.map((step) => (
            <div 
              key={step.id} 
              className={cn(
                "flex items-center gap-2 p-2 rounded transition-all",
                step.status === 'running' && "bg-primary/10",
                step.status === 'completed' && "opacity-70"
              )}
            >
              <div className="shrink-0">
                {step.status === 'completed' ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : step.status === 'running' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                )}
              </div>
              <span className={cn(
                "text-xs flex-1",
                step.status === 'pending' && "text-muted-foreground"
              )}>
                {step.label}
              </span>
              {step.system && (
                <Badge variant="outline" className="text-[9px]">{step.system}</Badge>
              )}
            </div>
          ))}
        </div>
        
        {!allCompleted && (
          <div className="flex justify-end mt-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs gap-1 text-muted-foreground"
              onClick={onCancel}
            >
              <Pause className="h-3 w-3" />
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
