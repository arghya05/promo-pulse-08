import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  demoROIStats, 
  demoTopResults, 
  demoModelUpdates, 
  demoGuardrailSuggestion 
} from './demo-data';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  RefreshCcw,
  BarChart3,
  LineChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function ROITrackerView() {
  const [timeRange, setTimeRange] = useState('30d');
  const [category, setCategory] = useState('all');

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="apparel">Apparel</SelectItem>
            <SelectItem value="fmcg">FMCG</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Total ROI</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              ₹{demoROIStats.totalROI}L
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">ROI This Week</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              ₹{demoROIStats.roiThisWeek}L
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-muted-foreground">Success Rate</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {demoROIStats.successRate}%
            </div>
            <Progress value={demoROIStats.successRate} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Avg Time to Action</span>
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {demoROIStats.avgTimeToAction}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Expected vs Realized ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg border border-dashed">
              <div className="text-center text-muted-foreground">
                <LineChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Trend chart placeholder</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              ROI by Playbook
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg border border-dashed">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Bar chart placeholder</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Wins & Misses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Top Wins
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoTopResults.filter(r => r.isWin).map((result) => (
              <div key={result.id} className="flex items-start gap-3 p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-sm font-medium truncate">{result.title}</span>
                    <span className="text-sm font-bold text-green-600 shrink-0">+₹{result.roi}L</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{result.learning}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Top Misses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoTopResults.filter(r => !r.isWin).map((result) => (
              <div key={result.id} className="flex items-start gap-3 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <TrendingDown className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-sm font-medium truncate">{result.title}</span>
                    <span className="text-sm font-bold text-amber-600 shrink-0">₹{Math.abs(result.roi)}L</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{result.learning}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Model Learning Loop */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            Model Learning Loop
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent Updates */}
            <div>
              <h5 className="text-xs font-semibold mb-2 text-muted-foreground">Updated rules from last 7 days</h5>
              <div className="space-y-2">
                {demoModelUpdates.map((update, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                    <span>{update}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestion */}
            <div>
              <h5 className="text-xs font-semibold mb-2 text-muted-foreground">New guardrail suggestion</h5>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{demoGuardrailSuggestion.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{demoGuardrailSuggestion.reason}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
