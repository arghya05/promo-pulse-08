import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Download, Database } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function DataManagement() {
  const { toast } = useToast();
  const [stores, setStores] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [thirdPartyData, setThirdPartyData] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [marketingChannels, setMarketingChannels] = useState<any[]>([]);
  const [competitorData, setCompetitorData] = useState<any[]>([]);
  const [storePerformance, setStorePerformance] = useState<any[]>([]);
  const [customerJourney, setCustomerJourney] = useState<any[]>([]);
  const [inventoryLevels, setInventoryLevels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [
        storesData, 
        promotionsData, 
        transactionsData, 
        customersData, 
        thirdPartyDataData,
        productsData,
        marketingChannelsData,
        competitorDataData,
        storePerformanceData,
        customerJourneyData,
        inventoryLevelsData
      ] = await Promise.all([
        supabase.from('stores').select('*').limit(500),
        supabase.from('promotions').select('*').limit(500),
        supabase.from('transactions').select('*').limit(500),
        supabase.from('customers').select('*').limit(500),
        supabase.from('third_party_data').select('*').limit(500),
        supabase.from('products').select('*').limit(500),
        supabase.from('marketing_channels').select('*').limit(500),
        supabase.from('competitor_data').select('*').limit(500),
        supabase.from('store_performance').select('*').limit(500),
        supabase.from('customer_journey').select('*').limit(500),
        supabase.from('inventory_levels').select('*').limit(500),
      ]);

      setStores(storesData.data || []);
      setPromotions(promotionsData.data || []);
      setTransactions(transactionsData.data || []);
      setCustomers(customersData.data || []);
      setThirdPartyData(thirdPartyDataData.data || []);
      setProducts(productsData.data || []);
      setMarketingChannels(marketingChannelsData.data || []);
      setCompetitorData(competitorDataData.data || []);
      setStorePerformance(storePerformanceData.data || []);
      setCustomerJourney(customerJourneyData.data || []);
      setInventoryLevels(inventoryLevelsData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const DataStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-11 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground uppercase">Stores</span>
        </div>
        <div className="text-2xl font-bold">{stores.length}</div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-chart-2" />
          <span className="text-xs text-muted-foreground uppercase">Promotions</span>
        </div>
        <div className="text-2xl font-bold">{promotions.length}</div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-chart-3" />
          <span className="text-xs text-muted-foreground uppercase">Transactions</span>
        </div>
        <div className="text-2xl font-bold">{transactions.length}</div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-chart-4" />
          <span className="text-xs text-muted-foreground uppercase">Customers</span>
        </div>
        <div className="text-2xl font-bold">{customers.length}</div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-chart-5" />
          <span className="text-xs text-muted-foreground uppercase">3rd Party</span>
        </div>
        <div className="text-2xl font-bold">{thirdPartyData.length}</div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-emerald-500" />
          <span className="text-xs text-muted-foreground uppercase">Products</span>
        </div>
        <div className="text-2xl font-bold">{products.length}</div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-blue-500" />
          <span className="text-xs text-muted-foreground uppercase">Marketing</span>
        </div>
        <div className="text-2xl font-bold">{marketingChannels.length}</div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-orange-500" />
          <span className="text-xs text-muted-foreground uppercase">Competitors</span>
        </div>
        <div className="text-2xl font-bold">{competitorData.length}</div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-purple-500" />
          <span className="text-xs text-muted-foreground uppercase">Performance</span>
        </div>
        <div className="text-2xl font-bold">{storePerformance.length}</div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-pink-500" />
          <span className="text-xs text-muted-foreground uppercase">Journey</span>
        </div>
        <div className="text-2xl font-bold">{customerJourney.length}</div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-cyan-500" />
          <span className="text-xs text-muted-foreground uppercase">Inventory</span>
        </div>
        <div className="text-2xl font-bold">{inventoryLevels.length}</div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Data Management</h2>
          <p className="text-sm text-muted-foreground">Manage all your promotion analytics data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Data
          </Button>
        </div>
      </div>

      <DataStats />

      <Card className="p-6">
        <Tabs defaultValue="stores" className="w-full">
          <TabsList className="grid w-full grid-cols-11 gap-1">
            <TabsTrigger value="stores">Stores</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="third-party">3rd Party</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="competitor">Competitors</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="journey">Journey</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="stores" className="mt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store Code</TableHead>
                    <TableHead>Store Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No stores data. Import CSV or add manually to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    stores.map((store) => (
                      <TableRow key={store.id}>
                        <TableCell className="font-medium">{store.store_code}</TableCell>
                        <TableCell>{store.store_name}</TableCell>
                        <TableCell>{store.location}</TableCell>
                        <TableCell>{store.region}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{store.store_type}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="promotions" className="mt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Promotion Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No promotions data. Import CSV or add manually to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    promotions.map((promo) => (
                      <TableRow key={promo.id}>
                        <TableCell className="font-medium">{promo.promotion_name}</TableCell>
                        <TableCell>{promo.promotion_type}</TableCell>
                        <TableCell>{promo.start_date}</TableCell>
                        <TableCell>{promo.end_date}</TableCell>
                        <TableCell>{promo.discount_percent ? `${promo.discount_percent}%` : `$${promo.discount_amount}`}</TableCell>
                        <TableCell>
                          <Badge variant={promo.status === 'active' ? 'default' : 'secondary'}>
                            {promo.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No transactions data. Import CSV or add manually to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell>{new Date(txn.transaction_date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{txn.product_sku}</TableCell>
                        <TableCell>{txn.product_name}</TableCell>
                        <TableCell>{txn.quantity}</TableCell>
                        <TableCell>${parseFloat(txn.total_amount).toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="mt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Loyalty Tier</TableHead>
                    <TableHead>Lifetime Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No customers data. Import CSV or add manually to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.customer_code}</TableCell>
                        <TableCell>{customer.customer_name}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{customer.segment}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge>{customer.loyalty_tier}</Badge>
                        </TableCell>
                        <TableCell>${customer.total_lifetime_value?.toFixed(2) || '0.00'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="third-party" className="mt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Metric Name</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {thirdPartyData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No third-party data. Import CSV or add manually to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    thirdPartyData.map((data) => (
                      <TableRow key={data.id}>
                        <TableCell className="font-medium">{data.data_source}</TableCell>
                        <TableCell>{data.data_type}</TableCell>
                        <TableCell>{data.data_date}</TableCell>
                        <TableCell>{data.metric_name}</TableCell>
                        <TableCell>{data.metric_value}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Margin %</TableHead>
                    <TableHead>Elasticity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No products data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.product_sku}</TableCell>
                        <TableCell>{product.product_name}</TableCell>
                        <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                        <TableCell>{product.brand}</TableCell>
                        <TableCell>${product.base_price}</TableCell>
                        <TableCell>{product.margin_percent}%</TableCell>
                        <TableCell>{product.price_elasticity}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="marketing" className="mt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Impressions</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Engagement %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketingChannels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No marketing channels data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    marketingChannels.map((channel) => (
                      <TableRow key={channel.id}>
                        <TableCell className="font-medium">{channel.channel_name}</TableCell>
                        <TableCell><Badge>{channel.channel_type}</Badge></TableCell>
                        <TableCell>${channel.spend_amount}</TableCell>
                        <TableCell>{channel.impressions?.toLocaleString() || '-'}</TableCell>
                        <TableCell>{channel.conversions?.toLocaleString() || '-'}</TableCell>
                        <TableCell>{channel.engagement_rate || '-'}%</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="competitor" className="mt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competitor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Pricing Index</TableHead>
                    <TableHead>Promo Intensity</TableHead>
                    <TableHead>Market Share %</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitorData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No competitor data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    competitorData.map((comp) => (
                      <TableRow key={comp.id}>
                        <TableCell className="font-medium">{comp.competitor_name}</TableCell>
                        <TableCell>{comp.product_category}</TableCell>
                        <TableCell>{comp.pricing_index}</TableCell>
                        <TableCell><Badge variant={comp.promotion_intensity === 'High' ? 'destructive' : 'outline'}>{comp.promotion_intensity}</Badge></TableCell>
                        <TableCell>{comp.market_share_percent}%</TableCell>
                        <TableCell>{comp.observation_date}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Foot Traffic</TableHead>
                    <TableHead>Avg Basket</TableHead>
                    <TableHead>Conversion %</TableHead>
                    <TableHead>Total Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storePerformance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No store performance data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    storePerformance.map((perf) => (
                      <TableRow key={perf.id}>
                        <TableCell className="font-medium">{perf.store_id}</TableCell>
                        <TableCell>{perf.metric_date}</TableCell>
                        <TableCell>{perf.foot_traffic?.toLocaleString()}</TableCell>
                        <TableCell>${perf.avg_basket_size}</TableCell>
                        <TableCell>{perf.conversion_rate}%</TableCell>
                        <TableCell>${perf.total_sales?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="journey" className="mt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Touchpoint Type</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Converted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerJourney.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No customer journey data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customerJourney.map((touch) => (
                      <TableRow key={touch.id}>
                        <TableCell className="font-medium">{touch.customer_id}</TableCell>
                        <TableCell>{touch.touchpoint_type}</TableCell>
                        <TableCell><Badge variant="outline">{touch.channel}</Badge></TableCell>
                        <TableCell>{new Date(touch.touchpoint_date).toLocaleDateString()}</TableCell>
                        <TableCell>{touch.action_taken}</TableCell>
                        <TableCell><Badge variant={touch.converted ? 'default' : 'secondary'}>{touch.converted ? 'Yes' : 'No'}</Badge></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store</TableHead>
                    <TableHead>Product SKU</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Reorder Point</TableHead>
                    <TableHead>Stockout Risk</TableHead>
                    <TableHead>Last Restocked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryLevels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No inventory data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    inventoryLevels.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.store_id}</TableCell>
                        <TableCell>{inv.product_sku}</TableCell>
                        <TableCell>{inv.stock_level}</TableCell>
                        <TableCell>{inv.reorder_point}</TableCell>
                        <TableCell><Badge variant={inv.stockout_risk === 'High' ? 'destructive' : 'outline'}>{inv.stockout_risk}</Badge></TableCell>
                        <TableCell>{inv.last_restocked}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
