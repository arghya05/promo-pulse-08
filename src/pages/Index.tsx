import { useState } from "react";
import { Search, BarChart3, TrendingUp, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { questionLibrary, popularQuestionIds } from "@/lib/data/questions";
import { executeQuestion, getKPIStatus } from "@/lib/analytics";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { AnalyticsResult } from "@/lib/analytics";

export default function Index() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AnalyticsResult | null>(null);
  const [showRisksOnly, setShowRisksOnly] = useState(false);

  const handleQuestionClick = (questionId: number) => {
    const question = questionLibrary.find(q => q.id === questionId);
    if (question) {
      setQuery(question.question);
      const analyticsResult = executeQuestion(question);
      setResult(analyticsResult);
    }
  };

  const popularQuestions = questionLibrary.filter(q => popularQuestionIds.includes(q.id));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Promotion Intelligence</h1>
              <p className="text-sm text-muted-foreground">Ask about discounts, ROI, lift, halo, coupons...</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowRisksOnly(!showRisksOnly)}>
                <Filter className="mr-2 h-4 w-4" />
                {showRisksOnly ? "Show All" : "Risks Only"}
              </Button>
              <Button variant="outline" size="sm">Reset Demo Data</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about promo ROI, optimal discount, halo, calendar..."
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel */}
          <div className="col-span-3 space-y-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 text-sm">Popular Questions</h3>
              <div className="space-y-2">
                {popularQuestions.map(q => (
                  <button
                    key={q.id}
                    onClick={() => handleQuestionClick(q.id)}
                    className="w-full text-left text-sm p-2 rounded hover:bg-accent transition-colors"
                  >
                    {q.question}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3 text-sm">Views</h3>
              <div className="space-y-2">
                {["Promo Calendar", "Leaders & Laggards", "Halo & Cannibalization", "Coupon Funnel", "Depth Optimizer"].map(view => (
                  <button key={view} className="w-full text-left text-sm p-2 rounded hover:bg-accent transition-colors flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {view}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Result Viewer */}
          <div className="col-span-9">
            {result ? (
              <Card className="p-6">
                <div className="space-y-6">
                  {/* Insight */}
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="bg-primary/10 p-2 rounded mr-3">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2 text-sm">
                        <p><strong>What happened:</strong> {result.whatHappened}</p>
                        <p><strong>Why:</strong> {result.why}</p>
                        <p><strong>What to do:</strong> {result.whatToDo}</p>
                      </div>
                    </div>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="border border-border rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-1">Lift %</div>
                      <div className={`text-2xl font-bold ${getKPIStatus("liftPct", result.kpis.liftPct) === "good" ? "text-status-good" : getKPIStatus("liftPct", result.kpis.liftPct) === "warning" ? "text-status-warning" : "text-status-bad"}`}>
                        {result.kpis.liftPct.toFixed(1)}%
                      </div>
                    </div>
                    <div className="border border-border rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-1">ROI</div>
                      <div className={`text-2xl font-bold ${getKPIStatus("roi", result.kpis.roi) === "good" ? "text-status-good" : getKPIStatus("roi", result.kpis.roi) === "warning" ? "text-status-warning" : "text-status-bad"}`}>
                        {result.kpis.roi.toFixed(2)}
                      </div>
                    </div>
                    <div className="border border-border rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-1">Incremental Margin</div>
                      <div className="text-2xl font-bold text-foreground">US${Math.round(result.kpis.incrementalMargin).toLocaleString()}</div>
                    </div>
                    <div className="border border-border rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-1">Spend</div>
                      <div className="text-2xl font-bold text-foreground">US${Math.round(result.kpis.spend).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="h-80 border border-border rounded-lg p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={result.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                        <Legend />
                        <Bar dataKey="roi" fill="hsl(var(--chart-1))" name="ROI" />
                        <Bar dataKey="margin" fill="hsl(var(--chart-2))" name="Margin (US$)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Follow-ups & Sources */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex gap-2">
                      {result.followups.map((fu, idx) => (
                        <Button key={idx} variant="outline" size="sm">{fu}</Button>
                      ))}
                    </div>
                    <Badge variant="outline" className="text-xs">{result.sources}</Badge>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Ask a question or select one from the left</h3>
                <p className="text-muted-foreground">Get instant insights about your promotion performance</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
