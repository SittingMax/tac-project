import React, { useRef } from 'react';
import { formatDateTime } from '@/lib/formatters';
import { PageSkeleton } from '@/components/ui/skeleton';
import {
  useManifest,
  useManifestItems,
  useUpdateManifestStatus,
  type ManifestItemWithRelations,
} from '../../hooks/useManifests';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { CrudTable } from '@/components/crud/CrudTable';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Printer, Truck, Plane, Package } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Manifest } from '../../types';
import { ManifestPrintView } from '@/components/manifests/ManifestPrintView';
import { useReactToPrint } from 'react-to-print';
import { StatusBadge } from '@/components/domain/status-badge';
import { logger } from '@/lib/logger';
import { IdBadge } from '@/components/ui-core/data/id-badge';

export const ManifestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: manifest, isLoading } = useManifest(id!);
  const { data: items, isLoading: loadingItems } = useManifestItems(id!);
  const updateStatus = useUpdateManifestStatus();

  const shipmentColumns: ColumnDef<ManifestItemWithRelations>[] = React.useMemo(
    () => [
      {
        accessorKey: 'shipment.cn_number',
        header: 'CN NUMBER',
        cell: ({ row }) => (
          <IdBadge
            entity="shipment"
            idValue={row.original.shipment.id}
            cnNumber={row.original.shipment.cn_number}
          />
        ),
      },
      {
        accessorKey: 'shipment.consignee_name',
        header: 'CONSIGNEE',
        cell: ({ row }) => row.original.shipment.consignee_name,
      },
      {
        accessorKey: 'shipment.package_count',
        header: 'PKG',
        cell: ({ row }) => row.original.shipment.package_count,
      },
      {
        id: 'weight',
        header: 'WEIGHT',
        cell: ({ row }) => `${row.original.shipment.total_weight} kg`,
      },
      {
        accessorKey: 'scanned_at',
        header: 'SCANNED AT',
        cell: ({ row }) => (
          <div className="text-right text-xs text-muted-foreground">
            {row.original.scanned_at
              ? formatDateTime(row.original.scanned_at)
              : '-'}
          </div>
        ),
      },
    ],
    []
  );

  // Print handling
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Manifest-${manifest?.manifest_no}`,
  });

  if (isLoading || !manifest)
    return (
      <div className="p-6">
        <PageSkeleton />
      </div>
    );

  const handleUpdateStatus = async (status: 'OPEN' | 'CLOSED' | 'DEPARTED' | 'ARRIVED') => {
    try {
      await updateStatus.mutateAsync({ id: manifest.id, status });
    } catch (e) {
      logger.error('ManifestDetails', 'Error', { error: e });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/manifests')}>
            <ArrowLeft size={20} strokeWidth={1.5} />
          </Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-4">
              <span className="font-mono text-primary">{manifest.manifest_no}</span>
              <StatusBadge status={manifest.status} />
            </h2>
            <p className="text-sm text-muted-foreground">
              {manifest.from_hub?.name} ({manifest.from_hub?.code}) → {manifest.to_hub?.name} (
              {manifest.to_hub?.code})
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div style={{ display: 'none' }}>
            <ManifestPrintView ref={printRef} manifest={manifest} items={items || []} />
          </div>
          <Button variant="secondary" onClick={() => handlePrint()}>
            <Printer size={16} strokeWidth={1.5} className="mr-2" /> Print Standard Manifest
          </Button>
          {manifest.status === 'OPEN' && (
            <Button onClick={() => handleUpdateStatus('DEPARTED')}>Mark Departed</Button>
          )}
          {manifest.status === 'DEPARTED' && (
            <Button
              onClick={() => handleUpdateStatus('ARRIVED')}
              className="bg-status-success hover:bg-status-success/90"
            >
              Mark Arrived
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-0 border border-border bg-white dark:bg-card overflow-hidden">
          <div className="p-4 border-b border-border bg-muted">
            <h3 className="font-bold flex items-center gap-2">
              <Package size={16} strokeWidth={1.5} /> Manifested Shipments
            </h3>
          </div>
          <div className="border border-border/40 bg-card overflow-hidden shadow-xs border-x-0 border-b-0">
            <CrudTable
              columns={shipmentColumns}
              data={items || []}
              isLoading={loadingItems}
              pageSize={10}
            />
          </div>
        </Card>

        <Card className="p-6 flex flex-col gap-6 h-fit bg-white dark:bg-card border border-border">
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">
              Transport Details
            </h3>
            <div className="bg-muted p-4 rounded-md flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Mode</span>
                <span className="font-bold flex items-center gap-2">
                  {manifest.type === 'AIR' ? (
                    <Plane size={16} strokeWidth={1.5} />
                  ) : (
                    <Truck size={16} strokeWidth={1.5} />
                  )}
                  {manifest.type}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Vehicle/Flight</span>
                <span className="font-mono font-bold">
                  {(manifest.vehicle_meta as unknown as Manifest['vehicleMeta'])?.identifier}
                </span>
              </div>
              {manifest.type === 'TRUCK' && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Driver</span>
                  <span className="font-bold">
                    {(manifest.vehicle_meta as unknown as Manifest['vehicleMeta'])?.driver}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">Summary</h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Shipments</span>
                <span className="font-bold">{manifest.total_shipments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Packages</span>
                <span className="font-bold">{manifest.total_packages}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">Total Weight</span>
                <span className="font-bold text-lg text-primary">{manifest.total_weight} kg</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-4 border-t border-border">
            <div>Created by: {manifest.creator?.full_name || 'System'}</div>
            <div>Created at: {formatDateTime(manifest.created_at)}</div>
          </div>
        </Card>
      </div>
    </div>
  );
};
