import React, { useState } from 'react';
import { UseFormReturn, Controller } from 'react-hook-form';
import { InvoiceFormData } from '@/hooks/useMultiStepInvoice';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Plus, Search, Truck, Plane, Sparkles, Loader2, CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { TrackingDialog } from '@/components/landing-new/tracking-dialog';
import { PAYMENT_MODES } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Props {
    form: UseFormReturn<InvoiceFormData>;
    mode: 'NEW_BOOKING' | 'EXISTING_SHIPMENT';
    setMode: (mode: 'NEW_BOOKING' | 'EXISTING_SHIPMENT') => void;
    setSelectedShipment: (shipment: unknown) => void;
}

const Label: React.FC<{ children: React.ReactNode; error?: string }> = ({ children, error }) => (
    <div className="flex justify-between items-end mb-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            {children}
        </label>
        {error && <span className="text-xs text-destructive font-medium">{error}</span>}
    </div>
);

export const BasicsStep = ({ form, mode, setMode, setSelectedShipment }: Props) => {
    const [searchAwb, setSearchAwb] = useState('');
    const [isGeneratingAwb, setIsGeneratingAwb] = useState(false);
    const { watch, setValue } = form;
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
        <div className="space-y-6 py-2">
            <div className="inline-flex items-center gap-1 rounded-none border border-border/60 bg-muted/60 p-1 shadow-sm">
                <button
                    type="button"
                    onClick={() => { setMode('NEW_BOOKING'); setValue('awb', ''); setValue('invoiceNumber', ''); }}
                    className={`px-3.5 py-1.5 text-[11px] font-semibold rounded-none transition-all flex items-center gap-2 tracking-wide ${mode === 'NEW_BOOKING' ? 'bg-background shadow-sm text-foreground border border-border/60' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Plus className="w-3.5 h-3.5" /> New Invoice
                </button>
                <button
                    type="button"
                    onClick={() => { setMode('EXISTING_SHIPMENT'); setValue('awb', ''); }}
                    className={`px-3.5 py-1.5 text-[11px] font-semibold rounded-none transition-all flex items-center gap-2 tracking-wide ${mode === 'EXISTING_SHIPMENT' ? 'bg-background shadow-sm text-foreground border border-border/60' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Search className="w-3.5 h-3.5" /> Link Shipment
                </button>
            </div>

            {mode === 'EXISTING_SHIPMENT' && (
                <div className="flex flex-wrap items-center gap-2 rounded-none border border-border/60 bg-muted/30 p-3 animate-in fade-in slide-in-from-top-2">
                    <Input placeholder="Enter CN Number..." value={searchAwb} onChange={(e) => setSearchAwb(e.target.value)} className="h-10 w-64 bg-background" />
                    <Button size="sm" onClick={handleSearch} className="h-10">Load</Button>
                    <div className="w-px h-6 bg-border mx-2" />
                    <TrackingDialog>
                        <Button size="sm" variant="outline" className="h-10 gap-2 border-dashed">
                            <Search className="w-4 h-4" /> Check Status
                        </Button>
                    </TrackingDialog>
                </div>
            )}

            <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                    <Label error={errors.awb?.message}>CN Number</Label>
                    <div className="flex gap-2">
                        <Input {...form.register('awb')} readOnly className="h-11 font-mono bg-muted/40 border-border/60 text-sm" placeholder="Auto-generated on save" />
                        {mode === 'NEW_BOOKING' && (
                            <Button type="button" variant="outline" className="h-11 px-3" onClick={handleGenerateAwb} disabled={isGeneratingAwb || !!watch('awb')}>
                                {isGeneratingAwb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-primary" />}
                            </Button>
                        )}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Invoice Ref</Label>
                    <Input {...form.register('invoiceNumber')} readOnly className="h-11 font-mono bg-muted/40 border-border/60 text-sm" placeholder="Auto-generated on save" />
                </div>
                <div className="space-y-2">
                    <Label error={errors.bookingDate?.message}>Booking Date</Label>
                    <Controller control={form.control} name="bookingDate" render={({ field }) => {
                        const dateValue = field.value ? (typeof field.value === 'string' ? parseISO(field.value) : field.value) : undefined;
                        return (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-start text-left font-normal h-11',
                                            !dateValue && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
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
                    }} />
                </div>
                <div className="space-y-2">
                    <Label>Transport Mode</Label>
                    <Controller control={form.control} name="transportMode" render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="h-11 bg-background"><SelectValue placeholder="Select Mode" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TRUCK"><div className="flex items-center gap-2"><Truck className="w-4 h-4 text-muted-foreground" /><span>Surface / Truck</span></div></SelectItem>
                                <SelectItem value="AIR"><div className="flex items-center gap-2"><Plane className="w-4 h-4 text-muted-foreground" /><span>Air Cargo</span></div></SelectItem>
                            </SelectContent>
                        </Select>
                    )} />
                </div>
                <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <Controller control={form.control} name="paymentMode" render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="h-11 bg-background"><SelectValue placeholder="Select Mode" /></SelectTrigger>
                            <SelectContent>
                                {PAYMENT_MODES.map((pm) => (
                                    <SelectItem key={pm.id} value={pm.id}>{pm.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )} />
                </div>
            </div>
        </div>
    );
};
