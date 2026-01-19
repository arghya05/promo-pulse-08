import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Calendar,
  Play,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrossModulePlan, CrossModuleProblem } from '../cross-module-data';

interface MeasureTabProps {
  problem: CrossModuleProblem;
  plan: CrossModulePlan | null;
  isExecuted?: boolean;
  onRerun?: () => void;
}

// Mock measurement data
const mockMeasurementData = {
  baselineSnapshot: {
    capturedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    stockoutRisk: 18,
    dailyLoss: 18.4,
    affectedStores: 12,
  },
  currentState: {
    stockoutRisk: 6,
    dailyLoss: 4.2,
    affectedStores: 3,
  },
  forecast: {
    expectedROI: 14.8,
    realizedROI: 13.9,
    variance: -6.1,
    confidence: 82,
  },
  leadingIndicators: [
    { name: 'Fill Rate', baseline: 72, current: 89, target: 95, unit: '%', positive: true },
    { name: 'OOS Count', baseline: 18, current: 6, target: 0, unit: 'SKUs', positive: false },
    { name: 'Lost Sales', baseline: 18.4, current: 4.2, target: 0, unit: '₹L', positive: false },
    { name: 'Margin Δ', baseline: 0, current: 2.3, target: 3.0, unit: '%', positive: true },
  ],
  attribution: {
    confident: 78,
    uncertain: 22,
    notes: 'Some improvement may be attributed to natural demand fluctuation and competitor stockout.',
  },
  nextCheckIn: new Date(Date.now() + 12 * 60 * 60 * 1000),
};

export function MeasureTab({ problem, plan, isExecuted = false, onRerun }: MeasureTabProps) {
  const data = mockMeasurementData;

  // Show pre-execution state
  if (!isExecuted) {
    return (
      <div className="space-y-4">
        {/* Pre-execution notice */}
        <Card className="border-l-4 border-l-amber-400 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Awaiting Execution</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Measurement data will appear after you approve and execute a plan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What will be measured */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              What Will Be Measured
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Baseline Capture</p>
                <p className="text-sm font-medium mt-0.5">Current stockout risk & daily loss</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Forecast vs Actual</p>
                <p className="text-sm font-medium mt-0.5">Expected ROI: ₹{plan?.expectedROI || 0}L</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Leading Indicators</p>
                <p className="text-sm font-medium mt-0.5">Fill rate, OOS count, lost sales</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Attribution</p>
                <p className="text-sm font-medium mt-0.5">Confidence in causal impact</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How to proceed */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ArrowRight className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Next Step</p>
                <p className="text-xs text-muted-foreground">
                  Go to <span className="font-medium">Options</span> tab, select a plan, and click <span className="font-medium">Approve & Execute</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Post-execution measurement view
  const roiVariance = data.forecast.realizedROI - data.forecast.expectedROI;
  const roiVariancePercent = (roiVariance / data.forecast.expectedROI) * 100;

  return (
    <div className="space-y-4">
      {/* Success banner */}
      <Card className="border-l-4 border-l-green-500 bg-green-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-medium text-green-800">Execution Complete</h4>
              <p className="text-sm text-green-700">All actions executed successfully. Tracking outcomes.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forecast vs Actual Card */}
      <Card className={cn(
        "border-l-4",
        roiVariance >= 0 ? "border-l-green-500" : "border-l-amber-500"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Forecast vs Actual</span>
            <Badge variant="outline" className={cn(
              "text-[10px]",
              data.forecast.confidence >= 80 ? "text-green-600" : "text-amber-600"
            )}>
              {data.forecast.confidence}% confidence
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">₹{data.forecast.expectedROI}L</p>
              <p className="text-[10px] text-muted-foreground">Expected ROI</p>
            </div>
            <div>
              <p className={cn(
                "text-2xl font-bold",
                roiVariance >= 0 ? "text-green-600" : "text-amber-600"
              )}>
                ₹{data.forecast.realizedROI}L
              </p>
              <p className="text-[10px] text-muted-foreground">Realized ROI</p>
            </div>
            <div>
              <p className={cn(
                "text-2xl font-bold flex items-center justify-center gap-1",
                roiVariance >= 0 ? "text-green-600" : "text-amber-600"
              )}>
                {roiVariance >= 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                {roiVariancePercent.toFixed(1)}%
              </p>
              <p className="text-[10px] text-muted-foreground">Variance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Baseline vs Current */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Baseline Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="space-y-1">
              <p><span className="text-muted-foreground">Stockout Risk:</span> <span className="font-medium text-red-600">{data.baselineSnapshot.stockoutRisk} SKUs</span></p>
              <p><span className="text-muted-foreground">Daily Loss:</span> <span className="font-medium">₹{data.baselineSnapshot.dailyLoss}L</span></p>
              <p><span className="text-muted-foreground">Stores Affected:</span> <span className="font-medium">{data.baselineSnapshot.affectedStores}</span></p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Captured {formatRelativeTime(data.baselineSnapshot.capturedAt)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50/50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-green-700 flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" />
              Current State
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="space-y-1">
              <p><span className="text-muted-foreground">Stockout Risk:</span> <span className="font-medium text-green-600">{data.currentState.stockoutRisk} SKUs</span></p>
              <p><span className="text-muted-foreground">Daily Loss:</span> <span className="font-medium text-green-600">₹{data.currentState.dailyLoss}L</span></p>
              <p><span className="text-muted-foreground">Stores Affected:</span> <span className="font-medium text-green-600">{data.currentState.affectedStores}</span></p>
            </div>
            <p className="text-[10px] text-green-600 mt-2">
              ↓ {Math.round(((data.baselineSnapshot.stockoutRisk - data.currentState.stockoutRisk) / data.baselineSnapshot.stockoutRisk) * 100)}% improvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leading Indicators */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Leading Indicators</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.leadingIndicators.map(indicator => {
            const progress = indicator.positive 
              ? ((indicator.current - indicator.baseline) / (indicator.target - indicator.baseline)) * 100
              : ((indicator.baseline - indicator.current) / indicator.baseline) * 100;
            
            return (
              <div key={indicator.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{indicator.name}</span>
                  <span className="text-muted-foreground">
                    {indicator.baseline}{indicator.unit} → <span className={cn(
                      "font-medium",
                      progress >= 80 ? "text-green-600" : progress >= 50 ? "text-amber-600" : "text-red-600"
                    )}>{indicator.current}{indicator.unit}</span>
                    <span className="text-muted-foreground"> (target: {indicator.target}{indicator.unit})</span>
                  </span>
                </div>
                <Progress value={Math.min(100, Math.max(0, progress))} className="h-1.5" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Attribution */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Target className="h-4 w-4" />
            Attribution Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1">
              <div className="flex h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500" 
                  style={{ width: `${data.attribution.confident}%` }} 
                />
                <div 
                  className="bg-amber-300" 
                  style={{ width: `${data.attribution.uncertain}%` }} 
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {data.attribution.confident}% attributable
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-amber-600" />
            <p>{data.attribution.notes}</p>
          </div>
        </CardContent>
      </Card>

      {/* Next check-in */}
      <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-medium">Next Check-in</p>
            <p className="text-xs text-muted-foreground">
              Auto-scheduled for {data.nextCheckIn.toLocaleString()}
            </p>
          </div>
        </div>
        {onRerun && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onRerun}>
            <RefreshCw className="h-3.5 w-3.5" />
            Re-run Measurement
          </Button>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffH < 1) return 'just now';
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}
