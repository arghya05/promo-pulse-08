import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  PlayCircle, 
  Loader2, 
  BarChart3,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  StopCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TestResult {
  testId: string;
  question: string;
  passed: boolean;
  failures: string[];
  response?: {
    chartDataCount: number;
    whatHappenedPreview: string;
    kpis: Record<string, any>;
    causalDriversCount: number;
  };
}

interface TestCase {
  id: string;
  question: string;
  moduleId: string;
  persona: string;
}

// Define test cases locally to run one at a time
const TEST_CASES: TestCase[] = [
  // Core patterns - quick validation
  { id: 'top-5-categories', question: 'What are the top 5 categories by revenue?', moduleId: 'promotion', persona: 'executive' },
  { id: 'top-10-products', question: 'Show me the top 10 products by revenue', moduleId: 'promotion', persona: 'executive' },
  { id: 'best-sellers', question: 'What are the best sellers by revenue?', moduleId: 'promotion', persona: 'executive' },
  { id: 'worst-performers', question: 'Which promotions are the worst performers?', moduleId: 'promotion', persona: 'executive' },
  { id: 'category-performance', question: 'How are categories performing?', moduleId: 'promotion', persona: 'executive' },
  
  // Comparison patterns
  { id: 'compare-regions', question: 'Compare performance across regions', moduleId: 'promotion', persona: 'executive' },
  { id: 'compare-stores', question: 'Compare store performance', moduleId: 'promotion', persona: 'executive' },
  { id: 'category-comparison', question: 'Compare Dairy vs Beverages performance', moduleId: 'promotion', persona: 'executive' },
  
  // Why questions
  { id: 'why-underperforming', question: 'Why are promotions underperforming?', moduleId: 'promotion', persona: 'executive' },
  { id: 'why-best-seller', question: 'Why is this product a best seller?', moduleId: 'promotion', persona: 'executive' },
  
  // KPI/ROI questions
  { id: 'roi-analysis', question: 'What is the ROI of promotions?', moduleId: 'promotion', persona: 'executive' },
  { id: 'margin-analysis', question: 'What are the margins by category?', moduleId: 'promotion', persona: 'executive' },
  
  // Out-of-shelf questions (critical)
  { id: 'oos-rate', question: "What's our out-of-shelf rate?", moduleId: 'demand', persona: 'executive' },
  { id: 'stockout-risk', question: 'Show stockout risk by category', moduleId: 'demand', persona: 'executive' },
  { id: 'low-stock-items', question: 'Which items are low on stock?', moduleId: 'demand', persona: 'executive' },
  
  // Module-specific
  { id: 'pricing-elasticity', question: 'Top 5 products by price elasticity', moduleId: 'pricing', persona: 'executive' },
  { id: 'demand-forecast', question: 'What is the demand forecast for next month?', moduleId: 'demand', persona: 'executive' },
  { id: 'supply-reliability', question: 'Top 5 suppliers by reliability', moduleId: 'supply-chain', persona: 'executive' },
  { id: 'space-efficiency', question: 'Top 5 planograms by efficiency', moduleId: 'space', persona: 'executive' },
  { id: 'assortment-products', question: 'Top 10 products for assortment optimization', moduleId: 'assortment', persona: 'executive' },
];

const modules = [
  { id: 'all', label: 'All Modules' },
  { id: 'promotion', label: 'Promotion' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'assortment', label: 'Assortment' },
  { id: 'demand', label: 'Demand' },
  { id: 'supply-chain', label: 'Supply Chain' },
  { id: 'space', label: 'Space' },
];

export default function ValidationDashboard() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [selectedModule, setSelectedModule] = useState('all');
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState<string>('');
  const abortRef = useRef(false);

  const getFilteredTests = () => {
    if (selectedModule === 'all') return TEST_CASES;
    return TEST_CASES.filter(t => t.moduleId === selectedModule);
  };

  const runSingleTest = async (test: TestCase): Promise<TestResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-module-question', {
        body: {
          question: test.question,
          moduleId: test.moduleId,
          persona: test.persona,
        },
      });

      if (error) throw error;

      // Validate the response
      const failures: string[] = [];
      const chartDataCount = data?.chartData?.length || 0;
      const whatHappened = data?.whatHappened || '';
      const causalDrivers = data?.causalDrivers || [];
      
      // Basic validations
      if (chartDataCount === 0 && !whatHappened) {
        failures.push('Empty response - no chart data or narrative');
      }
      
      // Check for generic/placeholder responses
      if (whatHappened.includes('Unable to') || whatHappened.includes('I cannot')) {
        failures.push('Response indicates inability to answer');
      }

      return {
        testId: test.id,
        question: test.question,
        passed: failures.length === 0,
        failures,
        response: {
          chartDataCount,
          whatHappenedPreview: whatHappened.substring(0, 200),
          kpis: data?.kpis || {},
          causalDriversCount: causalDrivers.length,
        },
      };
    } catch (err: any) {
      return {
        testId: test.id,
        question: test.question,
        passed: false,
        failures: [`Error: ${err.message || 'Unknown error'}`],
      };
    }
  };

  const runTests = async (quickOnly = false) => {
    abortRef.current = false;
    setLoading(true);
    setResults([]);
    setProgress(0);
    
    const tests = quickOnly ? getFilteredTests().slice(0, 5) : getFilteredTests();
    const totalTests = tests.length;
    
    for (let i = 0; i < tests.length; i++) {
      if (abortRef.current) break;
      
      const test = tests[i];
      setCurrentTest(test.question);
      setProgress(((i) / totalTests) * 100);
      
      const result = await runSingleTest(test);
      setResults(prev => [...prev, result]);
      setProgress(((i + 1) / totalTests) * 100);
    }
    
    setLoading(false);
    setCurrentTest('');
  };

  const stopTests = () => {
    abortRef.current = true;
  };

  const toggleExpanded = (testId: string) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(testId)) {
      newExpanded.delete(testId);
    } else {
      newExpanded.add(testId);
    }
    setExpandedTests(newExpanded);
  };

  const passedTests = results.filter(r => r.passed);
  const failedTests = results.filter(r => !r.passed);
  const passRate = results.length > 0 ? ((passedTests.length / results.length) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Question Validation Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Automated testing for all question patterns across modules ({TEST_CASES.length} tests)
            </p>
          </div>
          <div className="flex gap-3">
            {loading ? (
              <Button variant="destructive" onClick={stopTests}>
                <StopCircle className="h-4 w-4 mr-2" />
                Stop
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => runTests(true)}
                  disabled={loading}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Quick Test (5)
                </Button>
                <Button 
                  onClick={() => runTests(false)}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run All Tests
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Module Filter */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-2 flex-wrap">
              {modules.map(mod => (
                <Button
                  key={mod.id}
                  variant={selectedModule === mod.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedModule(mod.id)}
                  disabled={loading}
                >
                  {mod.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        {loading && (
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Running tests...</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground truncate">
                <Loader2 className="h-3 w-3 inline mr-2 animate-spin" />
                {currentTest}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {results.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{results.length}</p>
                    <p className="text-sm text-muted-foreground">Tests Run</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">{passedTests.length}</p>
                    <p className="text-sm text-muted-foreground">Passed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold text-red-600">{failedTests.length}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    parseFloat(passRate) >= 90 ? 'bg-green-100' :
                    parseFloat(passRate) >= 70 ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <span className={`text-sm font-bold ${
                      parseFloat(passRate) >= 90 ? 'text-green-700' :
                      parseFloat(passRate) >= 70 ? 'text-yellow-700' : 'text-red-700'
                    }`}>%</span>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${
                      parseFloat(passRate) >= 90 ? 'text-green-600' :
                      parseFloat(passRate) >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>{passRate}%</p>
                    <p className="text-sm text-muted-foreground">Pass Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Tabs */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All ({results.length})</TabsTrigger>
                  <TabsTrigger value="failed" className="gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Failed ({failedTests.length})
                  </TabsTrigger>
                  <TabsTrigger value="passed" className="gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Passed ({passedTests.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3 pr-4">
                      {results.map(test => (
                        <TestResultCard 
                          key={test.testId} 
                          test={test}
                          expanded={expandedTests.has(test.testId)}
                          onToggle={() => toggleExpanded(test.testId)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="failed">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3 pr-4">
                      {failedTests.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
                          <p>All tests passed! 🎉</p>
                        </div>
                      ) : (
                        failedTests.map(test => (
                          <TestResultCard 
                            key={test.testId} 
                            test={test}
                            expanded={expandedTests.has(test.testId)}
                            onToggle={() => toggleExpanded(test.testId)}
                          />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="passed">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3 pr-4">
                      {passedTests.map(test => (
                        <TestResultCard 
                          key={test.testId} 
                          test={test}
                          expanded={expandedTests.has(test.testId)}
                          onToggle={() => toggleExpanded(test.testId)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Initial State */}
        {!loading && results.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-4">
                <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Click "Run All Tests" to validate question patterns.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function TestResultCard({ 
  test, 
  expanded, 
  onToggle 
}: { 
  test: TestResult; 
  expanded: boolean; 
  onToggle: () => void;
}) {
  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <div className={`border rounded-lg p-4 ${test.passed ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-start gap-3">
            {test.passed ? (
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{test.testId}</span>
                <Badge variant="outline" className="text-xs">
                  {test.passed ? 'PASS' : 'FAIL'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{test.question}</p>
            </div>
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-4 pt-4 border-t space-y-3">
            {!test.passed && test.failures.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-600 mb-2">Failures:</p>
                <ul className="list-disc list-inside space-y-1">
                  {test.failures.map((f, i) => (
                    <li key={i} className="text-sm text-red-700">{f}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {test.response && (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Chart Items:</span>
                  <span className="ml-2 font-medium">{test.response.chartDataCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Causal Drivers:</span>
                  <span className="ml-2 font-medium">{test.response.causalDriversCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">KPIs:</span>
                  <span className="ml-2 font-medium">
                    {Object.keys(test.response.kpis || {}).length}
                  </span>
                </div>
              </div>
            )}
            
            {test.response?.whatHappenedPreview && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Response Preview:</p>
                <p className="text-sm bg-muted p-2 rounded">{test.response.whatHappenedPreview}...</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
