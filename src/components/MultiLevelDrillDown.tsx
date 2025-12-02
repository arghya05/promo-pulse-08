import { useState } from "react";
import { X, ChevronRight, TrendingUp, DollarSign, Package, Store, Calendar, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DrillLevel {
  type: string;
  name: string;
  data: any;
}

interface MultiLevelDrillDownProps {
  initialData: { name: string; roi: number; margin: number };
  drillPath?: string[];
  onClose: () => void;
}

export default function MultiLevelDrillDown({ initialData, drillPath: configuredPath, onClose }: MultiLevelDrillDownProps) {
  const drillSequence = configuredPath || ["promotion", "category", "brand", "sku", "store", "week"];
  
  const [drillPath, setDrillPath] = useState<DrillLevel[]>([
    { type: drillSequence[0], name: initialData.name, data: initialData }
  ]);

  const currentLevel = drillPath[drillPath.length - 1];

  // Generate drill-down data based on level with dynamic mappings
  const generateDrillData = (level: DrillLevel) => {
    const baseRoi = level.data.roi || 2.5;
    const baseMargin = level.data.margin || 50000;
    
    // Mapping for different drill types with realistic breakdown
    const dataGenerators: Record<string, () => any[]> = {
      promotion: () => [
        { name: "Beverages", roi: baseRoi * 1.2, margin: baseMargin * 0.35, sales: baseMargin * 1.8, units: 15000 },
        { name: "Snacks", roi: baseRoi * 1.1, margin: baseMargin * 0.28, sales: baseMargin * 1.5, units: 12000 },
        { name: "Dairy", roi: baseRoi * 0.9, margin: baseMargin * 0.22, sales: baseMargin * 1.2, units: 8000 },
        { name: "Frozen", roi: baseRoi * 0.8, margin: baseMargin * 0.15, sales: baseMargin * 0.9, units: 5000 },
      ],
      category: () => [
        { name: "Coca-Cola", roi: baseRoi * 1.15, margin: baseMargin * 0.35, sales: baseMargin * 1.7, units: 8000 },
        { name: "PepsiCo", roi: baseRoi * 1.05, margin: baseMargin * 0.30, sales: baseMargin * 1.5, units: 7000 },
        { name: "Dr Pepper", roi: baseRoi * 0.95, margin: baseMargin * 0.20, sales: baseMargin * 1.2, units: 4500 },
        { name: "Private Label", roi: baseRoi * 0.85, margin: baseMargin * 0.15, sales: baseMargin * 1.0, units: 3000 },
      ],
      brand: () => [
        { name: "Coke-12pk", roi: baseRoi * 1.2, margin: baseMargin * 0.40, sales: baseMargin * 1.8, units: 5000 },
        { name: "Coke-2L", roi: baseRoi * 1.0, margin: baseMargin * 0.30, sales: baseMargin * 1.4, units: 3500 },
        { name: "Diet Coke-12pk", roi: baseRoi * 0.9, margin: baseMargin * 0.20, sales: baseMargin * 1.1, units: 2500 },
        { name: "Coke Zero-2L", roi: baseRoi * 0.8, margin: baseMargin * 0.10, sales: baseMargin * 0.8, units: 1500 },
      ],
      sku: () => [
        { name: "Store North-001", roi: baseRoi * 1.3, margin: baseMargin * 0.25, sales: baseMargin * 1.6, units: 1500 },
        { name: "Store North-002", roi: baseRoi * 1.1, margin: baseMargin * 0.22, sales: baseMargin * 1.4, units: 1300 },
        { name: "Store South-001", roi: baseRoi * 1.0, margin: baseMargin * 0.20, sales: baseMargin * 1.2, units: 1200 },
        { name: "Store South-002", roi: baseRoi * 0.9, margin: baseMargin * 0.18, sales: baseMargin * 1.0, units: 1000 },
        { name: "Store East-001", roi: baseRoi * 0.85, margin: baseMargin * 0.15, sales: baseMargin * 0.9, units: 800 },
      ],
      store: () => [
        { name: "Week 1", roi: baseRoi * 0.8, margin: baseMargin * 0.18, sales: baseMargin * 0.9, units: 250 },
        { name: "Week 2", roi: baseRoi * 1.1, margin: baseMargin * 0.28, sales: baseMargin * 1.3, units: 420 },
        { name: "Week 3", roi: baseRoi * 1.3, margin: baseMargin * 0.32, sales: baseMargin * 1.5, units: 480 },
        { name: "Week 4", roi: baseRoi * 1.0, margin: baseMargin * 0.22, sales: baseMargin * 1.1, units: 350 },
      ],
      week: () => [
        { name: "Mon-Tue", roi: baseRoi * 0.7, margin: baseMargin * 0.15, sales: baseMargin * 0.8, units: 80 },
        { name: "Wed-Thu", roi: baseRoi * 1.0, margin: baseMargin * 0.25, sales: baseMargin * 1.1, units: 120 },
        { name: "Fri-Sat", roi: baseRoi * 1.4, margin: baseMargin * 0.35, sales: baseMargin * 1.6, units: 180 },
        { name: "Sunday", roi: baseRoi * 1.2, margin: baseMargin * 0.25, sales: baseMargin * 1.3, units: 140 },
      ],
      depth: () => [
        { name: "10% Discount", roi: baseRoi * 1.4, margin: baseMargin * 1.2, sales: baseMargin * 1.8, units: 12000 },
        { name: "15% Discount", roi: baseRoi * 1.25, margin: baseMargin * 1.0, sales: baseMargin * 1.6, units: 14000 },
        { name: "20% Discount", roi: baseRoi, margin: baseMargin, sales: baseMargin * 1.4, units: 16000 },
        { name: "25% Discount", roi: baseRoi * 0.85, margin: baseMargin * 0.8, sales: baseMargin * 1.2, units: 17500 },
        { name: "30% Discount", roi: baseRoi * 0.7, margin: baseMargin * 0.6, sales: baseMargin * 1.0, units: 18500 },
      ],
      region: () => [
        { name: "North Region", roi: baseRoi * 1.3, margin: baseMargin * 0.35, sales: baseMargin * 1.7, units: 8000 },
        { name: "South Region", roi: baseRoi * 1.1, margin: baseMargin * 0.30, sales: baseMargin * 1.5, units: 7500 },
        { name: "East Region", roi: baseRoi * 0.9, margin: baseMargin * 0.20, sales: baseMargin * 1.1, units: 5000 },
        { name: "West Region", roi: baseRoi * 0.85, margin: baseMargin * 0.15, sales: baseMargin * 0.9, units: 4500 },
      ],
      customer_segment: () => [
        { name: "High-Value Shoppers", roi: baseRoi * 1.5, margin: baseMargin * 0.40, sales: baseMargin * 2.0, units: 5000 },
        { name: "Regular Customers", roi: baseRoi, margin: baseMargin * 0.35, sales: baseMargin * 1.4, units: 8000 },
        { name: "Occasional Buyers", roi: baseRoi * 0.8, margin: baseMargin * 0.15, sales: baseMargin * 0.9, units: 4000 },
        { name: "New Customers", roi: baseRoi * 0.6, margin: baseMargin * 0.10, sales: baseMargin * 0.7, units: 2000 },
      ],
      // Time-based drill levels for forecasting
      month: () => [
        { name: "January", roi: baseRoi * 0.9, margin: baseMargin * 0.22, sales: baseMargin * 1.1, units: 18000, trend: "stable" },
        { name: "February", roi: baseRoi * 1.1, margin: baseMargin * 0.26, sales: baseMargin * 1.3, units: 22000, trend: "up" },
        { name: "March", roi: baseRoi * 1.3, margin: baseMargin * 0.30, sales: baseMargin * 1.5, units: 28000, trend: "up" },
        { name: "April (forecast)", roi: baseRoi * 1.4, margin: baseMargin * 0.32, sales: baseMargin * 1.6, units: 30000, trend: "up" },
        { name: "May (forecast)", roi: baseRoi * 1.5, margin: baseMargin * 0.35, sales: baseMargin * 1.7, units: 32000, trend: "up" },
        { name: "June (forecast)", roi: baseRoi * 1.45, margin: baseMargin * 0.33, sales: baseMargin * 1.65, units: 31000, trend: "stable" },
      ],
      quarter: () => [
        { name: "Q1 2024", roi: baseRoi * 1.1, margin: baseMargin * 0.28, sales: baseMargin * 1.4, units: 68000, trend: "stable" },
        { name: "Q2 2024", roi: baseRoi * 1.3, margin: baseMargin * 0.32, sales: baseMargin * 1.6, units: 85000, trend: "up" },
        { name: "Q3 2024 (forecast)", roi: baseRoi * 1.5, margin: baseMargin * 0.36, sales: baseMargin * 1.8, units: 95000, trend: "up" },
        { name: "Q4 2024 (forecast)", roi: baseRoi * 1.7, margin: baseMargin * 0.40, sales: baseMargin * 2.0, units: 110000, trend: "up" },
      ],
      day: () => [
        { name: "Monday", roi: baseRoi * 0.7, margin: baseMargin * 0.15, sales: baseMargin * 0.8, units: 800, trend: "stable" },
        { name: "Tuesday", roi: baseRoi * 0.8, margin: baseMargin * 0.18, sales: baseMargin * 0.9, units: 950, trend: "stable" },
        { name: "Wednesday", roi: baseRoi * 1.0, margin: baseMargin * 0.23, sales: baseMargin * 1.1, units: 1200, trend: "up" },
        { name: "Thursday", roi: baseRoi * 1.1, margin: baseMargin * 0.25, sales: baseMargin * 1.2, units: 1350, trend: "up" },
        { name: "Friday", roi: baseRoi * 1.4, margin: baseMargin * 0.32, sales: baseMargin * 1.5, units: 1800, trend: "up" },
        { name: "Saturday", roi: baseRoi * 1.5, margin: baseMargin * 0.35, sales: baseMargin * 1.7, units: 2000, trend: "up" },
        { name: "Sunday", roi: baseRoi * 1.2, margin: baseMargin * 0.27, sales: baseMargin * 1.3, units: 1500, trend: "stable" },
      ],
      year: () => [
        { name: "2022", roi: baseRoi * 0.9, margin: baseMargin * 0.80, sales: baseMargin * 4.5, units: 250000, trend: "stable" },
        { name: "2023", roi: baseRoi * 1.1, margin: baseMargin * 1.0, sales: baseMargin * 5.2, units: 310000, trend: "up" },
        { name: "2024", roi: baseRoi * 1.3, margin: baseMargin * 1.15, sales: baseMargin * 5.8, units: 358000, trend: "up" },
        { name: "2025 (forecast)", roi: baseRoi * 1.5, margin: baseMargin * 1.30, sales: baseMargin * 6.5, units: 410000, trend: "up" },
      ],
    };
    
    const generator = dataGenerators[level.type];
    return generator ? generator() : [];
  };

  const drillDown = (item: any) => {
    const nextType = getNextLevel(currentLevel.type);
    if (nextType) {
      setDrillPath([...drillPath, { type: nextType, name: item.name, data: item }]);
    }
  };

  const getNextLevel = (currentType: string): string | null => {
    const currentIndex = drillSequence.indexOf(currentType);
    return currentIndex < drillSequence.length - 1 ? drillSequence[currentIndex + 1] : null;
  };

  const navigateToLevel = (index: number) => {
    setDrillPath(drillPath.slice(0, index + 1));
  };

  const drillData = generateDrillData(currentLevel);
  const canDrillDeeper = getNextLevel(currentLevel.type) !== null;

  const getLevelIcon = (type: string) => {
    const iconMap: Record<string, JSX.Element> = {
      promotion: <BarChart3 className="h-4 w-4" />,
      category: <Package className="h-4 w-4" />,
      brand: <TrendingUp className="h-4 w-4" />,
      sku: <Package className="h-4 w-4" />,
      store: <Store className="h-4 w-4" />,
      week: <Calendar className="h-4 w-4" />,
      day: <Calendar className="h-4 w-4" />,
      month: <Calendar className="h-4 w-4" />,
      quarter: <Calendar className="h-4 w-4" />,
      year: <Calendar className="h-4 w-4" />,
      depth: <DollarSign className="h-4 w-4" />,
      region: <Store className="h-4 w-4" />,
      customer_segment: <TrendingUp className="h-4 w-4" />,
    };
    return iconMap[type] || <BarChart3 className="h-4 w-4" />;
  };

  const getLevelLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {drillPath.map((level, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <Button
                    variant={index === drillPath.length - 1 ? "default" : "ghost"}
                    size="sm"
                    onClick={() => navigateToLevel(index)}
                    className="gap-2"
                  >
                    {getLevelIcon(level.type)}
                    {level.name}
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Level {drillPath.length} of {drillSequence.length} • {getLevelLabel(currentLevel.type)} Analysis
              {canDrillDeeper && " • Click any row to drill deeper"}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Separator className="mb-6" />

        {/* Summary Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-secondary/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase">ROI</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {currentLevel.data.roi?.toFixed(2)}x
            </div>
          </Card>
          <Card className="p-4 bg-secondary/50">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-chart-2" />
              <span className="text-xs text-muted-foreground uppercase">Margin</span>
            </div>
            <div className="text-2xl font-bold">
              ${Math.round(currentLevel.data.margin || 0).toLocaleString()}
            </div>
          </Card>
          <Card className="p-4 bg-secondary/50">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-chart-3" />
              <span className="text-xs text-muted-foreground uppercase">Sales</span>
            </div>
            <div className="text-2xl font-bold">
              ${Math.round((currentLevel.data.margin || 0) * (1 + (currentLevel.data.roi || 0))).toLocaleString()}
            </div>
          </Card>
          <Card className="p-4 bg-secondary/50">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-chart-4" />
              <span className="text-xs text-muted-foreground uppercase">Items</span>
            </div>
            <div className="text-2xl font-bold">
              {drillData.length}
            </div>
          </Card>
        </div>

        {/* Drill-down Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{getLevelLabel(getNextLevel(currentLevel.type) || currentLevel.type)}</TableHead>
                <TableHead className="text-right">ROI</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Units</TableHead>
                {['month', 'quarter', 'week', 'day', 'year'].includes(currentLevel.type) && (
                  <TableHead className="text-right">Trend</TableHead>
                )}
                <TableHead className="text-right">Contribution %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drillData.map((item, idx) => {
                const totalMargin = drillData.reduce((sum, d) => sum + d.margin, 0);
                const contribution = (item.margin / totalMargin) * 100;
                const roiStatus = item.roi >= 1.5 ? "good" : item.roi >= 1 ? "warning" : "bad";
                const isForecast = item.name.includes("forecast") || item.name.includes("projected");
                
                return (
                  <TableRow
                    key={idx}
                    className={canDrillDeeper ? "cursor-pointer hover:bg-accent" : ""}
                    onClick={() => canDrillDeeper && drillDown(item)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {canDrillDeeper && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        {item.name}
                        {isForecast && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Predicted
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={roiStatus === "good" ? "default" : roiStatus === "warning" ? "secondary" : "destructive"}
                      >
                        {item.roi.toFixed(2)}x
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Math.round(item.margin).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${Math.round(item.sales).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.units.toLocaleString()}
                    </TableCell>
                    {['month', 'quarter', 'week', 'day', 'year'].includes(currentLevel.type) && (
                      <TableCell className="text-right">
                        {item.trend === "up" && (
                          <Badge variant="default" className="gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Up
                          </Badge>
                        )}
                        {item.trend === "down" && (
                          <Badge variant="destructive" className="gap-1">
                            ↓ Down
                          </Badge>
                        )}
                        {item.trend === "stable" && (
                          <Badge variant="secondary" className="gap-1">
                            → Stable
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <span className="text-sm font-medium">{contribution.toFixed(1)}%</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Insights */}
        <Card className="mt-6 p-4 bg-primary/5 border-primary/20">
          <h3 className="text-sm font-semibold mb-3">Level Insights</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Best performer: <strong>{drillData[0]?.name}</strong> with {drillData[0]?.roi.toFixed(2)}x ROI</span>
            </div>
            <div className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Top {drillData.length > 2 ? "3" : drillData.length} items account for {drillData.slice(0, 3).reduce((sum, d) => sum + (d.margin / drillData.reduce((s, dd) => s + dd.margin, 0)) * 100, 0).toFixed(1)}% of margin</span>
            </div>
            {drillData.some(d => d.roi < 1) && (
              <div className="flex gap-2">
                <span className="text-destructive">⚠</span>
                <span><strong>{drillData.filter(d => d.roi < 1).length}</strong> item(s) with ROI below 1.0 need attention</span>
              </div>
            )}
            {canDrillDeeper && (
              <div className="flex gap-2">
                <span className="text-primary">💡</span>
                <span>Click any row to drill into {getLevelLabel(getNextLevel(currentLevel.type)!)} level details</span>
              </div>
            )}
          </div>
        </Card>

        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setDrillPath(drillPath.slice(0, -1))}
            disabled={drillPath.length === 1}
          >
            Back to {drillPath[drillPath.length - 2]?.name || "Previous"}
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </Card>
    </div>
  );
}
