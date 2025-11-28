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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [storesData, promotionsData, transactionsData, customersData, thirdPartyDataData] = await Promise.all([
        supabase.from('stores').select('*').limit(100),
        supabase.from('promotions').select('*').limit(100),
        supabase.from('transactions').select('*').limit(100),
        supabase.from('customers').select('*').limit(100),
        supabase.from('third_party_data').select('*').limit(100),
      ]);

      setStores(storesData.data || []);
      setPromotions(promotionsData.data || []);
      setTransactions(transactionsData.data || []);
      setCustomers(customersData.data || []);
      setThirdPartyData(thirdPartyDataData.data || []);
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
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
          <span className="text-xs text-muted-foreground uppercase">3rd Party Data</span>
        </div>
        <div className="text-2xl font-bold">{thirdPartyData.length}</div>
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="stores">Stores</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="third-party">3rd Party</TabsTrigger>
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
        </Tabs>
      </Card>
    </div>
  );
}
