// Unified chat types used across all modules

export interface ExecutiveBrief {
  title: string; // max 8 words
  keyMetric: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
    change?: string;
  };
  insights: Array<{
    text: string; // max 120 chars
    isTopInsight?: boolean;
  }>;
  actions: Array<{
    text: string; // max 120 chars
  }>;
  confidence: {
    level: 'Low' | 'Medium' | 'High';
    reason: string; // max 60 chars
  };
  nextQuestions: string[];
}

export interface DetailSection {
  why: string[];
  evidence: Array<{
    name: string;
    metric: string;
    value: string;
  }>;
  drivers: Array<{
    driver: string;
    impact: string;
    correlation?: number;
  }>;
  forecast: {
    predictions: string[];
    riskTag?: string;
  };
}

export interface ProcessedChatResponse {
  brief: ExecutiveBrief;
  details: DetailSection;
  rawData?: any;
}

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  isError?: boolean;
  processedResponse?: ProcessedChatResponse;
  rawData?: any;
  clarificationOptions?: Array<{
    label: string;
    description: string;
    refinedQuestion: string;
  }>;
  drillContext?: {
    dimension: string;
    value: string;
    level: number;
  };
}
