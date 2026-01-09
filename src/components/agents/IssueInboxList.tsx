import { useState } from 'react';
import { Problem } from './types';
import { AgentStage, getStageBadge } from './AgentPipelineRibbon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  PanelLeftClose, 
  PanelLeft,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IssueInboxListProps {
  problems: Problem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  problemStages: Record<string, AgentStage>;
}

export function IssueInboxList({
  problems,
  selectedId,
  onSelect,
  isCollapsed,
  onToggleCollapse,
  problemStages
}: IssueInboxListProps) {
  const [search, setSearch] = useState('');
  const [market, setMarket] = useState('all');
  const [timeWindow, setTimeWindow] = useState('7d');

  const filteredProblems = problems.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-4 px-2 bg-muted/30 rounded-lg h-full">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleCollapse}
          className="mb-4"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <div className="space-y-2">
          {problems.slice(0, 5).map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-medium transition-all",
                selectedId === p.id 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted hover:bg-muted-foreground/20",
                p.urgency === 'now' && selectedId !== p.id && "ring-2 ring-red-500/50"
              )}
            >
              {getStageBadge(problemStages[p.id] || 'discovery')}
            </button>
          ))}
        </div>
        <Badge className="mt-4 text-[9px]" variant="secondary">
          {problems.length}
        </Badge>
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Priority Inbox</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={onToggleCollapse}
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={market} onValueChange={setMarket}>
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue placeholder="Market" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Markets</SelectItem>
              <SelectItem value="north">North</SelectItem>
              <SelectItem value="south">South</SelectItem>
              <SelectItem value="west">West</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeWindow} onValueChange={setTimeWindow}>
            <SelectTrigger className="h-7 text-xs w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7d">7d</SelectItem>
              <SelectItem value="30d">30d</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-2 pt-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-1.5 pr-2">
            {filteredProblems.map((problem) => (
              <IssueRow
                key={problem.id}
                problem={problem}
                isSelected={problem.id === selectedId}
                stage={problemStages[problem.id] || 'discovery'}
                onClick={() => onSelect(problem.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface IssueRowProps {
  problem: Problem;
  isSelected: boolean;
  stage: AgentStage;
  onClick: () => void;
}

function IssueRow({ problem, isSelected, stage, onClick }: IssueRowProps) {
  const urgencyColors = {
    now: 'bg-red-500/10 text-red-600 border-red-200',
    '24h': 'bg-amber-500/10 text-amber-600 border-amber-200',
    '7d': 'bg-blue-500/10 text-blue-600 border-blue-200',
  };

  const confidenceColors = {
    high: 'text-green-600',
    med: 'text-amber-600',
    low: 'text-muted-foreground',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-2.5 rounded-lg transition-all border",
        isSelected 
          ? "bg-primary/5 border-primary/30 shadow-sm" 
          : "bg-background border-transparent hover:bg-muted/50 hover:border-muted"
      )}
    >
      <div className="flex items-start gap-2">
        <div className={cn(
          "shrink-0 w-6 h-6 rounded flex items-center justify-center text-[10px] font-semibold",
          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {getStageBadge(stage)}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate mb-1">{problem.title}</p>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-primary">
              ₹{problem.impact}L
            </span>
            <Badge 
              variant="outline" 
              className={cn("text-[9px] h-4 px-1.5", urgencyColors[problem.urgency])}
            >
              {problem.urgency === 'now' && <AlertTriangle className="h-2 w-2 mr-0.5" />}
              {problem.urgency === 'now' ? 'Now' : problem.urgency}
            </Badge>
            <span className={cn("text-[10px]", confidenceColors[problem.confidence])}>
              {problem.confidence.charAt(0).toUpperCase() + problem.confidence.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
