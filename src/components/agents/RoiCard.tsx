import { ExpectedROI, RealizedROI } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, FlaskConical, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpectedRoiCardProps {
  roi: ExpectedROI;
}

interface RealizedRoiCardProps {
  roi: RealizedROI;
}

function MetricRow({ 
  label, 
  value, 
  isPositive 
}: { 
  label: string; 
  value: number; 
  isPositive?: boolean 
}) {
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  const colorClass = value > 0 
    ? 'text-green-600' 
    : value < 0 
      ? 'text-red-600' 
      : 'text-muted-foreground';

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-semibold flex items-center gap-1', colorClass)}>
        <Icon className="h-3 w-3" />
        {value > 0 ? '+' : ''}₹{Math.abs(value)}L
      </span>
    </div>
  );
}

export function ExpectedRoiCard({ roi }: ExpectedRoiCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          Expected ROI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <MetricRow label="Revenue uplift" value={roi.revenueUplift} />
        <MetricRow label="Margin impact" value={roi.marginImpact} />
        <MetricRow label="Cost impact" value={roi.costImpact} />
        
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Confidence</span>
            <span className="text-xs font-medium">{roi.confidence}%</span>
          </div>
          <Progress value={roi.confidence} className="h-1.5" />
        </div>

        <div className="pt-2">
          <p className="text-[10px] text-muted-foreground mb-1.5">Assumptions:</p>
          <div className="flex flex-wrap gap-1">
            {roi.assumptions.map((assumption, i) => (
              <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0">
                {assumption}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RealizedRoiCard({ roi }: RealizedRoiCardProps) {
  return (
    <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          Realized ROI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <MetricRow label="Revenue uplift" value={roi.revenueUplift} />
        <MetricRow label="Margin impact" value={roi.marginImpact} />
        <MetricRow label="Inventory effect" value={roi.inventoryEffect} />
        
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Experiment method</span>
            <Badge variant="outline" className="text-[10px]">
              {roi.experimentMethod}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
