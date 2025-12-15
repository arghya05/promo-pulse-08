import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Brain, 
  Clock, 
  Target, 
  Layers, 
  MessageSquare,
  History,
  Sparkles,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface SessionInsight {
  id: string;
  question: string;
  keyFinding: string;
  timestamp: Date;
}

interface ConversationContext {
  lastCategory?: string;
  lastProduct?: string;
  lastMetric?: string;
  lastTimePeriod?: string;
  lastSupplier?: string;
  lastPlanogram?: string;
  recentTopics: string[];
  drillPath: string[];
  currentDrillLevel: number;
}

interface ConversationContextPanelProps {
  context: ConversationContext;
  sessionInsights: SessionInsight[];
  onTopicClick: (topic: string) => void;
  onInsightClick: (insight: SessionInsight) => void;
}

const ConversationContextPanel = ({ 
  context, 
  sessionInsights, 
  onTopicClick,
  onInsightClick
}: ConversationContextPanelProps) => {
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  const hasContext = context.lastCategory || context.lastMetric || 
    context.lastProduct || context.lastTimePeriod || 
    context.drillPath.length > 0 || context.recentTopics.length > 0;

  if (!hasContext && sessionInsights.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* What I Remember Panel */}
      {hasContext && (
        <Collapsible open={isMemoryOpen} onOpenChange={setIsMemoryOpen}>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CollapsibleTrigger asChild>
              <CardContent className="p-3 cursor-pointer hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">What I Remember</span>
                  <Badge variant="secondary" className="text-[10px] ml-auto mr-2">
                    {context.recentTopics.length} topics
                  </Badge>
                  {isMemoryOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3 text-xs">
                  {/* Current Focus */}
                  {(context.lastCategory || context.lastProduct) && (
                    <div className="flex items-start gap-2">
                      <Target className="h-3 w-3 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">Current focus: </span>
                        <Button 
                          variant="link" 
                          className="h-auto p-0 text-xs text-primary"
                          onClick={() => onTopicClick(context.lastCategory || context.lastProduct || '')}
                        >
                          {context.lastCategory || context.lastProduct}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Last Metric */}
                  {context.lastMetric && (
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-3 w-3 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">Analyzing: </span>
                        <Button 
                          variant="link" 
                          className="h-auto p-0 text-xs text-primary"
                          onClick={() => onTopicClick(context.lastMetric || '')}
                        >
                          {context.lastMetric}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Time Period */}
                  {context.lastTimePeriod && (
                    <div className="flex items-start gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">Time scope: </span>
                        <span className="text-foreground">{context.lastTimePeriod}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Drill Path */}
                  {context.drillPath.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Layers className="h-3 w-3 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <span className="text-muted-foreground block mb-1">Drill path:</span>
                        <div className="flex flex-wrap gap-1">
                          {context.drillPath.map((p, i) => (
                            <Button
                              key={i}
                              variant="secondary"
                              size="sm"
                              className="h-5 px-2 text-[10px]"
                              onClick={() => onTopicClick(p)}
                            >
                              {p}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Recent Topics */}
                  {context.recentTopics.length > 0 && (
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <span className="text-muted-foreground block mb-1">Topics discussed:</span>
                        <div className="flex flex-wrap gap-1">
                          {[...new Set(context.recentTopics)].slice(-5).map((topic, i) => (
                            <Badge 
                              key={i} 
                              variant="outline" 
                              className="text-[10px] cursor-pointer hover:bg-primary/10"
                              onClick={() => onTopicClick(topic)}
                            >
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Quick Navigation Hints */}
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground italic">
                    Try: "Go back to {context.lastCategory || 'previous topic'}" or "What did we discuss about {context.lastMetric || 'this metric'}?"
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Session Summary */}
      {sessionInsights.length > 0 && (
        <Collapsible open={isInsightsOpen} onOpenChange={setIsInsightsOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardContent className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-sm">Session Insights</span>
                  <Badge variant="secondary" className="text-[10px] ml-auto mr-2">
                    {sessionInsights.length} findings
                  </Badge>
                  {isInsightsOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="p-4 pt-0">
                <ScrollArea className="max-h-40">
                  <div className="space-y-2">
                    {sessionInsights.slice(-5).reverse().map((insight) => (
                      <Button
                        key={insight.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-2 px-2 text-xs hover:bg-primary/5"
                        onClick={() => onInsightClick(insight)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-muted-foreground text-[10px]">
                            {insight.question}
                          </p>
                          <p className="truncate font-medium text-foreground">
                            {insight.keyFinding}
                          </p>
                        </div>
                        <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0 ml-2" />
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground italic">
                    Ask: "Summarize what we discussed" or "What were the key findings?"
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
};

export default ConversationContextPanel;
