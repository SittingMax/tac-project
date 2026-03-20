import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { InvoiceFormData } from '@/hooks/useMultiStepInvoice';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { User, MapPin } from 'lucide-react';
import { CustomerSearch } from './shared';
import { FormSection, FormGrid } from '@/components/ui-core';
import { Customer as CustomerDB } from '@/hooks/useCustomers';
import { POPULAR_CITIES, HUB_PREFILL } from '@/lib/constants';

interface Props {
  form: UseFormReturn<InvoiceFormData>;
  customers: CustomerDB[];
  fillCustomerData: (customer: CustomerDB, type: 'CONSIGNOR' | 'CONSIGNEE') => void;
}

export const PartiesStep = ({ form, customers, fillCustomerData }: Props) => {
  const { watch, setValue } = form;
  const errors = form.formState.errors;

  const [consignorCityMode, setConsignorCityMode] = useState<'SELECT' | 'INPUT'>('SELECT');
  const [consigneeCityMode, setConsigneeCityMode] = useState<'SELECT' | 'INPUT'>('SELECT');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
      {/* Consignor */}
      <FormSection
        icon={User}
        title="Consignor"
        action={
          <div className="w-48">
            <CustomerSearch
              customers={customers}
              onSelect={(c) => fillCustomerData(c, 'CONSIGNOR')}
            />
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              className="h-11 bg-transparent hover:border-ring/50"
              placeholder="Company / Full Name"
              {...form.register('consignorName')}
            />
            {errors.consignorName && (
              <span className="text-xs text-destructive">{errors.consignorName.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Input
              className="h-11 bg-transparent hover:border-ring/50"
              placeholder="Contact Person"
              {...form.register('consignorContact')}
            />
          </div>
          <Input
            className="h-11 bg-transparent hover:border-ring/50"
            {...form.register('consignorPhone')}
            placeholder="Phone Number"
          />
          <Input
            className="h-11 bg-transparent hover:border-ring/50"
            placeholder="Address Line"
            {...form.register('consignorAddress')}
          />
          <FormGrid columns={2}>
            <div className="space-y-1.5 flex flex-col justify-end">
              <div className="flex justify-between items-center mb-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  City
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setConsignorCityMode((prev) => (prev === 'SELECT' ? 'INPUT' : 'SELECT'));
                    setValue('consignorCity', '');
                  }}
                  className="text-[10px] text-primary hover:underline font-medium"
                >
                  {consignorCityMode === 'SELECT' ? 'Manual Entry' : 'Select City'}
                </button>
              </div>
              {consignorCityMode === 'SELECT' ? (
                <Select
                  value={
                    POPULAR_CITIES.includes(watch('consignorCity'))
                      ? watch('consignorCity')
                      : 'OTHER'
                  }
                  onValueChange={(city) => {
                    if (city === 'OTHER') {
                      setConsignorCityMode('INPUT');
                      setValue('consignorCity', '');
                    } else {
                      setValue('consignorCity', city);
                      const hub = HUB_PREFILL[city];
                      if (hub) {
                        setValue('consignorAddress', hub.address, { shouldValidate: true });
                        setValue('consignorZip', hub.zip, { shouldValidate: true });
                        setValue('consignorState', hub.state, { shouldValidate: true });
                      }
                    }
                  }}
                >
                  <SelectTrigger className="h-11 bg-transparent hover:border-ring/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                    <SelectItem value="OTHER">Other...</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-11 bg-transparent hover:border-ring/50"
                  placeholder="City"
                  {...form.register('consignorCity')}
                />
              )}
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Zip Code
              </Label>
              <Input
                placeholder="Zip Code"
                {...form.register('consignorZip')}
                maxLength={6}
                className="h-11 bg-transparent hover:border-ring/50"
              />
            </div>
          </FormGrid>
        </div>
      </FormSection>

      {/* Consignee */}
      <FormSection
        icon={MapPin}
        title="Consignee"
        action={
          <div className="w-48">
            <CustomerSearch
              customers={customers}
              onSelect={(c) => fillCustomerData(c, 'CONSIGNEE')}
            />
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              className="h-11 bg-transparent hover:border-ring/50"
              placeholder="Company / Full Name"
              {...form.register('consigneeName')}
            />
            {errors.consigneeName && (
              <span className="text-xs text-destructive">{errors.consigneeName.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Input
              className="h-11 bg-transparent hover:border-ring/50"
              placeholder="Contact Person"
              {...form.register('consigneeContact')}
            />
          </div>
          <Input
            className="h-11 bg-transparent hover:border-ring/50"
            {...form.register('consigneePhone')}
            placeholder="Phone Number"
          />
          <Input
            className="h-11 bg-transparent hover:border-ring/50"
            placeholder="Address Line"
            {...form.register('consigneeAddress')}
          />
          <FormGrid columns={2}>
            <div className="space-y-1.5 flex flex-col justify-end">
              <div className="flex justify-between items-center mb-1">
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  City
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setConsigneeCityMode((prev) => (prev === 'SELECT' ? 'INPUT' : 'SELECT'));
                    setValue('consigneeCity', '');
                  }}
                  className="text-[10px] text-primary hover:underline font-medium"
                >
                  {consigneeCityMode === 'SELECT' ? 'Manual Entry' : 'Select City'}
                </button>
              </div>
              {consigneeCityMode === 'SELECT' ? (
                <Select
                  value={
                    POPULAR_CITIES.includes(watch('consigneeCity'))
                      ? watch('consigneeCity')
                      : 'OTHER'
                  }
                  onValueChange={(city) => {
                    if (city === 'OTHER') {
                      setConsigneeCityMode('INPUT');
                      setValue('consigneeCity', '');
                    } else {
                      setValue('consigneeCity', city);
                      const hub = HUB_PREFILL[city];
                      if (hub) {
                        setValue('consigneeAddress', hub.address, { shouldValidate: true });
                        setValue('consigneeZip', hub.zip, { shouldValidate: true });
                        setValue('consigneeState', hub.state, { shouldValidate: true });
                      }
                    }
                  }}
                >
                  <SelectTrigger className="h-11 bg-transparent hover:border-ring/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                    <SelectItem value="OTHER">Other...</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-11 bg-transparent hover:border-ring/50"
                  placeholder="City"
                  {...form.register('consigneeCity')}
                />
              )}
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Zip Code
              </Label>
              <Input
                placeholder="Zip Code"
                {...form.register('consigneeZip')}
                maxLength={6}
                className="h-11 bg-transparent hover:border-ring/50"
              />
            </div>
          </FormGrid>
        </div>
      </FormSection>
    </div>
  );
};
