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
import { User, MapPin } from 'lucide-react';
import { CustomerSearch } from './shared';
import { FormSection, FormGrid, FieldGroup } from '@/components/ui-core';
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
        <div className="flex flex-col gap-3">
          <FieldGroup label="Company / Full Name" error={errors.consignorName?.message}>
            <Input
              className="h-8 bg-transparent hover:border-ring/50 px-3 text-sm"
              placeholder="Company / Full Name"
              {...form.register('consignorName')}
            />
          </FieldGroup>
          <FieldGroup label="Contact Person">
            <Input
              className="h-8 bg-transparent hover:border-ring/50 px-3 text-sm"
              placeholder="Contact Person"
              {...form.register('consignorContact')}
            />
          </FieldGroup>
          <FieldGroup label="Phone Number">
            <Input
              className="h-8 bg-transparent hover:border-ring/50 px-3 text-sm"
              {...form.register('consignorPhone')}
              placeholder="Phone Number"
            />
          </FieldGroup>
          <FieldGroup label="Address Line">
            <Input
              className="h-8 bg-transparent hover:border-ring/50 px-3 text-sm"
              placeholder="Address Line"
              {...form.register('consignorAddress')}
            />
          </FieldGroup>
          <FormGrid columns={2}>
            <FieldGroup
              label="City"
              action={
                <button
                  type="button"
                  onClick={() => {
                    setConsignorCityMode((prev) => (prev === 'SELECT' ? 'INPUT' : 'SELECT'));
                    setValue('consignorCity', '');
                  }}
                  className="text-[10px] text-primary hover:underline font-medium"
                >
                  {consignorCityMode === 'SELECT' ? 'Manual' : 'Select'}
                </button>
              }
            >
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
                  <SelectTrigger className="h-8 bg-transparent hover:border-ring/50 px-3 text-sm">
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
                  className="h-8 bg-transparent hover:border-ring/50 px-3 text-sm"
                  placeholder="City"
                  {...form.register('consignorCity')}
                />
              )}
            </FieldGroup>
            <FieldGroup label="Zip Code">
              <Input
                placeholder="Zip Code"
                {...form.register('consignorZip')}
                maxLength={6}
                className="h-8 bg-transparent hover:border-ring/50 px-3 text-sm"
              />
            </FieldGroup>
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
        <div className="flex flex-col gap-3">
          <FieldGroup label="Company / Full Name" error={errors.consigneeName?.message}>
            <Input
              className="h-8 bg-transparent hover:border-ring/50 px-3 text-sm"
              placeholder="Company / Full Name"
              {...form.register('consigneeName')}
            />
          </FieldGroup>
          <FieldGroup label="Contact Person">
            <Input
              className="h-8 bg-transparent hover:border-ring/50 px-3 text-sm"
              placeholder="Contact Person"
              {...form.register('consigneeContact')}
            />
          </FieldGroup>
          <FieldGroup label="Phone Number">
            <Input
              className="h-8 bg-transparent hover:border-ring/50 px-3 text-sm"
              {...form.register('consigneePhone')}
              placeholder="Phone Number"
            />
          </FieldGroup>
          <FieldGroup label="Address Line">
            <Input
              className="h-8 bg-transparent hover:border-ring/50 px-3 text-sm"
              placeholder="Address Line"
              {...form.register('consigneeAddress')}
            />
          </FieldGroup>
          <FormGrid columns={2}>
            <FieldGroup
              label="City"
              action={
                <button
                  type="button"
                  onClick={() => {
                    setConsigneeCityMode((prev) => (prev === 'SELECT' ? 'INPUT' : 'SELECT'));
                    setValue('consigneeCity', '');
                  }}
                  className="text-[10px] text-primary hover:underline font-medium"
                >
                  {consigneeCityMode === 'SELECT' ? 'Manual' : 'Select'}
                </button>
              }
            >
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
                  <SelectTrigger className="h-8 bg-transparent hover:border-ring/50 px-3 text-sm">
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
                  className="h-8 bg-transparent hover:border-ring/50 px-3 text-sm"
                  placeholder="City"
                  {...form.register('consigneeCity')}
                />
              )}
            </FieldGroup>
            <FieldGroup label="Zip Code">
              <Input
                placeholder="Zip Code"
                {...form.register('consigneeZip')}
                maxLength={6}
                className="h-8 bg-transparent hover:border-ring/50 px-3 text-sm"
              />
            </FieldGroup>
          </FormGrid>
        </div>
      </FormSection>
    </div>
  );
};
