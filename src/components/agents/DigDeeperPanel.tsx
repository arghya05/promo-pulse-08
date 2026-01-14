import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Database, 
  LineChart, 
  HelpCircle, 
  Send,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrossModuleProblem, Signal, RootCause } from './cross-module-data';

interface DigDeeperPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problem: CrossModuleProblem | null;
}

// Simulated "What if?" responses
const whatIfResponses: Record<string, string> = {
  'lower risk': 'If we reduce risk tolerance to 15%, we would exclude 2 high-impact actions (campaign pause, price adjustment), reducing expected ROI from ₹14.8L to ₹9.2L. The trade-off is a safer execution with 100% guardrail compliance.',
  'delay': 'Delaying action by 24h increases stockout exposure by ₹18.4L. After 48h, we project 8 SKUs at zero inventory with estimated ₹36.8L lost revenue. Recommend immediate action.',
  'partial': 'Executing only inventory actions (PO + transfer) without pausing promos gives 60% of ROI (₹8.9L) but risks demand exceeding supply, potentially worsening stockout.',
  'budget': 'With ₹5L budget cap, we can execute emergency PO (₹3.2L) and inter-store transfers (₹0.8L). This covers 70% of stockout risk. Remaining ₹1L as contingency for expedited shipping if needed.',
};

export function DigDeeperPanel({
  open,
  onOpenChange,
  problem,
}: DigDeeperPanelProps) {
  const [whatIfQuery, setWhatIfQuery] = useState('');
  const [whatIfResponse, setWhatIfResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const handleWhatIf = () => {
    if (!whatIfQuery.trim()) return;
    
    setIsThinking(true);
    
    // Simulate AI thinking
    setTimeout(() => {
      const query = whatIfQuery.toLowerCase();
      let response = whatIfResponses['delay']; // default
      
      if (query.includes('risk') || query.includes('safe')) {
        response = whatIfResponses['lower risk'];
      } else if (query.includes('delay') || query.includes('wait')) {
        response = whatIfResponses['delay'];
      } else if (query.includes('partial') || query.includes('only')) {
        response = whatIfResponses['partial'];
      } else if (query.includes('budget') || query.includes('limit') || query.includes('cost')) {
        response = whatIfResponses['budget'];
      }
      
      setWhatIfResponse(response);
      setIsThinking(false);
    }, 1200);
  };

  if (!problem) return null;

  // Confidence drivers based on signals
  const confidenceDrivers = [
    { factor: 'Data freshness', value: 94, positive: true, note: 'All signals <6h old' },
    { factor: 'Source reliability', value: 88, positive: true, note: '3/4 sources tier-1' },
    { factor: 'Cross-validation', value: 82, positive: true, note: 'Signals corroborate across systems' },
    { factor: 'Historical accuracy', value: 76, positive: problem.confidence >= 70, note: 'Similar predictions 76% accurate' },
  ];

  // Assumptions made by agents
  const assumptions = [
    { assumption: 'Supplier lead times will not increase further', risk: 'medium', mitigated: true },
    { assumption: 'Demand spike is transient (72h)', risk: 'low', mitigated: true },
    { assumption: 'Inter-store transfer logistics are available', risk: 'low', mitigated: true },
    { assumption: 'No new stockouts in adjacent categories', risk: 'high', mitigated: false },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Dig Deeper: {problem.title.slice(0, 30)}...
          </SheetTitle>
          <SheetDescription>
            Explore signals, assumptions, confidence drivers, and ask "What if?" questions.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="signals" className="flex-1 overflow-hidden flex flex-col mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="signals" className="text-xs">Signals</TabsTrigger>
            <TabsTrigger value="assumptions" className="text-xs">Assumptions</TabsTrigger>
            <TabsTrigger value="confidence" className="text-xs">Confidence</TabsTrigger>
            <TabsTrigger value="whatif" className="text-xs">What If?</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            {/* Signals Tab */}
            <TabsContent value="signals" className="mt-0 space-y-3">
              <p className="text-sm text-muted-foreground">
                Signals collected by A1 Signal Collector that drove this analysis.
              </p>
              
              {problem.signals.map((signal) => (
                <Card key={signal.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[9px]",
                              signal.type === 'anomaly' ? "text-red-600" :
                              signal.type === 'alert' ? "text-amber-600" :
                              signal.type === 'trend' ? "text-blue-600" : "text-purple-600"
                            )}
                          >
                            {signal.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{signal.source}</span>
                        </div>
                        <p className="text-sm font-medium mt-1">{signal.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Delta: <span className="font-medium">{signal.delta}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{signal.confidence}%</p>
                        <p className="text-[10px] text-muted-foreground">confidence</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                      <Database className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(signal.timestamp).toLocaleString()}
                      </span>
                      <Button variant="ghost" size="sm" className="h-5 px-2 text-[10px] gap-1 ml-auto">
                        <ExternalLink className="h-2.5 w-2.5" />
                        View source
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Assumptions Tab */}
            <TabsContent value="assumptions" className="mt-0 space-y-3">
              <p className="text-sm text-muted-foreground">
                Assumptions made by agents during analysis. Flagged risks are shown.
              </p>
              
              {assumptions.map((a, i) => (
                <Card key={i} className={cn(
                  "border-l-4",
                  a.mitigated ? "border-l-green-500" : "border-l-amber-500"
                )}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {a.mitigated ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm">{a.assumption}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[9px]",
                              a.risk === 'low' ? "text-green-600" :
                              a.risk === 'medium' ? "text-amber-600" : "text-red-600"
                            )}
                          >
                            {a.risk} risk
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {a.mitigated ? 'Mitigated by guardrails' : 'Requires monitoring'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Confidence Tab */}
            <TabsContent value="confidence" className="mt-0 space-y-3">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 text-center">
                  <p className="text-4xl font-bold text-primary">{problem.confidence}%</p>
                  <p className="text-sm text-muted-foreground">Overall Confidence</p>
                  {problem.confidence < 70 && (
                    <Badge variant="outline" className="mt-2 text-amber-600 border-amber-200">
                      Below 70% threshold — user confirmation required
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <p className="text-sm text-muted-foreground">
                Factors contributing to confidence score:
              </p>
              
              {confidenceDrivers.map((driver, i) => (
                <Card key={i}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {driver.positive ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        )}
                        <span className="text-sm font-medium">{driver.factor}</span>
                      </div>
                      <span className="text-sm font-bold">{driver.value}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-6">{driver.note}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* What If Tab */}
            <TabsContent value="whatif" className="mt-0 space-y-4">
              <p className="text-sm text-muted-foreground">
                Ask scenario questions to understand sensitivity and trade-offs.
              </p>

              <div className="flex gap-2">
                <Input
                  placeholder="e.g., What if we delay by 24h?"
                  value={whatIfQuery}
                  onChange={(e) => setWhatIfQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleWhatIf()}
                />
                <Button onClick={handleWhatIf} disabled={isThinking}>
                  {isThinking ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Suggested questions */}
              <div className="flex flex-wrap gap-2">
                {['What if we lower risk?', 'What if we delay?', 'What if partial execution?', 'What if budget is capped?'].map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      setWhatIfQuery(q);
                      setWhatIfResponse(null);
                    }}
                  >
                    <HelpCircle className="h-3 w-3 mr-1" />
                    {q}
                  </Button>
                ))}
              </div>

              {/* Response */}
              {whatIfResponse && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <LineChart className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-primary mb-1">Scenario Analysis</p>
                        <p className="text-sm">{whatIfResponse}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Root Causes */}
              <div className="mt-6">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                  Root Cause Hypotheses
                </h4>
                {problem.rootCauses.map((rc) => (
                  <Card key={rc.id} className="mb-2">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{rc.hypothesis}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[9px]">
                              {rc.probability}% probability
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {rc.evidence.length} evidence items
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
