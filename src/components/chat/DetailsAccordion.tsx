import React from 'react';
import { ChevronDown, Lightbulb, Database, Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { DetailSection } from './types';

interface DetailsAccordionProps {
  details: DetailSection;
  className?: string;
}

export const DetailsAccordion: React.FC<DetailsAccordionProps> = ({
  details,
  className
}) => {
  const hasWhy = details.why.length > 0;
  const hasEvidence = details.evidence.length > 0;
  const hasDrivers = details.drivers.length > 0;
  const hasForecast = details.forecast.predictions.length > 0 || details.forecast.riskTag;

  if (!hasWhy && !hasEvidence && !hasDrivers && !hasForecast) {
    return null;
  }

  return (
    <Accordion type="multiple" className={cn("mt-3", className)}>
      {/* Why This Happened */}
      {hasWhy && (
        <AccordionItem value="why" className="border-amber-500/20">
          <AccordionTrigger className="py-2 px-3 text-sm hover:no-underline bg-amber-500/5 rounded-t-lg data-[state=open]:rounded-b-none">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-medium">Why This Happened</span>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                {details.why.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3 pt-2 bg-amber-500/5 rounded-b-lg">
            <ul className="space-y-1.5">
              {details.why.slice(0, 3).map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span className="text-muted-foreground">{reason}</span>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Evidence */}
      {hasEvidence && (
        <AccordionItem value="evidence" className="border-blue-500/20">
          <AccordionTrigger className="py-2 px-3 text-sm hover:no-underline bg-blue-500/5 rounded-t-lg data-[state=open]:rounded-b-none">
            <div className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-blue-500" />
              <span className="font-medium">Evidence</span>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                {details.evidence.length} items
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3 pt-2 bg-blue-500/5 rounded-b-lg">
            <div className="grid grid-cols-2 gap-2">
              {details.evidence.slice(0, 6).map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-2 bg-background/50 rounded border border-border/50"
                >
                  <span className="text-xs font-medium truncate flex-1">{item.name}</span>
                  <Badge variant="outline" className="text-[10px] ml-2">
                    {item.value}
                  </Badge>
                </div>
              ))}
            </div>
            {details.evidence.length > 6 && (
              <button className="text-xs text-primary mt-2 hover:underline">
                Show {details.evidence.length - 6} more...
              </button>
            )}
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Drivers (merged causal + ML) */}
      {hasDrivers && (
        <AccordionItem value="drivers" className="border-purple-500/20">
          <AccordionTrigger className="py-2 px-3 text-sm hover:no-underline bg-purple-500/5 rounded-t-lg data-[state=open]:rounded-b-none">
            <div className="flex items-center gap-2">
              <Brain className="h-3.5 w-3.5 text-purple-500" />
              <span className="font-medium">Key Drivers</span>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                {details.drivers.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3 pt-2 bg-purple-500/5 rounded-b-lg">
            <ul className="space-y-2">
              {details.drivers.slice(0, 4).map((driver, idx) => (
                <li key={idx} className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{driver.driver}</p>
                    <p className="text-xs text-muted-foreground">{driver.impact}</p>
                  </div>
                  {driver.correlation !== undefined && (
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] flex-shrink-0",
                        driver.correlation >= 0.7 ? "border-emerald-500 text-emerald-600" :
                        driver.correlation >= 0.4 ? "border-amber-500 text-amber-600" :
                        "border-gray-400 text-gray-600"
                      )}
                    >
                      {(driver.correlation * 100).toFixed(0)}% corr
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Forecast/Risk */}
      {hasForecast && (
        <AccordionItem value="forecast" className="border-emerald-500/20">
          <AccordionTrigger className="py-2 px-3 text-sm hover:no-underline bg-emerald-500/5 rounded-t-lg data-[state=open]:rounded-b-none">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="font-medium">Forecast & Risk</span>
              {details.forecast.riskTag && (
                <Badge 
                  variant="destructive" 
                  className="text-[9px] px-1.5 py-0 h-4"
                >
                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                  {details.forecast.riskTag}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3 pt-2 bg-emerald-500/5 rounded-b-lg">
            <ul className="space-y-1.5">
              {details.forecast.predictions.slice(0, 2).map((prediction, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{prediction}</span>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
};

export default DetailsAccordion;
