import { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, TrendingUp, AlertTriangle, ChevronDown, User, MessageSquare, LayoutGrid, Calendar, Clock, SlidersHorizontal, ArrowLeft, BarChart3, Package, Store, ShoppingCart, Layers, DollarSign, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import DataManagement from "@/components/DataManagement";
import { RecommendationsEngine } from "@/components/RecommendationsEngine";
import ChatInterface from "@/components/ChatInterface";
import type { AnalyticsResult } from "@/lib/analytics";

type Persona = 'executive' | 'pricing_manager' | 'assortment_planner' | 'space_planner' | 'demand_planner' | 'supply_chain';
type TimePeriod = 'last_month' | 'last_quarter' | 'last_year' | 'ytd' | 'custom';
type AnalyticsDomain = 'all' | 'pricing' | 'promotion' | 'assortment' | 'space' | 'demand' | 'replenishment' | 'supply_chain';

const timePeriodConfig = {
  last_month: { label: 'Last Month', icon: Calendar, description: 'Past 30 days' },
  last_quarter: { label: 'Last Quarter', icon: Clock, description: 'Past 3 months' },
  last_year: { label: 'Last Year', icon: Calendar, description: 'Past 12 months' },
  ytd: { label: 'Year to Date', icon: TrendingUp, description: 'Jan 1 - Today' },
  custom: { label: 'Custom', icon: SlidersHorizontal, description: 'Select range' },
};

const personaConfig = {
  executive: {
    label: 'Executive',
    description: 'Strategic insights across all merchandising domains',
    icon: '👔',
    domains: null,
  },
  pricing_manager: {
    label: 'Pricing Manager',
    description: 'Price optimization and competitive analysis',
    icon: '💰',
    domains: ['pricing', 'promotion'],
  },
  assortment_planner: {
    label: 'Assortment Planner',
    description: 'Product mix and category management',
    icon: '📦',
    domains: ['assortment', 'space'],
  },
  space_planner: {
    label: 'Space Planner',
    description: 'Planogram and shelf optimization',
    icon: '🏪',
    domains: ['space', 'assortment'],
  },
  demand_planner: {
    label: 'Demand Planner',
    description: 'Forecasting and demand sensing',
    icon: '📈',
    domains: ['demand', 'replenishment'],
  },
  supply_chain: {
    label: 'Supply Chain Manager',
    description: 'Inventory and logistics optimization',
    icon: '🚚',
    domains: ['supply_chain', 'replenishment', 'demand'],
  },
};

const domainConfig: Record<AnalyticsDomain, { label: string; icon: typeof TrendingUp; color: string }> = {
  all: { label: 'All Domains', icon: Layers, color: 'text-foreground' },
  pricing: { label: 'Pricing', icon: DollarSign, color: 'text-green-500' },
  promotion: { label: 'Promotion', icon: TrendingUp, color: 'text-blue-500' },
  assortment: { label: 'Assortment', icon: Package, color: 'text-purple-500' },
  space: { label: 'Space Planning', icon: Store, color: 'text-orange-500' },
  demand: { label: 'Demand', icon: BarChart3, color: 'text-cyan-500' },
  replenishment: { label: 'Replenishment', icon: ShoppingCart, color: 'text-amber-500' },
  supply_chain: { label: 'Supply Chain', icon: Truck, color: 'text-red-500' },
};

// Domain-specific questions
const domainQuestions: Record<AnalyticsDomain, { id: string; question: string; tag: string }[]> = {
  all: [
    { id: 'all1', question: "Executive dashboard: overall merchandising performance across all domains?", tag: "OVERVIEW" },
    { id: 'all2', question: "Which merchandising lever has the highest ROI impact?", tag: "STRATEGIC" },
  ],
  pricing: [
    { id: 'p1', question: "Price elasticity analysis: which products are most price sensitive?", tag: "ELASTICITY" },
    { id: 'p2', question: "Competitive pricing gap analysis vs key competitors?", tag: "COMPETITIVE" },
    { id: 'p3', question: "Optimal price points for top 20 products by revenue?", tag: "OPTIMIZATION" },
    { id: 'p4', question: "Price perception impact on basket size and frequency?", tag: "BEHAVIOR" },
    { id: 'p5', question: "Markdown optimization: which products need price adjustments?", tag: "MARKDOWN" },
    { id: 'p6', question: "Price zone performance comparison across regions?", tag: "ZONES" },
  ],
  promotion: [
    { id: 'pr1', question: "Top promotions by ROI last month?", tag: "ROI" },
    { id: 'pr2', question: "Which promotions lost money (ROI < 1)?", tag: "RISK" },
    { id: 'pr3', question: "Optimal discount depth by category to maximize margin?", tag: "DEPTH" },
    { id: 'pr4', question: "Best mechanic (BOGO/price-off/coupon) by category?", tag: "MECHANICS" },
    { id: 'pr5', question: "Halo and cannibalization effects of recent promotions?", tag: "EFFECTS" },
    { id: 'pr6', question: "Promotion calendar effectiveness analysis?", tag: "CALENDAR" },
  ],
  assortment: [
    { id: 'a1', question: "Assortment gaps: missing products vs competitors?", tag: "GAPS" },
    { id: 'a2', question: "SKU rationalization: candidates for delisting?", tag: "RATIONALIZATION" },
    { id: 'a3', question: "New product performance vs established items?", tag: "NPD" },
    { id: 'a4', question: "Category role analysis and strategic positioning?", tag: "CATEGORY" },
    { id: 'a5', question: "Private label vs national brand performance?", tag: "BRANDS" },
    { id: 'a6', question: "Optimal assortment size by category and store format?", tag: "SIZE" },
  ],
  space: [
    { id: 's1', question: "Space-to-sales analysis: over/under-spaced categories?", tag: "ALLOCATION" },
    { id: 's2', question: "Planogram compliance and execution scores?", tag: "COMPLIANCE" },
    { id: 's3', question: "Shelf position impact on sales velocity?", tag: "POSITION" },
    { id: 's4', question: "Category adjacency optimization opportunities?", tag: "ADJACENCY" },
    { id: 's5', question: "Store format-specific space recommendations?", tag: "FORMAT" },
    { id: 's6', question: "End-cap and display ROI analysis?", tag: "DISPLAY" },
  ],
  demand: [
    { id: 'd1', question: "Demand forecast accuracy by category last month?", tag: "ACCURACY" },
    { id: 'd2', question: "Seasonal demand patterns and upcoming peaks?", tag: "SEASONAL" },
    { id: 'd3', question: "Demand sensing signals: early trend detection?", tag: "SENSING" },
    { id: 'd4', question: "Forecast bias analysis: over vs under forecasting?", tag: "BIAS" },
    { id: 'd5', question: "External factors impact on demand (weather, events)?", tag: "EXTERNAL" },
    { id: 'd6', question: "New product demand prediction confidence?", tag: "NPD" },
  ],
  replenishment: [
    { id: 'r1', question: "Stock-out analysis: lost sales by category?", tag: "STOCKOUT" },
    { id: 'r2', question: "Overstock exposure and slow-moving inventory?", tag: "OVERSTOCK" },
    { id: 'r3', question: "Optimal safety stock levels by product?", tag: "SAFETY" },
    { id: 'r4', question: "Order frequency and quantity optimization?", tag: "ORDER" },
    { id: 'r5', question: "Lead time variability and supplier reliability?", tag: "SUPPLIERS" },
    { id: 'r6', question: "Automated replenishment performance metrics?", tag: "AUTO" },
  ],
  supply_chain: [
    { id: 'sc1', question: "Distribution center efficiency and throughput?", tag: "DC" },
    { id: 'sc2', question: "Transportation cost per case by lane?", tag: "TRANSPORT" },
    { id: 'sc3', question: "Supplier scorecard: on-time and in-full rates?", tag: "SUPPLIER" },
    { id: 'sc4', question: "Inventory turns by location and category?", tag: "TURNS" },
    { id: 'sc5', question: "Supply chain risk assessment and mitigation?", tag: "RISK" },
    { id: 'sc6', question: "Network optimization opportunities?", tag: "NETWORK" },
  ],
};

export default function MerchandisingAnalytics() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AnalyticsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState<Persona>('executive');
  const [selectedDomain, setSelectedDomain] = useState<AnalyticsDomain>('all');
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('last_quarter');
  const [cacheHit, setCacheHit] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  const formatKPIValue = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) return '$0';
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absValue >= 1000000000) return `${sign}$${(absValue / 1000000000).toFixed(1)}B`;
    if (absValue >= 1000000) return `${sign}$${(absValue / 1000000).toFixed(1)}M`;
    if (absValue >= 1000) return `${sign}$${(absValue / 1000).toFixed(0)}K`;
    return `${sign}$${absValue.toFixed(0)}`;
  };

  const handleChatAsk = useCallback(async (questionText: string, kpis: string[]): Promise<AnalyticsResult | null> => {
    setQuery(questionText);
    setSelectedKPIs(kpis);
    setIsLoading(true);
    setCacheHit(false);
    setResponseTime(null);
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-question`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            question: questionText,
            persona: persona,
            domain: selectedDomain,
            selectedKPIs: kpis.length > 0 ? kpis : null,
            timePeriod: timePeriod !== 'custom' ? timePeriod : null
          }),
        }
      );

      const elapsed = Date.now() - startTime;
      setResponseTime(elapsed);
      setCacheHit(response.headers.get('X-Cache') === 'HIT');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze question');
      }

      const analyticsResult = await response.json();
      setResult(analyticsResult);
      return analyticsResult;
    } catch (error) {
      console.error('Error analyzing question:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze question",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [persona, selectedDomain, timePeriod, toast]);

  // Get questions for current domain
  const getCurrentQuestions = () => {
    if (selectedDomain === 'all') {
      // Show mix of questions from all domains
      return Object.values(domainQuestions).flat().slice(0, 8);
    }
    return domainQuestions[selectedDomain] || [];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">Merchandising Analytics</h1>
                <p className="text-sm text-muted-foreground">Full-spectrum merchandising intelligence platform</p>
              </div>
            </div>
            <Badge variant="outline" className="text-accent border-accent">
              EXPANDED PLATFORM
            </Badge>
          </div>

          {/* Domain Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {Object.entries(domainConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={key}
                  variant={selectedDomain === key ? "default" : "outline"}
                  size="sm"
                  className="gap-2 whitespace-nowrap"
                  onClick={() => setSelectedDomain(key as AnalyticsDomain)}
                >
                  <Icon className={`h-4 w-4 ${selectedDomain === key ? '' : config.color}`} />
                  {config.label}
                </Button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat Assistant
            </TabsTrigger>
            <TabsTrigger value="classic" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Classic View
            </TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          {/* Chat Assistant Tab */}
          <TabsContent value="chat">
            {/* Persona Selector */}
            <div className="mb-6">
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
                </div>
              </Card>
            </div>

            <ChatInterface 
              persona={persona}
              personaConfig={{
                label: personaConfig[persona].label,
                description: personaConfig[persona].description,
                icon: personaConfig[persona].icon,
                categories: null, // Merchandising uses domains instead
              }}
              onAsk={handleChatAsk}
              isLoading={isLoading}
              currentResult={result}
            />
          </TabsContent>

          {/* Classic View Tab */}
          <TabsContent value="classic">
            <div className="grid grid-cols-12 gap-8">
              {/* Left Panel */}
              <div className="col-span-4 space-y-6">
                {/* Persona Selector */}
                <Card className="p-4 bg-card/50">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Role</span>
                  </div>
                  <Select value={persona} onValueChange={(value: Persona) => setPersona(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <span>{personaConfig[persona].icon}</span>
                          <span>{personaConfig[persona].label}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(personaConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span>{config.icon}</span>
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Card>

                {/* Popular Questions by Domain */}
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    {(() => {
                      const Icon = domainConfig[selectedDomain].icon;
                      return <Icon className={`h-4 w-4 ${domainConfig[selectedDomain].color}`} />;
                    })()}
                    {domainConfig[selectedDomain].label} Questions
                  </h3>
                  <div className="space-y-2">
                    {getCurrentQuestions().map((q) => (
                      <button
                        key={q.id}
                        onClick={() => handleChatAsk(q.question, [])}
                        className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                      >
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="text-xs shrink-0">{q.tag}</Badge>
                          <span className="text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {q.question}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Right Panel - Results */}
              <div className="col-span-8">
                <Card className="p-6 min-h-[600px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Analyzing...</p>
                      </div>
                    </div>
                  ) : result ? (
                    <div className="space-y-6" ref={resultsRef}>
                      {/* Answer sections */}
                      {result.whatHappened && (
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2">What Happened</h4>
                          <p className="text-foreground">{result.whatHappened}</p>
                        </div>
                      )}
                      {result.why && (
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Why</h4>
                          <p className="text-foreground">{result.why}</p>
                        </div>
                      )}
                      {result.whatToDo && (
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Recommendation</h4>
                          <p className="text-foreground">{result.whatToDo}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select a question or ask your own to get started</p>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data">
            <DataManagement />
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            <RecommendationsEngine />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
