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
  companyName: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(8, 'Phone must be at least 8 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  zip: z.string().min(4, 'Zip / Postal code is required'),
  tier: z.enum(['STANDARD', 'PRIORITY', 'ENTERPRISE']),
  gstin: z.string().optional(),
  credit_limit: z.number().min(0).optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

const defaultFormValues: CustomerFormValues = {
  type: 'BUSINESS',
  name: '',
  companyName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  tier: 'STANDARD',
  gstin: '',
  credit_limit: 0,
};

const normalizeCustomerAddressForForm = (customer: Customer | null) => {
  if (!customer || !customer.address) {
    return { line1: '', city: '', state: '', zip: '' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = customer.address as any;

  if (typeof raw === 'string') {
    return { line1: raw, city: '', state: '', zip: '' };
  }

  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { line1: '', city: '', state: '', zip: '' };
  }

  const line1 = (raw.line1 ?? raw.line_1 ?? raw.street ?? raw.address ?? '') as string;
  const city = (raw.city ?? '') as string;
  const state = (raw.state ?? '') as string;
  const zip = (raw.zip ??
    raw.postal_code ??
    raw.postalCode ??
    raw.pincode ??
    raw.pin ??
    '') as string;

  return {
    line1: line1.trim(),
    city: city.trim(),
    state: state.trim(),
    zip: zip.trim(),
  };
};

export const Customers: React.FC = () => {
  // Data fetching
  const { data: customers = [], isLoading } = useCustomers();
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  // Dialog state
  const [upsertOpen, setUpsertOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [activeRow, setActiveRow] = useState<Customer | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<Customer | null>(null);

  // Table columns with callbacks
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

  // Form default values for editing
  const formDefaultValues: CustomerFormValues = activeRow
    ? (() => {
      const normalized = normalizeCustomerAddressForForm(activeRow);
      return {
        type: activeRow.type as 'INDIVIDUAL' | 'BUSINESS' | 'CORPORATE',
        name: activeRow.name,
        companyName: activeRow.companyName ?? '',
        email: activeRow.email ?? '',
        phone: activeRow.phone,
        address: normalized.line1 || '',
        city: normalized.city || '',
        state: normalized.state || '',
        zip: normalized.zip || '',
        tier: (activeRow.tier as 'STANDARD' | 'PRIORITY' | 'ENTERPRISE') ?? 'STANDARD',
        gstin: activeRow.gstin ?? '',
        credit_limit: activeRow.credit_limit ?? 0,
      };
    })()
    : defaultFormValues;

  // Handlers
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
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-24">
      <div className="flex justify-between items-end border-b border-border/40 pb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground flex items-center gap-2.5">Client Roster<span className="text-primary">.</span></h1>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-2">Manage profiles and structured contracts</p>
        </div>
      </div>

      {/* Table with CRUD */}
      <CrudTable
        columns={columns}
        data={customers}
        searchKey="name"
        searchPlaceholder="Search customers..."
        isLoading={isLoading}
        emptyState={
          <EmptyCustomers
            onCreate={() => {
              setMode('create');
              setActiveRow(null);
              setUpsertOpen(true);
            }}
          />
        }
        emptyMessage="No customers found. Create your first customer to get started."
        toolbar={
          <Button
            onClick={() => {
              setMode('create');
              setActiveRow(null);
              setUpsertOpen(true);
            }}
            data-testid="add-customer-button"
            className="rounded-none font-mono text-xs uppercase tracking-widest px-8"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Client
          </Button>
        }
      />

      {/* Upsert Dialog */}
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
      >
        {(form) => (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
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

              <FormField
                control={form.control}
                name="tier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tier</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="STANDARD">Standard</SelectItem>
                        <SelectItem value="PRIORITY">Priority</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {(form.watch('type') === 'BUSINESS' || form.watch('type') === 'CORPORATE') && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Globex Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gstin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GSTIN</FormLabel>
                      <FormControl>
                        <Input placeholder="GST Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name (Contact)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Doe" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g. contact@domain.com" {...field} />
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +91 99999 88888" {...field} />
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
                  <FormLabel>Billing Address</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 123 Business Park" {...field} />
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
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. New Delhi" {...field} />
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
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Delhi" {...field} />
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
                    <FormLabel>Zip / Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 110003" {...field} />
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
                  <FormLabel>Credit Limit (₹)</FormLabel>
                  <FormControl>
                    <Input
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

      {/* Delete Confirmation Dialog */}
      <CrudDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete customer?"
        description={`This will remove "${rowToDelete?.name ?? ''}" from your customer directory. This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
};
