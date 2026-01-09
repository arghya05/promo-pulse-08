import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Database, Info } from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  freshness?: string;
}

interface Assumption {
  id: string;
  text: string;
  details?: string;
}

interface EvidenceStripProps {
  sources: DataSource[];
  assumptions: Assumption[];
  onViewDetails?: () => void;
}

export function EvidenceStrip({ sources, assumptions, onViewDetails }: EvidenceStripProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5">
        <Database className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">Sources:</span>
        {sources.map((source) => (
          <TooltipProvider key={source.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 cursor-help">
                  {source.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{source.name}</p>
                {source.freshness && (
                  <p className="text-[10px] text-muted-foreground">Updated: {source.freshness}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      
      <div className="flex items-center gap-1.5">
        <Info className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">Assumptions:</span>
        {assumptions.slice(0, 2).map((assumption) => (
          <TooltipProvider key={assumption.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 cursor-help">
                  {assumption.text}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-[200px]">{assumption.details || assumption.text}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {assumptions.length > 2 && (
          <Button variant="ghost" size="sm" className="h-4 px-1.5 text-[9px]" onClick={onViewDetails}>
            +{assumptions.length - 2} more
          </Button>
        )}
      </div>
    </div>
  );
}
