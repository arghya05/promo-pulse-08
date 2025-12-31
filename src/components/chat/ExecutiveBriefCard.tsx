import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Copy, Share2, Sparkles, Minimize2, ChevronDown, ChevronUp } from 'lucide-react';
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
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

// Safely get array from any value
const toSafeArray = (val: any): any[] => {
  if (Array.isArray(val)) return val;
  if (val === null || val === undefined) return [];
  return [val];
};

export const ExecutiveBriefCard: React.FC<ExecutiveBriefCardProps> = ({
  brief,
  onNextQuestion,
  isLoading = false,
  className,
  showDetails = false,
  onToggleDetails
}) => {
  const { toast } = useToast();
  const [verbosity, setVerbosity] = useState<'executive' | 'detailed'>('executive');
  
  // Safely access arrays
  const insights = toSafeArray(brief?.insights).slice(0, 3);
  const actions = toSafeArray(brief?.actions).slice(0, 2);
  const nextQuestions = toSafeArray(brief?.nextQuestions).slice(0, 2);
  const keyMetric = brief?.keyMetric || { label: 'Analysis', value: 'Complete', trend: 'neutral' };
  const confidence = brief?.confidence || { level: 'Medium', reason: '' };
  
  const confidenceColors = {
    High: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Low: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  };

  const trendIcon = keyMetric.trend === 'up' ? TrendingUp :
                    keyMetric.trend === 'down' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  
  const trendColor = keyMetric.trend === 'up' ? 'text-emerald-500' :
                     keyMetric.trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  // Copy executive brief to clipboard
  const handleCopy = () => {
    const briefText = `${brief?.title || 'Analysis'}

📊 ${keyMetric.label}: ${keyMetric.value}

KEY INSIGHTS:
${insights.map(i => `• ${i?.text || ''}`).join('\n')}

ACTIONS:
${actions.map(a => `→ ${a?.text || ''}`).join('\n')}

Confidence: ${confidence.level}`.trim();
    
    navigator.clipboard.writeText(briefText);
    toast({
      title: "Copied!",
      description: "Executive brief copied to clipboard",
    });
  };

  // Format for Slack
  const handleShare = () => {
    const slackText = `*${brief?.title || 'Analysis'}*
📊 ${keyMetric.label}: *${keyMetric.value}*
• ${insights[0]?.text || ''}
➡️ ${actions[0]?.text || ''}
_Confidence: ${confidence.level}_`;
    
    navigator.clipboard.writeText(slackText);
    toast({
      title: "Ready to share!",
      description: "Slack-formatted summary copied",
    });
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header with KPI chip */}
      <div className="p-3 bg-gradient-to-r from-primary/5 to-transparent border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight">
              {brief?.title || 'Analysis'}
            </h3>
          </div>
          
          {/* Key Metric Chip - animated */}
          <div className="flex-shrink-0 animate-scale-in">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-right">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                  {keyMetric.label}
                </p>
                <p className="text-lg font-bold text-primary leading-none">
                  {keyMetric.value}
                </p>
              </div>
              {keyMetric.change && (
                <div className={cn("flex items-center gap-0.5", trendColor)}>
                  <TrendIcon className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">{keyMetric.change}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Verbosity Toggle */}
        <div className="flex items-center gap-2 mt-2">
          <div className="inline-flex rounded-md border border-border/50 p-0.5 text-[10px]">
            <button
              className={cn(
                "px-2 py-0.5 rounded-sm transition-colors",
                verbosity === 'executive' ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
              onClick={() => setVerbosity('executive')}
            >
              Executive
            </button>
            <button
              className={cn(
                "px-2 py-0.5 rounded-sm transition-colors",
                verbosity === 'detailed' ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
              onClick={() => {
                setVerbosity('detailed');
                onToggleDetails?.();
              }}
            >
              Detailed
            </button>
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="p-3 space-y-2">
        {/* 3 Insights - exactly 3, max 12 words each */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Key Insights
            </span>
          </div>
          {insights.map((insight, idx) => (
            <InsightBullet
              key={idx}
              text={insight?.text || ''}
              isTopInsight={idx === 0}
            />
          ))}
        </div>

        <Separator className="my-2" />

        {/* 2 Actions - exactly 2, max 12 words each */}
        <div className="space-y-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Actions
          </span>
          {actions.map((action, idx) => (
            <ActionBullet
              key={idx}
              text={action?.text || ''}
              priority={idx === 0 ? 'high' : 'medium'}
            />
          ))}
        </div>

        {/* Confidence + Buttons Row */}
        <div className="flex items-center justify-between pt-1.5">
          <Badge 
            variant="secondary" 
            className={cn("text-[9px] px-1.5 py-0", confidenceColors[confidence.level as keyof typeof confidenceColors] || confidenceColors.Medium)}
          >
            {confidence.level}
          </Badge>
          
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[10px]"
              onClick={handleCopy}
            >
              <Copy className="h-2.5 w-2.5 mr-0.5" />
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[10px]"
              onClick={handleShare}
            >
              <Share2 className="h-2.5 w-2.5 mr-0.5" />
              Slack
            </Button>
          </div>
        </div>

        {/* Next questions moved to parent component to avoid duplication */}

        {/* Show Details toggle when in detailed mode */}
        {verbosity === 'detailed' && onToggleDetails && (
          <button
            className="flex items-center gap-1 text-[10px] text-primary hover:underline pt-1"
            onClick={onToggleDetails}
          >
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showDetails ? 'Hide details' : 'Show details'}
          </button>
        )}
      </div>
    </Card>
  );
};

export default ExecutiveBriefCard;