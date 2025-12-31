// Universal post-processor for AI responses
// Transforms raw AI output into standardized executive brief format

import { ProcessedChatResponse, ExecutiveBrief, DetailSection } from './types';

// Extract metrics from text (%, $, numbers)
const extractMetrics = (text: string): string[] => {
  const metricPattern = /(\$[\d,.]+[KMB]?|\d+\.?\d*%|\d+\.?\d*[xX]|\d+[KMB]|\d+\.\d+)/g;
  return text.match(metricPattern) || [];
};

// Truncate text to max length with ellipsis
const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// Extract a short title from the response
const extractTitle = (data: any, question: string): string => {
  // Try to get title from whatHappened first line
  if (data?.whatHappened?.[0]) {
    const firstLine = data.whatHappened[0];
    // Extract first sentence or key phrase
    const match = firstLine.match(/^([^.!?]{10,60})/);
    if (match) {
      const words = match[1].split(' ').slice(0, 8);
      return words.join(' ');
    }
  }
  
  // Fall back to question-based title
  const questionWords = question.split(' ').slice(0, 6);
  return questionWords.join(' ') + ' Analysis';
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

// Extract top insights (max 3, 120 chars each)
const extractInsights = (data: any): ExecutiveBrief['insights'] => {
  const insights: ExecutiveBrief['insights'] = [];
  
  // From whatHappened
  if (data?.whatHappened) {
    const items = Array.isArray(data.whatHappened) ? data.whatHappened : [data.whatHappened];
    items.slice(0, 3).forEach((item: string, idx: number) => {
      insights.push({
        text: truncate(item, 120),
        isTopInsight: idx === 0
      });
    });
  }
  
  // If not enough, try to extract from content
  if (insights.length < 3 && data?.content) {
    const sentences = data.content.split(/[.!?]/).filter((s: string) => s.trim().length > 20);
    sentences.slice(0, 3 - insights.length).forEach((sentence: string) => {
      insights.push({
        text: truncate(sentence.trim(), 120),
        isTopInsight: insights.length === 0
      });
    });
  }
  
  return insights.slice(0, 3);
};

// Extract top actions (max 2, 120 chars each)
const extractActions = (data: any): ExecutiveBrief['actions'] => {
  const actions: ExecutiveBrief['actions'] = [];
  
  if (data?.whatToDo) {
    const items = Array.isArray(data.whatToDo) ? data.whatToDo : [data.whatToDo];
    items.slice(0, 2).forEach((item: string) => {
      actions.push({
        text: truncate(item, 120)
      });
    });
  }
  
  // If no actions, generate from data
  if (actions.length === 0 && data?.chartData?.[0]) {
    const top = data.chartData[0];
    actions.push({
      text: `Focus on ${top.name || 'top performer'} for maximum impact`
    });
  }
  
  return actions.slice(0, 2);
};

// Determine confidence level
const determineConfidence = (data: any): ExecutiveBrief['confidence'] => {
  // Check for explicit confidence
  if (data?.predictions?.confidence) {
    const conf = data.predictions.confidence;
    if (conf >= 0.8) return { level: 'High', reason: `${(conf * 100).toFixed(0)}% model confidence` };
    if (conf >= 0.5) return { level: 'Medium', reason: `${(conf * 100).toFixed(0)}% model confidence` };
    return { level: 'Low', reason: `${(conf * 100).toFixed(0)}% model confidence` };
  }
  
  // Check data completeness
  const hasKpis = data?.kpis && Object.keys(data.kpis).length > 0;
  const hasChartData = data?.chartData && data.chartData.length > 0;
  const hasCausalDrivers = data?.causalDrivers && data.causalDrivers.length > 0;
  
  const score = [hasKpis, hasChartData, hasCausalDrivers].filter(Boolean).length;
  
  if (score >= 3) return { level: 'High', reason: 'Rich data with multiple sources' };
  if (score >= 2) return { level: 'Medium', reason: 'Good data coverage' };
  return { level: 'Low', reason: 'Limited data available' };
};

// Extract next questions
const extractNextQuestions = (data: any): string[] => {
  if (data?.nextQuestions) {
    return data.nextQuestions.slice(0, 3);
  }
  return [];
};

// Build detail sections
const buildDetails = (data: any): DetailSection => {
  return {
    why: data?.why?.slice(0, 3) || [],
    evidence: (data?.chartData || []).slice(0, 6).map((item: any) => ({
      name: item.name || item.category || 'Item',
      metric: Object.keys(item).find(k => k !== 'name' && k !== 'category') || 'value',
      value: formatNumber(item.value || item.revenue || item.margin || 0)
    })),
    drivers: (data?.causalDrivers || []).slice(0, 4).concat(
      (data?.mlInsights || []).slice(0, 2)
    ).map((d: any) => ({
      driver: d.driver || d.name || d.insight || 'Driver',
      impact: d.impact || d.businessSignificance || 'Impact unknown',
      correlation: d.correlation
    })),
    forecast: {
      predictions: data?.predictions?.slice?.(0, 2) || 
        (data?.predictions?.forecast ? [data.predictions.forecast] : []),
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
