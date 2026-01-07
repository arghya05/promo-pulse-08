import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  PlayCircle, 
  Loader2, 
  BarChart3,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronRight
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

interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  passRate: string;
  results: TestResult[];
  failedTests: { testId: string; question: string; failures: string[] }[];
}

const modules = [
  { id: 'all', label: 'All Modules' },
  { id: 'promotion', label: 'Promotion' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'assortment', label: 'Assortment' },
  { id: 'demand', label: 'Demand' },
  { id: 'supply-chain', label: 'Supply Chain' },
  { id: 'space', label: 'Space' },
  { id: 'executive', label: 'Executive' },
];

export default function ValidationDashboard() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestSummary | null>(null);
  const [selectedModule, setSelectedModule] = useState('all');
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

  const runTests = async (runAll = false) => {
    setLoading(true);
    setResults(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('test-question-alignment', {
        body: {
          moduleId: selectedModule === 'all' ? undefined : selectedModule,
          runAll,
        },
      });

      if (error) throw error;
      setResults(data);
    } catch (err) {
      console.error('Test error:', err);
    } finally {
      setLoading(false);
    }
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

  const passedTests = results?.results.filter(r => r.passed) || [];
  const failedTests = results?.results.filter(r => !r.passed) || [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Question Validation Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Automated testing for all question patterns across modules
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => runTests(false)}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-2" />}
              Quick Test (5)
            </Button>
            <Button 
              onClick={() => runTests(true)}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Run All Tests
            </Button>
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
                >
                  {mod.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {results && (
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{results.totalTests}</p>
                    <p className="text-sm text-muted-foreground">Total Tests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">{results.passed}</p>
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
                    <p className="text-2xl font-bold text-red-600">{results.failed}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    parseFloat(results.passRate) >= 90 ? 'bg-green-100' :
                    parseFloat(results.passRate) >= 70 ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <span className={`text-sm font-bold ${
                      parseFloat(results.passRate) >= 90 ? 'text-green-700' :
                      parseFloat(results.passRate) >= 70 ? 'text-yellow-700' : 'text-red-700'
                    }`}>%</span>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${
                      parseFloat(results.passRate) >= 90 ? 'text-green-600' :
                      parseFloat(results.passRate) >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>{results.passRate}</p>
                    <p className="text-sm text-muted-foreground">Pass Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Tabs */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="failed">
                <TabsList>
                  <TabsTrigger value="failed" className="gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Failed ({failedTests.length})
                  </TabsTrigger>
                  <TabsTrigger value="passed" className="gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Passed ({passedTests.length})
                  </TabsTrigger>
                  <TabsTrigger value="all">All ({results.results.length})</TabsTrigger>
                </TabsList>

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

                <TabsContent value="all">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3 pr-4">
                      {results.results.map(test => (
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

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Running tests... This may take a few minutes.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Initial State */}
        {!loading && !results && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-4">
                <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Select a module and click "Run All Tests" to validate question patterns.</p>
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
