import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Check, AlertTriangle, BookOpen, Bell, X, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageMeasureProps {
  isCompleted: boolean;
  onAcceptResults: () => void;
  onDisputeMeasurement: () => void;
  onSaveAsPlaybook: () => void;
  onCreateMonitoringRule: () => void;
  onCloseIncident: () => void;
}

const beforeAfter = [
  { metric: 'Revenue impact avoided', before: '₹18.4L at risk', after: '₹14.8L saved', change: '+80%', positive: true },
  { metric: 'Stockout SKUs', before: '18 SKUs', after: '2 SKUs', change: '-89%', positive: true },
  { metric: 'Fill rate', before: '67%', after: '94%', change: '+27pp', positive: true },
  { metric: 'Margin impact', before: '—', after: '-₹0.4L', change: 'Within budget', positive: true },
];

export function StageMeasure({ 
  isCompleted, 
  onAcceptResults, 
  onDisputeMeasurement,
  onSaveAsPlaybook,
  onCreateMonitoringRule,
  onCloseIncident
}: StageMeasureProps) {
  
  if (isCompleted) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="h-3.5 w-3.5 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              Incident closed: +₹14.8L recovered • Saved as playbook
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Before/After KPIs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <BarChart3 className="h-3 w-3" />
            Results summary
            <Badge variant="secondary" className="text-[9px] ml-1">Measurement Agent</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {beforeAfter.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-4 gap-2 p-2 rounded-md bg-muted/30 text-xs"
              >
                <span className="font-medium">{item.metric}</span>
                <span className="text-muted-foreground">{item.before}</span>
                <span className="font-semibold text-foreground">{item.after}</span>
                <div className="flex items-center gap-1">
                  {item.positive ? (
                    <ArrowUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={cn(
                    "text-[10px] font-medium",
                    item.positive ? "text-green-600" : "text-red-600"
                  )}>
                    {item.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ROI Tracker */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground">
            ROI Attribution
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div>
              <p className="text-2xl font-bold text-primary">+₹14.8L</p>
              <p className="text-xs text-muted-foreground">Realized value</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs text-muted-foreground">vs projected</span>
                <Badge variant="outline" className="text-[9px] text-green-600 border-green-200">
                  +4% above
                </Badge>
              </div>
              <Badge variant="secondary" className="text-[9px]">
                Method: Synthetic control
              </Badge>
            </div>
          </div>
          <div className="mt-3 p-2 rounded-md bg-muted/30">
            <p className="text-[10px] text-muted-foreground">
              Confidence range: ₹12.2L – ₹17.1L (95% CI)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Human Gate */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
              <BarChart3 className="h-3 w-3 text-amber-600" />
            </div>
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Review results
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              className="gap-1.5 bg-primary hover:bg-primary/90"
              onClick={onSaveAsPlaybook}
            >
              <BookOpen className="h-3 w-3" />
              Save as playbook
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="gap-1.5"
              onClick={onCreateMonitoringRule}
            >
              <Bell className="h-3 w-3" />
              Create monitoring rule
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="gap-1.5"
              onClick={onCloseIncident}
            >
              <X className="h-3 w-3" />
              Close incident
            </Button>
          </div>
          
          <div className="pt-2 border-t">
            <Button 
              size="sm" 
              variant="ghost"
              className="gap-1.5 text-muted-foreground"
              onClick={onDisputeMeasurement}
            >
              <AlertTriangle className="h-3 w-3" />
              Dispute measurement
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
