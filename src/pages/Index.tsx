import { useState } from "react";
import { Search, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { questionLibrary } from "@/lib/data/questions";
import { executeQuestion, getKPIStatus } from "@/lib/analytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import type { AnalyticsResult } from "@/lib/analytics";
import { useToast } from "@/components/ui/use-toast";
import DrillDownPanel from "@/components/DrillDownPanel";
import PredictiveInsights from "@/components/PredictiveInsights";
import VoiceRecorder from "@/components/VoiceRecorder";
import DataManagement from "@/components/DataManagement";
import { RecommendationsEngine } from "@/components/RecommendationsEngine";
import IntelligentDrillDown from "@/components/IntelligentDrillDown";

type Persona = 'executive' | 'consumables' | 'non_consumables';

const personaConfig = {
  executive: {
    label: 'Executive',
    description: 'Strategic insights across all categories',
    icon: '👔',
    categories: null, // All categories
  },
  consumables: {
    label: 'Category Manager - Consumables',
    description: 'Tactical analysis for grocery & consumables',
    icon: '🥛',
    categories: ['Dairy', 'Beverages', 'Snacks', 'Produce', 'Frozen', 'Bakery', 'Pantry'],
  },
  non_consumables: {
    label: 'Category Manager - Non-Consumables',
    description: 'Tactical analysis for personal & home care',
    icon: '🧴',
    categories: ['Personal Care', 'Home Care', 'Household'],
  },
};

export default function Index() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AnalyticsResult | null>(null);
  const [showRisksOnly, setShowRisksOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [drillDownData, setDrillDownData] = useState<{ name: string; roi: number; margin: number } | null>(null);
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const [persona, setPersona] = useState<Persona>('executive');

  // Format large numbers to fit in KPI cards
  const formatKPIValue = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) return '$0';
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absValue >= 1000000000) return `${sign}$${(absValue / 1000000000).toFixed(1)}B`;
    if (absValue >= 1000000) return `${sign}$${(absValue / 1000000).toFixed(1)}M`;
    if (absValue >= 1000) return `${sign}$${(absValue / 1000).toFixed(0)}K`;
    return `${sign}$${absValue.toFixed(0)}`;
  };

  const handleAsk = async (questionText?: string) => {
    const questionToAsk = questionText || query;
    if (!questionToAsk.trim()) return;
    
    if (questionText) {
      setQuery(questionText);
    }
    
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-question`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            question: questionToAsk,
            persona: persona,
            categories: personaConfig[persona].categories
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze question');
      }

      const analyticsResult = await response.json();
      setResult(analyticsResult);
    } catch (error) {
      console.error('Error analyzing question:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze question",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionClick = async (question: string) => {
    await handleAsk(question);
  };

  // Persona-specific popular questions
  const personaQuestions = {
    executive: [
      { id: 'e1', question: "Executive scorecard: overall portfolio ROI across consumables & non-consumables?", tag: "SCORECARD" },
      { id: 'e2', question: "Cross-category performance: which division (grocery vs home care) is driving growth?", tag: "PORTFOLIO" },
      { id: 'e3', question: "Strategic opportunity: where should we reallocate promo spend across all categories?", tag: "STRATEGY" },
      { id: 'e4', question: "Risk assessment: top 5 underperforming campaigns across entire business?", tag: "RISK" },
      { id: 'e5', question: "Market share trends: how are promotions impacting overall competitive position?", tag: "MARKET" },
      { id: 'e6', question: "Forecast: projected ROI and margin for Q2 across consumables and non-consumables?", tag: "FORECAST" },
      { id: 'e7', question: "Cost efficiency: vendor funding optimization opportunities across all vendors?", tag: "EFFICIENCY" },
      { id: 'e8', question: "Customer insights: which segments respond best to promotions overall?", tag: "CUSTOMER" },
    ],
    consumables: [
      { id: 'c1', question: "Top 5 grocery promotions by ROI last month?", tag: "ROI" },
      { id: 'c2', question: "Which Dairy promotions lost money (ROI < 1)?", tag: "RISK" },
      { id: 'c3', question: "Optimal discount depth for Beverages to maximize margin?", tag: "OPTIMIZATION" },
      { id: 'c4', question: "Best mechanic (BOGO/price-off/coupon) for Snacks category?", tag: "MECHANICS" },
      { id: 'c5', question: "Halo effects: which Frozen promos drive cross-category sales?", tag: "HALO" },
      { id: 'c6', question: "Coupon redemption rates for Pantry promotions last month?", tag: "COUPON" },
      { id: 'c7', question: "Produce promo calendar for next month with predicted lift?", tag: "CALENDAR" },
      { id: 'c8', question: "Bakery vendor funding ROI: which vendors deliver best returns?", tag: "VENDOR" },
    ],
    non_consumables: [
      { id: 'n1', question: "Top 5 Personal Care promotions by ROI last month?", tag: "ROI" },
      { id: 'n2', question: "Which Home Care promotions underperformed (ROI < 1)?", tag: "RISK" },
      { id: 'n3', question: "Optimal discount depth for Soap products to maximize margin?", tag: "OPTIMIZATION" },
      { id: 'n4', question: "Best mechanic (BOGO/price-off/bundle) for Cleaning products?", tag: "MECHANICS" },
      { id: 'n5', question: "Cross-sell: which Personal Care promos drive Household purchases?", tag: "CROSS-SELL" },
      { id: 'n6', question: "Hair Care vs Oral Care: which subcategory has better promo ROI?", tag: "COMPARISON" },
      { id: 'n7', question: "Cooking Oil promotions: seasonal trends and optimal timing?", tag: "SEASONAL" },
      { id: 'n8', question: "Paper Products inventory impact from recent promotions?", tag: "INVENTORY" },
    ],
  };

  const currentQuestions = personaQuestions[persona];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Promotion Intelligence</h1>
              <p className="text-sm text-muted-foreground">AI-powered promotion analysis and ROI intelligence</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowRisksOnly(!showRisksOnly)}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              {showRisksOnly ? "Show all" : "Show anomalies only"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="insights">Insights & Analytics</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="insights">
            {/* Persona Selector & Search Bar */}
            <div className="mb-8 space-y-6">
              {/* Persona Selector Row */}
              <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground min-w-fit">
                    <User className="h-4 w-4" />
                    <span>Viewing as:</span>
                  </div>
                  
                  <Select value={persona} onValueChange={(value: Persona) => setPersona(value)}>
                    <SelectTrigger className="w-[380px] h-12 bg-background border-border shadow-sm hover:bg-accent/50 transition-colors">
                      <SelectValue>
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{personaConfig[persona].icon}</span>
                          <div className="text-left">
                            <div className="font-semibold text-foreground">{personaConfig[persona].label}</div>
                            <div className="text-xs text-muted-foreground">{personaConfig[persona].description}</div>
                          </div>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border shadow-lg">
                      {Object.entries(personaConfig).map(([key, config]) => (
                        <SelectItem 
                          key={key} 
                          value={key}
                          className="py-3 px-3 cursor-pointer hover:bg-accent focus:bg-accent"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{config.icon}</span>
                            <div>
                              <div className="font-semibold text-foreground">{config.label}</div>
                              <div className="text-xs text-muted-foreground">{config.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Badge 
                    variant="secondary" 
                    className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary border-0"
                  >
                    {personaConfig[persona].categories 
                      ? `${personaConfig[persona].categories.length} categories` 
                      : 'All categories'}
                  </Badge>
                </div>
              </Card>

              {/* Search Bar */}
              <Card className="p-2 bg-card border-border shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                      placeholder={
                        persona === 'executive' 
                          ? "Ask strategic questions about overall portfolio, cross-category trends..."
                          : persona === 'consumables'
                          ? "Ask about grocery ROI, dairy promotions, beverage trends..."
                          : "Ask about personal care ROI, home care promotions, soap trends..."
                      }
                      className="pl-12 pr-4 h-12 text-base bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 pr-1">
                    <VoiceRecorder 
                      onTranscript={(text) => {
                        setQuery(text);
                        handleAsk(text);
                      }}
                      disabled={isLoading}
                    />
                    <Button 
                      onClick={() => handleAsk()}
                      className="px-6 h-10 font-medium shadow-sm"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Analyzing...
                        </span>
                      ) : "Ask"}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {result ? (
              /* Answer View */
              <div className="grid grid-cols-12 gap-8">
                {/* Main Content */}
                <div className="col-span-8 space-y-6">
                  {/* What Happened Section */}
                  <Card className="p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      WHAT HAPPENED
                    </h2>
                    <div className="space-y-4">
                      {result.whatHappened.map((point, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      <p className="text-base leading-relaxed text-foreground" dangerouslySetInnerHTML={{ __html: point }} />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Why It Happened Section */}
              <Card className="p-6">
                <h2 className="text-lg font-bold mb-4">WHY IT HAPPENED</h2>
                <div className="space-y-4">
                  {result.why.map((point, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-chart-3 flex-shrink-0" />
                      <p className="text-base leading-relaxed text-foreground" dangerouslySetInnerHTML={{ __html: point }} />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recommendation Section */}
              <Card className="p-6">
                <h2 className="text-lg font-bold mb-4">RECOMMENDATION</h2>
                <div className="space-y-4">
                  {result.whatToDo.map((point, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-status-good flex-shrink-0" />
                      <p className="text-base leading-relaxed text-foreground" dangerouslySetInnerHTML={{ __html: point }} />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Predictive & ML Insights */}
              <PredictiveInsights 
                predictions={result.predictions}
                causalDrivers={result.causalDrivers}
                mlInsights={result.mlInsights}
              />

              {/* Data Insights Section */}
              <Card className="p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  DATA INSIGHTS
                </h2>
                
                {/* KPI Pills */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-secondary/50 rounded-lg p-4 overflow-hidden">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Lift %</div>
                    <div className={`text-xl sm:text-2xl lg:text-3xl font-bold tabular-nums truncate ${getKPIStatus("liftPct", Number(result.kpis?.liftPct) || 0) === "good" ? "text-status-good" : getKPIStatus("liftPct", Number(result.kpis?.liftPct) || 0) === "warning" ? "text-status-warning" : "text-status-bad"}`}>
                      {(Number(result.kpis?.liftPct) || 0).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4 overflow-hidden">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">ROI</div>
                    <div className={`text-xl sm:text-2xl lg:text-3xl font-bold tabular-nums truncate ${getKPIStatus("roi", Number(result.kpis?.roi) || 0) === "good" ? "text-status-good" : getKPIStatus("roi", Number(result.kpis?.roi) || 0) === "warning" ? "text-status-warning" : "text-status-bad"}`}>
                      {(Number(result.kpis?.roi) || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4 overflow-hidden">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide whitespace-nowrap">Incremental Margin</div>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tabular-nums truncate" title={`US$${Math.round(Number(result.kpis?.incrementalMargin) || 0).toLocaleString()}`}>
                      {formatKPIValue(Number(result.kpis?.incrementalMargin) || 0)}
                    </div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4 overflow-hidden">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Spend</div>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tabular-nums truncate" title={`US$${Math.round(Number(result.kpis?.spend) || 0).toLocaleString()}`}>
                      {formatKPIValue(Number(result.kpis?.spend) || 0)}
                    </div>
                  </div>
                </div>

                {/* Chart - Dynamic based on data keys */}
                <div className="h-96 bg-card border border-border rounded-lg p-6">
                  <div className="mb-4 text-sm text-muted-foreground flex items-center gap-2">
                    <span className="text-base">💡</span>
                    <span>Click on any bar to see detailed breakdown</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    {(() => {
                      // Dynamically detect chart data keys
                      const chartData = result.chartData || [];
                      if (chartData.length === 0) {
                        return (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            No chart data available
                          </div>
                        );
                      }
                      
                      const sampleItem = chartData[0] || {};
                      const numericKeys = Object.keys(sampleItem).filter(
                        key => key !== 'name' && typeof sampleItem[key] === 'number'
                      );
                      
                      // Determine which key to use for the primary bar
                      const primaryKey = numericKeys.find(k => ['margin', 'roi', 'revenue', 'value', 'market_share', 'sales', 'lift', 'units'].includes(k)) || numericKeys[0] || 'margin';
                      const secondaryKey = numericKeys.find(k => k !== primaryKey && ['competitor_avg_share', 'roi', 'margin', 'baseline', 'benchmark'].includes(k));
                      
                      // Format label for display
                      const formatLabel = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                      
                      // Determine if values need $ formatting (margin, revenue, spend, etc.)
                      const needsDollarFormat = ['margin', 'revenue', 'spend', 'sales', 'value', 'incrementalMargin'].includes(primaryKey);
                      const needsPercentFormat = ['roi', 'market_share', 'competitor_avg_share', 'lift', 'liftPct'].includes(primaryKey);
                      
                      const formatYAxis = (value: number) => {
                        if (needsDollarFormat) {
                          if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                          if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                          return `$${value.toFixed(0)}`;
                        }
                        if (needsPercentFormat) return `${value.toFixed(1)}%`;
                        return value.toLocaleString();
                      };
                      
                      const formatTooltip = (value: number) => {
                        if (needsDollarFormat) return `$${value.toLocaleString()}`;
                        if (needsPercentFormat) return `${value.toFixed(2)}%`;
                        return value.toLocaleString();
                      };
                      
                      return (
                        <BarChart 
                          data={chartData}
                          onMouseLeave={() => setActiveBarIndex(null)}
                          margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                            angle={-15}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis 
                            tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                            tickFormatter={formatYAxis}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "6px"
                            }}
                            cursor={{ fill: "hsl(var(--primary) / 0.1)" }}
                            formatter={(value: number, name: string) => [formatTooltip(value), formatLabel(name)]}
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: "20px" }}
                          />
                          <Bar 
                            dataKey={primaryKey} 
                            fill="hsl(var(--status-good))" 
                            name={formatLabel(primaryKey)} 
                            radius={[8, 8, 0, 0]}
                            onClick={(data) => setDrillDownData({ ...data, name: data.name, roi: data.roi || 0, margin: data.margin || data[primaryKey] || 0 })}
                            onMouseEnter={(_, index) => setActiveBarIndex(index)}
                            cursor="pointer"
                          >
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`}
                                fill={activeBarIndex === index ? "hsl(var(--primary))" : "hsl(var(--status-good))"}
                                opacity={activeBarIndex === null || activeBarIndex === index ? 1 : 0.6}
                              />
                            ))}
                          </Bar>
                          {secondaryKey && (
                            <Bar 
                              dataKey={secondaryKey} 
                              fill="hsl(var(--chart-3))" 
                              name={formatLabel(secondaryKey)} 
                              radius={[8, 8, 0, 0]}
                            >
                              {chartData.map((entry, index) => (
                                <Cell 
                                  key={`cell-secondary-${index}`}
                                  fill="hsl(var(--chart-3))"
                                  opacity={activeBarIndex === null || activeBarIndex === index ? 0.8 : 0.4}
                                />
                              ))}
                            </Bar>
                          )}
                        </BarChart>
                      );
                    })()}
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Follow-up Questions */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">Next questions to explore:</span>
                <div className="flex gap-2">
                  {result.nextQuestions.map((question, idx) => (
                    <Button 
                      key={idx} 
                      variant="outline" 
                      size="sm"
                      className="text-left h-auto py-2 px-3 whitespace-normal"
                      onClick={() => handleAsk(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sources */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span>Sources: {result.sources}</span>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="col-span-4 space-y-6">
              <Card className="p-5">
                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
                  {persona === 'executive' ? 'Strategic Questions' : `${personaConfig[persona].label.split(' - ')[1]} Questions`}
                </h3>
                <div className="space-y-2">
                  {currentQuestions.slice(0, 6).map(q => (
                    <button
                      key={q.id}
                      onClick={() => handleQuestionClick(q.question)}
                      className="w-full text-left text-sm p-3 rounded-md hover:bg-accent transition-colors border border-transparent hover:border-border"
                    >
                      {q.question}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* Welcome View */
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 py-12">
              <h2 className="text-4xl font-bold mb-4">Welcome to Promotion Intelligence</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Ask me anything about promotion ROI, price optimization, halo effects, vendor funding, 
                coupon performance, or category analysis. I'll analyze the data and provide actionable 
                insights with supporting documentation.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-6">
                {persona === 'executive' ? 'Strategic Questions' : `${personaConfig[persona].label.split(' - ')[1]} Questions`}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {currentQuestions.map(q => (
                  <Card 
                    key={q.id}
                    className="p-5 cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                    onClick={() => handleQuestionClick(q.question)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">{q.tag}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {q.question}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          )}
          </TabsContent>

          <TabsContent value="data">
            <DataManagement />
          </TabsContent>

          <TabsContent value="recommendations">
            <RecommendationsEngine />
          </TabsContent>
        </Tabs>
      </div>

      {/* Intelligent Drill Down Panel */}
      {drillDownData && (
        <IntelligentDrillDown 
          initialData={drillDownData}
          questionContext={query}
          suggestedDimensions={result?.drillPath}
          enrichedData={result?.enrichedData}
          onClose={() => setDrillDownData(null)} 
        />
      )}
    </div>
  );
}
