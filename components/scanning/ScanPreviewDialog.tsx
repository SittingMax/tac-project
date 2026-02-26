/**
 * ScanPreviewDialog — Shows scanned item details in a dialog instead of navigating directly.
 *
 * Replaces the old "scan → navigate immediately" flow with:
 *   scan → preview dialog → user decides to navigate or dismiss
 *
 * Supports: Shipment (TAC...), Manifest (MAN...), Unknown format
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Plane,
  Truck,
  MapPin,
  User,
  Phone,
  ExternalLink,
  Copy,
  Loader2,
  AlertCircle,
  Weight,
  Hash,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ShipmentWithRelations } from '@/hooks/useShipments';
import type { ManifestWithRelations } from '@/hooks/useManifests';
import type { InvoiceWithRelations } from '@/hooks/useInvoices';
import { formatCurrency } from '@/lib/utils';
import { FileText, DollarSign, Calendar } from 'lucide-react';

export type ScanPreviewType = 'shipment' | 'manifest' | 'unknown';

interface ScanPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scannedData: string | null;
  scanType: ScanPreviewType;
}

// Status color mapping using design-token CSS variables
const statusColors: Record<string, string> = {
  BOOKED: 'bg-status-created/10 text-status-created border-status-created/30',
  RECEIVED_AT_ORIGIN: 'bg-status-manifested/10 text-status-manifested border-status-manifested/30',
  IN_TRANSIT: 'bg-status-in-transit/10 text-status-in-transit border-status-in-transit/30',
  RECEIVED_AT_DEST: 'bg-status-arrived/10 text-status-arrived border-status-arrived/30',
  OUT_FOR_DELIVERY: 'bg-status-in-transit/10 text-status-in-transit border-status-in-transit/30',
  DELIVERED: 'bg-status-delivered/10 text-status-delivered border-status-delivered/30',
  CANCELLED: 'bg-status-cancelled/10 text-status-cancelled border-status-cancelled/30',
  EXCEPTION: 'bg-status-exception/10 text-status-exception border-status-exception/30',
  // Manifest statuses
  DRAFT: 'bg-status-neutral/10 text-status-neutral border-status-neutral/30',
  OPEN: 'bg-status-created/10 text-status-created border-status-created/30',
  BUILDING: 'bg-status-manifested/10 text-status-manifested border-status-manifested/30',
  CLOSED: 'bg-status-in-transit/10 text-status-in-transit border-status-in-transit/30',
  DEPARTED: 'bg-status-in-transit/10 text-status-in-transit border-status-in-transit/30',
  ARRIVED: 'bg-status-arrived/10 text-status-arrived border-status-arrived/30',
  RECONCILED: 'bg-status-delivered/10 text-status-delivered border-status-delivered/30',
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number | null | undefined;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground min-w-[80px]">{label}</span>
      <span className="font-medium text-foreground truncate">{value}</span>
    </div>
  );
}

function InvoicePreview({
  data,
  shipment,
}: {
  data: InvoiceWithRelations;
  shipment?: ShipmentWithRelations | null;
}) {
  const statusClass = statusColors[data.status] || 'bg-muted text-muted-foreground';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span className="font-mono text-lg font-bold tracking-wide">{data.invoice_no}</span>
        </div>
        <Badge variant="outline" className={statusClass}>
          {data.status?.replace(/_/g, ' ')}
        </Badge>
      </div>

      <Separator />

      <div className="space-y-3">
        {/* Invoice Amount - Most Important */}
        <div className="flex items-center justify-between p-3 rounded-none bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Total Amount</span>
          </div>
          <span className="text-xl font-bold text-primary">{formatCurrency(data.total || 0)}</span>
        </div>

        <InfoRow icon={User} label="Customer" value={data.customer?.name} />
        <InfoRow icon={Phone} label="Phone" value={data.customer?.phone} />
        <InfoRow icon={Package} label="AWB" value={data.shipment?.cn_number} />

        {/* Shipment Route if available */}
        {shipment && (
          <div className="flex items-center gap-2 text-sm pt-2 border-t">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">
              {shipment.origin_hub?.name || shipment.origin_hub?.code || '—'}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium">
              {shipment.destination_hub?.name || shipment.destination_hub?.code || '—'}
            </span>
            {shipment.mode && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {shipment.mode === 'AIR' ? (
                  <Plane className="w-3 h-3 mr-1" />
                ) : (
                  <Truck className="w-3 h-3 mr-1" />
                )}
                {shipment.mode}
              </Badge>
            )}
          </div>
        )}

        <InfoRow
          icon={Calendar}
          label="Issue Date"
          value={data.issue_date ? new Date(data.issue_date).toLocaleDateString() : undefined}
        />
        <InfoRow
          icon={Calendar}
          label="Due Date"
          value={data.due_date ? new Date(data.due_date).toLocaleDateString() : undefined}
        />
      </div>
    </div>
  );
}

function ManifestPreview({ data }: { data: ManifestWithRelations }) {
  const statusClass = statusColors[data.status] || 'bg-muted text-muted-foreground';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-lg font-bold tracking-wide">{data.manifest_no}</span>
        <Badge variant="outline" className={statusClass}>
          {data.status?.replace(/_/g, ' ')}
        </Badge>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{data.from_hub?.name || data.from_hub?.code || '—'}</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-medium">{data.to_hub?.name || data.to_hub?.code || '—'}</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {data.type === 'AIR' ? (
              <Plane className="w-3 h-3 mr-1" />
            ) : (
              <Truck className="w-3 h-3 mr-1" />
            )}
            {data.type}
          </Badge>
        </div>

        <InfoRow icon={Package} label="Shipments" value={data.total_shipments} />
        <InfoRow icon={Hash} label="Packages" value={data.total_packages} />
        <InfoRow
          icon={Weight}
          label="Weight"
          value={data.total_weight ? `${data.total_weight} kg` : undefined}
        />
        <InfoRow icon={User} label="Created by" value={data.creator?.full_name} />
      </div>
    </div>
  );
}

export function ScanPreviewDialog({
  open,
  onOpenChange,
  scannedData,
  scanType,
}: ScanPreviewDialogProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null);
  const [shipment, setShipment] = useState<ShipmentWithRelations | null>(null);
  const [manifest, setManifest] = useState<ManifestWithRelations | null>(null);

  // Fetch data when dialog opens — single atomic update, no intermediate renders
  useEffect(() => {
    if (!open || !scannedData) {
      setInvoice(null);
      setShipment(null);
      setManifest(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setInvoice(null);
      setShipment(null);
      setManifest(null);

      try {
        if (scanType === 'shipment') {
          // Single-pass: get shipment + invoice data together (no intermediate renders)
          const { data: shipmentRow, error: shipmentErr } = await supabase
            .from('shipments')
            .select(
              `
              id, cn_number, mode, status, package_count, total_weight,
              consignor_name, consignee_name, consignee_phone,
              customer:customers(name, phone, email),
              origin_hub:hubs!shipments_origin_hub_id_fkey(code, name),
              destination_hub:hubs!shipments_destination_hub_id_fkey(code, name)
            `
            )
            .eq('cn_number', scannedData)
            .maybeSingle();

          if (cancelled) return;
          if (shipmentErr) throw shipmentErr;
          if (!shipmentRow) {
            setError(`Shipment not found: ${scannedData}`);
            setLoading(false);
            return;
          }

          // Fetch invoice using the shipment ID we just got
          const { data: invoiceRow, error: invoiceErr } = await supabase
            .from('invoices')
            .select(
              `
              *,
              customer:customers(name, phone, email),
              shipment:shipments(cn_number)
            `
            )
            .eq('shipment_id', shipmentRow.id)
            .is('deleted_at', null)
            .maybeSingle();

          if (cancelled) return;
          if (invoiceErr) throw invoiceErr;

          // ── ATOMIC state update: set both at once, no intermediate flash ──
          if (!invoiceRow) {
            setError(`No invoice found for shipment ${scannedData}`);
          } else {
            setInvoice(invoiceRow as unknown as InvoiceWithRelations);
          }
          setShipment(shipmentRow as unknown as ShipmentWithRelations);
        } else if (scanType === 'manifest') {
          const { data, error: err } = await supabase
            .from('manifests')
            .select(
              `
              *,
              from_hub:hubs!manifests_from_hub_id_fkey(code, name),
              to_hub:hubs!manifests_to_hub_id_fkey(code, name),
              creator:staff!manifests_created_by_staff_id_fkey(full_name)
            `
            )
            .eq('manifest_no', scannedData)
            .maybeSingle();

          if (cancelled) return;
          if (err) throw err;
          if (!data) {
            setError(`Manifest not found: ${scannedData}`);
          } else {
            setManifest(data as unknown as ManifestWithRelations);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to fetch details');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [open, scannedData, scanType]);

  const handleNavigate = () => {
    onOpenChange(false);
    if (scanType === 'shipment' && scannedData) {
      navigate(`/finance?awb=${scannedData}`);
    } else if (scanType === 'manifest' && scannedData) {
      navigate(`/manifests?search=${scannedData}`);
    }
  };

  const handleCopy = () => {
    if (scannedData) {
      navigator.clipboard.writeText(scannedData).then(() => {
        // Visual feedback handled by button state
      });
    }
  };

  const dialogTitle =
    scanType === 'shipment'
      ? 'Invoice Preview'
      : scanType === 'manifest'
        ? 'Manifest Scanned'
        : 'Barcode Scanned';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-md animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            {scanType === 'shipment' ? (
              <div className="p-2 rounded-none bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
            ) : (
              <div className="p-2 rounded-none bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
            )}
            <span className="font-semibold">{dialogTitle}</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            {scanType === 'unknown'
              ? 'Unrecognized barcode format'
              : scanType === 'shipment'
                ? 'Invoice details for scanned shipment'
                : `Details for scanned ${scanType}`}
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-0 flex-1 min-h-0 py-2 overflow-y-auto pr-1">
          {/* Loading — show scanned code immediately while fetching */}
          {loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-none bg-muted/50 border border-border">
                <Package className="w-5 h-5 text-primary animate-pulse" />
                <div>
                  <p className="font-mono text-sm font-bold tracking-wide">{scannedData}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {scanType === 'shipment'
                      ? 'Looking up invoice...'
                      : scanType === 'manifest'
                        ? 'Looking up manifest...'
                        : 'Processing...'}
                  </p>
                </div>
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded-none" />
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded-none" />
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded-none" />
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex items-start gap-3 p-4 rounded-none bg-destructive/10 text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">{error}</p>
                <p className="text-xs mt-1 opacity-70">
                  The scanned value may not exist in the system.
                </p>
              </div>
            </div>
          )}

          {/* Invoice Preview (for shipments) */}
          {!loading && !error && invoice && <InvoicePreview data={invoice} shipment={shipment} />}

          {/* Manifest Preview */}
          {!loading && !error && manifest && <ManifestPreview data={manifest} />}

          {/* Unknown format */}
          {!loading && scanType === 'unknown' && scannedData && (
            <div className="space-y-3">
              <div className="p-4 rounded-none bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Scanned Value</p>
                <p className="font-mono text-lg font-bold break-all">{scannedData}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                This barcode format is not recognized as a shipment (TAC...) or manifest (MAN...).
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="relative z-10 flex flex-col gap-2 pt-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5 w-full sm:w-auto"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy
          </Button>
          <div className="hidden sm:block flex-1" />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:ml-auto">
            {scanType !== 'unknown' && (
              <Button size="sm" onClick={handleNavigate} className="gap-1.5 w-full sm:w-auto">
                <ExternalLink className="w-3.5 h-3.5" />
                View Full Details
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
