import { AuditEntry } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Bot, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AuditTimelineProps {
  entries: AuditEntry[];
}

export function AuditTimeline({ entries }: AuditTimelineProps) {
  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-3 pr-4">
        {entries.map((entry, index) => {
          const isSystem = entry.user === 'System';
          return (
            <div key={entry.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                  isSystem ? 'bg-primary/10' : 'bg-muted'
                )}>
                  {isSystem ? (
                    <Bot className="h-3 w-3 text-primary" />
                  ) : (
                    <User className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                {index < entries.length - 1 && (
                  <div className="w-px h-full bg-border mt-1" />
                )}
              </div>
              
              <div className="flex-1 pb-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium">{entry.user}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {format(entry.timestamp, 'HH:mm')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{entry.action}</p>
                {entry.details && (
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">{entry.details}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
