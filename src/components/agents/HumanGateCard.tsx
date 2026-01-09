import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  RotateCcw, 
  AlertTriangle, 
  SkipForward,
  User,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type GateDecision = 'approve' | 'revise' | 'escalate' | 'skip';

interface GateOption {
  decision: GateDecision;
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'secondary' | 'outline' | 'ghost';
  description?: string;
}

interface HumanGateCardProps {
  title: string;
  options: GateOption[];
  onDecision: (decision: GateDecision, reason?: string) => void;
  isProcessing?: boolean;
  currentDecision?: GateDecision | null;
  timestamp?: Date;
  actor?: string;
}

export function HumanGateCard({
  title,
  options,
  onDecision,
  isProcessing,
  currentDecision,
  timestamp,
  actor
}: HumanGateCardProps) {
  if (currentDecision) {
    const selectedOption = options.find(o => o.decision === currentDecision);
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-primary">
                  {selectedOption?.label || 'Decision made'}
                </p>
                {actor && timestamp && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <User className="h-2.5 w-2.5" /> {actor} · <Clock className="h-2.5 w-2.5" /> {formatTime(timestamp)}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
              Completed
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
          </div>
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            {title}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <Button
              key={option.decision}
              size="sm"
              variant={option.variant}
              onClick={() => onDecision(option.decision)}
              disabled={isProcessing}
              className={cn(
                "h-8 gap-1.5 text-xs",
                option.variant === 'default' && "bg-primary hover:bg-primary/90"
              )}
            >
              {option.icon}
              {option.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

// Pre-defined gate options for each stage
export const discoveryGateOptions: GateOption[] = [
  { decision: 'approve', label: 'Approve discovery', icon: <Check className="h-3 w-3" />, variant: 'default' },
  { decision: 'revise', label: 'Request refinement', icon: <RotateCcw className="h-3 w-3" />, variant: 'outline' },
  { decision: 'skip', label: 'Not relevant', icon: <SkipForward className="h-3 w-3" />, variant: 'ghost' },
];

export const diagnosisGateOptions: GateOption[] = [
  { decision: 'approve', label: 'Approve root cause', icon: <Check className="h-3 w-3" />, variant: 'default' },
  { decision: 'revise', label: 'Request more evidence', icon: <RotateCcw className="h-3 w-3" />, variant: 'outline' },
  { decision: 'escalate', label: 'Escalate to analyst', icon: <AlertTriangle className="h-3 w-3" />, variant: 'ghost' },
];

export const planGateOptions: GateOption[] = [
  { decision: 'approve', label: 'Approve plan', icon: <Check className="h-3 w-3" />, variant: 'default' },
  { decision: 'revise', label: 'Modify actions', icon: <RotateCcw className="h-3 w-3" />, variant: 'outline' },
];

export const measureGateOptions: GateOption[] = [
  { decision: 'approve', label: 'Accept results', icon: <Check className="h-3 w-3" />, variant: 'default' },
  { decision: 'revise', label: 'Dispute measurement', icon: <RotateCcw className="h-3 w-3" />, variant: 'outline' },
];
