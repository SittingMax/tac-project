import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { getOrCreateDefaultOrg } from '../lib/org-helper';
import type { Json } from '../lib/database.types';

/**
 * Address structure for customers
 */
export interface CustomerAddress {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  [key: string]: string | undefined;
}

/**
 * Query key factory for customers.
 * Provides consistent, type-safe query keys for caching.
 */
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters?: { search?: string; limit?: number }) =>
    [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

export interface Customer {
  id: string;
  org_id: string;
  customer_code: string;
  name: string;
  phone: string;
  email: string | null;
  gstin: string | null;
  type: 'INDIVIDUAL' | 'BUSINESS' | 'CORPORATE';
  address: CustomerAddress | Json;
  billing_address: CustomerAddress | Json | null;
  credit_limit: number;
  created_at: string;
  updated_at: string;
  // Extended fields for CRUD display
  companyName?: string;
  tier?: 'STANDARD' | 'PRIORITY' | 'ENTERPRISE';
  activeContracts?: number;
  // Optional fields for invoice UI compatibility
  createdAt?: string;
  invoiceCount?: number;
  avgInvoiceValue?: number;
  preferences?: {
    preferredTransportMode?: 'AIR' | 'TRUCK';
    preferredPaymentMode?: string;
    gstApplicable?: boolean;
    typicalContents?: string;
  };
}

export function useCustomers(options?: { search?: string; limit?: number }) {
  return useQuery({
    queryKey: customerKeys.list(options),
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (options?.search) {
        query = query.or(`name.ilike.%${options.search}%,phone.ilike.%${options.search}%`);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Customer[];
    },
  });
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: customerKeys.detail(id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*').eq('id', id!).single();

      if (error) throw error;
      return data as Customer;
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customer: {
      customer_code: string;
      name: string;
      phone: string;
      email?: string;
      gstin?: string;
      type?: 'INDIVIDUAL' | 'BUSINESS' | 'CORPORATE';
      address: CustomerAddress | Json;
      billing_address?: CustomerAddress | Json;
      credit_limit?: number;
    }) => {
      const orgId = await getOrCreateDefaultOrg();

      const insertData = {
        ...customer,
        org_id: orgId,
        type: customer.type || 'INDIVIDUAL', // Must be uppercase: INDIVIDUAL, BUSINESS, or CORPORATE
      };

      // Type assertion needed due to Supabase client type inference limitations
      const { data, error } = await supabase.from('customers').insert(insertData).select().single();

      if (error) throw error;
      return data as Customer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast.success(`Customer ${data.name} created successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to create customer: ${error.message}`);
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Customer> }) => {
      // Extract only valid update fields
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      const allowedFields = [
        'name',
        'phone',
        'email',
        'gstin',
        'address',
        'billing_address',
        'credit_limit',
      ];
      for (const key of allowedFields) {
        if (key in data) {
          updateData[key] = data[key as keyof typeof data];
        }
      }

      // Type assertion needed due to Supabase client type inference limitations
      const { data: result, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as Customer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(data.id) });
      toast.success(`Customer ${data.name} updated successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to update customer: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a customer (soft delete via deleted_at).
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Type assertion needed due to Supabase client type inference limitations
      const { error } = await supabase
        .from('customers')
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
      toast.success('Customer deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete customer: ${error.message}`);
    },
  });
}
