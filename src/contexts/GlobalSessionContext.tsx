import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Session insight stored globally
export interface GlobalSessionInsight {
  id: string;
  moduleId: string;
  moduleName: string;
  question: string;
  keyFinding: string;
  timestamp: Date;
  context?: {
    category?: string;
    metric?: string;
    timePeriod?: string;
  };
}

// Conversation memory entry for extended memory
export interface MemoryEntry {
  id: string;
  moduleId: string;
  role: 'user' | 'assistant';
  content: string;
  summary?: string;
  timestamp: Date;
  importance: 'high' | 'medium' | 'low';
}

// Cross-module navigation suggestion
export interface CrossModuleLink {
  targetModuleId: string;
  targetModuleName: string;
  reason: string;
  preserveContext: boolean;
}

// Global context for the entire session
interface GlobalSessionContextType {
  // All insights across modules
  globalInsights: GlobalSessionInsight[];
  addInsight: (insight: Omit<GlobalSessionInsight, 'id'>) => void;
  getModuleInsights: (moduleId: string) => GlobalSessionInsight[];
  
  // Extended memory across modules
  memoryEntries: MemoryEntry[];
  addMemoryEntry: (entry: Omit<MemoryEntry, 'id'>) => void;
  getRecentMemory: (moduleId: string, limit?: number) => MemoryEntry[];
  getMemorySummary: () => string;
  
  // Cross-module navigation
  pendingNavigation: CrossModuleLink | null;
  setPendingNavigation: (link: CrossModuleLink | null) => void;
  
  // Shared context that persists across modules
  sharedContext: {
    lastCategory?: string;
    lastMetric?: string;
    lastTimePeriod?: string;
    recentTopics: string[];
  };
  updateSharedContext: (updates: Partial<GlobalSessionContextType['sharedContext']>) => void;
  
  // Session summary
  getSessionSummary: () => string;
  
  // Reset session
  resetSession: () => void;
}

const GlobalSessionContext = createContext<GlobalSessionContextType | undefined>(undefined);

// Module name mapping
const moduleNames: Record<string, string> = {
  'promotion': 'Promotion Intelligence',
  'pricing': 'Pricing Intelligence',
  'demand': 'Demand Forecasting',
  'supply-chain': 'Supply Chain',
  'assortment': 'Assortment Planning',
  'space': 'Space Planning'
};

// Detect which module a question relates to
export const detectTargetModule = (question: string): CrossModuleLink | null => {
  const lowerQuestion = question.toLowerCase();
  
  const moduleKeywords: Record<string, string[]> = {
    'pricing': ['price', 'pricing', 'margin', 'markup', 'discount', 'elasticity', 'competitor price'],
    'demand': ['demand', 'forecast', 'stockout', 'inventory', 'replenishment', 'safety stock'],
    'supply-chain': ['supplier', 'supply chain', 'logistics', 'shipping', 'lead time', 'delivery'],
    'assortment': ['assortment', 'sku', 'product mix', 'category', 'portfolio', 'discontinue'],
    'space': ['planogram', 'shelf', 'fixture', 'space', 'layout', 'placement'],
    'promotion': ['promotion', 'promo', 'roi', 'lift', 'campaign', 'bogo', 'coupon']
  };
  
  // Check for cross-module phrases
  const crossPhrases = [
    /how does (.+?) (?:impact|affect|influence) (.+?)/i,
    /what.s the (?:impact|effect) (?:of|on) (.+?) on (.+?)/i,
    /(.+?) implications for (.+?)/i,
    /switch to (.+?)/i,
    /show me (.+?) module/i,
    /go to (.+?)/i
  ];
  
  for (const [moduleId, keywords] of Object.entries(moduleKeywords)) {
    for (const keyword of keywords) {
      if (lowerQuestion.includes(keyword)) {
        // Check if it's asking to switch or about cross-module impact
        const isCrossModule = crossPhrases.some(p => p.test(lowerQuestion));
        if (isCrossModule || lowerQuestion.includes('switch') || lowerQuestion.includes('go to')) {
          return {
            targetModuleId: moduleId,
            targetModuleName: moduleNames[moduleId],
            reason: `Your question relates to ${moduleNames[moduleId]}`,
            preserveContext: true
          };
        }
      }
    }
  }
  
  return null;
};

export const GlobalSessionProvider = ({ children }: { children: ReactNode }) => {
  const [globalInsights, setGlobalInsights] = useState<GlobalSessionInsight[]>([]);
  const [memoryEntries, setMemoryEntries] = useState<MemoryEntry[]>([]);
  const [pendingNavigation, setPendingNavigation] = useState<CrossModuleLink | null>(null);
  const [sharedContext, setSharedContext] = useState<GlobalSessionContextType['sharedContext']>({
    recentTopics: []
  });

  const addInsight = useCallback((insight: Omit<GlobalSessionInsight, 'id'>) => {
    setGlobalInsights(prev => [...prev, {
      ...insight,
      id: `global-insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }]);
  }, []);

  const getModuleInsights = useCallback((moduleId: string) => {
    return globalInsights.filter(i => i.moduleId === moduleId);
  }, [globalInsights]);

  const addMemoryEntry = useCallback((entry: Omit<MemoryEntry, 'id'>) => {
    setMemoryEntries(prev => {
      const newEntry = {
        ...entry,
        id: `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Keep last 50 entries, summarize older ones
      const updated = [...prev, newEntry];
      if (updated.length > 50) {
        // Mark older entries as summarized
        return updated.slice(-50);
      }
      return updated;
    });
  }, []);

  const getRecentMemory = useCallback((moduleId: string, limit = 10) => {
    return memoryEntries
      .filter(m => m.moduleId === moduleId)
      .slice(-limit);
  }, [memoryEntries]);

  const getMemorySummary = useCallback(() => {
    if (memoryEntries.length === 0) return '';
    
    // Group by module
    const byModule: Record<string, MemoryEntry[]> = {};
    memoryEntries.forEach(m => {
      if (!byModule[m.moduleId]) byModule[m.moduleId] = [];
      byModule[m.moduleId].push(m);
    });
    
    const summaries: string[] = [];
    for (const [moduleId, entries] of Object.entries(byModule)) {
      const moduleName = moduleNames[moduleId] || moduleId;
      const highImportance = entries.filter(e => e.importance === 'high');
      if (highImportance.length > 0) {
        summaries.push(`${moduleName}: ${highImportance.map(e => e.content.substring(0, 50)).join('; ')}`);
      }
    }
    
    return summaries.join('\n');
  }, [memoryEntries]);

  const updateSharedContext = useCallback((updates: Partial<GlobalSessionContextType['sharedContext']>) => {
    setSharedContext(prev => ({
      ...prev,
      ...updates,
      recentTopics: updates.recentTopics 
        ? [...new Set([...updates.recentTopics, ...prev.recentTopics])].slice(0, 10)
        : prev.recentTopics
    }));
  }, []);

  const getSessionSummary = useCallback(() => {
    if (globalInsights.length === 0) {
      return "No insights gathered yet in this session.";
    }
    
    // Group insights by module
    const byModule: Record<string, GlobalSessionInsight[]> = {};
    globalInsights.forEach(i => {
      if (!byModule[i.moduleId]) byModule[i.moduleId] = [];
      byModule[i.moduleId].push(i);
    });
    
    const parts: string[] = [`Session Summary (${globalInsights.length} insights across ${Object.keys(byModule).length} module${Object.keys(byModule).length > 1 ? 's' : ''}):\n`];
    
    for (const [moduleId, insights] of Object.entries(byModule)) {
      const moduleName = moduleNames[moduleId] || moduleId;
      parts.push(`\n**${moduleName}** (${insights.length} insights):`);
      insights.slice(-3).forEach((insight, i) => {
        parts.push(`  ${i + 1}. ${insight.question}: ${insight.keyFinding}`);
      });
    }
    
    if (sharedContext.lastCategory) {
      parts.push(`\nLast focus: ${sharedContext.lastCategory}`);
    }
    if (sharedContext.lastMetric) {
      parts.push(`Key metric: ${sharedContext.lastMetric}`);
    }
    
    return parts.join('\n');
  }, [globalInsights, sharedContext]);

  const resetSession = useCallback(() => {
    setGlobalInsights([]);
    setMemoryEntries([]);
    setPendingNavigation(null);
    setSharedContext({ recentTopics: [] });
  }, []);

  return (
    <GlobalSessionContext.Provider value={{
      globalInsights,
      addInsight,
      getModuleInsights,
      memoryEntries,
      addMemoryEntry,
      getRecentMemory,
      getMemorySummary,
      pendingNavigation,
      setPendingNavigation,
      sharedContext,
      updateSharedContext,
      getSessionSummary,
      resetSession
    }}>
      {children}
    </GlobalSessionContext.Provider>
  );
};

export const useGlobalSession = () => {
  const context = useContext(GlobalSessionContext);
  if (!context) {
    throw new Error('useGlobalSession must be used within a GlobalSessionProvider');
  }
  return context;
};

export default GlobalSessionContext;
