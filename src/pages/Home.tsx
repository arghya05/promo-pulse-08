import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { modules } from '@/lib/data/modules';
import { ArrowRight, Brain, Sparkles } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
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
      <section className="container mx-auto px-6 py-12">
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

        {/* Module Cards Grid */}
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
