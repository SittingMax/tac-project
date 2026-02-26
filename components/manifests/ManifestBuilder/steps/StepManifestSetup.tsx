import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plane, Truck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { HubOption } from '../manifest-builder.types';

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
    etdHour: z.string().optional(),
    etdMinute: z.string().optional(),
    etdPeriod: z.enum(['AM', 'PM']).optional(),
    etaHour: z.string().optional(),
    etaMinute: z.string().optional(),
    etaPeriod: z.enum(['AM', 'PM']).optional(),
    // TRUCK fields
    vehicleNumber: z.string().optional(),
    driverName: z.string().optional(),
    driverPhone: z.string().optional(),
    dispatchDate: z.date().optional(),
    dispatchHour: z.string().optional(),
    dispatchMinute: z.string().optional(),
    dispatchPeriod: z.enum(['AM', 'PM']).optional(),
    truckEtaHour: z.string().optional(),
    truckEtaMinute: z.string().optional(),
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

interface StepManifestSetupProps {
  hubs: HubOption[];
  data: ManifestSettingsValues;
  onDataChange: (data: ManifestSettingsValues) => void;
  isValid: boolean;
  onValidationChange: (isValid: boolean) => void;
}

const minutes = ['00', '15', '30', '45'];
const hours12 = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const periods = ['AM', 'PM'] as const;

export function StepManifestSetup({
  hubs,
  data,
  onDataChange,
  onValidationChange,
}: StepManifestSetupProps) {
  const form = useForm<ManifestSettingsValues>({
    resolver: zodResolver(manifestSettingsSchema),
    defaultValues: data,
    mode: 'onChange',
  });

  // Sync form state with parent and validate manually
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      if (value) {
        onDataChange(value as ManifestSettingsValues);
        // Manually validate against schema to ensure reliability
        const result = manifestSettingsSchema.safeParse(value);
        onValidationChange(result.success);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onDataChange, onValidationChange]);

  // Initial validation check on mount
  React.useEffect(() => {
    const result = manifestSettingsSchema.safeParse(form.getValues());
    onValidationChange(result.success);
  }, [form, onValidationChange]);

  const transportType = form.watch('type');
  const fromHub = hubs.find((h) => h.id === form.watch('fromHubId'));
  const toHub = hubs.find((h) => h.id === form.watch('toHubId'));

  return (
    <div className="flex flex-col gap-5">
      {/* Section 1: Route & Transport */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Route Selection */}
        <Card className="border-border bg-card/50 xl:col-span-7">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Route Selection</CardTitle>
            <CardDescription>Define origin and destination hubs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>
                  Origin Hub <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.watch('fromHubId') ?? ''}
                  onValueChange={(val) =>
                    form.setValue('fromHubId', val, {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
                    })
                  }
                >
                  <SelectTrigger
                    className={cn(form.formState.errors.fromHubId && 'border-destructive')}
                  >
                    <SelectValue placeholder="Select origin">
                      {fromHub ? `${fromHub.name} (${fromHub.code})` : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {hubs.map((hub) => (
                      <SelectItem key={hub.id} value={hub.id}>
                        {hub.name} ({hub.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>
                  Destination Hub <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.watch('toHubId') ?? ''}
                  onValueChange={(val) =>
                    form.setValue('toHubId', val, {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
                    })
                  }
                >
                  <SelectTrigger
                    className={cn(form.formState.errors.toHubId && 'border-destructive')}
                  >
                    <SelectValue placeholder="Select destination">
                      {toHub ? `${toHub.name} (${toHub.code})` : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {hubs
                      .filter((h) => h.id !== form.watch('fromHubId'))
                      .map((hub) => (
                        <SelectItem key={hub.id} value={hub.id}>
                          {hub.name} ({hub.code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transport Mode */}
        <Card className="border-border bg-card/50 xl:col-span-5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Transport Mode</CardTitle>
            <CardDescription>Select transport type</CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleGroup
              type="single"
              value={transportType}
              onValueChange={(value) => {
                if (value)
                  form.setValue('type', value as 'AIR' | 'TRUCK', {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  });
              }}
              className="flex gap-3"
            >
              <ToggleGroupItem
                value="AIR"
                className={cn(
                  'flex-1 h-[72px] flex flex-col items-center justify-center gap-1.5 border border-border rounded-none transition-all',
                  'data-[state=on]:bg-feature-air/20 data-[state=on]:text-feature-air data-[state=on]:border-feature-air/50',
                  transportType === 'AIR' && 'ring-2 ring-feature-air/30'
                )}
              >
                <Plane className="h-5 w-5" />
                <span className="text-sm font-medium">Air Cargo</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="TRUCK"
                className={cn(
                  'flex-1 h-[72px] flex flex-col items-center justify-center gap-1.5 border border-border rounded-none transition-all',
                  'data-[state=on]:bg-feature-ground/20 data-[state=on]:text-feature-ground data-[state=on]:border-feature-ground/50',
                  transportType === 'TRUCK' && 'ring-2 ring-feature-ground/30'
                )}
              >
                <Truck className="h-5 w-5" />
                <span className="text-sm font-medium">Truck</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Details */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Schedule (Only for TRUCK) */}
        {transportType === 'TRUCK' && (
          <Card className="border-border bg-card/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Dispatch Schedule</CardTitle>
              <CardDescription>Set dispatch date and time</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Dispatch Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal h-10',
                          !form.watch('dispatchDate') && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {form.watch('dispatchDate')
                            ? format(form.watch('dispatchDate')!, 'MMM d, yyyy')
                            : 'Pick a date'}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.watch('dispatchDate')}
                        onSelect={(date) => form.setValue('dispatchDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Dispatch Time</Label>
                  <div className="flex gap-2">
                    <Select
                      value={form.watch('dispatchHour') ?? ''}
                      onValueChange={(v) =>
                        form.setValue('dispatchHour', v, { shouldDirty: true, shouldTouch: true })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="HH" />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {hours12.map((hour) => (
                          <SelectItem key={hour} value={hour}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={form.watch('dispatchMinute') ?? ''}
                      onValueChange={(v) =>
                        form.setValue('dispatchMinute', v, { shouldDirty: true, shouldTouch: true })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {minutes.map((min) => (
                          <SelectItem key={min} value={min}>
                            {min}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={form.watch('dispatchPeriod') ?? ''}
                      onValueChange={(v) =>
                        form.setValue('dispatchPeriod', v as 'AM' | 'PM', {
                          shouldDirty: true,
                          shouldTouch: true,
                        })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="AM" />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {periods.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transport Details */}
        <Card
          className={cn('border-border bg-card/50', transportType === 'AIR' ? 'xl:col-span-2' : '')}
        >
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">
              {transportType === 'AIR' ? 'Flight Details' : 'Vehicle Details'}
            </CardTitle>
            <CardDescription>
              {transportType === 'AIR'
                ? 'Enter airline and flight information'
                : 'Enter vehicle and driver information'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {transportType === 'AIR' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Airline Code</Label>
                    <Input
                      placeholder="AA"
                      {...form.register('airlineCode')}
                      className="uppercase font-mono"
                      maxLength={3}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>
                      Flight Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="1234"
                      {...form.register('flightNumber')}
                      className={cn(
                        'font-mono',
                        form.formState.errors.flightNumber && 'border-destructive'
                      )}
                    />
                    {form.formState.errors.flightNumber && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.flightNumber.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Flight Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal h-10',
                            !form.watch('flightDate') && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {form.watch('flightDate')
                              ? format(form.watch('flightDate')!, 'MMM d, yyyy')
                              : 'Pick a date'}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.watch('flightDate')}
                          onSelect={(date) => form.setValue('flightDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>ETD</Label>
                    <div className="flex gap-2">
                      <Select
                        value={form.watch('etdHour') ?? ''}
                        onValueChange={(v) =>
                          form.setValue('etdHour', v, { shouldDirty: true, shouldTouch: true })
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="HH" />
                        </SelectTrigger>
                        <SelectContent side="top">
                          {hours12.map((hour) => (
                            <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={form.watch('etdMinute') ?? ''}
                        onValueChange={(v) =>
                          form.setValue('etdMinute', v, { shouldDirty: true, shouldTouch: true })
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent side="top">
                          {minutes.map((min) => (
                            <SelectItem key={min} value={min}>
                              {min}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={form.watch('etdPeriod') ?? ''}
                        onValueChange={(v) =>
                          form.setValue('etdPeriod', v as 'AM' | 'PM', {
                            shouldDirty: true,
                            shouldTouch: true,
                          })
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="AM" />
                        </SelectTrigger>
                        <SelectContent side="top">
                          {periods.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>ETA</Label>
                    <div className="flex gap-2">
                      <Select
                        value={form.watch('etaHour') ?? ''}
                        onValueChange={(v) =>
                          form.setValue('etaHour', v, { shouldDirty: true, shouldTouch: true })
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="HH" />
                        </SelectTrigger>
                        <SelectContent side="top">
                          {hours12.map((hour) => (
                            <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={form.watch('etaMinute') ?? ''}
                        onValueChange={(v) =>
                          form.setValue('etaMinute', v, { shouldDirty: true, shouldTouch: true })
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent side="top">
                          {minutes.map((min) => (
                            <SelectItem key={min} value={min}>
                              {min}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={form.watch('etaPeriod') ?? ''}
                        onValueChange={(v) =>
                          form.setValue('etaPeriod', v as 'AM' | 'PM', {
                            shouldDirty: true,
                            shouldTouch: true,
                          })
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="AM" />
                        </SelectTrigger>
                        <SelectContent side="top">
                          {periods.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <Label>
                    Vehicle Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="TX-1234-AB"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Driver Name</Label>
                    <Input placeholder="John Smith" {...form.register('driverName')} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Driver Phone</Label>
                    <Input placeholder="+1 555-0123" {...form.register('driverPhone')} />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
