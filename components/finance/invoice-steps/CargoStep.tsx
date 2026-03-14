import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { InvoiceFormData } from '@/hooks/useMultiStepInvoice';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Box, Ruler, Scale, CheckCircle, Printer } from 'lucide-react';
import { SectionHeader, Label } from './shared';
import { CONTENT_TYPES } from '@/lib/constants';

interface Props {
  form: UseFormReturn<InvoiceFormData>;
  setShowLabelPreview: (show: boolean) => void;
}

export const CargoStep = ({ form, setShowLabelPreview }: Props) => {
  const { watch, setValue } = form;
  const errors = form.formState.errors;
  const [contentMode, setContentMode] = useState<'SELECT' | 'INPUT'>('SELECT');
  const transportMode = watch('transportMode');

  return (
    <div className="space-y-8 py-2 max-w-4xl mx-auto">
      <SectionHeader icon={Box} title="Cargo Specification" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2 space-y-2">
          <Label>
            Nature of Goods <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <Select
              value={CONTENT_TYPES.includes(watch('contents')) ? watch('contents') : 'OTHER'}
              onValueChange={(val) => {
                if (val === 'OTHER') {
                  setContentMode('INPUT');
                  setValue('contents', '');
                } else {
                  setContentMode('SELECT');
                  setValue('contents', val);
                }
              }}
            >
              <SelectTrigger className="h-11 bg-transparent hover:border-ring/50">
                <SelectValue placeholder="Select Contents" />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
                <SelectItem value="OTHER">Other...</SelectItem>
              </SelectContent>
            </Select>
            {contentMode === 'INPUT' && (
              <Input
                className="h-11 bg-transparent hover:border-ring/50"
                {...form.register('contents')}
                placeholder="Type..."
              />
            )}
          </div>
          {errors.contents && (
            <span className="text-xs text-destructive">{errors.contents.message}</span>
          )}
        </div>
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input
            type="number"
            {...form.register('pieces', { valueAsNumber: true })}
            onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
            className="text-center h-11 bg-transparent hover:border-ring/50"
          />
        </div>
        <div className="space-y-2">
          <Label>Value (₹)</Label>
          <Input
            type="number"
            {...form.register('declaredValue', { valueAsNumber: true })}
            onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
            className="text-right h-11 bg-transparent hover:border-ring/50"
          />
        </div>
      </div>

      <div className="p-8 bg-muted/20 rounded-xl border border-border/50 shadow-sm space-y-8">
        {/* Dimensions Row */}
        <div className="space-y-4">
          <Label className="flex gap-2 text-sm font-semibold tracking-wide">
            <Ruler className="w-4 h-4" /> Package Dimensions (L × W × H in cm)
          </Label>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Length
              </span>
              <Input
                placeholder="0"
                type="number"
                {...form.register('dimL', { valueAsNumber: true })}
                onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                className="text-center h-11 text-base bg-background hover:border-ring/50"
              />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Width
              </span>
              <Input
                placeholder="0"
                type="number"
                {...form.register('dimB', { valueAsNumber: true })}
                onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                className="text-center h-11 text-base bg-background hover:border-ring/50"
              />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Height
              </span>
              <Input
                placeholder="0"
                type="number"
                {...form.register('dimH', { valueAsNumber: true })}
                onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                className="text-center h-11 text-base bg-background hover:border-ring/50"
              />
            </div>
          </div>
        </div>

        {/* Weights Row */}
        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-border/40">
          <div className="space-y-3">
            <Label className="flex gap-2 text-sm font-semibold tracking-wide">
              <Scale className="w-4 h-4" /> Actual Weight
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                {...form.register('actualWeight', { valueAsNumber: true })}
                onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                className="pr-12 h-11 text-base font-semibold bg-background hover:border-ring/50"
              />
              <span className="absolute right-4 top-3 text-sm font-bold text-muted-foreground">
                KG
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <Label className="flex gap-2 text-primary text-sm font-semibold tracking-wide">
              <CheckCircle className="w-4 h-4" /> Charged Weight
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                {...form.register('chargedWeight', { valueAsNumber: true })}
                onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                className="pr-12 h-11 text-base font-semibold border-primary/50 bg-primary/5 shadow-sm"
              />
              <span className="absolute right-4 top-3 text-sm font-bold text-primary">KG</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/50">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Mode: {transportMode === 'AIR' ? 'Air Cargo' : 'Surface / Truck'}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowLabelPreview(true)}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              Preview Label
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
