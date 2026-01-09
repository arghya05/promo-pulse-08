import { useState } from 'react';
import { Playbook } from './types';
import { demoPlaybooks } from './demo-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Play, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  TrendingUp,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function PlaybooksView() {
  const { toast } = useToast();
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);

  const handleRunNow = (playbook: Playbook) => {
    toast({
      title: 'Playbook started',
      description: `Running "${playbook.name}" with default configuration`,
    });
    setSelectedPlaybook(null);
  };

  const handleSchedule = (playbook: Playbook) => {
    toast({
      title: 'Schedule created',
      description: `"${playbook.name}" scheduled for daily execution`,
    });
    setSelectedPlaybook(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {demoPlaybooks.map((playbook) => (
          <Card
            key={playbook.id}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/30',
              `bg-gradient-to-br ${playbook.gradient}`
            )}
            onClick={() => setSelectedPlaybook(playbook)}
          >
            <CardHeader>
              <div className="text-3xl mb-2">{playbook.icon}</div>
              <CardTitle className="text-lg">{playbook.name}</CardTitle>
              <CardDescription className="text-sm">
                {playbook.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1 mb-3">
                {playbook.triggerConditions.slice(0, 2).map((condition, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">
                    {condition}
                  </Badge>
                ))}
                {playbook.triggerConditions.length > 2 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{playbook.triggerConditions.length - 2} more
                  </Badge>
                )}
              </div>
              <Button variant="ghost" className="w-full gap-2">
                View Details
                <Play className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Playbook Detail Dialog */}
      <Dialog open={!!selectedPlaybook} onOpenChange={() => setSelectedPlaybook(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          {selectedPlaybook && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-2xl">{selectedPlaybook.icon}</span>
                  {selectedPlaybook.name}
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedPlaybook.description}
                  </p>

                  <Separator />

                  {/* Trigger Conditions */}
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Trigger Conditions
                    </h4>
                    <div className="space-y-1">
                      {selectedPlaybook.triggerConditions.map((condition, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {condition}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Data Required */}
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Data Required
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedPlaybook.dataRequired.map((data, i) => (
                        <Badge key={i} variant="outline" className="text-xs gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {data}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Default Actions */}
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Default Actions
                    </h4>
                    <div className="space-y-1">
                      {selectedPlaybook.defaultActions.map((action, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{i + 1}.</span>
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Guardrails */}
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      Default Guardrails
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedPlaybook.defaultGuardrails).map(([key, value]) => (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {key}: {value}
                        </Badge>
                      ))}
                      {Object.keys(selectedPlaybook.defaultGuardrails).length === 0 && (
                        <span className="text-xs text-muted-foreground">No specific guardrails</span>
                      )}
                    </div>
                  </div>

                  {/* Approval Policy */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Approval Policy</h4>
                    <p className="text-sm text-muted-foreground">{selectedPlaybook.approvalPolicy}</p>
                  </div>

                  {/* ROI Method */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1">ROI Measurement</h4>
                    <p className="text-sm text-muted-foreground">{selectedPlaybook.roiMethod}</p>
                  </div>
                </div>
              </ScrollArea>

              <div className="flex gap-2 pt-4 border-t">
                <Button className="flex-1 gap-2" onClick={() => handleRunNow(selectedPlaybook)}>
                  <Play className="h-4 w-4" />
                  Run Now
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={() => handleSchedule(selectedPlaybook)}>
                  <Calendar className="h-4 w-4" />
                  Schedule
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
