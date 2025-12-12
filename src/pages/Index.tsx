import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, Package, Store, ShoppingCart, Layers, ArrowRight, Sparkles } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-8 py-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              AI-Powered Retail Analytics
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-6 tracking-tight">
              Retail Intelligence Platform
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose your analytics focus area to get started with AI-powered insights
            </p>
          </div>

          {/* Two Version Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Promotion Intelligence Card */}
            <Link to="/promotion" className="group">
              <Card className="h-full p-8 bg-card hover:bg-card/80 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 cursor-pointer">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <TrendingUp className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Promotion Intelligence</h2>
                      <p className="text-muted-foreground">Current Version</p>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-6 flex-grow">
                    Focused analytics for promotion ROI, campaign performance, and promotional spend optimization.
                  </p>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-sm text-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Promotion ROI & Margin Analysis
                    </div>
                    <div className="flex items-center gap-3 text-sm text-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Campaign Performance Tracking
                    </div>
                    <div className="flex items-center gap-3 text-sm text-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Halo & Cannibalization Effects
                    </div>
                    <div className="flex items-center gap-3 text-sm text-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Coupon Funnel Analytics
                    </div>
                  </div>

                  <Button className="w-full gap-2 group-hover:gap-4 transition-all">
                    Launch Promotion Intelligence
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </Link>

            {/* Merchandising Analytics Card */}
            <Link to="/merchandising" className="group">
              <Card className="h-full p-8 bg-card hover:bg-card/80 border-border hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:shadow-accent/5 cursor-pointer relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-semibold">
                    EXPANDED
                  </span>
                </div>
                
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                      <Layers className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Merchandising Analytics</h2>
                      <p className="text-muted-foreground">Full Platform</p>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-6 flex-grow">
                    Comprehensive merchandising analytics covering pricing, assortment, space planning, demand forecasting, and supply chain.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <BarChart3 className="h-4 w-4 text-accent" />
                      Pricing Analytics
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Package className="h-4 w-4 text-accent" />
                      Assortment Planning
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Store className="h-4 w-4 text-accent" />
                      Space Planning
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <TrendingUp className="h-4 w-4 text-accent" />
                      Demand Forecasting
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <ShoppingCart className="h-4 w-4 text-accent" />
                      Replenishment
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Layers className="h-4 w-4 text-accent" />
                      Supply Chain
                    </div>
                  </div>

                  <Button variant="outline" className="w-full gap-2 group-hover:gap-4 transition-all border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                    Launch Merchandising Analytics
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </Link>
          </div>

          {/* Footer Note */}
          <p className="text-center text-sm text-muted-foreground mt-12">
            Both platforms share the same underlying data infrastructure and AI capabilities
          </p>
        </div>
      </div>
    </div>
  );
}
