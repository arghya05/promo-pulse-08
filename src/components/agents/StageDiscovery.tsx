import { useState } from 'react';
import { Problem } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { NextStepPreview } from './NextStepPreview';
import { AlertTriangle, Check, RotateCcw, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageDiscoveryProps {
  problem: Problem;
  isCompleted: boolean;
  onConfirm: () => void;
  onRecheck: (areas: string[]) => void;
  onDismiss: () => void;
}

const recheckAreas = [
  { id: 'demand', label: 'Demand signals' },
  { id: 'supply', label: 'Supply data' },
  { id: 'dc', label: 'DC imbalance' },
  { id: 'forecast', label: 'Forecast bias' },
  { id: 'pricing', label: 'Pricing & promo' },
  { id: 'freshness', label: 'Data freshness' },
];

export function StageDiscovery({ problem, isCompleted, onConfirm, onRecheck, onDismiss }: StageDiscoveryProps) {
  const [showRecheckModal, setShowRecheckModal] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [showNextPreview, setShowNextPreview] = useState(false);
  const [decisionMade, setDecisionMade] = useState<'confirm' | 'recheck' | 'dismiss' | null>(null);

  const handleConfirm = () => {
    setDecisionMade('confirm');
    setShowNextPreview(true);
    setTimeout(() => onConfirm(), 1500);
  };

  const handleRecheck = () => {
    if (selectedAreas.length > 0) {
      setShowRecheckModal(false);
      setDecisionMade('recheck');
      onRecheck(selectedAreas);
    }
  };

  if (isCompleted) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="h-3.5 w-3.5 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              Discovery confirmed as priority
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* What agents found */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" />
            What triggered this
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm mb-3">{problem.summary}</p>
          <div className="space-y-2">
            {problem.whyNow.map((signal, i) => (
              <div key={i} className="flex items-center gap-2 text-xs p-2 bg-muted/30 rounded">
                <Sparkles className="h-3 w-3 text-primary shrink-0" />
                <span>{signal}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Evidence Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground">
            Evidence
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs space-y-1">
            <div className="grid grid-cols-4 gap-2 py-1.5 border-b text-muted-foreground font-medium">
              <span>Signal</span>
              <span>Value</span>
              <span>Source</span>
              <span>Time</span>
            </div>
            <div className="grid grid-cols-4 gap-2 py-1.5">
              <span>Demand spike</span>
              <span className="font-semibold text-red-600">+34%</span>
              <span className="text-muted-foreground">Sales</span>
              <span className="text-muted-foreground">2h ago</span>
            </div>
            <div className="grid grid-cols-4 gap-2 py-1.5">
              <span>Lead time</span>
              <span className="font-semibold text-amber-600">+3 days</span>
              <span className="text-muted-foreground">Supplier</span>
              <span className="text-muted-foreground">4h ago</span>
            </div>
            <div className="grid grid-cols-4 gap-2 py-1.5">
              <span>Safety stock</span>
              <span className="font-semibold text-red-600">Depleted</span>
              <span className="text-muted-foreground">DC Inventory</span>
              <span className="text-muted-foreground">1h ago</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Human Gate */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
            </div>
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Do you agree this is a real priority?
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              className="gap-1.5 bg-primary hover:bg-primary/90"
              onClick={handleConfirm}
              disabled={decisionMade !== null}
            >
              <Check className="h-3 w-3" />
              Confirm priority → Run Diagnosis
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="gap-1.5"
              onClick={() => setShowRecheckModal(true)}
              disabled={decisionMade !== null}
            >
              <RotateCcw className="h-3 w-3" />
              Request recheck
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              className="gap-1.5"
              onClick={onDismiss}
              disabled={decisionMade !== null}
            >
              <X className="h-3 w-3" />
              Dismiss (not relevant)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Next Step Preview */}
      {showNextPreview && decisionMade === 'confirm' && (
        <NextStepPreview
          title="Running Diagnosis agents"
          description="You may be asked 1 clarification if data is missing."
          eta="~45s"
        />
      )}

      {/* Recheck Modal */}
      <Dialog open={showRecheckModal} onOpenChange={setShowRecheckModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Request recheck</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              Select areas for the agent to re-examine:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {recheckAreas.map((area) => (
                <label
                  key={area.id}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-md border cursor-pointer transition-colors",
                    selectedAreas.includes(area.id)
                      ? "bg-primary/5 border-primary/30"
                      : "hover:bg-muted/50"
                  )}
                >
                  <Checkbox
                    checked={selectedAreas.includes(area.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedAreas(prev => [...prev, area.id]);
                      } else {
                        setSelectedAreas(prev => prev.filter(id => id !== area.id));
                      }
                    }}
                  />
                  <span className="text-sm">{area.label}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecheckModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecheck} disabled={selectedAreas.length === 0}>
              Run Recheck Agents
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
