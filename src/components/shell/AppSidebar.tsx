import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { modules } from '@/lib/data/modules';
import { companyProfile } from '@/lib/data/company-profile';
import { Compass, LayoutDashboard, MessagesSquare, Network, ShieldCheck, Sparkles } from 'lucide-react';

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { pathname } = useLocation();

  const isActive = (path: string) => pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border/70 px-3 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-primary shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate font-display text-sm font-semibold leading-tight">
                Maya Intelligence
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {companyProfile.banner}
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/')} tooltip="Command center">
                  <NavLink to="/" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    {!collapsed && <span>Command Center</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/ask')} tooltip="Ask Maya anything">
                  <NavLink to="/ask" className="flex items-center gap-2">
                    <MessagesSquare className="h-4 w-4 text-primary" />
                    {!collapsed && <span>Ask Maya</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/data')}
                  tooltip="Data engineering: graph, catalog, ingestion & quality"
                >
                  <NavLink to="/data" className="flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    {!collapsed && <span>Data Engineering</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Merchandising modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <SidebarMenuItem key={module.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(module.path)}
                      tooltip={module.name}
                    >
                      <NavLink to={module.path} className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${module.color}`} />
                        {!collapsed && <span className="truncate">{module.shortName}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Trust</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/validation')}
                  tooltip="Answer validation"
                >
                  <NavLink to="/validation" className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    {!collapsed && <span>Answer Validation</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="border-t border-sidebar-border/70 px-3 py-3">
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-status-good animate-pulse-dot" />
              <span>Data live · {companyProfile.dataFreshness.latencyMinutes}m latency</span>
            </div>
            <div className="metric-value">
              {companyProfile.fiscalYear} · {companyProfile.fiscalPeriod}
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

export default AppSidebar;
