import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { modules } from '@/lib/data/modules';
import { Compass, Database, LayoutDashboard, MessagesSquare, ShieldCheck } from 'lucide-react';

const overview = [
  { label: 'Command Center', path: '/', icon: LayoutDashboard },
  { label: 'Ask Maya', path: '/ask', icon: MessagesSquare },
  { label: 'Data Discovery', path: '/discover', icon: Compass },
  { label: 'Data Quality', path: '/data-quality', icon: Database },
  { label: 'Answer Validation', path: '/validation', icon: ShieldCheck },
];

const quickAsks = [
  'Which departments are driving the gross margin decline this period?',
  'Forecast next 8 weeks of Fresh demand and flag risk stores',
  'What if we cut KVI prices 3% in the Midwest?',
  'Where is on-shelf availability costing us the most sales?',
];

export const GlobalCommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to a module or ask Maya…" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>
        <CommandGroup heading="Overview">
          {overview.map((item) => (
            <CommandItem key={item.path} value={item.label} onSelect={() => go(item.path)}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Merchandising modules">
          {modules.map((module) => (
            <CommandItem
              key={module.id}
              value={`${module.name} ${module.focus}`}
              onSelect={() => go(module.path)}
            >
              <module.icon className={`mr-2 h-4 w-4 ${module.color}`} />
              <span className="truncate">{module.name}</span>
              <span className="ml-auto truncate pl-3 text-xs text-muted-foreground">
                {module.focus}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Ask Maya">
          {quickAsks.map((q) => (
            <CommandItem
              key={q}
              value={q}
              onSelect={() => go(`/ask?q=${encodeURIComponent(q)}`)}
            >
              <MessagesSquare className="mr-2 h-4 w-4 text-primary" />
              <span className="truncate">{q}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
