import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { Json } from '../lib/database.types';
import { getOrCreateDefaultOrg } from '../lib/org-helper';
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
  updated_at: string;
  customer?: { name: string; phone: string };
  origin_hub?: { code: string; name: string };
  destination_hub?: { code: string; name: string };
}

export function useShipments(options?: {
  limit?: number;
  status?: string;
  search?: string;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query = (supabase as any)
          .rpc('search_shipments', {
            p_search_text: options.search,
            p_org_id: orgId || '',
            p_status: options.status || null,
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (query as any);
      if (error) throw error;
      return (data ?? []) as unknown as ShipmentWithRelations[];
    },
  });
}

export function useShipmentByAWB(awb: string | null) {
  return useQuery({
    queryKey: ['shipment', 'CN Number', awb],
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
      let orgId = staffUser?.orgId;
      if (!orgId) {
        // eslint-disable-next-line no-console
        console.debug('No orgId in auth store, fetching default...');
        orgId = await getOrCreateDefaultOrg();
        // eslint-disable-next-line no-console
        console.debug('Resolved orgId:', orgId);
      } else {
        // eslint-disable-next-line no-console
        console.debug('Using auth store orgId:', orgId);
      }

      // eslint-disable-next-line no-console
      console.debug('Calling generate_cn_number RPC...');
      const { data: awbResult, error: awbError } = await supabase.rpc('generate_cn_number', {
        p_org_id: orgId,
      });

      if (awbError) {
        console.error('AWB Generation Error:', awbError);
        throw awbError;
      }
      // eslint-disable-next-line no-console
      console.debug('AWB Result:', awbResult);

      if (typeof awbResult !== 'string' || !awbResult) {
        throw new Error('AWB service unavailable');
      }

      const insertPayload = {
        ...shipment,
        // Coerce empty-string UUIDs to null — safety net for any caller
        customer_id: shipment.customer_id || null,
        org_id: orgId,
        cn_number: awbResult,
        status: 'CREATED' as const,
      };

      if (!insertPayload.customer_id) {
        throw new Error('Customer is required to create a shipment. Please select a customer.');
      }

      // eslint-disable-next-line no-console
      console.debug('Inserting shipment payload:', insertPayload);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('shipments') as any)
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error('Shipment Insert Error:', error);
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
      logger.error('Shipment create failed', {
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

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('shipments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
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
    onSuccess: (data: ShipmentWithRelations) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['tracking-events', data.cn_number] });
      toast.success(`Status updated to ${data.status}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a shipment (soft delete via deleted_at).
 */
export function useDeleteShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shipments')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

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
  return useMutation({
    mutationFn: async (awb: string): Promise<ShipmentScanResult | null> => {
      const { data, error } = await supabase
        .from('shipments')
        .select('id, cn_number, status, origin_hub_id, destination_hub_id')
        .eq('cn_number', awb)
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

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shipments').delete().eq('id', id);

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
