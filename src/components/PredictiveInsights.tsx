import { TrendingUp, Target, Brain, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import UniversalScrollableText from "@/components/UniversalScrollableText";

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
    scenarios?: {
      conservative: { revenue: number; margin: number; roi: number };
      expected: { revenue: number; margin: number; roi: number };
      optimistic: { revenue: number; margin: number; roi: number };
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
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Predictive Forecasts */}
      {predictions && (
        <Card className="p-6 w-full max-w-full min-w-0 overflow-x-hidden">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary flex-shrink-0" />
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

          <div className="max-h-80 overflow-y-auto overflow-x-hidden pr-2">
            <div className="space-y-4">
              {predictions.forecast.map((forecast, idx) => {
                // Handle both string format and object format {period, value, confidence}
                const forecastText = typeof forecast === 'string' 
                  ? forecast 
                  : typeof forecast === 'object' && forecast !== null
                    ? `${(forecast as any).period || ''}: ${(forecast as any).value || ''} (${((forecast as any).confidence || 0) * 100}% confidence)`
                    : String(forecast);
                
                return (
                  <div key={idx} className="flex gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <UniversalScrollableText>
                      <p className="text-base leading-relaxed text-foreground">{forecastText}</p>
                    </UniversalScrollableText>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Projected Impact */}
          {predictions.projectedImpact && (
            <div className="mt-6 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Expected Impact</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-status-good/10 rounded-lg p-3 text-center">
                  <div className="text-xs text-status-good mb-1">Revenue</div>
                  <div className="text-lg font-bold text-status-good">
                    ${predictions.projectedImpact.revenue >= 1000000 
                      ? (predictions.projectedImpact.revenue / 1000000).toFixed(1) + 'M'
                      : (predictions.projectedImpact.revenue / 1000).toFixed(0) + 'K'}
                  </div>
                </div>
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <div className="text-xs text-primary mb-1">Margin</div>
                  <div className="text-lg font-bold text-primary">
                    ${predictions.projectedImpact.margin >= 1000000 
                      ? (predictions.projectedImpact.margin / 1000000).toFixed(1) + 'M'
                      : (predictions.projectedImpact.margin / 1000).toFixed(0) + 'K'}
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

          {/* Scenario Analysis */}
          {predictions.scenarios && (
            <div className="mt-6 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Scenario Analysis</h3>
              <div className="grid grid-cols-3 gap-3">
                {/* Conservative */}
                <div className="bg-status-warning/10 border border-status-warning/20 rounded-lg p-3">
                  <div className="text-xs font-medium text-status-warning mb-2">Conservative</div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue:</span>
                      <span className="font-semibold">${(predictions.scenarios.conservative.revenue / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margin:</span>
                      <span className="font-semibold">${(predictions.scenarios.conservative.margin / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ROI:</span>
                      <span className="font-semibold">{predictions.scenarios.conservative.roi.toFixed(2)}x</span>
                    </div>
                  </div>
                </div>

                {/* Expected */}
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <div className="text-xs font-medium text-primary mb-2">Expected</div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue:</span>
                      <span className="font-semibold text-primary">${(predictions.scenarios.expected.revenue / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margin:</span>
                      <span className="font-semibold text-primary">${(predictions.scenarios.expected.margin / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ROI:</span>
                      <span className="font-semibold text-primary">{predictions.scenarios.expected.roi.toFixed(2)}x</span>
                    </div>
                  </div>
                </div>

                {/* Optimistic */}
                <div className="bg-status-good/10 border border-status-good/20 rounded-lg p-3">
                  <div className="text-xs font-medium text-status-good mb-2">Optimistic</div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue:</span>
                      <span className="font-semibold text-status-good">${(predictions.scenarios.optimistic.revenue / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margin:</span>
                      <span className="font-semibold text-status-good">${(predictions.scenarios.optimistic.margin / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ROI:</span>
                      <span className="font-semibold text-status-good">{predictions.scenarios.optimistic.roi.toFixed(2)}x</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Causal Drivers */}
      {causalDrivers && causalDrivers.length > 0 && (
        <Card className="p-6 w-full max-w-full min-w-0 overflow-x-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-chart-3 flex-shrink-0" />
            <h2 className="text-lg font-bold">CAUSAL DRIVERS</h2>
          </div>
          
          <div className="max-h-80 overflow-y-auto overflow-x-hidden pr-2">
            <div className="space-y-4">
              {causalDrivers.map((driver, idx) => (
                <div key={idx} className="bg-secondary/30 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <UniversalScrollableText>
                      <h3 className="font-semibold text-foreground">{driver.driver}</h3>
                    </UniversalScrollableText>
                    <div className="flex items-center gap-2 flex-shrink-0">
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
                  <UniversalScrollableText>
                    <p className="text-sm text-muted-foreground leading-relaxed">{driver.impact}</p>
                  </UniversalScrollableText>
                  {driver.actionable && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <UniversalScrollableText>
                        <p className="text-sm text-primary font-medium flex items-start gap-2">
                          <span className="text-xs flex-shrink-0">💡</span>
                          <span>{driver.actionable}</span>
                        </p>
                      </UniversalScrollableText>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ML Insights */}
      {mlInsights && mlInsights.length > 0 && (
        <Card className="p-6 w-full max-w-full min-w-0 overflow-x-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-chart-4 flex-shrink-0" />
            <h2 className="text-lg font-bold">ML-DETECTED PATTERNS</h2>
          </div>
          
          <div className="max-h-80 overflow-y-auto overflow-x-hidden pr-2">
            <div className="space-y-4">
              {mlInsights.map((insight, idx) => (
                <div key={idx} className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <UniversalScrollableText>
                      <h3 className="font-semibold text-foreground">{insight.pattern}</h3>
                    </UniversalScrollableText>
                  </div>
                  <div className="pl-7">
                    <UniversalScrollableText>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {insight.significance}
                      </p>
                    </UniversalScrollableText>
                  </div>
                  {insight.recommendation && (
                    <div className="mt-2 pl-7">
                      <UniversalScrollableText>
                        <p className="text-sm text-status-good font-medium flex items-start gap-2">
                          <span className="text-xs flex-shrink-0">✓</span>
                          <span>{insight.recommendation}</span>
                        </p>
                      </UniversalScrollableText>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
