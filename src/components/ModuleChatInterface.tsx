import { useState, useRef, useEffect } from 'react';
import { Module } from '@/lib/data/modules';
import { ModuleQuestion } from '@/lib/data/module-questions';
import { ModuleKPI } from '@/lib/data/module-kpis';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Loader2,
  Lightbulb,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  data?: any;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const Icon = module.icon;

  useEffect(() => {
    // Initial greeting
    const greeting: Message = {
      id: 'greeting',
      role: 'assistant',
      content: `Welcome to ${module.name}! I'm your AI assistant for ${module.description.toLowerCase()}. Ask me anything or try one of the suggested questions below.`,
      timestamp: new Date()
    };
    setMessages([greeting]);
  }, [module]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
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
      const { data, error } = await supabase.functions.invoke('analyze-module-question', {
        body: { 
          question: text,
          moduleId: module.id,
          selectedKPIs: kpis.slice(0, 4).map(k => k.id)
        }
      });

      if (error) throw error;

      const responseMessage: Message = {
        id: `response-${Date.now()}`,
        role: 'assistant',
        content: data?.whatHappened?.join(' ') || data?.answer || 'I analyzed your question. Here are the insights based on the available data.',
        timestamp: new Date(),
        data: data
      };

      setMessages(prev => prev.filter(m => !m.isLoading).concat(responseMessage));
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `I encountered an issue analyzing your question. This module is being set up with the necessary analytics. Please try a different question or check back soon.`,
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
      {/* Sidebar - Quick Actions */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span className="font-medium text-sm">Quick Start</span>
            </div>
            <div className="space-y-2">
              {popularQuestions.slice(0, 4).map((q) => (
                <Button
                  key={q.id}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2 px-3"
                  onClick={() => handleQuestionClick(q)}
                  disabled={isLoading}
                >
                  <span className="line-clamp-2 text-xs">{q.text}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Key KPIs</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {kpis.slice(0, 6).map((kpi) => (
                <Badge key={kpi.id} variant="secondary" className="text-xs">
                  {kpi.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-3 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${module.gradient}`}>
                      <Icon className={`h-4 w-4 ${module.color}`} />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Analyzing...</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm">{message.content}</p>
                        {message.data?.kpis && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {Object.entries(message.data.kpis).slice(0, 4).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {String(value)}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {message.data?.nextQuestions && (
                          <div className="mt-3 space-y-1">
                            {message.data.nextQuestions.map((q: string, i: number) => (
                              <Button
                                key={i}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-left h-auto py-1 px-2 text-xs"
                                onClick={() => handleSend(q)}
                              >
                                <Sparkles className="h-3 w-3 mr-2 text-primary" />
                                {q}
                              </Button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="p-2 rounded-lg bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask about ${module.name.toLowerCase()}...`}
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
