import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestCase {
  id: string;
  question: string;
  moduleId: string;
  persona: string;
  expectedPattern: string;
  validations: ValidationRule[];
}

interface ValidationRule {
  type: 'count' | 'contains' | 'chartDataCount' | 'hasKPI' | 'textContains' | 'noEmpty';
  field?: string;
  expectedCount?: number;
  expectedValue?: string;
  minCount?: number;
}

interface TestResult {
  testId: string;
  question: string;
  passed: boolean;
  failures: string[];
  response?: any;
}

// Define all test cases for common question patterns
const testCases: TestCase[] = [
  // TOP N PATTERNS
  {
    id: 'top-5-categories',
    question: 'What are the top 5 categories by revenue?',
    moduleId: 'promotion',
    persona: 'executive',
    expectedPattern: 'top_n',
    validations: [
      { type: 'chartDataCount', expectedCount: 5 },
      { type: 'textContains', field: 'whatHappened', expectedValue: '1.' },
      { type: 'textContains', field: 'whatHappened', expectedValue: '5.' },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },
  {
    id: 'top-10-products',
    question: 'Show me the top 10 products by revenue',
    moduleId: 'promotion',
    persona: 'executive',
    expectedPattern: 'top_n',
    validations: [
      { type: 'chartDataCount', expectedCount: 10 },
      { type: 'textContains', field: 'whatHappened', expectedValue: '1.' },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },
  {
    id: 'top-3-promotions',
    question: 'What are the top 3 promotions by ROI?',
    moduleId: 'promotion',
    persona: 'executive',
    expectedPattern: 'top_n',
    validations: [
      { type: 'chartDataCount', expectedCount: 3 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },
  {
    id: 'top-7-stores',
    question: 'Top 7 stores by sales',
    moduleId: 'promotion',
    persona: 'executive',
    expectedPattern: 'top_n',
    validations: [
      { type: 'chartDataCount', expectedCount: 7 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },

  // BEST/WORST PATTERNS
  {
    id: 'best-sellers',
    question: 'What are the best sellers by revenue?',
    moduleId: 'promotion',
    persona: 'executive',
    expectedPattern: 'best_worst',
    validations: [
      { type: 'chartDataCount', minCount: 5 },
      { type: 'noEmpty', field: 'chartData' },
      { type: 'noEmpty', field: 'whatHappened' },
    ]
  },
  {
    id: 'worst-performers',
    question: 'Which promotions are the worst performers?',
    moduleId: 'promotion',
    persona: 'executive',
    expectedPattern: 'best_worst',
    validations: [
      { type: 'chartDataCount', minCount: 3 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },
  {
    id: 'top-performers',
    question: 'Show me the top performers by margin',
    moduleId: 'promotion',
    persona: 'executive',
    expectedPattern: 'best_worst',
    validations: [
      { type: 'chartDataCount', minCount: 5 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },
  {
    id: 'underperforming',
    question: 'Which products are underperforming?',
    moduleId: 'promotion',
    persona: 'executive',
    expectedPattern: 'best_worst',
    validations: [
      { type: 'chartDataCount', minCount: 3 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },

  // CATEGORY QUESTIONS
  {
    id: 'category-performance',
    question: 'How are categories performing?',
    moduleId: 'promotion',
    persona: 'executive',
    expectedPattern: 'category',
    validations: [
      { type: 'chartDataCount', minCount: 3 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },
  {
    id: 'category-comparison',
    question: 'Compare Dairy vs Beverages performance',
    moduleId: 'promotion',
    persona: 'executive',
    expectedPattern: 'comparison',
    validations: [
      { type: 'chartDataCount', minCount: 2 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },

  // COMPARISON PATTERNS
  {
    id: 'compare-regions',
    question: 'Compare performance across regions',
    moduleId: 'promotion',
    persona: 'executive',
    expectedPattern: 'comparison',
    validations: [
      { type: 'chartDataCount', minCount: 2 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },
  {
    id: 'compare-stores',
    question: 'Compare store performance',
    moduleId: 'promotion',
    persona: 'executive',
    expectedPattern: 'comparison',
    validations: [
      { type: 'chartDataCount', minCount: 2 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },

  // WHY QUESTIONS
  {
    id: 'why-underperforming',
    question: 'Why are promotions underperforming?',
    moduleId: 'promotion',
    persona: 'executive',
    expectedPattern: 'why',
    validations: [
      { type: 'noEmpty', field: 'why' },
      { type: 'noEmpty', field: 'causalDrivers' },
      { type: 'chartDataCount', minCount: 1 },
    ]
  },
  {
    id: 'why-best-seller',
    question: 'Why is this product a best seller?',
    moduleId: 'promotion',
    persona: 'executive',
    expectedPattern: 'why',
    validations: [
      { type: 'noEmpty', field: 'why' },
      { type: 'noEmpty', field: 'causalDrivers' },
    ]
  },

  // ROI QUESTIONS
  {
    id: 'roi-analysis',
    question: 'What is the ROI of promotions?',
    moduleId: 'promotion',
    persona: 'executive',
    expectedPattern: 'kpi',
    validations: [
      { type: 'hasKPI', expectedValue: 'roi' },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },
  {
    id: 'high-roi-promotions',
    question: 'Which promotions have the highest ROI?',
    moduleId: 'promotion',
    persona: 'executive',
    expectedPattern: 'top_n',
    validations: [
      { type: 'chartDataCount', minCount: 3 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },

  // MARGIN QUESTIONS
  {
    id: 'margin-analysis',
    question: 'What are the margins by category?',
    moduleId: 'promotion',
    persona: 'executive',
    expectedPattern: 'category',
    validations: [
      { type: 'chartDataCount', minCount: 3 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },

  // REVENUE QUESTIONS
  {
    id: 'revenue-breakdown',
    question: 'Show revenue breakdown by category',
    moduleId: 'promotion',
    persona: 'executive',
    expectedPattern: 'category',
    validations: [
      { type: 'chartDataCount', minCount: 3 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },

  // LIFT QUESTIONS
  {
    id: 'lift-analysis',
    question: 'What is the lift from promotions?',
    moduleId: 'promotion',
    persona: 'executive',
    expectedPattern: 'kpi',
    validations: [
      { type: 'noEmpty', field: 'chartData' },
      { type: 'noEmpty', field: 'whatHappened' },
    ]
  },

  // PRICING MODULE
  {
    id: 'pricing-top-5',
    question: 'Top 5 products by price elasticity',
    moduleId: 'pricing',
    persona: 'executive',
    expectedPattern: 'top_n',
    validations: [
      { type: 'chartDataCount', expectedCount: 5 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },
  {
    id: 'pricing-competitor',
    question: 'How do our prices compare to competitors?',
    moduleId: 'pricing',
    persona: 'executive',
    expectedPattern: 'comparison',
    validations: [
      { type: 'chartDataCount', minCount: 1 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },

  // DEMAND MODULE
  {
    id: 'demand-forecast',
    question: 'What is the demand forecast for next month?',
    moduleId: 'demand',
    persona: 'executive',
    expectedPattern: 'forecast',
    validations: [
      { type: 'noEmpty', field: 'chartData' },
      { type: 'noEmpty', field: 'whatHappened' },
    ]
  },
  {
    id: 'demand-top-5',
    question: 'Top 5 products at stockout risk',
    moduleId: 'demand',
    persona: 'executive',
    expectedPattern: 'top_n',
    validations: [
      { type: 'chartDataCount', expectedCount: 5 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },

  // SUPPLY CHAIN MODULE
  {
    id: 'supply-top-suppliers',
    question: 'Top 5 suppliers by reliability',
    moduleId: 'supply-chain',
    persona: 'executive',
    expectedPattern: 'top_n',
    validations: [
      { type: 'chartDataCount', expectedCount: 5 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },

  // SPACE MODULE
  {
    id: 'space-planograms',
    question: 'Top 5 planograms by efficiency',
    moduleId: 'space',
    persona: 'executive',
    expectedPattern: 'top_n',
    validations: [
      { type: 'chartDataCount', expectedCount: 5 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },

  // ASSORTMENT MODULE
  {
    id: 'assortment-top-products',
    question: 'Top 10 products for assortment optimization',
    moduleId: 'assortment',
    persona: 'executive',
    expectedPattern: 'top_n',
    validations: [
      { type: 'chartDataCount', expectedCount: 10 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },

  // PERSONA-SPECIFIC
  {
    id: 'consumables-persona',
    question: 'Top 5 consumable categories by revenue',
    moduleId: 'promotion',
    persona: 'consumables',
    expectedPattern: 'top_n',
    validations: [
      { type: 'chartDataCount', expectedCount: 5 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },
  {
    id: 'non-consumables-persona',
    question: 'Top 5 non-consumable products by margin',
    moduleId: 'promotion',
    persona: 'non-consumables',
    expectedPattern: 'top_n',
    validations: [
      { type: 'chartDataCount', expectedCount: 5 },
      { type: 'noEmpty', field: 'chartData' },
    ]
  },
];

function validateResponse(testCase: TestCase, response: any): string[] {
  const failures: string[] = [];

  if (!response || typeof response !== 'object') {
    failures.push('Response is null or not an object');
    return failures;
  }

  for (const rule of testCase.validations) {
    try {
      switch (rule.type) {
        case 'chartDataCount':
          const chartData = response.chartData || [];
          if (rule.expectedCount !== undefined && chartData.length !== rule.expectedCount) {
            failures.push(`Expected ${rule.expectedCount} chart items, got ${chartData.length}`);
          }
          if (rule.minCount !== undefined && chartData.length < rule.minCount) {
            failures.push(`Expected at least ${rule.minCount} chart items, got ${chartData.length}`);
          }
          break;

        case 'noEmpty':
          const fieldValue = response[rule.field!];
          if (fieldValue === null || fieldValue === undefined) {
            failures.push(`Field '${rule.field}' is null or undefined`);
          } else if (Array.isArray(fieldValue) && fieldValue.length === 0) {
            failures.push(`Field '${rule.field}' is an empty array`);
          } else if (typeof fieldValue === 'string' && fieldValue.trim() === '') {
            failures.push(`Field '${rule.field}' is an empty string`);
          }
          break;

        case 'textContains':
          const textValue = String(response[rule.field!] || '');
          if (!textValue.includes(rule.expectedValue!)) {
            failures.push(`Field '${rule.field}' does not contain '${rule.expectedValue}'`);
          }
          break;

        case 'hasKPI':
          const kpis = response.kpis || {};
          if (!(rule.expectedValue! in kpis) || kpis[rule.expectedValue!] === null || kpis[rule.expectedValue!] === undefined) {
            failures.push(`KPI '${rule.expectedValue}' is missing or null`);
          }
          break;

        case 'contains':
          const containsValue = String(response[rule.field!] || '');
          if (!containsValue.toLowerCase().includes(rule.expectedValue!.toLowerCase())) {
            failures.push(`Field '${rule.field}' does not contain '${rule.expectedValue}'`);
          }
          break;
      }
    } catch (e) {
      failures.push(`Validation error for rule ${rule.type}: ${e}`);
    }
  }

  // Additional universal validations with proper type checking
  const whatHappened = response.whatHappened;
  if (!whatHappened || (typeof whatHappened === 'string' && whatHappened.trim() === '')) {
    failures.push("'whatHappened' is empty");
  }
  
  const why = response.why;
  if (!why || (typeof why === 'string' && why.trim() === '')) {
    failures.push("'why' is empty");
  }
  
  const whatToDo = response.whatToDo;
  if (!whatToDo || (typeof whatToDo === 'string' && whatToDo.trim() === '')) {
    failures.push("'whatToDo' is empty");
  }

  return failures;
}

async function runTest(testCase: TestCase, supabaseUrl: string, supabaseKey: string): Promise<TestResult> {
  console.log(`Running test: ${testCase.id} - "${testCase.question}"`);
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/analyze-module-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        question: testCase.question,
        moduleId: testCase.moduleId,
        persona: testCase.persona,
        selectedKpis: [],
        timePeriod: 'last_year',
        conversationHistory: [],
        sessionInsights: [],
      }),
    });

    if (!response.ok) {
      return {
        testId: testCase.id,
        question: testCase.question,
        passed: false,
        failures: [`HTTP error: ${response.status} ${response.statusText}`],
      };
    }

    const data = await response.json();
    const failures = validateResponse(testCase, data);

    return {
      testId: testCase.id,
      question: testCase.question,
      passed: failures.length === 0,
      failures,
      response: {
        chartDataCount: Array.isArray(data.chartData) ? data.chartData.length : 0,
        whatHappenedPreview: typeof data.whatHappened === 'string' ? data.whatHappened.substring(0, 100) : JSON.stringify(data.whatHappened || '').substring(0, 100),
        kpis: data.kpis,
        causalDriversCount: Array.isArray(data.causalDrivers) ? data.causalDrivers.length : 0,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      testId: testCase.id,
      question: testCase.question,
      passed: false,
      failures: [`Exception: ${errorMessage}`],
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { testIds, moduleId, runAll } = await req.json();

    let testsToRun = testCases;

    // Filter by specific test IDs if provided
    if (testIds && testIds.length > 0) {
      testsToRun = testCases.filter(tc => testIds.includes(tc.id));
    }

    // Filter by module if provided
    if (moduleId) {
      testsToRun = testsToRun.filter(tc => tc.moduleId === moduleId);
    }

    // Limit to 5 tests if not running all (for quick validation)
    if (!runAll && testsToRun.length > 5) {
      testsToRun = testsToRun.slice(0, 5);
    }

    console.log(`Running ${testsToRun.length} tests...`);

    const results: TestResult[] = [];
    
    // Run tests sequentially to avoid overwhelming the edge function
    for (const testCase of testsToRun) {
      const result = await runTest(testCase, supabaseUrl, supabaseKey);
      results.push(result);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    const summary = {
      totalTests: results.length,
      passed,
      failed,
      passRate: `${((passed / results.length) * 100).toFixed(1)}%`,
      results,
      failedTests: results.filter(r => !r.passed).map(r => ({
        testId: r.testId,
        question: r.question,
        failures: r.failures,
      })),
    };

    console.log(`Test Summary: ${passed}/${results.length} passed (${summary.passRate})`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Test runner error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
