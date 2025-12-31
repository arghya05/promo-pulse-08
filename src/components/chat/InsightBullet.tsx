import React from 'react';
import { TrendingUp, TrendingDown, ArrowRight, CheckCircle2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface InsightBulletProps {
  text: string;
  isTopInsight?: boolean;
  type?: 'positive' | 'negative' | 'neutral' | 'comparison';
  className?: string;
}

// Detect insight type from text
const detectType = (text: string): 'positive' | 'negative' | 'neutral' | 'comparison' => {
  const lower = text.toLowerCase();
  if (lower.includes('higher') || lower.includes('strong') || lower.includes('increase') || lower.includes('growth') || lower.includes('top')) {
    return 'positive';
  }
  if (lower.includes('lower') || lower.includes('decline') || lower.includes('decrease') || lower.includes('underperform') || lower.includes('risk')) {
    return 'negative';
  }
  if (lower.includes('compared') || lower.includes('versus') || lower.includes('while') || lower.includes('contrast')) {
    return 'comparison';
  }
  return 'neutral';
};

// Highlight metrics in text
const highlightMetrics = (text: string): React.ReactNode[] => {
  const metricPattern = /(\$[\d,.]+[KMB]?|\d+\.?\d*%|\d+\.?\d*[xX]|\d+[KMB])/g;
  const parts = text.split(metricPattern);
  
  return parts.map((part, idx) => {
    if (metricPattern.test(part)) {
      metricPattern.lastIndex = 0;
      return (
        <span
          key={idx}
          className="font-semibold text-primary bg-primary/10 px-1 py-0.5 rounded mx-0.5"
        >
          {part}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};

export const InsightBullet: React.FC<InsightBulletProps> = ({
  text,
  isTopInsight = false,
  type: providedType,
  className
}) => {
  const type = providedType || detectType(text);
  
  const iconClass = "h-3.5 w-3.5 flex-shrink-0";
  const Icon = type === 'positive' ? TrendingUp :
               type === 'negative' ? TrendingDown :
               type === 'comparison' ? ArrowRight : CheckCircle2;
  
  const iconColor = type === 'positive' ? 'text-emerald-500' :
                    type === 'negative' ? 'text-amber-500' :
                    type === 'comparison' ? 'text-blue-500' : 'text-muted-foreground';

  return (
    <div
      className={cn(
        "flex items-start gap-2 py-1.5",
        isTopInsight && "relative",
        className
      )}
    >
      <Icon className={cn(iconClass, iconColor, "mt-0.5")} />
      <span className="text-sm leading-relaxed flex-1 min-w-0 break-words">
        {highlightMetrics(text)}
      </span>
      {isTopInsight && (
        <Badge 
          variant="secondary" 
          className="text-[9px] px-1.5 py-0 h-4 flex-shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-fade-in"
        >
          <Star className="h-2.5 w-2.5 mr-0.5" />
          Key
        </Badge>
      )}
    </div>
  );
};

export default InsightBullet;
