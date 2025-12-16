import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  GitBranch, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  Search,
  RefreshCw,
  ChevronRight,
  Activity,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface CausalDriver {
  name: string;
  impact: number;
  direction: 'positive' | 'negative';
  correlation: number;
  confidence: number;
  explanation: string;
}

interface CounterfactualScenario {
  scenario: string;
  predictedOutcome: number;
  actualOutcome: number;
  difference: number;
  recommendation: string;
}

interface CausalAnalysis {
  metric: string;
  currentValue: number;
  change: number;
  changeDirection: 'up' | 'down';
  drivers: CausalDriver[];
  counterfactuals: CounterfactualScenario[];
  rootCause: string;
  actionableInsights: string[];
}

interface CausalExplainabilityProps {
  moduleId: string;
  moduleName?: string;
}

const CausalExplainability = ({ moduleId, moduleName = 'Module' }: CausalExplainabilityProps) => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CausalAnalysis | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<CausalDriver | null>(null);

  // Module-specific example queries
  const exampleQueries: Record<string, string[]> = {
    promotion: [
      "Why did ROI drop for Dairy promotions last month?",
      "What caused the spike in BOGO redemption rates?",
      "Why is Snacks category underperforming competitors?"
    ],
    pricing: [
      "Why did margin decline after the price increase?",
      "What caused competitor price gap to widen?",
      "Why is price elasticity higher for beverages?"
    ],
    demand: [
      "Why did forecast accuracy drop in Q3?",
      "What caused the demand spike for frozen foods?",
      "Why are stockout rates increasing?"
    ],
    'supply-chain': [
      "Why did supplier on-time delivery decline?",
      "What caused shipping costs to increase?",
      "Why is lead time variance growing?"
    ],
    space: [
      "Why did shelf productivity drop for Personal Care?",
      "What caused eye-level allocation changes?",
      "Why is fixture utilization declining?"
    ],
    assortment: [
      "Why did SKU velocity decrease for Home Care?",
      "What caused brand share shifts in Pantry?",
      "Why is product mix efficiency declining?"
    ],
    executive: [
      "Why did overall margin drop this quarter?",
      "What caused the revenue variance vs budget?",
      "Why is market share declining in Southwest?"
    ]
  };

  const handleAnalyze = async (questionText?: string) => {
    const questionToAnalyze = questionText || query;
    if (!questionToAnalyze.trim()) return;

    setIsLoading(true);
    setAnalysis(null);
    setSelectedDriver(null);

    try {
      const response = await supabase.functions.invoke('analyze-causal', {
        body: {
          question: questionToAnalyze,
          moduleId
        }
      });

      if (response.error) throw new Error(response.error.message);
      
      setAnalysis(response.data);
      toast({
        title: "Causal Analysis Complete",
        description: "Root causes and counterfactuals identified",
      });
    } catch (error) {
      console.error('Causal analysis error:', error);
      toast({
        title: "Analysis Error",
        description: error instanceof Error ? error.message : "Failed to analyze",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getImpactColor = (impact: number) => {
    if (impact > 20) return 'text-status-good';
    if (impact > 0) return 'text-primary';
    if (impact > -20) return 'text-status-warning';
    return 'text-status-bad';
  };

  const getCorrelationWidth = (correlation: number) => {
    return `${Math.abs(correlation) * 100}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Brain className="h-7 w-7 text-primary" />
            Causal AI Explainability
          </h2>
          <p className="text-muted-foreground mt-1">
            Understand why metrics changed with causal analysis and counterfactual reasoning
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {moduleName}
        </Badge>
      </div>

      {/* Search Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask 'Why did...?' or 'What caused...?' questions"
                className="pl-12 h-12 text-lg"
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
            </div>
            <Button 
              onClick={() => handleAnalyze()} 
              disabled={isLoading}
              className="h-12 px-6 gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Explain Why
                </>
              )}
            </Button>
          </div>

          {/* Example Queries */}
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Try asking:</span>
            <div className="flex flex-wrap gap-2">
              {(exampleQueries[moduleId] || exampleQueries.promotion).map((q, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setQuery(q);
                    handleAnalyze(q);
                  }}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="grid grid-cols-12 gap-6">
          {/* Main Causal Graph */}
          <div className="col-span-8 space-y-6">
            {/* Metric Overview */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">{analysis.metric}</h3>
                  <p className="text-sm text-muted-foreground">Current value and change analysis</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-3xl font-bold">{analysis.currentValue.toLocaleString()}</div>
                    <div className={`flex items-center gap-1 text-sm ${analysis.changeDirection === 'up' ? 'text-status-good' : 'text-status-bad'}`}>
                      {analysis.changeDirection === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {analysis.change > 0 ? '+' : ''}{analysis.change}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Root Cause Banner */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-semibold text-primary mb-1">Root Cause Identified</div>
                    <p className="text-sm text-foreground">{analysis.rootCause}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Causal Drivers Graph */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                Causal Drivers
              </h3>
              <div className="space-y-4">
                {analysis.drivers.map((driver, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedDriver?.name === driver.name 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedDriver(driver)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${driver.direction === 'positive' ? 'bg-status-good/10' : 'bg-status-bad/10'}`}>
                          {driver.direction === 'positive' ? (
                            <TrendingUp className="h-4 w-4 text-status-good" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-status-bad" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">{driver.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {driver.confidence}% confidence
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={driver.impact > 0 ? 'default' : 'destructive'}>
                          {driver.impact > 0 ? '+' : ''}{driver.impact}% impact
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    
                    {/* Correlation Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Correlation Strength</span>
                        <span>{(driver.correlation * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            driver.direction === 'positive' ? 'bg-status-good' : 'bg-status-bad'
                          }`}
                          style={{ width: getCorrelationWidth(driver.correlation) }}
                        />
                      </div>
                    </div>

                    {selectedDriver?.name === driver.name && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">{driver.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Counterfactual Analysis */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Counterfactual Analysis
                <Badge variant="outline" className="ml-2">What-If</Badge>
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Explore alternative scenarios to understand potential outcomes
              </p>
              
              <div className="space-y-4">
                {analysis.counterfactuals.map((cf, idx) => (
                  <div key={idx} className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="font-medium">{cf.scenario}</span>
                      </div>
                      <Badge 
                        variant={cf.difference > 0 ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {cf.difference > 0 ? '+' : ''}{cf.difference.toFixed(1)}% vs actual
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1">Predicted Outcome</div>
                        <div className="text-lg font-bold text-primary">
                          {cf.predictedOutcome.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1">Actual Outcome</div>
                        <div className="text-lg font-bold">
                          {cf.actualOutcome.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-sm bg-primary/5 rounded-lg p-3">
                      <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{cf.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-4 space-y-6">
            {/* Actionable Insights */}
            <Card className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-status-good" />
                Actionable Insights
              </h3>
              <div className="space-y-3">
                {analysis.actionableInsights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{idx + 1}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Confidence Summary */}
            <Card className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Analysis Confidence
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall Confidence</span>
                  <span className="font-semibold">
                    {Math.round(analysis.drivers.reduce((acc, d) => acc + d.confidence, 0) / analysis.drivers.length)}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ 
                      width: `${Math.round(analysis.drivers.reduce((acc, d) => acc + d.confidence, 0) / analysis.drivers.length)}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on {analysis.drivers.length} identified causal factors and {analysis.counterfactuals.length} counterfactual scenarios
                </p>
              </div>
            </Card>

            {/* Data Sources */}
            <Card className="p-5">
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                Data Sources Used
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Transactions</Badge>
                <Badge variant="outline">Promotions</Badge>
                <Badge variant="outline">Store Performance</Badge>
                <Badge variant="outline">Competitor Data</Badge>
                <Badge variant="outline">Inventory</Badge>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !isLoading && (
        <Card className="p-12 text-center">
          <Brain className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ask a "Why" Question</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Enter a question about why a metric changed, what caused an outcome, or explore 
            counterfactual scenarios to understand causal relationships in your data.
          </p>
          <div className="flex justify-center gap-2">
            {(exampleQueries[moduleId] || exampleQueries.promotion).slice(0, 2).map((q, idx) => (
              <Button
                key={idx}
                variant="outline"
                onClick={() => {
                  setQuery(q);
                  handleAnalyze(q);
                }}
              >
                {q.length > 40 ? q.slice(0, 40) + '...' : q}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="p-12">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Brain className="h-16 w-16 text-primary animate-pulse" />
              <div className="absolute inset-0 animate-spin">
                <RefreshCw className="h-16 w-16 text-primary/30" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Analyzing Causal Relationships</h3>
              <p className="text-muted-foreground">
                Identifying root causes and building counterfactual scenarios...
              </p>
            </div>
            <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CausalExplainability;
