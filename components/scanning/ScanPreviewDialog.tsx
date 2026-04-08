/**
 * ScanPreviewDialog — Shows scanned item details in a dialog instead of navigating directly.
 *
 * Replaces the old "scan → navigate immediately" flow with:
 *   scan → preview dialog → user decides to navigate or dismiss
 *
 * Supports: Shipment (TAC...), Manifest (MAN...), Unknown format
 */

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SizedDialog } from '@/components/ui-core/dialog/sized-dialog';
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
import { FileText, DollarSign } from 'lucide-react';

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
    <div className="flex items-center gap-4 text-sm">
      <Icon size={16} strokeWidth={1.5} className="text-muted-foreground shrink-0" />
      <span className="text-muted-foreground min-w-[80px]">{label}</span>
      <span className="font-medium text-foreground truncate">{value}</span>
    </div>
  );
}

function ShipmentPreview({
  data,
  invoice,
}: {
  data: ShipmentWithRelations;
  invoice?: InvoiceWithRelations | null;
}) {
  const statusClass = statusColors[data.status] || 'bg-muted text-muted-foreground';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={20} strokeWidth={1.5} className="text-primary" />
          <span className="font-mono text-lg font-bold tracking-wide">{data.cn_number}</span>
        </div>
        <Badge variant="outline" className={statusClass}>
          {data.status?.replace(/_/g, ' ')}
        </Badge>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <InfoRow icon={User} label="Customer" value={data.customer?.name || data.consignor_name} />
        <InfoRow icon={Phone} label="Phone" value={data.customer?.phone || data.consignee_phone} />
        <InfoRow icon={Hash} label="Packages" value={data.package_count} />
        <InfoRow
          icon={Weight}
          label="Weight"
          value={data.total_weight ? `${data.total_weight} kg` : undefined}
        />

        <div className="flex items-center gap-2 text-sm pt-2 border-t">
          <MapPin size={16} strokeWidth={1.5} className="text-muted-foreground" />
          <span className="font-medium">
            {data.origin_hub?.name || data.origin_hub?.code || '—'}
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="font-medium">
            {data.destination_hub?.name || data.destination_hub?.code || '—'}
          </span>
          {data.mode && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {data.mode === 'AIR' ? (
                <Plane size={12} strokeWidth={1.5} className="mr-1" />
              ) : (
                <Truck size={12} strokeWidth={1.5} className="mr-1" />
              )}
              {data.mode}
            </Badge>
          )}
        </div>

        {invoice && (
          <div className="flex items-center justify-between p-4 rounded-md bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2">
              <DollarSign size={16} strokeWidth={1.5} className="text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Invoice {invoice.invoice_no}
              </span>
            </div>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(invoice.total || 0)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ManifestPreview({ data }: { data: ManifestWithRelations }) {
  const statusClass = statusColors[data.status] || 'bg-muted text-muted-foreground';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-lg font-bold tracking-wide">{data.manifest_no}</span>
        <Badge variant="outline" className={statusClass}>
          {data.status?.replace(/_/g, ' ')}
        </Badge>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm">
          <MapPin size={16} strokeWidth={1.5} className="text-muted-foreground" />
          <span className="font-medium">{data.from_hub?.name || data.from_hub?.code || '—'}</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-medium">{data.to_hub?.name || data.to_hub?.code || '—'}</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {data.type === 'AIR' ? (
              <Plane size={12} strokeWidth={1.5} className="mr-1" />
            ) : (
              <Truck size={12} strokeWidth={1.5} className="mr-1" />
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

  const {
    data: previewData,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['scan-preview', scanType, scannedData],
    queryFn: async () => {
      if (!scannedData) return null;

      if (scanType === 'shipment') {
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

        if (shipmentErr) throw shipmentErr;
        if (!shipmentRow) {
          throw new Error(`Shipment not found: ${scannedData}`);
        }

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

        if (invoiceErr) throw invoiceErr;

        return {
          type: 'shipment' as const,
          invoice: invoiceRow ? (invoiceRow as unknown as InvoiceWithRelations) : null,
          shipment: shipmentRow as unknown as ShipmentWithRelations,
        };
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

        if (err) throw err;
        if (!data) {
          throw new Error(`Manifest not found: ${scannedData}`);
        }

        return {
          type: 'manifest' as const,
          manifest: data as unknown as ManifestWithRelations,
        };
      }
      return null;
    },
    enabled: open && !!scannedData && scanType !== 'unknown',
    retry: false,
  });

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Failed to fetch details'
    : null;
  const invoice = previewData?.type === 'shipment' ? previewData.invoice : null;
  const shipment = previewData?.type === 'shipment' ? previewData.shipment : null;
  const manifest = previewData?.type === 'manifest' ? previewData.manifest : null;

  const handleNavigate = () => {
    onOpenChange(false);
    if (scanType === 'shipment' && shipment?.id) {
      navigate(`/shipments/${shipment.id}`);
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
      ? 'Shipment Preview'
      : scanType === 'manifest'
        ? 'Manifest Scanned'
        : 'Barcode Scanned';

  return (
    <SizedDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2.5 text-lg">
          {scanType === 'shipment' ? (
            <div className="p-2 rounded-md bg-primary/10">
              <FileText size={20} strokeWidth={1.5} className="text-primary" />
            </div>
          ) : (
            <div className="p-2 rounded-md bg-primary/10">
              <Package size={20} strokeWidth={1.5} className="text-primary" />
            </div>
          )}
          <span className="font-semibold">{dialogTitle}</span>
        </span>
      }
      description={
        scanType === 'unknown'
          ? 'Unrecognized barcode format'
          : scanType === 'shipment'
            ? 'Shipment details for scanned shipment'
            : `Details for scanned ${scanType}`
      }
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <div className="relative z-0 flex-1 min-h-0 py-2 overflow-y-auto pr-1">
          {/* Loading — show scanned code immediately while fetching */}
          {loading && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 p-4 rounded-md bg-muted/50 border border-border">
                <Package size={20} strokeWidth={1.5} className="text-primary animate-pulse" />
                <div>
                  <p className="font-mono text-sm font-bold tracking-wide">{scannedData}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {scanType === 'shipment'
                      ? 'Looking up shipment...'
                      : scanType === 'manifest'
                        ? 'Looking up manifest...'
                        : 'Processing...'}
                  </p>
                </div>
                <Loader2 size={16} strokeWidth={1.5} className="animate-spin text-muted-foreground ml-auto" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded-md" />
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex items-start gap-4 p-4 rounded-md bg-destructive/10 text-destructive">
              <AlertCircle size={20} strokeWidth={1.5} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">{error}</p>
                <p className="text-xs mt-1 opacity-70">
                  The scanned value may not exist in the system.
                </p>
              </div>
            </div>
          )}

          {!loading && !error && shipment && (
            <ShipmentPreview data={shipment as ShipmentWithRelations} invoice={invoice} />
          )}

          {/* Manifest Preview */}
          {!loading && !error && manifest && (
            <ManifestPreview data={manifest as ManifestWithRelations} />
          )}

          {/* Unknown format */}
          {!loading && scanType === 'unknown' && scannedData && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-md bg-muted">
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
            <Copy size={12} strokeWidth={1.5} className=".5 .5" />
            Copy
          </Button>
          <div className="hidden sm:block flex-1" />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:ml-auto">
            {scanType !== 'unknown' && (
              <Button size="sm" onClick={handleNavigate} className="gap-1.5 w-full sm:w-auto">
                <ExternalLink size={12} strokeWidth={1.5} className=".5 .5" />
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
      </div>
    </SizedDialog>
  );
}
