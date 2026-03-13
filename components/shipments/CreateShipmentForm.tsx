import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, Truck, Plane, Zap, Clock } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({
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

  const selectedCustomerId = watch('customerId');
  const selectedMode = watch('mode');
  const selectedService = watch('serviceLevel');
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Route Section */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-1">ORIGIN HUB</label>
          <select
            {...register('originHub')}
            className="w-full bg-background border border-input rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
          >
            <option value="">Select Hub</option>
            {Object.values(HUBS).map((hub) => (
              <option key={hub.id} value={hub.id}>
                {hub.name} ({hub.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-1">
            DESTINATION HUB
          </label>
          <select
            {...register('destinationHub')}
            className="w-full bg-background border border-input rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
          >
            <option value="">Select Hub</option>
            {Object.values(HUBS).map((hub) => (
              <option key={hub.id} value={hub.id}>
                {hub.name} ({hub.code})
              </option>
            ))}
          </select>
          {errors.destinationHub && (
            <span className="text-destructive text-xs">{errors.destinationHub.message}</span>
          )}
        </div>
      </div>

      {/* Customer */}
      <div>
        <label className="block text-xs font-mono text-muted-foreground mb-1">CUSTOMER</label>
        <select
          {...register('customerId')}
          className="w-full bg-background border border-input rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
        >
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.customerId && (
          <span className="text-destructive text-xs">{errors.customerId.message}</span>
        )}
        {selectedCustomer && (
          <div className="mt-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Shipper details will use the selected customer record: {selectedCustomer.name}
          </div>
        )}
      </div>

      <div className="p-4 bg-muted/40 rounded-md border border-border">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" /> Consignee Details
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1">
              CONSIGNEE NAME
            </label>
            <Input {...register('consigneeName')} />
            {errors.consigneeName && (
              <span className="text-destructive text-xs">{errors.consigneeName.message}</span>
            )}
          </div>
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1">
              CONSIGNEE PHONE
            </label>
            <Input {...register('consigneePhone')} />
            {errors.consigneePhone && (
              <span className="text-destructive text-xs">{errors.consigneePhone.message}</span>
            )}
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-mono text-muted-foreground mb-1">
              DELIVERY ADDRESS
            </label>
            <Input {...register('consigneeAddress')} />
            {errors.consigneeAddress && (
              <span className="text-destructive text-xs">{errors.consigneeAddress.message}</span>
            )}
          </div>
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1">
              DESTINATION CITY
            </label>
            <Input {...register('consigneeCity')} />
            {errors.consigneeCity && (
              <span className="text-destructive text-xs">{errors.consigneeCity.message}</span>
            )}
          </div>
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1">
              DESTINATION STATE
            </label>
            <Input {...register('consigneeState')} />
            {errors.consigneeState && (
              <span className="text-destructive text-xs">{errors.consigneeState.message}</span>
            )}
          </div>
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1">
              DESTINATION ZIP
            </label>
            <Input {...register('consigneeZip')} />
            {errors.consigneeZip && (
              <span className="text-destructive text-xs">{errors.consigneeZip.message}</span>
            )}
          </div>
        </div>
      </div>

      {/* Mode & Service */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-1">
            TRANSPORT MODE
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SHIPMENT_MODES.map((mode) => (
              <label
                key={mode.id}
                className={`
                                cursor-pointer border rounded-md p-2 flex flex-col items-center justify-center text-xs transition-all text-center
                                ${
                                  selectedMode === mode.id
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'border-input hover:bg-muted text-muted-foreground'
                                }
                            `}
              >
                <input type="radio" value={mode.id} {...register('mode')} className="hidden" />
                {mode.id === 'AIR' ? (
                  <Plane className="w-4 h-4 mb-1" />
                ) : (
                  <Truck className="w-4 h-4 mb-1" />
                )}
                {mode.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-1">
            SERVICE LEVEL
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SERVICE_LEVELS.map((level) => (
              <label
                key={level.id}
                className={`
                                cursor-pointer border rounded-md p-2 flex flex-col items-center justify-center text-xs transition-all text-center
                                ${
                                  selectedService === level.id
                                    ? 'bg-primary/10 border-primary/30 text-primary'
                                    : 'border-input hover:bg-muted text-muted-foreground'
                                }
                            `}
              >
                <input
                  type="radio"
                  value={level.id}
                  {...register('serviceLevel')}
                  className="hidden"
                />
                {level.id === 'EXPRESS' ? (
                  <Zap className="w-4 h-4 mb-1" />
                ) : (
                  <Clock className="w-4 h-4 mb-1" />
                )}
                <span className="text-[10px]">{level.label.split(' ')[0]}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Package Details */}
      <div className="p-4 bg-muted/40 rounded-md border border-border">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" /> Package Details
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1">COUNT</label>
            <Input type="number" {...register('packageCount', { valueAsNumber: true })} />
          </div>
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1">
              DEAD WEIGHT (KG)
            </label>
            <Input type="number" step="0.1" {...register('weightDead', { valueAsNumber: true })} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-1">
            DIMENSIONS (L x W x H) cm
          </label>
          <div className="grid grid-cols-3 gap-2">
            <Input type="number" placeholder="L" {...register('dimL', { valueAsNumber: true })} />
            <Input type="number" placeholder="W" {...register('dimW', { valueAsNumber: true })} />
            <Input type="number" placeholder="H" {...register('dimH', { valueAsNumber: true })} />
          </div>
        </div>
      </div>

      {/* Special Instructions (Tiptap) */}
      <div>
        <label className="block text-xs font-mono text-muted-foreground mb-1">
          SPECIAL INSTRUCTIONS
        </label>
        <Controller
          name="specialInstructions"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              content={field.value}
              onChange={field.onChange}
              placeholder="Add handling instructions, branding notes, etc."
              minHeight="100px"
              maxHeight="200px"
              toolbarVariant="minimal"
            />
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
  );
};
