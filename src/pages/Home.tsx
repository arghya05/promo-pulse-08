import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { modules } from '@/lib/data/modules';
import { downloadModuleQuestions } from '@/lib/data/module-questions-export';
import { kpiLibrary, getKPIsByCategory } from '@/lib/data/kpi-library';
import { companyProfile, headlineKpis } from '@/lib/data/company-profile';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  LayoutGrid,
  BarChart3,
  DollarSign,
  Percent,
  Hash,
  Activity,
  Zap,
} from 'lucide-react';
import { AgentsHub } from '@/components/agents/AgentsHub';

const formatIcon = (format: string) => {
  switch (format) {
    case 'currency': return <DollarSign className="h-4 w-4" />;
    case 'percent': return <Percent className="h-4 w-4" />;
    case 'ratio': return <Activity className="h-4 w-4" />;
    default: return <Hash className="h-4 w-4" />;
  }
};

const scaleStats = [
  { label: 'Net sales', value: '$168.4B', detail: `${companyProfile.fiscalYear} trailing` },
  { label: 'Stores', value: companyProfile.scale.stores.toLocaleString(), detail: `${companyProfile.scale.distributionCenters} DCs` },
  { label: 'Active SKUs', value: '118.4K', detail: `${companyProfile.scale.privateLabelMixPct}% private label` },
  { label: 'Weekly baskets', value: '74.2M', detail: `${companyProfile.scale.ecomMixPct}% digital mix` },
];

const Home = () => {
  const navigate = useNavigate();
  const kpisByCategory = getKPIsByCategory();

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Command center header */}
      <section className="relative border-b border-border/70 bg-gradient-surface">
        <div className="pointer-events-none absolute inset-0 bg-gradient-glow" />
        <div className="pointer-events-none absolute inset-0 grid-noise opacity-30" />
        <div className="relative mx-auto w-full max-w-screen-2xl px-4 py-8 md:px-8 md:py-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl animate-fade-up">
              <Badge variant="outline" className="mb-3 gap-1.5 border-primary/40 bg-primary/10 text-xs font-normal text-accent-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
                {companyProfile.fiscalYear} · {companyProfile.fiscalPeriod}
              </Badge>
              <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
                Merchandising command center
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                Ask any pricing, promotion, assortment, demand, supply chain or space question in
                plain language. Every answer is grounded in {companyProfile.banner} POS, loyalty,
                vendor and competitor data — no estimates, no invented numbers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:justify-end">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-status-good" />
                <span className="metric-value text-foreground">
                  {companyProfile.dataFreshness.latencyMinutes}m
                </span>
                data latency
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-2.5 py-1">
                <span className="metric-value text-foreground">
                  {companyProfile.dataFreshness.sources.length}
                </span>
                connected sources
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-2.5 py-1">
                <span className="metric-value text-foreground">{companyProfile.regions.length}</span>
                regions
              </span>
            </div>

          </div>

          {/* Live KPI rail */}
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {headlineKpis.map((kpi, i) => {
              const up = kpi.trend === 'up';
              return (
                <div
                  key={kpi.id}
                  className="panel flex animate-fade-up flex-col p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="text-[11px] uppercase leading-tight tracking-wide text-muted-foreground">
                    {kpi.label}
                  </div>
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="metric-value text-2xl font-semibold">{kpi.value}</span>
                    <span
                      className={`flex items-center gap-0.5 text-xs ${
                        up ? 'text-status-good' : 'text-status-bad'
                      }`}
                    >
                      {up ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {kpi.delta}
                    </span>
                  </div>
                  <div className="mt-auto pt-2 text-[11px] leading-snug text-muted-foreground">
                    {kpi.note}
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-screen-2xl px-4 py-8 md:px-8">
        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="mb-6 h-10 bg-secondary/60">
            <TabsTrigger value="modules" className="gap-2 text-sm">
              <LayoutGrid className="h-4 w-4" />
              Modules
            </TabsTrigger>
            <TabsTrigger value="kpis" className="gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              KPI Library
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-2 text-sm">
              <Zap className="h-4 w-4" />
              Agents
            </TabsTrigger>
          </TabsList>

          {/* Modules */}
          <TabsContent value="modules">
            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((module, i) => {
                const Icon = module.icon;
                return (
                  <Card
                    key={module.id}
                    className="group relative flex h-full animate-fade-up cursor-pointer flex-col overflow-hidden border-border/70 bg-card/70 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
                    style={{ animationDelay: `${i * 60}ms` }}
                    onClick={() => navigate(module.path)}
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity duration-300 group-hover:opacity-100 ${module.gradient}`}
                    />
                    <CardHeader className="relative pb-3">
                      <div className="flex items-start justify-between">
                        <div className={`rounded-lg border border-border/60 bg-background/60 p-2.5 transition-transform duration-300 group-hover:scale-110 ${module.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <ArrowRight className="h-4 w-4 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                      </div>
                      <CardTitle className="mt-4 text-lg">{module.name}</CardTitle>
                      <CardDescription className="min-h-[2.6rem] text-sm leading-relaxed">
                        {module.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative mt-auto flex flex-col">
                      <div className="mb-4 min-h-[2.4rem] border-t border-border/60 pt-3 text-xs leading-snug text-muted-foreground">
                        {module.focus}
                      </div>
                      <Button
                        variant="secondary"
                        className="w-full justify-between bg-secondary/70 transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                      >
                        Open workspace
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}

            </div>
          </TabsContent>

          {/* KPIs */}
          <TabsContent value="kpis">
            <div className="space-y-6">
              {Object.entries(kpisByCategory).map(([category, kpis]) => (
                <Card key={category} className="overflow-hidden border-border/70 bg-card/70">
                  <CardHeader className="border-b border-border/70 bg-secondary/40">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      {category}
                    </CardTitle>
                    <CardDescription>{kpis.length} KPIs available</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/60">
                      {kpis.map((kpi) => (
                        <div
                          key={kpi.id}
                          className="flex items-center justify-between p-4 transition-colors hover:bg-secondary/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-md bg-primary/10 p-2 text-primary">
                              {formatIcon(kpi.format)}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{kpi.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Source: {kpi.dataSource}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize text-xs font-normal">
                            {kpi.format}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card className="border-primary/25 bg-primary/5 p-6">
                <div className="text-center">
                  <div className="metric-value mb-1 text-3xl font-semibold text-primary">
                    {kpiLibrary.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Governed KPIs available across all categories
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agents">
            <AgentsHub />
          </TabsContent>
        </Tabs>
      </section>

      {/* Scale + data provenance */}
      <section className="mx-auto w-full max-w-screen-2xl px-4 pb-10 md:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-border/70 bg-card/70 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Business under management</CardTitle>
              <CardDescription>
                {companyProfile.tenant} · {companyProfile.format}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {scaleStats.map((stat) => (
                  <div key={stat.label}>
                    <div className="metric-value text-2xl font-semibold">{stat.value}</div>
                    <div className="text-sm">{stat.label}</div>
                    <div className="text-xs text-muted-foreground">{stat.detail}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Connected data sources</CardTitle>
              <CardDescription>{companyProfile.dataFreshness.posThroughDate}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {companyProfile.dataFreshness.sources.map((source) => (
                <div key={source} className="flex items-center gap-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-good" />
                  <span className="text-muted-foreground">{source}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4 border-border/70 bg-card/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-semibold">Question library</h2>
              <p className="text-sm text-muted-foreground">
                Export the top validated questions for every module as CSV
              </p>
            </div>
            <Button onClick={downloadModuleQuestions} variant="secondary" className="gap-2">
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
          </div>
        </Card>
      </section>

      <footer className="border-t border-border/70 bg-surface-sunken/60">
        <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 text-xs text-muted-foreground md:px-8">
          Algonomy Maya · Conversational merchandising intelligence · Answers reconciled against
          source-of-record data
        </div>
      </footer>
    </div>
  );
};

export default Home;
