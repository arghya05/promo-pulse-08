import { ChevronRight, ChevronLeft, Home, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DrillBreadcrumbsProps {
  drillPath: string[];
  onNavigate: (index: number) => void;
  onReset: () => void;
  currentLevel: number;
}

const DrillBreadcrumbs = ({ drillPath, onNavigate, onReset, currentLevel }: DrillBreadcrumbsProps) => {
  if (drillPath.length === 0) return null;

  const handleBack = () => {
    if (drillPath.length === 1) {
      onReset();
    } else {
      onNavigate(drillPath.length - 2);
    }
  };

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-secondary/30 border border-border/50 rounded-lg overflow-x-auto">
      <Button
        variant="outline"
        size="sm"
        className="h-6 px-2 text-xs flex items-center gap-1 bg-background hover:bg-accent"
        onClick={handleBack}
      >
        <ChevronLeft className="h-3 w-3" />
        <span>Back</span>
      </Button>
      
      <div className="w-px h-4 bg-border mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs flex items-center gap-1 text-muted-foreground hover:text-primary"
        onClick={onReset}
      >
        <Home className="h-3 w-3" />
        <span>Overview</span>
      </Button>
      
      {drillPath.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
          <Button
            variant={index === drillPath.length - 1 ? "secondary" : "ghost"}
            size="sm"
            className={`h-6 px-2 text-xs ${
              index === drillPath.length - 1 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'text-muted-foreground hover:text-primary'
            }`}
            onClick={() => onNavigate(index)}
          >
            {item}
          </Button>
        </div>
      ))}
      
      <Badge variant="outline" className="ml-2 text-[10px] h-5 gap-1">
        <Layers className="h-3 w-3" />
        Level {currentLevel}
      </Badge>
    </div>
  );
};

export default DrillBreadcrumbs;
