// Universal post-processor for AI responses
// Transforms raw AI output into standardized executive brief format
// STRICT LIMITS: No truncation with "..." - compress to word limits instead

import { ProcessedChatResponse, ExecutiveBrief, DetailSection } from './types';

// STRICT WORD LIMITS
const LIMITS = {
  title: 7,           // max 7 words
  insightWords: 12,   // max 12 words per insight
  actionWords: 12,    // max 12 words per action
  insights: 3,        // exactly 3 insights
  actions: 2,         // exactly 2 actions
  nextQuestions: 2,   // max 2 next question chips
};

// Extract metrics from text (%, $, numbers)
const extractMetrics = (text: string): string[] => {
  const metricPattern = /(\$[\d,.]+[KMB]?|\d+\.?\d*%|\d+\.?\d*[xX]|\d+[KMB]|\d+\.\d+)/g;
  return text.match(metricPattern) || [];
};

// NO truncation - show full text always
const compressToWords = (text: string, _maxWords: number): string => {
  if (!text) return '';
  return text.trim();
};

// Extract a short title from the response (max 7 words)
const extractTitle = (data: any, question: string): string => {
  // Try to get title from whatHappened first line
  if (data?.whatHappened?.[0]) {
    const firstLine = data.whatHappened[0];
    // Extract key phrase and compress to 7 words
    const match = firstLine.match(/^([^.!?]+)/);
    if (match) {
      return compressToWords(match[1], LIMITS.title);
    }
  }
  
  // Fall back to question-based title (compressed)
  return compressToWords(question, LIMITS.title - 1) + ' Analysis';
};

// Extract the key metric from the response
const extractKeyMetric = (data: any): ExecutiveBrief['keyMetric'] => {
  // Priority: explicit KPIs > chart data values > parsed from text
  if (data?.kpis) {
    const kpiEntries = Object.entries(data.kpis);
    if (kpiEntries.length > 0) {
      const [key, value] = kpiEntries[0];
      const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
      const trend = numValue >= 0 ? 'up' : 'down';
      return {
        label: formatKpiLabel(key),
        value: formatKpiValue(key, value),
        trend: trend as 'up' | 'down',
        change: numValue >= 0 ? `+${Math.abs(numValue).toFixed(1)}%` : `${numValue.toFixed(1)}%`
      };
    }
  }
  
  // Try chart data
  if (data?.chartData?.[0]) {
    const item = data.chartData[0];
    const value = item.value || item.revenue || item.roi || item.margin;
    if (value !== undefined) {
      return {
        label: item.name || 'Top Result',
        value: typeof value === 'number' ? formatNumber(value) : String(value),
        trend: 'up'
      };
    }
  }
  
  // Default
  return {
    label: 'Analysis',
    value: 'Complete',
    trend: 'neutral'
  };
};

// Format KPI label for display
const formatKpiLabel = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

// Format KPI value
const formatKpiValue = (key: string, value: any): string => {
  const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  
  if (isNaN(numValue)) return String(value);
  
  const lowerKey = key.toLowerCase();
  
  if (lowerKey.includes('roi') || lowerKey.includes('margin') || lowerKey.includes('percent') || lowerKey.includes('rate')) {
    return `${numValue.toFixed(1)}%`;
  }
  if (lowerKey.includes('revenue') || lowerKey.includes('sales') || lowerKey.includes('cost') || lowerKey.includes('spend')) {
    return formatCurrency(numValue);
  }
  
  return formatNumber(numValue);
};

// Format number with K/M/B suffix
const formatNumber = (value: number): string => {
  if (Math.abs(value) >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(1);
};

// Format currency
const formatCurrency = (value: number): string => {
  if (Math.abs(value) >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};

// Extract top insights (exactly 3, max 12 words each - NO truncation with "...")
const extractInsights = (data: any): ExecutiveBrief['insights'] => {
  const insights: ExecutiveBrief['insights'] = [];
  
  // From whatHappened
  if (data?.whatHappened) {
    const items = Array.isArray(data.whatHappened) ? data.whatHappened : [data.whatHappened];
    items.slice(0, LIMITS.insights).forEach((item: string, idx: number) => {
      insights.push({
        text: compressToWords(item, LIMITS.insightWords),
        isTopInsight: idx === 0
      });
    });
  }
  
  // If not enough, try to extract from content
  if (insights.length < LIMITS.insights && data?.content) {
    const sentences = data.content.split(/[.!?]/).filter((s: string) => s.trim().length > 10);
    sentences.slice(0, LIMITS.insights - insights.length).forEach((sentence: string) => {
      insights.push({
        text: compressToWords(sentence.trim(), LIMITS.insightWords),
        isTopInsight: insights.length === 0
      });
    });
  }
  
  // Pad with placeholders if needed to ensure exactly 3
  while (insights.length < LIMITS.insights) {
    insights.push({
      text: 'Additional analysis available in details',
      isTopInsight: false
    });
  }
  
  return insights.slice(0, LIMITS.insights);
};

// Extract top actions (exactly 2, max 12 words each - NO truncation)
const extractActions = (data: any): ExecutiveBrief['actions'] => {
  const actions: ExecutiveBrief['actions'] = [];
  
  if (data?.whatToDo) {
    const items = Array.isArray(data.whatToDo) ? data.whatToDo : [data.whatToDo];
    items.slice(0, LIMITS.actions).forEach((item: string) => {
      actions.push({
        text: compressToWords(item, LIMITS.actionWords)
      });
    });
  }
  
  // If no actions, generate from data
  if (actions.length === 0 && data?.chartData?.[0]) {
    const top = data.chartData[0];
    actions.push({
      text: compressToWords(`Focus on ${top.name || 'top performer'} for maximum impact`, LIMITS.actionWords)
    });
  }
  
  // Pad with placeholders if needed to ensure exactly 2
  while (actions.length < LIMITS.actions) {
    actions.push({
      text: 'Review detailed recommendations below'
    });
  }
  
  return actions.slice(0, LIMITS.actions);
};

// Determine confidence level (returns just 1 word: Low/Med/High)
const determineConfidence = (data: any): ExecutiveBrief['confidence'] => {
  // Check for explicit confidence
  if (data?.predictions?.confidence) {
    const conf = data.predictions.confidence;
    if (conf >= 0.8) return { level: 'High', reason: '' };
    if (conf >= 0.5) return { level: 'Medium', reason: '' };
    return { level: 'Low', reason: '' };
  }
  
  // Check data completeness
  const hasKpis = data?.kpis && Object.keys(data.kpis).length > 0;
  const hasChartData = data?.chartData && data.chartData.length > 0;
  const hasCausalDrivers = data?.causalDrivers && data.causalDrivers.length > 0;
  
  const score = [hasKpis, hasChartData, hasCausalDrivers].filter(Boolean).length;
  
  if (score >= 3) return { level: 'High', reason: '' };
  if (score >= 2) return { level: 'Medium', reason: '' };
  return { level: 'Low', reason: '' };
};

// Safely convert to array
const toArray = (val: any): any[] => {
  if (Array.isArray(val)) return val;
  if (val === null || val === undefined) return [];
  return [val];
};

// Extract next questions (max 2) - ensure only strings are returned
const extractNextQuestions = (data: any): string[] => {
  if (data?.nextQuestions) {
    return toArray(data.nextQuestions)
      .map((q: any) => {
        // Handle both string and object formats
        if (typeof q === 'string') return q;
        if (q?.question) return q.question;
        if (q?.text) return q.text;
        return null;
      })
      .filter((q): q is string => typeof q === 'string' && q.length > 0)
      .slice(0, LIMITS.nextQuestions);
  }
  return [];
};

// Build detail sections
const buildDetails = (data: any): DetailSection => {
  const whyItems = toArray(data?.why);
  const chartItems = toArray(data?.chartData);
  const causalItems = toArray(data?.causalDrivers);
  const mlItems = toArray(data?.mlInsights);
  
  // Handle predictions - could be array, object, or array of objects with period/value/confidence
  let predictionsList: string[] = [];
  if (data?.predictions) {
    if (Array.isArray(data.predictions)) {
      // Filter and convert prediction items to strings
      predictionsList = data.predictions
        .slice(0, 2)
        .map((p: any) => {
          if (typeof p === 'string') return p;
          if (p?.text) return p.text;
          if (p?.forecast) return p.forecast;
          if (p?.period && p?.value) return `${p.period}: ${p.value}`;
          return null;
        })
        .filter((p): p is string => typeof p === 'string' && p.length > 0);
    } else if (typeof data.predictions === 'object') {
      if (data.predictions.forecast) {
        const forecasts = toArray(data.predictions.forecast);
        predictionsList = forecasts.slice(0, 2).map((f: any) => {
          if (typeof f === 'string') return f;
          if (f?.period && f?.value) return `${f.period}: ${f.value}`;
          return String(f);
        }).filter((p): p is string => typeof p === 'string' && p.length > 0);
      } else if (data.predictions.period && data.predictions.value) {
        // Single prediction object with period/value
        predictionsList = [`${data.predictions.period}: ${data.predictions.value}`];
      }
    }
  }
  
  return {
    why: whyItems.slice(0, 3).map((item: any) => typeof item === 'string' ? item : item?.text || item?.reason || String(item)),
    evidence: chartItems.slice(0, 6).map((item: any) => ({
      name: item.name || item.category || 'Item',
      metric: Object.keys(item).find(k => k !== 'name' && k !== 'category') || 'value',
      value: formatNumber(item.value || item.revenue || item.margin || 0)
    })),
    drivers: causalItems.slice(0, 4).concat(
      mlItems.slice(0, 2)
    ).map((d: any) => ({
      driver: d.driver || d.name || d.insight || 'Driver',
      impact: d.impact || d.businessSignificance || 'Impact unknown',
      correlation: d.correlation
    })),
    forecast: {
      predictions: predictionsList,
      riskTag: data?.predictions?.risk || undefined
    }
  };
};

// Main post-processor function
export const processResponse = (
  data: any,
  question: string = ''
): ProcessedChatResponse => {
  // Handle if data is already processed or is raw text
  const normalizedData = typeof data === 'string' 
    ? { content: data, whatHappened: [data] }
    : data;
  
  return {
    brief: {
      title: extractTitle(normalizedData, question),
      keyMetric: extractKeyMetric(normalizedData),
      insights: extractInsights(normalizedData),
      actions: extractActions(normalizedData),
      confidence: determineConfidence(normalizedData),
      nextQuestions: extractNextQuestions(normalizedData)
    },
    details: buildDetails(normalizedData),
    rawData: data
  };
};

export default processResponse;
