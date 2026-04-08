/**
 * WarehouseScanPanel Component
 * Premium scanning interface for warehouse operations
 * Supports barcode scanner input (keyboard wedge) and manual entry
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatDateShort } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StatusBadge } from './status-badge';
import {
  Scan,
  Package,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  MapPin,
  Truck,
  User,
  Weight,
} from 'lucide-react';
import { ShipmentStatus } from '@/types';

// Scan result types
export type ScanResultStatus = 'success' | 'warning' | 'error' | 'idle' | 'loading';

export interface ScanResult {
  status: ScanResultStatus;
  message: string;
  shipment?: {
    id: string;
    cn_number: string;
    status: ShipmentStatus;
    origin: string;
    destination: string;
    consignee_name: string;
    consignee_phone: string;
    total_weight: number;
    package_count: number;
  };
  newStatus?: ShipmentStatus;
}

export interface RecentScan {
  id: string;
  cn_number: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
  newStatus?: ShipmentStatus;
}

export interface WarehouseScanPanelProps {
  onScan: (code: string) => Promise<ScanResult>;
  hubName?: string;
  hubCode?: string;
  className?: string;
  autoFocus?: boolean;
  showRecentScans?: boolean;
  recentScans?: RecentScan[];
  onClearRecentScans?: () => void;
}

/**
 * WarehouseScanPanel - Premium scanning interface for warehouse operations
 *
 * @example
 * <WarehouseScanPanel
 *   onScan={handleScan}
 *   hubName="Imphal Hub"
 *   showRecentScans
 * />
 */
export function WarehouseScanPanel({
  onScan,
  hubName = 'Warehouse',
  hubCode: _hubCode,
  className,
  autoFocus = true,
  showRecentScans = true,
  recentScans = [],
  onClearRecentScans,
}: WarehouseScanPanelProps) {
  const [scanInput, setScanInput] = React.useState('');
  const [scanResult, setScanResult] = React.useState<ScanResult>({ status: 'idle', message: '' });
  const [isProcessing, setIsProcessing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus input on mount and after scan
  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus, scanResult.status]);

  // Handle scan submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = scanInput.trim();
    if (!code || isProcessing) return;

    setIsProcessing(true);
    setScanResult({ status: 'loading', message: 'Processing scan...' });

    try {
      const result = await onScan(code);
      setScanResult(result);
      setScanInput('');

      // Play audio feedback
      playAudioFeedback(result.status);
    } catch (error) {
      setScanResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Scan failed',
      });
      playAudioFeedback('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle keyboard input (barcode scanner sends Enter after code)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Clear result and refocus
  const handleClear = () => {
    setScanResult({ status: 'idle', message: '' });
    inputRef.current?.focus();
  };

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Scan Input Card */}
      <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Scan className="size-4 text-primary" />
            </div>
            <div>
              <span>Scan Panel</span>
              {hubName && (
                <span className="text-muted-foreground font-normal text-sm ml-2">• {hubName}</span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Input Field */}
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Input
                ref={inputRef}
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Scan barcode or enter CN number..."
                disabled={isProcessing}
                className={cn(
                  'h-14 text-lg font-mono pr-24',
                  'focus:ring-2 focus:ring-primary/50',
                  scanResult.status === 'error' && 'border-destructive focus:ring-destructive/50'
                )}
                autoComplete="off"
                autoFocus={autoFocus}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isProcessing && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
                <Button type="submit" size="sm" disabled={!scanInput.trim() || isProcessing}>
                  Scan
                </Button>
              </div>
            </div>
          </form>

          {/* Status Indicator */}
          {scanResult.status !== 'idle' && (
            <div
              className={cn('p-4 rounded-lg border transition', getStatusStyles(scanResult.status))}
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(scanResult.status)}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{scanResult.message}</p>

                  {/* Shipment Details */}
                  {scanResult.shipment && (
                    <div className="mt-3 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Package className="size-4 text-muted-foreground" />
                        <span className="font-mono font-bold">{scanResult.shipment.cn_number}</span>
                        <StatusBadge
                          status={scanResult.newStatus || scanResult.shipment.status}
                          size="sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="size-3 text-muted-foreground" />
                          <span className="text-muted-foreground">From:</span>
                          <span>{scanResult.shipment.origin}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Truck className="size-3 text-muted-foreground" />
                          <span className="text-muted-foreground">To:</span>
                          <span>{scanResult.shipment.destination}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="size-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Consignee:</span>
                          <span>{scanResult.shipment.consignee_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Weight className="size-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Weight:</span>
                          <span>{scanResult.shipment.total_weight} kg</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button variant="ghost" size="sm" onClick={handleClear} className="shrink-0">
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Scans */}
      {showRecentScans && recentScans.length > 0 && (
        <Card>
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recent Scans ({recentScans.length})
              </CardTitle>
              {onClearRecentScans && (
                <Button variant="ghost" size="sm" onClick={onClearRecentScans} className="text-xs">
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {recentScans.map((scan) => (
                <div
                  key={scan.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-md text-sm',
                    'bg-muted/50 hover:bg-muted transition-colors'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'size-2 rounded-full',
                        scan.status === 'success' && 'bg-status-success',
                        scan.status === 'warning' && 'bg-status-warning',
                        scan.status === 'error' && 'bg-status-error'
                      )}
                    />
                    <span className="font-mono">{scan.cn_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {scan.newStatus && <StatusBadge status={scan.newStatus} size="sm" />}
                    <span className="text-muted-foreground text-xs">
                      {formatTimestamp(scan.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper functions
function getStatusStyles(status: ScanResultStatus): string {
  switch (status) {
    case 'success':
      return 'bg-status-success/10 border-status-success/30 text-status-success';
    case 'warning':
      return 'bg-status-warning/10 border-status-warning/30 text-status-warning';
    case 'error':
      return 'bg-status-error/10 border-status-error/30 text-status-error';
    case 'loading':
      return 'bg-muted border-border text-muted-foreground';
    default:
      return 'bg-muted border-border';
  }
}

function getStatusIcon(status: ScanResultStatus): React.ReactNode {
  const iconClass = 'size-5 shrink-0';

  switch (status) {
    case 'success':
      return <CheckCircle className={cn(iconClass, 'text-status-success')} />;
    case 'warning':
      return <AlertTriangle className={cn(iconClass, 'text-status-warning')} />;
    case 'error':
      return <XCircle className={cn(iconClass, 'text-status-error')} />;
    case 'loading':
      return <Loader2 className={cn(iconClass, 'animate-spin')} />;
    default:
      return null;
  }
}

function playAudioFeedback(status: ScanResultStatus): void {
  // Audio feedback for warehouse environment
  // In production, this would play actual audio files
  if (typeof window !== 'undefined' && 'Audio' in window) {
    try {
      const frequency = status === 'success' ? 800 : status === 'warning' ? 600 : 400;
      const duration = status === 'success' ? 100 : 200;

      // Create oscillator for beep sound
      const audioContext = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch {
      // Audio not supported, fail silently
    }
  }
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return formatDateShort(date);
}

export default WarehouseScanPanel;
