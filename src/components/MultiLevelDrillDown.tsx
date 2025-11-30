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
  type: "promotion" | "category" | "brand" | "sku" | "store" | "week";
  name: string;
  data: any;
}

interface MultiLevelDrillDownProps {
  initialData: { name: string; roi: number; margin: number };
  onClose: () => void;
}

export default function MultiLevelDrillDown({ initialData, onClose }: MultiLevelDrillDownProps) {
  const [drillPath, setDrillPath] = useState<DrillLevel[]>([
    { type: "promotion", name: initialData.name, data: initialData }
  ]);

  const currentLevel = drillPath[drillPath.length - 1];

  // Generate drill-down data based on level
  const generateDrillData = (level: DrillLevel) => {
    const baseRoi = level.data.roi || 2.5;
    const baseMargin = level.data.margin || 50000;
    
    switch (level.type) {
      case "promotion":
        return [
          { name: "Beverages", roi: baseRoi * 1.2, margin: baseMargin * 0.35, sales: baseMargin * 1.8, units: 15000 },
          { name: "Snacks", roi: baseRoi * 1.1, margin: baseMargin * 0.28, sales: baseMargin * 1.5, units: 12000 },
          { name: "Dairy", roi: baseRoi * 0.9, margin: baseMargin * 0.22, sales: baseMargin * 1.2, units: 8000 },
          { name: "Frozen", roi: baseRoi * 0.8, margin: baseMargin * 0.15, sales: baseMargin * 0.9, units: 5000 },
        ];
      case "category":
        return [
          { name: "Coca-Cola", roi: baseRoi * 1.15, margin: baseMargin * 0.35, sales: baseMargin * 1.7, units: 8000 },
          { name: "PepsiCo", roi: baseRoi * 1.05, margin: baseMargin * 0.30, sales: baseMargin * 1.5, units: 7000 },
          { name: "Dr Pepper", roi: baseRoi * 0.95, margin: baseMargin * 0.20, sales: baseMargin * 1.2, units: 4500 },
          { name: "Private Label", roi: baseRoi * 0.85, margin: baseMargin * 0.15, sales: baseMargin * 1.0, units: 3000 },
        ];
      case "brand":
        return [
          { name: "Coke-12pk", roi: baseRoi * 1.2, margin: baseMargin * 0.40, sales: baseMargin * 1.8, units: 5000 },
          { name: "Coke-2L", roi: baseRoi * 1.0, margin: baseMargin * 0.30, sales: baseMargin * 1.4, units: 3500 },
          { name: "Diet Coke-12pk", roi: baseRoi * 0.9, margin: baseMargin * 0.20, sales: baseMargin * 1.1, units: 2500 },
          { name: "Coke Zero-2L", roi: baseRoi * 0.8, margin: baseMargin * 0.10, sales: baseMargin * 0.8, units: 1500 },
        ];
      case "sku":
        return [
          { name: "Store North-001", roi: baseRoi * 1.3, margin: baseMargin * 0.25, sales: baseMargin * 1.6, units: 1500 },
          { name: "Store North-002", roi: baseRoi * 1.1, margin: baseMargin * 0.22, sales: baseMargin * 1.4, units: 1300 },
          { name: "Store South-001", roi: baseRoi * 1.0, margin: baseMargin * 0.20, sales: baseMargin * 1.2, units: 1200 },
          { name: "Store South-002", roi: baseRoi * 0.9, margin: baseMargin * 0.18, sales: baseMargin * 1.0, units: 1000 },
          { name: "Store East-001", roi: baseRoi * 0.85, margin: baseMargin * 0.15, sales: baseMargin * 0.9, units: 800 },
        ];
      case "store":
        return [
          { name: "Week 1", roi: baseRoi * 0.8, margin: baseMargin * 0.18, sales: baseMargin * 0.9, units: 250 },
          { name: "Week 2", roi: baseRoi * 1.1, margin: baseMargin * 0.28, sales: baseMargin * 1.3, units: 420 },
          { name: "Week 3", roi: baseRoi * 1.3, margin: baseMargin * 0.32, sales: baseMargin * 1.5, units: 480 },
          { name: "Week 4", roi: baseRoi * 1.0, margin: baseMargin * 0.22, sales: baseMargin * 1.1, units: 350 },
        ];
      default:
        return [];
    }
  };

  const drillDown = (item: any) => {
    const nextType = getNextLevel(currentLevel.type);
    if (nextType) {
      setDrillPath([...drillPath, { type: nextType, name: item.name, data: item }]);
    }
  };

  const getNextLevel = (currentType: string): DrillLevel["type"] | null => {
    const sequence: DrillLevel["type"][] = ["promotion", "category", "brand", "sku", "store", "week"];
    const currentIndex = sequence.indexOf(currentType as DrillLevel["type"]);
    return currentIndex < sequence.length - 1 ? sequence[currentIndex + 1] : null;
  };

  const navigateToLevel = (index: number) => {
    setDrillPath(drillPath.slice(0, index + 1));
  };

  const drillData = generateDrillData(currentLevel);
  const canDrillDeeper = currentLevel.type !== "week";

  const getLevelIcon = (type: string) => {
    switch (type) {
      case "promotion": return <BarChart3 className="h-4 w-4" />;
      case "category": return <Package className="h-4 w-4" />;
      case "brand": return <TrendingUp className="h-4 w-4" />;
      case "sku": return <Package className="h-4 w-4" />;
      case "store": return <Store className="h-4 w-4" />;
      case "week": return <Calendar className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
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
              Level {drillPath.length} of 6 • {getLevelLabel(currentLevel.type)} Analysis
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
                <TableHead className="text-right">Contribution %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drillData.map((item, idx) => {
                const totalMargin = drillData.reduce((sum, d) => sum + d.margin, 0);
                const contribution = (item.margin / totalMargin) * 100;
                const roiStatus = item.roi >= 1.5 ? "good" : item.roi >= 1 ? "warning" : "bad";
                
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
