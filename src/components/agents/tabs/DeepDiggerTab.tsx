import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Database, 
  GitBranch, 
  Table2, 
  Download, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrossModuleProblem, Signal } from '../cross-module-data';

interface DeepDiggerTabProps {
  problem: CrossModuleProblem;
  onSimulateFix?: (selectedSkus: string[]) => void;
  onExport?: () => void;
}

// Mock entity drilldown data
const mockEntityData = [
  { sku: 'ELEC-TV-55-SAM', store: 'STR-001', dc: 'DC-North', daysToOOS: 1.4, onHand: 12, inbound: 200, promoFlag: true },
  { sku: 'ELEC-MOB-IPH-15', store: 'STR-001', dc: 'DC-North', daysToOOS: 1.3, onHand: 24, inbound: 500, promoFlag: true },
  { sku: 'ELEC-LAP-MAC-M3', store: 'STR-003', dc: 'DC-West', daysToOOS: 1.6, onHand: 8, inbound: 100, promoFlag: false },
  { sku: 'ELEC-TV-55-LG', store: 'STR-042', dc: 'DC-South', daysToOOS: 3.2, onHand: 45, inbound: 0, promoFlag: false },
  { sku: 'ELEC-MOB-SAM-S24', store: 'STR-089', dc: 'DC-East', daysToOOS: 2.8, onHand: 32, inbound: 150, promoFlag: true },
];

// Driver tree nodes
interface DriverNode {
  id: string;
  label: string;
  contribution: number;
  children?: DriverNode[];
  evidence?: string;
}

export function DeepDiggerTab({ problem, onSimulateFix, onExport }: DeepDiggerTabProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Build driver tree from root causes
  const driverTree: DriverNode = {
    id: 'root',
    label: problem.title,
    contribution: 100,
    children: problem.rootCauses.map((rc, idx) => ({
      id: rc.id,
      label: rc.hypothesis.split(' ').slice(0, 6).join(' ') + '...',
      contribution: rc.probability,
      evidence: rc.evidence[0]?.title,
      children: rc.affectedModules.map(m => ({
        id: `${rc.id}-${m}`,
        label: `${m.charAt(0).toUpperCase() + m.slice(1)} impact`,
        contribution: Math.round(rc.probability * 0.4),
      })),
    })),
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const toggleSku = (sku: string) => {
    setSelectedSkus(prev => {
      const next = new Set(prev);
      if (next.has(sku)) {
        next.delete(sku);
      } else {
        next.add(sku);
      }
      return next;
    });
  };

  const renderDriverNode = (node: DriverNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="space-y-1">
        <div 
          className={cn(
            "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
            depth === 0 && "bg-primary/5"
          )}
          style={{ marginLeft: depth * 16 }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3 shrink-0" />
            ) : (
              <ChevronRight className="h-3 w-3 shrink-0" />
            )
          ) : (
            <div className="w-3" />
          )}
          
          <span className="text-sm flex-1">{node.label}</span>
          
          <Badge 
            variant="outline" 
            className={cn(
              "text-[9px]",
              node.contribution >= 80 ? "text-red-600" :
              node.contribution >= 50 ? "text-amber-600" : "text-muted-foreground"
            )}
          >
            {node.contribution}%
          </Badge>

          {node.evidence && (
            <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[9px] gap-0.5">
              <ExternalLink className="h-2.5 w-2.5" />
              evidence
            </Button>
          )}
        </div>

        {isExpanded && node.children?.map(child => renderDriverNode(child, depth + 1))}
      </div>
    );
  };

  const filteredEntities = mockEntityData.filter(e => 
    searchQuery === '' || 
    e.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.store.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Tabs defaultValue="evidence" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="evidence" className="text-xs gap-1.5">
          <Database className="h-3 w-3" />
          Evidence Ledger
        </TabsTrigger>
        <TabsTrigger value="drivers" className="text-xs gap-1.5">
          <GitBranch className="h-3 w-3" />
          Driver Tree
        </TabsTrigger>
        <TabsTrigger value="entities" className="text-xs gap-1.5">
          <Table2 className="h-3 w-3" />
          Entity Drilldown
        </TabsTrigger>
      </TabsList>

      {/* Evidence Ledger */}
      <TabsContent value="evidence" className="mt-0 space-y-3">
        <p className="text-xs text-muted-foreground">
          Audit trail of all signals with source, freshness, and reliability.
        </p>
        
        <div className="space-y-2">
          {problem.signals.map(signal => (
            <Card key={signal.id}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    signal.type === 'anomaly' ? "bg-red-100" :
                    signal.type === 'alert' ? "bg-amber-100" :
                    signal.type === 'trend' ? "bg-blue-100" : "bg-purple-100"
                  )}>
                    {signal.type === 'anomaly' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                    {signal.type === 'alert' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                    {signal.type === 'trend' && <GitBranch className="h-4 w-4 text-blue-600" />}
                    {signal.type === 'correlation' && <Database className="h-4 w-4 text-purple-600" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[9px]">{signal.type}</Badge>
                      <span className="text-xs text-muted-foreground">{signal.source}</span>
                    </div>
                    <p className="text-sm font-medium mt-1">{signal.value}</p>
                    <p className="text-xs text-muted-foreground">
                      Delta: <span className="font-medium">{signal.delta}</span>
                    </p>
                    
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatRelativeTime(signal.timestamp)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5 text-green-600" />
                        {signal.confidence}% reliable
                      </span>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1">
                    <ExternalLink className="h-2.5 w-2.5" />
                    View data
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* Driver Tree */}
      <TabsContent value="drivers" className="mt-0 space-y-3">
        <p className="text-xs text-muted-foreground">
          Root cause tree with contribution percentages. Click to expand.
        </p>
        
        <Card>
          <CardContent className="p-3">
            {renderDriverNode(driverTree)}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Entity Drilldown */}
      <TabsContent value="entities" className="mt-0 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter by SKU, store..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {onSimulateFix && selectedSkus.size > 0 && (
              <Button 
                size="sm" 
                className="text-xs gap-1.5"
                onClick={() => onSimulateFix(Array.from(selectedSkus))}
              >
                <RefreshCw className="h-3 w-3" />
                Simulate Fix ({selectedSkus.size})
              </Button>
            )}
            {onExport && (
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={onExport}>
                <Download className="h-3 w-3" />
                Export
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead className="text-xs">SKU</TableHead>
                    <TableHead className="text-xs">Store</TableHead>
                    <TableHead className="text-xs">DC</TableHead>
                    <TableHead className="text-xs text-right">Days to OOS</TableHead>
                    <TableHead className="text-xs text-right">On Hand</TableHead>
                    <TableHead className="text-xs text-right">Inbound</TableHead>
                    <TableHead className="text-xs text-center">Promo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntities.map((entity) => (
                    <TableRow 
                      key={`${entity.sku}-${entity.store}`}
                      className={cn(selectedSkus.has(entity.sku) && "bg-primary/5")}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedSkus.has(entity.sku)}
                          onCheckedChange={() => toggleSku(entity.sku)}
                        />
                      </TableCell>
                      <TableCell className="text-xs font-mono">{entity.sku}</TableCell>
                      <TableCell className="text-xs">{entity.store}</TableCell>
                      <TableCell className="text-xs">{entity.dc}</TableCell>
                      <TableCell className={cn(
                        "text-xs text-right font-medium",
                        entity.daysToOOS <= 2 ? "text-red-600" : 
                        entity.daysToOOS <= 5 ? "text-amber-600" : ""
                      )}>
                        {entity.daysToOOS.toFixed(1)}d
                      </TableCell>
                      <TableCell className="text-xs text-right">{entity.onHand}</TableCell>
                      <TableCell className="text-xs text-right">{entity.inbound || '-'}</TableCell>
                      <TableCell className="text-center">
                        {entity.promoFlag && (
                          <Badge variant="outline" className="text-[8px]">Active</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}
