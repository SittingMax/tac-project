import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, Truck, Plane, Zap, Clock } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { FormSection, FormGrid, FormFooter, FieldGroup } from '@/components/ui-core';
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
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <FormSection title="Routing, Shipper & Service">
          <FormGrid columns={2}>
            <FormField
              control={form.control}
              name="originHub"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FieldGroup label="Origin Hub">
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full h-8 bg-transparent hover:border-ring/50 transition-colors">
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
                    </FieldGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destinationHub"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FieldGroup label="Destination Hub">
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full h-8 bg-transparent hover:border-ring/50 transition-colors">
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
                    </FieldGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Customer in full width row */}
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FieldGroup label="Customer / Shipper">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full h-8 bg-transparent hover:border-ring/50 transition-colors">
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
                      </FieldGroup>
                    </FormControl>
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

            <FormField
              control={form.control}
              name="mode"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FieldGroup label="Transport Mode">
                      <div className="flex bg-muted/30 p-1 border border-input rounded-md h-8">
                        {SHIPMENT_MODES.map((mode) => (
                          <label
                            key={mode.id}
                            className={`flex-1 cursor-pointer flex items-center justify-center text-[10px] font-medium rounded-sm transition
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
                              <Plane size={14} strokeWidth={1.5} className="mr-1.5" />
                            ) : (
                              <Truck size={14} strokeWidth={1.5} className="mr-1.5" />
                            )}
                            {mode.label}
                          </label>
                        ))}
                      </div>
                    </FieldGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serviceLevel"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FieldGroup label="Service Level">
                      <div className="flex bg-muted/30 p-1 border border-input rounded-md h-8">
                        {SERVICE_LEVELS.map((level) => (
                          <label
                            key={level.id}
                            className={`flex-1 cursor-pointer flex items-center justify-center text-[10px] font-medium rounded-sm transition
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
                              <Zap size={14} strokeWidth={1.5} className="mr-1.5" />
                            ) : (
                              <Clock size={14} strokeWidth={1.5} className="mr-1.5" />
                            )}
                            {level.label.split(' ')[0]}
                          </label>
                        ))}
                      </div>
                    </FieldGroup>
                  </FormControl>
                </FormItem>
              )}
            />
          </FormGrid>
        </FormSection>

        <FormSection title="Consignee Details" icon={Package}>
          <FormGrid columns={2}>
            <FormField
              control={form.control}
              name="consigneeName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FieldGroup label="Name">
                      <Input
                        className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                        {...field}
                      />
                    </FieldGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="consigneePhone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FieldGroup label="Phone">
                      <Input
                        className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                        {...field}
                      />
                    </FieldGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="consigneeAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FieldGroup label="Delivery Address">
                        <Input
                          className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                          {...field}
                        />
                      </FieldGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="consigneeCity"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FieldGroup label="Destination City">
                      <Input
                        className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                        {...field}
                      />
                    </FieldGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="consigneeState"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FieldGroup label="Destination State">
                      <Input
                        className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                        {...field}
                      />
                    </FieldGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="consigneeZip"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FieldGroup label="Destination Zip">
                        <Input
                          className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                          {...field}
                        />
                      </FieldGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title="Package Specification" icon={Package}>
          <FormGrid columns={2}>
            <FormField
              control={form.control}
              name="packageCount"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FieldGroup label="Total Pieces">
                      <Input
                        className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FieldGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weightDead"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FieldGroup label="Dead Weight (KG)">
                      <Input
                        className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FieldGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="md:col-span-2">
              <FieldGroup label="Package Dimensions (L × W × H in cm)">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="dimL"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                            type="number"
                            placeholder="Length"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                          />
                        </FormControl>
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
                            className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                            type="number"
                            placeholder="Width"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                          />
                        </FormControl>
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
                            className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                            type="number"
                            placeholder="Height"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </FieldGroup>
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title="Additional Information">
          <FormGrid columns={1}>
            <FormField
              control={form.control}
              name="specialInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FieldGroup label="Special Instructions & Branding Notes">
                      <RichTextEditor
                        content={field.value}
                        onChange={field.onChange}
                        placeholder="Add handling instructions, branding notes, etc."
                        minHeight="100px"
                        maxHeight="200px"
                        toolbarVariant="minimal"
                      />
                    </FieldGroup>
                  </FormControl>
                </FormItem>
              )}
            />
          </FormGrid>
        </FormSection>

        <FormFooter
          onCancel={onCancel}
          submitLabel="Create Shipment"
          isLoading={createShipmentMutation.isPending}
        />
      </form>
    </Form>
  );
};
