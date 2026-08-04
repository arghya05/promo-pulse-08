import { useRef, useState, type ReactNode } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { chartFileName, saveChartAsPng } from '@/lib/chart-image';
import { cn } from '@/lib/utils';

/**
 * Wraps any chart and overlays a "save as image" button in its top-right
 * corner. The button appears on hover and stays reachable by keyboard.
 */
export function ChartCapture({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!ref.current) return;
    setSaving(true);
    try {
      await saveChartAsPng(ref.current, chartFileName(label));
      toast.success('Chart saved as image', { description: label });
    } catch (err) {
      toast.error('Could not save the chart', {
        description: err instanceof Error ? err.message : 'Unexpected export error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={ref} className={cn('group/chart relative', className)}>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        aria-label={`Save "${label}" chart as an image`}
        title="Save chart as image"
        data-chart-export-control
        className="absolute right-1 top-1 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/70 bg-card/90 text-muted-foreground opacity-0 shadow-sm backdrop-blur transition-all hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/chart:opacity-100 disabled:cursor-not-allowed"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      </button>
      {children}
    </div>
  );
}
