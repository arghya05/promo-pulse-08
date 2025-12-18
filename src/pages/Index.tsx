import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, AlertTriangle, CheckCircle2, ChevronDown, User, MessageSquare, LayoutGrid, Calendar, Clock, Filter, SlidersHorizontal, RefreshCw, Zap, Target, Settings2, ArrowLeft, Home, Brain } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
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
import KPISelector from "@/components/KPISelector";
import ChatInterface from "@/components/ChatInterface";
import SearchSuggestions from "@/components/SearchSuggestions";
import CausalExplainability from "@/components/CausalExplainability";
import { getModuleById, getModulePersonas, getModuleQuestions, getModulePopularIds, getModuleEdgeFunction, Module } from "@/lib/data/module-config";

type Persona = 'executive' | 'consumables' | 'non_consumables';
type TimePeriod = 'last_month' | 'last_quarter' | 'last_year' | 'ytd' | 'custom';

const timePeriodConfig = {
  last_month: { label: 'Last Month', icon: Calendar, description: 'Past 30 days' },
  last_quarter: { label: 'Last Quarter', icon: Clock, description: 'Past 3 months' },
  last_year: { label: 'Last Year', icon: Calendar, description: 'Past 12 months' },
  ytd: { label: 'Year to Date', icon: TrendingUp, description: 'Jan 1 - Today' },
  custom: { label: 'Custom', icon: SlidersHorizontal, description: 'Select range' },
};

// Default persona config for promotion module
const defaultPersonaConfig = {
  executive: {
    label: 'Executive',
    description: 'Strategic insights across all categories',
    icon: '👔',
    categories: null as string[] | null,
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

interface IndexProps {
  moduleId?: string;
}

export default function Index({ moduleId = 'promotion' }: IndexProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get module configuration
  const module = useMemo(() => getModuleById(moduleId), [moduleId]);
  const personaConfig = useMemo(() => {
    const personas = getModulePersonas(moduleId);
    return personas as typeof defaultPersonaConfig;
  }, [moduleId]);
  const edgeFunctionName = useMemo(() => getModuleEdgeFunction(moduleId), [moduleId]);
  const moduleQuestions = useMemo(() => getModuleQuestions(moduleId), [moduleId]);
  const modulePopularIds = useMemo(() => getModulePopularIds(moduleId), [moduleId]);
  
  const isPromotion = moduleId === 'promotion';
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AnalyticsResult | null>(null);
  const [showRisksOnly, setShowRisksOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [drillDownData, setDrillDownData] = useState<{ name: string; roi: number; margin: number } | null>(null);
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const [persona, setPersona] = useState<Persona>('executive');
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Conversation history for context continuity
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    context?: {
      promotionMentioned?: string;
      categoryMentioned?: string;
      metricMentioned?: string;
    };
  }>>([]);
  
  // New state for improvements
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('last_quarter');
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [showRefinement, setShowRefinement] = useState(false);
  const [roiThreshold, setRoiThreshold] = useState([1.0]);
  const [liftThreshold, setLiftThreshold] = useState([15]);
  
  // Clarification state
  const [clarification, setClarification] = useState<{
    needsClarification: boolean;
    prompt: string;
    options: Array<{ label: string; description: string; refinedQuestion: string }>;
    originalQuestion: string;
  } | null>(null);
  
  const resultsRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

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

  const [cacheHit, setCacheHit] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  // Scroll to loading/results when question is asked
  useEffect(() => {
    if (isLoading && loadingRef.current) {
      loadingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isLoading]);

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const handleAsk = async (questionText?: string) => {
    const questionToAsk = questionText || query;
    if (!questionToAsk.trim()) return;
    
    if (questionText) {
      setQuery(questionText);
    }
    
    setIsLoading(true);
    setResult(null);
    setCacheHit(false);
    setResponseTime(null);
    setClarification(null); // Clear any previous clarification
    
    const startTime = Date.now();
    
    try {
      // Log what we're sending for debugging
      console.log('Sending question with KPIs:', { question: questionToAsk, selectedKPIs });
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${edgeFunctionName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            question: questionToAsk,
            persona: persona,
            categories: personaConfig[persona].categories,
            selectedKPIs: selectedKPIs.length > 0 ? selectedKPIs : null,
            timePeriod: timePeriod !== 'custom' ? timePeriod : null,
            moduleId: moduleId,
            // Pass conversation history for contextual follow-ups (e.g., "why did it work?")
            conversationHistory: conversationHistory.slice(-6),
          }),
        }
      );

      const elapsed = Date.now() - startTime;
      setResponseTime(elapsed);

      // Check cache header
      const cacheHeader = response.headers.get('X-Cache');
      setCacheHit(cacheHeader === 'HIT');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze question');
      }

      const analyticsResult = await response.json();
      
      // Check if clarification is needed
      if (analyticsResult.needsClarification) {
        setClarification({
          needsClarification: true,
          prompt: analyticsResult.clarificationPrompt,
          options: analyticsResult.options,
          originalQuestion: analyticsResult.originalQuestion
        });
        setIsLoading(false);
        return;
      }
      
      setResult(analyticsResult);
      
      if (cacheHeader === 'HIT') {
        toast({
          title: "Instant Answer",
          description: `Response from cache (${elapsed}ms)`,
          duration: 2000,
        });
      }
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

  // Callback for ChatInterface - Use EXACT same parameters as handleAsk for consistent responses
  const handleChatAsk = useCallback(async (questionText: string, kpis: string[]): Promise<AnalyticsResult | null> => {
    setQuery(questionText);
    setSelectedKPIs(kpis);
    setIsLoading(true);
    setCacheHit(false);
    setResponseTime(null);
    
    const startTime = Date.now();
    
    try {
      // Log what we're sending for debugging
      console.log('Chat sending question with KPIs:', { question: questionText, kpis });
      
      // Pass SAME parameters as handleAsk with conversation history for contextual follow-ups
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${edgeFunctionName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            question: questionText,
            persona: persona,
            categories: personaConfig[persona].categories,
            selectedKPIs: kpis.length > 0 ? kpis : null,
            timePeriod: timePeriod !== 'custom' ? timePeriod : null,
            moduleId: moduleId,
            // Pass conversation history for contextual follow-ups (e.g., "why did that campaign work?")
            conversationHistory: conversationHistory.slice(-6),
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
      
      // Check if clarification is needed
      if (analyticsResult.needsClarification) {
        setClarification({
          needsClarification: true,
          prompt: analyticsResult.clarificationPrompt,
          options: analyticsResult.options,
          originalQuestion: analyticsResult.originalQuestion
        });
        setIsLoading(false);
        return null;
      }
      
      setResult(analyticsResult);
      
      // Extract context from response and add to history
      const extractedContext = {
        promotionMentioned: analyticsResult.chartData?.[0]?.name || undefined,
        categoryMentioned: undefined as string | undefined,
        metricMentioned: undefined as string | undefined,
      };
      
      // Extract category from response
      const categories = ['Dairy', 'Beverages', 'Snacks', 'Produce', 'Frozen', 'Bakery', 'Pantry', 'Personal Care', 'Home Care'];
      const responseText = analyticsResult.whatHappened?.join(' ') || '';
      categories.forEach(cat => {
        if (responseText.toLowerCase().includes(cat.toLowerCase())) {
          extractedContext.categoryMentioned = cat;
        }
      });
      
      // Add both messages to history
      setConversationHistory(prev => [
        ...prev.slice(-8), // Keep last 8 messages
        {
          role: 'user' as const,
          content: questionText,
        },
        {
          role: 'assistant',
          content: analyticsResult.whatHappened?.join(' ') || '',
          context: extractedContext,
        }
      ]);
      
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
  }, [persona, toast]);

  const handleQuestionClick = async (question: string, questionId?: string) => {
    // Visual feedback - highlight selected question
    setSelectedQuestion(questionId || question);
    setQuery(question);
    
    // Add time period context to the question if selected
    const timeContext = timePeriod !== 'custom' ? ` (${timePeriodConfig[timePeriod].description})` : '';
    const questionWithContext = question.includes('last') ? question : question + timeContext;
    
    // Use current selectedKPIs - don't reset them
    await handleAsk(questionWithContext);
    
    // Clear selection after a delay
    setTimeout(() => setSelectedQuestion(null), 2000);
  };

  // Handle refinement - rerun with adjusted parameters
  const handleRefinement = async () => {
    if (!query) return;
    
    const refinedQuestion = `${query} (ROI threshold: ${roiThreshold[0]}x, Lift threshold: ${liftThreshold[0]}%)`;
    await handleAsk(refinedQuestion);
  };

  // Determine output section visibility based on question type
  const getOutputSections = () => {
    const questionLower = query.toLowerCase();
    const isForecasting = questionLower.includes('forecast') || questionLower.includes('predict') || questionLower.includes('future');
    const isComparison = questionLower.includes('compare') || questionLower.includes('vs') || questionLower.includes('versus');
    const isOptimization = questionLower.includes('optimal') || questionLower.includes('best') || questionLower.includes('improve');
    const isRisk = questionLower.includes('risk') || questionLower.includes('underperform') || questionLower.includes('lost money');
    
    return {
      showWhatHappened: true,
      showWhy: !isForecasting, // Hide "why" for forecasting - focus on predictions
      showRecommendation: true,
      showPredictions: isForecasting || isOptimization,
      showComparison: isComparison,
      showRiskAlert: isRisk && result?.kpis?.roi && result.kpis.roi < 1,
      sectionOrder: isForecasting 
        ? ['whatHappened', 'predictions', 'recommendation']
        : isRisk 
        ? ['riskAlert', 'whatHappened', 'why', 'recommendation']
        : ['whatHappened', 'why', 'recommendation'],
    };
  };

  // Module-specific persona questions
  const getModulePersonaQuestions = useMemo(() => {
    if (moduleId === 'executive') {
      return {
        executive: [
          { id: 'e1', question: "What is overall merchandising performance this quarter vs last year?", tag: "PERFORMANCE" },
          { id: 'e2', question: "What is our margin performance vs budget by category?", tag: "MARGIN" },
          { id: 'e3', question: "What are the top 10 categories by revenue contribution?", tag: "REVENUE" },
          { id: 'e4', question: "How does our pricing compare to key competitors across categories?", tag: "COMPETITIVE" },
          { id: 'e5', question: "What is the executive summary of merchandising health metrics?", tag: "HEALTH" },
          { id: 'e6', question: "What is the total inventory investment and days of supply?", tag: "INVENTORY" },
          { id: 'e7', question: "What is our overall supplier performance scorecard?", tag: "SUPPLIERS" },
          { id: 'e8', question: "What is the end-to-end P&L by category?", tag: "P&L" },
        ],
        consumables: [
          { id: 'c1', question: "What is consumables category performance vs plan?", tag: "PERFORMANCE" },
          { id: 'c2', question: "Which grocery categories are underperforming and why?", tag: "RISK" },
          { id: 'c3', question: "What is the gross margin trend for consumables this quarter?", tag: "MARGIN" },
          { id: 'c4', question: "How do promotion, pricing, and space ROI compare across grocery?", tag: "INTEGRATED" },
        ],
        non_consumables: [
          { id: 'n1', question: "What is non-consumables category performance vs plan?", tag: "PERFORMANCE" },
          { id: 'n2', question: "Which non-food categories need intervention?", tag: "RISK" },
          { id: 'n3', question: "Personal Care vs Home Care: which is driving growth?", tag: "COMPARISON" },
          { id: 'n4', question: "What is the supply chain risk exposure for non-consumables?", tag: "SUPPLY-RISK" },
        ],
      };
    } else if (moduleId === 'promotion') {
      return {
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
    } else if (moduleId === 'pricing') {
      return {
        executive: [
          { id: 'e1', question: "Executive pricing scorecard: margin performance across all categories?", tag: "SCORECARD" },
          { id: 'e2', question: "Competitive price positioning vs Walmart, Kroger, Target?", tag: "COMPETITIVE" },
          { id: 'e3', question: "Which categories have the highest margin improvement opportunity?", tag: "OPPORTUNITY" },
          { id: 'e4', question: "Price elasticity trends: where are we leaving money on the table?", tag: "ELASTICITY" },
        ],
        consumables: [
          { id: 'c1', question: "Optimal price points for Dairy products to maximize margin?", tag: "OPTIMIZATION" },
          { id: 'c2', question: "How does Beverages price elasticity vary by brand?", tag: "ELASTICITY" },
          { id: 'c3', question: "Which Snacks products can sustain a price increase?", tag: "PRICING-POWER" },
          { id: 'c4', question: "Produce markdown strategy: when to reduce prices?", tag: "MARKDOWN" },
        ],
        non_consumables: [
          { id: 'n1', question: "Personal Care pricing vs competitors: where to adjust?", tag: "COMPETITIVE" },
          { id: 'n2', question: "Home Care margin optimization opportunities?", tag: "MARGIN" },
          { id: 'n3', question: "Private label pricing gap analysis for non-consumables?", tag: "PRIVATE-LABEL" },
          { id: 'n4', question: "Which non-food products are most price sensitive?", tag: "SENSITIVITY" },
        ],
      };
    } else if (moduleId === 'assortment') {
      return {
        executive: [
          { id: 'e1', question: "Assortment scorecard: SKU productivity across categories?", tag: "SCORECARD" },
          { id: 'e2', question: "Which SKUs should be rationalized to improve efficiency?", tag: "RATIONALIZATION" },
          { id: 'e3', question: "Category gaps vs competition: where to expand assortment?", tag: "GAPS" },
          { id: 'e4', question: "Private label vs national brand performance comparison?", tag: "BRAND-MIX" },
        ],
        consumables: [
          { id: 'c1', question: "Bottom-performing Dairy SKUs to discontinue?", tag: "RATIONALIZATION" },
          { id: 'c2', question: "Beverages assortment gaps vs Kroger?", tag: "GAPS" },
          { id: 'c3', question: "Optimal brand mix for Snacks category?", tag: "BRAND-MIX" },
          { id: 'c4', question: "New product performance in Frozen category?", tag: "NEW-PRODUCTS" },
        ],
        non_consumables: [
          { id: 'n1', question: "Personal Care SKU productivity analysis?", tag: "PRODUCTIVITY" },
          { id: 'n2', question: "Home Care assortment depth by store cluster?", tag: "CLUSTERING" },
          { id: 'n3', question: "Which non-food brands are underperforming?", tag: "BRAND-ANALYSIS" },
          { id: 'n4', question: "Private label expansion opportunities in household?", tag: "PRIVATE-LABEL" },
        ],
      };
    } else if (moduleId === 'demand') {
      return {
        executive: [
          { id: 'e1', question: "Demand forecast accuracy scorecard by category?", tag: "ACCURACY" },
          { id: 'e2', question: "Which products are at highest stockout risk?", tag: "STOCKOUT" },
          { id: 'e3', question: "Inventory turnover trends across categories?", tag: "TURNOVER" },
          { id: 'e4', question: "Seasonal demand patterns: how to prepare for Q2?", tag: "SEASONAL" },
        ],
        consumables: [
          { id: 'c1', question: "Dairy demand forecast for next 4 weeks?", tag: "FORECAST" },
          { id: 'c2', question: "Beverages stockout risk assessment?", tag: "STOCKOUT" },
          { id: 'c3', question: "Optimal safety stock for Snacks?", tag: "SAFETY-STOCK" },
          { id: 'c4', question: "Produce spoilage and demand forecasting?", tag: "PERISHABLE" },
        ],
        non_consumables: [
          { id: 'n1', question: "Personal Care demand forecast accuracy?", tag: "ACCURACY" },
          { id: 'n2', question: "Home Care reorder point optimization?", tag: "REORDER" },
          { id: 'n3', question: "Non-food seasonal demand patterns?", tag: "SEASONAL" },
          { id: 'n4', question: "Inventory turnover improvement opportunities?", tag: "TURNOVER" },
        ],
      };
    } else if (moduleId === 'supply-chain') {
      return {
        executive: [
          { id: 'e1', question: "Supply chain performance scorecard?", tag: "SCORECARD" },
          { id: 'e2', question: "Supplier on-time delivery rankings?", tag: "SUPPLIERS" },
          { id: 'e3', question: "Logistics cost breakdown and optimization?", tag: "COSTS" },
          { id: 'e4', question: "Warehouse capacity utilization trends?", tag: "CAPACITY" },
        ],
        consumables: [
          { id: 'c1', question: "Dairy supplier performance and lead times?", tag: "SUPPLIERS" },
          { id: 'c2', question: "Beverages distribution route efficiency?", tag: "DISTRIBUTION" },
          { id: 'c3', question: "Cold chain logistics for frozen products?", tag: "COLD-CHAIN" },
          { id: 'c4', question: "Produce freshness and supplier reliability?", tag: "FRESHNESS" },
        ],
        non_consumables: [
          { id: 'n1', question: "Non-food supplier lead time analysis?", tag: "LEAD-TIME" },
          { id: 'n2', question: "Home Care warehouse allocation?", tag: "WAREHOUSE" },
          { id: 'n3', question: "Personal Care import logistics costs?", tag: "IMPORTS" },
          { id: 'n4', question: "Bulk product transportation optimization?", tag: "TRANSPORT" },
        ],
      };
    } else if (moduleId === 'space') {
      return {
        executive: [
          { id: 'e1', question: "Sales per square foot performance by category?", tag: "SALES-SQFT" },
          { id: 'e2', question: "Planogram compliance impact on sales?", tag: "COMPLIANCE" },
          { id: 'e3', question: "Store layout conversion rate analysis?", tag: "CONVERSION" },
          { id: 'e4', question: "Endcap display effectiveness ranking?", tag: "ENDCAPS" },
        ],
        consumables: [
          { id: 'c1', question: "Dairy shelf space allocation optimization?", tag: "ALLOCATION" },
          { id: 'c2', question: "Beverages facing count analysis?", tag: "FACINGS" },
          { id: 'c3', question: "Snacks category adjacency for cross-sell?", tag: "ADJACENCY" },
          { id: 'c4', question: "Frozen section GMROI by position?", tag: "GMROI" },
        ],
        non_consumables: [
          { id: 'n1', question: "Personal Care planogram optimization?", tag: "PLANOGRAM" },
          { id: 'n2', question: "Home Care shelf productivity?", tag: "PRODUCTIVITY" },
          { id: 'n3', question: "Non-food endcap rotation strategy?", tag: "ROTATION" },
          { id: 'n4', question: "Visual merchandising impact on sales?", tag: "VISUAL" },
        ],
      };
    }
    // Default fallback
    return {
      executive: [],
      consumables: [],
      non_consumables: [],
    };
  }, [moduleId]);

  const currentQuestions = getModulePersonaQuestions[persona] || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  {module?.name || 'Promotion Intelligence'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {module?.description || 'AI-powered promotion analysis and ROI intelligence'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat Assistant
            </TabsTrigger>
            <TabsTrigger value="classic" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Classic View
            </TabsTrigger>
            <TabsTrigger value="causal" className="gap-2">
              <Brain className="h-4 w-4" />
              Causal AI
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
            </div>

            {/* Chat Interface */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8">
                <ChatInterface
                  persona={persona}
                  personaConfig={personaConfig[persona]}
                  onAsk={handleChatAsk}
                  isLoading={isLoading}
                  currentResult={result}
                  moduleName={module?.name || 'Promotion Intelligence'}
                  moduleId={moduleId}
                />
              </div>
              
              {/* Results Panel */}
              <div className="col-span-4 space-y-4">
                {result ? (
                  <>
                    {/* Quick KPIs */}
                    <Card className="p-4">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Key Metrics</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground mb-0.5">ROI</div>
                          <div className={`text-xl font-bold ${getKPIStatus("roi", Number(result.kpis?.roi) || 0) === "good" ? "text-status-good" : getKPIStatus("roi", Number(result.kpis?.roi) || 0) === "warning" ? "text-status-warning" : "text-status-bad"}`}>
                            {(Number(result.kpis?.roi) || 0).toFixed(2)}x
                          </div>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground mb-0.5">Lift</div>
                          <div className={`text-xl font-bold ${getKPIStatus("liftPct", Number(result.kpis?.liftPct) || 0) === "good" ? "text-status-good" : "text-status-warning"}`}>
                            {(Number(result.kpis?.liftPct) || 0).toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground mb-0.5">Margin</div>
                          <div className="text-xl font-bold text-foreground">
                            {formatKPIValue(Number(result.kpis?.incrementalMargin) || 0)}
                          </div>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground mb-0.5">Spend</div>
                          <div className="text-xl font-bold text-foreground">
                            {formatKPIValue(Number(result.kpis?.spend) || 0)}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Mini Chart */}
                    {result.chartData && result.chartData.length > 0 && (
                      <Card className="p-4">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Quick View</h3>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={result.chartData.slice(0, 5)} layout="vertical">
                              <XAxis type="number" hide />
                              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                              <Tooltip />
                              <Bar 
                                dataKey={Object.keys(result.chartData[0]).find(k => k !== 'name' && typeof result.chartData[0][k] === 'number') || 'value'} 
                                fill="hsl(var(--primary))" 
                                radius={[0, 4, 4, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    )}
                  </>
                ) : (
                  /* Suggested Questions Panel */
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Popular Questions</h3>
                    <div className="space-y-2">
                      {currentQuestions.slice(0, 5).map(q => (
                        <button
                          key={q.id}
                          onClick={() => handleQuestionClick(q.question)}
                          className="w-full text-left text-sm p-2.5 rounded-md hover:bg-accent transition-colors border border-transparent hover:border-border"
                        >
                          <Badge variant="outline" className="text-[10px] mb-1">{q.tag}</Badge>
                          <p className="text-xs text-muted-foreground line-clamp-2">{q.question}</p>
                        </button>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Classic View Tab */}
          <TabsContent value="classic">
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
            </div>

            {/* Classic Mode Content */}
                <div className="mb-8 space-y-6">
                  {/* Search Bar */}
                  <Card className="p-2 bg-card border-border shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70 z-10" />
                        <Input
                          value={query}
                          onChange={(e) => {
                            setQuery(e.target.value);
                            setShowSuggestions(e.target.value.length >= 2);
                          }}
                          onFocus={() => setShowSuggestions(query.length >= 2)}
                          onBlur={() => {
                            // Delay hiding to allow click on suggestion
                            setTimeout(() => setShowSuggestions(false), 200);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setShowSuggestions(false);
                              handleAsk();
                            }
                            if (e.key === "Escape") {
                              setShowSuggestions(false);
                            }
                          }}
                          placeholder={
                            persona === 'executive' 
                              ? "Ask strategic questions about overall portfolio, cross-category trends..."
                              : persona === 'consumables'
                              ? "Ask about grocery ROI, dairy promotions, beverage trends..."
                              : "Ask about personal care ROI, home care promotions, soap trends..."
                          }
                          className="pl-12 pr-4 h-12 text-base bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                        />
                        
                        {/* AI-powered search suggestions */}
                        <SearchSuggestions
                          query={query}
                          persona={persona}
                          moduleId={moduleId}
                          isVisible={showSuggestions && !isLoading}
                          onSelect={(suggestion) => {
                            setQuery(suggestion);
                            setShowSuggestions(false);
                            handleAsk(suggestion);
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 pr-1">
                        <VoiceRecorder 
                          onTranscript={(text) => {
                            setQuery(text);
                            setShowSuggestions(false);
                            handleAsk(text);
                          }}
                          disabled={isLoading}
                        />
                        <Button 
                          onClick={() => {
                            setShowSuggestions(false);
                            handleAsk();
                          }}
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

                  {/* Ambiguous Term Quick Options */}
                  {(() => {
                    const q = query.toLowerCase();
                    const hasEntityContext = /\b(product|sku|vendor|supplier|store|brand|category)\b/i.test(q);
                    
                    // Define ambiguous terms and their options
                    const ambiguousOptions: { term: RegExp; label: string; options: { label: string; replacement: string }[] }[] = [
                      { 
                        term: /sell[ea]?[r]+s?|sel+ers?/i, 
                        label: 'seller',
                        options: [
                          { label: '📦 Products', replacement: 'selling product' },
                          { label: '🏭 Vendors', replacement: 'vendor by sales' },
                          { label: '🏪 Stores', replacement: 'store by sales' }
                        ]
                      },
                      { 
                        term: /\bmoving\b/i,
                        label: 'moving',
                        options: [
                          { label: '📦 Products', replacement: 'selling product' },
                          { label: '📁 Categories', replacement: 'performing category' }
                        ]
                      },
                      { 
                        term: /\bmover\b/i,
                        label: 'mover',
                        options: [
                          { label: '📦 Products', replacement: 'selling product' },
                          { label: '📁 Categories', replacement: 'performing category' }
                        ]
                      }
                    ];
                    
                    const matchedTerm = ambiguousOptions.find(a => a.term.test(q) && !hasEntityContext);
                    
                    if (!matchedTerm || !query.trim()) return null;
                    
                    return (
                      <div className="flex items-center gap-2 flex-wrap bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3">
                        <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                          "{matchedTerm.label}" could mean:
                        </span>
                        {matchedTerm.options.map((opt, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                            onClick={() => {
                              const newQuery = query.replace(matchedTerm.term, opt.replacement);
                              setQuery(newQuery);
                              handleAsk(newQuery);
                            }}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    );
                  })()}

                  {/* KPI Selector */}
                  <KPISelector
                    question={query}
                    selectedKPIs={selectedKPIs}
                    onKPIsChange={setSelectedKPIs}
                    isLoading={isLoading}
                    moduleId={moduleId}
                  />

                  {/* Time Period Filters */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Time Period:
                    </span>
                    {(Object.entries(timePeriodConfig) as [TimePeriod, typeof timePeriodConfig.last_month][]).slice(0, -1).map(([key, config]) => (
                      <Button
                        key={key}
                        variant={timePeriod === key ? "default" : "outline"}
                        size="sm"
                        className={`gap-1.5 h-8 ${timePeriod === key ? '' : 'hover:bg-primary/10 hover:text-primary hover:border-primary/30'}`}
                        onClick={() => setTimePeriod(key)}
                      >
                        <config.icon className="h-3.5 w-3.5" />
                        {config.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Loading Indicator with scroll anchor */}
                {isLoading && (
                  <div ref={loadingRef} className="flex items-center justify-center py-12">
                    <Card className="p-6 flex items-center gap-4 bg-primary/5 border-primary/20">
                      <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                      <div>
                        <p className="font-semibold text-foreground">Analyzing your question...</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedQuestion ? `"${selectedQuestion.substring(0, 50)}..."` : 'Processing data'}
                        </p>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Clarification Options */}
                {clarification && clarification.options && !isLoading && (
                  <Card className="p-6 bg-card border-primary/30">
                    <h3 className="font-semibold text-foreground mb-4">{clarification.prompt}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {clarification.options.map((option, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          className="h-auto p-4 flex flex-col items-start text-left hover:bg-primary/10 hover:border-primary"
                          onClick={() => {
                            setClarification(null);
                            handleAsk(option.refinedQuestion);
                          }}
                        >
                          <span className="font-semibold text-foreground">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </Button>
                      ))}
                    </div>
                  </Card>
                )}

                {result ? (
              /* Answer View */
              <div ref={resultsRef} className="grid grid-cols-12 gap-8">
                {/* Main Content */}
                <div className="col-span-8 space-y-6">
                  {/* Cache/Response Status & Refinement Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {responseTime !== null && (
                        <>
                          {cacheHit ? (
                            <Badge variant="secondary" className="bg-status-good/10 text-status-good border-0">
                              ⚡ Cached ({responseTime}ms)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Analyzed ({(responseTime / 1000).toFixed(1)}s)
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setShowRefinement(!showRefinement)}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Refine Analysis
                    </Button>
                  </div>

                  {/* Refinement Panel */}
                  {showRefinement && (
                    <Card className="p-4 bg-secondary/30 border-primary/20">
                      <div className="flex items-center gap-2 mb-4">
                        <Settings2 className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">Fine-tune your analysis</span>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">ROI Threshold: {roiThreshold[0]}x</label>
                          <Slider
                            value={roiThreshold}
                            onValueChange={setRoiThreshold}
                            min={0.5}
                            max={3}
                            step={0.1}
                            className="w-full"
                          />
                          <p className="text-xs text-muted-foreground">Show promotions with ROI above this value</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">Lift Threshold: {liftThreshold[0]}%</label>
                          <Slider
                            value={liftThreshold}
                            onValueChange={setLiftThreshold}
                            min={5}
                            max={50}
                            step={5}
                            className="w-full"
                          />
                          <p className="text-xs text-muted-foreground">Focus on promotions with lift above this %</p>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4 gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowRefinement(false)}>Cancel</Button>
                        <Button size="sm" className="gap-1" onClick={handleRefinement}>
                          <RefreshCw className="h-3.5 w-3.5" />
                          Re-analyze
                        </Button>
                      </div>
                    </Card>
                  )}
                  
                  {/* What Happened Section - Collapsible */}
                  <Collapsible defaultOpen>
                    <Card className="p-6">
                      <CollapsibleTrigger className="w-full flex items-center justify-between group">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                          WHAT HAPPENED
                        </h2>
                        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-4">
                        <div className="space-y-4">
                          {(result.whatHappened || []).map((point, idx) => (
                            <div key={idx} className="flex gap-3">
                              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                              <p className="text-base leading-relaxed text-foreground" dangerouslySetInnerHTML={{ __html: point }} />
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  {/* Why It Happened Section - Collapsible */}
                  <Collapsible defaultOpen>
                    <Card className="p-6">
                      <CollapsibleTrigger className="w-full flex items-center justify-between group">
                        <h2 className="text-lg font-bold">WHY IT HAPPENED</h2>
                        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-4">
                        <div className="space-y-4">
                          {(result.why || []).map((point, idx) => (
                            <div key={idx} className="flex gap-3">
                              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-chart-3 flex-shrink-0" />
                              <p className="text-base leading-relaxed text-foreground" dangerouslySetInnerHTML={{ __html: point }} />
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  {/* Recommendation Section - Collapsible */}
                  <Collapsible defaultOpen>
                    <Card className="p-6">
                      <CollapsibleTrigger className="w-full flex items-center justify-between group">
                        <h2 className="text-lg font-bold">RECOMMENDATION</h2>
                        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-4">
                        <div className="space-y-4">
                          {(result.whatToDo || []).map((point, idx) => (
                            <div key={idx} className="flex gap-3">
                              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-status-good flex-shrink-0" />
                              <p className="text-base leading-relaxed text-foreground" dangerouslySetInnerHTML={{ __html: point }} />
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

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
                
                {/* Selected KPIs Display - Show when user selected specific KPIs */}
                {result.selectedKpiValues && Object.keys(result.selectedKpiValues).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Your Selected KPIs</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(result.selectedKpiValues).map(([kpiId, kpiData]) => (
                        <div key={kpiId} className="bg-primary/10 border border-primary/20 rounded-lg p-4 overflow-hidden">
                          <div className="text-xs text-primary mb-1 uppercase tracking-wide font-medium">{kpiId.replace(/_/g, ' ')}</div>
                          <div className="text-xl sm:text-2xl font-bold text-primary tabular-nums truncate">
                            {kpiData.formatted || kpiData.value}
                          </div>
                          {kpiData.trend && (
                            <div className={`text-xs mt-1 ${kpiData.trend.startsWith('+') ? 'text-status-good' : kpiData.trend.startsWith('-') ? 'text-status-bad' : 'text-muted-foreground'}`}>
                              {kpiData.trend}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Standard KPI Pills */}
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
              {result.nextQuestions && result.nextQuestions.length > 0 && (
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
              )}

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
                      onClick={() => handleQuestionClick(q.question, q.id)}
                      className={`w-full text-left text-sm p-3 rounded-md transition-all border ${
                        selectedQuestion === q.id 
                          ? 'bg-primary/20 border-primary text-primary ring-2 ring-primary/30' 
                          : 'border-transparent hover:bg-accent hover:border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {selectedQuestion === q.id && <Zap className="h-3.5 w-3.5 animate-pulse" />}
                        <span>{q.question}</span>
                      </div>
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
              <h2 className="text-4xl font-bold mb-4">Welcome to {getModuleById(moduleId)?.name || 'Merchandising AI'}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {moduleId === 'promotion' && "Ask me anything about promotion ROI, price optimization, halo effects, vendor funding, coupon performance, or category analysis. I'll analyze the data and provide actionable insights with supporting documentation."}
                {moduleId === 'pricing' && "Ask me anything about price elasticity, competitive pricing, markdown optimization, price change impact, or margin analysis. I'll analyze pricing data and provide strategic recommendations."}
                {moduleId === 'assortment' && "Ask me anything about SKU rationalization, category performance, brand analysis, product velocity, or assortment efficiency. I'll help optimize your product mix for maximum profitability."}
                {moduleId === 'demand' && "Ask me anything about demand forecasting, inventory optimization, stockout prevention, seasonal trends, or forecast accuracy. I'll help you predict and plan for future demand."}
                {moduleId === 'supply-chain' && "Ask me anything about supplier performance, lead times, logistics costs, delivery reliability, or order fulfillment. I'll analyze your supply chain and identify optimization opportunities."}
                {moduleId === 'space' && "Ask me anything about planogram optimization, shelf allocation, space productivity, fixture utilization, or category space share. I'll help maximize your retail space ROI."}
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
                    className={`p-5 cursor-pointer transition-all ${
                      selectedQuestion === q.id 
                        ? 'shadow-lg border-primary bg-primary/5 ring-2 ring-primary/30' 
                        : 'hover:shadow-lg hover:border-primary/50'
                    }`}
                    onClick={() => handleQuestionClick(q.question, q.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${selectedQuestion === q.id ? 'bg-primary/20' : 'bg-primary/10'}`}>
                        {selectedQuestion === q.id ? (
                          <Zap className="h-5 w-5 text-primary animate-pulse" />
                        ) : (
                          <TrendingUp className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          {q.tag}
                          {selectedQuestion === q.id && (
                            <Badge variant="secondary" className="text-[10px] bg-primary/20 text-primary">
                              Analyzing...
                            </Badge>
                          )}
                        </h4>
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

          <TabsContent value="causal">
            <CausalExplainability moduleId={moduleId} moduleName={module?.name} />
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
