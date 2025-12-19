import React, { useRef, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, CheckCircle2, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      return <TrendingUp className={cn(iconClass, "text-emerald-500")} />;
    case 'negative':
      return <TrendingDown className={cn(iconClass, "text-amber-500")} />;
    case 'comparison':
      return <ArrowRight className={cn(iconClass, "text-blue-500")} />;
    default:
      return <CheckCircle2 className={cn(iconClass, "text-muted-foreground")} />;
  }
};

// Individual scrollable row with real scrollbar
const ScrollableRow: React.FC<{ 
  children: React.ReactNode;
  bgColor?: string;
  borderColor?: string;
}> = ({ children, bgColor = "bg-muted/30", borderColor = "border-border/50" }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  
  useEffect(() => {
    const checkOverflow = () => {
      if (scrollRef.current) {
        setHasOverflow(scrollRef.current.scrollWidth > scrollRef.current.clientWidth);
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [children]);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -150 : 150, behavior: 'smooth' });
    }
  };

  return (
    <div className={cn("rounded-lg border relative", bgColor, borderColor)}>
      {/* Left scroll button */}
      {hasOverflow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-background/90 border rounded-full p-1 shadow-sm hover:bg-background"
        >
          <ChevronLeft className="h-3 w-3" />
        </button>
      )}
      
      {/* Right scroll button */}
      {hasOverflow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-background/90 border rounded-full p-1 shadow-sm hover:bg-background"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
      
      {/* Scrollable content */}
      <div 
        ref={scrollRef}
        className="overflow-x-auto p-3 insight-scrollbar"
      >
        <div className="whitespace-nowrap pr-8">
          {children}
        </div>
      </div>
      
      {/* CSS for visible scrollbar */}
      <style>{`
        .insight-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: hsl(217, 91%, 60%) hsl(var(--muted));
        }
        .insight-scrollbar::-webkit-scrollbar {
          height: 10px;
        }
        .insight-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 5px;
        }
        .insight-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(217, 91%, 60%);
          border-radius: 5px;
          border: 2px solid hsl(var(--muted));
        }
        .insight-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(217, 91%, 50%);
        }
      `}</style>
    </div>
  );
};

export const FormattedInsight: React.FC<FormattedInsightProps> = ({ content, className }) => {
  const lines = content.split('\n').filter(line => line.trim());
  const hasBullets = lines.some(line => line.trim().startsWith('•') || line.trim().startsWith('-'));
  
  if (!hasBullets) {
    return (
      <ScrollableRow>
        <p className="text-sm leading-relaxed inline">
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
        const bgColor = type === 'positive' ? "bg-emerald-50/50 dark:bg-emerald-950/20" :
                        type === 'negative' ? "bg-amber-50/50 dark:bg-amber-950/20" :
                        type === 'comparison' ? "bg-blue-50/50 dark:bg-blue-950/20" : "bg-muted/30";
        const borderColor = type === 'positive' ? "border-emerald-200/50 dark:border-emerald-800/30" :
                           type === 'negative' ? "border-amber-200/50 dark:border-amber-800/30" :
                           type === 'comparison' ? "border-blue-200/50 dark:border-blue-800/30" : "border-border/50";
        
        return (
          <ScrollableRow key={idx} bgColor={bgColor} borderColor={borderColor}>
            <span className="inline-flex gap-3 items-center">
              <InsightIcon type={type} />
              <span className="text-sm leading-relaxed">
                {highlightMetrics(insight)}
              </span>
            </span>
          </ScrollableRow>
        );
      })}
    </div>
  );
};

export default FormattedInsight;
