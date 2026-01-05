import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  ChevronRight,
  Target,
  AlertTriangle,
  CheckCircle2,
  Package,
  TrendingUp,
  DollarSign,
  BarChart3,
  Truck,
  LayoutGrid
} from 'lucide-react';
import { 
  mustPassQuestions, 
  getMustPassQuestionsByModule, 
  formatMustPassQuestion,
  type MustPassQuestion 
} from '@/lib/data/must-pass-questions';

interface MustPassSuggestionsProps {
  moduleId: string;
  onSelectQuestion: (question: string) => void;
  isLoading?: boolean;
  category?: string;
  dateRange?: string;
}

const moduleIcons: Record<string, any> = {
  assortment: Package,
  demand: TrendingUp,
  pricing: DollarSign,
  promotion: Target,
  space: LayoutGrid,
  'supply-chain': Truck
};

const MustPassSuggestions = ({ 
  moduleId, 
  onSelectQuestion, 
  isLoading,
  category,
  dateRange 
}: MustPassSuggestionsProps) => {
  const [expanded, setExpanded] = useState(true);
  
  const moduleQuestions = getMustPassQuestionsByModule(moduleId);
  const Icon = moduleIcons[moduleId] || BarChart3;
  
  if (moduleQuestions.length === 0) return null;

  const handleQuestionClick = (question: MustPassQuestion) => {
    const formattedQuestion = formatMustPassQuestion(question, { category, date_range: dateRange });
    onSelectQuestion(formattedQuestion);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
      case 'high':
        return <Target className="h-3.5 w-3.5 text-yellow-500" />;
      default:
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="outline" className="text-xs bg-red-500/10 text-red-500 border-red-500/20">Critical</Badge>;
      case 'high':
        return <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-500 border-yellow-500/20">High</Badge>;
      default:
        return <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">Medium</Badge>;
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span>Must-Pass Questions</span>
            <Badge variant="secondary" className="text-xs">
              {moduleQuestions.length}
            </Badge>
          </div>
          <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </CardTitle>
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-0 space-y-2">
          <p className="text-xs text-muted-foreground mb-3">
            Critical questions that must return accurate, data-backed answers:
          </p>
          
          {moduleQuestions.map((question) => (
            <Button
              key={question.id}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-left h-auto py-3 px-3 hover:bg-primary/5 group"
              onClick={() => handleQuestionClick(question)}
              disabled={isLoading}
            >
              <div className="flex items-start gap-3 w-full">
                {getPriorityIcon(question.priority)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {formatMustPassQuestion(question, { category, date_range: dateRange })}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {getPriorityBadge(question.priority)}
                    <span className="text-xs text-muted-foreground">
                      {question.requiredKPIs.length} KPIs required
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </div>
            </Button>
          ))}
          
          <div className="pt-2 border-t mt-3">
            <p className="text-xs text-muted-foreground">
              <strong>Expected outputs:</strong> KPI cards, ranked tables, drivers, and actionable recommendations
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default MustPassSuggestions;
