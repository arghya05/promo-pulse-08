import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Filter, 
  Calendar as CalendarIcon, 
  MapPin, 
  Store, 
  Package, 
  Tag, 
  Truck,
  Target,
  ChevronDown,
  X,
  RotateCcw,
  Save
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export interface GlobalFilters {
  dateRange: { from: Date | undefined; to: Date | undefined };
  region: string | null;
  store: string | null;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  sku: string | null;
  supplier: string | null;
  promotion: string | null;
  channel: string | null;
}

interface GlobalFiltersProps {
  filters: GlobalFilters;
  onFiltersChange: (filters: GlobalFilters) => void;
  moduleId: string;
}

const defaultFilters: GlobalFilters = {
  dateRange: { from: undefined, to: undefined },
  region: null,
  store: null,
  category: null,
  subcategory: null,
  brand: null,
  sku: null,
  supplier: null,
  promotion: null,
  channel: null
};

const GlobalFiltersPanel = ({ filters, onFiltersChange, moduleId }: GlobalFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [regions, setRegions] = useState<string[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [promotions, setPromotions] = useState<{ id: string; name: string }[]>([]);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [storesRes, productsRes, suppliersRes, promotionsRes] = await Promise.all([
          supabase.from('stores').select('id, store_name, region').limit(100),
          supabase.from('products').select('category, subcategory, brand').limit(200),
          supabase.from('suppliers').select('id, supplier_name').limit(50),
          supabase.from('promotions').select('id, promotion_name').limit(50)
        ]);

        if (storesRes.data) {
          const uniqueRegions = [...new Set(storesRes.data.map(s => s.region).filter(Boolean))] as string[];
          setRegions(uniqueRegions);
          setStores(storesRes.data.map(s => ({ id: s.id, name: s.store_name })));
        }

        if (productsRes.data) {
          const uniqueCategories = [...new Set(productsRes.data.map(p => p.category).filter(Boolean))] as string[];
          const uniqueBrands = [...new Set(productsRes.data.map(p => p.brand).filter(Boolean))] as string[];
          setCategories(uniqueCategories);
          setBrands(uniqueBrands);
        }

        if (suppliersRes.data) {
          setSuppliers(suppliersRes.data.map(s => ({ id: s.id, name: s.supplier_name })));
        }

        if (promotionsRes.data) {
          setPromotions(promotionsRes.data.map(p => ({ id: p.id, name: p.promotion_name })));
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  const updateFilter = (key: keyof GlobalFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'dateRange') {
      return value.from || value.to;
    }
    return value !== null && value !== undefined;
  }).length;

  const FilterBadge = ({ label, value, onClear }: { label: string; value: string; onClear: () => void }) => (
    <Badge variant="secondary" className="text-xs gap-1 pr-1">
      <span className="text-muted-foreground">{label}:</span> {value}
      <button onClick={onClear} className="ml-1 hover:text-destructive">
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );

  return (
    <Card className="sticky top-20">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <span>Global Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="default" className="text-xs h-5 px-1.5">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
          </CardTitle>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-1 pb-2 border-b">
                {filters.region && (
                  <FilterBadge label="Region" value={filters.region} onClear={() => updateFilter('region', null)} />
                )}
                {filters.store && (
                  <FilterBadge 
                    label="Store" 
                    value={stores.find(s => s.id === filters.store)?.name || filters.store} 
                    onClear={() => updateFilter('store', null)} 
                  />
                )}
                {filters.category && (
                  <FilterBadge label="Category" value={filters.category} onClear={() => updateFilter('category', null)} />
                )}
                {filters.brand && (
                  <FilterBadge label="Brand" value={filters.brand} onClear={() => updateFilter('brand', null)} />
                )}
                {filters.supplier && (
                  <FilterBadge 
                    label="Supplier" 
                    value={suppliers.find(s => s.id === filters.supplier)?.name || filters.supplier} 
                    onClear={() => updateFilter('supplier', null)} 
                  />
                )}
                {filters.promotion && (
                  <FilterBadge 
                    label="Promotion" 
                    value={promotions.find(p => p.id === filters.promotion)?.name || filters.promotion} 
                    onClear={() => updateFilter('promotion', null)} 
                  />
                )}
              </div>
            )}

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <CalendarIcon className="h-3 w-3" />
                Date Range
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal text-xs">
                    {filters.dateRange.from ? (
                      filters.dateRange.to ? (
                        <>
                          {format(filters.dateRange.from, "LLL dd")} - {format(filters.dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(filters.dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span className="text-muted-foreground">Last 4 weeks (default)</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: filters.dateRange.from, to: filters.dateRange.to }}
                    onSelect={(range) => updateFilter('dateRange', { from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Region */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                Region
              </Label>
              <Select value={filters.region || ''} onValueChange={(v) => updateFilter('region', v || null)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All regions</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Store */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <Store className="h-3 w-3" />
                Store
              </Label>
              <Select value={filters.store || ''} onValueChange={(v) => updateFilter('store', v || null)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All stores</SelectItem>
                  {stores.slice(0, 20).map((store) => (
                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <Package className="h-3 w-3" />
                Category
              </Label>
              <Select value={filters.category || ''} onValueChange={(v) => updateFilter('category', v || null)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <Tag className="h-3 w-3" />
                Brand
              </Label>
              <Select value={filters.brand || ''} onValueChange={(v) => updateFilter('brand', v || null)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All brands</SelectItem>
                  {brands.slice(0, 20).map((brand) => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supplier - Only show for supply-chain module */}
            {(moduleId === 'supply-chain' || moduleId === 'executive') && (
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <Truck className="h-3 w-3" />
                  Supplier
                </Label>
                <Select value={filters.supplier || ''} onValueChange={(v) => updateFilter('supplier', v || null)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All suppliers</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Promotion - Only show for promotion module */}
            {(moduleId === 'promotion' || moduleId === 'executive') && (
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <Target className="h-3 w-3" />
                  Promotion
                </Label>
                <Select value={filters.promotion || ''} onValueChange={(v) => updateFilter('promotion', v || null)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All promotions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All promotions</SelectItem>
                    {promotions.map((promo) => (
                      <SelectItem key={promo.id} value={promo.id}>{promo.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-xs gap-1.5"
                onClick={resetFilters}
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1 text-xs gap-1.5"
              >
                <Save className="h-3 w-3" />
                Save View
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default GlobalFiltersPanel;
export { defaultFilters };
