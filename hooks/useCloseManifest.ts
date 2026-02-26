/**
 * Close Manifest Hook
 * Uses Edge Function for atomic manifest closing
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';
import { handleMutationError } from '@/lib/errors';
import type { Json } from '@/lib/database.types';

// Supabase client - now properly typed with manifests table

interface CloseManifestInput {
  manifestId: string;
  staffId?: string;
  notes?: string;
}

interface CloseManifestResponse {
  success: boolean;
  manifest?: {
    id: string;
    manifest_no: string;
    status: string;
    total_shipments: number;
    total_packages: number;
    total_weight: number;
  };
  shipments_updated: number;
  tracking_events_created: number;
  error?: string;
}

/**
 * Hook to close a manifest atomically via Edge Function
 * This ensures all shipments are updated and tracking events created in one transaction
 */
export function useCloseManifest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CloseManifestInput): Promise<CloseManifestResponse> => {
      const { data, error } = await supabase.functions.invoke('close-manifest', {
        body: {
          manifest_id: input.manifestId,
          staff_id: input.staffId,
          notes: input.notes,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to close manifest');
      }

      return data as CloseManifestResponse;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.manifests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tracking.all });

      toast.success('Manifest Closed', {
        description: `${data.manifest?.manifest_no} closed with ${data.shipments_updated} shipments`,
      });
    },
    onError: (error) => {
      handleMutationError(error, 'Close Manifest');
    },
  });
}

/**
 * Hook to depart a manifest (update status to DEPARTED)
 */
export function useDepartManifest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { manifestId: string; vehicleMeta?: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from('manifests')
        .update({
          status: 'DEPARTED',
          departed_at: new Date().toISOString(),
          vehicle_meta: (input.vehicleMeta || {}) as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.manifestId)
        .eq('status', 'CLOSED')
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Manifest not found or not in CLOSED status');

      // Create tracking events for all shipments
      const { data: items } = await supabase
        .from('manifest_items')
        .select('shipment_id, shipment:shipments(cn_number)')
        .eq('manifest_id', input.manifestId);

      if (items && items.length > 0) {
        // Type assertion for Supabase nested select result
        type ManifestItem = { shipment_id: string; shipment: { cn_number: string } | null };
        const typedItems = items as unknown as ManifestItem[];

        const trackingEvents = typedItems
          .filter((item) => item.shipment?.cn_number)
          .map((item) => ({
            org_id: data.org_id,
            shipment_id: item.shipment_id,
            cn_number: item.shipment!.cn_number,
            event_code: 'IN_TRANSIT',
            hub_id: data.from_hub_id,
            source: 'SYSTEM',
            meta: { manifest_id: data.id, action: 'MANIFEST_DEPARTED' } as Json,
          }));

        await supabase.from('tracking_events').insert(trackingEvents);

        await supabase
          .from('shipments')
          .update({ status: 'IN_TRANSIT', updated_at: new Date().toISOString() })
          .in(
            'id',
            typedItems.map((i) => i.shipment_id)
          );
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.manifests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all });
      toast.success('Manifest Departed', {
        description: `${data?.manifest_no} is now in transit`,
      });
    },
    onError: (error) => {
      handleMutationError(error, 'Depart Manifest');
    },
  });
}

/**
 * Hook to mark manifest as arrived
 */
export function useArriveManifest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { manifestId: string }) => {
      const { data, error } = await supabase
        .from('manifests')
        .update({
          status: 'ARRIVED',
          arrived_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.manifestId)
        .eq('status', 'DEPARTED')
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Manifest not found or not in DEPARTED status');

      // Create tracking events and update shipments
      const { data: items } = await supabase
        .from('manifest_items')
        .select('shipment_id, shipment:shipments(cn_number)')
        .eq('manifest_id', input.manifestId);

      if (items && items.length > 0) {
        // Type assertion for Supabase nested select result
        type ManifestItem = { shipment_id: string; shipment: { cn_number: string } | null };
        const typedItems = items as unknown as ManifestItem[];

        const trackingEvents = typedItems
          .filter((item) => item.shipment?.cn_number)
          .map((item) => ({
            org_id: data.org_id,
            shipment_id: item.shipment_id,
            cn_number: item.shipment!.cn_number,
            event_code: 'RECEIVED_AT_DEST',
            hub_id: data.to_hub_id,
            source: 'SYSTEM',
            meta: { manifest_id: data.id, action: 'MANIFEST_ARRIVED' } as Json,
          }));

        await supabase.from('tracking_events').insert(trackingEvents);

        await supabase
          .from('shipments')
          .update({ status: 'RECEIVED_AT_DEST', updated_at: new Date().toISOString() })
          .in(
            'id',
            typedItems.map((i) => i.shipment_id)
          );
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.manifests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all });
      toast.success('Manifest Arrived', {
        description: `${data?.manifest_no} has arrived at destination hub`,
      });
    },
    onError: (error) => {
      handleMutationError(error, 'Arrive Manifest');
    },
  });
}
