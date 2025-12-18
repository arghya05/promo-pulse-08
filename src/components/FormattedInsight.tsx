import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormattedInsightProps {
  content: string;
  className?: string;
}

// Highlight numbers, percentages, and currency values
const highlightMetrics = (text: string): React.ReactNode[] => {
  // Pattern to match: $1.15M, 1.48x, 15%, $720K, etc.
  const metricPattern = /(\$[\d,.]+[KMB]?|\d+\.?\d*[xX%]|\d+\.?\d*%|\$[\d,.]+)/g;
  const parts = text.split(metricPattern);
  
  return parts.map((part, idx) => {
    if (metricPattern.test(part)) {
      // Reset the regex lastIndex
      metricPattern.lastIndex = 0;
      
      // Determine if positive or negative context
      const isPositive = part.includes('x') && parseFloat(part) >= 1;
      const isNegative = part.includes('x') && parseFloat(part) < 1;
      
      return (
        <span
          key={idx}
          className={cn(
            "font-semibold px-1 py-0.5 rounded mx-0.5",
            isPositive && "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
            isNegative && "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
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

// Determine insight type based on content
const getInsightType = (text: string): 'positive' | 'negative' | 'neutral' | 'comparison' => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('higher') || lowerText.includes('strong') || lowerText.includes('increase') || lowerText.includes('growth')) {
    return 'positive';
  }
  if (lowerText.includes('lower') || lowerText.includes('decline') || lowerText.includes('decrease') || lowerText.includes('underperform')) {
    return 'negative';
  }
  if (lowerText.includes('contrast') || lowerText.includes('compared') || lowerText.includes('versus') || lowerText.includes('while')) {
    return 'comparison';
  }
  return 'neutral';
};

const InsightIcon: React.FC<{ type: 'positive' | 'negative' | 'neutral' | 'comparison' }> = ({ type }) => {
  const iconClass = "h-4 w-4 flex-shrink-0 mt-0.5";
  
  switch (type) {
    case 'positive':
      return <TrendingUp className={cn(iconClass, "text-emerald-500")} />;
    case 'negative':
      return <TrendingDown className={cn(iconClass, "text-amber-500")} />;
    case 'comparison':
      return <ArrowRight className={cn(iconClass, "text-blue-500")} />;
    default:
      return <CheckCircle2 className={cn(iconClass, "text-muted-foreground")} />;
  }
};

export const FormattedInsight: React.FC<FormattedInsightProps> = ({ content, className }) => {
  // Parse bullet points
  const lines = content.split('\n').filter(line => line.trim());
  
  // Check if content has bullet points
  const hasBullets = lines.some(line => line.trim().startsWith('•') || line.trim().startsWith('-'));
  
  if (!hasBullets) {
    // Single paragraph - format as insight card
    return (
      <div className={cn("text-sm leading-relaxed w-full overflow-hidden", className)} style={{ wordWrap: 'break-word', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
        {highlightMetrics(content)}
      </div>
    );
  }
  
  // Format as professional insight list
  const insights = lines.map(line => {
    // Remove bullet markers
    const cleanLine = line.trim().replace(/^[•\-]\s*/, '');
    return cleanLine;
  }).filter(Boolean);
  
  return (
    <div className={cn("space-y-3 w-full overflow-hidden", className)}>
      {insights.map((insight, idx) => {
        const type = getInsightType(insight);
        
        return (
          <div
            key={idx}
            className={cn(
              "flex gap-3 p-3 rounded-lg border transition-colors overflow-hidden",
              type === 'positive' && "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30",
              type === 'negative' && "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30",
              type === 'comparison' && "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/30",
              type === 'neutral' && "bg-muted/30 border-border/50"
            )}
          >
            <InsightIcon type={type} />
            <p className="text-sm leading-relaxed flex-1" style={{ wordWrap: 'break-word', overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 }}>
              {highlightMetrics(insight)}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default FormattedInsight;
