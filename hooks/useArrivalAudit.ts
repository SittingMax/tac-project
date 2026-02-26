import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  manifestKeys,
  type ManifestItemWithRelations,
  type ManifestWithRelations,
} from '@/hooks/useManifests';
import { parseScanInput } from '@/lib/scanParser';
import { ScanSource } from '@/types';
import { playSuccessFeedback, playErrorFeedback, playWarningFeedback } from '@/lib/feedback';
import { orgService } from '@/lib/services/orgService';

export interface AuditState {
  isScanning: boolean;
  activeManifestId: string | null;
  scannedCount: number;
  missingCount: number;
  exceptionCount: number;
}

export type ScannedItemStatus = 'PENDING' | 'SCANNED' | 'EXCEPTION';

export interface AuditItem extends Omit<ManifestItemWithRelations, 'shipment'> {
  status: ScannedItemStatus;
  shipment: NonNullable<ManifestItemWithRelations['shipment']>;
}

export function useArrivalAudit() {
  const queryClient = useQueryClient();
  const [activeManifestId, setActiveManifestId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Audio feedback
  const playBeep = useCallback((type: 'success' | 'error' | 'duplicate') => {
    switch (type) {
      case 'success':
        playSuccessFeedback();
        break;
      case 'duplicate':
        playWarningFeedback();
        break;
      case 'error':
        playErrorFeedback();
        break;
    }
  }, []);

  // Fetch manifest details
  const { data: manifest, isLoading: isLoadingManifest } = useQuery({
    queryKey: manifestKeys.detail(activeManifestId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manifests')
        .select(
          `
          *,
          from_hub:hubs!manifests_from_hub_id_fkey(code, name),
          to_hub:hubs!manifests_to_hub_id_fkey(code, name)
        `
        )
        .eq('id', activeManifestId!)
        .single();
      if (error) throw error;
      return data as unknown as ManifestWithRelations;
    },
    enabled: !!activeManifestId,
  });

  // Fetch manifest items
  const {
    data: items = [],
    isLoading: isLoadingItems,
    refetch: refetchItems,
  } = useQuery({
    queryKey: manifestKeys.items(activeManifestId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manifest_items')
        .select(
          `
          *,
          shipment:shipments(*)
        `
        )
        .eq('manifest_id', activeManifestId!);
      if (error) throw error;

      // Map to AuditItem with status based on shipment status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data || []).map((item: any) => ({
        ...item,
        status:
          item.shipment.status === 'RECEIVED_AT_DEST'
            ? 'SCANNED'
            : item.shipment.status === 'EXCEPTION'
              ? 'EXCEPTION'
              : 'PENDING',
      })) as AuditItem[];
    },
    enabled: !!activeManifestId,
  });

  // Keep a stable ref to items so processScan never captures a stale array
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Calculate stats
  const stats = {
    total: items.length,
    scanned: items.filter((i) => i.status === 'SCANNED').length,
    missing: items.filter((i) => i.status === 'PENDING').length,
    exceptions: items.filter((i) => i.status === 'EXCEPTION').length,
  };

  // Find manifest by code
  const findManifest = useMutation({
    mutationFn: async (code: string) => {
      const orgId = orgService.getCurrentOrgId();
      const { data, error } = await supabase
        .from('manifests')
        .select('*')
        .eq('org_id', orgId)
        .or(`id.eq.${code},manifest_no.eq.${code}`)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Manifest not found');
      return data;
    },
    onSuccess: (data) => {
      setActiveManifestId(data.id);
      playBeep('success');
    },
    onError: (_error: Error) => {
      playBeep('error');
    },
  });

  // Process a scan for an item
  const processScan = useCallback(
    async (input: string, _source: ScanSource = ScanSource.MANUAL) => {
      if (!activeManifestId) {
        await findManifest.mutateAsync(input);
        return;
      }

      setIsScanning(true);
      try {
        let awb = input.trim().toUpperCase();
        try {
          const parsed = parseScanInput(awb);
          if (parsed.awb) awb = parsed.awb;
        } catch {
          // use raw
        }

        // Check if item exists in this manifest
        // Use ref to avoid stale closure — items changes on every refetch
        const currentItems = itemsRef.current;
        const item = currentItems.find((i) => i.shipment.cn_number.toUpperCase() === awb);

        if (!item) {
          playBeep('error');
          throw new Error(`Shipment ${awb} is NOT on this manifest!`);
        }

        if (item.status === 'SCANNED') {
          playBeep('duplicate');
          return { success: true, duplicate: true, message: 'Already scanned' };
        }

        // Update shipment status in database
        const { error } = await supabase
          .from('shipments')
          .update({ status: 'RECEIVED_AT_DEST' })
          .eq('id', item.shipment_id);

        if (error) throw error;

        playBeep('success');

        // Optimistically update local cache
        queryClient.setQueryData(
          manifestKeys.items(activeManifestId),
          (oldData: AuditItem[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.map((d: AuditItem) =>
              d.shipment_id === item.shipment_id
                ? { ...d, shipment: { ...d.shipment, status: 'RECEIVED_AT_DEST' } }
                : d
            );
          }
        );

        // also refetch to be safe
        refetchItems();

        return { success: true, message: 'Successfully received' };
      } catch (err) {
        playBeep('error');
        throw err;
      } finally {
        setIsScanning(false);
      }
    },
    [activeManifestId, findManifest, playBeep, queryClient, refetchItems]
  );

  const clearManifest = () => {
    setActiveManifestId(null);
  };

  return {
    activeManifestId,
    manifest,
    items,
    stats,
    isLoading: isLoadingManifest || isLoadingItems,
    isScanning,
    processScan,
    clearManifest,
  };
}
