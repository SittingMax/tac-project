import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { Json } from '../lib/database.types';
import { useAuthStore } from '../store/authStore';
import { logger } from '../lib/logger';

// Direct supabase usage - types handled via database.types.ts

/**
 * Query key factory for shipments.
 * Provides consistent, type-safe query keys for caching.
 */
export const shipmentKeys = {
  all: ['shipments'] as const,
  lists: () => [...shipmentKeys.all, 'list'] as const,
  list: (filters?: {
    limit?: number;
    status?: string;
    orgId?: string;
    search?: string;
    deliveredSince?: string;
    page?: number;
    pageSize?: number;
  }) => [...shipmentKeys.lists(), filters] as const,
  details: () => [...shipmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...shipmentKeys.details(), id] as const,
  byCN: (awb: string) => [...shipmentKeys.all, 'CN Number', awb] as const,
};

export interface ShipmentWithRelations {
  id: string;
  org_id: string;
  cn_number: string;
  customer_id: string;
  origin_hub_id: string;
  destination_hub_id: string;
  mode: 'AIR' | 'TRUCK' | 'OCEAN';
  service_level: 'STANDARD' | 'EXPRESS';
  status: string;
  package_count: number;
  total_weight: number;
  declared_value: number | null;
  consignee_name: string;
  consignee_phone: string;
  consignee_address: Json;
  consignor_name?: string;
  consignor_phone?: string;
  consignor_address?: Json;
  special_instructions: string | null;
  created_at: string;
  delivered_at?: string | null;
  updated_at: string;
  customer?: { name: string; phone: string };
  origin_hub?: { code: string; name: string };
  destination_hub?: { code: string; name: string };
}

export function useShipments(options?: {
  limit?: number;
  status?: string;
  search?: string;
  deliveredSince?: string;
  page?: number;
  pageSize?: number;
  orgId?: string;
  /** Filter shipments whose origin OR destination hub matches this hub ID */
  hubId?: string;
}) {
  const authOrgId = useAuthStore((s) => s.user?.orgId);
  const orgId = options?.orgId !== undefined ? options.orgId : authOrgId;
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  return useQuery({
    queryKey: shipmentKeys.list({ ...options, orgId, page, pageSize }),
    queryFn: async () => {
      let query;

      if (options?.search) {
        // Use RPC for search
        query = supabase
          .rpc('search_shipments', {
            p_search_text: options.search || '',
            p_org_id: orgId || '',
            p_status: options.status || undefined,
            p_limit: pageSize,
            p_offset: offset,
          })
          .select(
            `
          *,
          customer:customers(name, phone),
          origin_hub:hubs!shipments_origin_hub_id_fkey(code, name),
          destination_hub:hubs!shipments_destination_hub_id_fkey(code, name)
        `
          );
      } else {
        // Standard list query
        query = supabase
          .from('shipments')
          .select(
            `
          *,
          customer:customers(name, phone),
          origin_hub:hubs!shipments_origin_hub_id_fkey(code, name),
          destination_hub:hubs!shipments_destination_hub_id_fkey(code, name)
        `
          )
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (orgId) {
          query = query.eq('org_id', orgId);
        }

        if (options?.status) {
          query = query.eq('status', options.status);
        }

        if (options?.deliveredSince) {
          query = query.gte('delivered_at', options.deliveredSince);
        }

        if (options?.hubId) {
          query = query.or(
            `origin_hub_id.eq.${options.hubId},destination_hub_id.eq.${options.hubId}`
          );
        }

        if (options?.limit) {
          query = query.limit(options.limit);
        } else {
          query = query.range(offset, offset + pageSize - 1);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ShipmentWithRelations[];
    },
  });
}

export function useShipmentByAWB(awb: string | null) {
  const orgId = useAuthStore((s) => s.user?.orgId);
  return useQuery({
    queryKey: ['shipment', 'CN Number', awb, orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select(
          `
          *,
          customer:customers(name, phone, email, address),
          origin_hub:hubs!shipments_origin_hub_id_fkey(code, name, address),
          destination_hub:hubs!shipments_destination_hub_id_fkey(code, name, address)
        `
        )
        .eq('cn_number', awb!)
        .eq('org_id', orgId!)
        .single();

      if (error) throw error;
      return data as unknown as ShipmentWithRelations;
    },
    enabled: !!awb,
  });
}

export function useShipmentById(id: string | undefined) {
  return useQuery({
    queryKey: shipmentKeys.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select(
          `
          *,
          customer:customers(name, phone, email, address),
          origin_hub:hubs!shipments_origin_hub_id_fkey(code, name, address),
          destination_hub:hubs!shipments_destination_hub_id_fkey(code, name, address)
        `
        )
        .eq('id', id!)
        .single();

      if (error) throw error;
      return data as unknown as ShipmentWithRelations;
    },
    enabled: !!id,
  });
}

interface CreateShipmentInput {
  customer_id: string;
  origin_hub_id: string;
  destination_hub_id: string;
  mode: 'AIR' | 'TRUCK';
  service_level: 'STANDARD' | 'EXPRESS';
  package_count: number;
  total_weight: number;
  declared_value?: number;
  consignee_name: string;
  consignee_phone: string;
  consignee_address: Json;
  consignor_name?: string;
  consignor_phone?: string;
  consignor_address?: Json;
  special_instructions?: string;
}

export function useCreateShipment() {
  const queryClient = useQueryClient();
  const staffUser = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (shipment: CreateShipmentInput) => {
      // eslint-disable-next-line no-console
      console.debug('Starting createShipment mutation...', shipment);
      const orgId = staffUser?.orgId;
      if (!orgId) {
        throw new Error('No organization context available for shipment creation.');
      }
      // eslint-disable-next-line no-console
      console.debug('Using auth store orgId:', orgId);

      // eslint-disable-next-line no-console
      console.debug('Calling generate_cn_number RPC...');
      const { data: awbResult, error: awbError } = await supabase.rpc('generate_cn_number', {
        p_org_id: orgId,
      });

      if (awbError) {
        logger.error('useShipments', 'AWB Generation Error', { error: awbError });
        throw awbError;
      }
      // eslint-disable-next-line no-console
      console.debug('AWB Result:', awbResult);

      if (typeof awbResult !== 'string' || !awbResult) {
        throw new Error('AWB service unavailable');
      }

      const insertPayload = {
        ...shipment,
        // Ensure customer_id is a string (checked below)
        customer_id: shipment.customer_id as string,
        org_id: orgId as string,
        cn_number: awbResult,
        status: 'CREATED' as const,
      };

      if (!insertPayload.customer_id) {
        throw new Error('Customer is required to create a shipment. Please select a customer.');
      }

      // eslint-disable-next-line no-console
      console.debug('Inserting shipment payload:', insertPayload);

      const { data, error } = await supabase
        .from('shipments')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        logger.error('useShipments', 'Shipment Insert Error', { error });
        throw error;
      }
      // eslint-disable-next-line no-console
      console.debug('Shipment created successfully:', data);
      return data as unknown as ShipmentWithRelations;
    },
    onSuccess: (data: ShipmentWithRelations) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      toast.success(`Shipment ${data.cn_number} created successfully`);
    },
    onError: (error: Error) => {
      logger.error('useShipments', 'Shipment create failed', {
        env: import.meta.env.MODE,
        org_id: staffUser?.orgId || null,
        user_id: staffUser?.id || null,
        auth_user_id: staffUser?.authUserId || null,
        error: error.message,
      });
      toast.error('Unable to create shipment', {
        description: error.message,
      });
    },
  });
}

export function useUpdateShipmentStatus() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.user?.orgId);

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string; silent?: boolean }) => {
      if (!orgId) {
        throw new Error('No organization context available for shipment status updates.');
      }
      const { data, error } = await supabase
        .from('shipments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Shipment not found');

      const shipmentData = data as unknown as ShipmentWithRelations;

      // Create tracking event
      const { error: trackingError } = await supabase.from('tracking_events').insert({
        org_id: shipmentData.org_id,
        shipment_id: id,
        cn_number: shipmentData.cn_number,
        event_code: status,
        source: 'MANUAL',
      });

      if (trackingError) throw trackingError;

      return shipmentData;
    },
    onSuccess: (data: ShipmentWithRelations, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['tracking-events', data.cn_number] });
      if (!variables.silent) {
        toast.success(`Status updated to ${data.status}`);
      }
    },
    onError: (error: Error, variables) => {
      if (!variables.silent) {
        toast.error(`Failed to update status: ${error.message}`);
      }
    },
  });
}

/**
 * Hook to delete a shipment (soft delete via deleted_at).
 */
export function useDeleteShipment() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.user?.orgId);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) {
        throw new Error('No organization context available for shipment deletion.');
      }
      const { error } = await supabase
        .from('shipments')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('org_id', orgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() });
      toast.success('Shipment deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete shipment: ${error.message}`);
    },
  });
}

/**
 * Mutation hook for imperative shipment lookup by AWB (used in Scanning.tsx).
 * Returns shipment with minimal fields needed for scanning operations.
 */
export interface ShipmentScanResult {
  id: string;
  cn_number: string;
  status: string;
  origin_hub_id: string;
  destination_hub_id: string;
}

export function useFindShipmentByCN() {
  const orgId = useAuthStore((s) => s.user?.orgId);
  return useMutation({
    mutationFn: async (awb: string): Promise<ShipmentScanResult | null> => {
      if (!orgId) {
        throw new Error('No organization context available for shipment lookup.');
      }
      const { data, error } = await supabase
        .from('shipments')
        .select('id, cn_number, status, origin_hub_id, destination_hub_id')
        .eq('cn_number', awb)
        .eq('org_id', orgId)
        .maybeSingle();

      if (error) throw error;
      return data as ShipmentScanResult | null;
    },
  });
}

/**
 * Hook to permanently delete a shipment (hard delete).
 * ONLY FOR SUPER ADMINS.
 */
export function useHardDeleteShipment() {
  const queryClient = useQueryClient();
  const orgId = useAuthStore((s) => s.user?.orgId);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) {
        throw new Error('No organization context available for shipment deletion.');
      }
      const { error } = await supabase.from('shipments').delete().eq('id', id).eq('org_id', orgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() });
      toast.success('Shipment permanently deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete shipment: ${error.message}`);
    },
  });
}
