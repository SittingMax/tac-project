/**
 * Exceptions Hooks
 * React Query hooks for exception management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { getOrCreateDefaultOrg } from '../lib/org-helper';

import type { Database } from '../lib/database.types';

type Json = Database['public']['Tables']['exceptions']['Row']['images'];

export interface ExceptionWithRelations {
  id: string;
  org_id: string;
  shipment_id: string;
  type:
    | 'DAMAGE'
    | 'SHORTAGE'
    | 'MISROUTE'
    | 'DELAY'
    | 'CUSTOMER_REFUSAL'
    | 'ADDRESS_ISSUE'
    | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  description: string;
  reported_by_staff_id: string | null;
  assigned_to_staff_id: string | null;
  resolution: string | null;
  resolved_at: string | null;
  images: Json;
  created_at: string;
  updated_at: string;
  shipment?: { cn_number: string };
  reporter?: { full_name: string };
  assignee?: { full_name: string };
}

export const exceptionKeys = {
  all: ['exceptions'] as const,
  lists: () => [...exceptionKeys.all, 'list'] as const,
  list: (filters?: { status?: string; severity?: string }) =>
    [...exceptionKeys.lists(), filters] as const,
  detail: (id: string) => [...exceptionKeys.all, 'detail', id] as const,
};

export function useExceptions(options?: { status?: string; severity?: string }) {
  return useQuery({
    queryKey: exceptionKeys.list(options),
    queryFn: async () => {
      let query = supabase
        .from('exceptions')
        .select(
          `
                    *,
                    shipment:shipments(cn_number),
                    reporter:staff!exceptions_reported_by_staff_id_fkey(full_name),
                    assignee:staff!exceptions_assigned_to_staff_id_fkey(full_name)
                `
        )
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.severity) {
        query = query.eq('severity', options.severity);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ExceptionWithRelations[];
    },
  });
}

interface CreateExceptionInput {
  shipment_id: string;
  cn_number: string;
  type: ExceptionWithRelations['type'];
  severity: ExceptionWithRelations['severity'];
  description: string;
}

export function useCreateException() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExceptionInput) => {
      const orgId = await getOrCreateDefaultOrg();

      const { data, error } = await supabase
        .from('exceptions')
        .insert({
          org_id: orgId,
          shipment_id: input.shipment_id,
          type: input.type,
          severity: input.severity,
          description: input.description,
          status: 'OPEN',
        })
        .select()
        .single();

      if (error) throw error;

      // Update shipment status to EXCEPTION
      await supabase.from('shipments').update({ status: 'EXCEPTION' }).eq('id', input.shipment_id);

      return data as ExceptionWithRelations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exceptionKeys.lists() });
      toast.success('Exception reported successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to report exception: ${error.message}`);
    },
  });
}

export function useResolveException() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, resolution }: { id: string; resolution: string }) => {
      const { data, error } = await supabase
        .from('exceptions')
        .update({
          status: 'RESOLVED',
          resolution,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ExceptionWithRelations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exceptionKeys.lists() });
      toast.success('Exception resolved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to resolve exception: ${error.message}`);
    },
  });
}

export function useAssignException() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, staffId }: { id: string; staffId: string }) => {
      const { data, error } = await supabase
        .from('exceptions')
        .update({
          assigned_to_staff_id: staffId,
          status: 'IN_PROGRESS',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ExceptionWithRelations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exceptionKeys.lists() });
      toast.success('Exception assigned');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign exception: ${error.message}`);
    },
  });
}
