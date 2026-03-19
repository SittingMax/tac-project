import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { z } from 'zod';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { EmptyCustomers } from '@/components/ui/empty-state';
import { PageContainer, PageHeader, SectionCard } from '@/components/ui-core/layout';

// CRUD Components
import { CrudTable } from '@/components/crud/CrudTable';
import { CrudUpsertDialog } from '@/components/crud/CrudUpsertDialog';
import { CrudDeleteDialog } from '@/components/crud/CrudDeleteDialog';

// Hooks & Data
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  Customer,
} from '@/hooks/useCustomers';
import { getCustomersColumns } from '@/components/customers/customers.columns';

// Schema
const customerFormSchema = z.object({
  type: z.enum(['INDIVIDUAL', 'BUSINESS', 'CORPORATE']),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(8, 'Phone must be at least 8 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  zip: z.string().min(4, 'Zip / Postal code is required'),
  gstin: z.string().optional(),
  credit_limit: z.number().min(0).optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

const defaultFormValues: CustomerFormValues = {
  type: 'BUSINESS',
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  gstin: '',
  credit_limit: 0,
};

const normalizeCustomerAddressForForm = (customer: Customer | null) => {
  if (!customer || !customer.address) {
    return { line1: '', city: '', state: '', zip: '' };
  }

  const raw = customer.address;
  const readAddressValue = (value: unknown) => (typeof value === 'string' ? value : '');

  if (typeof raw === 'string') return { line1: raw, city: '', state: '', zip: '' };
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
    return { line1: '', city: '', state: '', zip: '' };

  const address = raw as Record<string, unknown>;
  const line1 = readAddressValue(
    address.line1 ?? address.line_1 ?? address.street ?? address.address
  );
  const city = readAddressValue(address.city);
  const state = readAddressValue(address.state);
  const zip = readAddressValue(
    address.zip ?? address.postal_code ?? address.postalCode ?? address.pincode ?? address.pin
  );

  return { line1: line1.trim(), city: city.trim(), state: state.trim(), zip: zip.trim() };
};

export const Customers: React.FC = () => {
  const { data: customers = [], isLoading } = useCustomers();
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const [upsertOpen, setUpsertOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [activeRow, setActiveRow] = useState<Customer | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<Customer | null>(null);

  const openCreate = () => {
    setMode('create');
    setActiveRow(null);
    setUpsertOpen(true);
  };

  const columns = useMemo(
    () =>
      getCustomersColumns({
        onEdit: (row) => {
          setMode('edit');
          setActiveRow(row);
          setUpsertOpen(true);
        },
        onDelete: (row) => {
          setRowToDelete(row);
          setDeleteOpen(true);
        },
      }),
    []
  );

  const formDefaultValues: CustomerFormValues = activeRow
    ? (() => {
        const normalized = normalizeCustomerAddressForForm(activeRow);
        return {
          type: activeRow.type as 'INDIVIDUAL' | 'BUSINESS' | 'CORPORATE',
          name: activeRow.name,
          email: activeRow.email ?? '',
          phone: activeRow.phone,
          address: normalized.line1 || '',
          city: normalized.city || '',
          state: normalized.state || '',
          zip: normalized.zip || '',
          gstin: activeRow.gstin ?? '',
          credit_limit: activeRow.credit_limit ?? 0,
        };
      })()
    : defaultFormValues;

  const handleUpsert = async (values: CustomerFormValues) => {
    if (mode === 'create') {
      await createMutation.mutateAsync({
        customer_code: `CUST-${Date.now()}`,
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        gstin: values.gstin || undefined,
        type: values.type,
        address: {
          line1: values.address,
          city: values.city,
          state: values.state,
          postal_code: values.zip,
        },
        credit_limit: values.credit_limit ?? 0,
      });
    } else if (activeRow) {
      await updateMutation.mutateAsync({
        id: activeRow.id,
        data: {
          name: values.name,
          phone: values.phone,
          email: values.email || null,
          gstin: values.gstin || null,
          type: values.type,
          address: {
            line1: values.address,
            city: values.city,
            state: values.state,
            postal_code: values.zip,
          },
          credit_limit: values.credit_limit ?? activeRow.credit_limit,
        },
      });
    }
    setActiveRow(null);
  };

  const handleDelete = async () => {
    if (!rowToDelete) return;
    await deleteMutation.mutateAsync(rowToDelete.id);
    setRowToDelete(null);
  };

  return (
    <PageContainer>
      <PageHeader title="Customers" description="Manage customer profiles and billing details">
        <Button onClick={openCreate} data-testid="add-customer-button">
          <Plus data-icon="inline-start" /> Add Customer
        </Button>
      </PageHeader>

      <SectionCard>
        <CrudTable
          columns={columns}
          data={customers}
          isLoading={isLoading}
          searchKey="customers"
          searchPlaceholder="Search customers..."
          emptyState={<EmptyCustomers onCreate={openCreate} />}
          emptyMessage="No customers found. Create your first customer to get started."
        />
      </SectionCard>

      <CrudUpsertDialog
        open={upsertOpen}
        onOpenChange={setUpsertOpen}
        mode={mode}
        title={mode === 'create' ? 'Create Customer' : 'Edit Customer'}
        description={
          mode === 'create'
            ? 'Add a new customer to your directory.'
            : 'Update customer information.'
        }
        schema={customerFormSchema}
        defaultValues={formDefaultValues}
        onSubmit={handleUpsert}
        size="xl"
      >
        {(form) => (
          <div className="flex flex-col gap-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                      Type
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-8 px-3 text-sm bg-transparent hover:border-ring/50 transition-colors">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BUSINESS">Business</SelectItem>
                        <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                        <SelectItem value="CORPORATE">Corporate</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {(form.watch('type') === 'BUSINESS' || form.watch('type') === 'CORPORATE') && (
              <FormField
                control={form.control}
                name="gstin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                      GSTIN
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-8 px-3 text-sm bg-transparent hover:border-ring/50 transition-colors"
                        placeholder="GST Number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                    Customer Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-8 px-3 text-sm bg-transparent hover:border-ring/50 transition-colors"
                      placeholder="e.g. John Doe"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-8 px-3 text-sm bg-transparent hover:border-ring/50 transition-colors"
                        type="email"
                        placeholder="e.g. contact@domain.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                      Phone
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-8 px-3 text-sm bg-transparent hover:border-ring/50 transition-colors"
                        placeholder="e.g. +91 99999 88888"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                    Billing Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-8 px-3 text-sm bg-transparent hover:border-ring/50 transition-colors"
                      placeholder="e.g. 123 Business Park"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                      City
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-8 px-3 text-sm bg-transparent hover:border-ring/50 transition-colors"
                        placeholder="e.g. New Delhi"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                      State
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-8 px-3 text-sm bg-transparent hover:border-ring/50 transition-colors"
                        placeholder="e.g. Delhi"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                      Zip / Postal Code
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-8 px-3 text-sm bg-transparent hover:border-ring/50 transition-colors"
                        placeholder="e.g. 110003"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="credit_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono text-muted-foreground uppercase">
                    Credit Limit (₹)
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-8 px-3 text-sm bg-transparent hover:border-ring/50 transition-colors"
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </CrudUpsertDialog>

      <CrudDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete customer?"
        description={`This will remove "${rowToDelete?.name ?? ''}" from your customer directory. This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
};
