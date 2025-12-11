import { TrendingUp, Target, Brain, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface PredictiveInsightsProps {
  predictions?: {
    forecast: string[];
    confidence: number;
    timeframe: string;
    projectedImpact?: {
      revenue: number;
      margin: number;
      roi: number;
    };
  };
  causalDrivers?: {
    driver: string;
    impact: string;
    correlation: number;
    actionable?: string;
  }[];
  mlInsights?: {
    pattern: string;
    significance: string;
    recommendation?: string;
  }[];
}

export default function PredictiveInsights({ predictions, causalDrivers, mlInsights }: PredictiveInsightsProps) {
  if (!predictions && !causalDrivers && !mlInsights) return null;

  const getCorrelationColor = (correlation: number) => {
    const abs = Math.abs(correlation);
    if (abs >= 0.7) return "text-status-good";
    if (abs >= 0.4) return "text-status-warning";
    return "text-muted-foreground";
  };

  const getCorrelationStrength = (correlation: number) => {
    const abs = Math.abs(correlation);
    if (abs >= 0.7) return "Strong";
    if (abs >= 0.4) return "Moderate";
    return "Weak";
  };

  return (
    <div className="space-y-6">
      {/* Predictive Forecasts */}
      {predictions && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">PREDICTIVE FORECAST</h2>
            <Badge variant="secondary" className="ml-auto">
              {(predictions.confidence * 100).toFixed(0)}% Confidence
            </Badge>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Model Confidence</span>
              <span className="font-semibold">{predictions.timeframe}</span>
            </div>
            <Progress value={predictions.confidence * 100} className="h-2" />
          </div>

          <div className="space-y-4">
            {predictions.forecast.map((forecast, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                <p className="text-base leading-relaxed text-foreground">{forecast}</p>
              </div>
            ))}
          </div>

          {/* Projected Impact */}
          {predictions.projectedImpact && (
            <div className="mt-6 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Projected Impact</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-status-good/10 rounded-lg p-3 text-center">
                  <div className="text-xs text-status-good mb-1">Revenue</div>
                  <div className="text-lg font-bold text-status-good">
                    ${(predictions.projectedImpact.revenue / 1000000).toFixed(1)}M
                  </div>
                </div>
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <div className="text-xs text-primary mb-1">Margin</div>
                  <div className="text-lg font-bold text-primary">
                    ${(predictions.projectedImpact.margin / 1000).toFixed(0)}K
                  </div>
                </div>
                <div className="bg-chart-3/10 rounded-lg p-3 text-center">
                  <div className="text-xs text-chart-3 mb-1">ROI</div>
                  <div className="text-lg font-bold text-chart-3">
                    {predictions.projectedImpact.roi.toFixed(2)}x
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Causal Drivers */}
      {causalDrivers && causalDrivers.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-chart-3" />
            <h2 className="text-lg font-bold">CAUSAL DRIVERS</h2>
          </div>
          
          <div className="space-y-4">
            {causalDrivers.map((driver, idx) => (
              <div key={idx} className="bg-secondary/30 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{driver.driver}</h3>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={Math.abs(driver.correlation) >= 0.7 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {getCorrelationStrength(driver.correlation)}
                    </Badge>
                    <span className={`text-sm font-bold ${getCorrelationColor(driver.correlation)}`}>
                      {driver.correlation > 0 ? '+' : ''}{(driver.correlation * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{driver.impact}</p>
                {driver.actionable && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-sm text-primary font-medium flex items-center gap-2">
                      <span className="text-xs">💡</span>
                      {driver.actionable}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ML Insights */}
      {mlInsights && mlInsights.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-chart-4" />
            <h2 className="text-lg font-bold">ML-DETECTED PATTERNS</h2>
          </div>
          
          <div className="space-y-4">
            {mlInsights.map((insight, idx) => (
              <div key={idx} className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-2">
                  <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <h3 className="font-semibold text-foreground">{insight.pattern}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-7">
                  {insight.significance}
                </p>
                {insight.recommendation && (
                  <div className="mt-2 pl-7">
                    <p className="text-sm text-status-good font-medium flex items-center gap-2">
                      <span className="text-xs">✓</span>
                      {insight.recommendation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
