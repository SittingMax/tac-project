/**
 * useManifestBuilder Hook
 * Enterprise manifest building with scan-first workflow
 *
 * Features:
 * - Create manifest with AIR/TRUCK specific fields
 * - Add shipments via barcode scanning (idempotent)
 * - Optimistic UI updates
 * - Status workflow management
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  manifestService,
  type ManifestWithRelations,
  type ManifestItemWithShipment,
  type CreateManifestParams,
  type ManifestStatus,
  type ScanResponse,
  type ScanSource,
} from '@/lib/services/manifestService';

export interface ManifestBuilderState {
  manifest: ManifestWithRelations | null;
  items: ManifestItemWithShipment[];
  isLoading: boolean;
  isCreating: boolean;
  isScanning: boolean;
  lastScanResult: ScanResponse | null;
  scanHistory: ScanResponse[];
}

export interface ManifestBuilderOptions {
  manifestId?: string;
  onScanSuccess?: (result: ScanResponse) => void;
  onScanError?: (result: ScanResponse) => void;
  onManifestCreated?: (manifest: ManifestWithRelations) => void;
  validateDestination?: boolean;
  validateStatus?: boolean;
}

export const manifestBuilderKeys = {
  all: ['manifestBuilder'] as const,
  manifest: (id: string) => [...manifestBuilderKeys.all, 'manifest', id] as const,
  items: (id: string) => [...manifestBuilderKeys.all, 'items', id] as const,
};

export function useManifestBuilder(options: ManifestBuilderOptions = {}) {
  const queryClient = useQueryClient();
  const {
    manifestId,
    onScanSuccess,
    onScanError,
    onManifestCreated,
    validateDestination = true,
    validateStatus = true,
  } = options;

  const [scanHistory, setScanHistory] = useState<ScanResponse[]>([]);
  const [lastScanResult, setLastScanResult] = useState<ScanResponse | null>(null);

  // Fetch manifest details
  const manifestQuery = useQuery({
    queryKey: manifestBuilderKeys.manifest(manifestId || ''),
    queryFn: () => manifestService.getById(manifestId!),
    enabled: !!manifestId,
    staleTime: 30000,
  });

  // Fetch manifest items with full shipment details
  const itemsQuery = useQuery({
    queryKey: manifestBuilderKeys.items(manifestId || ''),
    queryFn: () => manifestService.getItemsWithFullDetails(manifestId!),
    enabled: !!manifestId,
    staleTime: 10000,
  });

  // Create manifest mutation
  const createMutation = useMutation({
    mutationFn: (params: CreateManifestParams) => manifestService.createEnterprise(params),
    onSuccess: (manifest) => {
      queryClient.invalidateQueries({ queryKey: ['manifests'] });
      toast.success('Manifest created', {
        description: `${manifest.manifest_no} ready for scanning`,
      });
      onManifestCreated?.(manifest);
    },
    onError: (error: Error) => {
      toast.error('Failed to create manifest', { description: error.message });
    },
  });

  // Add shipment by scan mutation (optimistic)
  const scanMutation = useMutation({
    mutationFn: async ({
      scanToken,
      staffId,
      scanSource,
    }: {
      scanToken: string;
      staffId?: string;
      scanSource?: ScanSource;
    }) => {
      if (!manifestId) throw new Error('No manifest selected');
      return manifestService.addShipmentByScan(manifestId, scanToken, {
        staffId,
        scanSource,
        validateDestination,
        validateStatus,
      });
    },
    onMutate: async ({ scanToken }) => {
      // Optimistic: show scanning state
      setLastScanResult(null);
      return { scanToken };
    },
    onSuccess: (result, { scanToken }) => {
      setLastScanResult(result);
      setScanHistory((prev) => [result, ...prev].slice(0, 50));

      if (result.success) {
        if (result.duplicate) {
          toast.info('Duplicate scan', {
            description: `${result.cn_number} already in manifest`,
          });
        } else {
          toast.success('Shipment added', {
            description: `${result.cn_number} - ${result.consignee_name}`,
          });
          // Refetch items to update list
          queryClient.invalidateQueries({
            queryKey: manifestBuilderKeys.items(manifestId!),
          });
        }
        onScanSuccess?.(result);
      } else {
        toast.error(result.message, {
          description: result.cn_number || scanToken,
        });
        onScanError?.(result);
      }
    },
    onError: (error: Error) => {
      const result: ScanResponse = {
        success: false,
        error: 'SYSTEM_ERROR',
        message: error.message,
      };
      setLastScanResult(result);
      setScanHistory((prev) => [result, ...prev].slice(0, 50));
      toast.error('Scan failed', { description: error.message });
      onScanError?.(result);
    },
  });

  // Remove shipment mutation
  const removeMutation = useMutation({
    mutationFn: async ({ shipmentId, staffId }: { shipmentId: string; staffId?: string }) => {
      if (!manifestId) throw new Error('No manifest selected');
      return manifestService.removeShipmentById(manifestId, shipmentId, staffId);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Shipment removed');
        queryClient.invalidateQueries({
          queryKey: manifestBuilderKeys.items(manifestId!),
        });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to remove shipment', { description: error.message });
    },
  });

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: async ({ status, staffId }: { status: ManifestStatus; staffId?: string }) => {
      if (!manifestId) throw new Error('No manifest selected');
      return manifestService.updateStatus(manifestId, status, staffId);
    },
    onSuccess: (manifest, { status }) => {
      queryClient.invalidateQueries({
        queryKey: manifestBuilderKeys.manifest(manifestId!),
      });
      queryClient.invalidateQueries({ queryKey: ['manifests'] });
      toast.success(`Manifest ${status.toLowerCase()}`, {
        description: manifest.manifest_no,
      });
    },
    onError: (error: Error) => {
      toast.error('Status update failed', { description: error.message });
    },
  });

  // Computed values
  const manifest = manifestQuery.data ?? null;
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        shipments: acc.shipments + 1,
        packages: acc.packages + (item.shipment?.package_count ?? 0),
        weight: acc.weight + (item.shipment?.total_weight ?? 0),
        codAmount: acc.codAmount + (item.shipment?.cod_amount ?? 0),
      }),
      { shipments: 0, packages: 0, weight: 0, codAmount: 0 }
    );
  }, [items]);

  const isEditable = useMemo(() => {
    if (!manifest) return false;
    return ['DRAFT', 'OPEN', 'BUILDING'].includes(manifest.status);
  }, [manifest]);

  // Actions
  const createManifest = useCallback(
    (params: CreateManifestParams) => createMutation.mutateAsync(params),
    [createMutation]
  );

  const scanShipment = useCallback(
    (scanToken: string, staffId?: string, scanSource?: ScanSource) => {
      if (!scanToken.trim()) return;
      return scanMutation.mutateAsync({ scanToken: scanToken.trim(), staffId, scanSource });
    },
    [scanMutation]
  );

  const removeShipment = useCallback(
    (shipmentId: string, staffId?: string) => removeMutation.mutateAsync({ shipmentId, staffId }),
    [removeMutation]
  );

  const updateStatus = useCallback(
    (status: ManifestStatus, staffId?: string) => statusMutation.mutateAsync({ status, staffId }),
    [statusMutation]
  );

  const closeManifest = useCallback(
    (staffId?: string) => updateStatus('CLOSED', staffId),
    [updateStatus]
  );

  const clearScanHistory = useCallback(() => {
    setScanHistory([]);
    setLastScanResult(null);
  }, []);

  const refetch = useCallback(() => {
    if (manifestId) {
      queryClient.invalidateQueries({
        queryKey: manifestBuilderKeys.manifest(manifestId),
      });
      queryClient.invalidateQueries({
        queryKey: manifestBuilderKeys.items(manifestId),
      });
    }
  }, [manifestId, queryClient]);

  return {
    // State
    manifest,
    items,
    totals,
    isEditable,
    lastScanResult,
    scanHistory,

    // Loading states
    isLoading: manifestQuery.isLoading || itemsQuery.isLoading,
    isCreating: createMutation.isPending,
    isScanning: scanMutation.isPending,
    isRemoving: removeMutation.isPending,
    isUpdatingStatus: statusMutation.isPending,

    // Actions
    createManifest,
    scanShipment,
    removeShipment,
    updateStatus,
    closeManifest,
    clearScanHistory,
    refetch,
  };
}

export default useManifestBuilder;
