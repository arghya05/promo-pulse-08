import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Module } from '@/lib/data/modules';
import { companyProfile } from '@/lib/data/company-profile';

interface ModuleLayoutProps {
  module: Module;
  children: ReactNode;
}

const ModuleLayout = ({ module, children }: ModuleLayoutProps) => {
  const Icon = module.icon;

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Module header */}
      <div className="relative border-b border-border/70 bg-gradient-surface">
        <div className="pointer-events-none absolute inset-0 bg-gradient-glow opacity-70" />
        <div className="relative mx-auto flex w-full max-w-screen-2xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`rounded-lg border border-border/60 bg-background/60 p-2.5 ${module.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">{module.name}</h1>
              <p className="truncate text-xs text-muted-foreground">{module.focus}</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5 border-border/70 text-[11px] font-normal text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-status-good animate-pulse-dot" />
            {companyProfile.fiscalYear} · {companyProfile.fiscalPeriod}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <main className="min-w-0 max-w-full overflow-x-hidden">{children}</main>
    </div>
  );
};

export default ModuleLayout;
