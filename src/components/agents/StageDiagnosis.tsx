import { useState } from 'react';
import { Problem } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { NextStepPreview } from './NextStepPreview';
import { Lightbulb, Check, Search, ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageDiagnosisProps {
  problem: Problem;
  isCompleted: boolean;
  onSelectCause: (causeIndex: number) => void;
  onDigDeeper: (area: string) => void;
  onGoBack: () => void;
}

const diagnosisCauses = [
  {
    id: 'supplier',
    title: 'Supplier delay',
    probability: 92,
    evidence: [
      '2 suppliers reporting +3 day delays',
      'Raw material shortage confirmed',
      'Container booking backlog'
    ]
  },
  {
    id: 'demand',
    title: 'Demand spike',
    probability: 78,
    evidence: [
      '+34% vs forecast last 72h',
      'Promotional lift underestimated',
      'Competitor stockout driving traffic'
    ]
  },
  {
    id: 'dc',
    title: 'DC imbalance',
    probability: 54,
    evidence: [
      '4 DCs below safety stock',
      'Cross-dock delays at Mumbai hub',
      'Allocation rules outdated'
    ]
  }
];

const deeperOptions = [
  { id: 'vendor', label: 'Vendor lead time drilldown' },
  { id: 'sku', label: 'SKU-level anomalies' },
  { id: 'promo', label: 'Promo attribution' },
  { id: 'forecast', label: 'Forecast error decomposition' },
];

export function StageDiagnosis({ problem, isCompleted, onSelectCause, onDigDeeper, onGoBack }: StageDiagnosisProps) {
  const [selectedCause, setSelectedCause] = useState<string | null>(null);
  const [showDeeperModal, setShowDeeperModal] = useState(false);
  const [showNextPreview, setShowNextPreview] = useState(false);

  const handleContinue = () => {
    if (selectedCause) {
      const causeIndex = diagnosisCauses.findIndex(c => c.id === selectedCause);
      setShowNextPreview(true);
      setTimeout(() => onSelectCause(causeIndex), 1500);
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
              Root cause identified: Supplier delay (92% confidence)
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cause Cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Lightbulb className="h-3 w-3" />
            Top causes
            <Badge variant="secondary" className="text-[9px] ml-1">Diagnosis Agent</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <RadioGroup value={selectedCause || undefined} onValueChange={setSelectedCause}>
            {diagnosisCauses.map((cause, i) => (
              <label
                key={cause.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                  selectedCause === cause.id
                    ? "bg-primary/5 border-primary/30"
                    : "hover:bg-muted/50"
                )}
              >
                <RadioGroupItem value={cause.id} className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-medium">{i + 1}. {cause.title}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px]",
                        cause.probability >= 80 ? "text-green-600 border-green-200 bg-green-50" :
                        cause.probability >= 60 ? "text-amber-600 border-amber-200 bg-amber-50" :
                        "text-muted-foreground"
                      )}
                    >
                      {cause.probability}% likely
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {cause.evidence.map((e, j) => (
                      <div key={j} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Sparkles className="h-2.5 w-2.5 text-primary" />
                        {e}
                      </div>
                    ))}
                  </div>
                </div>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Human Gate */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Lightbulb className="h-3 w-3 text-amber-600" />
            </div>
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Which cause should we address first?
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              className="gap-1.5 bg-primary hover:bg-primary/90"
              onClick={handleContinue}
              disabled={!selectedCause || showNextPreview}
            >
              <Check className="h-3 w-3" />
              Select & continue to Plan
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="gap-1.5"
              onClick={() => setShowDeeperModal(true)}
            >
              <Search className="h-3 w-3" />
              Ask agents to dig deeper
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              className="gap-1.5"
              onClick={onGoBack}
            >
              <ArrowLeft className="h-3 w-3" />
              Go back to Discovery
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Next Step Preview */}
      {showNextPreview && (
        <NextStepPreview
          title="Planning optimal response"
          description="Planner agent will generate 3 action alternatives based on selected root cause."
          eta="~30s"
        />
      )}

      {/* Dig Deeper Modal */}
      <Dialog open={showDeeperModal} onOpenChange={setShowDeeperModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Dig deeper</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              Select analysis to run:
            </p>
            <div className="space-y-2">
              {deeperOptions.map((option) => (
                <Button
                  key={option.id}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setShowDeeperModal(false);
                    onDigDeeper(option.id);
                  }}
                >
                  <Search className="h-3.5 w-3.5" />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
