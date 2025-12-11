import { useMemo } from "react";
import { Sparkles, TrendingUp, Calendar, BarChart3, Target, Clock, MapPin, Users, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchSuggestionsProps {
  query: string;
  onSelect: (suggestion: string) => void;
  isVisible: boolean;
  persona: string;
}

// Question templates with variations
const questionTemplates = {
  "top": [
    { text: "Top {n} promotions by ROI", icon: TrendingUp, variation: "roi" },
    { text: "Top {n} promotions by margin", icon: BarChart3, variation: "margin" },
    { text: "Top {n} promotions by lift", icon: TrendingUp, variation: "lift" },
    { text: "Top {n} promotions this month", icon: Calendar, variation: "month" },
    { text: "Top {n} promotions this quarter", icon: Calendar, variation: "quarter" },
    { text: "Top {n} promotions by category", icon: Package, variation: "category" },
    { text: "Top {n} promotions by region", icon: MapPin, variation: "region" },
  ],
  "show": [
    { text: "Show me top performing promotions", icon: TrendingUp, variation: "performance" },
    { text: "Show me promotions by month", icon: Calendar, variation: "month" },
    { text: "Show me promotions by quarter", icon: Calendar, variation: "quarter" },
    { text: "Show me ROI trends over time", icon: TrendingUp, variation: "trends" },
    { text: "Show me underperforming promotions", icon: Target, variation: "risk" },
    { text: "Show me category comparison", icon: BarChart3, variation: "category" },
  ],
  "which": [
    { text: "Which promotions have best ROI?", icon: TrendingUp, variation: "roi" },
    { text: "Which promotions are losing money?", icon: Target, variation: "risk" },
    { text: "Which categories perform best?", icon: Package, variation: "category" },
    { text: "Which regions have highest lift?", icon: MapPin, variation: "region" },
    { text: "Which promotion types work best?", icon: BarChart3, variation: "type" },
    { text: "Which customer segments respond most?", icon: Users, variation: "segment" },
  ],
  "what": [
    { text: "What's our overall ROI this month?", icon: TrendingUp, variation: "roi" },
    { text: "What's our overall ROI this quarter?", icon: Calendar, variation: "quarter" },
    { text: "What's driving ROI performance?", icon: Target, variation: "drivers" },
    { text: "What promotions should we run next?", icon: Sparkles, variation: "recommend" },
    { text: "What's the optimal discount depth?", icon: BarChart3, variation: "optimize" },
    { text: "What's our forecast for next quarter?", icon: Clock, variation: "forecast" },
  ],
  "how": [
    { text: "How is Dairy performing?", icon: Package, variation: "dairy" },
    { text: "How is Beverages performing?", icon: Package, variation: "beverages" },
    { text: "How can we improve low ROI promotions?", icon: Target, variation: "improve" },
    { text: "How do promotions compare by region?", icon: MapPin, variation: "region" },
    { text: "How effective are BOGO promotions?", icon: BarChart3, variation: "bogo" },
    { text: "How are customer segments responding?", icon: Users, variation: "segment" },
  ],
  "compare": [
    { text: "Compare promotions by category", icon: Package, variation: "category" },
    { text: "Compare promotions by region", icon: MapPin, variation: "region" },
    { text: "Compare promotions by month", icon: Calendar, variation: "month" },
    { text: "Compare BOGO vs percent off", icon: BarChart3, variation: "type" },
    { text: "Compare this month vs last month", icon: Clock, variation: "time" },
    { text: "Compare Q1 vs Q2 performance", icon: Calendar, variation: "quarter" },
  ],
  "forecast": [
    { text: "Forecast next month's ROI", icon: Clock, variation: "month" },
    { text: "Forecast next quarter's performance", icon: Calendar, variation: "quarter" },
    { text: "Forecast sales for upcoming promotions", icon: TrendingUp, variation: "sales" },
    { text: "Forecast margin impact of new campaign", icon: BarChart3, variation: "margin" },
    { text: "Forecast customer response rate", icon: Users, variation: "customer" },
  ],
  "optimize": [
    { text: "Optimize discount depth for maximum ROI", icon: Target, variation: "depth" },
    { text: "Optimize promotion timing", icon: Calendar, variation: "timing" },
    { text: "Optimize budget allocation by category", icon: Package, variation: "budget" },
    { text: "Optimize promotion mix", icon: BarChart3, variation: "mix" },
    { text: "Optimize regional targeting", icon: MapPin, variation: "region" },
  ],
  "roi": [
    { text: "ROI breakdown by category", icon: Package, variation: "category" },
    { text: "ROI breakdown by region", icon: MapPin, variation: "region" },
    { text: "ROI trends over time", icon: TrendingUp, variation: "trends" },
    { text: "ROI by promotion type", icon: BarChart3, variation: "type" },
    { text: "ROI forecast for next quarter", icon: Clock, variation: "forecast" },
  ],
};

// Persona-specific category suggestions
const personaCategorySuggestions = {
  executive: ["across all categories", "for consumables vs non-consumables", "by division"],
  consumables: ["for Dairy", "for Beverages", "for Snacks", "for Bakery", "for Pantry", "for Frozen", "for Produce"],
  non_consumables: ["for Personal Care", "for Home Care", "for Soap products", "for Cleaning products"],
};

export default function SearchSuggestions({ query, onSelect, isVisible, persona }: SearchSuggestionsProps) {
  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase().trim();
    const words = lowerQuery.split(" ");
    const firstWord = words[0];
    
    let matches: Array<{ text: string; icon: any; highlight: boolean }> = [];
    
    // Find matching templates
    Object.entries(questionTemplates).forEach(([key, templates]) => {
      if (lowerQuery.includes(key) || key.startsWith(firstWord)) {
        templates.forEach(template => {
          const text = template.text.replace("{n}", "5");
          if (text.toLowerCase().includes(lowerQuery) || 
              lowerQuery.split(" ").every(word => text.toLowerCase().includes(word))) {
            matches.push({ text, icon: template.icon, highlight: true });
          }
        });
      }
    });

    // Add persona-specific variations
    const categoryVariations = personaCategorySuggestions[persona as keyof typeof personaCategorySuggestions] || [];
    if (matches.length > 0 && matches.length < 6) {
      const baseQuestion = matches[0].text;
      categoryVariations.slice(0, 3).forEach(cat => {
        const variation = `${baseQuestion} ${cat}`;
        if (!matches.find(m => m.text === variation)) {
          matches.push({ text: variation, icon: Package, highlight: false });
        }
      });
    }

    // If no template matches, generate smart suggestions based on query
    if (matches.length === 0) {
      const smartSuggestions = [
        `${query} by ROI`,
        `${query} by month`,
        `${query} by quarter`,
        `${query} by category`,
        `${query} trends`,
        `${query} forecast`,
      ];
      smartSuggestions.forEach(text => {
        matches.push({ text, icon: Sparkles, highlight: false });
      });
    }

    // Limit and dedupe
    const seen = new Set();
    return matches
      .filter(m => {
        if (seen.has(m.text.toLowerCase())) return false;
        seen.add(m.text.toLowerCase());
        return true;
      })
      .slice(0, 8);
  }, [query, persona]);

  if (!isVisible || suggestions.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
      <div className="p-2 border-b border-border/50 bg-secondary/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>AI-powered suggestions</span>
        </div>
      </div>
      <ul className="py-1 max-h-[300px] overflow-y-auto">
        {suggestions.map((suggestion, idx) => (
          <li key={idx}>
            <button
              type="button"
              className={cn(
                "w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-accent transition-colors",
                suggestion.highlight && "bg-primary/5"
              )}
              onClick={() => onSelect(suggestion.text)}
            >
              <suggestion.icon className={cn(
                "h-4 w-4 flex-shrink-0",
                suggestion.highlight ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-sm text-foreground">
                {highlightMatch(suggestion.text, query)}
              </span>
              {suggestion.highlight && (
                <span className="ml-auto text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  Popular
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <div className="px-4 py-2 border-t border-border/50 bg-secondary/20">
        <p className="text-[10px] text-muted-foreground">
          Press Enter to search • ↑↓ to navigate • Click to select
        </p>
      </div>
    </div>
  );
}

// Helper to highlight matching text
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  
  if (index === -1) {
    // Highlight individual word matches
    const words = query.toLowerCase().split(" ").filter(w => w.length > 1);
    let result = text;
    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      result = result.replace(regex, '**$1**');
    });
    
    // Convert **text** to bold spans
    const parts = result.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => 
      i % 2 === 1 ? <strong key={i} className="text-primary font-semibold">{part}</strong> : part
    );
  }
  
  return (
    <>
      {text.substring(0, index)}
      <strong className="text-primary font-semibold">
        {text.substring(index, index + query.length)}
      </strong>
      {text.substring(index + query.length)}
    </>
  );
}
