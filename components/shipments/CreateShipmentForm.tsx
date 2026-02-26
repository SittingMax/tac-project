import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { HUBS, SHIPMENT_MODES, SERVICE_LEVELS } from '../../lib/constants';

import { Package, Truck, Plane, Zap, Clock } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { useCreateShipment } from '@/hooks/useShipments';
import { toast } from 'sonner';

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

import { Controller } from 'react-hook-form';
import { RichTextEditor } from '../ui/rich-text-editor';

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
      specialInstructions: '',
    },
  });

  const selectedMode = watch('mode');
  const selectedService = watch('serviceLevel');

  const onSubmit = async (data: FormData) => {
    // eslint-disable-next-line no-console
    console.debug('Submitting CreateShipmentForm', data);
    if (customers.length === 0) {
      toast.error('Unable to load customers. Please check your connection.');
      return;
    }

    // Volumetric Calculation (Standard L*W*H / 5000 for Air)
    const divisor = data.mode === 'AIR' ? 5000 : 4000;
    const volWeight = (data.dimL * data.dimW * data.dimH) / divisor;
    const chargeable = Math.max(data.weightDead, volWeight);

    try {
      await createShipmentMutation.mutateAsync({
        customer_id: data.customerId,
        origin_hub_id: HUB_IDS[data.originHub],
        destination_hub_id: HUB_IDS[data.destinationHub],
        mode: data.mode,
        service_level: data.serviceLevel,
        package_count: data.packageCount,
        total_weight: parseFloat(chargeable.toFixed(2)),
        // Required DB fields not in form yet:
        consignee_name: 'Walk-in Customer',
        consignee_phone: '9999999999',
        consignee_address: { line1: 'TBD', city: 'TBD' },
        special_instructions:
          data.specialInstructions || `Dims: ${data.dimL}x${data.dimW}x${data.dimH}`,
      });

      toast.success('Shipment created successfully');
      // Delay onSuccess to allow toast to render and prevent race conditions on unmount
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (e) {
      console.error(e);
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
            className="w-full bg-background border border-input rounded-none px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
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
            className="w-full bg-background border border-input rounded-none px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
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
          className="w-full bg-background border border-input rounded-none px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
        >
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName || c.name}
            </option>
          ))}
        </select>
        {errors.customerId && (
          <span className="text-destructive text-xs">{errors.customerId.message}</span>
        )}
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
                                cursor-pointer border rounded-none p-2 flex flex-col items-center justify-center text-xs transition-all text-center
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
                                cursor-pointer border rounded-none p-2 flex flex-col items-center justify-center text-xs transition-all text-center
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
      <div className="p-4 bg-muted/40 rounded-none border border-border">
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

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
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
