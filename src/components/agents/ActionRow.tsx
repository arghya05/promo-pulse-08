import { Action, RiskLevel } from './types';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionRowProps {
  action: Action;
  index: number;
  onToggle: (id: string) => void;
}

const riskConfig: Record<RiskLevel, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-green-500/10 text-green-700 border-green-500/20' },
  med: { label: 'Med', className: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  high: { label: 'High', className: 'bg-red-500/10 text-red-700 border-red-500/20' }
};

export function ActionRow({ action, index, onToggle }: ActionRowProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-all',
        action.included 
          ? 'bg-primary/5 border-primary/20' 
          : 'bg-muted/30 border-transparent opacity-60'
      )}
    >
      <Checkbox
        id={action.id}
        checked={action.included}
        onCheckedChange={() => onToggle(action.id)}
        className="mt-0.5"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <label 
            htmlFor={action.id}
            className="text-sm font-medium cursor-pointer leading-tight"
          >
            <span className="text-muted-foreground mr-1.5">{index}.</span>
            {action.title}
          </label>
          <Badge variant="outline" className={cn('text-[10px] shrink-0', riskConfig[action.risk].className)}>
            {riskConfig[action.risk].label}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 mt-1.5">
          <TrendingUp className="h-3 w-3 text-green-600" />
          <span className="text-xs text-green-600 font-medium">
            +₹{action.upliftMin}L – ₹{action.upliftMax}L
          </span>
        </div>

        {action.guardrailViolations.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5 text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            <span className="text-[10px]">{action.guardrailViolations[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
}
