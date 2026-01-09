import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  LineChart, 
  History, 
  Lightbulb, 
  Database,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { AuditEntry } from './types';

interface EvidenceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditLog: AuditEntry[];
  assumptions: string[];
  problemId?: string;
}

export function EvidenceDrawer({
  open,
  onOpenChange,
  auditLog,
  assumptions,
  problemId
}: EvidenceDrawerProps) {
  const [activeTab, setActiveTab] = useState('evidence');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-base">Context & Evidence</SheetTitle>
        </SheetHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4 h-8">
            <TabsTrigger value="evidence" className="text-xs gap-1">
              <LineChart className="h-3 w-3" />
              Evidence
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs gap-1">
              <History className="h-3 w-3" />
              Audit
            </TabsTrigger>
            <TabsTrigger value="assumptions" className="text-xs gap-1">
              <Lightbulb className="h-3 w-3" />
              Assumptions
            </TabsTrigger>
            <TabsTrigger value="data" className="text-xs gap-1">
              <Database className="h-3 w-3" />
              Data
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-200px)] mt-4">
            <TabsContent value="evidence" className="mt-0 space-y-4">
              {/* Price Index Trend */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground">Price Index Trend</h4>
                <div className="h-24 bg-muted/30 rounded-lg flex items-center justify-center border border-dashed border-muted-foreground/20">
                  <span className="text-xs text-muted-foreground">Chart: Price vs Competition</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <TrendingUp className="h-2.5 w-2.5 text-red-500" />
                    +8% above index
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">7-day trend</Badge>
                </div>
              </div>

              <Separator />

              {/* Inventory Cover */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground">Inventory Cover</h4>
                <div className="h-24 bg-muted/30 rounded-lg flex items-center justify-center border border-dashed border-muted-foreground/20">
                  <span className="text-xs text-muted-foreground">Chart: Days of Supply</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <TrendingDown className="h-2.5 w-2.5 text-amber-500" />
                    2.3 days avg
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">18 SKUs critical</Badge>
                </div>
              </div>

              <Separator />

              {/* Competitor Delta */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground">Competitor Actions</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                    <span>Amazon</span>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <TrendingDown className="h-2.5 w-2.5 text-green-500" />
                      -5% price cut
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                    <span>Flipkart</span>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <TrendingDown className="h-2.5 w-2.5 text-green-500" />
                      -3% price cut
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                    <span>BigBasket</span>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Minus className="h-2.5 w-2.5" />
                      No change
                    </Badge>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="audit" className="mt-0 space-y-2">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex gap-3 p-2 border-l-2 border-primary/20">
                  <div className="shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium">{entry.action}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(entry.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{entry.details}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">by {entry.user}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="assumptions" className="mt-0 space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                These assumptions underpin the agent's recommendations
              </p>
              <div className="flex flex-wrap gap-2">
                {assumptions.map((assumption, i) => (
                  <Badge key={i} variant="secondary" className="text-[11px]">
                    {assumption}
                  </Badge>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="data" className="mt-0 space-y-3">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground">Data Freshness</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span>Inventory</span>
                    <span className="text-green-600">2 min ago</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span>Competitor prices</span>
                    <span className="text-green-600">15 min ago</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span>Demand forecast</span>
                    <span className="text-amber-600">2 hours ago</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span>Supplier status</span>
                    <span className="text-green-600">5 min ago</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground">Model Info</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span>Last training</span>
                    <span>Jan 7, 2026</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span>Accuracy (MAPE)</span>
                    <span>8.2%</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded">
                    <span>Features used</span>
                    <span>42</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}
