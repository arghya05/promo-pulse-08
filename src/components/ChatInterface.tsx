import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, ArrowRight, Lightbulb, TrendingUp, AlertTriangle, HelpCircle, Target, Compass, ChevronRight, Zap, BarChart3, PieChart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import VoiceRecorder from "./VoiceRecorder";
import KPISelector from "./KPISelector";
import type { AnalyticsResult } from "@/lib/analytics";

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'suggestion' | 'guide';
  content: string;
  timestamp: Date;
  analyticsResult?: AnalyticsResult;
  suggestions?: string[];
  guideTip?: string;
  actionButtons?: { label: string; question: string; icon: string }[];
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
}

const personaContent = {
  executive: {
    greetings: [
      "👋 Hi! I'm your executive insights assistant. I can help you see the big picture across all categories and regions. What strategic question can I answer?",
      "Welcome! Ready to provide high-level insights on portfolio performance, cross-category trends, and strategic opportunities.",
      "Hello! Let's explore your promotion performance from a strategic lens - ROI trends, category comparisons, and growth opportunities await.",
    ],
    quickStarts: [
      { text: "Portfolio ROI overview", icon: TrendingUp, tag: "STRATEGIC", color: "text-primary" },
      { text: "Cross-category performance comparison", icon: BarChart3, tag: "COMPARE", color: "text-status-good" },
      { text: "Which categories need attention?", icon: AlertTriangle, tag: "RISK", color: "text-status-bad" },
      { text: "Forecast next quarter's performance", icon: Target, tag: "FORECAST", color: "text-status-warning" },
    ],
    exploration: [
      { text: "Regional performance gaps", icon: BarChart3, tag: "REGIONS" },
      { text: "YoY trend analysis", icon: TrendingUp, tag: "TRENDS" },
      { text: "Budget allocation recommendations", icon: Compass, tag: "OPTIMIZE" },
      { text: "Competitive positioning", icon: PieChart, tag: "MARKET" },
    ],
    tips: [
      "💡 As an executive, I focus on high-level metrics across both consumables and non-consumables",
      "📊 Ask me about portfolio-wide ROI, cross-category comparisons, or strategic forecasts",
      "🎯 I can help identify which categories or regions need strategic intervention",
    ],
  },
  "category-consumables": {
    greetings: [
      "👋 Hi! I'm your consumables category assistant. I specialize in Dairy, Produce, Beverages, Snacks, Bakery, Pantry, and Frozen. What would you like to analyze?",
      "Welcome, Category Manager! Ready to dive deep into your consumables performance - from dairy promotions to beverage trends.",
      "Hello! Let's optimize your consumables portfolio together. I can analyze promotion ROI, lift, and opportunities across your categories.",
    ],
    quickStarts: [
      { text: "Top performing consumables promotions", icon: TrendingUp, tag: "WINNERS", color: "text-status-good" },
      { text: "Which consumables promotions are losing money?", icon: AlertTriangle, tag: "RISK", color: "text-status-bad" },
      { text: "Dairy vs Beverages ROI comparison", icon: BarChart3, tag: "COMPARE", color: "text-primary" },
      { text: "Optimal discount depth for Snacks", icon: Lightbulb, tag: "OPTIMIZE", color: "text-status-warning" },
    ],
    exploration: [
      { text: "Seasonal patterns in consumables", icon: TrendingUp, tag: "SEASONAL" },
      { text: "Bakery promotion opportunities", icon: Compass, tag: "DISCOVER" },
      { text: "Fresh category cannibalization", icon: PieChart, tag: "HALO" },
      { text: "Pantry stock-up promotion ideas", icon: Lightbulb, tag: "IDEAS" },
    ],
    tips: [
      "💡 I focus on consumables: Dairy, Produce, Beverages, Snacks, Bakery, Pantry, Frozen",
      "🥛 Ask about specific categories like 'How is Dairy BOGO performing?' for detailed analysis",
      "📈 I can help optimize promotion timing around freshness and seasonal demand",
    ],
  },
  "category-non-consumables": {
    greetings: [
      "👋 Hi! I'm your non-consumables category assistant. I specialize in Personal Care and Home Care products. What insights do you need?",
      "Welcome, Category Manager! Ready to analyze your Personal Care and Home Care promotions - from detergents to skincare.",
      "Hello! Let's optimize your non-consumables portfolio. I can help with promotion ROI, customer response, and competitive positioning.",
    ],
    quickStarts: [
      { text: "Top non-consumables promotions by ROI", icon: TrendingUp, tag: "WINNERS", color: "text-status-good" },
      { text: "Underperforming Personal Care promotions", icon: AlertTriangle, tag: "RISK", color: "text-status-bad" },
      { text: "Personal Care vs Home Care comparison", icon: BarChart3, tag: "COMPARE", color: "text-primary" },
      { text: "Best discount depth for Home Care", icon: Lightbulb, tag: "OPTIMIZE", color: "text-status-warning" },
    ],
    exploration: [
      { text: "Detergent promotion effectiveness", icon: TrendingUp, tag: "ANALYZE" },
      { text: "Shampoo brand performance", icon: Compass, tag: "BRANDS" },
      { text: "Cross-sell with consumables", icon: PieChart, tag: "HALO" },
      { text: "Premium vs value tier response", icon: Lightbulb, tag: "SEGMENT" },
    ],
    tips: [
      "💡 I focus on non-consumables: Personal Care (soaps, shampoos, skincare) and Home Care (detergents, cleaners)",
      "🧴 Non-consumables often have different purchase cycles - ask about timing optimization",
      "📊 I can analyze brand-level performance within your categories",
    ],
  },
};

const getPersonaKey = (persona: string): keyof typeof personaContent => {
  if (persona === 'executive') return 'executive';
  if (persona === 'category-consumables') return 'category-consumables';
  return 'category-non-consumables';
};

const contextualPrompts = {
  afterAnswer: [
    "Tell me more about the top performer",
    "Why is this happening?",
    "What should I do next?",
    "Compare this to other categories",
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
  needHelp: [
    { text: "What can I ask you?", icon: HelpCircle },
    { text: "Explain promotion ROI", icon: Lightbulb },
    { text: "How do I read the charts?", icon: BarChart3 },
    { text: "What data do you have?", icon: Compass },
  ],
};

export default function ChatInterface({ 
  persona, 
  personaConfig, 
  onAsk, 
  isLoading, 
  currentResult 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [showKPISelector, setShowKPISelector] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [lastPersona, setLastPersona] = useState(persona);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const personaKey = getPersonaKey(persona);
  const content = personaContent[personaKey];

  // Initialize with greeting - reset when persona changes
  useEffect(() => {
    if (messages.length === 0 || persona !== lastPersona) {
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
      setMessageCount(0);
    }
  }, [persona, content]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Update messages when result changes
  useEffect(() => {
    if (currentResult && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === 'user') {
        const followUpSuggestions = generateFollowUps(currentResult);
        const response = generateConversationalResponse(currentResult);
        const tip = generateContextualTip(currentResult, messageCount);
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: response,
          timestamp: new Date(),
          analyticsResult: currentResult,
          suggestions: followUpSuggestions,
          guideTip: tip,
          actionButtons: generateActionButtons(currentResult),
        }]);
        
        setMessageCount(prev => prev + 1);
      }
    }
  }, [currentResult]);

  const generateConversationalResponse = (result: AnalyticsResult): string => {
    const hasGoodROI = result.kpis.roi >= 1.5;
    const hasBadROI = result.kpis.roi < 1;
    const hasLift = result.kpis.liftPct && result.kpis.liftPct > 15;
    
    if (hasBadROI) {
      return `⚠️ I found some areas that need attention. ${result.whatHappened[0]} Would you like me to help identify what's causing this and how to fix it?`;
    }
    if (hasGoodROI && hasLift) {
      return `🎉 Great news! ${result.whatHappened[0]} This is performing well - let me help you understand why and how to replicate it.`;
    }
    if (hasGoodROI) {
      return `✅ Here's what I found: ${result.whatHappened[0]} Want me to dive deeper into any specific aspect?`;
    }
    
    const responses = [
      `📊 Here's my analysis: ${result.whatHappened[0]} I can help you explore this further - just ask!`,
      `🔍 Based on the data: ${result.whatHappened[0]} Would you like to drill down into specifics?`,
      `💡 Interesting findings: ${result.whatHappened[0]} Let me know if you want more details on any part.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateContextualTip = (result: AnalyticsResult, count: number): string | undefined => {
    // Show tips periodically to guide users
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
    
    return buttons.slice(0, 2); // Max 2 buttons
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

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery("");
    setShowKPISelector(false);
    setShowHelpMenu(false);

    await onAsk(query, selectedKPIs);
    setSelectedKPIs([]);
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
    // Pass current selectedKPIs instead of empty array
    await onAsk(suggestion, selectedKPIs);
  };

  const handleVoiceTranscript = (text: string) => {
    setQuery(text);
  };

  return (
    <div className="flex flex-col h-[650px] bg-card rounded-xl border border-border overflow-hidden shadow-lg">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/20">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                Promotion Intelligence Assistant
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">AI</Badge>
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-status-good animate-pulse" />
                {personaConfig.label} • Ready to help
              </p>
            </div>
          </div>
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

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground'
              }`}>
                {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Message Content */}
              <div className={`flex flex-col gap-2 max-w-[85%] ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-secondary/50 text-foreground rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>

                {/* Guide Tip */}
                {message.guideTip && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg max-w-full">
                    <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">{message.guideTip}</p>
                  </div>
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

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-2">
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
                )}

                {/* Timestamp */}
                <span className="text-[10px] text-muted-foreground">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                <Bot className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div className="bg-secondary/50 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-muted-foreground">Analyzing your data...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions Bar - Show on initial or when exploration is needed */}
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

      {/* KPI Selector (expandable) */}
      {showKPISelector && query.length > 3 && (
        <div className="px-6 py-3 border-t border-border/50 bg-secondary/10">
          <KPISelector
            question={query}
            selectedKPIs={selectedKPIs}
            onKPIsChange={setSelectedKPIs}
            isLoading={isLoading}
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
              placeholder="Ask anything about promotions, ROI, forecasts, risks..."
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
          💬 Just type naturally • 🎤 Use voice • 📊 Select KPIs for focused analysis • 🆘 Click "Need help?" anytime
        </p>
      </div>
    </div>
  );
}