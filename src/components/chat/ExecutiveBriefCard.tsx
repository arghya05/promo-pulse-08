import React from 'react';
import { TrendingUp, TrendingDown, Minus, Copy, Share2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ExecutiveBrief } from './types';
import InsightBullet from './InsightBullet';
import ActionBullet from './ActionBullet';

interface ExecutiveBriefCardProps {
  brief: ExecutiveBrief;
  onNextQuestion?: (question: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const ExecutiveBriefCard: React.FC<ExecutiveBriefCardProps> = ({
  brief,
  onNextQuestion,
  isLoading = false,
  className
}) => {
  const { toast } = useToast();
  
  const confidenceColors = {
    High: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Low: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  };

  const trendIcon = brief.keyMetric.trend === 'up' ? TrendingUp :
                    brief.keyMetric.trend === 'down' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  
  const trendColor = brief.keyMetric.trend === 'up' ? 'text-emerald-500' :
                     brief.keyMetric.trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  // Copy executive brief to clipboard
  const handleCopy = () => {
    const briefText = `
${brief.title}

KEY METRIC: ${brief.keyMetric.label}: ${brief.keyMetric.value}

TOP INSIGHTS:
${brief.insights.map(i => `• ${i.text}`).join('\n')}

ACTIONS:
${brief.actions.map(a => `→ ${a.text}`).join('\n')}

Confidence: ${brief.confidence.level}
    `.trim();
    
    navigator.clipboard.writeText(briefText);
    toast({
      title: "Copied!",
      description: "Executive brief copied to clipboard",
    });
  };

  // Format for Slack
  const handleShare = () => {
    const slackText = `*${brief.title}*
📊 ${brief.keyMetric.label}: *${brief.keyMetric.value}*
${brief.insights[0]?.text || ''}
➡️ ${brief.actions[0]?.text || ''}
_Confidence: ${brief.confidence.level}_`;
    
    navigator.clipboard.writeText(slackText);
    toast({
      title: "Ready to share!",
      description: "Slack-formatted summary copied",
    });
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header with KPI chip - animated */}
      <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate">
              {brief.title}
            </h3>
          </div>
          
          {/* Key Metric Chip - animated */}
          <div className="flex-shrink-0 animate-scale-in">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {brief.keyMetric.label}
                </p>
                <p className="text-xl font-bold text-primary leading-none">
                  {brief.keyMetric.value}
                </p>
              </div>
              {brief.keyMetric.change && (
                <div className={cn("flex items-center gap-0.5", trendColor)}>
                  <TrendIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">{brief.keyMetric.change}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="p-4 space-y-3">
        {/* Top 3 Insights */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Key Insights
            </span>
          </div>
          {brief.insights.map((insight, idx) => (
            <InsightBullet
              key={idx}
              text={insight.text}
              isTopInsight={insight.isTopInsight}
            />
          ))}
        </div>

        <Separator className="my-3" />

        {/* Top 2 Actions */}
        {brief.actions.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Recommended Actions
            </span>
            {brief.actions.map((action, idx) => (
              <ActionBullet
                key={idx}
                text={action.text}
                priority={idx === 0 ? 'high' : 'medium'}
              />
            ))}
          </div>
        )}

        {/* Confidence + Actions Row */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={cn("text-[10px] px-2 py-0.5", confidenceColors[brief.confidence.level])}
            >
              {brief.confidence.level} Confidence
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {brief.confidence.reason}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleCopy}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleShare}
            >
              <Share2 className="h-3 w-3 mr-1" />
              Slack
            </Button>
          </div>
        </div>

        {/* Next Question Chips */}
        {brief.nextQuestions.length > 0 && (
          <div className="pt-2">
            <Separator className="mb-3" />
            <div className="flex flex-wrap gap-2">
              {brief.nextQuestions.slice(0, 3).map((question, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-3 hover:bg-primary/10 hover:border-primary"
                  onClick={() => onNextQuestion?.(question)}
                  disabled={isLoading}
                >
                  {question.length > 40 ? question.substring(0, 37) + '...' : question}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ExecutiveBriefCard;
