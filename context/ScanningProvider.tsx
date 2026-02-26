import { useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, ScanBarcode, Search } from 'lucide-react';
import { toast } from 'sonner';
import { ScanSource } from '@/types';
import {
  ScanningContext,
  type ScanCallback,
  type DebugCallback,
  type ScanDebugEvent,
} from './ScanningContext';

interface ScanningProviderProps {
  children: ReactNode;
}

// --- Constants ---
// If keystrokes arrive faster than this average, they are from a scanner, not a human.
// Increased from 100ms to 150ms to accommodate various scanner hardware
const SCANNER_SPEED_THRESHOLD_MS = 150;
// Minimum number of characters for a valid scan sequence.
const MIN_SCAN_LENGTH = 3;
// If no key arrives within this window, the buffer is considered stale and reset.
// Increased from 500ms to 1000ms for more robust scanning
const BUFFER_STALE_TIMEOUT_MS = 1000;
// Auto-submit delay for scanners that don't send Enter key
// If no key arrives within this window after scanner-speed input, auto-submit
const AUTO_SUBMIT_DELAY_MS = 100;
// Debug mode: submit buffer regardless of timing detection
const DEBUG_MODE = false; // Set to true to capture all input regardless of speed (DEBUG ONLY)

export function ScanningProvider({ children }: ScanningProviderProps) {
  const [isScanning, setIsScanning] = useState(false);
  const listenersRef = useRef<Set<ScanCallback>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Use refs for values that the keyboard handler needs, to avoid stale closures (BUG 1 fix)
  const isScanningRef = useRef(false);
  const resolveScanRef = useRef<((value: string) => void) | null>(null);
  const rejectScanRef = useRef<((reason?: unknown) => void) | null>(null);

  // Scanner detection state (all in refs to keep the handler closure stable)
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const keyTimingsRef = useRef<number[]>([]); // Inter-key delays for speed detection
  const autoSubmitTimerRef = useRef<NodeJS.Timeout | null>(null); // Auto-submit timer for scanners without Enter

  // Keep the ref in sync with state
  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  const subscribe = useCallback((callback: ScanCallback) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  // Debug event subscribers (used by ScannerDebug component)
  const debugListenersRef = useRef<Set<DebugCallback>>(new Set());

  const subscribeDebug = useCallback((callback: DebugCallback) => {
    debugListenersRef.current.add(callback);
    return () => {
      debugListenersRef.current.delete(callback);
    };
  }, []);

  const emitDebug = useCallback((event: ScanDebugEvent) => {
    debugListenersRef.current.forEach((cb) => {
      try {
        cb(event);
      } catch {
        /* ignore debug errors */
      }
    });
  }, []);

  const notifyListeners = useCallback((data: string, source: ScanSource) => {
    // Audio feedback is handled by the business-logic layer (useScanningLogic / useArrivalAudit)
    // to prevent double/triple beeps.

    if (listenersRef.current.size > 0) {
      listenersRef.current.forEach((cb) => {
        try {
          cb(data, source);
        } catch (e) {
          console.error('[ScanningProvider] Error in listener:', e);
        }
      });
    } else {
      console.warn('[ScanningProvider] No listeners registered for this scan.');
      if (source === ScanSource.BARCODE_SCANNER) {
        toast.success(`Scanned: ${data}`);
      }
    }
  }, []);

  /**
   * Determines if the accumulated key timings indicate scanner-speed input.
   * Uses percentile-based detection for outlier resistance.
   * Scanners typically send keys <50ms apart consistently.
   * Humans rarely sustain <60ms per key for more than 2-3 keys.
   */
  const isScannerSpeed = useCallback((timings: number[]): boolean => {
    if (!timings || timings.length < 1) return false; // Need at least 2 characters (1 interval)

    // Single timing: just check if it's fast enough (early detection)
    if (timings.length === 1) {
      return timings[0] < SCANNER_SPEED_THRESHOLD_MS;
    }

    // Multi-timing: use 75th percentile for outlier resistance
    const sorted = [...timings].sort((a, b) => a - b);
    const p75Index = Math.floor(sorted.length * 0.75);
    const p75 = sorted[p75Index];

    // Also check percentage of fast keystrokes
    const fastCount = timings.filter((t) => t < SCANNER_SPEED_THRESHOLD_MS).length;
    const fastRatio = fastCount / timings.length;

    // Scanner if p75 is fast OR 70%+ of keystrokes are scanner-speed
    return p75 < SCANNER_SPEED_THRESHOLD_MS || fastRatio > 0.7;
  }, []);

  /**
   * Submit the accumulated buffer as a scan
   */
  const submitBuffer = useCallback(
    (clearInput: HTMLElement | null = null) => {
      const buffer = bufferRef.current;
      const timings = keyTimingsRef.current || [];

      // Clear auto-submit timer
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current);
        autoSubmitTimerRef.current = null;
      }

      // In DEBUG_MODE, accept any buffer with minimum length regardless of timing
      const scannerDetected = DEBUG_MODE
        ? buffer && buffer.length >= MIN_SCAN_LENGTH
        : buffer && buffer.length >= MIN_SCAN_LENGTH && isScannerSpeed(timings);

      if (scannerDetected) {
        // eslint-disable-next-line no-console
        console.debug('[ScanningProvider] Scanner detected - submitting:', buffer);

        // If the scan landed in an input field, clear leaked characters.
        // Use native value setter to properly trigger React controlled input updates.
        if (clearInput && clearInput.tagName === 'INPUT' && clearInput !== inputRef.current) {
          const nativeSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set;
          if (nativeSetter) {
            nativeSetter.call(clearInput, '');
          } else {
            (clearInput as HTMLInputElement).value = '';
          }
          clearInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Pass raw buffer directly to listeners
        const cleanCode = buffer.trim();
        notifyListeners(cleanCode, ScanSource.BARCODE_SCANNER);

        // If the scan dialog is open, also resolve the promise
        if (isScanningRef.current && resolveScanRef.current) {
          resolveScanRef.current(cleanCode);
          cleanupInternal();
        }
      }

      // Emit debug event for submission
      emitDebug({
        type: scannerDetected ? 'submit' : 'reset',
        buffer,
        timings: [...timings],
        scannerDetected: !!scannerDetected,
        timestamp: Date.now(),
      });

      // Always reset buffer
      bufferRef.current = '';
      keyTimingsRef.current = [];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notifyListeners, isScannerSpeed, emitDebug]
  ); // cleanupInternal uses refs/setState which are stable

  const cleanupInternal = useCallback(() => {
    isScanningRef.current = false;
    resolveScanRef.current = null;
    rejectScanRef.current = null;
    setIsScanning(false);
  }, []);

  // Keyboard listener for hardware scanners (HID mode) — registered ONCE (BUG 1 fix)
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('[ScanningProvider] Keydown listener attached');

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isScannerInput = target === inputRef.current;

      const currentTime = Date.now();
      const timeSinceLastKey = currentTime - lastKeyTimeRef.current;

      // Reset buffer if stale (no key for BUFFER_STALE_TIMEOUT_MS)
      if (timeSinceLastKey > BUFFER_STALE_TIMEOUT_MS && bufferRef.current.length > 0) {
        emitDebug({
          type: 'reset',
          buffer: bufferRef.current,
          timings: [...keyTimingsRef.current],
          scannerDetected: false,
          timestamp: currentTime,
        });
        bufferRef.current = '';
        keyTimingsRef.current = [];
        if (autoSubmitTimerRef.current) {
          clearTimeout(autoSubmitTimerRef.current);
          autoSubmitTimerRef.current = null;
        }
      }

      lastKeyTimeRef.current = currentTime;

      // Handle terminator keys (Enter / Tab)
      if (e.key === 'Enter' || e.key === 'Tab') {
        const buffer = bufferRef.current;
        const timings = keyTimingsRef.current;

        const scannerDetected = DEBUG_MODE
          ? buffer && buffer.length >= MIN_SCAN_LENGTH
          : buffer && buffer.length >= MIN_SCAN_LENGTH && isScannerSpeed(timings);

        if (scannerDetected) {
          // Prevent the Enter/Tab from doing its default action (form submit, tab navigation)
          e.preventDefault();
          e.stopPropagation();

          // Submit the buffer
          submitBuffer(target);
        }
        // else: Not scanner speed, let the event propagate normally
        // (allows manual Enter in search bars, forms, etc.)

        // Always reset buffer after terminator
        bufferRef.current = '';
        keyTimingsRef.current = [];
        if (autoSubmitTimerRef.current) {
          clearTimeout(autoSubmitTimerRef.current);
          autoSubmitTimerRef.current = null;
        }
        return;
      }

      // Accumulate printable characters
      if (e.key && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Record inter-key timing
        if (bufferRef.current.length > 0) {
          keyTimingsRef.current.push(timeSinceLastKey);
        }
        bufferRef.current += e.key;

        // Clear existing auto-submit timer
        if (autoSubmitTimerRef.current) {
          clearTimeout(autoSubmitTimerRef.current);
          autoSubmitTimerRef.current = null;
        }

        // If we're accumulating in an input that isn't our scanner input,
        // and the speed indicates scanner, prevent the character from going into the input.
        // We do this proactively after accumulating enough evidence.
        if (!isScannerInput && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          const timings = keyTimingsRef.current;
          if (timings && timings.length >= 1 && isScannerSpeed(timings)) {
            // This is likely a scanner — prevent character from entering the focused input
            e.preventDefault();
          }
        }

        // Set auto-submit timer for scanners that don't send Enter key
        // This triggers 100ms after the last character is received
        const timings = keyTimingsRef.current;

        // In DEBUG_MODE, always set auto-submit timer
        // In normal mode, only set if scanner speed detected
        const shouldAutoSubmit =
          DEBUG_MODE || (timings && timings.length >= 1 && isScannerSpeed(timings));

        if (shouldAutoSubmit) {
          autoSubmitTimerRef.current = setTimeout(() => {
            submitBuffer(target);
          }, AUTO_SUBMIT_DELAY_MS);
        }

        // Emit debug event for keystroke
        emitDebug({
          type: 'keystroke',
          key: e.key,
          buffer: bufferRef.current,
          timings: [...keyTimingsRef.current],
          delay: bufferRef.current.length > 1 ? timeSinceLastKey : 0,
          scannerDetected:
            keyTimingsRef.current.length >= 1 && isScannerSpeed(keyTimingsRef.current),
          timestamp: currentTime,
        });
      }
    };

    // Use capture phase so we can intercept before any other handlers
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      // eslint-disable-next-line no-console
      console.debug('[ScanningProvider] Keydown listener removed');
      // Clean up timer on unmount
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current);
      }
    };
  }, [notifyListeners, isScannerSpeed, submitBuffer, emitDebug]); // Stable deps only — no state variables

  const scan = useCallback(() => {
    if (isScanningRef.current) {
      return Promise.reject(new Error('Scan already in progress'));
    }

    return new Promise<string>((resolve, reject) => {
      isScanningRef.current = true;
      resolveScanRef.current = resolve;
      rejectScanRef.current = reject;
      setIsScanning(true);
    });
  }, []);

  const cancelScan = useCallback(() => {
    if (rejectScanRef.current) {
      rejectScanRef.current(new Error('Scan cancelled by user'));
    }
    cleanupInternal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Focus the input when the scanning dialog opens
  useEffect(() => {
    if (isScanning && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isScanning]);

  const handleManualSubmit = () => {
    const value = inputRef.current?.value?.trim();
    if (value && resolveScanRef.current) {
      resolveScanRef.current(value);
      cleanupInternal();
    }
  };

  return (
    <ScanningContext.Provider value={{ scan, isScanning, cancelScan, subscribe, subscribeDebug }}>
      {children}

      <Dialog open={isScanning} onOpenChange={(open) => !open && cancelScan()}>
        <DialogContent
          className="sm:max-w-md p-0 overflow-hidden bg-background border-border gap-0"
          aria-describedby="scan-instructions"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          <DialogDescription className="sr-only">
            Use your barcode scanner or type manually to search.
          </DialogDescription>
          <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-background via-background to-muted/30">
            <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center space-y-4">
              <div className="relative">
                <ScanBarcode className="w-16 h-16 text-primary animate-pulse" />
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
              </div>
              <div className="space-y-4 w-full max-w-xs mx-auto">
                <h3 className="text-lg font-semibold text-foreground">Ready to Scan</h3>
                <p id="scan-instructions" className="text-sm text-muted-foreground">
                  Scan barcode or type manually below.
                </p>
                <DialogTitle className="sr-only">Scanning Interface</DialogTitle>
              </div>
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Scan or type ID..."
                  className="bg-background border-input text-center text-lg h-12 flex-1 focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // Stop propagation so the global handler doesn't also
                      // try to process this as a scanner scan (BUG 7 fix)
                      e.stopPropagation();
                      e.preventDefault();
                      handleManualSubmit();
                    }
                  }}
                />
                <Button
                  onClick={handleManualSubmit}
                  size="icon"
                  className="h-12 w-12 shrink-0"
                  title="Search Manually"
                >
                  <Search className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 hover:bg-accent z-50 pointer-events-auto"
              onClick={cancelScan}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ScanningContext.Provider>
  );
}
