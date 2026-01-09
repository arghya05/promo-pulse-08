import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Check,
  Loader2,
  Clock,
  Lock,
  ChevronRight,
  User,
  Send,
  Bot,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentStage } from './AgentPipelineRibbon';

export interface AgentInfo {
  id: string;
  name: string;
  status: 'completed' | 'running' | 'queued' | 'blocked';
  summary?: string;
  artifact?: string;
}

export interface TimelineEntry {
  id: string;
  timestamp: Date;
  type: 'user' | 'system' | 'agent';
  message: string;
  details?: string;
}

export interface InputRequest {
  id: string;
  question: string;
  options?: { value: string; label: string }[];
}

interface AgentConsolePanelProps {
  agents: AgentInfo[];
  timeline: TimelineEntry[];
  inputRequest?: InputRequest | null;
  currentStage: AgentStage;
  onSubmitInput?: (requestId: string, value: string) => void;
  onViewArtifact?: (agentId: string) => void;
}

const agentStatusConfig: Record<AgentInfo['status'], { icon: typeof Check; color: string; bg: string; animate?: boolean }> = {
  completed: { icon: Check, color: 'text-green-600', bg: 'bg-green-500/10' },
  running: { icon: Loader2, color: 'text-primary', bg: 'bg-primary/10', animate: true },
  queued: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
  blocked: { icon: Lock, color: 'text-amber-600', bg: 'bg-amber-500/10' },
};

export function AgentConsolePanel({
  agents,
  timeline,
  inputRequest,
  currentStage,
  onSubmitInput,
  onViewArtifact
}: AgentConsolePanelProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = () => {
    if (inputRequest && inputValue.trim() && onSubmitInput) {
      onSubmitInput(inputRequest.id, inputValue);
      setInputValue('');
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          Agents
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        {/* Agent List */}
        <div className="px-4 pb-3">
          <div className="space-y-1.5">
            {agents.map((agent) => {
              const config = agentStatusConfig[agent.status];
              const Icon = config.icon;
              
              return (
                <div
                  key={agent.id}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-md text-xs",
                    config.bg
                  )}
                >
                  <Icon className={cn(
                    "h-3.5 w-3.5 shrink-0 mt-0.5",
                    config.color,
                    config.animate && "animate-spin"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium truncate">{agent.name}</span>
                      {agent.artifact && onViewArtifact && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[10px]"
                          onClick={() => onViewArtifact(agent.id)}
                        >
                          <FileText className="h-2.5 w-2.5 mr-0.5" />
                          View
                        </Button>
                      )}
                    </div>
                    {agent.summary && (
                      <p className="text-muted-foreground text-[10px] truncate mt-0.5">
                        {agent.summary}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Input Request (Human-in-the-loop) */}
        {inputRequest && (
          <>
            <Separator />
            <div className="px-4 py-3">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    Input needed
                  </span>
                </div>
                <p className="text-xs text-foreground mb-2">{inputRequest.question}</p>
                
                {inputRequest.options ? (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {inputRequest.options.map((opt) => (
                      <Button
                        key={opt.value}
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px]"
                        onClick={() => onSubmitInput?.(inputRequest.id, opt.value)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Enter your response..."
                      className="h-7 text-xs"
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                    <Button size="sm" className="h-7" onClick={handleSubmit}>
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Run Timeline */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-4 py-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Run Timeline</h4>
          </div>
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2 pb-4">
              {timeline.map((entry, idx) => (
                <div key={entry.id} className="flex gap-2 text-[11px]">
                  <div className="shrink-0 flex flex-col items-center">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center",
                      entry.type === 'user' ? "bg-primary/10" : 
                      entry.type === 'agent' ? "bg-green-500/10" : 
                      "bg-muted"
                    )}>
                      {entry.type === 'user' ? (
                        <User className="h-2.5 w-2.5 text-primary" />
                      ) : entry.type === 'agent' ? (
                        <Bot className="h-2.5 w-2.5 text-green-600" />
                      ) : (
                        <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
                      )}
                    </div>
                    {idx < timeline.length - 1 && (
                      <div className="w-px h-full bg-border min-h-[16px]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <p className="font-medium">{entry.message}</p>
                    {entry.details && (
                      <p className="text-muted-foreground text-[10px]">{entry.details}</p>
                    )}
                    <p className="text-muted-foreground text-[9px] mt-0.5">
                      {formatTimestamp(entry.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}
