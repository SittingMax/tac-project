import { useState, useCallback, useRef, useEffect } from 'react';
import { useScanQueue } from '@/store/scanQueueStore';
import { useAuthStore } from '@/store/authStore';
import { useUpdateShipmentStatus, useFindShipmentByCN } from '@/hooks/useShipments';
import {
    useFindManifestByCode,
    useCheckManifestItem,
    ManifestLookupResult,
} from '@/hooks/useManifests';
import { useCreateException } from '@/hooks/useExceptions';
import { manifestService } from '@/lib/services/manifestService';
import {
    playSuccessFeedback,
    playErrorFeedback,
    playWarningFeedback,
    playManifestActivatedFeedback,
} from '@/lib/feedback';
import { parseScanInput } from '@/lib/scanParser';
import { ScanSource } from '@/types';

export type ScanMode = 'RECEIVE' | 'DELIVER' | 'LOAD_MANIFEST' | 'VERIFY_MANIFEST';

export interface ActiveManifest {
    id: string;
    manifest_no: string;
    from_hub_id: string;
    to_hub_id: string;
    status: string;
}

export function useScanningLogic() {
    const [scannedItems, setScannedItems] = useState<
        { code: string; status: 'SUCCESS' | 'ERROR'; msg: string; timestamp: string }[]
    >([]);
    const [scanMode, setScanMode] = useState<ScanMode>('RECEIVE');
    const [activeManifest, setActiveManifest] = useState<ActiveManifest | null>(null);
    const [scanCount, setScanCount] = useState({ success: 0, error: 0 });

    // Offline queue
    const { addScan, pendingScans, isOnline, syncPending } = useScanQueue();

    // Mutations
    const updateStatus = useUpdateShipmentStatus();
    const findManifest = useFindManifestByCode();
    const findShipment = useFindShipmentByCN();
    const checkManifestItem = useCheckManifestItem();
    const createException = useCreateException();
    const staffUser = useAuthStore((state) => state.user);

    // Stable refs
    const updateStatusRef = useRef(updateStatus);
    updateStatusRef.current = updateStatus;
    const findManifestRef = useRef(findManifest);
    findManifestRef.current = findManifest;
    const findShipmentRef = useRef(findShipment);
    findShipmentRef.current = findShipment;
    const checkManifestItemRef = useRef(checkManifestItem);
    checkManifestItemRef.current = checkManifestItem;
    const createExceptionRef = useRef(createException);
    createExceptionRef.current = createException;
    const staffUserRef = useRef(staffUser);
    staffUserRef.current = staffUser;
    const scanModeRef = useRef(scanMode);
    scanModeRef.current = scanMode;
    const activeManifestRef = useRef(activeManifest);
    activeManifestRef.current = activeManifest;
    const isOnlineRef = useRef(isOnline);
    isOnlineRef.current = isOnline;
    const addScanRef = useRef(addScan);
    addScanRef.current = addScan;

    useEffect(() => {
        if (isOnline && pendingScans.length > 0) {
            syncPending();
        }
    }, [isOnline, pendingScans.length, syncPending]);

    const addScanResult = useCallback(
        (
            code: string,
            status: 'SUCCESS' | 'ERROR',
            msg: string,
            feedbackType?: 'manifest' | 'duplicate'
        ) => {
            const timestamp = new Date().toLocaleTimeString();
            setScannedItems((prev) => [{ code, status, msg, timestamp }, ...prev]);
            setScanCount((prev) => ({
                success: status === 'SUCCESS' ? prev.success + 1 : prev.success,
                error: status === 'ERROR' ? prev.error + 1 : prev.error,
            }));

            // Play audio/haptic feedback
            if (feedbackType === 'manifest') {
                playManifestActivatedFeedback();
            } else if (feedbackType === 'duplicate') {
                playWarningFeedback();
            } else if (status === 'SUCCESS') {
                playSuccessFeedback();
            } else {
                playErrorFeedback();
            }
        },
        []
    );

    // Bug 4 fix: guard against concurrent async scan execution
    const isProcessingRef = useRef(false);

    const processScan = useCallback(
        async (input: string, source: ScanSource = ScanSource.MANUAL) => {
            // Guard against concurrent scans (rapid HID scanner can fire before first resolves)
            if (isProcessingRef.current) {
                addScanResult(input, 'ERROR', 'Scan in progress, try again');
                return;
            }
            isProcessingRef.current = true;

            let scanResult;
            // eslint-disable-next-line no-console
            console.debug('[Scanning Context] Processing scan:', { input, source });
            try {
                scanResult = parseScanInput(input);
                // eslint-disable-next-line no-console
                console.debug('[Scanning Context] Parsed result:', scanResult);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.warn('[Scanning Context] Parser error (using raw fallthrough):', e);
                scanResult = { type: 'shipment' as const, awb: input.trim().toUpperCase(), raw: input };
            }

            try {
                const currentScanMode = scanModeRef.current;
                const currentActiveManifest = activeManifestRef.current;
                const currentIsOnline = isOnlineRef.current;

                // Handle Manifest scans
                if (scanResult.type === 'manifest') {
                    if (!currentActiveManifest) {
                        try {
                            const manifest = await findManifestRef.current.mutateAsync(
                                scanResult.manifestId || scanResult.manifestNo || input
                            );

                            if (!manifest) {
                                addScanResult(input, 'ERROR', 'Manifest not found');
                                return;
                            }

                            const m = manifest as ManifestLookupResult;
                            if (currentScanMode === 'LOAD_MANIFEST' && m.status !== 'OPEN') {
                                addScanResult(input, 'ERROR', `Manifest is ${m.status}, cannot load.`);
                                return;
                            }

                            if (currentScanMode === 'VERIFY_MANIFEST' && m.status !== 'DEPARTED') {
                                addScanResult(input, 'ERROR', `Manifest is ${m.status}, cannot verify.`);
                                return;
                            }

                            setActiveManifest(m);
                            const action = currentScanMode === 'LOAD_MANIFEST' ? 'load packages' : 'verify arrival';
                            addScanResult(
                                m.manifest_no,
                                'SUCCESS',
                                `Manifest active. Ready to ${action}.`,
                                'manifest'
                            );
                        } catch (err) {
                            addScanResult(
                                input,
                                'ERROR',
                                err instanceof Error ? err.message : 'Failed to load manifest'
                            );
                        }
                    }
                    return;
                }

                // Handle Shipment scans
                const awb = scanResult.awb;
                if (!awb) {
                    addScanResult(input, 'ERROR', 'No AWB found in scan');
                    return;
                }

                // Offline flow
                if (!currentIsOnline) {
                    addScanRef.current({
                        awb,
                        mode: currentScanMode,
                        manifestId: currentActiveManifest?.id,
                        source,
                    });
                    addScanResult(awb, 'SUCCESS', 'Queued for sync (offline)');
                    return;
                }

                try {
                    const shipment = await findShipmentRef.current.mutateAsync(awb);

                    if (!shipment) {
                        addScanResult(awb, 'ERROR', 'Shipment not found in system.');
                        return;
                    }

                    if (currentScanMode === 'RECEIVE') {
                        const newStatus =
                            shipment.status === 'CREATED' ? 'RECEIVED_AT_ORIGIN' : 'RECEIVED_AT_DEST';
                        await updateStatusRef.current.mutateAsync({ id: shipment.id, status: newStatus });
                        addScanResult(awb, 'SUCCESS', `Status updated to ${newStatus}`);
                    } else if (currentScanMode === 'LOAD_MANIFEST') {
                        if (!currentActiveManifest) throw new Error('No Active Manifest.');
                        const response = await manifestService.addShipmentByScan(currentActiveManifest.id, awb, {
                            staffId: staffUserRef.current?.id ?? undefined,
                            scanSource: source,
                        });

                        if (!response.success) {
                            addScanResult(awb, 'ERROR', response.message || 'Failed to add to manifest');
                            return;
                        }

                        if (response.duplicate) {
                            addScanResult(awb, 'SUCCESS', response.message || 'Already in manifest', 'duplicate');
                            return;
                        }

                        await updateStatusRef.current.mutateAsync({ id: shipment.id, status: 'IN_TRANSIT' });
                        addScanResult(awb, 'SUCCESS', `Loaded to ${currentActiveManifest.manifest_no}`);
                    } else if (currentScanMode === 'VERIFY_MANIFEST') {
                        if (!currentActiveManifest) throw new Error('No Active Manifest.');

                        const isInManifest = await checkManifestItemRef.current.mutateAsync({
                            manifest_id: currentActiveManifest.id,
                            shipment_id: shipment.id,
                        });

                        if (isInManifest) {
                            await updateStatusRef.current.mutateAsync({
                                id: shipment.id,
                                status: 'RECEIVED_AT_DEST',
                            });
                            addScanResult(awb, 'SUCCESS', 'Verified & Received');
                        } else {
                            await createExceptionRef.current.mutateAsync({
                                shipment_id: shipment.id,
                                cn_number: awb,
                                type: 'MISROUTE',
                                severity: 'HIGH',
                                description: `Scanned with Manifest ${currentActiveManifest.manifest_no} but not listed.`,
                            });
                            addScanResult(awb, 'ERROR', 'EXCEPTION: Shipment not in Manifest!');
                        }
                    } else if (currentScanMode === 'DELIVER') {
                        await updateStatusRef.current.mutateAsync({ id: shipment.id, status: 'DELIVERED' });
                        addScanResult(awb, 'SUCCESS', 'Marked as Delivered');
                    }
                } catch (err: unknown) {
                    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                    addScanResult(awb, 'ERROR', errorMessage);
                }
            } finally {
                isProcessingRef.current = false;
            }
        },
        [addScanResult]
    );

    const clearManifest = () => {
        setActiveManifest(null);
        setScannedItems([]);
    };

    return {
        scannedItems,
        scanMode,
        setScanMode,
        activeManifest,
        setActiveManifest,
        scanCount,
        processScan,
        clearManifest,
    };
}
