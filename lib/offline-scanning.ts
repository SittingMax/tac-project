/**
 * Offline Scanning Library
 * IndexedDB storage for offline scans with background sync
 * Features: Queue management, conflict resolution, retry logic
 */

import { toast } from 'sonner';
import { logger } from './logger';
import type { Database } from './database.types';

// Types
export interface OfflineScan {
  id: string;
  cn_number: string;
  event_code: string;
  hub_id: string;
  hub_code: string;
  scan_time: string;
  notes?: string;
  synced: boolean;
  sync_attempts: number;
  last_sync_attempt?: string;
  created_at: string;
  error?: string;
}

export interface SyncStatus {
  pending: number;
  syncing: number;
  failed: number;
  lastSync?: string;
  isOnline: boolean;
}

type TrackingEventInsert = Database['public']['Tables']['tracking_events']['Insert'];
type ShipmentSyncLookupRow = Pick<
  Database['public']['Tables']['shipments']['Row'],
  'id' | 'org_id'
>;

// IndexedDB configuration
const DB_NAME = 'tac-offline-scans';
const DB_VERSION = 1;
const STORE_NAME = 'scans';

let db: IDBDatabase | null = null;

// Initialize IndexedDB
export async function initOfflineDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('cn_number', 'cn_number', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
    };
  });
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Add scan to offline queue
export async function queueScan(
  scan: Omit<OfflineScan, 'id' | 'synced' | 'sync_attempts' | 'created_at'>
): Promise<OfflineScan> {
  const database = await initOfflineDB();

  const offlineScan: OfflineScan = {
    ...scan,
    id: generateId(),
    synced: false,
    sync_attempts: 0,
    created_at: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(offlineScan);

    request.onsuccess = () => {
      logger.info('OfflineScanning', 'Scan queued for offline sync', {
        cn_number: offlineScan.cn_number,
      });
      resolve(offlineScan);
    };

    request.onerror = () => {
      logger.error('OfflineScanning', 'Failed to queue scan', { error: request.error });
      reject(request.error);
    };
  });
}

// Get all pending scans
export async function getPendingScans(): Promise<OfflineScan[]> {
  const database = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('synced');
    const request = index.getAll(IDBKeyRange.only(false));

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Get all scans (for debugging)
export async function getAllScans(): Promise<OfflineScan[]> {
  const database = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Update scan sync status
export async function updateScanStatus(
  id: string,
  updates: Partial<Pick<OfflineScan, 'synced' | 'sync_attempts' | 'last_sync_attempt' | 'error'>>
): Promise<void> {
  const database = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const scan = getRequest.result;
      if (!scan) {
        reject(new Error('Scan not found'));
        return;
      }

      const updatedScan = { ...scan, ...updates };
      const putRequest = store.put(updatedScan);

      putRequest.onsuccess = () => {
        resolve();
      };

      putRequest.onerror = () => {
        reject(putRequest.error);
      };
    };

    getRequest.onerror = () => {
      reject(getRequest.error);
    };
  });
}

// Delete scan from queue
export async function deleteScan(id: string): Promise<void> {
  const database = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Clear all scans
export async function clearAllScans(): Promise<void> {
  const database = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Get sync status
export async function getSyncStatus(): Promise<SyncStatus> {
  const scans = await getAllScans();
  const pending = scans.filter((s) => !s.synced && s.sync_attempts === 0);
  const syncing = scans.filter((s) => !s.synced && s.sync_attempts > 0 && !s.error);
  const failed = scans.filter((s) => s.error);

  return {
    pending: pending.length,
    syncing: syncing.length,
    failed: failed.length,
    lastSync: scans.find((s) => s.synced)?.last_sync_attempt,
    isOnline: navigator.onLine,
  };
}

// Sync scan to server
async function syncScanToServer(scan: OfflineScan): Promise<boolean> {
  try {
    // Dynamic import to avoid circular dependency
    const { supabase } = await import('./supabase');
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('id, org_id')
      .eq('cn_number', scan.cn_number)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    if (shipmentError) {
      throw shipmentError;
    }

    const shipmentLookup = shipment as ShipmentSyncLookupRow | null;
    if (!shipmentLookup) {
      throw new Error(`Shipment not found for offline scan ${scan.cn_number}`);
    }

    const payload: TrackingEventInsert = {
      shipment_id: shipmentLookup.id,
      org_id: shipmentLookup.org_id,
      cn_number: scan.cn_number,
      event_code: scan.event_code,
      event_time: scan.scan_time,
      hub_id: scan.hub_id,
      source: 'OFFLINE_SCAN',
      location: scan.hub_code,
      notes: scan.notes ?? null,
    };

    // Create tracking event
    const { error } = await supabase.from('tracking_events').insert(payload);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    logger.error('OfflineScanning', 'Failed to sync scan', { error });
    throw error;
  }
}

// Sync all pending scans
export async function syncPendingScans(
  onProgress?: (current: number, total: number) => void
): Promise<{ synced: number; failed: number }> {
  const pendingScans = await getPendingScans();
  const total = pendingScans.length;

  if (total === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (let i = 0; i < pendingScans.length; i++) {
    const scan = pendingScans[i];
    onProgress?.(i + 1, total);

    try {
      const success = await syncScanToServer(scan);

      if (success) {
        await updateScanStatus(scan.id, {
          synced: true,
          last_sync_attempt: new Date().toISOString(),
        });
        synced++;
      }
    } catch (error) {
      await updateScanStatus(scan.id, {
        synced: false,
        sync_attempts: scan.sync_attempts + 1,
        last_sync_attempt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      failed++;
    }
  }

  return { synced, failed };
}

// Retry failed scans
export async function retryFailedScans(
  onProgress?: (current: number, total: number) => void
): Promise<{ synced: number; failed: number }> {
  const allScans = await getAllScans();
  const failedScans = allScans.filter((s) => s.error);

  if (failedScans.length === 0) {
    return { synced: 0, failed: 0 };
  }

  // Clear error status for retry
  for (const scan of failedScans) {
    await updateScanStatus(scan.id, { error: undefined });
  }

  return syncPendingScans(onProgress);
}

// Online/offline event handlers
let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startBackgroundSync(intervalMs: number = 60000): void {
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  // Sync when coming online
  window.addEventListener('online', handleOnline);

  // Start periodic sync
  syncInterval = setInterval(async () => {
    if (navigator.onLine) {
      const status = await getSyncStatus();
      if (status.pending > 0 || status.failed > 0) {
        logger.info('OfflineScanning', 'Background sync triggered');
        const result = await syncPendingScans();
        if (result.synced > 0) {
          toast.success(`Synced ${result.synced} offline scans`);
        }
      }
    }
  }, intervalMs);
}

export function stopBackgroundSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  window.removeEventListener('online', handleOnline);
}

async function handleOnline(): Promise<void> {
  logger.info('OfflineScanning', 'Back online, syncing pending scans');
  toast.info('Back online, syncing pending scans...');

  const result = await syncPendingScans();

  if (result.synced > 0) {
    toast.success(`Synced ${result.synced} scans`);
  }
  if (result.failed > 0) {
    toast.error(`Failed to sync ${result.failed} scans`);
  }
}

// Queue visualization helper
export function formatScanQueue(scans: OfflineScan[]): {
  pending: OfflineScan[];
  syncing: OfflineScan[];
  failed: OfflineScan[];
  synced: OfflineScan[];
} {
  return {
    pending: scans.filter((s) => !s.synced && s.sync_attempts === 0),
    syncing: scans.filter((s) => !s.synced && s.sync_attempts > 0 && !s.error),
    failed: scans.filter((s) => s.error),
    synced: scans.filter((s) => s.synced),
  };
}

// Export for use in components
export const offlineScanning = {
  init: initOfflineDB,
  queue: queueScan,
  getPending: getPendingScans,
  getAll: getAllScans,
  updateStatus: updateScanStatus,
  delete: deleteScan,
  clear: clearAllScans,
  getStatus: getSyncStatus,
  sync: syncPendingScans,
  retry: retryFailedScans,
  startSync: startBackgroundSync,
  stopSync: stopBackgroundSync,
};

export default offlineScanning;
