import { useState, useMemo } from 'react';
import { Problem, Action, Guardrails, AgentMode, ProblemStatus } from './types';
import { ProblemCard } from './ProblemCard';
import { ActionRow } from './ActionRow';
import { GuardrailsPanel } from './GuardrailsPanel';
import { AuditTimeline } from './AuditTimeline';
import { ExpectedRoiCard, RealizedRoiCard } from './RoiCard';
import { 
  demoProblems, 
  demoActions, 
  defaultGuardrails, 
  demoExpectedROI, 
  demoAuditLog 
} from './demo-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Radar, 
  Filter, 
  Play, 
  FlaskConical, 
  Send, 
  MessageSquare,
  Lightbulb,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  Database,
  Clock,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface RadarViewProps {
  mode: AgentMode;
  onCreateRun: (problemId: string, problemTitle: string, playbook: string) => void;
}

export function RadarView({ mode, onCreateRun }: RadarViewProps) {
  const { toast } = useToast();
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(demoProblems[0]?.id || null);
  const [problems, setProblems] = useState<Problem[]>(demoProblems);
  const [actions, setActions] = useState<Record<string, Action[]>>(demoActions);
  const [guardrails, setGuardrails] = useState<Guardrails>(defaultGuardrails);
  const [askAgentInput, setAskAgentInput] = useState('');
  
  // Filters
  const [market, setMarket] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [channel, setChannel] = useState<string>('all');
  const [timeWindow, setTimeWindow] = useState<string>('7d');

  const selectedProblem = problems.find(p => p.id === selectedProblemId);
  const selectedActions = selectedProblemId ? actions[selectedProblemId] || [] : [];
  const selectedROI = selectedProblemId ? demoExpectedROI[selectedProblemId] : null;

  const includedActions = selectedActions.filter(a => a.included);
  const totalUplift = useMemo(() => {
    return includedActions.reduce((sum, a) => sum + (a.upliftMin + a.upliftMax) / 2, 0);
  }, [includedActions]);

  const handleToggleAction = (actionId: string) => {
    if (!selectedProblemId) return;
    setActions(prev => ({
      ...prev,
      [selectedProblemId]: prev[selectedProblemId].map(a =>
        a.id === actionId ? { ...a, included: !a.included } : a
      )
    }));
  };

  const handleApproveAndRun = () => {
    if (!selectedProblem) return;
    
    setProblems(prev => prev.map(p =>
      p.id === selectedProblemId ? { ...p, status: 'running' as ProblemStatus } : p
    ));
    
    onCreateRun(selectedProblem.id, selectedProblem.title, 'Stockout Prevention');
    
    toast({
      title: 'Run started',
      description: `Executing ${includedActions.length} actions for "${selectedProblem.title}"`,
    });

    // Simulate completion
    setTimeout(() => {
      setProblems(prev => prev.map(p =>
        p.id === selectedProblemId ? { ...p, status: 'completed' as ProblemStatus } : p
      ));
    }, 5000);
  };

  const handleSendForApproval = () => {
    if (!selectedProblem) return;
    
    setProblems(prev => prev.map(p =>
      p.id === selectedProblemId ? { ...p, status: 'awaiting_approval' as ProblemStatus } : p
    ));
    
    toast({
      title: 'Sent for approval',
      description: 'Approvers have been notified',
    });
  };

  const handleAskAgent = () => {
    if (!askAgentInput.trim()) return;
    
    toast({
      title: 'Agent response',
      description: 'Updated plan based on your input: "' + askAgentInput + '"',
    });
    setAskAgentInput('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-280px)] min-h-[600px]">
      {/* LEFT: Priority Radar */}
      <div className="lg:col-span-3 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Radar className="h-4 w-4 text-primary" />
              Today's Priorities
            </CardTitle>
            
            {/* Filters */}
            <div className="space-y-2 pt-2">
              <div className="flex gap-2">
                <Select value={market} onValueChange={setMarket}>
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue placeholder="Market" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Markets</SelectItem>
                    <SelectItem value="north">North</SelectItem>
                    <SelectItem value="south">South</SelectItem>
                    <SelectItem value="west">West</SelectItem>
                    <SelectItem value="east">East</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="apparel">Apparel</SelectItem>
                    <SelectItem value="fmcg">FMCG</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-1">
                {['Online', 'Store', 'Marketplace'].map((ch) => (
                  <Badge
                    key={ch}
                    variant={channel === ch.toLowerCase() ? 'default' : 'outline'}
                    className="text-[10px] cursor-pointer"
                    onClick={() => setChannel(channel === ch.toLowerCase() ? 'all' : ch.toLowerCase())}
                  >
                    {ch}
                  </Badge>
                ))}
                <Select value={timeWindow} onValueChange={setTimeWindow}>
                  <SelectTrigger className="h-5 text-[10px] w-14 ml-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24h</SelectItem>
                    <SelectItem value="7d">7d</SelectItem>
                    <SelectItem value="30d">30d</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-2 pt-0">
            <ScrollArea className="h-full pr-2">
              <div className="space-y-2">
                {problems.map((problem) => (
                  <ProblemCard
                    key={problem.id}
                    problem={problem}
                    isSelected={problem.id === selectedProblemId}
                    onClick={() => setSelectedProblemId(problem.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* MIDDLE: Issue Workspace */}
      <div className="lg:col-span-5 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Issue Workspace</CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-hidden p-3 pt-0">
            {selectedProblem ? (
              <ScrollArea className="h-full pr-3">
                <div className="space-y-4">
                  {/* What's Happening */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3" />
                      What's happening
                    </h4>
                    <p className="text-sm">{selectedProblem.summary}</p>
                  </div>

                  {/* Why Now */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" />
                      Why now
                    </h4>
                    <div className="space-y-1.5">
                      {selectedProblem.whyNow.map((signal, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span>{signal}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Root Causes */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <Lightbulb className="h-3 w-3" />
                      Root causes
                      <Badge variant="outline" className="text-[9px] ml-1">Diagnosis Agent</Badge>
                    </h4>
                    <div className="space-y-1.5">
                      {selectedProblem.rootCauses.map((cause, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="text-muted-foreground">{i + 1}.</span>
                          <span>{cause}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Recommended Actions */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3" />
                      Recommended actions
                      <Badge variant="outline" className="text-[9px] ml-1">Planner Agent</Badge>
                    </h4>
                    <div className="space-y-2">
                      {selectedActions.map((action, i) => (
                        <ActionRow
                          key={action.id}
                          action={action}
                          index={i + 1}
                          onToggle={handleToggleAction}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Guardrails */}
                  <GuardrailsPanel
                    guardrails={guardrails}
                    onChange={setGuardrails}
                  />

                  {/* Ask Agent */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask agent to modify plan..."
                      value={askAgentInput}
                      onChange={(e) => setAskAgentInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAskAgent()}
                      className="h-8 text-xs"
                    />
                    <Button size="sm" variant="outline" className="h-8" onClick={handleAskAgent}>
                      <MessageSquare className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1 gap-1.5" 
                      size="sm"
                      onClick={handleApproveAndRun}
                      disabled={includedActions.length === 0}
                    >
                      <Play className="h-3 w-3" />
                      Approve & Run
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <FlaskConical className="h-3 w-3" />
                      Simulate
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleSendForApproval}>
                      <Send className="h-3 w-3" />
                      Send for Approval
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Select a problem to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: Trust + ROI */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {selectedROI && (
          <ExpectedRoiCard roi={{
            ...selectedROI,
            revenueUplift: totalUplift,
          }} />
        )}

        {selectedProblem?.status === 'completed' && (
          <RealizedRoiCard roi={{
            revenueUplift: (selectedROI?.revenueUplift || 0) * 0.92,
            marginImpact: (selectedROI?.marginImpact || 0) * 0.95,
            inventoryEffect: 1.2,
            experimentMethod: 'A/B'
          }} />
        )}

        {/* Audit Log */}
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Approval & Audit Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AuditTimeline entries={demoAuditLog} />
          </CardContent>
        </Card>

        {/* Explainability */}
        <Collapsible>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Explainability
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Top signals used</span>
                  <span>Inventory, Demand, Supplier</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data freshness</span>
                  <span>2 min ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last model update</span>
                  <span>Jan 7, 2026</span>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
}
