import { useState } from "react";
import { Search, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { questionLibrary, popularQuestionIds } from "@/lib/data/questions";
import { executeQuestion, getKPIStatus } from "@/lib/analytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { AnalyticsResult } from "@/lib/analytics";
import { useToast } from "@/components/ui/use-toast";

export default function Index() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AnalyticsResult | null>(null);
  const [showRisksOnly, setShowRisksOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
          body: JSON.stringify({ question: questionToAsk }),
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

  const handleQuestionClick = async (questionId: number) => {
    const question = questionLibrary.find(q => q.id === questionId);
    if (question) {
      await handleAsk(question.question);
    }
  };

  const popularQuestions = questionLibrary.filter(q => popularQuestionIds.includes(q.id));

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
          
          {/* Search Bar */}
          <div className="relative max-w-3xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Ask about promo ROI, optimal discount, halo effects, calendar..."
              className="pl-12 pr-24 h-14 text-base rounded-lg border-border"
            />
            <Button 
              onClick={() => handleAsk()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? "Analyzing..." : "Ask"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-8 py-8">
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

              {/* Data Insights Section */}
              <Card className="p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  DATA INSIGHTS
                </h2>
                
                {/* KPI Pills */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Lift %</div>
                    <div className={`text-3xl font-bold ${getKPIStatus("liftPct", result.kpis.liftPct) === "good" ? "text-status-good" : getKPIStatus("liftPct", result.kpis.liftPct) === "warning" ? "text-status-warning" : "text-status-bad"}`}>
                      {result.kpis.liftPct.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">ROI</div>
                    <div className={`text-3xl font-bold ${getKPIStatus("roi", result.kpis.roi) === "good" ? "text-status-good" : getKPIStatus("roi", result.kpis.roi) === "warning" ? "text-status-warning" : "text-status-bad"}`}>
                      {result.kpis.roi.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Incremental Margin</div>
                    <div className="text-3xl font-bold text-foreground">US${Math.round(result.kpis.incrementalMargin).toLocaleString()}</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Spend</div>
                    <div className="text-3xl font-bold text-foreground">US${Math.round(result.kpis.spend).toLocaleString()}</div>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-96 bg-card border border-border rounded-lg p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                        angle={-15}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px"
                        }} 
                      />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} />
                      <Bar dataKey="roi" fill="hsl(var(--chart-1))" name="ROI" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="margin" fill="hsl(var(--chart-2))" name="Margin (US$)" radius={[4, 4, 0, 0]} />
                    </BarChart>
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
                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Popular Questions</h3>
                <div className="space-y-2">
                  {popularQuestions.slice(0, 6).map(q => (
                    <button
                      key={q.id}
                      onClick={() => handleQuestionClick(q.id)}
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
              <h3 className="text-xl font-semibold mb-6">Popular Questions</h3>
              <div className="grid grid-cols-2 gap-4">
                {popularQuestions.map(q => (
                  <Card 
                    key={q.id}
                    className="p-5 cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                    onClick={() => handleQuestionClick(q.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">{q.tags[0].replace('_', ' ').toUpperCase()}</h4>
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
      </div>
    </div>
  );
}
