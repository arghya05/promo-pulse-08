import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, Home } from 'lucide-react';
import { Module } from '@/lib/data/modules';

interface ModuleLayoutProps {
  module: Module;
  children: ReactNode;
}

const ModuleLayout = ({ module, children }: ModuleLayoutProps) => {
  const navigate = useNavigate();
  const Icon = module.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <Home className="h-4 w-4" />
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${module.gradient}`}>
                  <Icon className={`h-5 w-5 ${module.color}`} />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">{module.name}</h1>
                  <p className="text-xs text-muted-foreground">{module.description}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Brain className="h-4 w-4" />
              <span>Merchandising AI</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main>
        {children}
      </main>
    </div>
  );
};

export default ModuleLayout;
