import { useState, useCallback } from 'react';
import { AgentMode, Run } from './types';
import { RadarView } from './RadarView';
import { PlaybooksView } from './PlaybooksView';
import { RunsView } from './RunsView';
import { ROITrackerView } from './ROITrackerView';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Radar, 
  BookOpen, 
  Play, 
  TrendingUp,
  Bell,
  Settings,
  Shield,
  Users,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AgentsHub() {
  const [activeTab, setActiveTab] = useState('radar');
  const [mode, setMode] = useState<AgentMode>('advisory');
  const [runs, setRuns] = useState<Run[]>([]);
  const [notificationCount, setNotificationCount] = useState(3);

  const handleCreateRun = useCallback((problemId: string, problemTitle: string, playbook: string) => {
    const newRun: Run = {
      id: `run-${Date.now()}`,
      problemId,
      problemTitle,
      playbook,
      scope: 'All Regions',
      status: 'running',
      approvals: ['Current User'],
      startedAt: new Date(),
      eta: '~2h',
      actions: ['Executing actions...'],
      systemsTouched: ['OMS', 'WMS'],
      canRollback: true,
      notes: []
    };
    setRuns(prev => [newRun, ...prev]);

    // Simulate completion
    setTimeout(() => {
      setRuns(prev => prev.map(r => 
        r.id === newRun.id 
          ? { ...r, status: 'completed', result: '+₹12.4L recovered', eta: undefined }
          : r
      ));
    }, 5000);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Agentic Command Center
          </h2>
          <p className="text-sm text-muted-foreground">
            Detect, diagnose, plan, execute, and measure — with human-in-the-loop control
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Label 
              htmlFor="mode-toggle" 
              className={cn('text-xs cursor-pointer', mode === 'advisory' && 'font-semibold text-primary')}
            >
              Advisory
            </Label>
            <Switch
              id="mode-toggle"
              checked={mode === 'autopilot'}
              onCheckedChange={(checked) => setMode(checked ? 'autopilot' : 'advisory')}
            />
            <Label 
              htmlFor="mode-toggle" 
              className={cn('text-xs cursor-pointer', mode === 'autopilot' && 'font-semibold text-primary')}
            >
              Autopilot
            </Label>
          </div>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Notifications</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 rounded bg-amber-500/10 text-xs">
                    <Shield className="h-3 w-3 text-amber-600 mt-0.5" />
                    <span>2 runs awaiting approval</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded bg-red-500/10 text-xs">
                    <Radar className="h-3 w-3 text-red-600 mt-0.5" />
                    <span>1 critical priority detected</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Settings */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agents Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Permissions */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Permissions & Roles
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['Viewer', 'Operator', 'Approver', 'Admin'].map((role) => (
                      <Badge key={role} variant="outline" className="justify-center py-1.5">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Approval Policies */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Autopilot Thresholds
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">Auto-run if Impact</span>
                      <span>&lt; ₹5L</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">Auto-run if Risk</span>
                      <span>Low only</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">Guardrail violations</span>
                      <span>Block</span>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-4 mb-4">
          <TabsTrigger value="radar" className="gap-1.5 text-xs">
            <Radar className="h-3.5 w-3.5" />
            Radar
          </TabsTrigger>
          <TabsTrigger value="playbooks" className="gap-1.5 text-xs">
            <BookOpen className="h-3.5 w-3.5" />
            Playbooks
          </TabsTrigger>
          <TabsTrigger value="runs" className="gap-1.5 text-xs">
            <Play className="h-3.5 w-3.5" />
            Runs
            {runs.filter(r => r.status === 'running').length > 0 && (
              <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {runs.filter(r => r.status === 'running').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="roi" className="gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            ROI Tracker
          </TabsTrigger>
        </TabsList>

        <TabsContent value="radar" className="mt-0">
          <RadarView mode={mode} onCreateRun={handleCreateRun} />
        </TabsContent>

        <TabsContent value="playbooks" className="mt-0">
          <PlaybooksView />
        </TabsContent>

        <TabsContent value="runs" className="mt-0">
          <RunsView runs={runs} />
        </TabsContent>

        <TabsContent value="roi" className="mt-0">
          <ROITrackerView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
