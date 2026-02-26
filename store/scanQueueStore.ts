/**
 * Offline-First Scan Queue Store
 * Handles scanning operations with automatic sync retry
 * Critical for warehouse reliability with weak connections
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase client requires any for complex operations */

import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ScanEvent, ScanSource, HubCode, UUID } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { orgService } from '@/lib/services/orgService';
import { useAuthStore } from '@/store/authStore';

interface ScanQueueState {
  queue: ScanEvent[];
  syncInProgress: boolean;
  lastSyncAttempt: string | null;

  // Actions
  addScan: (scan: Omit<ScanEvent, 'id' | 'timestamp' | 'synced'>) => void;
  markSynced: (id: string) => void;
  markFailed: (id: string, error: string) => void;
  retrySync: () => Promise<void>;
  clearSynced: () => void;

  // Getters
  getPendingScans: () => ScanEvent[];
  getSyncedScans: () => ScanEvent[];
  getFailedScans: () => ScanEvent[];
}

export const useScanQueueStore = create<ScanQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      syncInProgress: false,
      lastSyncAttempt: null,

      addScan: (scanData) => {
        const scan: ScanEvent = {
          ...scanData,
          id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          synced: false,
        };

        set((state) => ({
          queue: [scan, ...state.queue],
        }));

        // Auto-sync if online
        if (navigator.onLine) {
          setTimeout(() => get().retrySync(), 100);
        }
      },

      markSynced: (id) => {
        set((state) => ({
          queue: state.queue.map((scan) =>
            scan.id === id
              ? { ...scan, synced: true, syncedAt: new Date().toISOString(), error: undefined }
              : scan
          ),
        }));
      },

      markFailed: (id, error) => {
        set((state) => ({
          queue: state.queue.map((scan) => (scan.id === id ? { ...scan, error } : scan)),
        }));
      },

      retrySync: async () => {
        const { queue, syncInProgress } = get();

        if (syncInProgress) return;
        if (!navigator.onLine) {
          toast.warning('Offline', {
            description: 'Scans will sync when connection is restored',
          });
          return;
        }

        const pendingScans = queue.filter((s) => !s.synced && !s.error);
        if (pendingScans.length === 0) return;

        set({ syncInProgress: true, lastSyncAttempt: new Date().toISOString() });

        let successCount = 0;
        let failCount = 0;

        for (const scan of pendingScans) {
          try {
            const { orgId, shipmentId, hubId, staffId } = await resolveScanContext(scan);

            // Create tracking event in Supabase
            const { error } = await (supabase.from('tracking_events') as any).insert({
              org_id: orgId,
              shipment_id: shipmentId,
              cn_number: scan.code,
              event_code: scan.type === 'manifest' ? 'MANIFEST_SCAN' : 'PACKAGE_SCAN',
              event_time: scan.timestamp,
              hub_id: hubId,
              actor_staff_id: staffId,
              source: mapScanSourceToTrackingSource(scan.source),
              meta: {
                scan_id: scan.id,
                scan_type: scan.type,
              },
            });

            if (error) throw error;

            get().markSynced(scan.id);
            successCount++;
          } catch (error) {
            console.error(`Failed to sync scan ${scan.id}:`, error);
            get().markFailed(scan.id, error instanceof Error ? error.message : 'Sync failed');
            failCount++;
          }
        }

        set({ syncInProgress: false });

        // Show sync results
        if (successCount > 0) {
          toast.success('Synced', {
            description: `${successCount} scan${successCount > 1 ? 's' : ''} synced successfully`,
          });
        }

        if (failCount > 0) {
          toast.error('Sync Failed', {
            description: `${failCount} scan${failCount > 1 ? 's' : ''} failed to sync`,
          });
        }
      },

      clearSynced: () => {
        set((state) => ({
          queue: state.queue.filter((scan) => !scan.synced),
        }));
      },

      getPendingScans: () => {
        return get().queue.filter((s) => !s.synced && !s.error);
      },

      getSyncedScans: () => {
        return get().queue.filter((s) => s.synced);
      },

      getFailedScans: () => {
        return get().queue.filter((s) => s.error);
      },
    }),
    {
      name: 'tac-scan-queue',
      version: 1,
    }
  )
);

// Helper function to map scan source to tracking event source
const mapScanSourceToTrackingSource = (source: ScanSource): string => {
  switch (source) {
    case ScanSource.CAMERA:
    case ScanSource.BARCODE_SCANNER:
      return 'SCAN';
    case ScanSource.MANUAL:
      return 'MANUAL';
    default:
      return 'SCAN';
  }
};

let scanQueueAutoSyncInitialized = false;

const initScanQueueAutoSync = () => {
  if (typeof window === 'undefined') return;
  if (scanQueueAutoSyncInitialized) return;
  scanQueueAutoSyncInitialized = true;

  setInterval(() => {
    const store = useScanQueueStore.getState();
    const pendingCount = store.getPendingScans().length;

    if (pendingCount > 0 && navigator.onLine) {
      logger.debug('[ScanQueue] Auto-retry', { pendingCount });
      store.retrySync();
    }
  }, 30000);

  window.addEventListener('online', () => {
    logger.debug('[ScanQueue] Connection restored, syncing...');
    useScanQueueStore.getState().retrySync();
  });

  window.addEventListener('offline', () => {
    logger.debug('[ScanQueue] Connection lost, scans will queue');
    toast.warning('Offline Mode', {
      description: 'Scans will sync when connection is restored',
    });
  });
};

// Helper to map DB hub codes to Enum
const mapDbHubToEnum = (code: string | null): HubCode => {
  if (!code) return HubCode.IMPHAL; // Default
  const normalized = code.toUpperCase();
  if (normalized === 'DEL' || normalized === 'NEW_DELHI') return HubCode.NEW_DELHI;
  if (normalized === 'IMF' || normalized === 'IMPHAL') return HubCode.IMPHAL;
  return HubCode.IMPHAL;
};

// Helper to map Enum to DB hub codes
const mapEnumToDbHub = (code: HubCode): string => {
  if (code === HubCode.NEW_DELHI) return 'DEL';
  if (code === HubCode.IMPHAL) return 'IMF';
  return 'IMF';
};

/**
 * Convenience hook for Scanning page - simplified interface
 */
export const useScanQueue = () => {
  const store = useScanQueueStore();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    initScanQueueAutoSync();
  }, []);

  return {
    addScan: (scan: { awb: string; mode: string; manifestId?: string; source?: ScanSource }) => {
      const hubCode = mapDbHubToEnum(user?.hubCode || null);
      store.addScan({
        type: 'shipment',
        code: scan.awb,
        source: scan.source || ScanSource.CAMERA,
        hubCode,
        staffId: (user?.id as UUID) ?? (null as unknown as UUID),
      });
    },
    pendingScans: store.getPendingScans(),
    syncedScans: store.getSyncedScans(),
    failedScans: store.getFailedScans(),
    isOnline,
    syncPending: store.retrySync,
    clearSynced: store.clearSynced,
  };
};

const resolveScanContext = async (scan: ScanEvent) => {
  const orgId = orgService.getCurrentOrgId();
  const staffId = scan.staffId ?? useAuthStore.getState().user?.id ?? null;

  const { data: shipment, error: shipmentError } = await (supabase.from('shipments') as any)
    .select('id')
    .eq('org_id', orgId)
    .eq('cn_number', scan.code)
    .maybeSingle();

  if (shipmentError || !shipment?.id) {
    throw new Error('Shipment not found for scan');
  }

  const dbHubCode = mapEnumToDbHub(scan.hubCode);
  const { data: hub, error: hubError } = await (supabase.from('hubs') as any)
    .select('id')
    .eq('org_id', orgId)
    .eq('code', dbHubCode)
    .maybeSingle();

  if (hubError || !hub?.id) {
    throw new Error('Hub not found for scan');
  }

  return { orgId, shipmentId: shipment.id, hubId: hub.id, staffId };
};

/**
 * Usage Example:
 *
 * import { useScanQueueStore, useScanQueue } from '@/store/scanQueueStore';
 *
 * // Simple usage with useScanQueue
 * const { addScan, pendingScans, isOnline, syncPending } = useScanQueue();
 *
 * // Full control with useScanQueueStore
 * const { addScan, getPendingScans, retrySync } = useScanQueueStore();
 */
