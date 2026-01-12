import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  RotateCcw, 
  AlertTriangle, 
  SkipForward,
  ArrowRight,
  Shield,
  User,
  Clock,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApprovalGate, GateDefinition, APPROVAL_GATES } from './cross-module-data';

interface ApprovalGateCardProps {
  gate: ApprovalGate;
  onDecision: (decision: 'approved' | 'revised' | 'escalated' | 'skipped') => void;
  isProcessing?: boolean;
  mode: 'advisory' | 'autopilot';
  autoApproveEligible?: boolean;
}

export function ApprovalGateCard({
  gate,
  onDecision,
  isProcessing,
  mode,
  autoApproveEligible,
}: ApprovalGateCardProps) {
  const gateDef = APPROVAL_GATES.find(g => g.id === gate);
  if (!gateDef) return null;

  const showAutoApprove = mode === 'autopilot' && autoApproveEligible && gateDef.autoApproveCondition;

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                Human Approval Required
              </h3>
              <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                Gate {APPROVAL_GATES.findIndex(g => g.id === gate) + 1} of 5
              </Badge>
            </div>
            <p className="text-sm font-medium mt-1">{gateDef.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{gateDef.description}</p>
          </div>
        </div>

        {/* Auto-approve indicator */}
        {showAutoApprove && (
          <div className="p-2 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <p className="text-xs font-medium text-primary">Autopilot eligible</p>
              <p className="text-[10px] text-muted-foreground">{gateDef.autoApproveCondition}</p>
            </div>
            <Button 
              size="sm" 
              className="h-7 text-xs gap-1"
              onClick={() => onDecision('approved')}
              disabled={isProcessing}
            >
              <Zap className="h-3 w-3" />
              Auto-approve
            </Button>
          </div>
        )}

        {/* Decision Options */}
        <div className="space-y-2">
          {gateDef.options.map((option) => {
            const isPrimary = option.isPrimary;
            
            return (
              <button
                key={option.id}
                onClick={() => onDecision(option.id as any)}
                disabled={isProcessing}
                className={cn(
                  "w-full p-3 rounded-lg border transition-all text-left group",
                  isPrimary 
                    ? "bg-primary/5 border-primary/30 hover:bg-primary/10" 
                    : "bg-background border-border hover:border-primary/30 hover:bg-muted/30",
                  isProcessing && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    isPrimary ? "bg-primary/20" : "bg-muted"
                  )}>
                    {option.icon === 'approve' && <Check className={cn("h-4 w-4", isPrimary ? "text-primary" : "text-muted-foreground")} />}
                    {option.icon === 'revise' && <RotateCcw className="h-4 w-4 text-muted-foreground" />}
                    {option.icon === 'escalate' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                    {option.icon === 'skip' && <SkipForward className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <p className={cn("text-sm font-medium", isPrimary && "text-primary")}>{option.label}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ArrowRight className="h-2.5 w-2.5" />
                      {option.consequence}
                    </p>
                  </div>
                  {isPrimary && (
                    <Badge className="text-[9px] bg-primary text-primary-foreground">
                      Recommended
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Context footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            Your decision will be logged
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            SLA: respond within 2h
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Completed gate display
interface CompletedGateProps {
  gate: ApprovalGate;
  decision: 'approved' | 'revised' | 'escalated' | 'skipped';
  actor?: string;
  timestamp?: Date;
}

export function CompletedGate({ gate, decision, actor = 'You', timestamp = new Date() }: CompletedGateProps) {
  const gateDef = APPROVAL_GATES.find(g => g.id === gate);
  
  const getDecisionColor = () => {
    switch (decision) {
      case 'approved': return 'text-green-600 bg-green-500/10 border-green-500/30';
      case 'revised': return 'text-amber-600 bg-amber-500/10 border-amber-500/30';
      case 'escalated': return 'text-orange-600 bg-orange-500/10 border-orange-500/30';
      case 'skipped': return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getDecisionIcon = () => {
    switch (decision) {
      case 'approved': return <Check className="h-3.5 w-3.5" />;
      case 'revised': return <RotateCcw className="h-3.5 w-3.5" />;
      case 'escalated': return <AlertTriangle className="h-3.5 w-3.5" />;
      case 'skipped': return <SkipForward className="h-3.5 w-3.5" />;
    }
  };

  return (
    <Card className={cn("border", getDecisionColor())}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-current/10 flex items-center justify-center">
              {getDecisionIcon()}
            </div>
            <div>
              <p className="text-xs font-medium">{gateDef?.title}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <User className="h-2.5 w-2.5" /> {actor} · <Clock className="h-2.5 w-2.5" /> {formatTime(timestamp)}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-[9px]", getDecisionColor())}>
            {decision.charAt(0).toUpperCase() + decision.slice(1)}
          </Badge>
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
