import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shell/AppSidebar';
import { companyProfile } from '@/lib/data/company-profile';
import { Badge } from '@/components/ui/badge';
import { Database } from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => (
  <SidebarProvider>
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-background/80 px-3 backdrop-blur-md">
          <SidebarTrigger />
          <div className="h-5 w-px bg-border" />
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-semibold">
              {companyProfile.tenant}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {companyProfile.format} · {companyProfile.scale.stores.toLocaleString()} stores ·{' '}
              {companyProfile.regions.length} regions
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="hidden gap-1.5 border-border/70 text-[11px] font-normal text-muted-foreground sm:flex">
              <Database className="h-3 w-3" />
              {companyProfile.dataFreshness.posThroughDate}
            </Badge>
            <Badge className="gap-1.5 bg-accent text-[11px] font-normal text-accent-foreground hover:bg-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-status-good animate-pulse-dot" />
              Live
            </Badge>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  </SidebarProvider>
);

export default AppShell;
