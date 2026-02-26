import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { InvoiceFormData } from '@/hooks/useMultiStepInvoice';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, MapPin } from 'lucide-react';
import { SectionHeader, CustomerSearch } from './shared';
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

    const [, setConsignorCityMode] = useState<'SELECT' | 'INPUT'>('SELECT');
    const [, setConsigneeCityMode] = useState<'SELECT' | 'INPUT'>('SELECT');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
            {/* Consignor */}
            <div className="space-y-4 border rounded-none p-4 bg-muted/30">
                <SectionHeader
                    icon={User}
                    title="Consignor"
                    action={
                        <div className="w-32">
                            <CustomerSearch
                                customers={customers}
                                onSelect={(c) => fillCustomerData(c, 'CONSIGNOR')}
                            />
                        </div>
                    }
                />
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Input placeholder="Company / Full Name" {...form.register('consignorName')} />
                        {errors.consignorName && (
                            <span className="text-xs text-destructive">{errors.consignorName.message}</span>
                        )}
                    </div>
                    <Input {...form.register('consignorPhone')} placeholder="Phone Number" />
                    <Input placeholder="Address Line" {...form.register('consignorAddress')} />
                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            value={POPULAR_CITIES.includes(watch('consignorCity')) ? watch('consignorCity') : 'OTHER'}
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
                            <SelectTrigger className="h-10 bg-background">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {POPULAR_CITIES.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                                <SelectItem value="OTHER">Other...</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input placeholder="Zip Code" {...form.register('consignorZip')} maxLength={6} />
                    </div>
                </div>
            </div>

            {/* Consignee */}
            <div className="space-y-4 border rounded-none p-4 bg-muted/30">
                <SectionHeader
                    icon={MapPin}
                    title="Consignee"
                    action={
                        <div className="w-32">
                            <CustomerSearch
                                customers={customers}
                                onSelect={(c) => fillCustomerData(c, 'CONSIGNEE')}
                            />
                        </div>
                    }
                />
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Input placeholder="Company / Full Name" {...form.register('consigneeName')} />
                        {errors.consigneeName && (
                            <span className="text-xs text-destructive">{errors.consigneeName.message}</span>
                        )}
                    </div>
                    <Input {...form.register('consigneePhone')} placeholder="Phone Number" />
                    <Input placeholder="Address Line" {...form.register('consigneeAddress')} />
                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            value={POPULAR_CITIES.includes(watch('consigneeCity')) ? watch('consigneeCity') : 'OTHER'}
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
                            <SelectTrigger className="h-10 bg-background">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {POPULAR_CITIES.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                                <SelectItem value="OTHER">Other...</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input placeholder="Zip Code" {...form.register('consigneeZip')} maxLength={6} />
                    </div>
                </div>
            </div>
        </div>
    );
};
