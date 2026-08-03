import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionBulletProps {
  text: string;
  priority?: 'high' | 'medium' | 'low';
  className?: string;
}

// Highlight action keywords and metrics
const formatActionText = (text: string): React.ReactNode[] => {
  // Highlight verbs at the start and metrics
  const metricPattern = /(\$[\d,.]+[KMB]?|\d+\.?\d*%|\d+\.?\d*[xX]|\d+[KMB])/g;
  const parts = text.split(metricPattern);
  
  return parts.map((part, idx) => {
    if (metricPattern.test(part)) {
      metricPattern.lastIndex = 0;
      return (
        <span
          key={idx}
          className="font-semibold text-status-good dark:text-status-good bg-status-good/10 dark:bg-status-good/20/30 px-1 py-0.5 rounded mx-0.5"
        >
          {part}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};

export const ActionBullet: React.FC<ActionBulletProps> = ({
  text,
  priority = 'medium',
  className
}) => {
  const priorityColors = {
    high: 'border-l-emerald-500',
    medium: 'border-l-blue-500',
    low: 'border-l-gray-400'
  };

  return (
    <div
      className={cn(
        "flex items-start gap-2 py-1.5 pl-2 border-l-2",
        priorityColors[priority],
        className
      )}
    >
      <ArrowRight className="h-3.5 w-3.5 text-status-good flex-shrink-0 mt-0.5" />
      <span className="text-sm leading-relaxed flex-1 min-w-0 break-words">
        {formatActionText(text)}
      </span>
    </div>
  );
};

export default ActionBullet;
