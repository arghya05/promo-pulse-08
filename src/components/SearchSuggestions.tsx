import { useMemo } from "react";
import { Sparkles, TrendingUp, Calendar, BarChart3, Target, Clock, MapPin, Users, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSuggestionsByModule, SuggestionTemplate } from "@/lib/data/module-suggestions";

interface SearchSuggestionsProps {
  query: string;
  onSelect: (suggestion: string) => void;
  isVisible: boolean;
  persona: string;
  moduleId?: string;
}

// Persona-specific category suggestions
const personaCategorySuggestions = {
  executive: ["across all categories", "for consumables vs non-consumables", "by division"],
  consumables: ["for Dairy", "for Beverages", "for Snacks", "for Bakery", "for Pantry", "for Frozen", "for Produce"],
  non_consumables: ["for Personal Care", "for Home Care", "for Soap products", "for Cleaning products"],
};

export default function SearchSuggestions({ query, onSelect, isVisible, persona, moduleId = 'promotion' }: SearchSuggestionsProps) {
  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase().trim();
    const words = lowerQuery.split(" ");
    const firstWord = words[0];
    
    let matches: Array<{ text: string; icon: any; highlight: boolean }> = [];
    
    // Get module-specific templates
    const questionTemplates = getSuggestionsByModule(moduleId);
    
    // Find matching templates
    Object.entries(questionTemplates).forEach(([key, templates]) => {
      if (lowerQuery.includes(key) || key.startsWith(firstWord)) {
        templates.forEach((template: SuggestionTemplate) => {
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

    // If no template matches, generate module-specific smart suggestions based on query
    if (matches.length === 0) {
      const moduleSmartSuffixes = getModuleSmartSuffixes(moduleId);
      moduleSmartSuffixes.forEach(suffix => {
        matches.push({ text: `${query} ${suffix}`, icon: Sparkles, highlight: false });
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
  }, [query, persona, moduleId]);

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
                "w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-accent transition-colors cursor-pointer",
                suggestion.highlight && "bg-primary/5"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(suggestion.text);
              }}
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

// Helper to get module-specific smart suffixes
function getModuleSmartSuffixes(moduleId: string): string[] {
  switch (moduleId) {
    case 'pricing':
      return ['by margin', 'by elasticity', 'vs competitors', 'by category', 'trends', 'by region'];
    case 'supply-chain':
      return ['by supplier', 'by lead time', 'by region', 'by route', 'performance', 'cost'];
    case 'demand':
      return ['forecast', 'by accuracy', 'by category', 'seasonal patterns', 'stockout risk', 'by store'];
    case 'assortment':
      return ['by category', 'by brand', 'by store type', 'penetration', 'performance', 'by region'];
    case 'space':
      return ['by sqft', 'by category', 'by fixture', 'compliance', 'by position', 'by store'];
    default:
      return ['by ROI', 'by month', 'by quarter', 'by category', 'trends', 'forecast'];
  }
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
