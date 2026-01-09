import { useState } from 'react';
import { Action } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { NextStepPreview } from './NextStepPreview';
import { RunProgressPanel } from './RunProgressPanel';
import { Zap, Check, Shield, Send, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageExecuteProps {
  actions: Action[];
  isCompleted: boolean;
  isRunning: boolean;
  autopilotEnabled: boolean;
  onApproveAndRun: () => void;
  onSafeMode: () => void;
  onSendForApproval: () => void;
  onCancel: () => void;
  onRunComplete: () => void;
}

const safeActions = [
  { id: 'safe-1', title: 'Update reorder points +20%', owner: 'System', target: 'Inventory Manager', impact: '₹2.1L', risk: 'low' },
  { id: 'safe-2', title: 'Enable substitute recommendations', owner: 'System', target: 'Ecom Platform', impact: '₹1.5L', risk: 'low' },
];

const approvalActions = [
  { id: 'approval-1', title: 'Trigger emergency PO for 8 SKUs', owner: 'Meera (SCM)', target: 'Supplier Portal', impact: '₹6.8L', risk: 'med' },
  { id: 'approval-2', title: 'Activate backup supplier', owner: 'Meera (SCM)', target: 'Vendor Mgmt', impact: '₹4.2L', risk: 'med' },
  { id: 'approval-3', title: 'Override allocation rules', owner: 'Riya (Pricing)', target: 'OMS', impact: '₹1.6L', risk: 'high' },
];

export function StageExecute({ 
  actions, 
  isCompleted, 
  isRunning,
  autopilotEnabled,
  onApproveAndRun, 
  onSafeMode,
  onSendForApproval, 
  onCancel,
  onRunComplete 
}: StageExecuteProps) {
  const [selectedSafe, setSelectedSafe] = useState<string[]>(safeActions.map(a => a.id));
  const [selectedApproval, setSelectedApproval] = useState<string[]>(approvalActions.map(a => a.id));
  const [showNextPreview, setShowNextPreview] = useState(false);

  if (isRunning) {
    return <RunProgressPanel isRunning={isRunning} onComplete={onRunComplete} />;
  }

  if (isCompleted) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="h-3.5 w-3.5 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              Execution completed: 5 actions applied successfully
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleApprove = () => {
    setShowNextPreview(true);
    setTimeout(() => onApproveAndRun(), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Safe Auto-actions */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-green-600" />
              Safe auto-actions
            </CardTitle>
            {autopilotEnabled && (
              <Badge variant="outline" className="text-[9px] text-green-600 border-green-200">
                Autopilot eligible
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {safeActions.map((action) => (
            <div
              key={action.id}
              className="flex items-center gap-3 p-2.5 rounded-md bg-green-500/5 border border-green-500/20"
            >
              <Checkbox
                checked={selectedSafe.includes(action.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedSafe(prev => [...prev, action.id]);
                  } else {
                    setSelectedSafe(prev => prev.filter(id => id !== action.id));
                  }
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{action.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {action.target} • {action.owner}
                </p>
              </div>
              <Badge variant="outline" className="text-[9px] text-green-600 border-green-200">
                {action.impact}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions needing approval */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <User className="h-3 w-3 text-amber-600" />
            Needs approval
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {approvalActions.map((action) => (
            <div
              key={action.id}
              className={cn(
                "flex items-center gap-3 p-2.5 rounded-md border",
                action.risk === 'high' 
                  ? "bg-red-500/5 border-red-500/20" 
                  : "bg-amber-500/5 border-amber-500/20"
              )}
            >
              <Checkbox
                checked={selectedApproval.includes(action.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedApproval(prev => [...prev, action.id]);
                  } else {
                    setSelectedApproval(prev => prev.filter(id => id !== action.id));
                  }
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{action.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {action.target} • {action.owner}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[9px]",
                    action.risk === 'high' ? "text-red-600 border-red-200" : "text-amber-600 border-amber-200"
                  )}
                >
                  {action.risk === 'high' ? 'High' : 'Med'} risk
                </Badge>
                <Badge variant="outline" className="text-[9px] text-primary border-primary/20">
                  {action.impact}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Human Gate */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Zap className="h-3 w-3 text-amber-600" />
            </div>
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Approve these actions?
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              className="gap-1.5 bg-primary hover:bg-primary/90"
              onClick={handleApprove}
              disabled={showNextPreview}
            >
              <Check className="h-3 w-3" />
              Approve & run (with guardrails)
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="gap-1.5"
              onClick={onSafeMode}
            >
              <Shield className="h-3 w-3" />
              Run in Safe Mode
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="gap-1.5"
              onClick={onSendForApproval}
            >
              <Send className="h-3 w-3" />
              Send for manual review
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              className="gap-1.5"
              onClick={onCancel}
            >
              <X className="h-3 w-3" />
              Cancel execution
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Next Step Preview */}
      {showNextPreview && (
        <NextStepPreview
          title="Executing approved actions"
          description="Systems will be updated. You can monitor progress and rollback if needed."
          eta="~2min"
        />
      )}
    </div>
  );
}
