import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Sparkles, TrendingUp, Calendar, BarChart3, Target, Clock, MapPin, Users, Package, Truck, DollarSign, ShoppingCart, Layers, Box, Warehouse, Route, Percent, Scale, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSuggestionsByModule, SuggestionTemplate } from "@/lib/data/module-suggestions";

interface SearchSuggestionsProps {
  query: string;
  onSelect: (suggestion: string) => void;
  isVisible: boolean;
  persona: string;
  moduleId?: string;
  position?: 'bottom' | 'top';
  inputElement?: HTMLTextAreaElement | HTMLInputElement | null;
}

// Module display names for UI
const moduleDisplayNames: Record<string, string> = {
  'executive': 'Executive',
  'pricing': 'Pricing',
  'supply-chain': 'Supply Chain',
  'demand': 'Demand Forecasting',
  'assortment': 'Assortment',
  'space': 'Space Planning',
  'promotion': 'Promotion'
};

// Module-specific smart suffixes for dynamic suggestions
const moduleSmartSuffixes: Record<string, string[]> = {
  'executive': ['by region', 'by quarter', 'vs last year', 'by category', 'trends', 'forecast'],
  'pricing': ['by margin', 'by elasticity', 'vs competitors', 'by category', 'trends', 'by region'],
  'supply-chain': ['by supplier', 'by lead time', 'by region', 'by route', 'performance', 'cost'],
  'demand': ['forecast', 'by accuracy', 'by category', 'seasonal patterns', 'stockout risk', 'by store'],
  'assortment': ['by category', 'by brand', 'by store type', 'penetration', 'performance', 'by region'],
  'space': ['by sqft', 'by category', 'by fixture', 'compliance', 'by position', 'by store'],
  'promotion': ['by ROI', 'by month', 'by quarter', 'by category', 'trends', 'forecast']
};

export default function SearchSuggestions({ 
  query, 
  onSelect, 
  isVisible, 
  persona, 
  moduleId = 'promotion', 
  position = 'top',
  inputElement
}: SearchSuggestionsProps) {
  const [portalPosition, setPortalPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [useInlineMode, setUseInlineMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update portal position based on input element - robust multi-strategy approach
  useEffect(() => {
    if (!isVisible) {
      setPortalPosition(null);
      setUseInlineMode(false);
      return;
    }

    let attemptCount = 0;
    const maxAttempts = 10;

    // Multi-strategy element finder with logging
    const findInputElement = (): HTMLElement | null => {
      // Strategy 1: Use provided inputElement if valid and in DOM
      if (inputElement && document.body.contains(inputElement)) {
        return inputElement;
      }
      
      // Strategy 2: Get currently focused element (most reliable for active input)
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return activeEl as HTMLElement;
      }
      
      // Strategy 3: Find textarea in the input area with border-t class (Chat Assistant input)
      const chatInputArea = document.querySelector('.border-t textarea:not([disabled])') as HTMLElement;
      if (chatInputArea && chatInputArea.offsetParent !== null) {
        return chatInputArea;
      }
      
      // Strategy 4: Find textarea in relative overflow-visible container
      const relativeContainers = document.querySelectorAll('.relative.overflow-visible');
      for (const container of relativeContainers) {
        const textarea = container.querySelector('textarea:not([disabled])') as HTMLElement;
        if (textarea && textarea.offsetParent !== null) {
          return textarea;
        }
      }
      
      // Strategy 5: Find any visible textarea on the page
      const allTextareas = document.querySelectorAll('textarea:not([disabled])');
      for (const el of allTextareas) {
        const htmlEl = el as HTMLElement;
        if (htmlEl.offsetParent !== null && htmlEl.offsetWidth > 0) {
          return htmlEl;
        }
      }
      
      // Strategy 6: Find any visible text input on the page
      const allInputs = document.querySelectorAll('input[type="text"]:not([disabled]), input:not([type]):not([disabled])');
      for (const el of allInputs) {
        const htmlEl = el as HTMLElement;
        if (htmlEl.offsetParent !== null && htmlEl.offsetWidth > 0) {
          return htmlEl;
        }
      }
      
      return null;
    };
    
    const updatePosition = () => {
      attemptCount++;
      const el = findInputElement();
      
      if (!el) {
        // After several failed attempts, switch to inline mode as fallback
        if (attemptCount >= maxAttempts && isVisible) {
          setUseInlineMode(true);
        }
        return;
      }
      
      const rect = el.getBoundingClientRect();
      
      // Validate rect is sensible
      if (rect.width === 0 || rect.height === 0) {
        return;
      }
      
      setUseInlineMode(false);
      
      if (position === 'top') {
        setPortalPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width
        });
      } else {
        setPortalPosition({
          top: rect.bottom,
          left: rect.left,
          width: rect.width
        });
      }
    };
    
    // Run immediately
    updatePosition();
    
    // Multiple delayed attempts to catch late-mounting elements
    const timeouts = [
      setTimeout(updatePosition, 0),
      setTimeout(updatePosition, 16),
      setTimeout(updatePosition, 50),
      setTimeout(updatePosition, 100),
      setTimeout(updatePosition, 200),
      setTimeout(updatePosition, 300),
    ];
    
    // Update on resize and scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    // Keep updating position for reliable alignment
    const intervalId = setInterval(updatePosition, 100);
    
    return () => {
      timeouts.forEach(clearTimeout);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      clearInterval(intervalId);
    };
  }, [isVisible, position, inputElement]);

  // Get suggestions based on module and query
  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase().trim();
    const words = lowerQuery.split(" ").filter(w => w.length > 0);
    const firstWord = words[0] || '';
    
    let matches: Array<{ text: string; icon: any; highlight: boolean }> = [];
    
    // Get module-specific templates
    const questionTemplates = getSuggestionsByModule(moduleId);
    
    // Search ALL templates and match against text content
    Object.entries(questionTemplates).forEach(([key, templates]) => {
      if (!Array.isArray(templates)) return;
      
      templates.forEach((template: SuggestionTemplate) => {
        if (!template || !template.text) return;
        
        const text = template.text.replace("{n}", "5");
        const lowerText = text.toLowerCase();
        
        // Match if: key starts with query, OR query starts with key, OR text contains query words
        const keyMatchesQuery = key.startsWith(firstWord);
        const queryStartsWithKey = firstWord.startsWith(key);
        const textMatchesQuery = lowerText.includes(lowerQuery);
        const wordsMatchText = words.some(word => word.length > 1 && lowerText.includes(word));
        
        if (keyMatchesQuery || queryStartsWithKey || textMatchesQuery || wordsMatchText) {
          if (!matches.find(m => m.text === text)) {
            matches.push({ 
              text, 
              icon: template.icon || Sparkles, 
              highlight: keyMatchesQuery || textMatchesQuery 
            });
          }
        }
      });
    });

    // Sort by relevance
    matches.sort((a, b) => {
      const aExact = a.text.toLowerCase().includes(lowerQuery);
      const bExact = b.text.toLowerCase().includes(lowerQuery);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.highlight === b.highlight ? 0 : a.highlight ? -1 : 1;
    });

    // If no template matches, generate module-specific smart suggestions
    if (matches.length === 0) {
      const suffixes = moduleSmartSuffixes[moduleId] || moduleSmartSuffixes['promotion'];
      suffixes.slice(0, 4).forEach(suffix => {
        matches.push({ text: `${query} ${suffix}`, icon: Sparkles, highlight: false });
      });
    }

    // Limit and dedupe
    const seen = new Set<string>();
    return matches
      .filter(m => {
        const key = m.text.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);
  }, [query, moduleId]);

  // Handle selection
  const handleSelect = useCallback((suggestion: string) => {
    onSelect(suggestion);
  }, [onSelect]);

  // Don't render if not visible or no suggestions
  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  // ALWAYS use inline mode as the reliable default - portal positioning is unreliable
  const shouldUseInline = !portalPosition || useInlineMode;

  // Build dropdown content
  const dropdownContent = (
    <div 
      ref={dropdownRef}
      className="bg-popover border border-border rounded-lg shadow-xl overflow-hidden"
      style={portalPosition ? {
        position: 'fixed',
        top: position === 'top' ? portalPosition.top - 8 : portalPosition.top + 4,
        left: portalPosition.left,
        width: Math.max(portalPosition.width, 400),
        transform: position === 'top' ? 'translateY(-100%)' : 'translateY(0)',
        zIndex: 99999,
        maxWidth: '90vw',
      } : undefined}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="p-2 border-b border-border/50 bg-secondary/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>AI suggestions for <strong className="text-foreground">{moduleDisplayNames[moduleId] || moduleId}</strong></span>
        </div>
      </div>
      <ul className="py-1 max-h-[300px] overflow-y-auto">
        {suggestions.map((suggestion, idx) => (
          <li key={`${moduleId}-${idx}-${suggestion.text.substring(0, 20)}`}>
            <button
              type="button"
              className={cn(
                "w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-accent transition-colors cursor-pointer",
                suggestion.highlight && "bg-primary/5"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(suggestion.text);
              }}
            >
              <suggestion.icon className={cn(
                "h-4 w-4 flex-shrink-0",
                suggestion.highlight ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-sm text-foreground flex-1">
                {highlightMatch(suggestion.text, query)}
              </span>
              {suggestion.highlight && (
                <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  Popular
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <div className="px-4 py-2 border-t border-border/50 bg-secondary/20">
        <p className="text-[10px] text-muted-foreground">
          Press Enter to search • Click to select
        </p>
      </div>
    </div>
  );

  // Use portal if we have valid position, otherwise ALWAYS render inline
  if (portalPosition && !shouldUseInline) {
    return createPortal(dropdownContent, document.body);
  }
  
  // ALWAYS render inline as fallback - never return null when isVisible=true and suggestions exist
  return (
    <div 
      ref={containerRef}
      className="absolute left-0 right-0 bg-popover border border-border rounded-lg shadow-xl overflow-hidden"
      style={{
        bottom: position === 'top' ? '100%' : undefined,
        top: position === 'bottom' ? '100%' : undefined,
        marginBottom: position === 'top' ? '8px' : undefined,
        marginTop: position === 'bottom' ? '4px' : undefined,
        zIndex: 99999,
        minWidth: '400px',
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="p-2 border-b border-border/50 bg-secondary/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>AI suggestions for <strong className="text-foreground">{moduleDisplayNames[moduleId] || moduleId}</strong></span>
        </div>
      </div>
      <ul className="py-1 max-h-[300px] overflow-y-auto">
        {suggestions.map((suggestion, idx) => (
          <li key={`inline-${moduleId}-${idx}`}>
            <button
              type="button"
              className={cn(
                "w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-accent transition-colors cursor-pointer",
                suggestion.highlight && "bg-primary/5"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(suggestion.text);
              }}
            >
              <suggestion.icon className={cn(
                "h-4 w-4 flex-shrink-0",
                suggestion.highlight ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-sm text-foreground flex-1">
                {highlightMatch(suggestion.text, query)}
              </span>
              {suggestion.highlight && (
                <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  Popular
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <div className="px-4 py-2 border-t border-border/50 bg-secondary/20">
        <p className="text-[10px] text-muted-foreground">
          Press Enter to search • Click to select
        </p>
      </div>
    </div>
  );
}

// Helper to escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
      const escapedWord = escapeRegex(word);
      try {
        const regex = new RegExp(`(${escapedWord})`, 'gi');
        result = result.replace(regex, '**$1**');
      } catch (e) {
        // Ignore regex errors
      }
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
