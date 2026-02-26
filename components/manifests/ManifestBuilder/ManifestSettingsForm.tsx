'use client';

/**
 * ManifestSettingsForm Component
 * Enterprise manifest settings form for AIR/TRUCK manifests
 *
 * Fields:
 * - Origin/Destination hub (required)
 * - Transport type: AIR / TRUCK
 * - AIR: Airline code, Flight no, Flight date, ETD/ETA
 * - TRUCK: Vehicle no, Driver name, Driver phone, Dispatch datetime
 * - Operational scan rules
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plane, Truck, Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { DatePicker, DateTimePicker, TimePicker } from '@/components/ui/date-time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CreateManifestParams } from '@/lib/services/manifestService';
import type { HubOption, ManifestRules } from './manifest-builder.types';

// Zod schema for manifest settings with transport-type validation
const manifestSettingsSchema = z
  .object({
    fromHubId: z.string().min(1, 'Origin hub is required'),
    toHubId: z.string().min(1, 'Destination hub is required'),
    type: z.enum(['AIR', 'TRUCK']),
    // AIR fields
    airlineCode: z.string().optional(),
    flightNumber: z.string().optional(),
    flightDate: z.date().optional(),
    etd: z.string().optional(),
    eta: z.string().optional(),
    // TRUCK fields
    vehicleNumber: z.string().optional(),
    driverName: z.string().optional(),
    driverPhone: z.string().optional(),
    dispatchAt: z.date().optional(),
    // Rules
    onlyReady: z.boolean().default(true),
    matchDestination: z.boolean().default(true),
    excludeCod: z.boolean().default(false),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Validate AIR required fields
    if (data.type === 'AIR' && (!data.flightNumber || data.flightNumber.trim().length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['flightNumber'],
        message: 'Flight number is required for AIR manifest',
      });
    }
    // Validate TRUCK required fields
    if (data.type === 'TRUCK' && (!data.vehicleNumber || data.vehicleNumber.trim().length < 4)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['vehicleNumber'],
        message: 'Vehicle number is required for TRUCK manifest',
      });
    }
    // Validate different hubs
    if (data.fromHubId === data.toHubId && data.fromHubId !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['toHubId'],
        message: 'Destination must differ from origin',
      });
    }
  });

export type ManifestSettingsValues = z.infer<typeof manifestSettingsSchema>;

interface ManifestSettingsFormProps {
  hubs: HubOption[];
  defaultValues?: Partial<ManifestSettingsValues>;
  onSubmit: (values: CreateManifestParams & { rules: ManifestRules }) => void;
  isSubmitting?: boolean;
  className?: string;
}

export function ManifestSettingsForm({
  hubs,
  defaultValues,
  onSubmit,
  isSubmitting = false,
  className,
}: ManifestSettingsFormProps) {
  const form = useForm<ManifestSettingsValues>({
    resolver: zodResolver(manifestSettingsSchema),
    defaultValues: {
      fromHubId: '',
      toHubId: '',
      type: 'AIR',
      onlyReady: true,
      matchDestination: true,
      excludeCod: false,
      ...defaultValues,
    },
    mode: 'onChange',
  });

  const transportType = form.watch('type');
  const watchedValues = form.watch();

  // Helper to combine date and time string into ISO timestamp
  const combineDateTime = (
    date: Date | undefined,
    timeStr: string | undefined
  ): string | undefined => {
    if (!timeStr) return undefined;
    const baseDate = date ? new Date(date) : new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    baseDate.setHours(hours, minutes, 0, 0);
    return baseDate.toISOString();
  };

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit({
      fromHubId: values.fromHubId,
      toHubId: values.toHubId,
      type: values.type,
      airlineCode: values.airlineCode,
      flightNumber: values.flightNumber,
      flightDate: values.flightDate?.toISOString().split('T')[0],
      etd: combineDateTime(values.flightDate, values.etd),
      eta: combineDateTime(values.flightDate, values.eta),
      vehicleNumber: values.vehicleNumber,
      driverName: values.driverName,
      driverPhone: values.driverPhone,
      dispatchAt: values.dispatchAt?.toISOString(),
      notes: values.notes,
      rules: {
        onlyReady: values.onlyReady,
        matchDestination: values.matchDestination,
        excludeCod: values.excludeCod,
      },
    });
  });

  return (
    <Card className={cn('rounded-none h-full', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm tracking-wide uppercase text-muted-foreground font-semibold">
          Manifest Settings
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Route Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Origin Hub <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watchedValues.fromHubId ?? ''}
                onValueChange={(val) => form.setValue('fromHubId', val, { shouldValidate: true })}
              >
                <SelectTrigger
                  className={cn(form.formState.errors.fromHubId && 'border-destructive')}
                >
                  <SelectValue placeholder="Select origin" />
                </SelectTrigger>
                <SelectContent>
                  {hubs.map((hub) => (
                    <SelectItem key={hub.id} value={hub.id}>
                      {hub.name} ({hub.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.fromHubId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.fromHubId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Destination Hub <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watchedValues.toHubId ?? ''}
                onValueChange={(val) => form.setValue('toHubId', val, { shouldValidate: true })}
              >
                <SelectTrigger
                  className={cn(form.formState.errors.toHubId && 'border-destructive')}
                >
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {hubs
                    .filter((h) => h.id !== watchedValues.fromHubId)
                    .map((hub) => (
                      <SelectItem key={hub.id} value={hub.id}>
                        {hub.name} ({hub.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {form.formState.errors.toHubId && (
                <p className="text-xs text-destructive">{form.formState.errors.toHubId.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Transport Type Toggle */}
          <div className="space-y-3">
            <Label>Transport Type</Label>
            <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-none">
              <Button
                type="button"
                variant={transportType === 'AIR' ? 'default' : 'ghost'}
                className={cn(
                  'rounded-none',
                  transportType === 'AIR' ? 'shadow-md' : 'hover:bg-background/50'
                )}
                onClick={() => form.setValue('type', 'AIR', { shouldValidate: true })}
              >
                <Plane className="h-4 w-4 mr-2" />
                Air
              </Button>
              <Button
                type="button"
                variant={transportType === 'TRUCK' ? 'default' : 'ghost'}
                className={cn(
                  'rounded-none',
                  transportType === 'TRUCK' ? 'shadow-md' : 'hover:bg-background/50'
                )}
                onClick={() => form.setValue('type', 'TRUCK', { shouldValidate: true })}
              >
                <Truck className="h-4 w-4 mr-2" />
                Truck
              </Button>
            </div>

            {/* AIR Transport Fields */}
            {transportType === 'AIR' && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Airline Code
                    </Label>
                    <Input
                      placeholder="e.g. 6E"
                      {...form.register('airlineCode')}
                      className="uppercase font-mono"
                      maxLength={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Flight No <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. 6055"
                      {...form.register('flightNumber')}
                      className={cn(
                        'font-mono',
                        form.formState.errors.flightNumber && 'border-destructive'
                      )}
                    />
                  </div>
                </div>
                {form.formState.errors.flightNumber && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.flightNumber.message}
                  </p>
                )}

                {/* Flight Date Picker */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Flight Date
                  </Label>
                  <DatePicker
                    value={watchedValues.flightDate}
                    onChange={(date) => form.setValue('flightDate', date)}
                    placeholder="Pick a date"
                    minDate={new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </div>

                {/* ETD / ETA Time Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      ETD
                    </Label>
                    <TimePicker
                      value={watchedValues.etd}
                      onChange={(time) => form.setValue('etd', time)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      ETA
                    </Label>
                    <TimePicker
                      value={watchedValues.eta}
                      onChange={(time) => form.setValue('eta', time)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TRUCK Transport Fields */}
            {transportType === 'TRUCK' && (
              <div className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Vehicle No <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. MN01AB1234"
                    {...form.register('vehicleNumber')}
                    className={cn(
                      'uppercase font-mono',
                      form.formState.errors.vehicleNumber && 'border-destructive'
                    )}
                  />
                  {form.formState.errors.vehicleNumber && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.vehicleNumber.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Driver Name
                    </Label>
                    <Input placeholder="Driver name" {...form.register('driverName')} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Driver Phone
                    </Label>
                    <Input
                      placeholder="Phone number"
                      {...form.register('driverPhone')}
                      type="tel"
                      className="font-mono"
                    />
                  </div>
                </div>

                {/* Dispatch DateTime */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Dispatch Date/Time
                  </Label>
                  <DateTimePicker
                    value={watchedValues.dispatchAt}
                    onChange={(date) => form.setValue('dispatchAt', date)}
                    placeholder="Pick date & time"
                    showTime={true}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Operational Scan Rules */}
          <div className="space-y-4">
            <Label className="text-xs uppercase text-muted-foreground font-semibold">
              Scan Rules
            </Label>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium">Only READY shipments</Label>
                <p className="text-xs text-muted-foreground">Hide HOLD / ineligible</p>
              </div>
              <Checkbox
                checked={watchedValues.onlyReady}
                onCheckedChange={(v) => form.setValue('onlyReady', !!v)}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium">Match destination</Label>
                <p className="text-xs text-muted-foreground">Validate shipment destination</p>
              </div>
              <Checkbox
                checked={watchedValues.matchDestination}
                onCheckedChange={(v) => form.setValue('matchDestination', !!v)}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium">Exclude COD</Label>
                <p className="text-xs text-muted-foreground">Skip COD shipments</p>
              </div>
              <Checkbox
                checked={watchedValues.excludeCod}
                onCheckedChange={(v) => form.setValue('excludeCod', !!v)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !form.formState.isValid}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Manifest'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default ManifestSettingsForm;
