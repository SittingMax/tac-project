import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';

// Direct supabase usage - types from database.types.ts

/**
 * Query key factory for staff.
 * Provides consistent, type-safe query keys for caching.
 */
export const staffKeys = {
  all: ['staff'] as const,
  lists: () => [...staffKeys.all, 'list'] as const,
  list: (filters?: { hubId?: string }) => [...staffKeys.lists(), filters] as const,
  details: () => [...staffKeys.all, 'detail'] as const,
  detail: (id: string) => [...staffKeys.details(), id] as const,
};

export interface Staff {
  id: string;
  org_id: string;
  auth_user_id: string | null;
  email: string;
  full_name: string;
  role:
    | 'SUPER_ADMIN'
    | 'ADMIN'
    | 'MANAGER'
    | 'WAREHOUSE_IMPHAL'
    | 'WAREHOUSE_DELHI'
    | 'WAREHOUSE_STAFF'
    | 'OPS'
    | 'OPS_STAFF'
    | 'INVOICE'
    | 'FINANCE_STAFF'
    | 'SUPPORT';
  hub_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  hub?: { code: string; name: string };
}

export function useStaff(options?: { hubId?: string }) {
  const orgId = useAuthStore((s) => s.user?.orgId);
  return useQuery({
    queryKey: ['staff', options],
    queryFn: async () => {
      if (!orgId) return [];
      let query = supabase
        .from('staff')
        .select(
          `
          *,
          hub:hubs(code, name)
        `
        )
        .eq('org_id', orgId)
        .order('full_name', { ascending: true });

      if (options?.hubId) {
        query = query.eq('hub_id', options.hubId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Staff[];
    },
    enabled: !!orgId,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.user?.orgId);

  return useMutation({
    mutationFn: async (staff: {
      email: string;
      full_name: string;
      role: Staff['role'];
      hub_id?: string;
    }) => {
      if (!orgId) {
        throw new Error('No organization context available for staff creation.');
      }

      const { data, error } = await supabase
        .from('staff')
        .insert({
          ...staff,
          org_id: orgId,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Staff;
    },
    onSuccess: (data: Staff) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success(`Staff member ${data.full_name} added successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to add staff: ${error.message}`);
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.user?.orgId);

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Staff> }) => {
      if (!orgId) {
        throw new Error('No organization context available for staff updates.');
      }
      const { data: result, error } = await supabase
        .from('staff')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) throw error;
      return result as Staff;
    },
    onSuccess: (data: Staff) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success(`Staff member ${data.full_name} updated`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update staff: ${error.message}`);
    },
  });
}

export function useToggleStaffStatus() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.user?.orgId);

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (!orgId) {
        throw new Error('No organization context available for staff updates.');
      }
      const { data, error } = await supabase
        .from('staff')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) throw error;
      return data as Staff;
    },
    onSuccess: (data: Staff) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success(`Staff member ${data.is_active ? 'activated' : 'deactivated'}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a staff member (soft delete via deleted_at).
 */
export function useDeleteStaff() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.user?.orgId);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) {
        throw new Error('No organization context available for staff deletion.');
      }
      const { error } = await supabase
        .from('staff')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('org_id', orgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
      toast.success('Staff member removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove staff: ${error.message}`);
    },
  });
}
