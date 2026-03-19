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
import { Label } from './shared';
import { FormSection } from '@/components/ui-core';
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
    <div className="flex flex-col gap-8 py-2 max-w-4xl mx-auto">
      <FormSection icon={Box} title="Cargo Specification">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="md:col-span-2 flex flex-col gap-2">
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
                <SelectTrigger className="h-8 px-3 text-sm bg-transparent hover:border-ring/50 transition-colors">
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
                  className="h-8 px-3 text-sm bg-transparent hover:border-ring/50 transition-colors"
                  {...form.register('contents')}
                  placeholder="Type..."
                />
              )}
            </div>
            {errors.contents && (
              <span className="text-xs text-destructive">{errors.contents.message}</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              {...form.register('pieces', { valueAsNumber: true })}
              onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
              className="text-center h-8 px-3 text-sm bg-transparent hover:border-ring/50 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Value (₹)</Label>
            <Input
              type="number"
              {...form.register('declaredValue', { valueAsNumber: true })}
              onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
              className="text-right h-8 px-3 text-sm bg-transparent hover:border-ring/50 transition-colors"
            />
          </div>
        </div>

        <div className="p-6 bg-muted/20 rounded-none border border-border/50 flex flex-col gap-6">
          {/* Dimensions Row */}
          <div className="flex flex-col gap-3">
            <Label className="flex gap-2 text-sm font-semibold tracking-wide">
              <Ruler size={16} strokeWidth={1.5} /> Package Dimensions (L × W × H in cm)
            </Label>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  Length
                </span>
                <Input
                  placeholder="0"
                  type="number"
                  {...form.register('dimL', { valueAsNumber: true })}
                  onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                  className="text-center h-8 px-3 text-sm bg-background hover:border-ring/50 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  Width
                </span>
                <Input
                  placeholder="0"
                  type="number"
                  {...form.register('dimB', { valueAsNumber: true })}
                  onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                  className="text-center h-8 px-3 text-sm bg-background hover:border-ring/50 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  Height
                </span>
                <Input
                  placeholder="0"
                  type="number"
                  {...form.register('dimH', { valueAsNumber: true })}
                  onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                  className="text-center h-8 px-3 text-sm bg-background hover:border-ring/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Weights Row */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-border/40">
            <div className="flex flex-col gap-2">
              <Label className="flex gap-2 text-sm font-semibold tracking-wide">
                <Scale size={16} strokeWidth={1.5} /> Actual Weight
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  {...form.register('actualWeight', { valueAsNumber: true })}
                  onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                  className="pr-12 h-8 px-3 text-sm font-semibold bg-background hover:border-ring/50 transition-colors"
                />
                <span className="absolute right-3 top-1.5 text-xs font-bold text-muted-foreground">
                  KG
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="flex gap-2 text-primary text-sm font-semibold tracking-wide">
                <CheckCircle size={16} strokeWidth={1.5} /> Charged Weight
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  {...form.register('chargedWeight', { valueAsNumber: true })}
                  onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                  className="pr-12 h-8 px-3 text-sm font-semibold border-primary/50 bg-primary/5 shadow-sm transition-colors"
                />
                <span className="absolute right-3 top-1.5 text-xs font-bold text-primary">KG</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-3 border-t border-border/50">
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
                <Printer size={16} strokeWidth={1.5} />
                Preview Label
              </Button>
            </div>
          </div>
        </div>
      </FormSection>
    </div>
  );
};
