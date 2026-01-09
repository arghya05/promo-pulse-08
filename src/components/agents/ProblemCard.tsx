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
  pricing: 'bg-green-500/10 text-green-700 border-green-500/20',
  promo: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  supply: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  forecast: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  space: 'bg-pink-500/10 text-pink-700 border-pink-500/20',
  assortment: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20'
};

const urgencyConfig: Record<UrgencyLevel, { label: string; className: string }> = {
  now: { label: 'Now', className: 'bg-red-500 text-white' },
  '24h': { label: '24h', className: 'bg-amber-500 text-white' },
  '7d': { label: '7d', className: 'bg-blue-500 text-white' }
};

const confidenceConfig: Record<ConfidenceLevel, { label: string; className: string }> = {
  high: { label: 'High', className: 'text-green-600' },
  med: { label: 'Med', className: 'text-amber-600' },
  low: { label: 'Low', className: 'text-gray-500' }
};

const statusConfig: Record<ProblemStatus, { label: string; icon: React.ElementType; className: string }> = {
  new: { label: 'New', icon: AlertTriangle, className: 'bg-blue-500/10 text-blue-600' },
  investigating: { label: 'Investigating', icon: Eye, className: 'bg-purple-500/10 text-purple-600' },
  awaiting_approval: { label: 'Awaiting Approval', icon: Send, className: 'bg-amber-500/10 text-amber-600' },
  running: { label: 'Running', icon: Loader2, className: 'bg-green-500/10 text-green-600' },
  completed: { label: 'Completed', icon: CheckCircle, className: 'bg-gray-500/10 text-gray-600' }
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
