import { useState, useEffect, useMemo } from "react";
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
import { DataTableFilter } from "@/components/DataTableFilter";

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

  // Filter states for each tab
  const [storeFilters, setStoreFilters] = useState<Record<string, string>>({});
  const [promoFilters, setPromoFilters] = useState<Record<string, string>>({});
  const [txnFilters, setTxnFilters] = useState<Record<string, string>>({});
  const [customerFilters, setCustomerFilters] = useState<Record<string, string>>({});
  const [thirdPartyFilters, setThirdPartyFilters] = useState<Record<string, string>>({});
  const [productFilters, setProductFilters] = useState<Record<string, string>>({});
  const [marketingFilters, setMarketingFilters] = useState<Record<string, string>>({});
  const [competitorFilters, setCompetitorFilters] = useState<Record<string, string>>({});
  const [perfFilters, setPerfFilters] = useState<Record<string, string>>({});
  const [journeyFilters, setJourneyFilters] = useState<Record<string, string>>({});
  const [inventoryFilters, setInventoryFilters] = useState<Record<string, string>>({});

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
        supabase.from('stores').select('*').limit(2000),
        supabase.from('promotions').select('*').limit(2000),
        supabase.from('transactions').select('*').limit(2000),
        supabase.from('customers').select('*').limit(2000),
        supabase.from('third_party_data').select('*').limit(2000),
        supabase.from('products').select('*').limit(2000),
        supabase.from('marketing_channels').select('*').limit(2000),
        supabase.from('competitor_data').select('*').limit(2000),
        supabase.from('store_performance').select('*').limit(2000),
        supabase.from('customer_journey').select('*').limit(2000),
        supabase.from('inventory_levels').select('*').limit(2000),
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

  // Filter helper functions
  const getUniqueValues = (data: any[], key: string) => 
    [...new Set(data.map(item => item[key]).filter(Boolean))].sort();

  // Create a lookup map for store names by ID
  const storeNameMap = useMemo(() => {
    const map = new Map<string, string>();
    stores.forEach(store => {
      map.set(store.id, store.store_name || store.store_code || 'Unknown');
    });
    return map;
  }, [stores]);

  // Helper to get store display name from store_id
  const getStoreName = (storeId: string | null) => {
    if (!storeId) return '-';
    return storeNameMap.get(storeId) || storeId;
  };

  // Filtered data for each tab
  const filteredStores = useMemo(() => stores.filter(s => {
    if (storeFilters.search && !s.store_name?.toLowerCase().includes(storeFilters.search.toLowerCase()) && 
        !s.store_code?.toLowerCase().includes(storeFilters.search.toLowerCase())) return false;
    if (storeFilters.region && storeFilters.region !== "all" && s.region !== storeFilters.region) return false;
    if (storeFilters.store_type && storeFilters.store_type !== "all" && s.store_type !== storeFilters.store_type) return false;
    return true;
  }), [stores, storeFilters]);

  const filteredPromotions = useMemo(() => promotions.filter(p => {
    if (promoFilters.search && !p.promotion_name?.toLowerCase().includes(promoFilters.search.toLowerCase())) return false;
    if (promoFilters.promotion_type && promoFilters.promotion_type !== "all" && p.promotion_type !== promoFilters.promotion_type) return false;
    if (promoFilters.status && promoFilters.status !== "all" && p.status !== promoFilters.status) return false;
    return true;
  }), [promotions, promoFilters]);

  const filteredTransactions = useMemo(() => transactions.filter(t => {
    if (txnFilters.search && !t.product_name?.toLowerCase().includes(txnFilters.search.toLowerCase()) && 
        !t.product_sku?.toLowerCase().includes(txnFilters.search.toLowerCase())) return false;
    return true;
  }), [transactions, txnFilters]);

  const filteredCustomers = useMemo(() => customers.filter(c => {
    if (customerFilters.search && !c.customer_name?.toLowerCase().includes(customerFilters.search.toLowerCase()) && 
        !c.email?.toLowerCase().includes(customerFilters.search.toLowerCase())) return false;
    if (customerFilters.segment && customerFilters.segment !== "all" && c.segment !== customerFilters.segment) return false;
    if (customerFilters.loyalty_tier && customerFilters.loyalty_tier !== "all" && c.loyalty_tier !== customerFilters.loyalty_tier) return false;
    return true;
  }), [customers, customerFilters]);

  const filteredThirdParty = useMemo(() => thirdPartyData.filter(d => {
    if (thirdPartyFilters.search && !d.metric_name?.toLowerCase().includes(thirdPartyFilters.search.toLowerCase())) return false;
    if (thirdPartyFilters.data_source && thirdPartyFilters.data_source !== "all" && d.data_source !== thirdPartyFilters.data_source) return false;
    if (thirdPartyFilters.data_type && thirdPartyFilters.data_type !== "all" && d.data_type !== thirdPartyFilters.data_type) return false;
    return true;
  }), [thirdPartyData, thirdPartyFilters]);

  const filteredProducts = useMemo(() => products.filter(p => {
    if (productFilters.search && !p.product_name?.toLowerCase().includes(productFilters.search.toLowerCase()) && 
        !p.product_sku?.toLowerCase().includes(productFilters.search.toLowerCase())) return false;
    if (productFilters.category && productFilters.category !== "all" && p.category !== productFilters.category) return false;
    if (productFilters.brand && productFilters.brand !== "all" && p.brand !== productFilters.brand) return false;
    return true;
  }), [products, productFilters]);

  const filteredMarketing = useMemo(() => marketingChannels.filter(m => {
    if (marketingFilters.search && !m.channel_name?.toLowerCase().includes(marketingFilters.search.toLowerCase())) return false;
    if (marketingFilters.channel_type && marketingFilters.channel_type !== "all" && m.channel_type !== marketingFilters.channel_type) return false;
    return true;
  }), [marketingChannels, marketingFilters]);

  const filteredCompetitor = useMemo(() => competitorData.filter(c => {
    if (competitorFilters.search && !c.competitor_name?.toLowerCase().includes(competitorFilters.search.toLowerCase())) return false;
    if (competitorFilters.competitor_name && competitorFilters.competitor_name !== "all" && c.competitor_name !== competitorFilters.competitor_name) return false;
    if (competitorFilters.product_category && competitorFilters.product_category !== "all" && c.product_category !== competitorFilters.product_category) return false;
    return true;
  }), [competitorData, competitorFilters]);

  const filteredPerformance = useMemo(() => storePerformance.filter(p => {
    if (perfFilters.weather_condition && perfFilters.weather_condition !== "all" && p.weather_condition !== perfFilters.weather_condition) return false;
    return true;
  }), [storePerformance, perfFilters]);

  const filteredJourney = useMemo(() => customerJourney.filter(j => {
    if (journeyFilters.touchpoint_type && journeyFilters.touchpoint_type !== "all" && j.touchpoint_type !== journeyFilters.touchpoint_type) return false;
    if (journeyFilters.channel && journeyFilters.channel !== "all" && j.channel !== journeyFilters.channel) return false;
    if (journeyFilters.converted && journeyFilters.converted !== "all") {
      const isConverted = journeyFilters.converted === "yes";
      if (j.converted !== isConverted) return false;
    }
    return true;
  }), [customerJourney, journeyFilters]);

  const filteredInventory = useMemo(() => inventoryLevels.filter(i => {
    if (inventoryFilters.search && !i.product_sku?.toLowerCase().includes(inventoryFilters.search.toLowerCase())) return false;
    if (inventoryFilters.stockout_risk && inventoryFilters.stockout_risk !== "all" && i.stockout_risk !== inventoryFilters.stockout_risk) return false;
    return true;
  }), [inventoryLevels, inventoryFilters]);

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
            <DataTableFilter
              filters={[
                { key: "search", label: "Search stores...", type: "text" },
                { key: "region", label: "Region", type: "select", options: getUniqueValues(stores, "region") },
                { key: "store_type", label: "Type", type: "select", options: getUniqueValues(stores, "store_type") },
              ]}
              values={storeFilters}
              onChange={(key, value) => setStoreFilters(prev => ({ ...prev, [key]: value }))}
              onClear={() => setStoreFilters({})}
            />
            <div className="text-sm text-muted-foreground mb-2">Showing {filteredStores.length} of {stores.length} stores</div>
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
                  {filteredStores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No stores found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStores.map((store) => (
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
            <DataTableFilter
              filters={[
                { key: "search", label: "Search promotions...", type: "text" },
                { key: "promotion_type", label: "Type", type: "select", options: getUniqueValues(promotions, "promotion_type") },
                { key: "status", label: "Status", type: "select", options: getUniqueValues(promotions, "status") },
              ]}
              values={promoFilters}
              onChange={(key, value) => setPromoFilters(prev => ({ ...prev, [key]: value }))}
              onClear={() => setPromoFilters({})}
            />
            <div className="text-sm text-muted-foreground mb-2">Showing {filteredPromotions.length} of {promotions.length} promotions</div>
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
                  {filteredPromotions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No promotions found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPromotions.map((promo) => (
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
            <DataTableFilter
              filters={[
                { key: "search", label: "Search by SKU or name...", type: "text" },
              ]}
              values={txnFilters}
              onChange={(key, value) => setTxnFilters(prev => ({ ...prev, [key]: value }))}
              onClear={() => setTxnFilters({})}
            />
            <div className="text-sm text-muted-foreground mb-2">Showing {filteredTransactions.length} of {transactions.length} transactions</div>
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
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No transactions found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((txn) => (
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
            <DataTableFilter
              filters={[
                { key: "search", label: "Search customers...", type: "text" },
                { key: "segment", label: "Segment", type: "select", options: getUniqueValues(customers, "segment") },
                { key: "loyalty_tier", label: "Loyalty Tier", type: "select", options: getUniqueValues(customers, "loyalty_tier") },
              ]}
              values={customerFilters}
              onChange={(key, value) => setCustomerFilters(prev => ({ ...prev, [key]: value }))}
              onClear={() => setCustomerFilters({})}
            />
            <div className="text-sm text-muted-foreground mb-2">Showing {filteredCustomers.length} of {customers.length} customers</div>
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
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No customers found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
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
            <DataTableFilter
              filters={[
                { key: "search", label: "Search metrics...", type: "text" },
                { key: "data_source", label: "Source", type: "select", options: getUniqueValues(thirdPartyData, "data_source") },
                { key: "data_type", label: "Type", type: "select", options: getUniqueValues(thirdPartyData, "data_type") },
              ]}
              values={thirdPartyFilters}
              onChange={(key, value) => setThirdPartyFilters(prev => ({ ...prev, [key]: value }))}
              onClear={() => setThirdPartyFilters({})}
            />
            <div className="text-sm text-muted-foreground mb-2">Showing {filteredThirdParty.length} of {thirdPartyData.length} records</div>
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
                  {filteredThirdParty.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No third-party data found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredThirdParty.map((data) => (
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
            <DataTableFilter
              filters={[
                { key: "search", label: "Search products...", type: "text" },
                { key: "category", label: "Category", type: "select", options: getUniqueValues(products, "category") },
                { key: "brand", label: "Brand", type: "select", options: getUniqueValues(products, "brand") },
              ]}
              values={productFilters}
              onChange={(key, value) => setProductFilters(prev => ({ ...prev, [key]: value }))}
              onClear={() => setProductFilters({})}
            />
            <div className="text-sm text-muted-foreground mb-2">Showing {filteredProducts.length} of {products.length} products</div>
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
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No products found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
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
            <DataTableFilter
              filters={[
                { key: "search", label: "Search channels...", type: "text" },
                { key: "channel_type", label: "Type", type: "select", options: getUniqueValues(marketingChannels, "channel_type") },
              ]}
              values={marketingFilters}
              onChange={(key, value) => setMarketingFilters(prev => ({ ...prev, [key]: value }))}
              onClear={() => setMarketingFilters({})}
            />
            <div className="text-sm text-muted-foreground mb-2">Showing {filteredMarketing.length} of {marketingChannels.length} channels</div>
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
                  {filteredMarketing.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No marketing channels found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMarketing.map((channel) => (
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
            <DataTableFilter
              filters={[
                { key: "search", label: "Search competitors...", type: "text" },
                { key: "competitor_name", label: "Competitor", type: "select", options: getUniqueValues(competitorData, "competitor_name") },
                { key: "product_category", label: "Category", type: "select", options: getUniqueValues(competitorData, "product_category") },
              ]}
              values={competitorFilters}
              onChange={(key, value) => setCompetitorFilters(prev => ({ ...prev, [key]: value }))}
              onClear={() => setCompetitorFilters({})}
            />
            <div className="text-sm text-muted-foreground mb-2">Showing {filteredCompetitor.length} of {competitorData.length} records</div>
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
                  {filteredCompetitor.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No competitor data found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCompetitor.map((comp) => (
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
            <DataTableFilter
              filters={[
                { key: "weather_condition", label: "Weather", type: "select", options: getUniqueValues(storePerformance, "weather_condition") },
              ]}
              values={perfFilters}
              onChange={(key, value) => setPerfFilters(prev => ({ ...prev, [key]: value }))}
              onClear={() => setPerfFilters({})}
            />
            <div className="text-sm text-muted-foreground mb-2">Showing {filteredPerformance.length} of {storePerformance.length} records</div>
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
                  {filteredPerformance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No performance data found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPerformance.map((perf) => (
                      <TableRow key={perf.id}>
                        <TableCell className="font-medium">{getStoreName(perf.store_id)}</TableCell>
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
            <DataTableFilter
              filters={[
                { key: "touchpoint_type", label: "Touchpoint", type: "select", options: getUniqueValues(customerJourney, "touchpoint_type") },
                { key: "channel", label: "Channel", type: "select", options: getUniqueValues(customerJourney, "channel") },
                { key: "converted", label: "Converted", type: "select", options: ["yes", "no"] },
              ]}
              values={journeyFilters}
              onChange={(key, value) => setJourneyFilters(prev => ({ ...prev, [key]: value }))}
              onClear={() => setJourneyFilters({})}
            />
            <div className="text-sm text-muted-foreground mb-2">Showing {filteredJourney.length} of {customerJourney.length} touchpoints</div>
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
                  {filteredJourney.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No journey data found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredJourney.map((touch) => (
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
            <DataTableFilter
              filters={[
                { key: "search", label: "Search by SKU...", type: "text" },
                { key: "stockout_risk", label: "Stockout Risk", type: "select", options: getUniqueValues(inventoryLevels, "stockout_risk") },
              ]}
              values={inventoryFilters}
              onChange={(key, value) => setInventoryFilters(prev => ({ ...prev, [key]: value }))}
              onClear={() => setInventoryFilters({})}
            />
            <div className="text-sm text-muted-foreground mb-2">Showing {filteredInventory.length} of {inventoryLevels.length} inventory items</div>
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
                  {filteredInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No inventory data found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInventory.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{getStoreName(inv.store_id)}</TableCell>
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
