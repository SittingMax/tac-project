import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BarcodeScanner } from '@/components/scanning/BarcodeScanner';
import {
  ScanLine,
  Check,
  X,
  Truck,
  AlertTriangle,
  Camera,
  Keyboard,
  Package,
  PackageCheck,
  ClipboardCheck,
  Send,
  Wifi,
  WifiOff,
  Activity,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { useScanner } from '@/context/useScanner';
import { useScanContext } from '@/context/ScanContext';
import { ScanSource } from '@/types';
import { ScannerDebug } from '@/components/scanning/ScannerDebug';
import { UniversalBarcode } from '@/components/barcodes';
import { useScanningLogic, type ScanMode } from '@/hooks/useScanningLogic';
import { useScanQueue } from '@/store/scanQueueStore';

/* ── Mode Metadata ──────────────────────────────────────────── */
const MODE_META: Record<
  ScanMode,
  { label: string; sub: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  RECEIVE: {
    label: 'Receive',
    sub: 'Inbound scan',
    icon: Package,
    color: 'text-primary',
    bg: 'bg-primary',
    border: 'border-primary/30',
  },
  LOAD_MANIFEST: {
    label: 'Load',
    sub: 'Manifest load',
    icon: Send,
    color: 'text-status-info',
    bg: 'bg-status-info',
    border: 'border-status-info/30',
  },
  VERIFY_MANIFEST: {
    label: 'Verify',
    sub: 'Arrival audit',
    icon: ClipboardCheck,
    color: 'text-status-warning',
    bg: 'bg-status-warning',
    border: 'border-status-warning/30',
  },
  DELIVER: {
    label: 'Deliver',
    sub: 'Last mile',
    icon: PackageCheck,
    color: 'text-status-success',
    bg: 'bg-status-success',
    border: 'border-status-success/30',
  },
};

export const Scanning: React.FC = () => {
  const {
    scannedItems,
    scanMode,
    setScanMode,
    activeManifest,
    setActiveManifest,
    scanCount,
    processScan,
    clearManifest,
  } = useScanningLogic();

  const { pendingScans, isOnline, failedScans } = useScanQueue();

  const [currentCode, setCurrentCode] = useState('');
  const [useCameraScanner, setUseCameraScanner] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Session timer
  const [sessionStart] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState('00:00');
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - sessionStart) / 1000);
      const mins = String(Math.floor(diff / 60)).padStart(2, '0');
      const secs = String(diff % 60).padStart(2, '0');
      setElapsed(`${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  // Global Scanner Context
  const { subscribe } = useScanner();
  const { setActiveContext } = useScanContext();

  useEffect(() => {
    setActiveContext('SCANNING_PAGE');
    return () => setActiveContext('GLOBAL');
  }, [setActiveContext]);

  useEffect(() => {
    const unsubscribe = subscribe((data, source) => {
      processScan(data, source);
      setCurrentCode('');
    });
    return unsubscribe;
  }, [subscribe, processScan]);

  const handleCameraScan = useCallback(
    (result: string) => {
      processScan(result, ScanSource.CAMERA);
    },
    [processScan]
  );

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCode) {
      processScan(currentCode, ScanSource.MANUAL);
      setCurrentCode('');
      inputRef.current?.focus();
    }
  };

  const handleModeSwitch = (mode: ScanMode) => {
    setScanMode(mode);
    setActiveManifest(null);
  };

  const meta = MODE_META[scanMode];
  const totalScans = scanCount.success + scanCount.error;
  const successRate = totalScans > 0 ? Math.round((scanCount.success / totalScans) * 100) : 0;
  const needsManifest =
    (scanMode === 'LOAD_MANIFEST' || scanMode === 'VERIFY_MANIFEST') && !activeManifest;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] animate-in fade-in duration-500">
      {/* ── HEADER ─────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Title + Mode Indicator */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none">
                Terminal<span className={meta.color}>.</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block w-1.5 h-1.5 ${meta.bg} animate-pulse`} />
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {meta.sub}
                </span>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 border border-border">
              <Activity className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground">{totalScans}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-status-success/10 border border-status-success/20">
              <Check className="w-3 h-3 text-status-success" />
              <span className="text-xs font-mono text-status-success">{scanCount.success}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-status-error/10 border border-status-error/20">
              <X className="w-3 h-3 text-status-error" />
              <span className="text-xs font-mono text-status-error">{scanCount.error}</span>
            </div>
            {totalScans > 0 && (
              <Badge variant="outline" className="font-mono text-[10px]">
                {successRate}% pass
              </Badge>
            )}
          </div>

          {/* Mode Selector */}
          <div className="flex gap-0 bg-muted/30 border border-border">
            {(Object.keys(MODE_META) as ScanMode[]).map((mode) => {
              const m = MODE_META[mode];
              const Icon = m.icon;
              const isActive = scanMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => handleModeSwitch(mode)}
                  className={`
                    relative flex items-center gap-1.5 px-3 py-2.5 font-mono uppercase tracking-widest text-[10px]
                    transition-all duration-200 border-b-2
                    ${isActive
                      ? `${m.bg} text-white border-transparent`
                      : 'text-muted-foreground hover:bg-muted/50 border-transparent hover:border-border'
                    }
                  `}
                  aria-pressed={isActive}
                  title={m.sub}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ACTIVE MANIFEST BANNER ─────────────────────── */}
      {(scanMode === 'LOAD_MANIFEST' || scanMode === 'VERIFY_MANIFEST') && activeManifest && (
        <div
          className={`flex-shrink-0 flex items-center justify-between px-6 py-2.5 border-b border-l-4 ${scanMode === 'LOAD_MANIFEST'
            ? 'bg-status-info/5 border-b-border border-l-status-info'
            : 'bg-status-warning/5 border-b-border border-l-status-warning'
            }`}
        >
          <div className="flex items-center gap-3">
            <Truck
              className={`w-4 h-4 ${scanMode === 'LOAD_MANIFEST' ? 'text-status-info' : 'text-status-warning'
                }`}
            />
            <div>
              <span className="text-sm font-bold font-mono text-foreground">
                {activeManifest.manifest_no}
              </span>
              <span className="text-xs text-muted-foreground ml-3">
                {activeManifest.from_hub_id} → {activeManifest.to_hub_id}
              </span>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={clearManifest} className="h-7 w-7 p-0">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* ── MAIN CONTENT ───────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_420px] min-h-0">
        {/* Scanner Viewport */}
        <div className="relative bg-muted/20 border-r border-border overflow-hidden flex flex-col min-h-0">
          {/* Top overlay bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-background/80 to-transparent">
            {/* Camera / Manual toggle */}
            <div className="flex gap-1 bg-background/90 border border-border backdrop-blur-sm">
              <button
                onClick={() => setUseCameraScanner(true)}
                className={`p-2 transition-all ${useCameraScanner
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                title="Camera scanner"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                onClick={() => setUseCameraScanner(false)}
                className={`p-2 transition-all ${!useCameraScanner
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                title="Manual / HID scanner"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile KPIs */}
            <div className="flex md:hidden items-center gap-2 text-xs font-mono">
              <span className="bg-status-success/20 text-status-success px-2 py-1">
                ✓ {scanCount.success}
              </span>
              <span className="bg-status-error/20 text-status-error px-2 py-1">
                ✗ {scanCount.error}
              </span>
            </div>
          </div>

          {/* Viewport content */}
          {useCameraScanner ? (
            <BarcodeScanner
              onScan={handleCameraScan}
              active={true}
              className="flex-1 min-h-[300px]"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center relative">
              {/* Dot grid pattern */}
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Animated scan line */}
              <div className="absolute inset-x-0 top-0 h-full pointer-events-none overflow-hidden">
                <div
                  className="absolute left-[10%] right-[10%] h-[2px] opacity-60"
                  style={{
                    background: `linear-gradient(90deg, transparent, var(--primary), transparent)`,
                    animation: 'scan 3s ease-in-out infinite',
                  }}
                />
              </div>

              {/* Center crosshair */}
              <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="relative">
                  {/* Corner brackets */}
                  <div className="w-32 h-32 relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/50" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary/50" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary/50" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/50" />
                    <ScanLine className="w-10 h-10 text-primary/40 absolute inset-0 m-auto animate-pulse" />
                  </div>
                </div>

                <div className="px-4 py-2 bg-background/80 backdrop-blur-sm border border-border">
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground text-center">
                    {needsManifest ? 'Awaiting manifest scan' : 'HID scanner ready'}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground/60 text-center mt-1">
                    Use keyboard input or connect a barcode scanner
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: Input + Feed ────────────────── */}
        <div className="flex flex-col min-h-0 bg-background">
          {/* Manual Input */}
          <div className="flex-shrink-0 p-4 border-b border-border">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
              <Keyboard className="w-3 h-3" />
              {needsManifest ? 'Enter manifest code' : `Scan ${scanMode === 'DELIVER' ? 'delivery' : 'shipment'}`}
            </label>
            <form onSubmit={handleScanSubmit} className="flex gap-0" data-testid="scan-form">
              <Input
                ref={inputRef}
                placeholder={needsManifest ? 'MAN-XXXX-XXXX...' : 'TAC / CN number...'}
                value={currentCode}
                onChange={(e) => setCurrentCode(e.target.value)}
                autoFocus
                autoComplete="off"
                data-testid="scan-input"
                aria-label="Scan input field"
                id="scan-input"
                name="scan-input"
                className="flex-1 rounded-none border-r-0 font-mono text-xs uppercase h-12 bg-muted/30"
              />
              <Button
                type="submit"
                disabled={!currentCode}
                data-testid="scan-submit-button"
                className="rounded-none font-mono uppercase tracking-widest text-[10px] px-6 h-12"
              >
                Execute
              </Button>
            </form>
          </div>

          {/* Scan Feed */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="px-4 py-3 border-b border-border bg-muted/20 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Activity className="w-3 h-3" />
                  Scan Feed
                </h3>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {scannedItems.length} entries
                </span>
              </div>
            </div>

            <div className="divide-y divide-border">
              {scannedItems.length === 0 ? (
                <div className="p-6 space-y-6">
                  <div className="text-center py-8">
                    <ScanLine className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No scans this session</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      Point your scanner or type a code above
                    </p>
                  </div>

                  {/* Diagnostics (collapsible) */}
                  <div className="border-t border-border pt-4">
                    <button
                      onClick={() => setShowDiagnostics(!showDiagnostics)}
                      className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="font-mono uppercase tracking-widest text-[10px]">
                        🧪 Scanner Diagnostics
                      </span>
                      {showDiagnostics ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                    {showDiagnostics && (
                      <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                        <p className="text-[10px] text-muted-foreground">
                          Scan the barcode below to test your scanner connection:
                        </p>
                        <div className="flex justify-center py-2 bg-white">
                          <UniversalBarcode value="TAC123456789" mode="screen" width={5} height={80} />
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground font-mono">
                          TAC123456789
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                scannedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`
                      flex items-center gap-3 px-4 py-3 border-l-3
                      animate-in slide-in-from-right-4 duration-300
                      ${item.status === 'SUCCESS'
                        ? 'border-l-status-success bg-status-success/5'
                        : 'border-l-status-error bg-status-error/5'
                      }
                      ${idx === 0 ? 'bg-opacity-100' : ''}
                    `}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {item.msg.includes('EXCEPTION') ? (
                        <AlertTriangle className="w-4 h-4 text-status-error" />
                      ) : item.status === 'SUCCESS' ? (
                        <Check className="w-4 h-4 text-status-success" />
                      ) : (
                        <X className="w-4 h-4 text-status-error" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-foreground truncate">
                          {item.code}
                        </span>
                        {idx === 0 && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                            latest
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{item.msg}</p>
                    </div>

                    {/* Timestamp */}
                    <span className="flex-shrink-0 text-[10px] font-mono text-muted-foreground/60">
                      {item.timestamp}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── STATUS BAR ─────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-2 border-t border-border bg-muted/20 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <div className="flex items-center gap-4">
          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 text-status-success" />
                <span className="text-status-success">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-status-error" />
                <span className="text-status-error">Offline</span>
              </>
            )}
          </div>

          {/* Pending sync */}
          {pendingScans.length > 0 && (
            <span className="text-status-warning">
              {pendingScans.length} pending sync
            </span>
          )}

          {/* Failed scans */}
          {failedScans.length > 0 && (
            <span className="text-status-error">
              {failedScans.length} failed
            </span>
          )}

          {/* Session timer */}
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>{elapsed}</span>
          </div>
        </div>

        <button
          onClick={() => setShowDebug(!showDebug)}
          className={`transition-colors ${showDebug ? 'text-primary' : 'hover:text-foreground'}`}
        >
          Scanner Debug {showDebug ? '▲' : '▼'}
        </button>
      </div>

      {/* Scanner Debug Panel */}
      {showDebug && <ScannerDebug />}

      {/* Keyframe for scan-line animation */}
      <style>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
