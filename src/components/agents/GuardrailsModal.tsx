import { useState, useEffect } from 'react';
import { Guardrails } from './types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Check, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuardrailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guardrails: Guardrails;
  onSave: (guardrails: Guardrails) => void;
  violations?: string[];
}

export function GuardrailsModal({
  open,
  onOpenChange,
  guardrails,
  onSave,
  violations = []
}: GuardrailsModalProps) {
  const [localGuardrails, setLocalGuardrails] = useState<Guardrails>(guardrails);
  const [localViolations, setLocalViolations] = useState<string[]>(violations);

  useEffect(() => {
    setLocalGuardrails(guardrails);
    setLocalViolations(violations);
  }, [guardrails, violations, open]);

  const handleChange = (key: keyof Guardrails, value: number | boolean) => {
    setLocalGuardrails(prev => ({ ...prev, [key]: value }));
    
    // Simulate violation resolution
    if (key === 'maxPriceChange' && typeof value === 'number' && value >= 15) {
      setLocalViolations(prev => prev.filter(v => !v.includes('price')));
    }
    if (key === 'inventoryFloor' && typeof value === 'number' && value <= 2) {
      setLocalViolations(prev => prev.filter(v => !v.includes('inventory')));
    }
  };

  const handleSave = () => {
    onSave(localGuardrails);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Edit Guardrails
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {localViolations.length > 0 ? (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-semibold">{localViolations.length} violation(s)</span>
              </div>
              <div className="space-y-1">
                {localViolations.map((v, i) => (
                  <p key={i} className="text-xs text-amber-600 dark:text-amber-400">{v}</p>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                All guardrails passed
              </span>
            </div>
          )}

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxPriceChange" className="text-xs">
                Max Price Change (%)
              </Label>
              <Input
                id="maxPriceChange"
                type="number"
                value={localGuardrails.maxPriceChange}
                onChange={(e) => handleChange('maxPriceChange', Number(e.target.value))}
                className="h-8"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minMargin" className="text-xs">
                Min Margin (%)
              </Label>
              <Input
                id="minMargin"
                type="number"
                value={localGuardrails.minMargin}
                onChange={(e) => handleChange('minMargin', Number(e.target.value))}
                className="h-8"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorFundingCap" className="text-xs">
                Vendor Funding Cap (₹)
              </Label>
              <Input
                id="vendorFundingCap"
                type="number"
                value={localGuardrails.vendorFundingCap}
                onChange={(e) => handleChange('vendorFundingCap', Number(e.target.value))}
                className="h-8"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inventoryFloor" className="text-xs">
                Inventory Floor (weeks)
              </Label>
              <Input
                id="inventoryFloor"
                type="number"
                value={localGuardrails.inventoryFloor}
                onChange={(e) => handleChange('inventoryFloor', Number(e.target.value))}
                className="h-8"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceLevelTarget" className="text-xs">
                Service Level Target (%)
              </Label>
              <Input
                id="serviceLevelTarget"
                type="number"
                value={localGuardrails.serviceLevelTarget}
                onChange={(e) => handleChange('serviceLevelTarget', Number(e.target.value))}
                className="h-8"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="premiumBrandNoDiscount" className="text-xs">
                No discount on premium brands
              </Label>
              <Switch
                id="premiumBrandNoDiscount"
                checked={localGuardrails.premiumBrandNoDiscount}
                onCheckedChange={(checked) => handleChange('premiumBrandNoDiscount', checked)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Guardrails
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
