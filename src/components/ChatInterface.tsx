import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Sparkles, ArrowRight, Lightbulb, TrendingUp, TrendingDown, AlertTriangle, HelpCircle, Target, Compass, ChevronRight, ChevronDown, Zap, BarChart3, PieChart as PieChartIcon, Clock, Filter, ThumbsUp, ThumbsDown, RefreshCw, MessageSquare, Loader2, X, DollarSign, Package, Truck, Box, Grid3X3, Crown, Brain } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import UniversalScrollableText from "@/components/UniversalScrollableText";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import VoiceRecorder from "./VoiceRecorder";
import KPISelector from "./KPISelector";
import DrillBreadcrumbs from "./DrillBreadcrumbs";
import ConversationContextPanel from "./ConversationContextPanel";
import CrossModuleNavigator from "./CrossModuleNavigator";
import FormattedInsight from "./FormattedInsight";
import { useToast } from "@/hooks/use-toast";
import type { AnalyticsResult } from "@/lib/analytics";
import { getSuggestedKPIs, KPI } from "@/lib/data/kpi-library";
import { useGlobalSession, detectTargetModule } from "@/contexts/GlobalSessionContext";

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

// Session insight for summary
interface SessionInsight {
  id: string;
  question: string;
  keyFinding: string;
  timestamp: Date;
}

// Collapsible Section Component - Reusable
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

const CollapsibleSection = ({ 
  title, 
  icon, 
  badge, 
  isOpen, 
  onToggle, 
  children, 
  className = "" 
}: CollapsibleSectionProps) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className={className}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full text-left">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-xs font-medium text-foreground">{title}</span>
            {badge && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{badge}</Badge>}
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

// Collapsible KPI Exploration Section Component
const CollapsibleKPISection = ({ 
  kpis, 
  originalQuestion, 
  onKPIClick, 
  isLoading,
  isOpen,
  onToggle
}: { 
  kpis: KPI[]; 
  originalQuestion?: string; 
  onKPIClick: (kpiLabel: string) => void; 
  isLoading: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  return (
    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
      <CollapsibleSection
        title="Explore Different KPIs"
        icon={<Sparkles className="h-4 w-4 text-primary" />}
        badge="AI-Powered"
        isOpen={isOpen}
        onToggle={onToggle}
      >
        <div className="flex flex-wrap gap-1.5">
          {kpis.map((kpi) => (
            <Button
              key={kpi.id}
              variant="outline"
              size="sm"
              className="text-[11px] h-7 px-2.5 bg-primary text-primary-foreground hover:bg-primary/90 border-primary gap-1"
              onClick={() => onKPIClick(kpi.label)}
              disabled={isLoading}
              title={kpi.description}
            >
              <TrendingUp className="h-3 w-3" />
              {kpi.name}
            </Button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Click a KPI to see the same analysis from a different metric perspective
        </p>
      </CollapsibleSection>
    </div>
  );
};

// Collapsed sections state per message
interface CollapsedSections {
  kpi: boolean;
  timePeriod: boolean;
  fineTune: boolean;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'suggestion' | 'guide';
  content: string;
  timestamp: Date;
  analyticsResult?: AnalyticsResult;
  suggestions?: string[];
  guideTip?: string;
  actionButtons?: { label: string; question: string; icon: string }[];
  feedback?: 'positive' | 'negative' | null;
  isError?: boolean;
  needsClarification?: boolean;
  clarificationOptions?: string[];
  kpiExploration?: KPI[];
  originalQuestion?: string;
}

// Conversation context for memory
interface ConversationContext {
  lastCategory?: string;
  lastMetric?: string;
  lastTimePeriod?: string;
  lastPromotion?: string;
  recentTopics: string[];
  drillPath: string[];
  currentDrillLevel: number;
}

interface ChatInterfaceProps {
  persona: string;
  personaConfig: {
    label: string;
    description: string;
    icon: string;
    categories: string[] | null;
  };
  onAsk: (question: string, selectedKPIs: string[]) => Promise<AnalyticsResult | null>;
  isLoading: boolean;
  currentResult: AnalyticsResult | null;
  moduleName?: string;
  moduleId?: string;
}

// Module-specific content - COMPLETELY UNIQUE per module
const moduleContent: Record<string, {
  greetings: string[];
  quickStarts: Array<{ text: string; icon: any; tag: string; color: string }>;
  exploration: Array<{ text: string; icon: any; tag: string }>;
  tips: string[];
  placeholder: string;
}> = {
  executive: {
    greetings: [
      "Welcome to Executive Insights! I provide 360-degree strategic visibility across all merchandising functions - pricing, promotions, demand, supply chain, and space planning.",
      "Hello! Ready to deliver enterprise-wide insights on revenue, margins, competitive position, and operational performance.",
      "Hi! I analyze cross-functional business health from enterprise to SKU level with full drill-down capability.",
    ],
    quickStarts: [
      { text: "What is overall merchandising performance this quarter vs last year?", icon: TrendingUp, tag: "PERFORMANCE", color: "text-primary" },
      { text: "What is our margin performance vs budget by category?", icon: DollarSign, tag: "MARGIN", color: "text-status-good" },
      { text: "What are the top 10 categories by revenue contribution?", icon: BarChart3, tag: "REVENUE", color: "text-status-good" },
      { text: "Executive summary of merchandising health metrics", icon: Target, tag: "HEALTH", color: "text-status-warning" },
    ],
    exploration: [
      { text: "Competitive position vs key competitors", icon: Target, tag: "COMPETITIVE" },
      { text: "Supply chain risk exposure", icon: Truck, tag: "SUPPLY-RISK" },
      { text: "End-to-end P&L by category", icon: DollarSign, tag: "P&L" },
    ],
    tips: [
      "👑 Ask me about revenue, margins, EBITDA, ROA, working capital, or any financial KPI",
      "📊 I analyze cross-functional performance from enterprise → region → store → category → SKU",
      "🎯 I simulate strategic scenarios and assess business-wide impacts",
    ],
    placeholder: "Ask strategic questions: revenue, margins, competitive position, business health...",
  },
  promotion: {
    greetings: [
      "Hello! Let's explore your promotion performance - ROI trends, category comparisons, and growth opportunities await.",
      "Welcome! Ready to analyze promotional ROI, lift metrics, and optimization opportunities.",
      "Hi! I can help you understand promotion effectiveness across all categories.",
    ],
    quickStarts: [
      { text: "Top promotions by ROI this month", icon: TrendingUp, tag: "WINNERS", color: "text-primary" },
      { text: "Which promotions are losing money?", icon: AlertTriangle, tag: "RISK", color: "text-status-bad" },
      { text: "Compare Dairy vs Beverages ROI", icon: BarChart3, tag: "COMPARE", color: "text-status-good" },
      { text: "Optimal discount depth for Snacks", icon: Target, tag: "OPTIMIZE", color: "text-status-warning" },
    ],
    exploration: [
      { text: "Regional performance gaps", icon: BarChart3, tag: "REGIONS" },
      { text: "YoY promotion trend analysis", icon: TrendingUp, tag: "TRENDS" },
      { text: "Budget allocation recommendations", icon: Compass, tag: "OPTIMIZE" },
    ],
    tips: [
      "💡 Ask me about promotion ROI, lift, and margin impact across categories",
      "📊 I can compare promotion mechanics like BOGO, price-off, and coupons",
      "🎯 I can help identify which promotions are winners or losers",
    ],
    placeholder: "Ask about promotions, ROI, lift, margins...",
  },
  pricing: {
    greetings: [
      "Welcome! Let's optimize your pricing strategy - I can analyze margins, price elasticity, and competitive positioning.",
      "Hello! Ready to help with price optimization, competitive analysis, and margin opportunities.",
      "Hi! I can analyze optimal price points, elasticity, and competitive gaps.",
    ],
    quickStarts: [
      { text: "What's the optimal price for top sellers?", icon: Target, tag: "OPTIMIZE", color: "text-primary" },
      { text: "Price elasticity by category", icon: TrendingUp, tag: "ELASTICITY", color: "text-status-good" },
      { text: "Competitive positioning vs Walmart", icon: BarChart3, tag: "COMPARE", color: "text-status-warning" },
      { text: "Which products have highest margin?", icon: DollarSign, tag: "MARGIN", color: "text-status-good" },
    ],
    exploration: [
      { text: "Price gap vs Kroger", icon: BarChart3, tag: "COMPETITIVE" },
      { text: "Markdown strategy optimization", icon: Target, tag: "MARKDOWN" },
      { text: "Private label pricing analysis", icon: Package, tag: "PRIVATE-LABEL" },
    ],
    tips: [
      "💡 Ask me about price elasticity, competitive gaps, and margin optimization",
      "💰 I can analyze how price changes impact volume and revenue",
      "📊 I track competitor pricing from Walmart, Kroger, and Target",
    ],
    placeholder: "Ask about pricing, margins, elasticity, competitors...",
  },
  "supply-chain": {
    greetings: [
      "Welcome! Let's optimize your supply chain - I can analyze supplier performance, lead times, and logistics efficiency.",
      "Hello! Ready to help with supplier management, route optimization, and delivery performance.",
      "Hi! I can analyze supply chain metrics, warehouse utilization, and transportation costs.",
    ],
    quickStarts: [
      { text: "Which suppliers have best on-time delivery?", icon: Truck, tag: "DELIVERY", color: "text-primary" },
      { text: "Average lead time by product category", icon: Clock, tag: "LEAD-TIME", color: "text-status-warning" },
      { text: "How can we optimize distribution routes?", icon: Compass, tag: "OPTIMIZE", color: "text-status-good" },
      { text: "Logistics cost breakdown analysis", icon: DollarSign, tag: "COST", color: "text-status-bad" },
    ],
    exploration: [
      { text: "Supplier reliability scores", icon: Target, tag: "RELIABILITY" },
      { text: "Warehouse capacity utilization", icon: Box, tag: "WAREHOUSE" },
      { text: "Perfect order rate by region", icon: BarChart3, tag: "METRICS" },
    ],
    tips: [
      "💡 Ask me about supplier performance, delivery rates, and logistics costs",
      "🚚 I can analyze routes, lead times, and transportation efficiency",
      "📦 I track supplier orders, warehouse utilization, and fill rates",
    ],
    placeholder: "Ask about suppliers, lead times, logistics, routes...",
  },
  demand: {
    greetings: [
      "Welcome! Let's optimize your demand forecasting - I can analyze predictions, accuracy, and inventory levels.",
      "Hello! Ready to help with demand planning, stockout prevention, and seasonal patterns.",
      "Hi! I can analyze forecast accuracy, reorder points, and demand variability.",
    ],
    quickStarts: [
      { text: "Demand forecast for next 4 weeks", icon: Clock, tag: "FORECAST", color: "text-primary" },
      { text: "Which products are at stockout risk?", icon: AlertTriangle, tag: "RISK", color: "text-status-bad" },
      { text: "Forecast accuracy by category", icon: Target, tag: "ACCURACY", color: "text-status-good" },
      { text: "Seasonal demand patterns analysis", icon: TrendingUp, tag: "SEASONAL", color: "text-status-warning" },
    ],
    exploration: [
      { text: "Inventory turnover by store", icon: Box, tag: "TURNOVER" },
      { text: "Safety stock optimization", icon: Target, tag: "SAFETY-STOCK" },
      { text: "Promotion impact on demand", icon: BarChart3, tag: "PROMO-IMPACT" },
    ],
    tips: [
      "💡 Ask me about demand forecasts, stockout risks, and inventory levels",
      "📊 I can analyze forecast accuracy and identify areas for improvement",
      "🔮 I track seasonal patterns and predict future demand",
    ],
    placeholder: "Ask about forecasts, inventory, stockouts, seasonality...",
  },
  assortment: {
    greetings: [
      "Welcome! Let's optimize your product assortment - I can analyze SKU performance and category gaps.",
      "Hello! Ready to help with assortment planning, SKU rationalization, and brand mix optimization.",
      "Hi! I can analyze which products to add, discontinue, or expand in your assortment.",
    ],
    quickStarts: [
      { text: "Which SKUs should be added to assortment?", icon: Package, tag: "EXPAND", color: "text-status-good" },
      { text: "Bottom-performing SKUs to discontinue", icon: AlertTriangle, tag: "RATIONALIZE", color: "text-status-bad" },
      { text: "Category penetration by store type", icon: BarChart3, tag: "PENETRATION", color: "text-primary" },
      { text: "Optimal brand mix by category", icon: Target, tag: "BRAND-MIX", color: "text-status-warning" },
    ],
    exploration: [
      { text: "New product performance analysis", icon: TrendingUp, tag: "NEW-PRODUCTS" },
      { text: "Private label opportunity by category", icon: DollarSign, tag: "PRIVATE-LABEL" },
      { text: "Regional assortment preferences", icon: Compass, tag: "REGIONAL" },
    ],
    tips: [
      "💡 Ask me about SKU productivity, category gaps, and brand mix",
      "📦 I can identify products to add, discontinue, or expand",
      "📊 I track assortment depth and category penetration by store",
    ],
    placeholder: "Ask about SKUs, categories, brands, assortment depth...",
  },
  space: {
    greetings: [
      "Welcome! Let's optimize your space planning - I can analyze shelf allocation and planogram performance.",
      "Hello! Ready to help with fixture utilization, product placement, and GMROI optimization.",
      "Hi! I can analyze sales per square foot and optimal product positioning.",
    ],
    quickStarts: [
      { text: "Categories with highest sales per sqft", icon: DollarSign, tag: "SALES", color: "text-status-good" },
      { text: "Planogram compliance rate analysis", icon: Target, tag: "COMPLIANCE", color: "text-primary" },
      { text: "Optimal shelf space allocation", icon: Grid3X3, tag: "ALLOCATE", color: "text-status-warning" },
      { text: "Endcap display performance", icon: TrendingUp, tag: "ENDCAP", color: "text-status-good" },
    ],
    exploration: [
      { text: "Eye-level product performance", icon: Target, tag: "EYE-LEVEL" },
      { text: "Cross-selling adjacency analysis", icon: Package, tag: "ADJACENCY" },
      { text: "Fixture utilization rates", icon: Box, tag: "FIXTURES" },
    ],
    tips: [
      "💡 Ask me about shelf space allocation, planogram compliance, and GMROI",
      "📏 I can analyze sales per square foot and optimal facings",
      "📊 I track fixture performance and product adjacency impact",
    ],
    placeholder: "Ask about shelf space, planograms, layouts, fixtures...",
  },
};

// Persona variations per module - combines module + persona
const getModulePersonaContent = (moduleId: string, persona: string) => {
  const module = moduleContent[moduleId] || moduleContent.promotion;
  
  // Add persona-specific variations
  const personaPrefix = persona === 'executive' ? 'Executive view: ' : 
                        persona === 'consumables' ? 'Consumables focus: ' : 
                        'Non-consumables focus: ';
  
  const tips = [...module.tips];
  if (persona === 'executive') {
    tips.push("🎯 As an executive, I provide strategic insights across all categories");
  } else if (persona === 'consumables') {
    tips.push("🥛 I focus on consumables: Dairy, Beverages, Snacks, Produce, Frozen, Bakery, Pantry");
  } else {
    tips.push("🧴 I focus on non-consumables: Personal Care, Home Care, Household");
  }
  
  return {
    ...module,
    tips,
  };
};

const getPersonaKey = (persona: string): string => {
  if (persona === 'executive') return 'executive';
  if (persona === 'consumables' || persona === 'category-consumables') return 'consumables';
  return 'non_consumables';
};

const contextualPrompts = {
  afterAnswer: [
    "Tell me more about the top performer",
    "Why is this happening?",
    "What should I do next?",
    "Compare this to other categories",
  ],
  timeFilters: [
    { text: "Last month", filter: "last month" },
    { text: "Last quarter", filter: "last 3 months" },
    { text: "Last year", filter: "last 12 months" },
    { text: "Year to date", filter: "year to date" },
  ],
  followUp: {
    roi: [
      "Which category has the best ROI?",
      "What's driving ROI performance?",
      "How can we improve low ROI promotions?",
      "Show me ROI trends over time",
    ],
    risk: [
      "What's causing these losses?",
      "How can we recover from these?",
      "Should we cancel underperformers?",
      "Which regions have the most risk?",
    ],
    forecast: [
      "What assumptions drive this forecast?",
      "Show me different scenarios",
      "What could change these predictions?",
      "How accurate have past forecasts been?",
    ],
    success: [
      "Can we replicate this success elsewhere?",
      "What made this promotion work?",
      "How do we scale this approach?",
      "Which products should we promote next?",
    ],
  },
  refinements: [
    { text: "Focus on high ROI (>1.5x)", filter: "with ROI above 1.5" },
    { text: "Show only risks (ROI<1)", filter: "with ROI below 1" },
    { text: "Top performers only", filter: "top 5 performers" },
    { text: "Include forecasts", filter: "with forecast" },
  ],
  needHelp: [
    { text: "What can I ask you?", icon: HelpCircle },
    { text: "Explain promotion ROI", icon: Lightbulb },
    { text: "How do I read the charts?", icon: BarChart3 },
    { text: "What data do you have?", icon: Compass },
  ],
  errorSuggestions: [
    "Try asking about top promotions by ROI",
    "Ask about category performance comparison",
    "Request a forecast for next quarter",
    "Explore underperforming promotions",
  ],
};

// Progress messages for loading state
const progressMessages = [
  { text: "Connecting to analytics engine...", delay: 0 },
  { text: "Querying transaction data...", delay: 800 },
  { text: "Analyzing promotion performance...", delay: 1600 },
  { text: "Calculating KPIs...", delay: 2400 },
  { text: "Generating insights...", delay: 3200 },
];

export default function ChatInterface({ 
  persona, 
  personaConfig, 
  onAsk, 
  isLoading, 
  currentResult,
  moduleName = 'Promotion Intelligence',
  moduleId = 'promotion'
}: ChatInterfaceProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [showKPISelector, setShowKPISelector] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [lastPersona, setLastPersona] = useState(persona);
  const [lastModuleId, setLastModuleId] = useState(moduleId);
  const [refinementInput, setRefinementInput] = useState("");
  const [showRefinement, setShowRefinement] = useState<string | null>(null);
  const [progressIndex, setProgressIndex] = useState(0);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({ recentTopics: [], drillPath: [], currentDrillLevel: 0 });
  const [sessionInsights, setSessionInsights] = useState<SessionInsight[]>([]);
  const [crossModuleLink, setCrossModuleLink] = useState<ReturnType<typeof detectTargetModule>>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, CollapsedSections>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Global session for cross-module persistence
  const { 
    addInsight, 
    getModuleInsights, 
    sharedContext, 
    updateSharedContext,
    addMemoryEntry,
    getSessionSummary: getGlobalSessionSummary
  } = useGlobalSession();

  // Topic navigation patterns
  const topicNavigationPatterns = [
    /go back to (?:the )?(.+?)(?:\s+analysis)?$/i,
    /what did we (?:discuss|talk) about (.+?)\??$/i,
    /return to (.+?)(?:\s+topic)?$/i,
    /back to (.+?)$/i,
    /show me (.+?) again$/i,
    /summarize (?:what we discussed|our discussion|the session|key findings)/i,
    /what were the (?:key )?findings\??$/i
  ];

  // Check if user is asking for topic navigation or session summary
  const detectTopicNavigation = useCallback((text: string): { type: 'navigation' | 'summary' | null, topic?: string } => {
    const lowerText = text.toLowerCase();
    
    // Check for summary request
    if (lowerText.includes('summarize') || lowerText.includes('key findings') || 
        lowerText.includes('what did we discuss') || lowerText.includes('recap')) {
      return { type: 'summary' };
    }
    
    // Check for navigation patterns
    for (const pattern of topicNavigationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return { type: 'navigation', topic: match[1].trim() };
      }
    }
    
    return { type: null };
  }, []);

  // Generate session summary - uses global session for cross-module insights
  const generateSessionSummary = useCallback((): string => {
    // First check global session for cross-module summary
    const globalSummary = getGlobalSessionSummary();
    if (globalSummary && globalSummary !== "No insights gathered yet in this session.") {
      return globalSummary;
    }
    
    if (sessionInsights.length === 0) {
      return "We haven't discussed any specific topics yet. Try asking a question to get started!";
    }
    
    const summaryParts = [
      `During our session, we explored ${sessionInsights.length} key area${sessionInsights.length > 1 ? 's' : ''}:\n`
    ];
    
    sessionInsights.forEach((insight, i) => {
      summaryParts.push(`${i + 1}. **${insight.question}**: ${insight.keyFinding}`);
    });
    
    if (conversationContext.lastCategory) {
      summaryParts.push(`\nMost recent focus: ${conversationContext.lastCategory}`);
    }
    if (conversationContext.lastMetric) {
      summaryParts.push(`Key metric analyzed: ${conversationContext.lastMetric}`);
    }
    
    return summaryParts.join('\n');
  }, [sessionInsights, conversationContext, getGlobalSessionSummary]);

  // Handle topic click from context panel
  const handleTopicClick = useCallback((topic: string) => {
    handleSuggestionClick(`Tell me more about ${topic} - what are the key insights?`);
  }, []);

  // Handle insight click from session summary
  const handleInsightClick = useCallback((insight: SessionInsight) => {
    handleSuggestionClick(`Go back to the analysis about: ${insight.question}`);
  }, []);

  // Get collapsed state for a message
  const getCollapsedState = (messageId: string): CollapsedSections => {
    return collapsedSections[messageId] || { kpi: false, timePeriod: false, fineTune: false };
  };

  // Toggle a section for a specific message
  const toggleSection = (messageId: string, section: keyof CollapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [messageId]: {
        ...getCollapsedState(messageId),
        [section]: !getCollapsedState(messageId)[section]
      }
    }));
  };

  // Collapse all sections for a message
  const collapseAllSections = (messageId: string) => {
    const current = getCollapsedState(messageId);
    const allExpanded = !current.kpi && !current.timePeriod && !current.fineTune;
    setCollapsedSections(prev => ({
      ...prev,
      [messageId]: {
        kpi: !allExpanded,
        timePeriod: !allExpanded,
        fineTune: !allExpanded
      }
    }));
  };
  const inputRef = useRef<HTMLInputElement>(null);

  // Get module-specific content based on moduleId and persona
  const content = getModulePersonaContent(moduleId, persona);

  // Progress indicator during loading
  useEffect(() => {
    if (isLoading) {
      setProgressIndex(0);
      const interval = setInterval(() => {
        setProgressIndex(prev => Math.min(prev + 1, progressMessages.length - 1));
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  // Initialize with greeting - reset when persona or module changes, restore shared context
  useEffect(() => {
    if (messages.length === 0 || persona !== lastPersona || moduleId !== lastModuleId) {
      const greeting = content.greetings[Math.floor(Math.random() * content.greetings.length)];
      const randomTip = content.tips[Math.floor(Math.random() * content.tips.length)];
      setMessages([{
        id: 'greeting-' + Date.now(),
        type: 'assistant',
        content: greeting,
        timestamp: new Date(),
        suggestions: content.quickStarts.map(p => p.text),
        guideTip: randomTip,
      }]);
      setLastPersona(persona);
      setLastModuleId(moduleId);
      setMessageCount(0);
      // Restore from shared context
      setConversationContext({ 
        lastCategory: sharedContext.lastCategory,
        lastMetric: sharedContext.lastMetric,
        lastTimePeriod: sharedContext.lastTimePeriod,
        recentTopics: sharedContext.recentTopics || [], 
        drillPath: [], 
        currentDrillLevel: 0 
      });
      // Load previous module insights
      const moduleInsights = getModuleInsights(moduleId);
      setSessionInsights(moduleInsights.map(i => ({
        id: i.id, question: i.question, keyFinding: i.keyFinding, timestamp: i.timestamp
      })));
      setCrossModuleLink(null);
    }
  }, [persona, moduleId, content, sharedContext, getModuleInsights]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Update conversation context from question
  const updateContext = (question: string, result?: AnalyticsResult) => {
    const categories = ['dairy', 'beverages', 'snacks', 'produce', 'frozen', 'bakery', 'pantry', 'personal care', 'home care'];
    const metrics = ['roi', 'margin', 'lift', 'spend', 'revenue'];
    const timePeriods = ['month', 'quarter', 'year', 'ytd'];
    
    const questionLower = question.toLowerCase();
    const newContext = { ...conversationContext };
    
    categories.forEach(cat => {
      if (questionLower.includes(cat)) newContext.lastCategory = cat;
    });
    metrics.forEach(metric => {
      if (questionLower.includes(metric)) newContext.lastMetric = metric;
    });
    timePeriods.forEach(period => {
      if (questionLower.includes(period)) newContext.lastTimePeriod = period;
    });
    
    // Extract promotion names from results
    if (result?.chartData?.[0]?.name) {
      newContext.lastPromotion = result.chartData[0].name;
    }
    
    // Track recent topics
    newContext.recentTopics = [question, ...newContext.recentTopics].slice(0, 5);
    
    setConversationContext(newContext);
  };

  // SYNC FIX: Pass question unchanged to match Classic View exactly
  // Context resolution removed to ensure identical API calls and cache keys
  const resolveContextualQuestion = (question: string): string => {
    // Return question UNCHANGED to match Classic View behavior
    return question;
  };

  // Check if question needs clarification
  const needsClarification = (question: string): { needs: boolean; options?: string[] } => {
    const questionLower = question.toLowerCase();
    
    // Questions with explicit KPIs - NO clarification needed
    const explicitKPIs = [
      'revenue', 'sales', 'roi', 'margin', 'lift', 'profit', 'units', 'volume', 
      'spend', 'cost', 'price', 'elasticity', 'forecast', 'accuracy', 'stockout',
      'inventory', 'lead time', 'on-time', 'compliance', 'sqft', 'square foot',
      'gmroi', 'turnover', 'velocity', 'conversion', 'basket', 'traffic',
      'fill rate', 'shrink', 'waste', 'markdown', 'penetration', 'share',
      'growth', 'decline', 'increase', 'decrease', 'change', 'variance',
      'ytd', 'yoy', 'mom', 'qoq', 'budget', 'target', 'goal', 'benchmark',
      'average', 'median', 'total', 'sum', 'count', 'rate', 'ratio', 'index',
      'contribution', 'allocation', 'efficiency', 'productivity', 'utilization',
      'frequency', 'recency', 'churn', 'retention', 'acquisition', 'attrition'
    ];
    
    const hasExplicitKPI = explicitKPIs.some(kpi => questionLower.includes(kpi));
    
    // Entity-ambiguous terms should ALWAYS get clarification from the server, regardless of KPI
    const entityAmbiguousTerms = ['seller', 'selling', 'moving', 'mover'];
    const hasEntityAmbiguity = entityAmbiguousTerms.some(term => questionLower.includes(term));
    const hasEntityContext = /\b(product|sku|vendor|supplier|store|brand|category)\b/i.test(questionLower);
    
    // If the question has entity ambiguity without explicit entity context, let server handle clarification
    if (hasEntityAmbiguity && !hasEntityContext) {
      console.log(`[Clarification] Allowing server to handle entity clarification for: "${question}"`);
      return { needs: false }; // Let server handle this
    }
    
    if (hasExplicitKPI) {
      console.log(`[Clarification] Skipped - explicit KPI found in: "${question}"`);
      return { needs: false };
    }
    
    // Domain-specific implied KPIs - question structure implies the metric
    // NOTE: "seller" patterns removed - entity clarification handled by server
    const impliedKPIPatterns = [
      // Sales/Revenue implied - seller removed to allow entity clarification
      { pattern: /sold\b/, metric: 'revenue' },
      { pattern: /moving\s*(item|product|sku)?/, metric: 'velocity' },
      { pattern: /fast(est)?.*mov/, metric: 'velocity' },
      { pattern: /slow(est)?.*mov/, metric: 'velocity' },
      { pattern: /high(est)?\s*(volume|demand)/, metric: 'volume' },
      { pattern: /low(est)?\s*(volume|demand)/, metric: 'volume' },
      
      // Margin/Profit implied
      { pattern: /profitable|profitability/, metric: 'margin' },
      { pattern: /earning|gross/, metric: 'margin' },
      { pattern: /loss|losing|lost money/, metric: 'margin' },
      
      // Inventory/Supply implied
      { pattern: /stockout|out.of.stock|oos/, metric: 'stockout' },
      { pattern: /overstock|excess|surplus/, metric: 'inventory' },
      { pattern: /days.of.supply|dos/, metric: 'dos' },
      { pattern: /reorder|replenish|refill/, metric: 'inventory' },
      { pattern: /safety.stock|buffer/, metric: 'inventory' },
      
      // Supplier implied
      { pattern: /supplier|vendor/, metric: 'supplier_performance' },
      { pattern: /lead.time|delivery/, metric: 'lead_time' },
      { pattern: /on.time|otif|late/, metric: 'on_time_rate' },
      { pattern: /reliable|reliability/, metric: 'reliability' },
      
      // Space planning implied
      { pattern: /planogram|pog/, metric: 'compliance' },
      { pattern: /shelf|facing|fixture/, metric: 'space' },
      { pattern: /eye.level/, metric: 'placement' },
      { pattern: /endcap|display|aisle/, metric: 'space' },
      
      // Demand implied
      { pattern: /forecast|predict/, metric: 'forecast_accuracy' },
      { pattern: /seasonal|trend|pattern/, metric: 'demand' },
      { pattern: /peak|trough|spike/, metric: 'demand' },
      
      // Pricing implied
      { pattern: /elastic|sensitivity/, metric: 'elasticity' },
      { pattern: /competitor|competitive|gap/, metric: 'price_gap' },
      { pattern: /premium|discount depth/, metric: 'pricing' },
      { pattern: /promo.*price|price.*promo/, metric: 'pricing' },
      
      // Customer implied
      { pattern: /loyal|loyalty|tier/, metric: 'loyalty' },
      { pattern: /segment|cohort/, metric: 'segment' },
      { pattern: /lifetime|ltv|clv/, metric: 'ltv' },
      { pattern: /customer|shopper|buyer/, metric: 'customer' },
      
      // Performance implied
      { pattern: /performer|performing/, metric: 'performance' },
      { pattern: /underperform|laggard|poor/, metric: 'performance' },
      { pattern: /leader|winner|champion/, metric: 'performance' },
      { pattern: /success|successful/, metric: 'performance' },
      { pattern: /fail|failure|failing/, metric: 'performance' },
      
      // Category/Product implied
      { pattern: /category|department|class/, metric: 'category' },
      { pattern: /brand|manufacturer/, metric: 'brand' },
      { pattern: /sku|product|item/, metric: 'product' },
      { pattern: /store|location|region/, metric: 'store' },
      
      // Comparison/Analysis implied
      { pattern: /compare|comparison|versus|vs/, metric: 'comparison' },
      { pattern: /rank|ranking|ranked/, metric: 'ranking' },
      { pattern: /why|reason|driver|cause/, metric: 'causal' },
      { pattern: /impact|effect|influence/, metric: 'impact' },
      { pattern: /opportunity|potential|upside/, metric: 'opportunity' },
      { pattern: /risk|threat|concern|issue/, metric: 'risk' },
    ];
    
    const matchedPattern = impliedKPIPatterns.find(({ pattern }) => pattern.test(questionLower));
    if (matchedPattern) {
      console.log(`[Clarification] Skipped - implied KPI '${matchedPattern.metric}' from pattern in: "${question}"`);
      return { needs: false };
    }
    
    // Only ask for clarification on truly vague "best/top" questions without any context
    if ((questionLower.includes('best') || questionLower.includes('top') || questionLower.includes('worst'))) {
      // Check if it's a genuinely ambiguous case (e.g., "top promotions" without context)
      const isAmbiguous = (questionLower.includes('promotion') || questionLower.includes('campaign')) 
        && !questionLower.includes('promo') // "promo" often has context
        && questionLower.split(' ').length < 5; // Very short questions might be ambiguous
        
      if (isAmbiguous) {
        console.log(`[Clarification] TRIGGERED for ambiguous question: "${question}"`);
        return {
          needs: true,
          options: [
            `${question} by ROI`,
            `${question} by margin`,
            `${question} by revenue`,
          ]
        };
      }
    }
    
    console.log(`[Clarification] Skipped - no ambiguity detected in: "${question}"`);
    return { needs: false };
  };

  // Generate KPI exploration options based on question
  const generateKPIExploration = (question: string): KPI[] => {
    return getSuggestedKPIs(question);
  };

  // Update messages when result changes
  useEffect(() => {
    if (currentResult && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === 'user') {
        const followUpSuggestions = generateFollowUps(currentResult);
        const response = generateConversationalResponse(currentResult);
        const tip = generateContextualTip(currentResult, messageCount);
        const kpiExploration = generateKPIExploration(lastMessage.content);
        
        updateContext(lastMessage.content, currentResult);
        
        // Extract session insight from result
        const keyFinding = currentResult.whatHappened?.[0] || 
          `Key metrics: ${Object.entries(currentResult.kpis).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(', ')}`;
        
        setSessionInsights(prev => [...prev, {
          id: `insight-${Date.now()}`,
          question: lastMessage.content.length > 50 ? lastMessage.content.substring(0, 50) + '...' : lastMessage.content,
          keyFinding: keyFinding.length > 80 ? keyFinding.substring(0, 80) + '...' : keyFinding,
          timestamp: new Date()
        }]);
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: response,
          timestamp: new Date(),
          analyticsResult: currentResult,
          suggestions: followUpSuggestions,
          guideTip: tip,
          actionButtons: generateActionButtons(currentResult),
          feedback: null,
          kpiExploration,
          originalQuestion: lastMessage.content,
        }]);
        
        setMessageCount(prev => prev + 1);
      }
    }
  }, [currentResult]);

  // SYNC FIX: Display ALL whatHappened items exactly like Classic View
  const generateConversationalResponse = (result: AnalyticsResult): string => {
    // Simply format ALL whatHappened items as bullet points - no intro, no truncation
    if (result.whatHappened && result.whatHappened.length > 0) {
      return result.whatHappened.map(item => `• ${item}`).join('\n\n');
    }
    return 'Analysis complete.';
  };

  const generateContextualTip = (result: AnalyticsResult, count: number): string | undefined => {
    if (count === 1) return "💡 Tip: Click on chart bars to drill down and see more details";
    if (count === 3) return "🎯 Tip: Select specific KPIs before asking to focus your analysis";
    if (count === 5) return "🔮 Tip: Try predictive questions like 'Forecast next quarter's ROI'";
    if (result.kpis.roi >= 1.5 && count % 4 === 0) return "⭐ This is performing well! Ask 'How can we replicate this success?'";
    if (result.kpis.roi < 1 && count % 4 === 0) return "⚠️ Found underperformance. Ask 'What's causing this?' to understand the drivers";
    return undefined;
  };

  const generateActionButtons = (result: AnalyticsResult): { label: string; question: string; icon: string }[] => {
    const buttons: { label: string; question: string; icon: string }[] = [];
    
    if (result.kpis.roi < 1) {
      buttons.push({ label: "Find root cause", question: "What's causing the poor ROI performance?", icon: "search" });
      buttons.push({ label: "Get recommendations", question: "How can I improve these underperforming promotions?", icon: "lightbulb" });
    } else if (result.kpis.roi >= 1.5) {
      buttons.push({ label: "Scale this success", question: "How can we replicate this success in other categories?", icon: "rocket" });
      buttons.push({ label: "Forecast impact", question: "What will happen if we scale this promotion?", icon: "chart" });
    }
    
    if (result.predictions && result.predictions.forecast?.length > 0) {
      buttons.push({ label: "Explore scenarios", question: "Show me different forecast scenarios", icon: "layers" });
    }
    
    return buttons.slice(0, 2);
  };

  const generateFollowUps = (result: AnalyticsResult): string[] => {
    if (result.nextQuestions && result.nextQuestions.length > 0) {
      return result.nextQuestions.slice(0, 4);
    }
    
    const hasRisk = result.kpis.roi < 1 || result.whatHappened.some(w => 
      w.toLowerCase().includes('loss') || w.toLowerCase().includes('underperform')
    );
    const hasSuccess = result.kpis.roi >= 1.5;
    const hasForecast = result.predictions && result.predictions.forecast.length > 0;
    
    if (hasRisk) return contextualPrompts.followUp.risk;
    if (hasSuccess) return contextualPrompts.followUp.success;
    if (hasForecast) return contextualPrompts.followUp.forecast;
    return contextualPrompts.followUp.roi;
  };

  // Handle drilling into a chart item
  const handleDrillInto = useCallback((itemName: string) => {
    setConversationContext(prev => ({
      ...prev,
      drillPath: [...prev.drillPath, itemName],
      currentDrillLevel: prev.currentDrillLevel + 1
    }));
    
    handleSuggestionClick(`Drill deeper into ${itemName} - show me the next level of detail`);
  }, []);

  // Navigate to a specific drill level via breadcrumbs
  const handleBreadcrumbNavigate = useCallback((index: number) => {
    const newPath = conversationContext.drillPath.slice(0, index + 1);
    const targetItem = newPath[index];
    
    setConversationContext(prev => ({
      ...prev,
      drillPath: newPath,
      currentDrillLevel: index + 1
    }));
    
    handleSuggestionClick(`Show me details for ${targetItem}`);
  }, [conversationContext.drillPath]);

  // Reset drill path to overview
  const handleDrillReset = useCallback(() => {
    setConversationContext(prev => ({
      ...prev,
      drillPath: [],
      currentDrillLevel: 0
    }));
    handleSuggestionClick(`Give me an overview of ${moduleName} metrics`);
  }, [moduleName]);

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;

    // Check for topic navigation or summary requests
    const navResult = detectTopicNavigation(query);
    
    if (navResult.type === 'summary') {
      // Handle summary request locally
      const summaryContent = generateSessionSummary();
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: query,
        timestamp: new Date()
      };
      const summaryMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: summaryContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage, summaryMessage]);
      setQuery("");
      return;
    }

    // SYNC FIX: Use original query without transformation to match Classic View
    let processedQuery = query;
    const queryLower = query.toLowerCase();

    // Check for entity-ambiguous terms (seller, mover, etc.) - show clickable entity options
    const entityAmbiguousPatterns: { pattern: RegExp; label: string; options: { label: string; emoji: string; replacement: string }[] }[] = [
      { 
        pattern: /sell[ea]?[r]+s?|sel+ers?/i, 
        label: 'seller',
        options: [
          { label: 'Products/SKUs', emoji: '📦', replacement: 'selling product' },
          { label: 'Vendors/Suppliers', emoji: '🏭', replacement: 'vendor by sales' },
          { label: 'Stores', emoji: '🏪', replacement: 'store by sales' }
        ]
      },
      { 
        pattern: /\bmoving\b|\bmover\b/i,
        label: 'moving/mover',
        options: [
          { label: 'Products/SKUs', emoji: '📦', replacement: 'selling product' },
          { label: 'Categories', emoji: '📁', replacement: 'performing category' }
        ]
      },
      { 
        pattern: /\bperformer\b/i,
        label: 'performer',
        options: [
          { label: 'Products/SKUs', emoji: '📦', replacement: 'performing product' },
          { label: 'Categories', emoji: '📁', replacement: 'performing category' },
          { label: 'Stores', emoji: '🏪', replacement: 'performing store' }
        ]
      }
    ];
    
    const hasEntityContext = /\b(product|sku|vendor|supplier|store|brand|category)\b/i.test(queryLower);
    const matchedEntityPattern = !hasEntityContext ? entityAmbiguousPatterns.find(a => a.pattern.test(queryLower)) : null;
    
    if (matchedEntityPattern) {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: query,
        timestamp: new Date(),
      };
      
      const clarifyMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `🤔 When you say "${matchedEntityPattern.label}", do you mean:`,
        timestamp: new Date(),
        needsClarification: true,
        clarificationOptions: matchedEntityPattern.options.map(opt => 
          `${opt.emoji} ${opt.label}`
        ),
        actionButtons: matchedEntityPattern.options.map(opt => ({
          label: `${opt.emoji} ${opt.label}`,
          question: query.replace(matchedEntityPattern.pattern, opt.replacement),
          icon: 'arrow'
        }))
      };
      
      setMessages(prev => [...prev, userMessage, clarifyMessage]);
      setQuery("");
      return;
    }

    // Check for KPI-ambiguous questions (top N, best, worst without metric specified)
    const kpiAmbiguousPattern = /\b(top\s*\d+|best|worst|highest|lowest|leading|lagging|underperforming|overperforming)\b/i;
    
    // Comprehensive KPI detection - includes common typos and variations
    const explicitKPIPatterns = [
      /\b(rev[en]{1,3}u?e?s?|revenues?)\b/i, // revenue with various typos: revnue, revneue, reven, etc.
      /\b(marg[ia]n|margins?|margin%|gross.margin|net.margin)\b/i,
      /\b(roi|return.on.investment)\b/i,
      /\b(sales?|sold|selling)\b/i,
      /\b(profit|profits|profitability|profitable)\b/i,
      /\b(units?|quantity|qty|volume)\b/i,
      /\b(spend|spending|costs?)\b/i,
      /\b(lift|lift%|uplift)\b/i,
      /\b(prices?|pricing)\b/i,
      /\b(elasticity|elastic)\b/i,
      /\b(forecas?t|forecasted|forecasting)\b/i,
      /\b(accuracy|accurate)\b/i,
      /\b(compliance|compliant)\b/i,
      /\b(utilization|utilized)\b/i,
      /\b(ebitda|ebit)\b/i,
      /\b(growth|growing)\b/i,
      /\b(velocity|turnover)\b/i,
      /\b(stockout|stock.out|oos|out.of.stock)\b/i,
      /\b(lead.time|leadtime)\b/i,
      /\b(on.time|ontime|otif)\b/i,
      /\b(market.share|share)\b/i,
      /\bby\s+\w+/i, // "by X" pattern - any "by something" indicates metric specified
    ];
    const hasExplicitKPI = explicitKPIPatterns.some(p => p.test(queryLower));
    
    // Module-specific KPI options
    const moduleKPIOptions: Record<string, { label: string; emoji: string; suffix: string }[]> = {
      promotion: [
        { label: 'Revenue', emoji: '💰', suffix: 'by revenue' },
        { label: 'ROI', emoji: '📈', suffix: 'by ROI' },
        { label: 'Margin', emoji: '💵', suffix: 'by margin' },
        { label: 'Units Sold', emoji: '📦', suffix: 'by units sold' },
        { label: 'Lift %', emoji: '🚀', suffix: 'by lift percentage' }
      ],
      pricing: [
        { label: 'Revenue', emoji: '💰', suffix: 'by revenue' },
        { label: 'Margin', emoji: '💵', suffix: 'by margin' },
        { label: 'Price Elasticity', emoji: '📊', suffix: 'by price elasticity' },
        { label: 'Competitive Gap', emoji: '🎯', suffix: 'by competitive price gap' }
      ],
      demand: [
        { label: 'Forecast Accuracy', emoji: '🎯', suffix: 'by forecast accuracy' },
        { label: 'Demand Volume', emoji: '📦', suffix: 'by demand volume' },
        { label: 'Stockout Risk', emoji: '⚠️', suffix: 'by stockout risk' },
        { label: 'Days of Supply', emoji: '📅', suffix: 'by days of supply' }
      ],
      'supply-chain': [
        { label: 'On-Time Rate', emoji: '⏱️', suffix: 'by on-time delivery rate' },
        { label: 'Lead Time', emoji: '📅', suffix: 'by lead time' },
        { label: 'Cost', emoji: '💰', suffix: 'by cost' },
        { label: 'Reliability Score', emoji: '⭐', suffix: 'by reliability score' }
      ],
      'space-planning': [
        { label: 'Sales per Sqft', emoji: '📊', suffix: 'by sales per square foot' },
        { label: 'Space Utilization', emoji: '📐', suffix: 'by space utilization' },
        { label: 'Compliance', emoji: '✅', suffix: 'by planogram compliance' }
      ],
      assortment: [
        { label: 'Revenue', emoji: '💰', suffix: 'by revenue' },
        { label: 'Margin', emoji: '💵', suffix: 'by margin contribution' },
        { label: 'Velocity', emoji: '🚀', suffix: 'by sales velocity' },
        { label: 'Market Share', emoji: '🎯', suffix: 'by market share' }
      ],
      executive: [
        { label: 'Revenue', emoji: '💰', suffix: 'by revenue' },
        { label: 'EBITDA', emoji: '📈', suffix: 'by EBITDA' },
        { label: 'Margin', emoji: '💵', suffix: 'by margin' },
        { label: 'ROI', emoji: '🎯', suffix: 'by ROI' },
        { label: 'Growth', emoji: '📊', suffix: 'by growth rate' }
      ]
    };

    const currentModuleKPIs = moduleKPIOptions[moduleId || 'promotion'] || moduleKPIOptions.promotion;
    
    if (kpiAmbiguousPattern.test(queryLower) && !hasExplicitKPI) {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: query,
        timestamp: new Date(),
      };
      
      const clarifyMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `📊 Which metric would you like to rank by?`,
        timestamp: new Date(),
        needsClarification: true,
        clarificationOptions: currentModuleKPIs.map(kpi => `${kpi.emoji} ${kpi.label}`),
        actionButtons: currentModuleKPIs.map(kpi => ({
          label: `${kpi.emoji} ${kpi.label}`,
          question: `${query} ${kpi.suffix}`,
          icon: 'arrow'
        }))
      };
      
      setMessages(prev => [...prev, userMessage, clarifyMessage]);
      setQuery("");
      return;
    }

    // Check for time period ambiguity - questions that need a time frame
    const timePeriodPatterns = [
      // Explicit time references - don't need clarification
      /\b(today|yesterday|this week|last week|this month|last month|this quarter|last quarter|this year|last year|ytd|year.to.date|mtd|month.to.date|qtd|quarter.to.date)\b/i,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
      /\b(q1|q2|q3|q4|h1|h2)\b/i,
      /\b(2024|2025|2023|2022)\b/i,
      /\b(past|last|previous|recent|current|next)\s*(day|week|month|quarter|year|period)/i,
      /\b(\d+)\s*(days?|weeks?|months?|quarters?|years?)\s*(ago|back|prior)/i,
      /\bsince\s+/i,
      /\bfrom\s+\w+\s+to\s+/i,
      /\bover\s+the\s+(past|last)\s+/i,
      /\bduring\s+/i,
      /\bin\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i,
      /\bby\s+(year|quarter|month|week|day|annually|quarterly|monthly|weekly|daily)\b/i, // "by year", "by quarter", etc.
      /\b(annual|yearly|quarterly|monthly|weekly|daily)\b/i, // annual, yearly, etc.
    ];
    
    const hasTimePeriod = timePeriodPatterns.some(p => p.test(queryLower));
    
    // Questions that benefit from time period context - including ranking questions
    // Ranking questions (top 5, best, worst) need time context to be meaningful
    const needsTimeFramePatterns = [
      /\b(trend|trending|growth|decline|change|changed|increased|decreased|improved|worsened)\b/i,
      /\b(compare|comparison|versus|difference|gap)\b/i,
      /\b(yoy|year.over.year|mom|month.over.month|qoq|quarter.over.quarter)\b/i,
      /\b(forecast|predict|projection)\b/i,
      /\bhow\s+(much|many)\s+(did|has|have)\s+(we|it|they)\s+(grow|decline|change|increase|decrease)/i,
      /\bwhat\s+(was|were)\s+(the|our)\s+.*(last|previous|prior)/i,
      /\b(top\s*\d+|best|worst|highest|lowest|leading|bottom)\b/i, // Ranking questions need time context
      /\bperform/i, // performance questions
      /\bsell/i, // selling/seller questions
    ];
    
    const needsTimeFrame = needsTimeFramePatterns.some(p => p.test(queryLower));
    
    // Time period options
    const timePeriodOptions = [
      { label: 'This Month', emoji: '📅', suffix: 'this month' },
      { label: 'Last Month', emoji: '📆', suffix: 'last month' },
      { label: 'This Quarter', emoji: '📊', suffix: 'this quarter' },
      { label: 'Last Quarter', emoji: '📈', suffix: 'last quarter' },
      { label: 'Year to Date', emoji: '📅', suffix: 'year to date' },
      { label: 'Last Year', emoji: '🗓️', suffix: 'last year' },
      { label: 'Last 30 Days', emoji: '⏱️', suffix: 'in the last 30 days' },
      { label: 'Last 90 Days', emoji: '⏰', suffix: 'in the last 90 days' },
    ];
    
    if (needsTimeFrame && !hasTimePeriod) {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: query,
        timestamp: new Date(),
      };
      
      const clarifyMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `📅 What time period would you like to analyze?`,
        timestamp: new Date(),
        needsClarification: true,
        clarificationOptions: timePeriodOptions.map(tp => `${tp.emoji} ${tp.label}`),
        actionButtons: timePeriodOptions.map(tp => ({
          label: `${tp.emoji} ${tp.label}`,
          question: `${query} ${tp.suffix}`,
          icon: 'arrow'
        }))
      };
      
      setMessages(prev => [...prev, userMessage, clarifyMessage]);
      setQuery("");
      return;
    }

    // Check for clarification needs (metric clarification)
    const clarification = needsClarification(processedQuery);
    if (clarification.needs && clarification.options) {
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: query,
        timestamp: new Date(),
      };
      
      const clarifyMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "🤔 I want to give you the most relevant analysis. Could you clarify?",
        timestamp: new Date(),
        needsClarification: true,
        clarificationOptions: clarification.options,
      };
      
      setMessages(prev => [...prev, userMessage, clarifyMessage]);
      setQuery("");
      return;
    }

    // Resolve contextual references
    const resolvedQuestion = resolveContextualQuestion(processedQuery);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: resolvedQuestion,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery("");
    setShowKPISelector(false);
    setShowHelpMenu(false);

    try {
      await onAsk(resolvedQuestion, selectedKPIs);
      setSelectedKPIs([]);
    } catch (error) {
      // Error handling with suggestions
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "😕 I ran into an issue analyzing that question. Here are some things you can try:",
        timestamp: new Date(),
        isError: true,
        suggestions: contextualPrompts.errorSuggestions,
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setQuery("");
    setShowHelpMenu(false);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: suggestion,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    try {
      await onAsk(suggestion, selectedKPIs);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "😕 Something went wrong. Try rephrasing your question or selecting a different option.",
        timestamp: new Date(),
        isError: true,
        suggestions: contextualPrompts.errorSuggestions,
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleRefinement = async (messageId: string) => {
    if (!refinementInput.trim()) return;
    
    const originalMessage = messages.find(m => m.id === messageId);
    if (!originalMessage?.analyticsResult) return;
    
    const refinedQuestion = `${originalMessage.analyticsResult.sources || 'Analysis'} ${refinementInput}`;
    setRefinementInput("");
    setShowRefinement(null);
    
    await handleSuggestionClick(refinedQuestion);
  };

  const handleFeedback = (messageId: string, type: 'positive' | 'negative') => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, feedback: type } : m
    ));
    
    toast({
      title: type === 'positive' ? "Thanks for the feedback! 👍" : "Sorry to hear that 👎",
      description: type === 'positive' 
        ? "Glad this was helpful!" 
        : "I'll try to do better. Try rephrasing or asking a follow-up.",
      duration: 2000,
    });
  };

  const handleVoiceTranscript = (text: string) => {
    setQuery(text);
  };

  return (
    <div className="flex flex-col h-[650px] bg-card rounded-xl border border-border shadow-lg">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/20">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                {moduleName} Assistant
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">AI</Badge>
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-status-good animate-pulse" />
                {personaConfig.label} • Ready to help
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {conversationContext.recentTopics.length > 0 && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <MessageSquare className="h-3 w-3" />
                {conversationContext.recentTopics.length} context
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary"
              onClick={() => setShowHelpMenu(!showHelpMenu)}
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Need help?
            </Button>
          </div>
        </div>
      </div>

      {/* Help Menu Dropdown */}
      {showHelpMenu && (
        <div className="px-6 py-3 border-b border-border bg-secondary/30">
          <p className="text-xs font-medium text-foreground mb-2">I can help you with:</p>
          <div className="grid grid-cols-2 gap-2">
            {contextualPrompts.needHelp.map((item, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs justify-start h-8"
                onClick={() => handleSuggestionClick(item.text)}
              >
                <item.icon className="h-3 w-3 mr-2" />
                {item.text}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Conversation Context Panel - Collapsible */}
      {(conversationContext.lastCategory || conversationContext.lastMetric || sessionInsights.length > 0) && (
        <div className="px-6 py-3 border-b border-border bg-secondary/20">
          <ConversationContextPanel
            context={conversationContext}
            sessionInsights={sessionInsights}
            onTopicClick={handleTopicClick}
            onInsightClick={handleInsightClick}
          />
        </div>
      )}
      
      {/* Drill Breadcrumbs */}
      {conversationContext.drillPath.length > 0 && (
        <div className="px-6 py-2 border-b border-border/50">
          <DrillBreadcrumbs
            drillPath={conversationContext.drillPath}
            onNavigate={handleBreadcrumbNavigate}
            onReset={handleDrillReset}
            currentLevel={conversationContext.currentDrillLevel}
          />
        </div>
      )}

      {/* Messages Area - Clean Chat Shell */}
      <div className="flex flex-col flex-1 min-h-0 w-full max-w-full overflow-hidden">
        <ScrollArea className="flex-1 min-h-0 w-full max-w-full" ref={scrollRef}>
          <div className="space-y-4 px-6 py-4 w-full">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex w-full ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar for assistant */}
                {message.type !== 'user' && (
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mr-3 ${
                    message.isError 
                      ? 'bg-destructive/20 text-destructive'
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                {/* Message Content */}
                <div 
                  className={`rounded-2xl px-3 py-2 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white max-w-[85%]'
                      : message.isError
                      ? 'bg-destructive/10 text-foreground border border-destructive/30 max-w-[85%] min-w-0 overflow-hidden'
                      : 'bg-slate-100 dark:bg-slate-800 text-foreground max-w-[85%] min-w-0 overflow-hidden'
                  }`}
                >
                  {/* User messages: horizontal scroll */}
                  {message.type === 'user' ? (
                    <div 
                      className="scrollbar-visible overflow-x-auto" 
                      style={{ 
                        maxWidth: '100%',
                        WebkitOverflowScrolling: 'touch'
                      }}
                    >
                      <p className="text-sm leading-relaxed whitespace-nowrap">{message.content}</p>
                    </div>
                  ) : message.isError ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                  ) : (
                    <UniversalScrollableText>
                      <FormattedInsight content={message.content} />
                    </UniversalScrollableText>
                  )}

                {/* Why section - Horizontal scroll */}
                {message.analyticsResult?.why && message.analyticsResult.why.length > 0 && (
                  <div className="mt-3 p-2 bg-amber-500/10 rounded border border-amber-500/20 w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                      <span className="font-medium text-xs">Why It Happened</span>
                    </div>
                    <UniversalScrollableText>
                      <ul className="space-y-1">
                        {message.analyticsResult.why.map((reason: string, i: number) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-amber-500 mt-0.5">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </UniversalScrollableText>
                  </div>
                )}
                
                {/* What To Do (Recommendations) - Horizontal scroll */}
                {message.analyticsResult?.whatToDo && message.analyticsResult.whatToDo.length > 0 && (
                  <div className="mt-3 p-2 bg-emerald-500/10 rounded border border-emerald-500/20 w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="font-medium text-xs">Recommendations</span>
                    </div>
                    <UniversalScrollableText>
                      <ul className="space-y-1">
                        {message.analyticsResult.whatToDo.map((action: string, i: number) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">✓</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </UniversalScrollableText>
                  </div>
                )}
                
                {/* Causal Drivers - Horizontal scroll */}
                {message.analyticsResult?.causalDrivers && message.analyticsResult.causalDrivers.length > 0 && (
                  <div className="mt-3 p-2 bg-orange-500/10 rounded border border-orange-500/20 w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-3.5 w-3.5 text-orange-500" />
                      <span className="font-medium text-xs">Causal Drivers</span>
                    </div>
                    <UniversalScrollableText>
                      <div className="flex gap-2">
                        {message.analyticsResult.causalDrivers.map((driver: any, i: number) => (
                          <div key={i} className="bg-background/50 rounded p-2 border border-border/50 flex-shrink-0">
                            <div className="flex items-center justify-between mb-1 gap-2">
                              <span className="font-medium text-xs">{driver.driver}</span>
                              {driver.direction === 'positive' ? (
                                <TrendingUp className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className={driver.direction === 'positive' ? 'text-emerald-500' : 'text-red-500'}>
                                {driver.impact}
                              </span>
                              <span>•</span>
                              <span>Correlation: {((driver.correlation || 0) * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </UniversalScrollableText>
                  </div>
                )}
                
                {/* ML Insights - Horizontal scroll */}
                {message.analyticsResult?.mlInsights && (
                  <div className="mt-3 p-2 bg-purple-500/10 rounded border border-purple-500/20 w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-3.5 w-3.5 text-purple-500" />
                      <span className="font-medium text-xs">ML Insights</span>
                      <Badge variant="secondary" className="text-[10px] h-4">
                        {(((message.analyticsResult.mlInsights as any).confidence || 0) * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                    <UniversalScrollableText>
                      <p className="text-xs text-muted-foreground mb-1">
                        {(message.analyticsResult.mlInsights as any).patternDetected || (message.analyticsResult.mlInsights as any).pattern}
                      </p>
                      {((message.analyticsResult.mlInsights as any).businessSignificance || (message.analyticsResult.mlInsights as any).significance) && (
                        <p className="text-[10px] text-purple-600 dark:text-purple-400">
                          <strong>Significance:</strong> {(message.analyticsResult.mlInsights as any).businessSignificance || (message.analyticsResult.mlInsights as any).significance}
                        </p>
                      )}
                    </UniversalScrollableText>
                  </div>
                )}
                
                {/* Predictions - Horizontal scroll */}
                {message.analyticsResult?.predictions && (
                  <div className="mt-3 p-2 bg-blue-500/10 rounded border border-blue-500/20 w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                      <span className="font-medium text-xs">Predictions</span>
                    </div>
                    <UniversalScrollableText>
                      <div className="flex items-center gap-4 text-xs">
                        {(message.analyticsResult.predictions as any).trend && (
                          <div>
                            <span className="text-[10px] text-muted-foreground">Trend: </span>
                            <span className={`font-medium capitalize ${
                              (message.analyticsResult.predictions as any).trend === 'increasing' ? 'text-emerald-500' :
                              (message.analyticsResult.predictions as any).trend === 'decreasing' ? 'text-red-500' : 'text-amber-500'
                            }`}>
                              {(message.analyticsResult.predictions as any).trend}
                            </span>
                          </div>
                        )}
                        {(message.analyticsResult.predictions as any).riskLevel && (
                          <div>
                            <span className="text-[10px] text-muted-foreground">Risk: </span>
                            <span className={`font-medium capitalize ${
                              (message.analyticsResult.predictions as any).riskLevel === 'low' ? 'text-emerald-500' :
                              (message.analyticsResult.predictions as any).riskLevel === 'high' ? 'text-red-500' : 'text-amber-500'
                            }`}>
                              {(message.analyticsResult.predictions as any).riskLevel}
                            </span>
                          </div>
                        )}
                      </div>
                      {(message.analyticsResult.predictions as any).forecast && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {typeof (message.analyticsResult.predictions as any).forecast === 'string' 
                            ? (message.analyticsResult.predictions as any).forecast 
                            : Array.isArray((message.analyticsResult.predictions as any).forecast) 
                              ? (message.analyticsResult.predictions as any).forecast.map((f: any) => `${f.period}: ${typeof f.value === 'number' ? f.value.toFixed(0) : f.value}`).join(', ')
                              : ''}
                        </p>
                      )}
                    </UniversalScrollableText>
                  </div>
                )}

                {/* Clarification Options */}
                {message.needsClarification && message.clarificationOptions && (
                  <div className="mt-2 space-y-2">
                    <p className="text-[10px] text-muted-foreground">Choose an option:</p>
                    <div className="flex flex-wrap gap-2">
                      {message.clarificationOptions.map((option, idx) => {
                        // If actionButtons exist, use the refined question from there
                        const refinedQuestion = message.actionButtons?.[idx]?.question;
                        return (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 px-3 border-primary/30 hover:bg-primary/10 hover:border-primary"
                            onClick={() => handleSuggestionClick(refinedQuestion || option)}
                            disabled={isLoading}
                          >
                            {option}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Guide Tip */}
                {message.guideTip && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg max-w-full">
                    <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">{message.guideTip}</p>
                  </div>
                )}

                {/* Feedback Buttons - Feature #5 */}
                {message.analyticsResult && message.type === 'assistant' && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">Was this helpful?</span>
                    <Button
                      variant={message.feedback === 'positive' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleFeedback(message.id, 'positive')}
                    >
                      <ThumbsUp className={`h-3 w-3 ${message.feedback === 'positive' ? 'text-primary-foreground' : ''}`} />
                    </Button>
                    <Button
                      variant={message.feedback === 'negative' ? 'destructive' : 'ghost'}
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleFeedback(message.id, 'negative')}
                    >
                      <ThumbsDown className={`h-3 w-3 ${message.feedback === 'negative' ? 'text-destructive-foreground' : ''}`} />
                    </Button>
                  </div>
                )}

                {/* KPI Exploration Probing - Collapsible */}
                {message.kpiExploration && message.kpiExploration.length > 0 && message.analyticsResult && (
                  <CollapsibleKPISection
                    kpis={message.kpiExploration}
                    originalQuestion={message.originalQuestion}
                    onKPIClick={(kpiLabel) => handleSuggestionClick(`${message.originalQuestion || 'Show analysis'} focusing on ${kpiLabel}`)}
                    isLoading={isLoading}
                    isOpen={!getCollapsedState(message.id).kpi}
                    onToggle={() => toggleSection(message.id, 'kpi')}
                  />
                )}

                {/* Action Buttons */}
                {message.actionButtons && message.actionButtons.length > 0 && (
                  <div className="flex gap-2 mt-1">
                    {message.actionButtons.map((btn, idx) => (
                      <Button
                        key={idx}
                        variant="default"
                        size="sm"
                        className="text-xs h-8 gap-1.5"
                        onClick={() => handleSuggestionClick(btn.question)}
                        disabled={isLoading}
                      >
                        <ChevronRight className="h-3 w-3" />
                        {btn.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Charts are displayed in the right panel - Drill-down buttons for data exploration */}
                {message.analyticsResult?.chartData && message.analyticsResult.chartData.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <span className="text-xs text-muted-foreground font-medium">Drill into data:</span>
                    <div className="flex flex-wrap gap-2">
                      {message.analyticsResult.chartData.slice(0, 6).map((item: any, idx: number) => {
                        const name = item.name || item.label || item.category || `Item ${idx + 1}`;
                        const value = item.value || item.revenue || item.roi || item.margin;
                        return (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="h-auto py-1.5 px-3 text-xs hover:bg-primary/10 hover:border-primary"
                            onClick={() => handleDrillInto(name)}
                          >
                            <TrendingUp className="h-3 w-3 mr-1.5 text-primary" />
                            <span className="font-medium">{name}</span>
                            {value !== undefined && (
                              <Badge variant="secondary" className="ml-2 text-[10px] h-4">
                                {typeof value === 'number' ? (value > 1000 ? `$${(value/1000).toFixed(1)}K` : value.toFixed(1)) : value}
                              </Badge>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Inline Refinement Input - Feature #3 */}
                {message.analyticsResult && (
                  <div className="mt-2">
                    {showRefinement === message.id ? (
                      <div className="flex gap-2 items-center">
                        <Input
                          value={refinementInput}
                          onChange={(e) => setRefinementInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRefinement(message.id)}
                          placeholder="e.g., 'focus on Dairy only' or 'for Q1'"
                          className="text-xs h-8 w-48"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          className="h-8"
                          onClick={() => handleRefinement(message.id)}
                          disabled={!refinementInput.trim() || isLoading}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => setShowRefinement(null)}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] h-6 text-muted-foreground hover:text-primary"
                        onClick={() => setShowRefinement(message.id)}
                      >
                        <Filter className="h-3 w-3 mr-1" />
                        Refine this analysis...
                      </Button>
                    )}
                  </div>
                )}

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-2 space-y-3">
                    {/* Collapse All Button */}
                    {message.analyticsResult && (
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[10px] h-5 px-2 text-muted-foreground hover:text-primary"
                          onClick={() => collapseAllSections(message.id)}
                        >
                          <ChevronDown className={`h-3 w-3 mr-1 transition-transform ${
                            getCollapsedState(message.id).timePeriod && getCollapsedState(message.id).fineTune ? 'rotate-180' : ''
                          }`} />
                          {getCollapsedState(message.id).timePeriod && getCollapsedState(message.id).fineTune ? 'Expand all' : 'Collapse all'}
                        </Button>
                      </div>
                    )}

                    {/* Time Filter Pills - Collapsible */}
                    {message.analyticsResult && (
                      <div className="p-2 bg-secondary/30 border border-border/50 rounded-lg">
                        <CollapsibleSection
                          title="Refine by time period"
                          icon={<Clock className="h-3 w-3 text-muted-foreground" />}
                          isOpen={!getCollapsedState(message.id).timePeriod}
                          onToggle={() => toggleSection(message.id, 'timePeriod')}
                        >
                          <div className="flex flex-wrap gap-1.5">
                            {contextualPrompts.timeFilters.map((filter, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                className="text-[10px] h-6 px-2 bg-secondary/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                                onClick={() => handleSuggestionClick(`${message.analyticsResult?.sources || 'Analysis'} for ${filter.filter}`)}
                                disabled={isLoading}
                              >
                                {filter.text}
                              </Button>
                            ))}
                          </div>
                        </CollapsibleSection>
                      </div>
                    )}

                    {/* Refinement Options - Collapsible */}
                    {message.analyticsResult && (
                      <div className="p-2 bg-secondary/30 border border-border/50 rounded-lg">
                        <CollapsibleSection
                          title="Fine-tune analysis"
                          icon={<Filter className="h-3 w-3 text-muted-foreground" />}
                          isOpen={!getCollapsedState(message.id).fineTune}
                          onToggle={() => toggleSection(message.id, 'fineTune')}
                        >
                          <div className="flex flex-wrap gap-1.5">
                            {contextualPrompts.refinements.map((ref, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                className="text-[10px] h-6 px-2 bg-secondary/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                                onClick={() => handleSuggestionClick(`Show me the same analysis ${ref.filter}`)}
                                disabled={isLoading}
                              >
                                {ref.text}
                              </Button>
                            ))}
                          </div>
                        </CollapsibleSection>
                      </div>
                    )}

                    {/* Follow-up Questions */}
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                        <Compass className="h-3 w-3" />
                        Explore further:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2.5 bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                            onClick={() => handleSuggestionClick(suggestion)}
                            disabled={isLoading}
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <span className="text-[10px] text-muted-foreground">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {/* Loading indicator with progress - Feature #4 */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                <Bot className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div className="bg-secondary/50 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-foreground">{progressMessages[progressIndex].text}</span>
                  </div>
                  <div className="flex gap-1">
                    {progressMessages.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`h-1 w-6 rounded-full transition-colors ${
                          idx <= progressIndex ? 'bg-primary' : 'bg-muted'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </ScrollArea>
      </div>

      {/* Quick Actions Bar */}
      {(messages.length === 1 || (messages.length > 0 && messages.length % 5 === 0)) && !isLoading && (
        <div className="px-6 py-3 border-t border-border/50 bg-gradient-to-r from-secondary/30 to-secondary/10">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Lightbulb className="h-3 w-3 text-primary" />
            {messages.length === 1 ? "Quick starts - click to explore:" : "More ways to explore:"}
          </p>
          <div className="flex flex-wrap gap-2">
            {(messages.length === 1 ? content.quickStarts : content.exploration).map((prompt, idx) => (
              <Button
                key={idx}
                variant="secondary"
                size="sm"
                className="text-xs h-8 gap-1.5 hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => handleSuggestionClick(prompt.text)}
                disabled={isLoading}
              >
                <prompt.icon className={`h-3 w-3 ${(prompt as any).color || ''}`} />
                {prompt.text}
                <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0">{prompt.tag}</Badge>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* KPI Selector */}
      {showKPISelector && query.length > 3 && (
        <div className="px-6 py-3 border-t border-border/50 bg-secondary/10">
          <KPISelector
            question={query}
            selectedKPIs={selectedKPIs}
            onKPIsChange={setSelectedKPIs}
            isLoading={isLoading}
            moduleId={moduleId}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`text-xs ${showKPISelector ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
            onClick={() => setShowKPISelector(!showKPISelector)}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            KPIs
          </Button>
          
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={content.placeholder}
              className="pr-20 h-11 bg-secondary/30 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
              disabled={isLoading}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <VoiceRecorder 
                onTranscript={handleVoiceTranscript}
                disabled={isLoading}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSend}
            className="h-11 px-4"
            disabled={isLoading || !query.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          💬 I remember context • 🎤 Use voice • 📊 Select KPIs • 🔄 Refine any answer • 🆘 Click "Need help?" anytime
        </p>
      </div>
    </div>
  );
}
