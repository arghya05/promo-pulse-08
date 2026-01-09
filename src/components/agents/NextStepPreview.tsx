import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NextStepPreviewProps {
  title: string;
  description: string;
  eta?: string;
  className?: string;
}

export function NextStepPreview({ title, description, eta, className }: NextStepPreviewProps) {
  return (
    <Card className={cn("bg-primary/5 border-primary/20", className)}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowRight className="h-3 w-3 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-primary">What happens next</span>
              {eta && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-0.5 bg-primary/10 border-primary/20 text-primary">
                  <Clock className="h-2 w-2" />
                  {eta}
                </Badge>
              )}
            </div>
            <p className="text-xs font-medium text-foreground">{title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
