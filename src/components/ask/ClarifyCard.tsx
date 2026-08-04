import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export type Clarification = {
  question: string;
  why: string;
  options: string[];
};

/** The engine asks back instead of guessing when a question has several readings. */
export function ClarifyCard({
  clarification,
  onAsk,
}: {
  clarification: Clarification;
  onAsk: (question: string) => void;
}) {
  return (
    <Card className="animate-fade-up space-y-4 border-primary/30 p-4 md:p-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <HelpCircle className="h-3.5 w-3.5 text-primary" />
          Clarification needed before grounding
        </div>
        <h3 className="font-display text-base font-semibold leading-snug md:text-lg">
          {clarification.question}
        </h3>
        <p className="text-sm text-muted-foreground">{clarification.why}</p>
      </div>

      <div className="space-y-2">
        {clarification.options.map((option) => (
          <Button
            key={option}
            variant="outline"
            onClick={() => onAsk(option)}
            className="h-auto w-full justify-start whitespace-normal py-2 text-left text-sm font-normal"
          >
            {option}
          </Button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        No data was queried — a wrong reading here would have produced a misleading answer.
      </p>
    </Card>
  );
}
