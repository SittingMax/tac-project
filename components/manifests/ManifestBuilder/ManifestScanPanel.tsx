'use client';

import * as React from 'react';
import {
  Camera,
  CheckCircle2,
  Keyboard,
  Scan,
  XCircle,
  AlertCircle,
  Trash2,
  RotateCcw,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useScanInput } from '@/hooks/useManifestScan';
import type { ScanResponse } from '@/lib/services/manifestService';
import type { ManifestScanMode } from './manifest-builder.types';
import { ManifestScanLog } from './ManifestScanLog';

interface ManifestScanPanelProps {
  manifestId: string;
  staffId?: string;
  validateDestination?: boolean;
  validateStatus?: boolean;
  disabled?: boolean;
  onScanSuccess?: (result: ScanResponse) => void;
  onItemsChanged?: () => void;
  className?: string;
}

export function ManifestScanPanel({
  manifestId,
  staffId,
  validateDestination = true,
  validateStatus = true,
  disabled = false,
  onScanSuccess,
  onItemsChanged,
  className,
}: ManifestScanPanelProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [scanMode, setScanMode] = React.useState<ManifestScanMode>('manual');

  const scanner = useScanInput({
    manifestId,
    staffId,
    validateDestination,
    validateStatus,
    inputRef,
    onSuccess: (result) => {
      onScanSuccess?.(result);
      onItemsChanged?.();
    },
    onDuplicate: () => {
      onItemsChanged?.();
    },
    playSound: true,
  });

  React.useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled, scanMode]);

  const getResultIcon = (result: ScanResponse | null) => {
    if (!result) return null;
    if (result.success && !result.duplicate) {
      return <CheckCircle2 className="h-5 w-5 text-status-success" />;
    }
    if (result.duplicate) {
      return <AlertCircle className="h-5 w-5 text-status-warning" />;
    }
    return <XCircle className="h-5 w-5 text-status-error" />;
  };

  const getResultColor = (result: ScanResponse | null) => {
    if (!result) return 'border-border';
    if (result.success && !result.duplicate) return 'border-status-success bg-status-success/5';
    if (result.duplicate) return 'border-status-warning bg-status-warning/5';
    return 'border-status-error bg-status-error/5';
  };

  return (
    <Card
      className={cn(
        'rounded-none border-2 transition-colors',
        getResultColor(scanner.lastResult),
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Scan className="h-4 w-4" />
            Scan CN / Package Barcode
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {scanMode === 'scanner' ? 'USB Scanner' : scanMode === 'camera' ? 'Camera' : 'Manual'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={scanMode} onValueChange={(value) => setScanMode(value as ManifestScanMode)}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="scanner">USB Scanner</TabsTrigger>
            <TabsTrigger value="camera">Camera</TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="pt-2">
            <p className="text-xs text-muted-foreground">
              Type or paste an CN Number, then press Enter.
            </p>
          </TabsContent>
          <TabsContent value="scanner" className="pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Keyboard className="h-3.5 w-3.5" />
              USB scanner is active. Keep the input focused.
            </div>
          </TabsContent>
          <TabsContent value="camera" className="pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Camera className="h-3.5 w-3.5" />
              Camera scanning will be enabled when browser permissions are available.
            </div>
          </TabsContent>
        </Tabs>

        <form onSubmit={scanner.handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Scan or enter CN Number..."
                value={scanner.inputValue}
                onChange={scanner.handleChange}
                onKeyDown={scanner.handleKeyDown}
                disabled={disabled || scanner.isScanning}
                className={cn(
                  'pr-10 font-mono text-base h-12',
                  scanner.isScanning && 'animate-pulse'
                )}
                autoComplete="off"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {scanner.isScanning ? (
                  <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-none animate-spin" />
                ) : (
                  getResultIcon(scanner.lastResult)
                )}
              </div>
            </div>
            <Button
              type="submit"
              disabled={disabled || scanner.isScanning || !scanner.inputValue.trim()}
              className="h-12 px-6"
            >
              Add
            </Button>
          </div>
        </form>

        {scanner.lastResult && (
          <div
            className={cn(
              'rounded-none p-3 text-sm',
              scanner.lastResult.success &&
                !scanner.lastResult.duplicate &&
                'bg-status-success/10 text-status-success',
              scanner.lastResult.duplicate && 'bg-status-warning/10 text-status-warning',
              !scanner.lastResult.success && 'bg-status-error/10 text-status-error'
            )}
          >
            <div className="flex items-start gap-2">
              {getResultIcon(scanner.lastResult)}
              <div className="flex-1 min-w-0">
                <p className="font-medium">{scanner.lastResult.message}</p>
                {scanner.lastResult.cn_number && (
                  <p className="text-xs mt-1 opacity-80 font-mono">
                    {scanner.lastResult.cn_number}
                    {scanner.lastResult.consignee_name && ` • ${scanner.lastResult.consignee_name}`}
                  </p>
                )}
              </div>
              {/* Retry button for cancelled/error scans */}
              {!scanner.lastResult.success && scanner.lastResult.error === 'REQUEST_CANCELLED' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        aria-label="Retry scan"
                        title="Retry scan"
                        onClick={() => {
                          if (scanner.inputValue) {
                            scanner.handleSubmit();
                          }
                        }}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Retry scan</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-none bg-status-success" />
              <span className="text-muted-foreground">Added:</span>
              <Badge variant="secondary" className="h-5 px-1.5 text-xs font-mono">
                {scanner.successCount}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-none bg-status-warning" />
              <span className="text-muted-foreground">Duplicates:</span>
              <Badge variant="secondary" className="h-5 px-1.5 text-xs font-mono">
                {scanner.duplicateCount}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-none bg-status-error" />
              <span className="text-muted-foreground">Errors:</span>
              <Badge variant="secondary" className="h-5 px-1.5 text-xs font-mono">
                {scanner.errorCount}
              </Badge>
            </div>
          </div>
          {scanner.scanCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={scanner.resetStats}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>

        <ManifestScanLog entries={scanner.scanHistory} />
      </CardContent>
    </Card>
  );
}

export default ManifestScanPanel;
