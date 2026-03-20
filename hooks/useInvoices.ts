import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { InvoiceStatus } from '../types';

import type { Database } from '../lib/database.types';
import { useAuthStore } from '../store/authStore';

type Json = Database['public']['Tables']['invoices']['Row']['line_items'];

/**
 * Query key factory for invoices.
 * Provides consistent, type-safe query keys for caching.
 */
export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters?: { status?: string; customerId?: string }) =>
    [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
};

export interface InvoiceWithRelations {
  id: string;
  org_id: string;
  invoice_no: string; // DB column name (not invoice_number)
  customer_id: string;
  shipment_id: string | null;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED' | 'OVERDUE';
  issue_date: string | null;
  paid_at: string | null;
  subtotal: number;
  tax_amount: number | null; // DB column is tax_amount (number)
  discount: number | null;
  total: number; // DB column name (not total_amount)
  due_date: string | null;
  notes: string | null;
  line_items: Json;
  pdf_file_path: string | null;
  label_file_path: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  customer?: { name: string; phone: string; email: string | null };
  shipment?: { cn_number: string };
}

export function useInvoices(options?: { status?: string; customerId?: string }) {
  const orgId = useAuthStore((s) => s.user?.orgId);
  return useQuery({
    queryKey: invoiceKeys.list(options),
    queryFn: async () => {
      if (!orgId) return [];
      let query = supabase
        .from('invoices')
        .select(
          `
          *,
          customer:customers(name, phone, email),
          shipment:shipments(cn_number)
        `
        )
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.customerId) {
        query = query.eq('customer_id', options.customerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as InvoiceWithRelations[];
    },
    enabled: !!orgId,
  });
}

export function useInvoice(id: string | null) {
  const orgId = useAuthStore((s) => s.user?.orgId);
  return useQuery({
    queryKey: invoiceKeys.detail(id!),
    queryFn: async () => {
      if (!orgId) {
        throw new Error('No organization context available for invoice lookup.');
      }
      const { data, error } = await supabase
        .from('invoices')
        .select(
          `
          *,
          customer:customers(*),
          shipment:shipments(*)
        `
        )
        .eq('id', id!)
        .eq('org_id', orgId)
        .single();

      if (error) throw error;
      return data as unknown as InvoiceWithRelations;
    },
    enabled: !!id && !!orgId,
  });
}

/**
 * Query invoice by shipment CN Number.
 * Used when navigating from scanned shipment to invoice page.
 */
export function useInvoiceByAWB(awb: string | null) {
  const orgId = useAuthStore((s) => s.user?.orgId);
  return useQuery({
    queryKey: ['invoice', 'awb', awb, orgId],
    queryFn: async () => {
      // First get the shipment ID from AWB
      const { data: shipment, error: shipmentError } = await supabase
        .from('shipments')
        .select('id')
        .eq('cn_number', awb!)
        .eq('org_id', orgId!)
        .maybeSingle();

      if (shipmentError) throw shipmentError;
      if (!shipment) return null;

      // Then get the invoice for that shipment
      const { data, error } = await supabase
        .from('invoices')
        .select(
          `
          *,
          customer:customers(name, phone, email),
          shipment:shipments(cn_number)
        `
        )
        .eq('shipment_id', shipment.id)
        .eq('org_id', orgId!)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as InvoiceWithRelations | null;
    },
    enabled: !!awb && !!orgId,
  });
}

export interface CreateInvoiceInput {
  customer_id: string;
  shipment_id?: string;
  subtotal: number;
  tax_amount?: number; // DB column is tax_amount (number), not tax (jsonb)
  total: number; // DB column name
  issue_date?: string;
  due_date?: string;
  payment_terms?: string;
  notes?: string;
  line_items?: Json;
  discount?: number;
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.user?.orgId);

  return useMutation({
    mutationFn: async (invoice: CreateInvoiceInput) => {
      if (!orgId) {
        throw new Error('No organization context available for invoice creation.');
      }

      // invoice_no is generated by the database

      // Generate invoice number
      const { data: invoiceNo, error: invError } = await supabase.rpc('generate_invoice_number', {
        p_org_id: orgId,
      });
      if (invError) throw invError;
      if (!invoiceNo) throw new Error('Failed to generate invoice number');

      const { data, error } = await supabase
        .from('invoices')
        .insert({
          invoice_no: invoiceNo,
          org_id: orgId,
          customer_id: invoice.customer_id,
          shipment_id: invoice.shipment_id ?? null,
          subtotal: invoice.subtotal,
          tax_amount: invoice.tax_amount ?? 0, // DB column is tax_amount (number)
          total: invoice.total, // DB column name
          issue_date: invoice.issue_date ?? new Date().toISOString().split('T')[0],
          due_date: invoice.due_date ?? null,
          notes: invoice.notes ?? null,
          line_items: invoice.line_items ?? null,
          discount: invoice.discount ?? 0,
          status: 'ISSUED',
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as InvoiceWithRelations;
    },
    onSuccess: (data: InvoiceWithRelations) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success(`Invoice ${data.invoice_no} created successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create invoice: ${error.message}`);
    },
  });
}

export interface UpdateInvoiceInput {
  id: string;
  customer_id?: string;
  shipment_id?: string;
  subtotal?: number;
  tax_amount?: number;
  total?: number;
  issue_date?: string;
  due_date?: string;
  notes?: string;
  line_items?: Json;
  discount?: number;
  status?: InvoiceStatus;
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.user?.orgId);

  return useMutation({
    mutationFn: async (invoice: UpdateInvoiceInput) => {
      if (!orgId) {
        throw new Error('No organization context available for invoice updates.');
      }
      const { id, ...updates } = invoice;

      const updatePayload: Database['public']['Tables']['invoices']['Update'] = {
        updated_at: new Date().toISOString(),
        ...updates,
      };

      const { data, error } = await supabase
        .from('invoices')
        .update(updatePayload)
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as InvoiceWithRelations;
    },
    onSuccess: (data: InvoiceWithRelations) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(data.id) });
      toast.success(`Invoice ${data.invoice_no} updated successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update invoice: ${error.message}`);
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.user?.orgId);

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceWithRelations['status'] }) => {
      if (!orgId) {
        throw new Error('No organization context available for invoice updates.');
      }
      const updateData: {
        status: InvoiceWithRelations['status'];
        updated_at: string;
        paid_at?: string;
      } = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Set paid_at if marking as paid
      if (status === 'PAID') {
        updateData.paid_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as InvoiceWithRelations;
    },
    onSuccess: (data: InvoiceWithRelations) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(data.id) });
      toast.success(`Invoice marked as ${data.status}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update invoice: ${error.message}`);
    },
  });
}

/**
 * Hook to delete an invoice (soft delete via deleted_at).
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.user?.orgId);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) {
        throw new Error('No organization context available for invoice deletion.');
      }
      const { error } = await supabase
        .from('invoices')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('org_id', orgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success('Invoice deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete invoice: ${error.message}`);
    },
  });
}

/**
 * Hook to HARD delete an invoice (remove from DB).
 * SUPER_ADMIN only.
 */
export function useHardDeleteInvoice() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.user?.orgId);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) {
        throw new Error('No organization context available for invoice deletion.');
      }
      const { error } = await supabase.from('invoices').delete().eq('id', id).eq('org_id', orgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success('Invoice permanently deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete invoice: ${error.message}`);
    },
  });
}
