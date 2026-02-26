import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useArrivalAudit } from '@/hooks/useArrivalAudit';
import { useScanner } from '@/context/useScanner';
import { useScanContext } from '@/context/ScanContext';
import { AuditStatsPanel } from '@/components/audits/AuditStatsPanel';
import { ExpectedShipmentsList } from '@/components/audits/ExpectedShipmentsList';
import { BarcodeScanner } from '@/components/scanning/BarcodeScanner';
import { ScanSource } from '@/types';
import { Camera, Keyboard, ScanLine, X, AlertTriangle, UserCheck } from 'lucide-react';
import { ScannerDebug } from '@/components/scanning/ScannerDebug';

export const ArrivalAudit: React.FC = () => {
  const {
    activeManifestId,
    manifest,
    items,
    stats,
    isScanning: isProcessingScan,
    processScan,
    clearManifest,
  } = useArrivalAudit();

  const [currentCode, setCurrentCode] = useState('');
  const [useCameraScanner, setUseCameraScanner] = useState(false);
  const [errorInput, setErrorInput] = useState<string | null>(null);

  // Global Scanner Context
  const { subscribe } = useScanner();
  const { setActiveContext } = useScanContext();

  // Register as active scan context (prevents global navigation)
  useEffect(() => {
    setActiveContext('SCANNING_PAGE');
    return () => setActiveContext('GLOBAL');
  }, [setActiveContext]);

  // Subscribe to global scanner events
  useEffect(() => {
    const unsubscribe = subscribe((data, source) => {
      setErrorInput(null);
      processScan(data, source).catch((err) => setErrorInput(err.message));
      setCurrentCode('');
    });
    return unsubscribe;
  }, [subscribe, processScan]);

  const handleCameraScan = useCallback(
    (result: string) => {
      setErrorInput(null);
      processScan(result, ScanSource.CAMERA).catch((err) => setErrorInput(err.message));
    },
    [processScan]
  );

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCode) {
      setErrorInput(null);
      processScan(currentCode, ScanSource.MANUAL).catch((err) => setErrorInput(err.message));
      setCurrentCode('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-24 h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-border/40 pb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground flex items-center gap-2.5">
            Arrival Audit<span className="text-primary">.</span>
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-2">
            Warehouse Manifest Reconciliation
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Left Column: Scanner and Input */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Active Manifest Header Card */}
          {activeManifestId ? (
            <Card className="p-6 rounded-none border border-primary/30 bg-primary/5 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-primary mb-1">
                    Active Manifest
                  </div>
                  <div className="text-2xl font-black font-mono tracking-tighter text-foreground">
                    {manifest?.manifest_no}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none border-primary/20 text-primary hover:bg-primary/10"
                  onClick={clearManifest}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm bg-background border border-border/50 p-4">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    Origin Hub
                  </div>
                  <div className="font-bold">{manifest?.from_hub?.name}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    Destination Hub
                  </div>
                  <div className="font-bold text-primary">{manifest?.to_hub?.name}</div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 rounded-none border border-status-info/30 bg-status-info/5 flex flex-col border-dashed group">
              <div className="flex items-center gap-4 text-status-info/80">
                <ScanLine className="w-8 h-8 group-hover:animate-pulse" />
                <div>
                  <div className="text-lg font-bold">No Active Manifest</div>
                  <div className="text-xs opacity-80 mt-1 uppercase tracking-widest font-mono">
                    Scan a manifest barcode or enter its ID to begin tally.
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card className="relative overflow-hidden flex flex-col border border-border bg-background shadow-none rounded-none flex-1 min-h-[350px]">
            {/* Toggle Camera/Manual */}
            <div className="absolute top-4 left-4 z-20 flex gap-2">
              <button
                onClick={() => setUseCameraScanner(true)}
                className={`p-2 rounded-none transition-all ${useCameraScanner ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                title="Use Webcam Scanner"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                onClick={() => setUseCameraScanner(false)}
                className={`p-2 rounded-none transition-all ${!useCameraScanner ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                title="Use Hardware Scanner"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            </div>

            {useCameraScanner ? (
              <BarcodeScanner
                onScan={handleCameraScan}
                active={true}
                className="flex-1 w-full h-full"
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-muted/5 relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-luminosity"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center mb-6">
                    <ScanLine
                      className={`w-10 h-10 text-primary ${isProcessingScan ? 'animate-pulse' : ''}`}
                    />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground uppercase">
                    Ready to Scan
                  </h3>
                  <p className="text-muted-foreground text-sm mt-2 text-center max-w-[250px]">
                    Use your hardware barcode scanner to scan incoming packages.
                  </p>
                </div>

                {/* Manual Input Fallback */}
                <div className="w-full absolute bottom-0 left-0 p-4 bg-background border-t border-border z-20">
                  <form onSubmit={handleScanSubmit} className="flex gap-0">
                    <Input
                      placeholder={activeManifestId ? 'SCAN PACKAGE CN...' : 'SCAN MANIFEST REF...'}
                      value={currentCode}
                      onChange={(e) => setCurrentCode(e.target.value)}
                      autoFocus
                      autoComplete="off"
                      className="flex-1 rounded-none border-r-0 font-mono text-xs uppercase h-12 bg-muted/20"
                    />
                    <Button
                      type="submit"
                      disabled={!currentCode || isProcessingScan}
                      className="rounded-none font-mono uppercase tracking-widest text-xs px-6 h-12"
                    >
                      Submit
                    </Button>
                  </form>
                  {errorInput && (
                    <div className="mt-2 text-[10px] text-status-error font-mono uppercase truncate flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      {errorInput}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Tally / Stats */}
        <div className="flex flex-col gap-4 min-h-0 opacity-100 transition-opacity duration-500">
          {activeManifestId ? (
            <>
              <AuditStatsPanel stats={stats} />
              <ExpectedShipmentsList items={items} />
            </>
          ) : (
            <Card className="flex-1 rounded-none border border-border bg-background flex flex-col items-center justify-center p-8 text-center border-dashed">
              <UserCheck className="w-16 h-16 text-muted-foreground mb-6 opacity-20" />
              <h3 className="text-2xl font-black font-mono tracking-tighter text-foreground mb-2">
                Awaiting Manifest
              </h3>
              <p className="text-muted-foreground text-sm max-w-[300px]">
                Please scan a manifest barcode or enter a manifest ID to retrieve the list of
                expected shipments.
              </p>
            </Card>
          )}
        </div>
      </div>

      <ScannerDebug />
    </div>
  );
};
