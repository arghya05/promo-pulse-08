import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, TrendingUp, Target, Package, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExpectedImpact {
  liftPct: number;
  roi: number;
  marginImpact: number;
  unitsMoved: number;
}

interface Rationale {
  inventory: string;
  competition: string;
  customer: string;
}

interface Recommendation {
  title: string;
  promotionType: string;
  targetCategory: string;
  targetSegment: string;
  discountMechanic: string;
  rationale: Rationale;
  expectedImpact: ExpectedImpact;
  priority: "High" | "Medium" | "Low";
  timing: string;
  stores: string[];
}

interface RecommendationsResponse {
  recommendations: Recommendation[];
}

export const RecommendationsEngine = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateRecommendations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<RecommendationsResponse>(
        'generate-recommendations'
      );

      if (error) throw error;

      if (data?.recommendations) {
        setRecommendations(data.recommendations);
        toast({
          title: "Recommendations Generated",
          description: `${data.recommendations.length} promotion recommendations ready`,
        });
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate recommendations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-destructive text-destructive-foreground";
      case "Medium": return "bg-warning text-warning-foreground";
      case "Low": return "bg-muted text-muted-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Smart Recommendations
          </h2>
          <p className="text-muted-foreground mt-1">
            AI-powered promotion suggestions based on inventory, competition, and customer segments
          </p>
        </div>
        <Button
          onClick={generateRecommendations}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Recommendations
            </>
          )}
        </Button>
      </div>

      {recommendations.length === 0 && !isLoading && (
        <Card className="p-12 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
          <p className="text-muted-foreground mb-4">
            Click "Generate Recommendations" to get AI-powered promotion suggestions
          </p>
        </Card>
      )}

      <div className="grid gap-6">
        {recommendations.map((rec, idx) => (
          <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold">{rec.title}</h3>
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority} Priority
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {rec.promotionType}
                    </span>
                    <span>•</span>
                    <span>{rec.targetCategory}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {rec.targetSegment}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-accent/50 rounded-lg p-4">
                <div className="font-semibold text-lg mb-2">{rec.discountMechanic}</div>
                <div className="text-sm text-muted-foreground">
                  {rec.timing} • {rec.stores.join(", ")}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Package className="w-4 h-4 text-primary" />
                    Inventory Impact
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.rationale.inventory}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Competitive Position
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.rationale.competition}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Users className="w-4 h-4 text-primary" />
                    Customer Appeal
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.rationale.customer}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2 border-t">
                <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                  <span className="text-sm text-muted-foreground">Sales Lift:</span>
                  <span className="font-bold text-primary">+{rec.expectedImpact.liftPct}%</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                  <span className="text-sm text-muted-foreground">ROI:</span>
                  <span className={`font-bold ${rec.expectedImpact.roi >= 1.5 ? 'text-success' : rec.expectedImpact.roi >= 1 ? 'text-warning' : 'text-destructive'}`}>
                    {rec.expectedImpact.roi.toFixed(2)}x
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                  <span className="text-sm text-muted-foreground">Margin Impact:</span>
                  <span className={`font-bold ${rec.expectedImpact.marginImpact >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(rec.expectedImpact.marginImpact)}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                  <span className="text-sm text-muted-foreground">Units:</span>
                  <span className="font-bold">{rec.expectedImpact.unitsMoved.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
