import { Problem, ModuleTag, UrgencyLevel, ConfidenceLevel, ProblemStatus } from './types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ArrowRight, Clock, User, AlertTriangle, CheckCircle, Loader2, Eye, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProblemCardProps {
  problem: Problem;
  isSelected: boolean;
  onClick: () => void;
}

const moduleColors: Record<ModuleTag, string> = {
  pricing: 'bg-status-good/10 text-status-good border-status-good/20',
  promo: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  supply: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  forecast: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
  space: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
  assortment: 'bg-chart-1/10 text-chart-1 border-chart-1/20'
};

const urgencyConfig: Record<UrgencyLevel, { label: string; className: string }> = {
  now: { label: 'Now', className: 'bg-status-bad text-primary-foreground' },
  '24h': { label: '24h', className: 'bg-status-warning text-primary-foreground' },
  '7d': { label: '7d', className: 'bg-chart-2 text-primary-foreground' }
};

const confidenceConfig: Record<ConfidenceLevel, { label: string; className: string }> = {
  high: { label: 'High', className: 'text-status-good' },
  med: { label: 'Med', className: 'text-status-warning' },
  low: { label: 'Low', className: 'text-muted-foreground' }
};

const statusConfig: Record<ProblemStatus, { label: string; icon: React.ElementType; className: string }> = {
  new: { label: 'New', icon: AlertTriangle, className: 'bg-chart-2/10 text-chart-2' },
  investigating: { label: 'Investigating', icon: Eye, className: 'bg-chart-5/10 text-chart-5' },
  awaiting_approval: { label: 'Awaiting Approval', icon: Send, className: 'bg-status-warning/10 text-status-warning' },
  running: { label: 'Running', icon: Loader2, className: 'bg-status-good/10 text-status-good' },
  completed: { label: 'Completed', icon: CheckCircle, className: 'bg-secondary/10 text-muted-foreground' }
};

export function ProblemCard({ problem, isSelected, onClick }: ProblemCardProps) {
  const StatusIcon = statusConfig[problem.status].icon;

  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all duration-200 hover:shadow-md border-2',
        isSelected 
          ? 'border-primary bg-primary/5 shadow-md' 
          : 'border-transparent hover:border-primary/20'
      )}
      onClick={onClick}
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline" className={cn('text-[10px] gap-1', statusConfig[problem.status].className)}>
          <StatusIcon className={cn('h-3 w-3', problem.status === 'running' && 'animate-spin')} />
          {statusConfig[problem.status].label}
        </Badge>
        <Badge className={cn('text-[10px]', urgencyConfig[problem.urgency].className)}>
          {urgencyConfig[problem.urgency].label}
        </Badge>
      </div>

      {/* Title */}
      <h4 className="font-medium text-sm leading-tight mb-2 line-clamp-2">
        {problem.title}
      </h4>

      {/* Module Tags */}
      <div className="flex flex-wrap gap-1 mb-2">
        {problem.modules.map((mod) => (
          <Badge 
            key={mod} 
            variant="outline" 
            className={cn('text-[9px] px-1.5 py-0 capitalize', moduleColors[mod])}
          >
            {mod}
          </Badge>
        ))}
      </div>

      {/* Impact */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-bold text-primary">
          ₹{problem.impact}L
        </div>
        <span className={cn('text-xs font-medium', confidenceConfig[problem.confidence].className)}>
          {confidenceConfig[problem.confidence].label} confidence
        </span>
      </div>

      {/* Meta Row */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {problem.sla}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {problem.owner}
          </span>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-primary" />
      </div>
    </Card>
  );
}
