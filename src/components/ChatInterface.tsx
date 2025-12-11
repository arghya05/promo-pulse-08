import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, ArrowRight, Lightbulb, TrendingUp, AlertTriangle, HelpCircle } from "lucide-react";
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
  type: 'user' | 'assistant' | 'suggestion';
  content: string;
  timestamp: Date;
  analyticsResult?: AnalyticsResult;
  suggestions?: string[];
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

const greetings = [
  "Hi! I'm your promotion intelligence assistant. What would you like to explore today?",
  "Hello! Ready to dive into your promotion data. What's on your mind?",
  "Welcome back! I can help you analyze ROI, find opportunities, or spot risks. Where should we start?",
];

const contextualPrompts = {
  initial: [
    { text: "Show me top performing promotions", icon: TrendingUp, tag: "PERFORMANCE" },
    { text: "Which promotions are losing money?", icon: AlertTriangle, tag: "RISK" },
    { text: "What's our overall ROI this month?", icon: Sparkles, tag: "OVERVIEW" },
    { text: "Help me optimize discount depth", icon: Lightbulb, tag: "OPTIMIZE" },
  ],
  afterAnswer: [
    "Tell me more about the top performer",
    "Why is the ROI different across regions?",
    "What should I do next?",
    "Compare this to last month",
  ],
  followUp: {
    roi: [
      "Which category has the best ROI?",
      "What's driving the ROI improvement?",
      "How can we improve low ROI promotions?",
    ],
    risk: [
      "What's causing these losses?",
      "How can we recover from these promotions?",
      "Should we cancel underperforming promotions?",
    ],
    forecast: [
      "What assumptions are these forecasts based on?",
      "How confident are you in these predictions?",
      "What could change these forecasts?",
    ],
  },
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with greeting
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      setMessages([{
        id: 'greeting',
        type: 'assistant',
        content: greeting,
        timestamp: new Date(),
        suggestions: contextualPrompts.initial.map(p => p.text),
      }]);
    }
  }, []);

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
        // Generate contextual follow-ups based on the answer
        const followUpSuggestions = generateFollowUps(currentResult);
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: generateConversationalResponse(currentResult),
          timestamp: new Date(),
          analyticsResult: currentResult,
          suggestions: followUpSuggestions,
        }]);
      }
    }
  }, [currentResult]);

  const generateConversationalResponse = (result: AnalyticsResult): string => {
    const responses = [
      `I found some interesting insights! ${result.whatHappened[0]}`,
      `Here's what the data shows: ${result.whatHappened[0]}`,
      `Based on my analysis, ${result.whatHappened[0].toLowerCase()}`,
      `Great question! ${result.whatHappened[0]}`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateFollowUps = (result: AnalyticsResult): string[] => {
    // Use nextQuestions from result if available, otherwise generate contextual ones
    if (result.nextQuestions && result.nextQuestions.length > 0) {
      return result.nextQuestions.slice(0, 3);
    }
    
    // Generate based on content
    const hasRisk = result.kpis.roi < 1 || result.whatHappened.some(w => 
      w.toLowerCase().includes('loss') || w.toLowerCase().includes('underperform')
    );
    const hasForecast = result.predictions && result.predictions.forecast.length > 0;
    
    if (hasRisk) return contextualPrompts.followUp.risk;
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

    await onAsk(query, selectedKPIs);
    setSelectedKPIs([]);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setQuery(suggestion);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: suggestion,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    await onAsk(suggestion, []);
  };

  const handleVoiceTranscript = (text: string) => {
    setQuery(text);
  };

  return (
    <div className="flex flex-col h-[600px] bg-card rounded-xl border border-border overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Promotion Intelligence Assistant</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-status-good animate-pulse" />
              {personaConfig.label} Mode • {personaConfig.categories?.length || 'All'} categories
            </p>
          </div>
        </div>
      </div>

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
              <div className={`flex flex-col gap-2 max-w-[80%] ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-secondary/50 text-foreground rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 px-3 bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={isLoading}
                      >
                        <ArrowRight className="h-3 w-3 mr-1.5" />
                        {suggestion}
                      </Button>
                    ))}
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

      {/* Quick Actions Bar */}
      {messages.length === 1 && (
        <div className="px-6 py-3 border-t border-border/50 bg-secondary/20">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Quick starts:
          </p>
          <div className="flex flex-wrap gap-2">
            {contextualPrompts.initial.map((prompt, idx) => (
              <Button
                key={idx}
                variant="secondary"
                size="sm"
                className="text-xs h-8 gap-1.5"
                onClick={() => handleSuggestionClick(prompt.text)}
                disabled={isLoading}
              >
                <prompt.icon className="h-3 w-3" />
                {prompt.text}
                <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0">{prompt.tag}</Badge>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* KPI Selector (expandable) */}
      {showKPISelector && query.length > 5 && (
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
      <div className="px-6 py-4 border-t border-border bg-background/50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`text-xs ${showKPISelector ? 'text-primary' : 'text-muted-foreground'}`}
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
              placeholder="Ask me anything about your promotions..."
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
          Press Enter to send • Click suggestions for quick analysis • Use voice for hands-free
        </p>
      </div>
    </div>
  );
}
