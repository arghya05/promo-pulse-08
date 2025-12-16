import { useState, useEffect, useRef } from 'react';
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
  HelpCircle,
  Clock,
  Sparkles,
  BarChart3,
  Users,
  Package,
  DollarSign
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

interface Suggestion {
  text: string;
  category: string;
  icon: 'trend' | 'dollar' | 'users' | 'package' | 'chart' | 'clock';
  popularity?: 'high' | 'medium';
}

const CausalExplainability = ({ moduleId, moduleName = 'Module' }: CausalExplainabilityProps) => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CausalAnalysis | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<CausalDriver | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Rich suggestion library per module
  const suggestionLibrary: Record<string, Suggestion[]> = {
    promotion: [
      { text: "Why did ROI drop for Dairy promotions last month?", category: "ROI Analysis", icon: "trend", popularity: "high" },
      { text: "Why did BOGO promotions outperform percentage discounts?", category: "Mechanics Analysis", icon: "chart", popularity: "high" },
      { text: "What caused the spike in redemption rates for Snacks?", category: "Redemption", icon: "trend" },
      { text: "Why is Snacks category underperforming vs competitors?", category: "Competitive", icon: "users" },
      { text: "What caused margin erosion in Beverages promotions?", category: "Margin Analysis", icon: "dollar" },
      { text: "Why did promotional lift decline in Q3?", category: "Lift Analysis", icon: "trend" },
      { text: "What factors drove customer response rate changes?", category: "Customer Response", icon: "users" },
      { text: "Why are basket sizes smaller during promotions?", category: "Basket Analysis", icon: "package" },
      { text: "What caused cannibalization in Personal Care promos?", category: "Cannibalization", icon: "chart" },
      { text: "Why did seasonal promotions underperform expectations?", category: "Seasonal", icon: "clock" },
      { text: "What drove halo effects in Frozen category?", category: "Halo Effects", icon: "trend", popularity: "medium" },
      { text: "Why is promotion fatigue increasing for loyal customers?", category: "Customer Behavior", icon: "users" },
    ],
    pricing: [
      { text: "Why did margin decline after the price increase?", category: "Margin Impact", icon: "dollar", popularity: "high" },
      { text: "What caused competitor price gap to widen?", category: "Competitive Gap", icon: "users", popularity: "high" },
      { text: "Why is price elasticity higher for Beverages?", category: "Elasticity", icon: "chart" },
      { text: "What factors drove volume decline after repricing?", category: "Volume Impact", icon: "trend" },
      { text: "Why did premium tier sales increase?", category: "Tier Analysis", icon: "dollar" },
      { text: "What caused price perception to shift negatively?", category: "Price Perception", icon: "users" },
      { text: "Why is markdown effectiveness declining?", category: "Markdown", icon: "dollar" },
      { text: "What drove competitor pricing changes in Dairy?", category: "Competitive Intel", icon: "users" },
    ],
    demand: [
      { text: "Why did forecast accuracy drop in Q3?", category: "Accuracy", icon: "chart", popularity: "high" },
      { text: "What caused the demand spike for Frozen foods?", category: "Demand Spike", icon: "trend", popularity: "high" },
      { text: "Why are stockout rates increasing in Northeast?", category: "Stockouts", icon: "package" },
      { text: "What factors drove seasonal demand shift?", category: "Seasonality", icon: "clock" },
      { text: "Why is demand variability increasing for Dairy?", category: "Variability", icon: "chart" },
      { text: "What caused the forecast bias for new products?", category: "Bias Analysis", icon: "trend" },
      { text: "Why did replenishment lead times increase?", category: "Lead Time", icon: "clock" },
      { text: "What drove safety stock insufficiency?", category: "Safety Stock", icon: "package" },
    ],
    'supply-chain': [
      { text: "Why did supplier on-time delivery decline?", category: "Delivery", icon: "clock", popularity: "high" },
      { text: "What caused shipping costs to increase 15%?", category: "Costs", icon: "dollar", popularity: "high" },
      { text: "Why is lead time variance growing?", category: "Variance", icon: "chart" },
      { text: "What factors drove supplier quality issues?", category: "Quality", icon: "package" },
      { text: "Why did transportation efficiency drop?", category: "Efficiency", icon: "trend" },
      { text: "What caused warehouse utilization to decline?", category: "Warehouse", icon: "package" },
      { text: "Why are expedited shipments increasing?", category: "Expediting", icon: "clock" },
      { text: "What drove carbon footprint increase?", category: "Sustainability", icon: "chart" },
    ],
    space: [
      { text: "Why did shelf productivity drop for Personal Care?", category: "Productivity", icon: "chart", popularity: "high" },
      { text: "What caused eye-level allocation to change?", category: "Allocation", icon: "package", popularity: "high" },
      { text: "Why is fixture utilization declining in Store 5?", category: "Utilization", icon: "trend" },
      { text: "What factors drove planogram compliance issues?", category: "Compliance", icon: "chart" },
      { text: "Why did sales per square foot decrease?", category: "Sales Density", icon: "dollar" },
      { text: "What caused category adjacency problems?", category: "Adjacency", icon: "package" },
      { text: "Why is out-of-stock visibility low for Beverages?", category: "OOS Visibility", icon: "package" },
      { text: "What drove impulse purchase decline at checkout?", category: "Impulse", icon: "users" },
    ],
    assortment: [
      { text: "Why did SKU velocity decrease for Home Care?", category: "Velocity", icon: "trend", popularity: "high" },
      { text: "What caused brand share shifts in Pantry?", category: "Brand Share", icon: "chart", popularity: "high" },
      { text: "Why is product mix efficiency declining?", category: "Mix Efficiency", icon: "chart" },
      { text: "What factors drove new product failure rate?", category: "New Products", icon: "package" },
      { text: "Why did private label performance improve?", category: "Private Label", icon: "dollar" },
      { text: "What caused SKU rationalization challenges?", category: "Rationalization", icon: "package" },
      { text: "Why is category growth slowing in Snacks?", category: "Category Growth", icon: "trend" },
      { text: "What drove substitution patterns in Dairy?", category: "Substitution", icon: "users" },
    ],
    executive: [
      { text: "Why did overall margin drop this quarter?", category: "Margin", icon: "dollar", popularity: "high" },
      { text: "What caused the revenue variance vs budget?", category: "Revenue", icon: "trend", popularity: "high" },
      { text: "Why is market share declining in Southwest?", category: "Market Share", icon: "users" },
      { text: "What factors drove EBITDA decline?", category: "EBITDA", icon: "dollar" },
      { text: "Why did same-store sales decrease?", category: "Comp Sales", icon: "trend" },
      { text: "What caused customer traffic decline?", category: "Traffic", icon: "users" },
      { text: "Why is inventory turnover slowing?", category: "Turnover", icon: "package" },
      { text: "What drove working capital increase?", category: "Working Capital", icon: "dollar" },
    ]
  };

  // Get filtered suggestions based on query
  const getFilteredSuggestions = (): Suggestion[] => {
    const moduleSuggestions = suggestionLibrary[moduleId] || suggestionLibrary.promotion;
    if (!query.trim()) return moduleSuggestions.slice(0, 6);
    
    const lowerQuery = query.toLowerCase();
    return moduleSuggestions
      .filter(s => s.text.toLowerCase().includes(lowerQuery))
      .slice(0, 8);
  };

  const filteredSuggestions = getFilteredSuggestions();

  // Highlight matching text in suggestion
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) return text;
    
    return (
      <>
        {text.slice(0, index)}
        <span className="font-semibold text-primary">{text.slice(index, index + query.length)}</span>
        {text.slice(index + query.length)}
      </>
    );
  };

  const getSuggestionIcon = (icon: Suggestion['icon']) => {
    switch (icon) {
      case 'trend': return <TrendingUp className="h-4 w-4 text-primary" />;
      case 'dollar': return <DollarSign className="h-4 w-4 text-status-good" />;
      case 'users': return <Users className="h-4 w-4 text-chart-2" />;
      case 'package': return <Package className="h-4 w-4 text-chart-3" />;
      case 'chart': return <BarChart3 className="h-4 w-4 text-chart-4" />;
      case 'clock': return <Clock className="h-4 w-4 text-chart-5" />;
      default: return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') handleAnalyze();
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
          selectSuggestion(filteredSuggestions[selectedIndex].text);
        } else {
          handleAnalyze();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const selectSuggestion = (text: string) => {
    setQuery(text);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    handleAnalyze(text);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Module-specific example queries (for the chips below)
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

    setShowSuggestions(false);
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

      {/* Search Card with Rich Suggestions */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                  setSelectedIndex(-1);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                placeholder="Ask 'Why did...?' or 'What caused...?' questions"
                className="pl-12 h-12 text-lg"
                autoComplete="off"
              />
              
              {/* Rich Suggestions Dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-4 py-2 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      <span>Suggested causal questions for {moduleName}</span>
                    </div>
                  </div>
                  
                  {/* Suggestions List */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {filteredSuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectSuggestion(suggestion.text)}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                          idx === selectedIndex 
                            ? 'bg-accent' 
                            : 'hover:bg-accent/50'
                        } ${idx !== filteredSuggestions.length - 1 ? 'border-b border-border/50' : ''}`}
                      >
                        {/* Icon */}
                        <div className="mt-0.5 shrink-0">
                          {getSuggestionIcon(suggestion.icon)}
                        </div>
                        
                        {/* Text & Category */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-foreground leading-snug">
                            {highlightMatch(suggestion.text, query)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                              {suggestion.category}
                            </Badge>
                            {suggestion.popularity === 'high' && (
                              <span className="flex items-center gap-1 text-[10px] text-primary">
                                <TrendingUp className="h-2.5 w-2.5" />
                                Popular
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Arrow */}
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Footer hint */}
                  <div className="px-4 py-2 border-t border-border bg-muted/30">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>
                        <kbd className="px-1.5 py-0.5 bg-background rounded border border-border text-[9px]">↑</kbd>
                        <kbd className="px-1.5 py-0.5 bg-background rounded border border-border text-[9px] ml-1">↓</kbd>
                        <span className="ml-1.5">to navigate</span>
                      </span>
                      <span>
                        <kbd className="px-1.5 py-0.5 bg-background rounded border border-border text-[9px]">Enter</kbd>
                        <span className="ml-1.5">to select</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
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

          {/* Quick Example Chips */}
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Try asking:
            </span>
            <div className="flex flex-wrap gap-2">
              {(exampleQueries[moduleId] || exampleQueries.promotion).map((q, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs hover:bg-primary/10 hover:border-primary/50 transition-colors"
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
                {analysis.counterfactuals.map((cf, idx) => {
                  const diff = Number(cf.difference) || 0;
                  const predicted = Number(cf.predictedOutcome) || 0;
                  const actual = Number(cf.actualOutcome) || 0;
                  return (
                    <div key={idx} className="p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          <span className="font-medium">{cf.scenario}</span>
                        </div>
                        <Badge 
                          variant={diff > 0 ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}% vs actual
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground mb-1">Predicted Outcome</div>
                          <div className="text-lg font-bold text-primary">
                            {predicted.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground mb-1">Actual Outcome</div>
                          <div className="text-lg font-bold">
                            {actual.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-sm bg-primary/5 rounded-lg p-3">
                        <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{cf.recommendation}</span>
                      </div>
                    </div>
                  );
                })}
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
