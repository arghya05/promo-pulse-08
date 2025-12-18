import { useState, useRef, useEffect, useCallback } from 'react';
import { Module } from '@/lib/data/modules';
import { ModuleQuestion } from '@/lib/data/module-questions';
import { ModuleKPI } from '@/lib/data/module-kpis';
import { getModuleChatContent } from '@/lib/data/module-suggestions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  User, 
  Sparkles, 
  Loader2,
  Lightbulb,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Calendar,
  BarChart3
} from 'lucide-react';
import FormattedInsight from './FormattedInsight';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DrillBreadcrumbs from './DrillBreadcrumbs';
import ConversationContextPanel from './ConversationContextPanel';
import CrossModuleNavigator from './CrossModuleNavigator';
import { useGlobalSession, detectTargetModule } from '@/contexts/GlobalSessionContext';
import KPISelector from './KPISelector';

interface ClarificationOption {
  label: string;
  description: string;
  refinedQuestion: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  data?: any;
  drillContext?: DrillContext;
  clarificationOptions?: ClarificationOption[];
  originalQuestion?: string;
}

// Session insight for summary
interface SessionInsight {
  id: string;
  question: string;
  keyFinding: string;
  timestamp: Date;
}

// Conversation context for drilling and continuity
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

interface DrillContext {
  dimension: string;
  value: string;
  level: number;
  parentContext?: string;
}

interface ModuleChatInterfaceProps {
  module: Module;
  questions: ModuleQuestion[];
  popularQuestions: ModuleQuestion[];
  kpis: ModuleKPI[];
}

const ModuleChatInterface = ({ module, questions, popularQuestions, kpis }: ModuleChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    recentTopics: [],
    drillPath: [],
    currentDrillLevel: 0
  });
  const [sessionInsights, setSessionInsights] = useState<SessionInsight[]>([]);
  const [expandedDrillDowns, setExpandedDrillDowns] = useState<Record<string, boolean>>({});
  const [crossModuleLink, setCrossModuleLink] = useState<ReturnType<typeof detectTargetModule>>(null);
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>(kpis.slice(0, 4).map(k => k.id));
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>('last_quarter');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const Icon = module.icon;
  
  // Global session for cross-module persistence
  const { 
    addInsight, 
    getModuleInsights, 
    sharedContext, 
    updateSharedContext,
    addMemoryEntry,
    getRecentMemory,
    getSessionSummary
  } = useGlobalSession();
  
  const chatContent = getModuleChatContent(module.id);

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

  // Generate session summary - now uses global session for cross-module insights
  const generateSessionSummaryLocal = useCallback((): string => {
    // First check global session for cross-module summary
    const globalSummary = getSessionSummary();
    if (globalSummary && globalSummary !== "No insights gathered yet in this session.") {
      return globalSummary;
    }
    
    // Fall back to local session insights
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
  }, [sessionInsights, conversationContext, getSessionSummary]);

  // Reset on module change - restore shared context
  useEffect(() => {
    const greeting: Message = {
      id: 'greeting',
      role: 'assistant',
      content: chatContent.greeting,
      timestamp: new Date()
    };
    setMessages([greeting]);
    
    // Restore from shared context if available
    setConversationContext({
      lastCategory: sharedContext.lastCategory,
      lastMetric: sharedContext.lastMetric,
      lastTimePeriod: sharedContext.lastTimePeriod,
      recentTopics: sharedContext.recentTopics || [],
      drillPath: [],
      currentDrillLevel: 0
    });
    
    // Load previous insights for this module
    const moduleInsights = getModuleInsights(module.id);
    setSessionInsights(moduleInsights.map(i => ({
      id: i.id,
      question: i.question,
      keyFinding: i.keyFinding,
      timestamp: i.timestamp
    })));
    
    setCrossModuleLink(null);
  }, [module, chatContent.greeting, sharedContext, getModuleInsights]);

  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    const scrollToBottom = () => {
      // Try multiple scroll methods for reliability
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
      
      // Also try scrolling the viewport directly
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
          });
        }
      }
    };
    
    // Multiple delays to catch content render timing
    const timeoutId1 = setTimeout(scrollToBottom, 50);
    const timeoutId2 = setTimeout(scrollToBottom, 200);
    const timeoutId3 = setTimeout(scrollToBottom, 500);
    
    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, [messages, isLoading]);

  // Extract context from response for conversation continuity
  const extractContextFromResponse = useCallback((data: any, question: string) => {
    const newContext: Partial<ConversationContext> = {};
    
    // Extract category from chart data or answer
    if (data?.chartData?.length > 0) {
      const firstItem = data.chartData[0];
      if (firstItem.name) {
        const categories = ['Dairy', 'Produce', 'Beverages', 'Snacks', 'Bakery', 'Pantry', 'Frozen', 'Personal Care', 'Home Care'];
        if (categories.some(c => firstItem.name.includes(c))) {
          newContext.lastCategory = firstItem.name;
        }
      }
    }
    
    // Extract product from whatHappened
    if (data?.whatHappened) {
      const productPatterns = /(?:product|sku|item):\s*([A-Za-z0-9\s-]+)/gi;
      const match = data.whatHappened.join(' ').match(productPatterns);
      if (match) newContext.lastProduct = match[0];
    }
    
    // Extract time period from question
    const timePeriods = ['this month', 'last month', 'this quarter', 'last quarter', 'this year', 'YTD', 'last year'];
    const foundPeriod = timePeriods.find(p => question.toLowerCase().includes(p));
    if (foundPeriod) newContext.lastTimePeriod = foundPeriod;
    
    // Extract metrics mentioned
    const metrics = ['ROI', 'margin', 'revenue', 'sales', 'volume', 'units', 'forecast', 'accuracy', 'lead time', 'reliability'];
    const foundMetric = metrics.find(m => question.toLowerCase().includes(m.toLowerCase()));
    if (foundMetric) newContext.lastMetric = foundMetric;
    
    // Add topic to recent topics
    const topics = question.split(' ').filter(w => w.length > 4).slice(0, 3);
    
    return {
      ...conversationContext,
      ...newContext,
      recentTopics: [...conversationContext.recentTopics.slice(-5), ...topics]
    };
  }, [conversationContext]);

  // Build conversation history for AI context
  const buildConversationHistory = useCallback(() => {
    return messages
      .filter(m => !m.isLoading && m.id !== 'greeting')
      .slice(-6) // Last 6 messages for context
      .map(m => ({
        role: m.role,
        content: m.role === 'user' ? m.content : 
          m.data?.whatHappened?.join(' ') || m.content,
        context: m.data ? {
          kpis: m.data.kpis,
          chartDataSummary: m.data.chartData?.slice(0, 3).map((c: any) => c.name).join(', ')
        } : undefined
      }));
  }, [messages]);

  // Generate drill-down questions based on response data
  const generateDrillDownQuestions = useCallback((data: any, moduleId: string): string[] => {
    const drillQuestions: string[] = [];
    
    if (!data) return drillQuestions;
    
    // Add next questions from AI
    if (data.nextQuestions?.length > 0) {
      drillQuestions.push(...data.nextQuestions.slice(0, 2));
    }
    
    // Generate contextual drill-downs based on chart data
    if (data.chartData?.length > 0) {
      const topItem = data.chartData[0];
      const bottomItem = data.chartData[data.chartData.length - 1];
      
      switch (moduleId) {
        case 'pricing':
          if (topItem.name) drillQuestions.push(`Drill into ${topItem.name} pricing - what products drive the margin?`);
          if (conversationContext.lastCategory) drillQuestions.push(`What competitor pricing affects ${conversationContext.lastCategory}?`);
          break;
        case 'demand':
          if (topItem.name) drillQuestions.push(`Break down ${topItem.name} forecast by week - what drives demand?`);
          drillQuestions.push(`Which specific products in ${topItem.name || 'this category'} have stockout risk?`);
          break;
        case 'supply-chain':
          if (topItem.name) drillQuestions.push(`What orders from ${topItem.name} are at risk of being late?`);
          drillQuestions.push(`What's the cost breakdown for this supplier/route?`);
          break;
        case 'assortment':
          if (topItem.name) drillQuestions.push(`Which SKUs in ${topItem.name} should we discontinue?`);
          drillQuestions.push(`What brand portfolio changes would improve ${topItem.name || 'category'} performance?`);
          break;
        case 'space':
          if (topItem.name) drillQuestions.push(`What planogram changes would optimize ${topItem.name}?`);
          drillQuestions.push(`Which fixtures need reallocation for better productivity?`);
          break;
      }
    }
    
    // Add causal driver drill-down
    if (data.causalDrivers?.length > 0) {
      const topDriver = data.causalDrivers[0];
      drillQuestions.push(`Explain more about ${topDriver.driver} - how can we act on this?`);
    }
    
    return drillQuestions.slice(0, 4);
  }, [conversationContext.lastCategory]);

  // Handle drilling into specific data point
  const handleDrillInto = useCallback((dimension: string, value: string, level: number = 1) => {
    const drillQuestion = `Drill deeper into ${value} - show me the next level of detail for ${dimension}`;
    
    setConversationContext(prev => ({
      ...prev,
      drillPath: [...prev.drillPath, value],
      currentDrillLevel: level
    }));
    
    handleSend(drillQuestion, { dimension, value, level, parentContext: conversationContext.lastCategory });
  }, [conversationContext.lastCategory]);

  const handleSend = async (text: string, drillContext?: DrillContext) => {
    if (!text.trim() || isLoading) return;

    // Check for topic navigation or summary requests
    const navResult = detectTopicNavigation(text);
    
    if (navResult.type === 'summary') {
      // Handle summary request locally
      const summaryContent = generateSessionSummaryLocal();
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date()
      };
      const summaryMessage: Message = {
        id: `summary-${Date.now()}`,
        role: 'assistant',
        content: summaryContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage, summaryMessage]);
      setInput('');
      return;
    }

    // SYNC FIX: Use original text without transformation to match Classic View exactly
    const resolvedText = text;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
      drillContext
    };

    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for context continuity (same as classic view)
      const conversationHistoryForAI = messages
        .filter(m => !m.isLoading && m.id !== 'greeting')
        .slice(-6) // Last 6 messages for context
        .map(m => ({
          role: m.role,
          content: m.role === 'user' ? m.content : 
            m.data?.whatHappened?.join(' ') || m.content,
          kpis: m.data?.kpis,
          chartSummary: m.data?.chartData?.slice(0, 3).map((c: any) => c.name).join(', ')
        }));

      // Use EXACT same parameters as Classic View to ensure consistent responses
      const { data, error } = await supabase.functions.invoke('analyze-module-question', {
        body: { 
          question: resolvedText,
          moduleId: module.id,
          selectedKPIs: selectedKPIs.length > 0 ? selectedKPIs : undefined,
          timePeriod: selectedTimePeriod,
          conversationHistory: conversationHistoryForAI,
          conversationContext: {
            lastCategory: conversationContext.lastCategory,
            lastProduct: conversationContext.lastProduct,
            lastMetric: conversationContext.lastMetric,
            lastTimePeriod: conversationContext.lastTimePeriod,
            recentTopics: conversationContext.recentTopics,
            drillPath: conversationContext.drillPath,
            drillLevel: conversationContext.currentDrillLevel
          }
        }
      });

      if (error) throw error;

      // Handle clarification request - show options to user
      if (data?.needsClarification) {
        const clarificationMessage: Message = {
          id: `clarify-${Date.now()}`,
          role: 'assistant',
          content: data.clarificationPrompt || 'I need a bit more context to answer accurately:',
          timestamp: new Date(),
          clarificationOptions: data.options,
          originalQuestion: data.originalQuestion
        };
        setMessages(prev => prev.filter(m => !m.isLoading).concat(clarificationMessage));
        setIsLoading(false);
        return;
      }

      // Update conversation context from response
      const updatedContext = extractContextFromResponse(data, text);
      setConversationContext(updatedContext);

      // Extract session insight from response and store globally
      if (data?.whatHappened?.length > 0 || data?.kpis) {
        const keyFinding = data.whatHappened?.[0] || 
          (data.kpis ? `Key metrics: ${Object.entries(data.kpis).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(', ')}` : 'Analysis complete');
        
        const localInsight = {
          id: `insight-${Date.now()}`,
          question: text.length > 50 ? text.substring(0, 50) + '...' : text,
          keyFinding: keyFinding.length > 80 ? keyFinding.substring(0, 80) + '...' : keyFinding,
          timestamp: new Date()
        };
        
        setSessionInsights(prev => [...prev, localInsight]);
        
        // Also add to global session for cross-module access
        addInsight({
          moduleId: module.id,
          moduleName: module.name,
          question: localInsight.question,
          keyFinding: localInsight.keyFinding,
          timestamp: new Date(),
          context: {
            category: updatedContext.lastCategory,
            metric: updatedContext.lastMetric,
            timePeriod: updatedContext.lastTimePeriod
          }
        });
        
        // Update shared context
        updateSharedContext({
          lastCategory: updatedContext.lastCategory,
          lastMetric: updatedContext.lastMetric,
          lastTimePeriod: updatedContext.lastTimePeriod,
          recentTopics: updatedContext.recentTopics
        });
        
        // Add to extended memory
        addMemoryEntry({
          moduleId: module.id,
          role: 'user',
          content: text,
          timestamp: new Date(),
          importance: 'high'
        });
        addMemoryEntry({
          moduleId: module.id,
          role: 'assistant',
          content: keyFinding,
          timestamp: new Date(),
          importance: 'high'
        });
      }
      
      // Check for cross-module references in the question
      const crossModule = detectTargetModule(text);
      if (crossModule && crossModule.targetModuleId !== module.id) {
        setCrossModuleLink(crossModule);
      }

      // Generate drill-down questions
      const drillDownQuestions = generateDrillDownQuestions(data, module.id);
      
      // Format content with bullet points to match Classic View display
      const formatContent = () => {
        if (data?.whatHappened?.length > 0) {
          // Format as bullet points for clear display like Classic View
          return data.whatHappened.map((item: string) => `• ${item}`).join('\n\n');
        }
        return data?.answer || 'I analyzed your question. Here are the insights based on the available data.';
      };
      
      const responseMessage: Message = {
        id: `response-${Date.now()}`,
        role: 'assistant',
        content: formatContent(),
        timestamp: new Date(),
        data: {
          ...data,
          drillDownQuestions,
          conversationContext: updatedContext
        },
        drillContext
      };

      setMessages(prev => prev.filter(m => !m.isLoading).concat(responseMessage));
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `I encountered an issue analyzing your question. Please try rephrasing or ask a different question.`,
        timestamp: new Date()
      };
      setMessages(prev => prev.filter(m => !m.isLoading).concat(errorMessage));
      toast({
        title: 'Analysis Error',
        description: 'Could not complete the analysis. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionClick = (question: ModuleQuestion) => {
    handleSend(question.text);
  };

  const toggleDrillExpand = (messageId: string) => {
    setExpandedDrillDowns(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const resetConversation = () => {
    const greeting: Message = {
      id: 'greeting',
      role: 'assistant',
      content: chatContent.greeting,
      timestamp: new Date()
    };
    setMessages([greeting]);
    setConversationContext({
      recentTopics: [],
      drillPath: [],
      currentDrillLevel: 0
    });
    setSessionInsights([]);
  };

  // Handle topic click from context panel
  const handleTopicClick = useCallback((topic: string) => {
    handleSend(`Tell me more about ${topic} - what are the key insights?`);
  }, []);

  // Handle insight click from session summary
  const handleInsightClick = useCallback((insight: { id: string; question: string; keyFinding: string; timestamp: Date }) => {
    handleSend(`Go back to the analysis about: ${insight.question}`);
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
    
    // Ask a question about the selected level
    handleSend(`Show me details for ${targetItem} at level ${index + 1}`);
  }, [conversationContext.drillPath]);

  // Reset drill path to overview
  const handleDrillReset = useCallback(() => {
    setConversationContext(prev => ({
      ...prev,
      drillPath: [],
      currentDrillLevel: 0
    }));
    handleSend(`Give me an overview of ${module.name} metrics`);
  }, [module.name]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-200px)]">
      {/* Sidebar - Quick Actions */}
      <div className="lg:col-span-1 space-y-4 overflow-auto">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <span className="font-medium text-sm">Quick Start</span>
              </div>
              {messages.length > 1 && (
                <Button variant="ghost" size="sm" onClick={resetConversation} className="h-6 px-2">
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {chatContent.quickStarts.map((qs, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2 px-3 gap-2"
                  onClick={() => handleSend(qs.text)}
                  disabled={isLoading}
                >
                  <qs.icon className="h-3 w-3 flex-shrink-0 text-primary" />
                  <span className="line-clamp-2 text-xs flex-1">{qs.text}</span>
                  <Badge variant="secondary" className="text-[10px] px-1">{qs.tag}</Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time Period Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Time Period</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                { value: 'last_week', label: 'Week' },
                { value: 'last_month', label: 'Month' },
                { value: 'last_quarter', label: 'Quarter' },
                { value: 'ytd', label: 'YTD' },
                { value: 'last_year', label: 'Year' }
              ].map((period) => (
                <Button
                  key={period.value}
                  variant={selectedTimePeriod === period.value ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedTimePeriod(period.value)}
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* KPI Selector */}
        <KPISelector
          question=""
          selectedKPIs={selectedKPIs}
          onKPIsChange={setSelectedKPIs}
          isLoading={isLoading}
          moduleId={module.id}
        />

        {/* Enhanced Conversation Context Panel */}
        <ConversationContextPanel
          context={conversationContext}
          sessionInsights={sessionInsights}
          onTopicClick={handleTopicClick}
          onInsightClick={handleInsightClick}
        />
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-4 flex flex-col min-w-0 overflow-hidden">
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Cross-Module Navigation */}
          {crossModuleLink && (
            <div className="px-4 pt-3">
              <CrossModuleNavigator
                link={crossModuleLink}
                onDismiss={() => setCrossModuleLink(null)}
                currentModuleId={module.id}
              />
            </div>
          )}
          
          {/* Drill Breadcrumbs */}
          {conversationContext.drillPath.length > 0 && (
            <div className="px-4 pt-3">
              <DrillBreadcrumbs
                drillPath={conversationContext.drillPath}
                onNavigate={handleBreadcrumbNavigate}
                onReset={handleDrillReset}
                currentLevel={conversationContext.currentDrillLevel}
              />
            </div>
          )}
          
          <div ref={scrollAreaRef} className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full" style={{ height: 'calc(100vh - 280px)' }}>
              <div className="space-y-4 p-2 pr-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${module.gradient} h-fit flex-shrink-0`}>
                        <Icon className={`h-4 w-4 ${module.color}`} />
                      </div>
                    )}
                    <div
                      className={`rounded-lg p-3 min-w-0 text-left ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground max-w-[70%] ml-auto'
                          : 'bg-muted w-full max-w-full'
                      }`}
                      style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                    >
                      {message.isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Analyzing {module.name}...</span>
                        </div>
                      ) : message.clarificationOptions ? (
                        <div className="space-y-3">
                          <p className="text-sm font-medium">{message.content}</p>
                          <div className="flex flex-wrap gap-2">
                            {message.clarificationOptions.map((option, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                className="h-auto py-2 px-3 text-left hover:bg-primary/10 hover:border-primary"
                                onClick={() => handleSend(option.refinedQuestion)}
                              >
                                <div className="flex flex-col items-start">
                                  <span className="font-medium text-sm">{option.label}</span>
                                  <span className="text-xs text-muted-foreground">{option.description}</span>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Drill level indicator */}
                          {message.drillContext && (
                            <Badge variant="outline" className="mb-2 text-[10px]">
                              Level {message.drillContext.level}: {message.drillContext.value}
                            </Badge>
                          )}
                          
                          <FormattedInsight content={message.content} />
                          
                          {/* Why section */}
                          {message.data?.why && message.data.why.length > 0 && (
                            <div className="mt-3 p-2 bg-background/50 rounded text-xs" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                              <span className="font-medium">Why: </span>
                              {message.data.why.slice(0, 2).join(' ')}
                            </div>
                          )}
                          
                          {/* KPIs */}
                          {message.data?.kpis && Object.keys(message.data.kpis).length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {Object.entries(message.data.kpis).slice(0, 4).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key}: {String(value)}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {/* Charts are displayed in the right panel - Drill-down buttons for data exploration */}
                          {message.data?.chartData && message.data.chartData.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <span className="text-xs text-muted-foreground font-medium">Drill into data:</span>
                              <div className="flex flex-wrap gap-2 overflow-visible">
                                {message.data.chartData.slice(0, 6).map((item: any, idx: number) => {
                                  const name = item.name || item.label || item.category || `Item ${idx + 1}`;
                                  // Determine the primary metric and its label
                                  let metricLabel = '';
                                  let metricValue: number | undefined;
                                  let formattedValue = '';
                                  
                                  if (item.incrementalMargin !== undefined && item.incrementalMargin !== 0) {
                                    metricLabel = 'Margin';
                                    metricValue = item.incrementalMargin;
                                    formattedValue = metricValue >= 1000000 ? `$${(metricValue/1000000).toFixed(1)}M` : metricValue >= 1000 ? `$${(metricValue/1000).toFixed(0)}K` : `$${metricValue.toFixed(0)}`;
                                  } else if (item.margin !== undefined && item.margin !== 0) {
                                    metricLabel = 'Margin';
                                    metricValue = item.margin;
                                    formattedValue = metricValue >= 1000000 ? `$${(metricValue/1000000).toFixed(1)}M` : metricValue >= 1000 ? `$${(metricValue/1000).toFixed(0)}K` : `$${metricValue.toFixed(0)}`;
                                  } else if (item.revenue !== undefined && item.revenue !== 0) {
                                    metricLabel = 'Revenue';
                                    metricValue = item.revenue;
                                    formattedValue = metricValue >= 1000000 ? `$${(metricValue/1000000).toFixed(1)}M` : metricValue >= 1000 ? `$${(metricValue/1000).toFixed(0)}K` : `$${metricValue.toFixed(0)}`;
                                  } else if (item.roi !== undefined) {
                                    metricLabel = 'ROI';
                                    metricValue = item.roi;
                                    formattedValue = `${metricValue.toFixed(1)}x`;
                                  } else if (item.value !== undefined) {
                                    metricLabel = 'Value';
                                    metricValue = item.value;
                                    formattedValue = typeof metricValue === 'number' ? (metricValue >= 1000000 ? `$${(metricValue/1000000).toFixed(1)}M` : metricValue >= 1000 ? `$${(metricValue/1000).toFixed(0)}K` : metricValue.toFixed(1)) : String(metricValue);
                                  }
                                  
                                  return (
                                    <Button
                                      key={idx}
                                      variant="outline"
                                      size="sm"
                                      className="h-auto py-1.5 px-3 text-xs hover:bg-primary/10 hover:border-primary"
                                      onClick={() => handleDrillInto('item', name, 1)}
                                    >
                                      <TrendingUp className="h-3 w-3 mr-1.5 text-primary" />
                                      <span className="font-medium truncate max-w-[120px]" title={name}>{name}</span>
                                      {metricValue !== undefined && (
                                        <Badge variant="secondary" className="ml-2 text-[10px] h-5 px-1.5">
                                          <span className="text-muted-foreground mr-1">{metricLabel}:</span>
                                          <span className="font-semibold">{formattedValue}</span>
                                        </Badge>
                                      )}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Follow-up Questions - More prominent */}
                          {(message.data?.drillDownQuestions || message.data?.nextQuestions) && (
                            <div className="mt-3 space-y-2 border-t pt-3">
                              <span className="text-xs text-muted-foreground font-medium">Continue exploring:</span>
                              <div className="flex flex-col gap-2">
                                {(message.data.drillDownQuestions || message.data.nextQuestions).slice(0, 3).map((q: string, i: number) => (
                                  <Button
                                    key={i}
                                    variant="secondary"
                                    size="sm"
                                    className="w-full justify-start text-left h-auto py-2.5 px-3 text-xs hover:bg-primary/10 whitespace-normal break-words"
                                    onClick={() => handleSend(q)}
                                    disabled={isLoading}
                                  >
                                    <ChevronRight className="h-3 w-3 mr-2 text-primary flex-shrink-0 mt-0.5" />
                                    <span className="text-left leading-relaxed">{q}</span>
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="p-2 rounded-lg bg-primary/10 h-fit">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={conversationContext.lastCategory 
                  ? `Continue asking about ${conversationContext.lastCategory}...` 
                  : chatContent.placeholder}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={() => handleSend(input)} disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ModuleChatInterface;
