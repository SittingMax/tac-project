import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle2, XCircle, Activity, X } from 'lucide-react';
import { useScanner } from '@/context/useScanner';
import type { ScanDebugEvent } from '@/context/ScanningContext';

interface KeystrokeData {
  key: string;
  timestamp: number;
  delay: number;
}

/**
 * ScannerDebug — Pure subscriber component (no own keydown listener).
 *
 * Consumes keystroke-level data from ScanningProvider via subscribeDebug
 * and scan results via subscribe. This ensures a single source of truth
 * for all scanner detection state.
 */
export function ScannerDebug() {
  const [visible, setVisible] = useState(false);
  const [keystrokes, setKeystrokes] = useState<KeystrokeData[]>([]);
  const [buffer, setBuffer] = useState('');
  const [lastScan, setLastScan] = useState<{
    code: string;
    success: boolean;
    timestamp: number;
  } | null>(null);
  const [scannerDetected, setScannerDetected] = useState(false);
  const [avgTiming, setAvgTiming] = useState<number | null>(null);
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { subscribe, subscribeDebug } = useScanner();

  // Subscribe to completed scan events
  useEffect(() => {
    const unsubscribe = subscribe((code) => {
      setLastScan({
        code,
        success: true,
        timestamp: Date.now(),
      });

      // Clear keystroke display after successful scan
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => {
        setBuffer('');
        setKeystrokes([]);
        setScannerDetected(false);
        setAvgTiming(null);
      }, 2000);
    });

    return unsubscribe;
  }, [subscribe]);

  // Subscribe to debug events from ScanningProvider (single source of truth)
  const handleDebugEvent = useCallback((event: ScanDebugEvent) => {
    if (event.type === 'keystroke') {
      // Update keystroke display
      if (event.key) {
        setKeystrokes((prev) => [
          ...prev.slice(-19),
          { key: event.key!, timestamp: event.timestamp, delay: event.delay ?? 0 },
        ]);
      }
      setBuffer(event.buffer);
      setScannerDetected(event.scannerDetected);

      // Calculate average timing from provider's timings array
      if (event.timings.length > 0) {
        const avg = event.timings.reduce((a, b) => a + b, 0) / event.timings.length;
        setAvgTiming(avg);
      }
    } else if (event.type === 'submit' || event.type === 'reset') {
      // On submit/reset, clear after a delay so user can see final state
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(
        () => {
          setBuffer('');
          setKeystrokes([]);
          setScannerDetected(false);
          setAvgTiming(null);
        },
        event.type === 'submit' ? 2000 : 500
      );
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeDebug(handleDebugEvent);
    return unsubscribe;
  }, [subscribeDebug, handleDebugEvent]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  if (!visible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-accent text-xs"
          onClick={() => setVisible(true)}
        >
          Scanner Debug
        </Badge>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 z-50 shadow-xl border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Scanner Debug
          </span>
          <button
            onClick={() => setVisible(false)}
            className="p-1 rounded-none hover:bg-accent transition-colors"
            aria-label="Close debug panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs font-mono">
        {/* Keystrokes Display */}
        <div>
          <div className="text-muted-foreground mb-1">Keystrokes:</div>
          <div className="bg-muted p-2 rounded-none min-h-[2rem] flex flex-wrap gap-1">
            {keystrokes.length > 0 ? (
              keystrokes.map((k, i) => (
                <span
                  key={i}
                  className={`px-1 rounded-none ${
                    k.delay > 0 && k.delay < 150
                      ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                      : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300'
                  }`}
                  title={`${k.delay}ms`}
                >
                  {k.key}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground">Waiting for input...</span>
            )}
          </div>
        </div>

        {/* Buffer Display */}
        <div>
          <div className="text-muted-foreground mb-1">Buffer:</div>
          <div className="bg-muted p-2 rounded-none min-h-[2rem]">
            {buffer || <span className="text-muted-foreground">Empty</span>}
          </div>
        </div>

        {/* Timing Analysis */}
        <div>
          <div className="text-muted-foreground mb-1">Timing:</div>
          <div className="flex items-center gap-2">
            {avgTiming !== null ? (
              <>
                <Badge variant={scannerDetected ? 'default' : 'secondary'}>
                  {avgTiming.toFixed(0)}ms avg
                </Badge>
                {scannerDetected ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Activity className="w-3 h-3" />
                    Scanner detected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                    <Activity className="w-3 h-3" />
                    Manual input
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">No data</span>
            )}
          </div>
        </div>

        {/* Last Scan Result */}
        <div>
          <div className="text-muted-foreground mb-1">Last Scan:</div>
          <div className="bg-muted p-2 rounded-none min-h-[2rem]">
            {lastScan ? (
              <div className="flex items-center justify-between">
                <span className="truncate flex-1">{lastScan.code}</span>
                {lastScan.success ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 ml-2 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 ml-2 flex-shrink-0" />
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">No scans yet</span>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={keystrokes.length > 0 ? 'default' : 'outline'}>
              {keystrokes.length > 0 ? 'Accumulating...' : 'Ready'}
            </Badge>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-[10px] text-muted-foreground pt-2 border-t">
          <div>• Green highlights: Scanner speed (&lt;150ms)</div>
          <div>• Yellow highlights: Manual speed (&gt;150ms)</div>
          <div>• Data sourced from ScanningProvider (single listener)</div>
        </div>
      </CardContent>
    </Card>
  );
}
