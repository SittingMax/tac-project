import * as React from 'react';
import {
  Camera,
  CheckCircle2,
  Keyboard,
  Scan,
  XCircle,
  AlertCircle,
  RotateCcw,
  Package,
  ArrowRight,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarcodeScanner } from '@/components/scanning/BarcodeScanner';
import { cn } from '@/lib/utils';
import { useScanInput } from '@/hooks/useManifestScan';
import type { ScanResponse } from '@/lib/services/manifestService';
import type { ManifestScanMode, ManifestRules } from '../manifest-builder.types';
import { ManifestScanLog } from '../ManifestScanLog';
import { ManifestShipmentsTable } from '../ManifestShipmentsTable';
import type { ManifestItemWithShipment } from '@/lib/services/manifestService';

interface StepAddShipmentsProps {
  manifestId: string;
  staffId?: string;
  rules: ManifestRules;
  items: ManifestItemWithShipment[];
  fromHub?: { code: string; name: string } | null;
  toHub?: { code: string; name: string } | null;
  isLoading?: boolean;
  isEditable?: boolean;
  onItemsChanged?: () => void;
  onRemove?: (shipmentId: string) => void;
  onViewShipment?: (shipmentId: string) => void;
}

export function StepAddShipments({
  manifestId,
  staffId,
  rules,
  items,
  fromHub,
  toHub,
  isLoading = false,
  isEditable = true,
  onItemsChanged,
  onRemove,
  onViewShipment,
}: StepAddShipmentsProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [scanMode, setScanMode] = React.useState<ManifestScanMode>('manual');

  const scanner = useScanInput({
    manifestId,
    staffId,
    validateDestination: rules.matchDestination,
    validateStatus: rules.onlyReady,
    inputRef,
    onSuccess: () => {
      onItemsChanged?.();
    },
    onDuplicate: () => {
      onItemsChanged?.();
    },
    playSound: true,
  });

  React.useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [scanMode]);

  const getResultIcon = (result: ScanResponse | null) => {
    if (!result) return null;
    if (result.success && !result.duplicate) {
      return <CheckCircle2 size={16} strokeWidth={1.5} className="text-status-success" />;
    }
    if (result.duplicate) {
      return <AlertCircle size={16} strokeWidth={1.5} className="text-status-warning" />;
    }
    return <XCircle size={16} strokeWidth={1.5} className="text-status-error" />;
  };

  const totalWeight = items.reduce((sum, item) => sum + (item.shipment?.total_weight || 0), 0);
  const totalPieces = items.reduce(
    (sum, item) => sum + (item.shipment?.package_count || item.shipment?.total_packages || 0),
    0
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Route Banner */}
      {fromHub && toHub && (
        <div className="flex items-center gap-4 px-4 py-2 rounded-md bg-primary/10 border border-primary/20">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Route</span>
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="font-mono">{fromHub.code}</span>
            <span className="text-muted-foreground">{fromHub.name}</span>
            <ArrowRight size={16} strokeWidth={1.5} className="text-primary" />
            <span className="font-mono">{toHub.code}</span>
            <span className="text-muted-foreground">{toHub.name}</span>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12 h-[calc(100vh-250px)] min-h-[500px]">
        {/* Left Panel: Scan Controls */}
        <div className="lg:col-span-5 flex flex-col gap-4 flex flex-col h-full overflow-hidden">
          <Card className="border-border bg-card/50 shrink-0 transition duration-300 hover:shadow-sm hover:border-border/80 relative">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Scan size={16} strokeWidth={1.5} className="text-primary" />
                Scan Controls
              </CardTitle>
              <CardDescription>Scan CN / Barcode to add shipments</CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0 flex flex-col gap-3">
              <Tabs
                value={scanMode}
                onValueChange={(value) => setScanMode(value as ManifestScanMode)}
                className="w-full"
              >
                <TabsList className="w-full flex">
                  <TabsTrigger value="manual" className="flex-1 flex gap-2">
                    <Keyboard size={16} strokeWidth={1.5} />
                    <span>Type</span>
                  </TabsTrigger>
                  <TabsTrigger value="scanner" className="flex-1 flex gap-2">
                    <Scan size={16} strokeWidth={1.5} />
                    <span>Scan</span>
                  </TabsTrigger>
                  <TabsTrigger value="camera" className="flex-1 flex gap-2">
                    <Camera size={16} strokeWidth={1.5} />
                    <span>Lens</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="mt-4 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <form onSubmit={scanner.handleSubmit}>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            ref={inputRef}
                            type="text"
                            placeholder="Scan or ENTER CN..."
                            value={scanner.inputValue}
                            onChange={scanner.handleChange}
                            onKeyDown={scanner.handleKeyDown}
                            disabled={scanner.isScanning}
                            className={cn(
                              'pr-10 font-mono text-sm h-8',
                              scanner.isScanning && 'animate-pulse'
                            )}
                            autoComplete="off"
                            autoFocus
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {scanner.isScanning ? (
                              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                              getResultIcon(scanner.lastResult)
                            )}
                          </div>
                        </div>
                        <Button
                          type="submit"
                          disabled={scanner.isScanning || !scanner.inputValue.trim()}
                          className="h-8 px-4 text-sm"
                        >
                          Add
                        </Button>
                      </div>
                    </form>
                    <p className="text-xs text-muted-foreground">
                      Scan using barcode gun or paste CN and press Enter
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="scanner" className="mt-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-muted/50 rounded-md">
                    <Keyboard size={16} strokeWidth={1.5} />
                    USB scanner active. Keep input focused.
                  </div>
                  <form
                    onSubmit={scanner.handleSubmit}
                    className="mt-2 opacity-0 h-0 overflow-hidden"
                  >
                    <Input
                      ref={inputRef}
                      value={scanner.inputValue}
                      onChange={scanner.handleChange}
                      autoFocus
                    />
                  </form>
                </TabsContent>

                <TabsContent value="camera" className="mt-3">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-muted/50 rounded-md">
                      <Camera size={16} strokeWidth={1.5} />
                      Use the camera or upload a barcode image to add shipments.
                    </div>
                    <BarcodeScanner
                      onScan={scanner.scanCamera}
                      active={scanMode === 'camera'}
                      className="h-64 border border-border"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Scan Feedback */}
          {scanner.lastResult && (
            <Card
              className={cn(
                'border transition-colors shrink-0',
                scanner.lastResult.success &&
                  !scanner.lastResult.duplicate &&
                  'border-status-success/50 bg-status-success/10',
                scanner.lastResult.duplicate && 'border-status-warning/50 bg-status-warning/10',
                !scanner.lastResult.success && 'border-status-error/50 bg-status-error/10'
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {getResultIcon(scanner.lastResult)}
                  <div className="flex flex-col gap-1 flex-1">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        scanner.lastResult.success &&
                          !scanner.lastResult.duplicate &&
                          'text-status-success',
                        scanner.lastResult.duplicate && 'text-status-warning',
                        !scanner.lastResult.success && 'text-status-error'
                      )}
                    >
                      {scanner.lastResult.message}
                    </p>
                    {scanner.lastResult.cn_number && (
                      <p className="font-mono text-xs opacity-90">
                        {scanner.lastResult.cn_number}
                        {scanner.lastResult.consignee_name &&
                          ' • ' + scanner.lastResult.consignee_name}
                      </p>
                    )}
                  </div>
                  {/* Retry button */}
                  {!scanner.lastResult.success &&
                    scanner.lastResult.error === 'REQUEST_CANCELLED' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => scanner.handleSubmit()}
                      >
                        <RotateCcw size={16} strokeWidth={1.5} />
                      </Button>
                    )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            <Card className="border-border bg-card/50 transition duration-300 hover:shadow-sm hover:border-border/80 relative">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">{scanner.successCount}</p>
                <p className="text-xs text-muted-foreground">Added</p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card/50 transition duration-300 hover:shadow-sm hover:border-border/80 relative">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-status-warning">{scanner.duplicateCount}</p>
                <p className="text-xs text-muted-foreground">Dups</p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card/50 transition duration-300 hover:shadow-sm hover:border-border/80 relative">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-status-error">{scanner.errorCount}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card/50 transition duration-300 hover:shadow-sm hover:border-border/80 relative">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold truncate" title={totalWeight.toFixed(1)}>
                  {totalWeight.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">Kg</p>
              </CardContent>
            </Card>
          </div>

          {/* Log */}
          <div className="flex-1 min-h-0">
            <ManifestScanLog entries={scanner.scanHistory} className="h-full" />
          </div>
        </div>

        {/* Right Panel: Shipments List */}
        <div className="lg:col-span-7 h-full overflow-hidden flex-col">
          <Card className="border-border bg-card/50 h-full flex flex-col transition duration-300 hover:shadow-sm hover:border-border/80 relative">
            <CardHeader className="pb-3 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Package size={16} strokeWidth={1.5} className="text-primary" />
                    Manifest Shipments
                  </CardTitle>
                  <CardDescription>
                    {items.length} shipment{items.length !== 1 ? 's' : ''} added • {totalPieces}{' '}
                    pieces • {totalWeight.toFixed(1)} kg
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ManifestShipmentsTable
                items={items}
                isLoading={isLoading}
                isEditable={isEditable}
                onRemove={onRemove}
                onViewShipment={onViewShipment}
                showSummary={false}
                className="h-full border-0"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
