import React from 'react';
import { TrendingUp, TrendingDown, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import UniversalScrollableText from './UniversalScrollableText';

interface FormattedInsightProps {
  content: string;
  className?: string;
}

// Highlight numbers, percentages, and currency values
const highlightMetrics = (text: string): React.ReactNode[] => {
  const metricPattern = /(\$[\d,.]+[KMB]?|\d+\.?\d*[xX%]|\d+\.?\d*%|\$[\d,.]+)/g;
  const parts = text.split(metricPattern);
  
  return parts.map((part, idx) => {
    if (metricPattern.test(part)) {
      metricPattern.lastIndex = 0;
      const isPositive = part.includes('x') && parseFloat(part) >= 1;
      const isNegative = part.includes('x') && parseFloat(part) < 1;
      
      return (
        <span
          key={idx}
          className={cn(
            "font-semibold px-1 py-0.5 rounded mx-0.5",
            isPositive && "text-status-good dark:text-status-good bg-status-good/10 dark:bg-status-good/20/30",
            isNegative && "text-status-warning dark:text-status-warning bg-status-warning/10 dark:bg-status-warning/20/30",
            !isPositive && !isNegative && "text-primary bg-primary/10"
          )}
        >
          {part}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};

const getInsightType = (text: string): 'positive' | 'negative' | 'neutral' | 'comparison' => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('higher') || lowerText.includes('strong') || lowerText.includes('increase') || lowerText.includes('growth') || lowerText.includes('top performer')) {
    return 'positive';
  }
  if (lowerText.includes('lower') || lowerText.includes('decline') || lowerText.includes('decrease') || lowerText.includes('underperform') || lowerText.includes('lowest')) {
    return 'negative';
  }
  if (lowerText.includes('contrast') || lowerText.includes('compared') || lowerText.includes('versus') || lowerText.includes('while')) {
    return 'comparison';
  }
  return 'neutral';
};

const InsightIcon: React.FC<{ type: 'positive' | 'negative' | 'neutral' | 'comparison' }> = ({ type }) => {
  const iconClass = "h-4 w-4 flex-shrink-0";
  
  switch (type) {
    case 'positive':
      return <TrendingUp className={cn(iconClass, "text-status-good")} />;
    case 'negative':
      return <TrendingDown className={cn(iconClass, "text-status-warning")} />;
    case 'comparison':
      return <ArrowRight className={cn(iconClass, "text-chart-2")} />;
    default:
      return <CheckCircle2 className={cn(iconClass, "text-muted-foreground")} />;
  }
};

// Scrollable row with horizontal scroll for long content
const ScrollableRow: React.FC<{ 
  children: React.ReactNode;
  bgColor?: string;
  borderColor?: string;
}> = ({ children, bgColor = "bg-muted/30", borderColor = "border-border/50" }) => {
  return (
    <div className={cn("rounded-lg border", bgColor, borderColor)}>
      <div className="p-3">
        <UniversalScrollableText>
          {children}
        </UniversalScrollableText>
      </div>
    </div>
  );
};

export const FormattedInsight: React.FC<FormattedInsightProps> = ({ content, className }) => {
  const lines = content.split('\n').filter(line => line.trim());
  const hasBullets = lines.some(line => line.trim().startsWith('•') || line.trim().startsWith('-'));
  
  if (!hasBullets) {
    return (
      <ScrollableRow>
        <p className="text-sm leading-relaxed">
          {highlightMetrics(content)}
        </p>
      </ScrollableRow>
    );
  }
  
  const insights = lines.map(line => line.trim().replace(/^[•\-]\s*/, '')).filter(Boolean);
  
  return (
    <div className={cn("space-y-3 w-full", className)}>
      {insights.map((insight, idx) => {
        const type = getInsightType(insight);
        const bgColor = type === 'positive' ? "bg-status-good/10/50 dark:bg-status-good/20/20" :
                        type === 'negative' ? "bg-status-warning/10/50 dark:bg-status-warning/20/20" :
                        type === 'comparison' ? "bg-chart-2/10/50 dark:bg-chart-2/20/20" : "bg-muted/30";
        const borderColor = type === 'positive' ? "border-status-good/30/50 dark:border-status-good/30" :
                           type === 'negative' ? "border-status-warning/30/50 dark:border-status-warning/30" :
                           type === 'comparison' ? "border-chart-2/30/50 dark:border-chart-2/30" : "border-border/50";
        
        return (
          <ScrollableRow key={idx} bgColor={bgColor} borderColor={borderColor}>
            <div className="flex gap-3 items-center">
              <InsightIcon type={type} />
              <span className="text-sm leading-relaxed">
                {highlightMetrics(insight)}
              </span>
            </div>
          </ScrollableRow>
        );
      })}
    </div>
  );
};

export default FormattedInsight;
