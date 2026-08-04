import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Rows3, Rows4 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type Density = 'comfortable' | 'compact';
const KEY = 'maya-density';

const apply = (density: Density) => {
  document.documentElement.dataset.density = density;
};

export const DensityToggle = () => {
  const [density, setDensity] = useState<Density>(() => {
    const stored = localStorage.getItem(KEY);
    return stored === 'compact' ? 'compact' : 'comfortable';
  });

  useEffect(() => {
    apply(density);
    localStorage.setItem(KEY, density);
  }, [density]);

  const next = density === 'compact' ? 'comfortable' : 'compact';
  const Icon = density === 'compact' ? Rows4 : Rows3;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          aria-label={`Switch to ${next} density`}
          onClick={() => setDensity(next)}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {density === 'compact' ? 'Compact density' : 'Comfortable density'} · click for {next}
      </TooltipContent>
    </Tooltip>
  );
};
