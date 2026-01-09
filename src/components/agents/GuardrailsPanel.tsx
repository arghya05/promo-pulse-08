import { Guardrails } from './types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, Percent, IndianRupee, Package, Target, Tag } from 'lucide-react';

interface GuardrailsPanelProps {
  guardrails: Guardrails;
  onChange: (guardrails: Guardrails) => void;
}

export function GuardrailsPanel({ guardrails, onChange }: GuardrailsPanelProps) {
  const updateField = <K extends keyof Guardrails>(field: K, value: Guardrails[K]) => {
    onChange({ ...guardrails, [field]: value });
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="guardrails" className="border rounded-lg">
        <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-medium">Guardrails</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-3">
          <div className="grid gap-3">
            {/* Max Price Change */}
            <div className="flex items-center justify-between gap-4">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Percent className="h-3 w-3" />
                Max price change
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={guardrails.maxPriceChange}
                  onChange={(e) => updateField('maxPriceChange', Number(e.target.value))}
                  className="w-16 h-7 text-xs text-right"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>

            {/* Min Margin */}
            <div className="flex items-center justify-between gap-4">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Percent className="h-3 w-3" />
                Min margin
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={guardrails.minMargin}
                  onChange={(e) => updateField('minMargin', Number(e.target.value))}
                  className="w-16 h-7 text-xs text-right"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>

            {/* Vendor Funding Cap */}
            <div className="flex items-center justify-between gap-4">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <IndianRupee className="h-3 w-3" />
                Vendor funding cap
              </Label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">₹</span>
                <Input
                  type="number"
                  value={guardrails.vendorFundingCap}
                  onChange={(e) => updateField('vendorFundingCap', Number(e.target.value))}
                  className="w-20 h-7 text-xs text-right"
                />
              </div>
            </div>

            {/* Inventory Floor */}
            <div className="flex items-center justify-between gap-4">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Package className="h-3 w-3" />
                Inventory floor
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={guardrails.inventoryFloor}
                  onChange={(e) => updateField('inventoryFloor', Number(e.target.value))}
                  className="w-16 h-7 text-xs text-right"
                />
                <span className="text-xs text-muted-foreground">weeks</span>
              </div>
            </div>

            {/* Service Level Target */}
            <div className="flex items-center justify-between gap-4">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Target className="h-3 w-3" />
                Service level target
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={guardrails.serviceLevelTarget}
                  onChange={(e) => updateField('serviceLevelTarget', Number(e.target.value))}
                  className="w-16 h-7 text-xs text-right"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>

            {/* Premium Brand Rule */}
            <div className="flex items-center justify-between gap-4">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Tag className="h-3 w-3" />
                No discount on premium brands
              </Label>
              <Switch
                checked={guardrails.premiumBrandNoDiscount}
                onCheckedChange={(checked) => updateField('premiumBrandNoDiscount', checked)}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
