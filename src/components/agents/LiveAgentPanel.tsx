import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Check,
  Loader2,
  Clock,
  Lock,
  AlertCircle,
  Bot,
  User,
  ChevronRight,
  FileText,
  Zap,
  RotateCcw,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AGENT_DEFINITIONS, AgentId } from './cross-module-data';
import { AgentState, TimelineEvent, AgentArtifact } from './AgentOrchestrator';

interface LiveAgentPanelProps {
  agents: Record<AgentId, AgentState>;
  timeline: TimelineEvent[];
  onViewArtifact?: (artifact: AgentArtifact) => void;
  isRunning: boolean;
}

const statusConfig: Record<AgentState['status'], { icon: typeof Check; color: string; bg: string; label: string }> = {
  idle: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Idle' },
  queued: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Queued' },
  running: { icon: Loader2, color: 'text-primary', bg: 'bg-primary/10', label: 'Running' },
  waiting_approval: { icon: Lock, color: 'text-amber-600', bg: 'bg-amber-500/10', label: 'Waiting' },
  completed: { icon: Check, color: 'text-green-600', bg: 'bg-green-500/10', label: 'Done' },
  failed: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-500/10', label: 'Failed' },
};

// Agent output preview summaries
const agentOutputPreviews: Record<AgentId, string> = {
  discovery: 'Ranked 3 cross-merch plays',
  signals: 'Collected 4 signals from 3 sources',
  entity: 'SKU/DC/Vendor mappings validated',
  anomaly: 'Found demand spike +34% in West',
  guardrails: '4/5 guardrails passed',
  rootcause: 'Top cause: Supplier delay (92%)',
  planner: '5 coordinated actions generated',
  risk: 'Risk: 22% — safe for autopilot',
  executor: '5 tool calls executed, 1 retry',
  roi: 'Expected ₹14.8L, Realized ₹13.9L',
};

export function LiveAgentPanel({ agents, timeline, onViewArtifact, isRunning }: LiveAgentPanelProps) {
  const completedCount = Object.values(agents).filter(a => a.status === 'completed').length;
  const totalAgents = Object.keys(agents).length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 px-4 shrink-0">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            Agents
            <Badge variant="secondary" className="text-[9px]">
              {completedCount}/{totalAgents}
            </Badge>
          </div>
          {isRunning && (
            <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary animate-pulse">
              <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
              Processing
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        {/* Agent List with Output Previews */}
        <ScrollArea className="flex-1">
          <div className="px-4 pb-3 space-y-1">
            {AGENT_DEFINITIONS.map((def) => {
              const state = agents[def.id];
              const config = statusConfig[state.status];
              const Icon = config.icon;
              const outputPreview = state.artifact?.summary || agentOutputPreviews[def.id];

              return (
                <TooltipProvider key={def.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md text-xs transition-all cursor-default",
                          config.bg
                        )}
                      >
                        <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-background/50">
                          <Icon className={cn(
                            "h-3 w-3",
                            config.color,
                            state.status === 'running' && "animate-spin"
                          )} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="text-[8px] px-1 py-0">
                              {def.shortName}
                            </Badge>
                            <span className="font-medium truncate text-[11px]">{def.name}</span>
                          </div>
                          
                          {/* Always show output preview or working status */}
                          {state.status === 'running' ? (
                            <div className="mt-1">
                              <Progress value={state.progress} className="h-1" />
                              <p className="text-[9px] text-muted-foreground mt-0.5">
                                Working... {state.progress}%
                              </p>
                            </div>
                          ) : state.status === 'completed' || state.artifact ? (
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                              <ArrowRight className="h-2 w-2 shrink-0" />
                              {outputPreview}
                            </p>
                          ) : state.status === 'queued' ? (
                            <p className="text-[10px] text-muted-foreground mt-0.5">Queued</p>
                          ) : null}
                        </div>

                        {state.artifact && onViewArtifact && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1.5 text-[9px] shrink-0"
                            onClick={() => onViewArtifact(state.artifact!)}
                          >
                            <Eye className="h-2.5 w-2.5" />
                          </Button>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[200px]">
                      <p className="text-xs font-medium">{def.name}</p>
                      <p className="text-[10px] text-muted-foreground">{def.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </ScrollArea>

        <Separator />

        {/* Run Timeline */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="px-4 py-2 shrink-0 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground">Run Timeline</h4>
            <Badge variant="secondary" className="text-[9px]">{timeline.length} events</Badge>
          </div>
          
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2 pb-4">
              {timeline.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Click "Run Now" to start
                </p>
              ) : (
                timeline.slice(0, 20).map((event, idx) => (
                  <TimelineEventRow key={event.id} event={event} isLast={idx === Math.min(timeline.length, 20) - 1} />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineEventRow({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const getIcon = () => {
    switch (event.type) {
      case 'agent_start':
      case 'agent_complete':
        return <Bot className="h-2.5 w-2.5 text-primary" />;
      case 'agent_fail':
        return <AlertCircle className="h-2.5 w-2.5 text-red-600" />;
      case 'artifact':
        return <FileText className="h-2.5 w-2.5 text-green-600" />;
      case 'approval_request':
        return <Lock className="h-2.5 w-2.5 text-amber-600" />;
      case 'approval_granted':
        return <Check className="h-2.5 w-2.5 text-green-600" />;
      case 'approval_denied':
        return <AlertCircle className="h-2.5 w-2.5 text-red-600" />;
      case 'tool_call':
        return <Zap className="h-2.5 w-2.5 text-blue-600" />;
      case 'user_action':
        return <User className="h-2.5 w-2.5 text-primary" />;
      default:
        return <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />;
    }
  };

  const getBg = () => {
    switch (event.type) {
      case 'agent_start':
      case 'agent_complete':
        return 'bg-primary/10';
      case 'agent_fail':
        return 'bg-red-500/10';
      case 'artifact':
        return 'bg-green-500/10';
      case 'approval_request':
        return 'bg-amber-500/10';
      case 'approval_granted':
        return 'bg-green-500/10';
      case 'approval_denied':
        return 'bg-red-500/10';
      case 'tool_call':
        return 'bg-blue-500/10';
      case 'user_action':
        return 'bg-primary/10';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="flex gap-2 text-[11px]">
      <div className="shrink-0 flex flex-col items-center">
        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", getBg())}>
          {getIcon()}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border min-h-[12px]" />}
      </div>
      <div className="flex-1 min-w-0 pb-2">
        <p className="font-medium">{event.message}</p>
        {event.details && (
          <p className="text-muted-foreground text-[10px]">{event.details}</p>
        )}
        {event.type === 'tool_call' && event.payload && (
          <div className="mt-1 p-1.5 bg-muted/50 rounded text-[9px] font-mono">
            <span className="text-primary">{event.payload.system}</span>
            <span className="text-muted-foreground"> → </span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-[8px]",
                event.payload.status === 'success' ? "text-green-600" :
                event.payload.status === 'retrying' ? "text-amber-600" :
                "text-red-600"
              )}
            >
              {event.payload.status}
            </Badge>
          </div>
        )}
        <p className="text-muted-foreground text-[9px] mt-0.5">
          {formatTime(event.timestamp)}
        </p>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}
