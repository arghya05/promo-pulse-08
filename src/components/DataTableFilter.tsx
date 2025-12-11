import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";

interface FilterOption {
  key: string;
  label: string;
  type: "text" | "select";
  options?: string[];
}

interface DataTableFilterProps {
  filters: FilterOption[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
}

export function DataTableFilter({ filters, values, onChange, onClear }: DataTableFilterProps) {
  const hasActiveFilters = Object.values(values).some(v => v && v !== "all");

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-muted/30 rounded-lg border">
      <Search className="h-4 w-4 text-muted-foreground" />
      {filters.map((filter) => (
        <div key={filter.key} className="flex-1 min-w-[150px] max-w-[200px]">
          {filter.type === "text" ? (
            <Input
              placeholder={filter.label}
              value={values[filter.key] || ""}
              onChange={(e) => onChange(filter.key, e.target.value)}
              className="h-9 bg-background"
            />
          ) : (
            <Select
              value={values[filter.key] || "all"}
              onValueChange={(value) => onChange(filter.key, value)}
            >
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-9">
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
