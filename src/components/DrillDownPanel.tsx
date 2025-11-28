import { X, TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface DrillDownData {
  name: string;
  roi: number;
  margin: number;
}

interface DrillDownPanelProps {
  data: DrillDownData;
  onClose: () => void;
}

export default function DrillDownPanel({ data, onClose }: DrillDownPanelProps) {
  const generateDetailedMetrics = (data: DrillDownData) => {
    const baseMetrics = {
      totalSales: Math.round(data.margin * (1 + data.roi)),
      totalCost: Math.round(data.margin / data.roi),
      unitsSold: Math.round((data.margin * (1 + data.roi)) / 45),
      avgDiscount: 15 + Math.random() * 20,
      conversion: 2.5 + Math.random() * 3,
      customerCount: Math.round((data.margin * (1 + data.roi)) / 120),
    };

    const weeklyBreakdown = [
      { week: "Week 1", sales: Math.round(baseMetrics.totalSales * 0.18), units: Math.round(baseMetrics.unitsSold * 0.18) },
      { week: "Week 2", sales: Math.round(baseMetrics.totalSales * 0.28), units: Math.round(baseMetrics.unitsSold * 0.28) },
      { week: "Week 3", sales: Math.round(baseMetrics.totalSales * 0.32), units: Math.round(baseMetrics.unitsSold * 0.32) },
      { week: "Week 4", sales: Math.round(baseMetrics.totalSales * 0.22), units: Math.round(baseMetrics.unitsSold * 0.22) },
    ];

    return { ...baseMetrics, weeklyBreakdown };
  };

  const metrics = generateDetailedMetrics(data);
  const isPositive = data.roi > 2;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">{data.name}</h2>
            <p className="text-sm text-muted-foreground">Detailed Performance Breakdown</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Separator className="mb-6" />

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`h-4 w-4 ${isPositive ? 'text-status-good' : 'text-status-warning'}`} />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">ROI</span>
            </div>
            <div className={`text-2xl font-bold ${isPositive ? 'text-status-good' : 'text-status-warning'}`}>
              {data.roi.toFixed(2)}x
            </div>
          </div>

          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Margin</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              ${Math.round(data.margin).toLocaleString()}
            </div>
          </div>

          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-chart-2" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Total Sales</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              ${metrics.totalSales.toLocaleString()}
            </div>
          </div>

          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="h-4 w-4 text-chart-3" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Avg Discount</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {metrics.avgDiscount.toFixed(1)}%
            </div>
          </div>

          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-chart-4" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Units Sold</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {metrics.unitsSold.toLocaleString()}
            </div>
          </div>

          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-chart-5" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Customers</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {metrics.customerCount.toLocaleString()}
            </div>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Weekly Breakdown */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Weekly Performance</h3>
          <div className="space-y-3">
            {metrics.weeklyBreakdown.map((week, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{week.week}</div>
                  <div className="text-xs text-muted-foreground">{week.units.toLocaleString()} units sold</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-foreground">${week.sales.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {((week.sales / metrics.totalSales) * 100).toFixed(1)}% of total
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Insights */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2 text-foreground">Key Insights</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Peak performance in Week 3 with {((Math.max(...metrics.weeklyBreakdown.map(w => w.sales)) / metrics.totalSales) * 100).toFixed(1)}% of total sales</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Average order value: ${(metrics.totalSales / metrics.customerCount).toFixed(2)}</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Conversion rate: {metrics.conversion.toFixed(2)}% across all channels</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>{isPositive ? 'Strong positive' : 'Moderate'} ROI indicates {isPositive ? 'highly effective' : 'room for optimization in'} promotional strategy</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close Details
          </Button>
        </div>
      </Card>
    </div>
  );
}
