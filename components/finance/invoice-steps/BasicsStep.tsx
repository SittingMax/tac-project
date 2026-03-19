import React, { useState } from 'react';
import { UseFormReturn, Controller } from 'react-hook-form';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Plus, Search, Truck, Plane, Sparkles, Loader2, CalendarIcon } from 'lucide-react';
import { AppIcon } from '@/components/ui-core';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { TrackingDialog } from '@/components/landing-new/tracking-dialog';
import { PAYMENT_MODES } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { FormSection, FormGrid } from '@/components/ui-core';

interface Props {
  form: UseFormReturn<InvoiceFormData>;
  mode: 'NEW_BOOKING' | 'EXISTING_SHIPMENT';
  setMode: (mode: 'NEW_BOOKING' | 'EXISTING_SHIPMENT') => void;
  setSelectedShipment: (shipment: unknown) => void;
}

const Label: React.FC<{ children: React.ReactNode; error?: string; htmlFor?: string }> = ({
  children,
  error,
  htmlFor,
}) => (
  <div className="flex justify-between items-end mb-2">
    <label
      htmlFor={htmlFor}
      className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"
    >
      {children}
    </label>
    {error && <span className="text-xs text-destructive font-medium">{error}</span>}
  </div>
);

export const BasicsStep = ({ form, mode, setMode, setSelectedShipment }: Props) => {
  const [searchAwb, setSearchAwb] = useState('');
  const [isGeneratingAwb, setIsGeneratingAwb] = useState(false);
  const { watch, setValue, control } = form;
  const errors = form.formState.errors;

  const handleSearch = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const { data: shipmentData, error } = await supabase
        .from('shipments')
        .select('*, customer:customers(name, phone)')
        .eq('cn_number', searchAwb.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;
      if (shipmentData) {
        setSelectedShipment({
          id: shipmentData.id,
          awb: shipmentData.cn_number,
          customerName: shipmentData.customer?.name || 'Unknown',
          mode: shipmentData.mode?.toUpperCase() === 'AIR' ? 'AIR' : 'TRUCK',
        });
        setValue('awb', shipmentData.cn_number || '');
        if (shipmentData.mode) {
          setValue('transportMode', shipmentData.mode === 'AIR' ? 'AIR' : 'TRUCK');
        }
        toast.success('Shipment data loaded!');
      } else {
        setSelectedShipment(null);
        toast.error('Shipment not found');
      }
    } catch {
      toast.error('Failed to search shipment');
    }
  };

  const handleGenerateAwb = async () => {
    setIsGeneratingAwb(true);
    try {
      const { data: awb, error } = await supabase.rpc('generate_cn_number');
      if (error) throw error;
      if (awb) {
        setValue('awb', awb);
        toast.success(`Generated awb: ${awb}`);
      }
    } finally {
      setIsGeneratingAwb(false);
    }
  };

  return (
    <div className="space-y-8 py-2 max-w-4xl">
      {/* Mode Toggle (Segmented Control Style) */}
      <div className="inline-flex items-center rounded-md border border-border/60 bg-muted/30 p-1 shadow-sm w-fit">
        <button
          type="button"
          onClick={() => {
            setMode('NEW_BOOKING');
            setValue('awb', '');
            setValue('invoiceNumber', '');
          }}
          className={cn(
            'px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
            mode === 'NEW_BOOKING'
              ? 'bg-background text-foreground shadow-sm ring-1 ring-border border-b-2 border-b-primary'
              : 'text-muted-foreground hover:bg-muted/50'
          )}
        >
          <AppIcon icon={Plus} size={16} className="w-3.5 h-3.5 mr-1" /> New Invoice
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('EXISTING_SHIPMENT');
            setValue('awb', '');
          }}
          className={cn(
            'px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
            mode === 'EXISTING_SHIPMENT'
              ? 'bg-background text-foreground shadow-sm ring-1 ring-border border-b-2 border-b-primary'
              : 'text-muted-foreground hover:bg-muted/50'
          )}
        >
          <AppIcon icon={Search} size={16} className="w-3.5 h-3.5 mr-1" /> Link Shipment
        </button>
      </div>

      {mode === 'EXISTING_SHIPMENT' && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-muted/30 p-4 animate-in fade-in slide-in-from-top-2 mb-8">
          <Input
            placeholder="Enter CN Number..."
            value={searchAwb}
            onChange={(e) => setSearchAwb(e.target.value)}
            className="h-11 w-64 bg-background"
          />
          <Button size="sm" onClick={handleSearch} className="h-11">
            Load
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <TrackingDialog>
            <Button size="sm" variant="outline" className="h-11 gap-2 border-dashed">
              <AppIcon icon={Search} size={16} /> Check Status
            </Button>
          </TrackingDialog>
        </div>
      )}

      <FormSection title="Basic Details" description="Invoice reference and booking dates.">
        <FormGrid columns={2}>
          <div className="space-y-2">
            <Label htmlFor="awb" error={errors.awb?.message}>
              CN Number
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                id="awb"
                {...form.register('awb')}
                readOnly
                className="h-11 font-mono bg-muted/40 border-border/60 text-sm"
                placeholder="Auto-generated on save"
              />
              {mode === 'NEW_BOOKING' && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-4 shrink-0 shadow-sm"
                  onClick={handleGenerateAwb}
                  disabled={isGeneratingAwb || !!watch('awb')}
                >
                  {isGeneratingAwb ? (
                    <AppIcon icon={Loader2} size={16} className="animate-spin" />
                  ) : (
                    <AppIcon icon={Sparkles} size={16} className="text-primary" />
                  )}
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Ref</Label>
            <Input
              id="invoiceNumber"
              {...form.register('invoiceNumber')}
              readOnly
              className="h-11 font-mono bg-muted/40 border-border/60 text-sm"
              placeholder="Auto-generated on save"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bookingDate" error={errors.bookingDate?.message}>
              Booking Date
            </Label>
            <Controller
              control={form.control}
              name="bookingDate"
              render={({ field }) => {
                const dateValue = field.value
                  ? typeof field.value === 'string'
                    ? parseISO(field.value)
                    : field.value
                  : undefined;
                return (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="bookingDate"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal h-11',
                          !dateValue && 'text-muted-foreground'
                        )}
                      >
                        <AppIcon icon={CalendarIcon} size={16} className="mr-2" />
                        {dateValue ? format(dateValue, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateValue}
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(date.toISOString().split('T')[0]);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                );
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transportMode">Transport Mode</Label>
            <Controller
              control={form.control}
              name="transportMode"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="transportMode" className="h-11 bg-background">
                    <SelectValue placeholder="Select Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRUCK">
                      <div className="flex items-center gap-2">
                        <AppIcon icon={Truck} size={16} className="text-muted-foreground" />
                        <span>Surface / Truck</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="AIR">
                      <div className="flex items-center gap-2">
                        <AppIcon icon={Plane} size={16} className="text-muted-foreground" />
                        <span>Air Cargo</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMode" error={errors.paymentMode?.message}>
              Payment Mode *
            </Label>
            <Controller
              name="paymentMode"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="w-full h-11 bg-background hover:border-ring/50">
                    <SelectValue placeholder="Select Payment Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((pm) => (
                      <SelectItem key={pm.id} value={pm.id}>
                        {pm.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.paymentMode && (
              <p className="text-[0.8rem] font-medium text-destructive">
                {errors.paymentMode.message}
              </p>
            )}
          </div>
        </FormGrid>
      </FormSection>
    </div>
  );
};
