import { X, TrendingUp, TrendingDown, DollarSign, Percent, Filter, Calendar as CalendarIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { format, subDays, subWeeks, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

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
  const [timeRange, setTimeRange] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [metricFilter, setMetricFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

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

  // Apply time range filter
  const getFilteredWeeks = () => {
    let weeks = [...metrics.weeklyBreakdown];
    
    if (timeRange === "last7days") {
      weeks = weeks.slice(-1);
    } else if (timeRange === "last14days") {
      weeks = weeks.slice(-2);
    } else if (timeRange === "last21days") {
      weeks = weeks.slice(-3);
    }
    
    return weeks;
  };

  // Apply metric filter
  const shouldShowMetric = (metricName: string) => {
    if (metricFilter === "all") return true;
    if (metricFilter === "financial" && ["ROI", "Margin", "Total Sales"].includes(metricName)) return true;
    if (metricFilter === "performance" && ["Units Sold", "Avg Discount", "Customers"].includes(metricName)) return true;
    return false;
  };

  const filteredWeeks = getFilteredWeeks();
  
  const getDateRangeText = () => {
    if (timeRange === "custom" && customStartDate && customEndDate) {
      return `${format(customStartDate, "MMM d")} - ${format(customEndDate, "MMM d, yyyy")}`;
    }
    if (timeRange === "last7days") return "Last 7 days";
    if (timeRange === "last14days") return "Last 14 days";
    if (timeRange === "last21days") return "Last 21 days";
    return "All time";
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">{data.name}</h2>
            <p className="text-sm text-muted-foreground">Detailed Performance Breakdown</p>
            {(timeRange !== "all" || metricFilter !== "all") && (
              <div className="flex gap-2 mt-2">
                {timeRange !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    {getDateRangeText()}
                  </Badge>
                )}
                {metricFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs">
                    {metricFilter === "financial" ? "Financial Metrics" : "Performance Metrics"}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={cn("h-8 w-8", showFilters && "bg-primary/10")}
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="p-4 mb-6 bg-secondary/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Time Range Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Time Period</Label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="last7days">Last 7 days</SelectItem>
                    <SelectItem value="last14days">Last 14 days</SelectItem>
                    <SelectItem value="last21days">Last 21 days</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
                
                {timeRange === "custom" && (
                  <div className="flex gap-2 mt-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {customStartDate ? format(customStartDate, "MMM d") : "Start"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customStartDate}
                          onSelect={setCustomStartDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {customEndDate ? format(customEndDate, "MMM d") : "End"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customEndDate}
                          onSelect={setCustomEndDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {/* Metric Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Metrics View</Label>
                <Select value={metricFilter} onValueChange={setMetricFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metrics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All metrics</SelectItem>
                    <SelectItem value="financial">Financial only</SelectItem>
                    <SelectItem value="performance">Performance only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        )}

        <Separator className="mb-6" />

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {shouldShowMetric("ROI") && (
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`h-4 w-4 ${isPositive ? 'text-status-good' : 'text-status-warning'}`} />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">ROI</span>
              </div>
              <div className={`text-2xl font-bold ${isPositive ? 'text-status-good' : 'text-status-warning'}`}>
                {data.roi.toFixed(2)}x
              </div>
            </div>
          )}

          {shouldShowMetric("Margin") && (
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Margin</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                ${Math.round(data.margin).toLocaleString()}
              </div>
            </div>
          )}

          {shouldShowMetric("Total Sales") && (
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-chart-2" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Total Sales</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                ${metrics.totalSales.toLocaleString()}
              </div>
            </div>
          )}

          {shouldShowMetric("Avg Discount") && (
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-4 w-4 text-chart-3" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Avg Discount</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {metrics.avgDiscount.toFixed(1)}%
              </div>
            </div>
          )}

          {shouldShowMetric("Units Sold") && (
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-chart-4" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Units Sold</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {metrics.unitsSold.toLocaleString()}
              </div>
            </div>
          )}

          {shouldShowMetric("Customers") && (
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-chart-5" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Customers</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {metrics.customerCount.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        <Separator className="mb-6" />

        {/* Weekly Breakdown */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Weekly Performance
            {timeRange !== "all" && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Filtered: {filteredWeeks.length} week{filteredWeeks.length !== 1 ? 's' : ''})
              </span>
            )}
          </h3>
          <div className="space-y-3">
            {filteredWeeks.map((week, idx) => (
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
