import { useState } from 'react';
import { Run } from './types';
import { demoRuns } from './demo-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  RotateCcw, 
  CheckCircle, 
  Loader2, 
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const statusConfig: Record<Run['status'], { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-amber-500/10 text-amber-600' },
  running: { label: 'Running', icon: Loader2, className: 'bg-blue-500/10 text-blue-600' },
  completed: { label: 'Completed', icon: CheckCircle, className: 'bg-green-500/10 text-green-600' },
  failed: { label: 'Failed', icon: XCircle, className: 'bg-red-500/10 text-red-600' },
  rolled_back: { label: 'Rolled Back', icon: RotateCcw, className: 'bg-gray-500/10 text-gray-600' }
};

interface RunsViewProps {
  runs: Run[];
}

export function RunsView({ runs }: RunsViewProps) {
  const { toast } = useToast();
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const allRuns = [...runs, ...demoRuns];

  const handleRollback = (run: Run) => {
    toast({
      title: 'Rollback initiated',
      description: `Rolling back run ${run.id}...`,
    });
  };

  return (
    <Card>
      <ScrollArea className="h-[calc(100vh-340px)] min-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead className="w-24">Run ID</TableHead>
              <TableHead>Playbook</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approvals</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>ETA / Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allRuns.map((run) => {
              const StatusIcon = statusConfig[run.status].icon;
              const isExpanded = expandedRunId === run.id;
              
              return (
                <Collapsible key={run.id} asChild open={isExpanded} onOpenChange={() => setExpandedRunId(isExpanded ? null : run.id)}>
                  <>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
                          </Button>
                        </CollapsibleTrigger>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{run.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{run.playbook}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{run.problemTitle}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{run.scope}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[10px] gap-1', statusConfig[run.status].className)}>
                          <StatusIcon className={cn('h-3 w-3', run.status === 'running' && 'animate-spin')} />
                          {statusConfig[run.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex -space-x-1">
                          {run.approvals.slice(0, 2).map((approver, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-[10px] font-medium"
                              title={approver}
                            >
                              {approver[0]}
                            </div>
                          ))}
                          {run.approvals.length > 2 && (
                            <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px]">
                              +{run.approvals.length - 2}
                            </div>
                          )}
                          {run.approvals.length === 0 && (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {format(run.startedAt, 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell>
                        {run.result ? (
                          <span className="text-xs font-medium text-green-600">{run.result}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{run.eta}</span>
                        )}
                      </TableCell>
                    </TableRow>
                    
                    <CollapsibleContent asChild>
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={8} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Actions Executed */}
                            <div>
                              <h5 className="text-xs font-semibold mb-2">Actions Executed</h5>
                              <div className="space-y-1">
                                {run.actions.map((action, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    {action}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Systems Touched */}
                            <div>
                              <h5 className="text-xs font-semibold mb-2">Systems Touched</h5>
                              <div className="flex flex-wrap gap-1">
                                {run.systemsTouched.map((system, i) => (
                                  <Badge key={i} variant="outline" className="text-[10px]">
                                    {system}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* Notes & Actions */}
                            <div>
                              <h5 className="text-xs font-semibold mb-2">Notes</h5>
                              <div className="space-y-1 mb-3">
                                {run.notes.map((note, i) => (
                                  <p key={i} className="text-xs text-muted-foreground">• {note}</p>
                                ))}
                              </div>
                              {run.canRollback && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="gap-1.5 text-xs h-7"
                                  onClick={() => handleRollback(run)}
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Rollback
                                </Button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
}
