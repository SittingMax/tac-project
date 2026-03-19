import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { PageContainer, PageHeader } from '@/components/ui-core/layout';
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

  // Use a local ref to synchronously prevent double-processing before state updates
  const scanLockRef = useRef(false);

  // Subscribe to global scanner events
  useEffect(() => {
    const unsubscribe = subscribe((data, source) => {
      if (isProcessingScan || scanLockRef.current) return;
      scanLockRef.current = true;
      setErrorInput(null);
      processScan(data, source)
        .catch((err) => setErrorInput(err.message))
        .finally(() => {
          scanLockRef.current = false;
        });
      setCurrentCode('');
    });
    return unsubscribe;
  }, [subscribe, processScan, isProcessingScan]);

  const handleCameraScan = useCallback(
    (result: string) => {
      if (isProcessingScan || scanLockRef.current) return;
      scanLockRef.current = true;
      setErrorInput(null);
      processScan(result, ScanSource.CAMERA)
        .catch((err) => setErrorInput(err.message))
        .finally(() => {
          scanLockRef.current = false;
        });
    },
    [processScan, isProcessingScan]
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
    <PageContainer>
      {/* Header */}
      <PageHeader title="Arrival Audit" description="Warehouse manifest reconciliation" />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Left Column: Scanner and Input */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Active Manifest Header Card */}
          {activeManifestId ? (
            <Card className="p-6 border border-primary/30 bg-primary/5 flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs text-primary mb-1">Active Manifest</div>
                  <div className="text-xl font-semibold font-mono text-foreground">
                    {manifest?.manifest_no}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary/20 text-primary hover:bg-primary/10"
                  onClick={clearManifest}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm bg-background border border-border/50 rounded-md p-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Origin Hub</div>
                  <div className="font-medium">{manifest?.from_hub?.name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Destination Hub</div>
                  <div className="font-medium text-primary">{manifest?.to_hub?.name}</div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 border border-status-info/30 bg-status-info/5 flex flex-col border-dashed group">
              <div className="flex items-center gap-4 text-status-info/80">
                <ScanLine size={32} strokeWidth={1.5} className="group-hover:animate-pulse" />
                <div>
                  <div className="text-lg font-semibold">No Active Manifest</div>
                  <div className="text-xs opacity-80 mt-1">
                    Scan a manifest barcode or enter its ID to begin tally.
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card className="relative overflow-hidden flex flex-col border border-border bg-background flex-1 min-h-[350px]">
            {/* Toggle Camera/Manual */}
            <div className="absolute top-4 left-4 z-20 flex gap-2">
              <button
                onClick={() => setUseCameraScanner(true)}
                className={`p-2 rounded-md transition ${useCameraScanner ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                title="Use Webcam Scanner"
              >
                <Camera size={16} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setUseCameraScanner(false)}
                className={`p-2 rounded-md transition ${!useCameraScanner ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                title="Use Hardware Scanner"
              >
                <Keyboard size={16} strokeWidth={1.5} />
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
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">
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
                      placeholder={activeManifestId ? 'Scan package CN...' : 'Scan manifest ref...'}
                      value={currentCode}
                      onChange={(e) => setCurrentCode(e.target.value)}
                      autoFocus
                      autoComplete="off"
                      className="flex-1 h-12 bg-muted/20"
                    />
                    <Button
                      type="submit"
                      disabled={!currentCode || isProcessingScan}
                      className="px-6 h-12"
                    >
                      Submit
                    </Button>
                  </form>
                  {errorInput && (
                    <div className="mt-2 text-xs text-status-error truncate flex items-center gap-1">
                      <AlertTriangle size={12} strokeWidth={1.5} className="shrink-0" />
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
            <Card className="flex-1 border border-border bg-background flex flex-col items-center justify-center p-8 text-center border-dashed">
              <UserCheck className="w-16 h-16 text-muted-foreground mb-6 opacity-20" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Awaiting Manifest</h3>
              <p className="text-muted-foreground text-sm max-w-[300px]">
                Please scan a manifest barcode or enter a manifest ID to retrieve the list of
                expected shipments.
              </p>
            </Card>
          )}
        </div>
      </div>

      <ScannerDebug />
    </PageContainer>
  );
};
