// PaymentStep — Freight & charges summary
import { UseFormReturn, Controller } from 'react-hook-form';
import { InvoiceFormData } from '@/hooks/useMultiStepInvoice';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calculator } from 'lucide-react';
import { SectionHeader, Label } from './shared';
import { formatCurrency } from '@/lib/utils';

interface Props {
  form: UseFormReturn<InvoiceFormData>;
  subtotal: number;
  tax: number;
  total: number;
  balance: number;
}

export const PaymentStep = ({ form, subtotal, tax, total, balance }: Props) => {
  const { watch } = form;
  const gstApplicable = watch('gstApplicable');

  return (
    <div className="space-y-8 py-2 max-w-4xl mx-auto">
      <Card className="p-8 border-t-4 border-t-primary rounded-xl bg-background/50 shadow-sm">
        <SectionHeader icon={Calculator} title="Freight & Charges" />

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="space-y-3">
            <Label className="text-sm font-semibold tracking-wide">Freight Rate / KG</Label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-muted-foreground font-medium">₹</span>
              <Input
                type="number"
                {...form.register('ratePerKg', { valueAsNumber: true })}
                onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                className="pl-8 h-11 text-base bg-transparent hover:border-ring/50"
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-primary text-sm font-semibold tracking-wide">
              Base Freight (Auto)
            </Label>
            <Input
              type="number"
              {...form.register('baseFreight')}
              className="h-11 text-base font-bold bg-primary/5 border-primary/20"
              readOnly
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-border/40">
          {[
            'docketCharge',
            'pickupCharge',
            'packingCharge',
            'handlingFee',
            'insurance',
            'fuelSurcharge',
          ].map((field) => (
            <div key={field} className="space-y-2">
              <Label className="capitalize text-xs font-semibold text-muted-foreground tracking-wide">
                {field.replace(/([A-Z])/g, ' $1').trim()}
              </Label>
              <Input
                type="number"
                {...form.register(
                  field as
                    | 'docketCharge'
                    | 'pickupCharge'
                    | 'packingCharge'
                    | 'handlingFee'
                    | 'insurance'
                    | 'fuelSurcharge',
                  { valueAsNumber: true }
                )}
                onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                className="text-right h-11 bg-transparent hover:border-ring/50"
              />
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-border/40">
          <div className="flex justify-between items-center">
            <Label className="text-status-success font-bold text-sm tracking-wide">
              Discount Amount
            </Label>
            <div className="relative w-48">
              <span className="absolute left-4 top-3 text-status-success font-semibold">−₹</span>
              <Input
                type="number"
                {...form.register('discount', { valueAsNumber: true })}
                onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                className="pl-10 h-11 text-right text-base text-status-success font-bold bg-status-success/5 border-status-success/30 rounded-md shadow-sm hover:border-status-success/50"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Panel */}
      <div className="bg-gradient-to-br from-background to-muted/20 p-8 rounded-xl border border-border/50 shadow-sm relative overflow-hidden">
        {/* Decorative flair */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
          <div className="space-y-5">
            <div className="flex justify-between items-center py-2 border-b border-border/40">
              <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-lg text-foreground tracking-tight">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-3">
                <Label className="flex items-center gap-2 cursor-pointer group">
                  <Controller
                    control={form.control}
                    name="gstApplicable"
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="gstApplicable"
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    )}
                  />
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    GST Tax
                  </span>
                </Label>
                {gstApplicable && (
                  <div className="flex items-center gap-1.5 opacity-90 animate-in fade-in">
                    <Input
                      type="number"
                      {...form.register('gstRate', { valueAsNumber: true })}
                      onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                      className="w-16 h-8 text-center text-sm font-medium bg-background border-border/60"
                      min="0"
                      max="100"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">%</span>
                  </div>
                )}
              </div>
              <span className="font-semibold text-lg text-foreground tracking-tight">
                {formatCurrency(tax)}
              </span>
            </div>

            <div className="flex justify-between items-center py-3 border-t border-border/40 mt-2">
              <span className="text-sm font-medium text-muted-foreground">Advance Paid</span>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">₹</span>
                <Input
                  placeholder="0"
                  type="number"
                  {...form.register('advancePaid', { valueAsNumber: true })}
                  onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                  className="w-32 text-right pl-8 h-10 text-base font-medium bg-background hover:border-ring/50"
                />
              </div>
            </div>

            {balance > 0 && balance !== total && (
              <div className="flex justify-between items-center py-3 bg-status-warning/10 px-4 rounded-lg border border-status-warning/20 animate-in fade-in slide-in-from-bottom-2">
                <span className="text-sm font-bold text-status-warning tracking-wide">
                  Balance Due
                </span>
                <span className="font-bold text-lg text-status-warning tracking-tight">
                  {formatCurrency(balance)}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end justify-center bg-primary/5 rounded-xl p-8 border border-primary/20 shadow-inner">
            <div className="text-xs uppercase text-primary/70 tracking-widest font-bold mb-2">
              Grand Total
            </div>
            <div className="text-5xl font-bold text-primary tracking-tighter drop-shadow-sm">
              {formatCurrency(total)}
            </div>
            <div className="text-xs font-medium text-muted-foreground mt-4 border border-border/50 px-3 py-1 rounded-full bg-background/50">
              {gstApplicable ? 'Inclusive of Tax' : 'Tax Exempt'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
