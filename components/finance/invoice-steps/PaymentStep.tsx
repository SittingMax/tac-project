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
    <div className="space-y-6 py-2">
      <Card className="p-6 border-t-4 border-t-primary rounded-none">
        <SectionHeader icon={Calculator} title="Freight & Charges" />

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <Label>Freight Rate / KG</Label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-muted-foreground">₹</span>
              <Input type="number" {...form.register('ratePerKg')} className="pl-8 h-12 text-lg" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-primary">Base Freight (Auto)</Label>
            <Input
              type="number"
              {...form.register('baseFreight')}
              className="h-12 text-lg font-bold bg-muted"
              readOnly
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-6 border-t border-border">
          {[
            'docketCharge',
            'pickupCharge',
            'packingCharge',
            'handlingFee',
            'insurance',
            'fuelSurcharge',
          ].map((field) => (
            <div key={field} className="space-y-2">
              <Label className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</Label>
              <Input
                type="number"
                {...form.register(
                  field as
                    | 'docketCharge'
                    | 'pickupCharge'
                    | 'packingCharge'
                    | 'handlingFee'
                    | 'insurance'
                    | 'fuelSurcharge'
                )}
                className="text-right"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <Label className="text-status-success font-bold text-sm">Discount</Label>
            <div className="relative w-40">
              <span className="absolute left-3 top-2.5 text-status-success">−₹</span>
              <Input
                type="number"
                {...form.register('discount')}
                className="pl-10 text-right text-status-success font-bold bg-status-success/5 border-status-success/30 rounded-none"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Panel */}
      <div className="bg-gradient-to-br from-muted/60 to-muted/30 p-6 rounded-none border border-border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Controller
                    control={form.control}
                    name="gstApplicable"
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="gstApplicable"
                      />
                    )}
                  />
                  <span className="text-sm font-medium text-foreground">GST</span>
                </label>
                {gstApplicable && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      {...form.register('gstRate')}
                      className="w-14 h-7 text-center text-xs"
                      min="0"
                      max="100"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                )}
              </div>
              <span className="font-semibold text-foreground">{formatCurrency(tax)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Advance Paid</span>
              <Input
                placeholder="₹0"
                type="number"
                {...form.register('advancePaid')}
                className="w-28 text-right h-8 text-sm"
              />
            </div>

            {balance > 0 && balance !== total && (
              <div className="flex justify-between items-center py-2 bg-status-warning/10 px-3 rounded-none border border-status-warning/20">
                <span className="text-sm font-medium text-status-warning">Balance Due</span>
                <span className="font-bold text-status-warning">{formatCurrency(balance)}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end justify-center bg-primary/5 rounded-none p-6 border border-primary/20">
            <div className="text-xs uppercase text-primary/70 tracking-wider font-bold mb-1">
              Grand Total
            </div>
            <div className="text-4xl font-black text-primary tracking-tight">
              {formatCurrency(total)}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {gstApplicable ? 'Inclusive of GST' : 'GST not applicable'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
