/**
 * useManifestScan Hook
 * Dedicated hook for barcode scanning operations in manifest building
 *
 * Features:
 * - Keyboard wedge scanner support (external barcode scanner)
 * - Manual entry support
 * - Camera scanning integration (placeholder for future)
 * - Scan debouncing and buffering
 * - Audio/visual feedback
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { manifestService, type ScanResponse } from '@/lib/services/manifestService';
import { ScanSource } from '@/types';
import { parseScanInput } from '@/lib/scanParser';
import { useScanner } from '@/context/useScanner';
import { playSuccessFeedback, playWarningFeedback, playErrorFeedback } from '@/lib/feedback';

export interface ScanOptions {
  manifestId: string;
  staffId?: string;
  validateDestination?: boolean;
  validateStatus?: boolean;
  onSuccess?: (result: ScanResponse) => void;
  onError?: (result: ScanResponse) => void;
  onDuplicate?: (result: ScanResponse) => void;
  playSound?: boolean;
  debounceMs?: number;
}

export interface ScanState {
  isScanning: boolean;
  lastResult: ScanResponse | null;
  scanCount: number;
  successCount: number;
  errorCount: number;
  duplicateCount: number;
  scanHistory: ScanHistoryEntry[];
}

export interface ScanHistoryEntry extends ScanResponse {
  timestamp: string;
  scanSource: ScanSource;
}

const SCAN_DEBOUNCE_MS = 50;

export function useManifestScan(options: ScanOptions) {
  const {
    manifestId,
    staffId,
    validateDestination = true,
    validateStatus = true,
    onSuccess,
    onError,
    onDuplicate,
    playSound = true,
    debounceMs = SCAN_DEBOUNCE_MS,
  } = options;

  const { subscribe } = useScanner();

  const [state, setState] = useState<ScanState>({
    isScanning: false,
    lastResult: null,
    scanCount: 0,
    successCount: 0,
    errorCount: 0,
    duplicateCount: 0,
    scanHistory: [],
  });

  // Refs for debouncing and keyboard buffer
  const lastScanTimeRef = useRef<number>(0);

  // Audio/haptic feedback — delegates to the shared singleton in lib/feedback.ts
  // to avoid Mobile Safari's 6-AudioContext limit.
  const playBeep = useCallback(
    (type: 'success' | 'error' | 'duplicate') => {
      if (!playSound) return;
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
    },
    [playSound]
  );

  // Core scan function
  const processScan = useCallback(
    async (scanToken: string, source: ScanSource = ScanSource.MANUAL): Promise<ScanResponse> => {
      const trimmed = scanToken.trim();
      if (!trimmed) {
        return { success: false, error: 'EMPTY_SCAN', message: 'Empty scan token' };
      }

      let parsedToken: string;
      try {
        const parsed = parseScanInput(trimmed);
        if (parsed.type !== 'shipment' || !parsed.awb) {
          return {
            success: false,
            error: 'INVALID_SCAN_TYPE',
            message: 'Only shipment AWB scans are supported in manifest build',
          };
        }
        parsedToken = parsed.awb;
      } catch {
        // Parser threw — normalize the raw token ourselves (uppercase, trim)
        parsedToken = trimmed.toUpperCase();
      }

      // Debounce rapid scans
      const now = Date.now();
      if (now - lastScanTimeRef.current < debounceMs) {
        return { success: false, error: 'DEBOUNCED', message: 'Scan too fast, debounced' };
      }
      lastScanTimeRef.current = now;

      setState((s) => ({ ...s, isScanning: true, scanCount: s.scanCount + 1 }));

      try {
        const result = await manifestService.addShipmentByScan(manifestId, parsedToken, {
          staffId,
          scanSource: source,
          validateDestination,
          validateStatus,
        });

        const historyEntry: ScanHistoryEntry = {
          ...result,
          timestamp: new Date().toISOString(),
          scanSource: source,
        };

        setState((s) => ({
          ...s,
          isScanning: false,
          lastResult: result,
          successCount: result.success && !result.duplicate ? s.successCount + 1 : s.successCount,
          errorCount: !result.success ? s.errorCount + 1 : s.errorCount,
          duplicateCount: result.duplicate ? s.duplicateCount + 1 : s.duplicateCount,
          scanHistory: [historyEntry, ...s.scanHistory].slice(0, 50),
        }));

        // Feedback
        if (result.success) {
          if (result.duplicate) {
            playBeep('duplicate');
            onDuplicate?.(result);
          } else {
            playBeep('success');
            onSuccess?.(result);
          }
        } else {
          playBeep('error');
          onError?.(result);
        }

        return result;
      } catch (error) {
        // Handle AbortError gracefully - this happens during component unmount or query cancellation
        if (
          error instanceof Error &&
          (error.name === 'AbortError' || error.message.includes('aborted'))
        ) {
          const abortResult: ScanResponse = {
            success: false,
            error: 'REQUEST_CANCELLED',
            message: 'Request was cancelled. Please try again.',
          };
          setState((s) => ({ ...s, isScanning: false }));
          return abortResult;
        }

        const errorResult: ScanResponse = {
          success: false,
          error: 'SYSTEM_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        };

        const historyEntry: ScanHistoryEntry = {
          ...errorResult,
          timestamp: new Date().toISOString(),
          scanSource: source,
        };

        setState((s) => ({
          ...s,
          isScanning: false,
          lastResult: errorResult,
          errorCount: s.errorCount + 1,
          scanHistory: [historyEntry, ...s.scanHistory].slice(0, 50),
        }));

        playBeep('error');
        onError?.(errorResult);
        return errorResult;
      }
    },
    [
      manifestId,
      staffId,
      validateDestination,
      validateStatus,
      debounceMs,
      playBeep,
      onSuccess,
      onError,
      onDuplicate,
    ]
  );

  // Manual scan (from input field)
  const scanManual = useCallback(
    (token: string) => processScan(token, ScanSource.MANUAL),
    [processScan]
  );

  // Listen to global scanner events
  useEffect(() => {
    const unsubscribe = subscribe((token, source) => {
      // Only process barcode scans automatically
      // Manual/Camera scans are handled by their respective UI inputs/actions
      if (source === 'BARCODE_SCANNER') {
        processScan(token, source);
      }
    });

    return () => unsubscribe();
  }, [subscribe, processScan]);

  // Barcode scanner scan (keyboard wedge)
  const scanBarcode = useCallback(
    (token: string) => processScan(token, ScanSource.BARCODE_SCANNER),
    [processScan]
  );

  // Camera scan
  const scanCamera = useCallback(
    (token: string) => processScan(token, ScanSource.CAMERA),
    [processScan]
  );

  // Reset stats
  const resetStats = useCallback(() => {
    setState({
      isScanning: false,
      lastResult: null,
      scanCount: 0,
      successCount: 0,
      errorCount: 0,
      duplicateCount: 0,
      scanHistory: [],
    });
  }, []);

  return {
    // State
    ...state,

    // Actions
    scanManual,
    scanBarcode,
    scanCamera,
    processScan,
    resetStats,

    // Utilities
    normalizeScanToken: manifestService.normalizeScanToken,
    isValidAwbFormat: manifestService.isValidAwbFormat,
  };
}

/**
 * Hook for scan input field with auto-submit
 */
export function useScanInput(
  options: ScanOptions & { inputRef?: React.RefObject<HTMLInputElement | null> }
) {
  const { inputRef, ...scanOptions } = options;
  const [inputValue, setInputValue] = useState('');
  const scanner = useManifestScan(scanOptions);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!inputValue.trim()) return;

      await scanner.scanManual(inputValue);

      // Always clear input for next scan (success, error, or duplicate)
      setInputValue('');
      // Refocus input for next scan
      inputRef?.current?.focus();
    },
    [inputValue, scanner, inputRef]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return {
    ...scanner,
    inputValue,
    setInputValue,
    handleChange,
    handleKeyDown,
    handleSubmit,
  };
}

export default useManifestScan;
