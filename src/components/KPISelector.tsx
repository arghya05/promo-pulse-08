import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, Check, X, Sparkles, TrendingUp, DollarSign, Users, Package, Megaphone, Target, Store, ShoppingBag } from "lucide-react";
import { kpiLibrary, getSuggestedKPIs, getKPIsByCategory, type KPI } from "@/lib/data/kpi-library";
import { cn } from "@/lib/utils";

interface KPISelectorProps {
  question: string;
  selectedKPIs: string[];
  onKPIsChange: (kpis: string[]) => void;
  isLoading?: boolean;
}

const categoryIcons: Record<string, React.ReactNode> = {
  promotion: <TrendingUp className="h-3.5 w-3.5" />,
  financial: <DollarSign className="h-3.5 w-3.5" />,
  customer: <Users className="h-3.5 w-3.5" />,
  inventory: <Package className="h-3.5 w-3.5" />,
  marketing: <Megaphone className="h-3.5 w-3.5" />,
  competitive: <Target className="h-3.5 w-3.5" />,
  store: <Store className="h-3.5 w-3.5" />,
  product: <ShoppingBag className="h-3.5 w-3.5" />,
};

const categoryLabels: Record<string, string> = {
  promotion: 'Promotion',
  financial: 'Financial',
  customer: 'Customer',
  inventory: 'Inventory',
  marketing: 'Marketing',
  competitive: 'Competitive',
  store: 'Store',
  product: 'Product',
};

export default function KPISelector({ question, selectedKPIs, onKPIsChange, isLoading }: KPISelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Get AI-suggested KPIs based on question
  const suggestedKPIs = useMemo(() => {
    return question.trim() ? getSuggestedKPIs(question) : [];
  }, [question]);
  
  // Get all KPIs grouped by category
  const kpisByCategory = useMemo(() => getKPIsByCategory(), []);
  
  // Auto-select suggested KPIs when question changes
  useEffect(() => {
    if (suggestedKPIs.length > 0 && selectedKPIs.length === 0) {
      // Auto-select first 4 suggested KPIs
      onKPIsChange(suggestedKPIs.slice(0, 4).map(kpi => kpi.id));
    }
  }, [suggestedKPIs]);
  
  const toggleKPI = (kpiId: string) => {
    if (selectedKPIs.includes(kpiId)) {
      onKPIsChange(selectedKPIs.filter(id => id !== kpiId));
    } else {
      onKPIsChange([...selectedKPIs, kpiId]);
    }
  };
  
  const selectAllSuggested = () => {
    onKPIsChange(suggestedKPIs.map(kpi => kpi.id));
  };
  
  const clearAll = () => {
    onKPIsChange([]);
  };
  
  const getKPIById = (id: string): KPI | undefined => {
    return kpiLibrary.find(kpi => kpi.id === id);
  };
  
  if (!question.trim()) return null;
  
  return (
    <Card className="p-3 bg-card/50 border-border/50">
      <div className="space-y-3">
        {/* Header with AI badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Suggested KPIs</span>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-0">
              AI-Powered
            </Badge>
          </div>
          
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                Browse All
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-0" align="end">
              <Tabs defaultValue="suggested" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                  <TabsTrigger 
                    value="suggested" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Suggested
                  </TabsTrigger>
                  <TabsTrigger 
                    value="all"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    All KPIs
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="suggested" className="m-0">
                  <ScrollArea className="h-[300px] p-4">
                    <div className="space-y-2">
                      {suggestedKPIs.map(kpi => (
                        <div
                          key={kpi.id}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                            selectedKPIs.includes(kpi.id) 
                              ? "bg-primary/10 border border-primary/30" 
                              : "hover:bg-accent border border-transparent"
                          )}
                          onClick={() => toggleKPI(kpi.id)}
                        >
                          <div className={cn(
                            "mt-0.5 h-5 w-5 rounded border flex items-center justify-center flex-shrink-0",
                            selectedKPIs.includes(kpi.id) 
                              ? "bg-primary border-primary text-primary-foreground" 
                              : "border-border"
                          )}>
                            {selectedKPIs.includes(kpi.id) && <Check className="h-3 w-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{kpi.label}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {categoryLabels[kpi.category]}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{kpi.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="all" className="m-0">
                  <ScrollArea className="h-[300px] p-4">
                    <div className="space-y-4">
                      {Object.entries(kpisByCategory).map(([category, kpis]) => (
                        <div key={category}>
                          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                            {categoryIcons[category]}
                            <span>{categoryLabels[category]}</span>
                            <span className="text-xs">({kpis.length})</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {kpis.map(kpi => (
                              <div
                                key={kpi.id}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors text-xs",
                                  selectedKPIs.includes(kpi.id) 
                                    ? "bg-primary/10 text-primary" 
                                    : "hover:bg-accent"
                                )}
                                onClick={() => toggleKPI(kpi.id)}
                                title={kpi.description}
                              >
                                <div className={cn(
                                  "h-4 w-4 rounded border flex items-center justify-center flex-shrink-0",
                                  selectedKPIs.includes(kpi.id) 
                                    ? "bg-primary border-primary text-primary-foreground" 
                                    : "border-border"
                                )}>
                                  {selectedKPIs.includes(kpi.id) && <Check className="h-2.5 w-2.5" />}
                                </div>
                                <span className="truncate">{kpi.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
              
              <div className="flex items-center justify-between p-3 border-t bg-muted/30">
                <span className="text-xs text-muted-foreground">
                  {selectedKPIs.length} selected
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAll}>
                    Clear
                  </Button>
                  <Button size="sm" className="h-7 text-xs" onClick={() => setIsOpen(false)}>
                    Done
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Selected KPI chips */}
        <div className="flex flex-wrap gap-2">
          {suggestedKPIs.slice(0, 8).map(kpi => {
            const isSelected = selectedKPIs.includes(kpi.id);
            return (
              <Badge
                key={kpi.id}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all text-xs py-1 px-2.5 gap-1.5",
                  isSelected 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => toggleKPI(kpi.id)}
              >
                {categoryIcons[kpi.category]}
                {kpi.name}
                {isSelected && (
                  <X className="h-3 w-3 ml-0.5 hover:text-destructive" />
                )}
              </Badge>
            );
          })}
        </div>
        
        {/* Quick actions */}
        {selectedKPIs.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{selectedKPIs.length} KPI{selectedKPIs.length !== 1 ? 's' : ''} selected for analysis</span>
            <button 
              className="text-primary hover:underline"
              onClick={selectAllSuggested}
            >
              Select all suggested
            </button>
            <span>•</span>
            <button 
              className="text-muted-foreground hover:text-foreground"
              onClick={clearAll}
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
