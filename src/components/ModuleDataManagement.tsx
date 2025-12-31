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

interface ModuleDataManagementProps {
  moduleId: string;
}

// Define which tables are relevant for each module
const moduleTableConfig: Record<string, string[]> = {
  promotion: ['stores', 'promotions', 'transactions', 'customers', 'products', 'marketing_channels', 'customer_journey'],
  pricing: ['products', 'price_change_history', 'competitor_prices', 'transactions', 'stores'],
  assortment: ['products', 'transactions', 'stores', 'inventory_levels', 'customers'],
  demand: ['demand_forecasts', 'forecast_accuracy_tracking', 'inventory_levels', 'products', 'transactions', 'stores'],
  'supply-chain': ['suppliers', 'supplier_orders', 'shipping_routes', 'inventory_levels', 'stores', 'products'],
  space: ['planograms', 'shelf_allocations', 'fixtures', 'products', 'stores', 'store_performance'],
};

export default function ModuleDataManagement({ moduleId }: ModuleDataManagementProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Core tables
  const [stores, setStores] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [marketingChannels, setMarketingChannels] = useState<any[]>([]);
  const [customerJourney, setCustomerJourney] = useState<any[]>([]);
  const [inventoryLevels, setInventoryLevels] = useState<any[]>([]);
  const [storePerformance, setStorePerformance] = useState<any[]>([]);
  
  // Module-specific tables
  const [priceChangeHistory, setPriceChangeHistory] = useState<any[]>([]);
  const [competitorPrices, setCompetitorPrices] = useState<any[]>([]);
  const [demandForecasts, setDemandForecasts] = useState<any[]>([]);
  const [forecastAccuracy, setForecastAccuracy] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierOrders, setSupplierOrders] = useState<any[]>([]);
  const [shippingRoutes, setShippingRoutes] = useState<any[]>([]);
  const [planograms, setPlanograms] = useState<any[]>([]);
  const [shelfAllocations, setShelfAllocations] = useState<any[]>([]);
  const [fixtures, setFixtures] = useState<any[]>([]);

  // Filter states
  const [filters, setFilters] = useState<Record<string, Record<string, string>>>({});

  const relevantTables = moduleTableConfig[moduleId] || moduleTableConfig.promotion;

  useEffect(() => {
    loadModuleData();
  }, [moduleId]);

  const loadModuleData = async () => {
    setIsLoading(true);
    try {
      const fetchTable = async (tableName: string) => {
        const { data } = await supabase.from(tableName as any).select('*').limit(2000);
        return { tableName, data: data || [] };
      };

      const tablePromises = relevantTables.map(fetchTable);
      const results = await Promise.all(tablePromises);
      
      results.forEach(({ tableName, data }) => {
        switch (tableName) {
          case 'stores': setStores(data); break;
          case 'promotions': setPromotions(data); break;
          case 'transactions': setTransactions(data); break;
          case 'customers': setCustomers(data); break;
          case 'products': setProducts(data); break;
          case 'marketing_channels': setMarketingChannels(data); break;
          case 'customer_journey': setCustomerJourney(data); break;
          case 'inventory_levels': setInventoryLevels(data); break;
          case 'store_performance': setStorePerformance(data); break;
          case 'price_change_history': setPriceChangeHistory(data); break;
          case 'competitor_prices': setCompetitorPrices(data); break;
          case 'demand_forecasts': setDemandForecasts(data); break;
          case 'forecast_accuracy_tracking': setForecastAccuracy(data); break;
          case 'suppliers': setSuppliers(data); break;
          case 'supplier_orders': setSupplierOrders(data); break;
          case 'shipping_routes': setShippingRoutes(data); break;
          case 'planograms': setPlanograms(data); break;
          case 'shelf_allocations': setShelfAllocations(data); break;
          case 'fixtures': setFixtures(data); break;
        }
      });
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

  const getFilter = (table: string) => filters[table] || {};
  const setTableFilter = (table: string, key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [table]: { ...prev[table], [key]: value }
    }));
  };
  const clearTableFilters = (table: string) => {
    setFilters(prev => ({ ...prev, [table]: {} }));
  };

  const getModuleLabel = () => {
    switch (moduleId) {
      case 'pricing': return 'Pricing';
      case 'assortment': return 'Assortment';
      case 'demand': return 'Demand Forecasting';
      case 'supply-chain': return 'Supply Chain';
      case 'space': return 'Space Planning';
      default: return 'Promotion';
    }
  };

  const DataStats = () => {
    const stats: { label: string; count: number; color: string }[] = [];
    
    if (relevantTables.includes('stores')) stats.push({ label: 'Stores', count: stores.length, color: 'text-primary' });
    if (relevantTables.includes('products')) stats.push({ label: 'Products', count: products.length, color: 'text-emerald-500' });
    if (relevantTables.includes('transactions')) stats.push({ label: 'Transactions', count: transactions.length, color: 'text-chart-3' });
    if (relevantTables.includes('promotions')) stats.push({ label: 'Promotions', count: promotions.length, color: 'text-chart-2' });
    if (relevantTables.includes('customers')) stats.push({ label: 'Customers', count: customers.length, color: 'text-chart-4' });
    if (relevantTables.includes('inventory_levels')) stats.push({ label: 'Inventory', count: inventoryLevels.length, color: 'text-cyan-500' });
    if (relevantTables.includes('price_change_history')) stats.push({ label: 'Price Changes', count: priceChangeHistory.length, color: 'text-orange-500' });
    if (relevantTables.includes('competitor_prices')) stats.push({ label: 'Competitor Prices', count: competitorPrices.length, color: 'text-red-500' });
    if (relevantTables.includes('demand_forecasts')) stats.push({ label: 'Forecasts', count: demandForecasts.length, color: 'text-blue-500' });
    if (relevantTables.includes('forecast_accuracy_tracking')) stats.push({ label: 'Accuracy Tracking', count: forecastAccuracy.length, color: 'text-purple-500' });
    if (relevantTables.includes('suppliers')) stats.push({ label: 'Suppliers', count: suppliers.length, color: 'text-amber-500' });
    if (relevantTables.includes('supplier_orders')) stats.push({ label: 'Orders', count: supplierOrders.length, color: 'text-lime-500' });
    if (relevantTables.includes('shipping_routes')) stats.push({ label: 'Routes', count: shippingRoutes.length, color: 'text-teal-500' });
    if (relevantTables.includes('planograms')) stats.push({ label: 'Planograms', count: planograms.length, color: 'text-indigo-500' });
    if (relevantTables.includes('shelf_allocations')) stats.push({ label: 'Shelf Allocations', count: shelfAllocations.length, color: 'text-pink-500' });
    if (relevantTables.includes('fixtures')) stats.push({ label: 'Fixtures', count: fixtures.length, color: 'text-rose-500' });
    if (relevantTables.includes('marketing_channels')) stats.push({ label: 'Marketing', count: marketingChannels.length, color: 'text-blue-500' });
    if (relevantTables.includes('customer_journey')) stats.push({ label: 'Journey', count: customerJourney.length, color: 'text-pink-500' });
    if (relevantTables.includes('store_performance')) stats.push({ label: 'Performance', count: storePerformance.length, color: 'text-purple-500' });

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground uppercase">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold">{stat.count}</div>
          </Card>
        ))}
      </div>
    );
  };

  const renderTabTriggers = () => {
    const triggers: JSX.Element[] = [];
    
    if (relevantTables.includes('products')) triggers.push(<TabsTrigger key="products" value="products">Products</TabsTrigger>);
    if (relevantTables.includes('stores')) triggers.push(<TabsTrigger key="stores" value="stores">Stores</TabsTrigger>);
    if (relevantTables.includes('transactions')) triggers.push(<TabsTrigger key="transactions" value="transactions">Transactions</TabsTrigger>);
    if (relevantTables.includes('promotions')) triggers.push(<TabsTrigger key="promotions" value="promotions">Promotions</TabsTrigger>);
    if (relevantTables.includes('customers')) triggers.push(<TabsTrigger key="customers" value="customers">Customers</TabsTrigger>);
    if (relevantTables.includes('inventory_levels')) triggers.push(<TabsTrigger key="inventory" value="inventory">Inventory</TabsTrigger>);
    if (relevantTables.includes('price_change_history')) triggers.push(<TabsTrigger key="price_changes" value="price_changes">Price Changes</TabsTrigger>);
    if (relevantTables.includes('competitor_prices')) triggers.push(<TabsTrigger key="competitor_prices" value="competitor_prices">Competitor Prices</TabsTrigger>);
    if (relevantTables.includes('demand_forecasts')) triggers.push(<TabsTrigger key="forecasts" value="forecasts">Forecasts</TabsTrigger>);
    if (relevantTables.includes('forecast_accuracy_tracking')) triggers.push(<TabsTrigger key="accuracy" value="accuracy">Accuracy</TabsTrigger>);
    if (relevantTables.includes('suppliers')) triggers.push(<TabsTrigger key="suppliers" value="suppliers">Suppliers</TabsTrigger>);
    if (relevantTables.includes('supplier_orders')) triggers.push(<TabsTrigger key="orders" value="orders">Orders</TabsTrigger>);
    if (relevantTables.includes('shipping_routes')) triggers.push(<TabsTrigger key="routes" value="routes">Routes</TabsTrigger>);
    if (relevantTables.includes('planograms')) triggers.push(<TabsTrigger key="planograms" value="planograms">Planograms</TabsTrigger>);
    if (relevantTables.includes('shelf_allocations')) triggers.push(<TabsTrigger key="shelves" value="shelves">Shelves</TabsTrigger>);
    if (relevantTables.includes('fixtures')) triggers.push(<TabsTrigger key="fixtures" value="fixtures">Fixtures</TabsTrigger>);
    if (relevantTables.includes('marketing_channels')) triggers.push(<TabsTrigger key="marketing" value="marketing">Marketing</TabsTrigger>);
    if (relevantTables.includes('customer_journey')) triggers.push(<TabsTrigger key="journey" value="journey">Journey</TabsTrigger>);
    if (relevantTables.includes('store_performance')) triggers.push(<TabsTrigger key="performance" value="performance">Performance</TabsTrigger>);

    return triggers;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Data Management</h2>
          <p className="text-sm text-muted-foreground">Manage {getModuleLabel()} module data</p>
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
        <Tabs defaultValue={relevantTables.includes('products') ? 'products' : relevantTables[0]} className="w-full">
          <TabsList className="flex flex-wrap gap-1">
            {renderTabTriggers()}
          </TabsList>

          {/* Products Tab */}
          {relevantTables.includes('products') && (
            <TabsContent value="products" className="mt-6">
              <DataTableFilter
                filters={[
                  { key: "search", label: "Search products...", type: "text" },
                  { key: "category", label: "Category", type: "select", options: getUniqueValues(products, "category") },
                  { key: "brand", label: "Brand", type: "select", options: getUniqueValues(products, "brand") },
                ]}
                values={getFilter('products')}
                onChange={(key, value) => setTableFilter('products', key, value)}
                onClear={() => clearTableFilters('products')}
              />
              <div className="text-sm text-muted-foreground mb-2">Showing {products.length} products</div>
              <div className="rounded-md border max-h-96 overflow-y-auto">
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
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.product_sku}</TableCell>
                        <TableCell>{product.product_name}</TableCell>
                        <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                        <TableCell>{product.brand}</TableCell>
                        <TableCell>${product.base_price}</TableCell>
                        <TableCell>{product.margin_percent}%</TableCell>
                        <TableCell>{product.price_elasticity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {/* Price Change History Tab */}
          {relevantTables.includes('price_change_history') && (
            <TabsContent value="price_changes" className="mt-6">
              <DataTableFilter
                filters={[
                  { key: "search", label: "Search SKU...", type: "text" },
                  { key: "change_type", label: "Type", type: "select", options: getUniqueValues(priceChangeHistory, "change_type") },
                ]}
                values={getFilter('price_changes')}
                onChange={(key, value) => setTableFilter('price_changes', key, value)}
                onClear={() => clearTableFilters('price_changes')}
              />
              <div className="text-sm text-muted-foreground mb-2">Showing {priceChangeHistory.length} price changes</div>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Change Date</TableHead>
                      <TableHead>Old Price</TableHead>
                      <TableHead>New Price</TableHead>
                      <TableHead>Change Type</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceChangeHistory.map((change) => (
                      <TableRow key={change.id}>
                        <TableCell className="font-medium">{change.product_sku}</TableCell>
                        <TableCell>{new Date(change.change_date).toLocaleDateString()}</TableCell>
                        <TableCell>${Number(change.old_price).toFixed(2)}</TableCell>
                        <TableCell>${Number(change.new_price).toFixed(2)}</TableCell>
                        <TableCell><Badge variant="outline">{change.change_type}</Badge></TableCell>
                        <TableCell>{change.change_reason || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {/* Competitor Prices Tab */}
          {relevantTables.includes('competitor_prices') && (
            <TabsContent value="competitor_prices" className="mt-6">
              <DataTableFilter
                filters={[
                  { key: "competitor_name", label: "Competitor", type: "select", options: getUniqueValues(competitorPrices, "competitor_name") },
                ]}
                values={getFilter('competitor_prices')}
                onChange={(key, value) => setTableFilter('competitor_prices', key, value)}
                onClear={() => clearTableFilters('competitor_prices')}
              />
              <div className="text-sm text-muted-foreground mb-2">Showing {competitorPrices.length} competitor prices</div>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Competitor</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Our Price</TableHead>
                      <TableHead>Competitor Price</TableHead>
                      <TableHead>Price Gap %</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitorPrices.map((price) => (
                      <TableRow key={price.id}>
                        <TableCell className="font-medium">{price.competitor_name}</TableCell>
                        <TableCell>{price.product_sku}</TableCell>
                        <TableCell>${Number(price.our_price).toFixed(2)}</TableCell>
                        <TableCell>${Number(price.competitor_price).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={Number(price.price_gap_percent) > 0 ? "destructive" : "default"}>
                            {Number(price.price_gap_percent).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>{price.observation_date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {/* Demand Forecasts Tab */}
          {relevantTables.includes('demand_forecasts') && (
            <TabsContent value="forecasts" className="mt-6">
              <DataTableFilter
                filters={[
                  { key: "search", label: "Search SKU...", type: "text" },
                  { key: "forecast_model", label: "Model", type: "select", options: getUniqueValues(demandForecasts, "forecast_model") },
                ]}
                values={getFilter('forecasts')}
                onChange={(key, value) => setTableFilter('forecasts', key, value)}
                onClear={() => clearTableFilters('forecasts')}
              />
              <div className="text-sm text-muted-foreground mb-2">Showing {demandForecasts.length} forecasts</div>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Forecast Date</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Forecasted</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Model</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demandForecasts.map((forecast) => (
                      <TableRow key={forecast.id}>
                        <TableCell className="font-medium">{forecast.product_sku}</TableCell>
                        <TableCell>{forecast.forecast_date}</TableCell>
                        <TableCell>{forecast.forecast_period_start} - {forecast.forecast_period_end}</TableCell>
                        <TableCell>{forecast.forecasted_units}</TableCell>
                        <TableCell>{forecast.actual_units || '-'}</TableCell>
                        <TableCell>
                          {forecast.forecast_accuracy ? (
                            <Badge variant={Number(forecast.forecast_accuracy) >= 90 ? "default" : "secondary"}>
                              {Number(forecast.forecast_accuracy).toFixed(1)}%
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{forecast.forecast_model}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {/* Forecast Accuracy Tab */}
          {relevantTables.includes('forecast_accuracy_tracking') && (
            <TabsContent value="accuracy" className="mt-6">
              <DataTableFilter
                filters={[
                  { key: "category", label: "Category", type: "select", options: getUniqueValues(forecastAccuracy, "category") },
                  { key: "forecast_model", label: "Model", type: "select", options: getUniqueValues(forecastAccuracy, "forecast_model") },
                ]}
                values={getFilter('accuracy')}
                onChange={(key, value) => setTableFilter('accuracy', key, value)}
                onClear={() => clearTableFilters('accuracy')}
              />
              <div className="text-sm text-muted-foreground mb-2">Showing {forecastAccuracy.length} accuracy records</div>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>MAPE</TableHead>
                      <TableHead>RMSE</TableHead>
                      <TableHead>Bias</TableHead>
                      <TableHead>Sample Size</TableHead>
                      <TableHead>Model</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecastAccuracy.map((acc) => (
                      <TableRow key={acc.id}>
                        <TableCell>{acc.tracking_date}</TableCell>
                        <TableCell>{acc.category || 'All'}</TableCell>
                        <TableCell>
                          <Badge variant={Number(acc.mape) <= 10 ? "default" : "secondary"}>
                            {Number(acc.mape).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>{acc.rmse ? Number(acc.rmse).toFixed(2) : '-'}</TableCell>
                        <TableCell>{acc.bias ? Number(acc.bias).toFixed(2) : '-'}</TableCell>
                        <TableCell>{acc.sample_size}</TableCell>
                        <TableCell>{acc.forecast_model}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {/* Suppliers Tab */}
          {relevantTables.includes('suppliers') && (
            <TabsContent value="suppliers" className="mt-6">
              <DataTableFilter
                filters={[
                  { key: "search", label: "Search suppliers...", type: "text" },
                ]}
                values={getFilter('suppliers')}
                onChange={(key, value) => setTableFilter('suppliers', key, value)}
                onClear={() => clearTableFilters('suppliers')}
              />
              <div className="text-sm text-muted-foreground mb-2">Showing {suppliers.length} suppliers</div>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Supplier Name</TableHead>
                      <TableHead>Lead Time</TableHead>
                      <TableHead>Reliability</TableHead>
                      <TableHead>Min Order</TableHead>
                      <TableHead>Payment Terms</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.supplier_code}</TableCell>
                        <TableCell>{supplier.supplier_name}</TableCell>
                        <TableCell>{supplier.lead_time_days} days</TableCell>
                        <TableCell>
                          <Badge variant={Number(supplier.reliability_score) >= 95 ? "default" : "secondary"}>
                            {(Number(supplier.reliability_score) * 100).toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell>${supplier.minimum_order_value || 0}</TableCell>
                        <TableCell>{supplier.payment_terms}</TableCell>
                        <TableCell>{supplier.city}, {supplier.state}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {/* Supplier Orders Tab */}
          {relevantTables.includes('supplier_orders') && (
            <TabsContent value="orders" className="mt-6">
              <DataTableFilter
                filters={[
                  { key: "status", label: "Status", type: "select", options: getUniqueValues(supplierOrders, "status") },
                ]}
                values={getFilter('orders')}
                onChange={(key, value) => setTableFilter('orders', key, value)}
                onClear={() => clearTableFilters('orders')}
              />
              <div className="text-sm text-muted-foreground mb-2">Showing {supplierOrders.length} orders</div>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Date</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Expected</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>On Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.order_date}</TableCell>
                        <TableCell className="font-medium">{order.product_sku}</TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>${Number(order.total_cost).toFixed(2)}</TableCell>
                        <TableCell>{order.expected_delivery_date}</TableCell>
                        <TableCell><Badge variant="outline">{order.status}</Badge></TableCell>
                        <TableCell>
                          {order.on_time !== null && (
                            <Badge variant={order.on_time ? "default" : "destructive"}>
                              {order.on_time ? 'Yes' : 'No'}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {/* Shipping Routes Tab */}
          {relevantTables.includes('shipping_routes') && (
            <TabsContent value="routes" className="mt-6">
              <DataTableFilter
                filters={[
                  { key: "transportation_mode", label: "Mode", type: "select", options: getUniqueValues(shippingRoutes, "transportation_mode") },
                ]}
                values={getFilter('routes')}
                onChange={(key, value) => setTableFilter('routes', key, value)}
                onClear={() => clearTableFilters('routes')}
              />
              <div className="text-sm text-muted-foreground mb-2">Showing {shippingRoutes.length} routes</div>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route Name</TableHead>
                      <TableHead>Origin</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Transit Time</TableHead>
                      <TableHead>Cost/Mile</TableHead>
                      <TableHead>Mode</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shippingRoutes.map((route) => (
                      <TableRow key={route.id}>
                        <TableCell className="font-medium">{route.route_name}</TableCell>
                        <TableCell>{route.origin_location}</TableCell>
                        <TableCell>{route.destination_location}</TableCell>
                        <TableCell>{route.distance_miles} mi</TableCell>
                        <TableCell>{route.avg_transit_time_hours} hrs</TableCell>
                        <TableCell>${Number(route.cost_per_mile).toFixed(2)}</TableCell>
                        <TableCell><Badge variant="outline">{route.transportation_mode}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {/* Planograms Tab */}
          {relevantTables.includes('planograms') && (
            <TabsContent value="planograms" className="mt-6">
              <DataTableFilter
                filters={[
                  { key: "category", label: "Category", type: "select", options: getUniqueValues(planograms, "category") },
                  { key: "status", label: "Status", type: "select", options: getUniqueValues(planograms, "status") },
                ]}
                values={getFilter('planograms')}
                onChange={(key, value) => setTableFilter('planograms', key, value)}
                onClear={() => clearTableFilters('planograms')}
              />
              <div className="text-sm text-muted-foreground mb-2">Showing {planograms.length} planograms</div>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Dimensions</TableHead>
                      <TableHead>Shelves</TableHead>
                      <TableHead>Store Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {planograms.map((pog) => (
                      <TableRow key={pog.id}>
                        <TableCell className="font-medium">{pog.planogram_code}</TableCell>
                        <TableCell>{pog.planogram_name}</TableCell>
                        <TableCell><Badge variant="outline">{pog.category}</Badge></TableCell>
                        <TableCell>{pog.total_width_inches}"W x {pog.total_height_inches}"H</TableCell>
                        <TableCell>{pog.shelf_count}</TableCell>
                        <TableCell>{pog.store_type}</TableCell>
                        <TableCell>
                          <Badge variant={pog.status === 'active' ? 'default' : 'secondary'}>{pog.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {/* Shelf Allocations Tab */}
          {relevantTables.includes('shelf_allocations') && (
            <TabsContent value="shelves" className="mt-6">
              <div className="text-sm text-muted-foreground mb-2">Showing {shelfAllocations.length} shelf allocations</div>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Shelf #</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Facings</TableHead>
                      <TableHead>Dimensions</TableHead>
                      <TableHead>Eye Level</TableHead>
                      <TableHead>Sales/SqFt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shelfAllocations.map((alloc) => (
                      <TableRow key={alloc.id}>
                        <TableCell className="font-medium">{alloc.product_sku}</TableCell>
                        <TableCell>{alloc.shelf_number}</TableCell>
                        <TableCell>{alloc.position_from_left}"</TableCell>
                        <TableCell>{alloc.facings}</TableCell>
                        <TableCell>{alloc.width_inches}"W x {alloc.height_inches}"H</TableCell>
                        <TableCell>
                          <Badge variant={alloc.is_eye_level ? 'default' : 'outline'}>
                            {alloc.is_eye_level ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>${Number(alloc.sales_per_sqft || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {/* Fixtures Tab */}
          {relevantTables.includes('fixtures') && (
            <TabsContent value="fixtures" className="mt-6">
              <DataTableFilter
                filters={[
                  { key: "fixture_type", label: "Type", type: "select", options: getUniqueValues(fixtures, "fixture_type") },
                  { key: "status", label: "Status", type: "select", options: getUniqueValues(fixtures, "status") },
                ]}
                values={getFilter('fixtures')}
                onChange={(key, value) => setTableFilter('fixtures', key, value)}
                onClear={() => clearTableFilters('fixtures')}
              />
              <div className="text-sm text-muted-foreground mb-2">Showing {fixtures.length} fixtures</div>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dimensions</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Aisle</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fixtures.map((fixture) => (
                      <TableRow key={fixture.id}>
                        <TableCell className="font-medium">{fixture.fixture_code}</TableCell>
                        <TableCell>{fixture.fixture_type}</TableCell>
                        <TableCell>{fixture.width_inches}"W x {fixture.height_inches}"H x {fixture.depth_inches}"D</TableCell>
                        <TableCell>{fixture.location_in_store}</TableCell>
                        <TableCell>{fixture.aisle_number}</TableCell>
                        <TableCell>{fixture.assigned_category || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={fixture.status === 'active' ? 'default' : 'secondary'}>{fixture.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {/* Existing shared tabs */}
          {relevantTables.includes('stores') && (
            <TabsContent value="stores" className="mt-6">
              <div className="text-sm text-muted-foreground mb-2">Showing {stores.length} stores</div>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stores.map((store) => (
                      <TableRow key={store.id}>
                        <TableCell className="font-medium">{store.store_code}</TableCell>
                        <TableCell>{store.store_name}</TableCell>
                        <TableCell>{store.location}</TableCell>
                        <TableCell>{store.region}</TableCell>
                        <TableCell><Badge variant="outline">{store.store_type}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {relevantTables.includes('transactions') && (
            <TabsContent value="transactions" className="mt-6">
              <div className="text-sm text-muted-foreground mb-2">Showing {transactions.length} transactions</div>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 100).map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell>{new Date(txn.transaction_date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{txn.product_sku}</TableCell>
                        <TableCell>{txn.product_name}</TableCell>
                        <TableCell>{txn.quantity}</TableCell>
                        <TableCell>${Number(txn.total_amount).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {relevantTables.includes('inventory_levels') && (
            <TabsContent value="inventory" className="mt-6">
              <div className="text-sm text-muted-foreground mb-2">Showing {inventoryLevels.length} inventory records</div>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Stock Level</TableHead>
                      <TableHead>Reorder Point</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Last Restocked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryLevels.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{getStoreName(inv.store_id)}</TableCell>
                        <TableCell>{inv.product_sku}</TableCell>
                        <TableCell>{inv.stock_level}</TableCell>
                        <TableCell>{inv.reorder_point}</TableCell>
                        <TableCell>
                          <Badge variant={inv.stockout_risk === 'High' ? 'destructive' : inv.stockout_risk === 'Medium' ? 'secondary' : 'outline'}>
                            {inv.stockout_risk}
                          </Badge>
                        </TableCell>
                        <TableCell>{inv.last_restocked || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {relevantTables.includes('promotions') && (
            <TabsContent value="promotions" className="mt-6">
              <div className="text-sm text-muted-foreground mb-2">Showing {promotions.length} promotions</div>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotions.map((promo) => (
                      <TableRow key={promo.id}>
                        <TableCell className="font-medium">{promo.promotion_name}</TableCell>
                        <TableCell>{promo.promotion_type}</TableCell>
                        <TableCell>{promo.start_date}</TableCell>
                        <TableCell>{promo.end_date}</TableCell>
                        <TableCell>{promo.discount_percent ? `${promo.discount_percent}%` : `$${promo.discount_amount}`}</TableCell>
                        <TableCell>
                          <Badge variant={promo.status === 'active' ? 'default' : 'secondary'}>{promo.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {relevantTables.includes('customers') && (
            <TabsContent value="customers" className="mt-6">
              <div className="text-sm text-muted-foreground mb-2">Showing {customers.length} customers</div>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Segment</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>LTV</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((cust) => (
                      <TableRow key={cust.id}>
                        <TableCell className="font-medium">{cust.customer_code}</TableCell>
                        <TableCell>{cust.customer_name}</TableCell>
                        <TableCell><Badge variant="outline">{cust.segment}</Badge></TableCell>
                        <TableCell><Badge>{cust.loyalty_tier}</Badge></TableCell>
                        <TableCell>${cust.total_lifetime_value?.toFixed(2) || '0.00'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {relevantTables.includes('marketing_channels') && (
            <TabsContent value="marketing" className="mt-6">
              <div className="text-sm text-muted-foreground mb-2">Showing {marketingChannels.length} channels</div>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Spend</TableHead>
                      <TableHead>Impressions</TableHead>
                      <TableHead>Conversions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marketingChannels.map((ch) => (
                      <TableRow key={ch.id}>
                        <TableCell className="font-medium">{ch.channel_name}</TableCell>
                        <TableCell><Badge>{ch.channel_type}</Badge></TableCell>
                        <TableCell>${ch.spend_amount}</TableCell>
                        <TableCell>{ch.impressions?.toLocaleString() || '-'}</TableCell>
                        <TableCell>{ch.conversions || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {relevantTables.includes('customer_journey') && (
            <TabsContent value="journey" className="mt-6">
              <div className="text-sm text-muted-foreground mb-2">Showing {customerJourney.length} journey records</div>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Touchpoint</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Converted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerJourney.map((j) => (
                      <TableRow key={j.id}>
                        <TableCell>{new Date(j.touchpoint_date).toLocaleDateString()}</TableCell>
                        <TableCell>{j.touchpoint_type}</TableCell>
                        <TableCell>{j.channel}</TableCell>
                        <TableCell>{j.action_taken}</TableCell>
                        <TableCell>
                          <Badge variant={j.converted ? 'default' : 'outline'}>{j.converted ? 'Yes' : 'No'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {relevantTables.includes('store_performance') && (
            <TabsContent value="performance" className="mt-6">
              <div className="text-sm text-muted-foreground mb-2">Showing {storePerformance.length} performance records</div>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Foot Traffic</TableHead>
                      <TableHead>Avg Basket</TableHead>
                      <TableHead>Conversion</TableHead>
                      <TableHead>Total Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {storePerformance.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{getStoreName(p.store_id)}</TableCell>
                        <TableCell>{p.metric_date}</TableCell>
                        <TableCell>{p.foot_traffic}</TableCell>
                        <TableCell>${Number(p.avg_basket_size || 0).toFixed(2)}</TableCell>
                        <TableCell>{Number(p.conversion_rate || 0).toFixed(1)}%</TableCell>
                        <TableCell>${Number(p.total_sales || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </Card>
    </div>
  );
}
