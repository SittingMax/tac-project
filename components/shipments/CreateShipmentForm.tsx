import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, Truck, Plane, Zap, Clock } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useCustomers } from '@/hooks/useCustomers';
import { useCreateShipment } from '@/hooks/useShipments';
import { HUBS, SHIPMENT_MODES, SERVICE_LEVELS } from '@/lib/constants';
import { logger } from '@/lib/logger';

const getAddressValue = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const normalizeCustomerAddress = (address: unknown) => {
  if (typeof address === 'string') {
    return {
      line1: address.trim(),
      city: '',
      state: '',
      zip: '',
    };
  }

  if (!address || typeof address !== 'object' || Array.isArray(address)) {
    return {
      line1: '',
      city: '',
      state: '',
      zip: '',
    };
  }

  const record = address as Record<string, unknown>;

  return {
    line1: getAddressValue(record.line1 ?? record.address ?? record.street ?? record.address1),
    city: getAddressValue(record.city),
    state: getAddressValue(record.state),
    zip: getAddressValue(
      record.zip ?? record.postal_code ?? record.postalCode ?? record.pincode ?? record.pin
    ),
  };
};

const schema = z
  .object({
    customerId: z.string().min(1, 'Customer is required'),
    originHub: z.enum(['IMPHAL', 'NEW_DELHI']),
    destinationHub: z.enum(['IMPHAL', 'NEW_DELHI']),
    mode: z.enum(['AIR', 'TRUCK']),
    serviceLevel: z.enum(['STANDARD', 'EXPRESS']),
    packageCount: z.number().min(1),
    weightDead: z.number().min(0.1),
    dimL: z.number().min(1),
    dimW: z.number().min(1),
    dimH: z.number().min(1),
    consigneeName: z.string().min(1, 'Consignee name is required'),
    consigneePhone: z.string().min(10, 'Consignee phone is required'),
    consigneeAddress: z.string().min(5, 'Delivery address is required'),
    consigneeCity: z.string().min(2, 'Destination city is required'),
    consigneeState: z.string().min(2, 'Destination state is required'),
    consigneeZip: z.string().min(4, 'Destination ZIP is required'),
    specialInstructions: z.string().optional(),
  })
  .refine((data) => data.originHub !== data.destinationHub, {
    message: 'Origin and Destination cannot be the same',
    path: ['destinationHub'],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreateShipmentForm: React.FC<Props> = ({ onSuccess, onCancel }) => {
  const { data: customers = [] } = useCustomers();
  const createShipmentMutation = useCreateShipment();

  // Map Hub Codes to UUIDs from HUBS constants
  const HUB_IDS: Record<string, string> = {
    IMPHAL: HUBS.IMPHAL.uuid,
    NEW_DELHI: HUBS.NEW_DELHI.uuid,
  };

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      originHub: undefined,
      destinationHub: undefined,
      mode: 'AIR',
      serviceLevel: 'STANDARD',
      packageCount: 1,
      weightDead: 1.0,
      dimL: 10,
      dimW: 10,
      dimH: 10,
      consigneeName: '',
      consigneePhone: '',
      consigneeAddress: '',
      consigneeCity: '',
      consigneeState: '',
      consigneeZip: '',
      specialInstructions: '',
    },
  });

  const { watch, handleSubmit } = form;

  const selectedCustomerId = watch('customerId');
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);

  const onSubmit = async (data: FormData) => {
    // eslint-disable-next-line no-console
    console.debug('Submitting CreateShipmentForm', data);
    if (customers.length === 0) {
      toast.error('Unable to load customers. Please check your connection.');
      return;
    }

    if (!selectedCustomer) {
      toast.error('Please select a valid customer before creating the shipment.');
      return;
    }

    // Volumetric Calculation (Standard L*W*H / 5000 for Air)
    const divisor = data.mode === 'AIR' ? 5000 : 4000;
    const volWeight = (data.dimL * data.dimW * data.dimH) / divisor;
    const chargeable = Math.max(data.weightDead, volWeight);
    const consignorAddress = normalizeCustomerAddress(selectedCustomer.address);

    try {
      await createShipmentMutation.mutateAsync({
        customer_id: data.customerId,
        origin_hub_id: HUB_IDS[data.originHub],
        destination_hub_id: HUB_IDS[data.destinationHub],
        mode: data.mode,
        service_level: data.serviceLevel,
        package_count: data.packageCount,
        total_weight: parseFloat(chargeable.toFixed(2)),
        consignee_name: data.consigneeName,
        consignee_phone: data.consigneePhone,
        consignee_address: {
          line1: data.consigneeAddress,
          city: data.consigneeCity,
          state: data.consigneeState,
          zip: data.consigneeZip,
        },
        consignor_name: selectedCustomer.name,
        consignor_phone: selectedCustomer.phone,
        consignor_address: {
          line1: consignorAddress.line1,
          city: consignorAddress.city,
          state: consignorAddress.state,
          zip: consignorAddress.zip,
        },
        special_instructions:
          data.specialInstructions || `Dims: ${data.dimL}x${data.dimW}x${data.dimH}`,
      });

      toast.success('Shipment created successfully');
      // Delay onSuccess to allow toast to render and prevent race conditions on unmount
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (e) {
      logger.error('CreateShipmentForm', 'Error', { error: e });
      toast.error('Failed to create shipment', {
        description: e instanceof Error ? e.message : 'Please check your internet connection.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Routing, Shipper & Service */}
          <div className="space-y-8">
            {/* Route Section */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <FormField
                  control={form.control}
                  name="originHub"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                        Origin Hub
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full h-11 bg-transparent hover:border-ring/50 transition-colors">
                            <SelectValue placeholder="Select Hub" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(HUBS).map((hub) => (
                            <SelectItem key={hub.id} value={hub.id}>
                              {hub.name} ({hub.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  control={form.control}
                  name="destinationHub"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                        Destination Hub
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full h-11 bg-transparent hover:border-ring/50 transition-colors">
                            <SelectValue placeholder="Select Hub" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(HUBS).map((hub) => (
                            <SelectItem key={hub.id} value={hub.id}>
                              {hub.name} ({hub.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Customer */}
            <div>
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                      Customer / Shipper
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full h-11 bg-transparent hover:border-ring/50 transition-colors">
                          <SelectValue placeholder="Select Customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedCustomer && (
                <div className="mt-3 rounded-md border border-border bg-transparent px-4 py-3 text-sm text-foreground flex flex-col gap-1">
                  <span className="font-medium">{selectedCustomer.name}</span>
                  <span className="text-muted-foreground text-xs">{selectedCustomer.phone}</span>
                </div>
              )}
            </div>

            {/* Mode & Service */}
            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                      Transport Mode
                    </FormLabel>
                    <FormControl>
                      <div className="flex bg-muted/30 p-1 border border-input rounded-md h-11">
                        {SHIPMENT_MODES.map((mode) => (
                          <label
                            key={mode.id}
                            className={`flex-1 cursor-pointer flex items-center justify-center text-sm font-medium rounded-sm transition-all
                        ${field.value === mode.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                          >
                            <input
                              type="radio"
                              value={mode.id}
                              checked={field.value === mode.id}
                              onChange={() => field.onChange(mode.id)}
                              className="hidden"
                            />
                            {mode.id === 'AIR' ? (
                              <Plane className="w-4 h-4 mr-2" />
                            ) : (
                              <Truck className="w-4 h-4 mr-2" />
                            )}
                            {mode.label}
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                      Service Level
                    </FormLabel>
                    <FormControl>
                      <div className="flex bg-muted/30 p-1 border border-input rounded-md h-11">
                        {SERVICE_LEVELS.map((level) => (
                          <label
                            key={level.id}
                            className={`flex-1 cursor-pointer flex items-center justify-center text-sm font-medium rounded-sm transition-all
                        ${field.value === level.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                          >
                            <input
                              type="radio"
                              value={level.id}
                              checked={field.value === level.id}
                              onChange={() => field.onChange(level.id)}
                              className="hidden"
                            />
                            {level.id === 'EXPRESS' ? (
                              <Zap className="w-4 h-4 mr-2" />
                            ) : (
                              <Clock className="w-4 h-4 mr-2" />
                            )}
                            {level.label.split(' ')[0]}
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Right Column: Consignee & Cargo */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
                <Package className="w-5 h-5 text-muted-foreground" /> Consignee Details
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <FormField
                    control={form.control}
                    name="consigneeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                          Consignee Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-11 bg-transparent hover:border-ring/50 transition-colors"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="consigneePhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                          Consignee Phone
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-11 bg-transparent hover:border-ring/50 transition-colors"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="consigneeAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                          Delivery Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-11 bg-transparent hover:border-ring/50 transition-colors"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="consigneeCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                          Destination City
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-11 bg-transparent hover:border-ring/50 transition-colors"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="consigneeState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                          Destination State
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-11 bg-transparent hover:border-ring/50 transition-colors"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="consigneeZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                          Destination Zip
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-11 bg-transparent hover:border-ring/50 transition-colors"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div className="space-y-6">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
                <Package className="w-5 h-5 text-muted-foreground" /> Package Specification
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <FormField
                    control={form.control}
                    name="packageCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                          Total Pieces
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-11 bg-transparent hover:border-ring/50 transition-colors"
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="weightDead"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                          Dead Weight (KG)
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-11 bg-transparent hover:border-ring/50 transition-colors"
                            type="number"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div>
                <FormLabel className="text-xs font-mono text-muted-foreground uppercase mb-2 block">
                  Package Dimensions (L × W × H in cm)
                </FormLabel>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="dimL"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            className="h-11 bg-transparent hover:border-ring/50 transition-colors"
                            type="number"
                            placeholder="Length"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dimW"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            className="h-11 bg-transparent hover:border-ring/50 transition-colors"
                            type="number"
                            placeholder="Width"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dimH"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            className="h-11 bg-transparent hover:border-ring/50 transition-colors"
                            type="number"
                            placeholder="Height"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <FormField
            control={form.control}
            name="specialInstructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                  Special Instructions & Branding Notes
                </FormLabel>
                <FormControl>
                  <RichTextEditor
                    content={field.value}
                    onChange={field.onChange}
                    placeholder="Add handling instructions, branding notes, etc."
                    minHeight="100px"
                    maxHeight="200px"
                    toolbarVariant="minimal"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={createShipmentMutation.isPending}>
            {createShipmentMutation.isPending ? 'Creating...' : 'Create Shipment'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
