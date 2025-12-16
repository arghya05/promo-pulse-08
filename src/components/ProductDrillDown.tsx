import { useState, useEffect } from "react";
import { X, Store, Calendar, Users, TrendingUp, TrendingDown, Package, DollarSign, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface ProductDrillDownProps {
  product: {
    name: string;
    sku?: string;
    category?: string;
    brand?: string;
    revenue?: number;
    margin?: number;
    units?: number;
  };
  onClose: () => void;
}

interface StorePerformance {
  storeName: string;
  storeCode: string;
  region: string;
  revenue: number;
  units: number;
  margin: number;
  marginPct: number;
  transactions: number;
}

interface TimePeriodData {
  period: string;
  revenue: number;
  units: number;
  margin: number;
  trend: 'up' | 'down' | 'stable';
}

interface CustomerSegmentData {
  segment: string;
  revenue: number;
  units: number;
  margin: number;
  customerCount: number;
  avgOrderValue: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function ProductDrillDown({ product, onClose }: ProductDrillDownProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [storeData, setStoreData] = useState<StorePerformance[]>([]);
  const [timeData, setTimeData] = useState<TimePeriodData[]>([]);
  const [segmentData, setSegmentData] = useState<CustomerSegmentData[]>([]);
  const [activeTab, setActiveTab] = useState("stores");

  useEffect(() => {
    fetchProductData();
  }, [product]);

  const fetchProductData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch transactions for this product
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          stores(store_name, store_code, region),
          customers(segment, loyalty_tier)
        `)
        .or(`product_sku.eq.${product.sku},product_name.eq.${product.name}`)
        .order('transaction_date', { ascending: false })
        .limit(2000);

      if (error) {
        console.error('Error fetching product transactions:', error);
        generateMockData();
        return;
      }

      if (!transactions || transactions.length === 0) {
        generateMockData();
        return;
      }

      // Process store performance
      const storeMap = new Map<string, StorePerformance>();
      transactions.forEach((tx: any) => {
        const storeKey = tx.stores?.store_code || 'Unknown';
        if (!storeMap.has(storeKey)) {
          storeMap.set(storeKey, {
            storeName: tx.stores?.store_name || 'Unknown Store',
            storeCode: storeKey,
            region: tx.stores?.region || 'Unknown',
            revenue: 0,
            units: 0,
            margin: 0,
            marginPct: 0,
            transactions: 0
          });
        }
        const store = storeMap.get(storeKey)!;
        store.revenue += Number(tx.total_amount) || 0;
        store.units += Number(tx.quantity) || 0;
        store.margin += (Number(tx.total_amount) || 0) - (Number(tx.discount_amount) || 0);
        store.transactions++;
      });
      
      const storeResults = Array.from(storeMap.values())
        .map(s => ({ ...s, marginPct: s.revenue > 0 ? (s.margin / s.revenue) * 100 : 0 }))
        .sort((a, b) => b.revenue - a.revenue);
      setStoreData(storeResults);

      // Process time period data
      const timeMap = new Map<string, TimePeriodData>();
      transactions.forEach((tx: any) => {
        const date = new Date(tx.transaction_date);
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        
        if (!timeMap.has(monthKey)) {
          timeMap.set(monthKey, {
            period: monthKey,
            revenue: 0,
            units: 0,
            margin: 0,
            trend: 'stable'
          });
        }
        const period = timeMap.get(monthKey)!;
        period.revenue += Number(tx.total_amount) || 0;
        period.units += Number(tx.quantity) || 0;
        period.margin += (Number(tx.total_amount) || 0) - (Number(tx.discount_amount) || 0);
      });
      
      const timeResults = Array.from(timeMap.values())
        .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());
      
      // Calculate trends
      for (let i = 1; i < timeResults.length; i++) {
        const diff = timeResults[i].revenue - timeResults[i-1].revenue;
        timeResults[i].trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable';
      }
      setTimeData(timeResults);

      // Process customer segment data
      const segmentMap = new Map<string, CustomerSegmentData>();
      const customerSet = new Map<string, Set<string>>();
      
      transactions.forEach((tx: any) => {
        const segment = tx.customers?.segment || 'Unknown';
        
        if (!segmentMap.has(segment)) {
          segmentMap.set(segment, {
            segment,
            revenue: 0,
            units: 0,
            margin: 0,
            customerCount: 0,
            avgOrderValue: 0
          });
          customerSet.set(segment, new Set());
        }
        
        const seg = segmentMap.get(segment)!;
        seg.revenue += Number(tx.total_amount) || 0;
        seg.units += Number(tx.quantity) || 0;
        seg.margin += (Number(tx.total_amount) || 0) - (Number(tx.discount_amount) || 0);
        
        if (tx.customer_id) {
          customerSet.get(segment)!.add(tx.customer_id);
        }
      });
      
      const segmentResults = Array.from(segmentMap.values()).map(s => ({
        ...s,
        customerCount: customerSet.get(s.segment)?.size || 0,
        avgOrderValue: s.customerCount > 0 ? s.revenue / (customerSet.get(s.segment)?.size || 1) : 0
      })).sort((a, b) => b.revenue - a.revenue);
      setSegmentData(segmentResults);

    } catch (err) {
      console.error('Error processing product data:', err);
      generateMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockData = () => {
    // Generate mock store data
    const mockStores: StorePerformance[] = [
      { storeName: 'Downtown Manhattan', storeCode: 'NYC-001', region: 'Northeast', revenue: 125000, units: 4500, margin: 31250, marginPct: 25, transactions: 890 },
      { storeName: 'Chicago Loop', storeCode: 'CHI-001', region: 'Midwest', revenue: 98000, units: 3800, margin: 24500, marginPct: 25, transactions: 720 },
      { storeName: 'LA Westside', storeCode: 'LAX-001', region: 'West', revenue: 87000, units: 3200, margin: 21750, marginPct: 25, transactions: 650 },
      { storeName: 'Houston Central', storeCode: 'HOU-001', region: 'Southwest', revenue: 76000, units: 2900, margin: 19000, marginPct: 25, transactions: 580 },
      { storeName: 'Atlanta Midtown', storeCode: 'ATL-001', region: 'Southeast', revenue: 65000, units: 2500, margin: 16250, marginPct: 25, transactions: 490 },
    ];
    setStoreData(mockStores);

    // Generate mock time data
    const mockTime: TimePeriodData[] = [
      { period: 'Jul 2024', revenue: 45000, units: 1800, margin: 11250, trend: 'stable' },
      { period: 'Aug 2024', revenue: 52000, units: 2100, margin: 13000, trend: 'up' },
      { period: 'Sep 2024', revenue: 48000, units: 1950, margin: 12000, trend: 'down' },
      { period: 'Oct 2024', revenue: 61000, units: 2400, margin: 15250, trend: 'up' },
      { period: 'Nov 2024', revenue: 78000, units: 3100, margin: 19500, trend: 'up' },
      { period: 'Dec 2024', revenue: 92000, units: 3600, margin: 23000, trend: 'up' },
    ];
    setTimeData(mockTime);

    // Generate mock segment data
    const mockSegments: CustomerSegmentData[] = [
      { segment: 'Premium', revenue: 180000, units: 4500, margin: 54000, customerCount: 450, avgOrderValue: 400 },
      { segment: 'Regular', revenue: 145000, units: 5800, margin: 36250, customerCount: 1200, avgOrderValue: 121 },
      { segment: 'Value', revenue: 95000, units: 4200, margin: 19000, customerCount: 890, avgOrderValue: 107 },
      { segment: 'New', revenue: 32000, units: 1400, margin: 6400, customerCount: 280, avgOrderValue: 114 },
    ];
    setSegmentData(mockSegments);

    setIsLoading(false);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <span className="h-4 w-4 text-muted-foreground">—</span>;
  };

  // Calculate totals for summary
  const totalRevenue = storeData.reduce((sum, s) => sum + s.revenue, 0);
  const totalUnits = storeData.reduce((sum, s) => sum + s.units, 0);
  const totalMargin = storeData.reduce((sum, s) => sum + s.margin, 0);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Package className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">{product.name}</h2>
              {product.sku && <Badge variant="outline">{product.sku}</Badge>}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {product.category && <span>Category: {product.category}</span>}
              {product.brand && <span>• Brand: {product.brand}</span>}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-primary/5">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          </Card>
          <Card className="p-4 bg-green-500/5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Total Margin</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalMargin)}</p>
          </Card>
          <Card className="p-4 bg-blue-500/5">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Units Sold</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(totalUnits)}</p>
          </Card>
          <Card className="p-4 bg-purple-500/5">
            <div className="flex items-center gap-2 mb-1">
              <Store className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Stores</span>
            </div>
            <p className="text-2xl font-bold">{storeData.length}</p>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="stores" className="gap-2">
              <Store className="h-4 w-4" />
              Store Performance
            </TabsTrigger>
            <TabsTrigger value="time" className="gap-2">
              <Calendar className="h-4 w-4" />
              Time Trends
            </TabsTrigger>
            <TabsTrigger value="segments" className="gap-2">
              <Users className="h-4 w-4" />
              Customer Segments
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Loading product data...</span>
            </div>
          ) : (
            <>
              {/* Store Performance Tab */}
              <TabsContent value="stores" className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4">Revenue by Store</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={storeData.slice(0, 8)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                        <YAxis type="category" dataKey="storeName" width={120} fontSize={12} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4">Revenue by Region</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(
                            storeData.reduce((acc, s) => {
                              acc[s.region] = (acc[s.region] || 0) + s.revenue;
                              return acc;
                            }, {} as Record<string, number>)
                          ).map(([name, value]) => ({ name, value }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          dataKey="value"
                        >
                          {storeData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead className="text-right">Margin %</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {storeData.map((store, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{store.storeName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{store.region}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(store.revenue)}</TableCell>
                        <TableCell className="text-right">{formatNumber(store.units)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(store.margin)}</TableCell>
                        <TableCell className="text-right">{store.marginPct.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{store.transactions}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Time Trends Tab */}
              <TabsContent value="time" className="space-y-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Revenue & Margin Trend</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={timeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="margin" stroke="#10b981" strokeWidth={2} name="Margin" dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Units Sold Trend</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={timeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={(v) => formatNumber(v)} />
                      <Tooltip formatter={(v: number) => formatNumber(v)} />
                      <Bar dataKey="units" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Units" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead className="text-center">Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeData.map((period, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{period.period}</TableCell>
                        <TableCell className="text-right">{formatCurrency(period.revenue)}</TableCell>
                        <TableCell className="text-right">{formatNumber(period.units)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(period.margin)}</TableCell>
                        <TableCell className="text-center">{getTrendIcon(period.trend)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Customer Segments Tab */}
              <TabsContent value="segments" className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4">Revenue by Customer Segment</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={segmentData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ segment, percent }) => `${segment} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          dataKey="revenue"
                          nameKey="segment"
                        >
                          {segmentData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4">Units by Customer Segment</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={segmentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="segment" />
                        <YAxis tickFormatter={(v) => formatNumber(v)} />
                        <Tooltip formatter={(v: number) => formatNumber(v)} />
                        <Bar dataKey="units" fill="#10b981" radius={[4, 4, 0, 0]} name="Units" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Segment</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead className="text-right">Customers</TableHead>
                      <TableHead className="text-right">Avg Order Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {segmentData.map((seg, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="font-medium">{seg.segment}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(seg.revenue)}</TableCell>
                        <TableCell className="text-right">{formatNumber(seg.units)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(seg.margin)}</TableCell>
                        <TableCell className="text-right">{seg.customerCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(seg.avgOrderValue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </>
          )}
        </Tabs>
      </Card>
    </div>
  );
}
