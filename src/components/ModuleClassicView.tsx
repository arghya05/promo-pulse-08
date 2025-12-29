import { useState, useEffect, useCallback } from 'react';
import { Module } from '@/lib/data/modules';
import { ModuleQuestion } from '@/lib/data/module-questions';
import { ModuleKPI } from '@/lib/data/module-kpis';
import { getModuleChatContent } from '@/lib/data/module-suggestions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Search, 
  Loader2, 
  Sparkles,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ChevronRight,
  ChevronDown,
  Brain,
  Target,
  AlertTriangle,
  Lightbulb,
  Zap,
  Layers,
  Calendar,
  Clock,
  CalendarDays,
  TrendingUp as YTDIcon,
  Settings2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import SearchSuggestions from './SearchSuggestions';
import MultiLevelDrillDown from './MultiLevelDrillDown';
import KPISelector from './KPISelector';
import ProductDrillDown from './ProductDrillDown';

interface ModuleClassicViewProps {
  module: Module;
  questions: ModuleQuestion[];
  popularQuestions: ModuleQuestion[];
  kpis: ModuleKPI[];
}

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

// Module-specific drill paths
const MODULE_DRILL_PATHS: Record<string, string[]> = {
  promotion: ['category', 'brand', 'sku', 'store', 'region'],
  pricing: ['category', 'brand', 'sku', 'competitor', 'region'],
  assortment: ['category', 'brand', 'sku', 'store', 'performance'],
  demand: ['category', 'product', 'store', 'time_period', 'forecast_model'],
  'supply-chain': ['supplier', 'product', 'route', 'status', 'region'],
  space: ['category', 'planogram', 'fixture', 'store', 'shelf'],
  executive: ['region', 'category', 'brand', 'sku', 'store']
};

const TIME_PERIODS = [
  { id: 'last_month', label: 'Last Month', icon: Calendar },
  { id: 'last_quarter', label: 'Last Quarter', icon: Clock },
  { id: 'last_year', label: 'Last Year', icon: CalendarDays },
  { id: 'ytd', label: 'Year to Date', icon: YTDIcon }
];

const ModuleClassicView = ({ module, questions, popularQuestions, kpis }: ModuleClassicViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<ModuleQuestion | null>(null);
  const [result, setResult] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [productDrillData, setProductDrillData] = useState<any>(null);
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>('last_month');
  const [lastAnalyzedQuestion, setLastAnalyzedQuestion] = useState<string>('');
  const [analysisTimestamp, setAnalysisTimestamp] = useState<number>(0);
  const [expandedSections, setExpandedSections] = useState({
    whatHappened: true,
    why: true,
    whatToDo: true,
    causalDrivers: true,
    mlInsights: true,
    predictions: true,
  });
  const { toast } = useToast();
  const Icon = module.icon;
  const chatContent = getModuleChatContent(module.id);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleChartClick = (data: any) => {
    if (data && data.name) {
      // Check if this looks like a product/SKU (contains SKU pattern or has product-level metrics)
      const isProductLevel = data.sku || 
        data.name.includes('(SKU') || 
        data.name.match(/\([A-Z]{2,4}-\d+\)/) ||
        (result?.chartData?.[0]?.sku) ||
        (lastAnalyzedQuestion?.toLowerCase().includes('product') ||
         lastAnalyzedQuestion?.toLowerCase().includes('seller') ||
         lastAnalyzedQuestion?.toLowerCase().includes('sku') ||
         lastAnalyzedQuestion?.toLowerCase().includes('item'));
      
      if (isProductLevel) {
        // Extract SKU from name if present
        const skuMatch = data.name.match(/\(([A-Z0-9-]+)\)/);
        setProductDrillData({
          name: data.name.replace(/\s*\([^)]*\)/, '').trim(),
          sku: data.sku || skuMatch?.[1] || data.name,
          category: data.category,
          brand: data.brand,
          revenue: data.value || data.revenue,
          margin: data.margin,
          units: data.units
        });
      } else {
        setDrillDownData({
          name: data.name,
          roi: data.value || 1.5,
          margin: data.margin || data.value * 1000 || 50000
        });
      }
    }
  };

  const handleAnalyze = useCallback(async (question: string, kpis: string[], timePeriod: string) => {
    setIsLoading(true);
    setResult(null);
    setLastAnalyzedQuestion(question);
    setAnalysisTimestamp(Date.now());

    try {
      const { data, error } = await supabase.functions.invoke('analyze-module-question', {
        body: { 
          question,
          moduleId: module.id,
          selectedKPIs: kpis.length > 0 ? kpis : undefined,
          timePeriod
        }
      });

      if (error) throw error;
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Analysis Error',
        description: 'Could not complete the analysis. This module is being configured.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [module.id, toast]);

  // Re-run analysis when KPIs or time period change (if we have a question)
  useEffect(() => {
    if (lastAnalyzedQuestion && selectedKPIs.length > 0) {
      // Debounce the re-analysis
      const timer = setTimeout(() => {
        handleAnalyze(lastAnalyzedQuestion, selectedKPIs, selectedTimePeriod);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedKPIs, selectedTimePeriod]);

  const handleQuestionClick = (question: ModuleQuestion) => {
    setSelectedQuestion(question);
    setSearchQuery(question.text);
    handleAnalyze(question.text, selectedKPIs, selectedTimePeriod);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      handleAnalyze(searchQuery, selectedKPIs, selectedTimePeriod);
    }
  };

  const handleKPIsChange = (newKPIs: string[]) => {
    setSelectedKPIs(newKPIs);
  };

  const handleTimePeriodChange = (period: string) => {
    setSelectedTimePeriod(period);
  };

  const renderChart = () => {
    if (!result?.chartData) return null;

    const chartType = selectedQuestion?.chartType || 'bar';
    const data = result.chartData;

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {data.map((_: any, index: number) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      default: {
        // Dynamically detect data keys for bars - support multi-bar charts
        const sampleItem = data[0] || {};
        const barKeys = Object.keys(sampleItem).filter(k => 
          k !== 'name' && 
          typeof sampleItem[k] === 'number' && 
          !['id', 'index'].includes(k)
        );
        
        // If no valid numeric keys found, or only 'value' exists, use single bar
        const primaryKey = barKeys.includes('value') ? 'value' : 
                          barKeys.includes('revenue') ? 'revenue' : 
                          barKeys[0] || 'value';
        
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} onClick={(e) => e?.activePayload?.[0] && handleChartClick(e.activePayload[0].payload)}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(1)}K` : `$${v}`} />
              <Tooltip formatter={(value: number) => value >= 1000 ? `$${(value/1000).toFixed(1)}K` : `$${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey={primaryKey} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} className="cursor-pointer" name={primaryKey.charAt(0).toUpperCase() + primaryKey.slice(1)} />
            </BarChart>
          </ResponsiveContainer>
        );
      }
    }
  };

  const drillPath = MODULE_DRILL_PATHS[module.id] || MODULE_DRILL_PATHS.promotion;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Left Panel - Questions */}
      <div className="space-y-4 min-w-0 overflow-x-hidden">
        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder={chatContent.placeholder}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              <SearchSuggestions
                query={searchQuery}
                onSelect={(suggestion) => {
                  setSearchQuery(suggestion);
                  setShowSuggestions(false);
                  handleAnalyze(suggestion, selectedKPIs, selectedTimePeriod);
                }}
                isVisible={showSuggestions && searchQuery.length >= 2}
                persona="executive"
                moduleId={module.id}
              />
            </div>
          </CardContent>
        </Card>

        {/* KPI Selector */}
        {searchQuery.trim() && (
          <KPISelector
            question={searchQuery}
            selectedKPIs={selectedKPIs}
            onKPIsChange={handleKPIsChange}
            isLoading={isLoading}
            moduleId={module.id}
          />
        )}

        {/* Time Period Filter */}
        {searchQuery.trim() && (
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Time Period:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TIME_PERIODS.map((period) => {
                  const PeriodIcon = period.icon;
                  return (
                    <Button
                      key={period.id}
                      variant={selectedTimePeriod === period.id ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => handleTimePeriodChange(period.id)}
                      disabled={isLoading}
                    >
                      <PeriodIcon className="h-3 w-3" />
                      {period.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Info Badge */}
        {result && analysisTimestamp > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <Badge variant="outline" className="text-xs">
              Analyzed ({((Date.now() - analysisTimestamp) / 1000).toFixed(1)}s)
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs gap-1"
              onClick={() => handleAnalyze(lastAnalyzedQuestion, selectedKPIs, selectedTimePeriod)}
              disabled={isLoading}
            >
              <Settings2 className="h-3 w-3" />
              Refine Analysis
            </Button>
          </div>
        )}

        {/* Popular Questions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Popular Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {popularQuestions.map((q) => (
              <Button
                key={q.id}
                variant={selectedQuestion?.id === q.id ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full justify-start text-left h-auto py-2 px-3"
                onClick={() => handleQuestionClick(q)}
                disabled={isLoading}
              >
                <ChevronRight className="h-3 w-3 mr-2 flex-shrink-0" />
                <span className="line-clamp-2 text-xs">{q.text}</span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* KPIs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Available KPIs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {kpis.filter((_, i) => i >= 5).slice(0, 8).map((kpi) => (
                <Badge key={kpi.id} variant="outline" className="text-xs">
                  {kpi.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Results */}
      <div className="lg:col-span-2 w-full max-w-full min-w-0 overflow-x-hidden">
        <Card className="h-full">
          <CardContent className="p-6 w-full max-w-full min-w-0 overflow-x-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Analyzing your question...</p>
              </div>
            ) : result ? (
              <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
                {/* WHAT HAPPENED Section */}
                {result.whatHappened && (
                  <Collapsible open={expandedSections.whatHappened} onOpenChange={() => toggleSection('whatHappened')}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h3 className="font-semibold flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary flex-shrink-0" />
                        WHAT HAPPENED
                      </h3>
                      <ChevronDown className={`h-4 w-4 transition-transform flex-shrink-0 ${expandedSections.whatHappened ? '' : '-rotate-90'}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="max-h-80 overflow-y-auto overflow-x-hidden pr-2 mt-3">
                        <ul className="space-y-2">
                          {result.whatHappened.map((point: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-1 flex-shrink-0">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* WHY IT HAPPENED Section */}
                {result.why && (
                  <Collapsible open={expandedSections.why} onOpenChange={() => toggleSection('why')}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        WHY IT HAPPENED
                      </h3>
                      <ChevronDown className={`h-4 w-4 transition-transform flex-shrink-0 ${expandedSections.why ? '' : '-rotate-90'}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="max-h-80 overflow-y-auto overflow-x-hidden pr-2 mt-3">
                        <ul className="space-y-2">
                          {result.why.map((reason: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-yellow-500 mt-1 flex-shrink-0">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* WHAT TO DO Section */}
                {result.whatToDo && (
                  <Collapsible open={expandedSections.whatToDo} onOpenChange={() => toggleSection('whatToDo')}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Target className="h-4 w-4 text-status-good flex-shrink-0" />
                        WHAT TO DO
                      </h3>
                      <ChevronDown className={`h-4 w-4 transition-transform flex-shrink-0 ${expandedSections.whatToDo ? '' : '-rotate-90'}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="max-h-80 overflow-y-auto overflow-x-hidden pr-2 mt-3">
                        <ul className="space-y-2">
                          {result.whatToDo.map((action: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-status-good mt-1 flex-shrink-0">✓</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* CAUSAL DRIVERS Section */}
                {result.causalDrivers && result.causalDrivers.length > 0 && (
                  <Collapsible open={expandedSections.causalDrivers} onOpenChange={() => toggleSection('causalDrivers')}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        CAUSAL DRIVERS
                      </h3>
                      <ChevronDown className={`h-4 w-4 transition-transform flex-shrink-0 ${expandedSections.causalDrivers ? '' : '-rotate-90'}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="max-h-80 overflow-y-auto overflow-x-hidden pr-2 mt-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {result.causalDrivers.map((driver: any, i: number) => (
                            <div key={i} className="bg-muted/30 rounded-lg p-3 border border-border">
                              <div className="flex items-center justify-between mb-1 gap-2">
                                <span className="font-medium text-sm">{driver.driver}</span>
                                {driver.direction === 'positive' ? (
                                  <TrendingUp className="h-4 w-4 text-status-good flex-shrink-0" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-status-bad flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className={driver.direction === 'positive' ? 'text-status-good' : 'text-status-bad'}>
                                  {driver.impact}
                                </span>
                                <span>•</span>
                                <span>Correlation: {(driver.correlation * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* ML INSIGHTS Section */}
                {result.mlInsights && (
                  <Collapsible open={expandedSections.mlInsights} onOpenChange={() => toggleSection('mlInsights')}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-500 flex-shrink-0" />
                        MACHINE LEARNING INSIGHTS
                      </h3>
                      <ChevronDown className={`h-4 w-4 transition-transform flex-shrink-0 ${expandedSections.mlInsights ? '' : '-rotate-90'}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="bg-purple-500/10 rounded-lg p-4 mt-3 border border-purple-500/20">
                        <div className="flex items-start gap-3">
                          <Brain className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-sm">Pattern Detected</span>
                              <Badge variant="secondary" className="text-xs">
                                {(result.mlInsights.confidence * 100).toFixed(0)}% confidence
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {result.mlInsights.patternDetected}
                            </p>
                            <p className="text-xs text-purple-600 dark:text-purple-400">
                              <strong>Business Significance:</strong> {result.mlInsights.businessSignificance}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* PREDICTIONS Section */}
                {result.predictions && (
                  <Collapsible open={expandedSections.predictions} onOpenChange={() => toggleSection('predictions')}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <h3 className="font-semibold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        FORECASTING & PREDICTIONS
                      </h3>
                      <ChevronDown className={`h-4 w-4 transition-transform flex-shrink-0 ${expandedSections.predictions ? '' : '-rotate-90'}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="bg-blue-500/10 rounded-lg p-4 mt-3 border border-blue-500/20 max-h-80 overflow-y-auto overflow-x-hidden">
                        <div className="flex flex-wrap items-center gap-4 mb-3">
                          <div>
                            <span className="text-xs text-muted-foreground">Trend</span>
                            <div className={`font-semibold capitalize ${
                              result.predictions.trend === 'increasing' ? 'text-status-good' :
                              result.predictions.trend === 'decreasing' ? 'text-status-bad' : 'text-status-warning'
                            }`}>
                              {result.predictions.trend}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Risk Level</span>
                            <div className={`font-semibold capitalize ${
                              result.predictions.riskLevel === 'low' ? 'text-status-good' :
                              result.predictions.riskLevel === 'high' ? 'text-status-bad' : 'text-status-warning'
                            }`}>
                              {result.predictions.riskLevel}
                            </div>
                          </div>
                        </div>
                        {result.predictions.forecast && (
                          <div className="space-y-2">
                            <span className="text-xs font-medium text-muted-foreground">Forecast</span>
                            <div className="flex flex-wrap gap-2">
                              {(Array.isArray(result.predictions.forecast) 
                                ? result.predictions.forecast 
                                : [result.predictions.forecast]
                              ).map((f: any, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs whitespace-normal break-words">
                                  {f.period}: {typeof f.value === 'number' ? f.value.toFixed(1) : String(f.value || '')}
                                  {f.confidence !== undefined && (
                                    <span className="ml-1 text-muted-foreground">
                                      ({(Number(f.confidence) * 100).toFixed(0)}%)
                                    </span>
                                  )}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* KPI Values */}
                {result.kpis && Object.keys(result.kpis).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(result.kpis).map(([key, value]) => (
                      <Badge key={key} className="text-sm py-1 px-3">
                        {key}: {String(value)}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Chart */}
                {result.chartData && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                      <Layers className="h-3 w-3" />
                      Click any bar to drill down
                    </div>
                    {renderChart()}
                  </div>
                )}

                {/* Drill Down Panel */}
                {drillDownData && (
                  <MultiLevelDrillDown
                    initialData={drillDownData}
                    drillPath={drillPath}
                    onClose={() => setDrillDownData(null)}
                  />
                )}

                {/* Product Drill Down Panel */}
                {productDrillData && (
                  <ProductDrillDown
                    product={productDrillData}
                    onClose={() => setProductDrillData(null)}
                  />
                )}

                {/* Follow-up Questions */}
                {result.nextQuestions && (
                  <div>
                    <h3 className="font-semibold mb-2 text-sm">Explore Further</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.nextQuestions.map((q: string, i: number) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchQuery(q);
                            handleAnalyze(q, selectedKPIs, selectedTimePeriod);
                          }}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                <div className={`p-4 rounded-xl bg-gradient-to-br ${module.gradient}`}>
                  <Icon className={`h-8 w-8 ${module.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{module.name}</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Select a question from the left panel or type your own to get AI-powered insights.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModuleClassicView;