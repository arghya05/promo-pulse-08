import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AgentArtifact } from './AgentOrchestrator';
import { FileText, Clock, TrendingUp, AlertTriangle, CheckCircle, Zap, Target, BarChart3 } from 'lucide-react';

interface ArtifactViewerDialogProps {
  artifact: AgentArtifact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeConfig: Record<AgentArtifact['type'], { icon: typeof FileText; color: string; label: string }> = {
  ranking: { icon: Target, color: 'text-primary', label: 'Priority Ranking' },
  evidence: { icon: FileText, color: 'text-blue-600', label: 'Evidence Pack' },
  entity_map: { icon: Zap, color: 'text-cyan-600', label: 'Entity Resolution' },
  anomalies: { icon: AlertTriangle, color: 'text-amber-600', label: 'Anomaly Report' },
  guardrails: { icon: CheckCircle, color: 'text-green-600', label: 'Guardrails Check' },
  hypotheses: { icon: TrendingUp, color: 'text-purple-600', label: 'Root Cause Hypotheses' },
  plan: { icon: Target, color: 'text-primary', label: 'Cross-Module Plan' },
  risk: { icon: AlertTriangle, color: 'text-orange-600', label: 'Risk Assessment' },
  execution: { icon: Zap, color: 'text-blue-600', label: 'Execution Log' },
  roi: { icon: BarChart3, color: 'text-green-600', label: 'ROI Report' },
};

export function ArtifactViewerDialog({ artifact, open, onOpenChange }: ArtifactViewerDialogProps) {
  if (!artifact) return null;

  const config = typeConfig[artifact.type];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            {artifact.title}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="text-xs">{config.label}</Badge>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {artifact.timestamp.toLocaleTimeString()}
            </span>
          </div>
        </DialogHeader>

        <Separator />

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            {/* Summary */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">{artifact.summary}</p>
            </div>

            {/* Render artifact data based on type */}
            {renderArtifactContent(artifact)}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function renderArtifactContent(artifact: AgentArtifact) {
  switch (artifact.type) {
    case 'ranking':
      return renderRankingContent(artifact.data);
    case 'evidence':
      return renderEvidenceContent(artifact.data);
    case 'entity_map':
      return renderEntityMapContent(artifact.data);
    case 'anomalies':
      return renderAnomaliesContent(artifact.data);
    case 'guardrails':
      return renderGuardrailsContent(artifact.data);
    case 'hypotheses':
      return renderHypothesesContent(artifact.data);
    case 'plan':
      return renderPlanContent(artifact.data);
    case 'risk':
      return renderRiskContent(artifact.data);
    case 'execution':
      return renderExecutionContent(artifact.data);
    case 'roi':
      return renderROIContent(artifact.data);
    default:
      return <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">{JSON.stringify(artifact.data, null, 2)}</pre>;
  }
}

function renderRankingContent(data: any) {
  if (!data) return null;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Total Score" value={`${data.totalScore}/100`} />
        <MetricCard label="Impact Score" value={`${data.impactScore}/100`} />
        <MetricCard label="Confidence Score" value={`${data.confidenceScore}/100`} />
        <MetricCard label="Time Score" value={`${data.timeScore}/100`} />
      </div>
      {data.formula && <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">{data.formula}</p>}
    </div>
  );
}

function renderEvidenceContent(data: any[]) {
  if (!data?.length) return <p className="text-sm text-muted-foreground">No signals collected.</p>;
  return (
    <div className="space-y-2">
      {data.map((signal, idx) => (
        <div key={idx} className="p-3 border rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{signal.name}</span>
            <Badge variant="outline" className="text-xs">{signal.source}</Badge>
          </div>
          <p className="text-sm mt-1">{signal.value}</p>
          {signal.delta && <p className="text-xs text-muted-foreground mt-1">Δ {signal.delta}</p>}
        </div>
      ))}
    </div>
  );
}

function renderEntityMapContent(data: any) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard label="SKUs Mapped" value={data.skusMapped} />
      <MetricCard label="DCs Covered" value={data.dcsCovered} />
      <MetricCard label="Vendors Linked" value={data.vendorsLinked} />
      <MetricCard label="Data Quality" value={`${data.dataQuality}%`} />
    </div>
  );
}

function renderAnomaliesContent(data: any[]) {
  if (!data?.length) return <p className="text-sm text-muted-foreground">No anomalies detected.</p>;
  return (
    <div className="space-y-2">
      {data.map((anomaly, idx) => (
        <div key={idx} className="p-3 border border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium">{anomaly.name}</span>
          </div>
          <p className="text-sm mt-1">{anomaly.value}</p>
        </div>
      ))}
    </div>
  );
}

function renderGuardrailsContent(data: any) {
  if (!data) return null;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Passed" value={data.passed} className="border-green-200 bg-green-50/50 dark:bg-green-900/10" />
        <MetricCard label="Warnings" value={data.warnings} className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/10" />
        <MetricCard label="Failed" value={data.failed} className="border-red-200 bg-red-50/50 dark:bg-red-900/10" />
      </div>
    </div>
  );
}

function renderHypothesesContent(data: any[]) {
  if (!data?.length) return <p className="text-sm text-muted-foreground">No hypotheses generated.</p>;
  return (
    <div className="space-y-2">
      {data.map((hypothesis, idx) => (
        <div key={idx} className="p-3 border rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{hypothesis.cause}</span>
            <Badge className="text-xs">{hypothesis.probability}%</Badge>
          </div>
          {hypothesis.evidence && (
            <ul className="mt-2 text-xs text-muted-foreground space-y-1">
              {hypothesis.evidence.slice(0, 3).map((e: string, i: number) => (
                <li key={i}>• {e}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function renderPlanContent(data: any) {
  if (!data) return null;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Expected ROI" value={`₹${data.expectedROI}L`} />
        <MetricCard label="Risk Score" value={`${(data.riskScore * 100).toFixed(0)}%`} />
      </div>
      {data.actions?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">{data.actions.length} Actions</p>
          <div className="space-y-2">
            {data.actions.slice(0, 5).map((action: any, idx: number) => (
              <div key={idx} className="p-2 bg-muted/50 rounded text-xs">
                <span className="font-medium">{action.what}</span>
                <Badge variant="outline" className="ml-2 text-[9px]">{action.module}</Badge>
              </div>
            ))}
            {data.actions.length > 5 && (
              <p className="text-xs text-muted-foreground">+{data.actions.length - 5} more actions</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function renderRiskContent(data: any) {
  if (!data) return null;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Risk Score" value={`${(data.riskScore * 100).toFixed(0)}%`} />
        <MetricCard 
          label="Safe to Auto-Execute" 
          value={data.safeToAutoExecute ? 'Yes' : 'No'} 
          className={data.safeToAutoExecute ? 'border-green-200 bg-green-50/50 dark:bg-green-900/10' : 'border-amber-200 bg-amber-50/50 dark:bg-amber-900/10'}
        />
      </div>
      {data.reasons?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Reasons</p>
          <ul className="text-xs space-y-1">
            {data.reasons.map((reason: string, idx: number) => (
              <li key={idx} className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function renderExecutionContent(data: any) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard label="Executed" value={data.executed} />
      <MetricCard label="Successful" value={data.successful} className="border-green-200 bg-green-50/50 dark:bg-green-900/10" />
      <MetricCard label="Retried" value={data.retried} className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/10" />
      <MetricCard label="Failed" value={data.failed} className="border-red-200 bg-red-50/50 dark:bg-red-900/10" />
    </div>
  );
}

function renderROIContent(data: any) {
  if (!data) return null;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Expected" value={`₹${data.expected}L`} />
        <MetricCard label="Realized" value={`₹${data.realized?.toFixed(1)}L`} className="border-green-200 bg-green-50/50 dark:bg-green-900/10" />
        <MetricCard label="Confidence" value={`${data.confidence}%`} />
        <MetricCard label="Method" value={data.method} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, className = '' }: { label: string; value: string | number; className?: string }) {
  return (
    <div className={`p-3 border rounded-lg ${className}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
