import { useState } from 'react';
import { Module } from '@/lib/data/modules';
import { ModuleQuestion } from '@/lib/data/module-questions';
import { ModuleKPI } from '@/lib/data/module-kpis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Loader2, 
  Sparkles,
  TrendingUp,
  BarChart3,
  ChevronRight
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
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ModuleClassicViewProps {
  module: Module;
  questions: ModuleQuestion[];
  popularQuestions: ModuleQuestion[];
  kpis: ModuleKPI[];
}

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const ModuleClassicView = ({ module, questions, popularQuestions, kpis }: ModuleClassicViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<ModuleQuestion | null>(null);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const Icon = module.icon;

  const handleAnalyze = async (question: string) => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-module-question', {
        body: { 
          question,
          moduleId: module.id,
          selectedKPIs: kpis.slice(0, 4).map(k => k.id)
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
  };

  const handleQuestionClick = (question: ModuleQuestion) => {
    setSelectedQuestion(question);
    setSearchQuery(question.text);
    handleAnalyze(question.text);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      handleAnalyze(searchQuery);
    }
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
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Questions */}
      <div className="space-y-4">
        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Ask about ${module.name.toLowerCase()}...`}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

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
              {kpis.map((kpi) => (
                <Badge key={kpi.id} variant="outline" className="text-xs">
                  {kpi.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Results */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Analyzing your question...</p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                {/* Insights */}
                {result.whatHappened && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Key Insights
                    </h3>
                    <ul className="space-y-2">
                      {result.whatHappened.map((point: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* KPI Values */}
                {result.kpis && (
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
                    {renderChart()}
                  </div>
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
                            handleAnalyze(q);
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
