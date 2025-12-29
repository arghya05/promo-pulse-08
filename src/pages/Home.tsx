import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { modules } from '@/lib/data/modules';
import { downloadModuleQuestions } from '@/lib/data/module-questions-export';
import { kpiLibrary, getKPIsByCategory } from '@/lib/data/kpi-library';
import { ArrowRight, Brain, Sparkles, Download, LayoutGrid, BarChart3, DollarSign, Percent, Hash, Activity } from 'lucide-react';

const formatIcon = (format: string) => {
  switch (format) {
    case 'currency': return <DollarSign className="h-4 w-4" />;
    case 'percent': return <Percent className="h-4 w-4" />;
    case 'ratio': return <Activity className="h-4 w-4" />;
    default: return <Hash className="h-4 w-4" />;
  }
};

const Home = () => {
  const navigate = useNavigate();
  const kpisByCategory = getKPIsByCategory();

  return (
    <div className="min-h-screen bg-background w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 w-full max-w-full overflow-x-hidden">
        <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Merchandising AI</h1>
              <p className="text-sm text-muted-foreground">Intelligent Retail Analytics Platform</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-screen-2xl mx-auto px-4 md:px-6 py-12">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 gap-1">
            <Sparkles className="h-3 w-3" />
            AI-Powered Analytics
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Transform Your Retail Operations
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Leverage conversational AI to optimize every aspect of your merchandising strategy.
            Ask questions in natural language and get actionable insights instantly.
          </p>
        </div>

        {/* Tabs for Modules and KPIs */}
        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="modules" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Modules
            </TabsTrigger>
            <TabsTrigger value="kpis" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              KPI Library
            </TabsTrigger>
          </TabsList>

          {/* Modules Tab Content */}
          <TabsContent value="modules">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <Card 
                    key={module.id}
                    className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-gradient-to-br ${module.gradient} border-2 hover:border-primary/30`}
                    onClick={() => navigate(module.path)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-xl bg-background/80 ${module.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <CardTitle className="mt-4">{module.name}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="ghost" 
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        Enter Module
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* KPIs Tab Content */}
          <TabsContent value="kpis">
            <div className="space-y-8">
              {Object.entries(kpisByCategory).map(([category, kpis]) => (
                <Card key={category} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      {category}
                    </CardTitle>
                    <CardDescription>{kpis.length} KPIs available</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {kpis.map((kpi) => (
                        <div key={kpi.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                              {formatIcon(kpi.format)}
                            </div>
                            <div>
                              <div className="font-medium">{kpi.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Source: {kpi.dataSource}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {kpi.format}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Total KPIs Summary */}
              <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{kpiLibrary.length}</div>
                  <div className="text-muted-foreground">Total KPIs Available Across All Categories</div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Download Section */}
      <section className="container mx-auto px-6 py-8">
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold text-lg">Download Question Library</h3>
              <p className="text-sm text-muted-foreground">Get the top 5 questions for each module as a CSV file</p>
            </div>
            <Button onClick={downloadModuleQuestions} className="gap-2">
              <Download className="h-4 w-4" />
              Download Excel/CSV
            </Button>
          </div>
        </Card>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="text-center p-6">
            <div className="text-3xl font-bold text-primary">$4B+</div>
            <div className="text-sm text-muted-foreground">Annual Revenue Analyzed</div>
          </Card>
          <Card className="text-center p-6">
            <div className="text-3xl font-bold text-primary">50</div>
            <div className="text-sm text-muted-foreground">Stores Covered</div>
          </Card>
          <Card className="text-center p-6">
            <div className="text-3xl font-bold text-primary">80+</div>
            <div className="text-sm text-muted-foreground">Product SKUs</div>
          </Card>
          <Card className="text-center p-6">
            <div className="text-3xl font-bold text-primary">64K+</div>
            <div className="text-sm text-muted-foreground">Transactions Processed</div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/30 mt-12">
        <div className="container mx-auto px-6 py-6 text-center text-sm text-muted-foreground">
          Merchandising AI Platform • Powered by Conversational Intelligence
        </div>
      </footer>
    </div>
  );
};

export default Home;
