import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Lightbulb, 
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Copy,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { standardKPIDefinitions } from '@/lib/data/must-pass-questions';

interface KPICard {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  status?: 'good' | 'warning' | 'bad';
}

interface RankedItem {
  rank: number;
  name: string;
  value: string | number;
  secondaryValue?: string | number;
  priority?: 'High' | 'Medium' | 'Low';
  trend?: 'up' | 'down' | 'neutral';
  action?: string;
}

interface Driver {
  driver: string;
  impact: string;
  direction?: 'positive' | 'negative';
  delta?: string;
}

interface RecommendedAction {
  action: string;
  priority: 'High' | 'Medium' | 'Low';
  expectedImpact: string;
  rationale: string;
}

interface InsightPanelsProps {
  kpis?: KPICard[];
  rankedResults?: RankedItem[];
  drivers?: Driver[];
  recommendedActions?: RecommendedAction[];
  methodInfo?: {
    filters: string[];
    formulas: string[];
    assumptions: string[];
  };
  result?: any; // Raw result from edge function
}

const InsightPanels = ({ kpis, rankedResults, drivers, recommendedActions, methodInfo, result }: InsightPanelsProps) => {
  const [activeTab, setActiveTab] = useState('kpis');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const { toast } = useToast();

  // Build panels data from result if not provided
  const buildKPIs = (): KPICard[] => {
    if (kpis && kpis.length > 0) return kpis;
    if (!result?.kpis) return [];

    return Object.entries(result.kpis).slice(0, 6).map(([key, value]) => ({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: value as string | number,
      changeType: 'neutral' as const,
      status: 'good' as const
    }));
  };

  const buildRankedResults = (): RankedItem[] => {
    if (rankedResults && rankedResults.length > 0) return rankedResults;
    if (!result?.chartData) return [];

    return result.chartData.slice(0, 10).map((item: any, idx: number) => ({
      rank: idx + 1,
      name: item.name,
      value: item.value || item.revenue || 0,
      secondaryValue: item.margin || item.roi,
      trend: item.value > 0 ? 'up' : 'down' as const,
      priority: idx < 3 ? 'High' : idx < 6 ? 'Medium' : 'Low' as const
    }));
  };

  const buildDrivers = (): Driver[] => {
    if (drivers && drivers.length > 0) return drivers;
    if (!result?.causalDrivers) return [];

    return result.causalDrivers.map((d: any) => ({
      driver: d.driver,
      impact: d.impact,
      direction: d.direction || (d.correlation > 0 ? 'positive' : 'negative'),
      delta: d.correlation ? `${(d.correlation * 100).toFixed(0)}% correlation` : undefined
    }));
  };

  const buildActions = (): RecommendedAction[] => {
    if (recommendedActions && recommendedActions.length > 0) return recommendedActions;
    if (!result?.whatToDo) return [];

    return result.whatToDo.slice(0, 6).map((action: string, idx: number) => ({
      action: action,
      priority: idx < 2 ? 'High' : idx < 4 ? 'Medium' : 'Low' as const,
      expectedImpact: 'See analysis for details',
      rationale: 'Data-driven recommendation'
    }));
  };

  const buildMethodInfo = () => {
    if (methodInfo) return methodInfo;
    return {
      filters: ['Date Range: Last 4 weeks (default)', 'Category: All categories'],
      formulas: Object.entries(standardKPIDefinitions).slice(0, 5).map(([key, def]) => 
        `${key.replace(/_/g, ' ')}: ${def.formula}`
      ),
      assumptions: ['Data updated daily', 'Baseline calculated from non-promo periods']
    };
  };

  const kpiData = buildKPIs();
  const rankedData = buildRankedResults();
  const driverData = buildDrivers();
  const actionData = buildActions();
  const method = buildMethodInfo();

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedRankedData = [...rankedData].sort((a, b) => {
    if (!sortConfig) return 0;
    const aVal = sortConfig.key === 'name' ? a.name : Number(a.value);
    const bVal = sortConfig.key === 'name' ? b.name : Number(b.value);
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard', duration: 2000 });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Low': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'bad': return 'text-red-500';
      default: return 'text-foreground';
    }
  };

  if (!result && !kpis) {
    return null;
  }

  return (
    <div className="mt-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-5 mb-4">
          <TabsTrigger value="kpis" className="gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            KPI Snapshot
          </TabsTrigger>
          <TabsTrigger value="ranked" className="gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            Ranked Results
          </TabsTrigger>
          <TabsTrigger value="drivers" className="gap-1.5 text-xs">
            <Lightbulb className="h-3.5 w-3.5" />
            Drivers
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-1.5 text-xs">
            <Target className="h-3.5 w-3.5" />
            Actions
          </TabsTrigger>
          <TabsTrigger value="method" className="gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" />
            Method
          </TabsTrigger>
        </TabsList>

        {/* KPI Snapshot Tab */}
        <TabsContent value="kpis" className="mt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {kpiData.map((kpi, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${getStatusColor(kpi.status)}`}>
                      {typeof kpi.value === 'number' && kpi.value >= 1000 
                        ? kpi.value >= 1000000 
                          ? `$${(kpi.value / 1000000).toFixed(1)}M`
                          : `$${(kpi.value / 1000).toFixed(1)}K`
                        : kpi.value}
                    </p>
                  </div>
                  {kpi.change && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        kpi.changeType === 'positive' ? 'text-green-500 border-green-500/30' :
                        kpi.changeType === 'negative' ? 'text-red-500 border-red-500/30' :
                        'text-muted-foreground'
                      }`}
                    >
                      {kpi.changeType === 'positive' && <ArrowUpRight className="h-3 w-3 mr-0.5" />}
                      {kpi.changeType === 'negative' && <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                      {kpi.change}
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Ranked Results Tab */}
        <TabsContent value="ranked" className="mt-0">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-primary"
                    onClick={() => handleSort('name')}
                  >
                    Name
                    {sortConfig?.key === 'name' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-primary text-right"
                    onClick={() => handleSort('value')}
                  >
                    Value
                    {sortConfig?.key === 'value' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />
                    )}
                  </TableHead>
                  <TableHead className="text-center">Priority</TableHead>
                  <TableHead className="text-center">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRankedData.map((item) => (
                  <TableRow key={item.rank}>
                    <TableCell className="font-medium">{item.rank}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {typeof item.value === 'number' 
                        ? item.value >= 1000 
                          ? `$${(item.value / 1000).toFixed(1)}K`
                          : item.value.toFixed(2)
                        : item.value}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.priority && (
                        <Badge variant="outline" className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500 mx-auto" />}
                      {item.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500 mx-auto" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="mt-0">
          <div className="space-y-3">
            {driverData.map((driver, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    driver.direction === 'positive' ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}>
                    {driver.direction === 'positive' 
                      ? <TrendingUp className="h-4 w-4 text-green-500" />
                      : <TrendingDown className="h-4 w-4 text-red-500" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{driver.driver}</p>
                    <p className="text-sm text-muted-foreground mt-1">{driver.impact}</p>
                    {driver.delta && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {driver.delta}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {driverData.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No drivers identified for this analysis.</p>
            )}
          </div>
        </TabsContent>

        {/* Recommended Actions Tab */}
        <TabsContent value="actions" className="mt-0">
          <div className="space-y-3">
            {actionData.map((action, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-full ${
                      action.priority === 'High' ? 'bg-red-500/10' : 
                      action.priority === 'Medium' ? 'bg-yellow-500/10' : 'bg-green-500/10'
                    }`}>
                      {action.priority === 'High' 
                        ? <AlertTriangle className="h-4 w-4 text-red-500" />
                        : <CheckCircle2 className="h-4 w-4 text-green-500" />
                      }
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{action.action}</p>
                        <Badge variant="outline" className={getPriorityColor(action.priority)}>
                          {action.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{action.rationale}</p>
                      <p className="text-xs text-primary mt-2">
                        Expected Impact: {action.expectedImpact}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Method / Definitions Tab */}
        <TabsContent value="method" className="mt-0">
          <div className="space-y-4">
            {/* Filters Applied */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Filters Applied
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(method.filters.join('\n'))}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <ul className="space-y-1">
                {method.filters.map((filter, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {filter}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Formulas Used */}
            <Card className="p-4">
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-primary" />
                KPI Formulas
              </h4>
              <div className="space-y-2">
                {method.formulas.map((formula, idx) => (
                  <div key={idx} className="text-sm font-mono bg-muted/50 p-2 rounded">
                    {formula}
                  </div>
                ))}
              </div>
            </Card>

            {/* Assumptions */}
            <Card className="p-4">
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Assumptions
              </h4>
              <ul className="space-y-1">
                {method.assumptions.map((assumption, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    {assumption}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InsightPanels;
