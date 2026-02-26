import React, { useRef } from 'react';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useManifest, useManifestItems, useUpdateManifestStatus } from '../../hooks/useManifests';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Table, TableHead as Th, TableCell as Td } from '../ui/table';
import { ArrowLeft, Printer, Truck, Plane, Package } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Manifest } from '../../types';
import { format } from 'date-fns';
import { ManifestPrintView } from '@/components/manifests/ManifestPrintView';
import { useReactToPrint } from 'react-to-print';
import { StatusBadge } from '../domain/StatusBadge';

export const ManifestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: manifest, isLoading } = useManifest(id!);
  const { data: items, isLoading: loadingItems } = useManifestItems(id!);
  const updateStatus = useUpdateManifestStatus();

  // Print handling
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Manifest-${manifest?.manifest_no}`,
  });

  if (isLoading || !manifest) return <div className="p-6"><PageSkeleton /></div>;

  const handleUpdateStatus = async (status: 'OPEN' | 'CLOSED' | 'DEPARTED' | 'ARRIVED') => {
    try {
      await updateStatus.mutateAsync({ id: manifest.id, status });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/manifests')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
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
            <Printer className="w-4 h-4 mr-2" /> Print Standard Manifest
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
              <Package className="w-4 h-4" /> Manifested Shipments
            </h3>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>CN Number</Th>
                <Th>CONSIGNEE</Th>
                <Th>PKG</Th>
                <Th>WEIGHT</Th>
                <Th>SCANNED AT</Th>
              </tr>
            </thead>
            <tbody>
              {loadingItems && (
                <tr>
                  <Td colSpan={5} className="text-center">
                    Loading items...
                  </Td>
                </tr>
              )}
              {items?.map((item) => (
                <tr key={item.id}>
                  <Td className="font-mono font-bold">{item.shipment.cn_number}</Td>
                  <Td>{item.shipment.consignee_name}</Td>
                  <Td>{item.shipment.package_count}</Td>
                  <Td>{item.shipment.total_weight} kg</Td>
                  <Td className="text-right text-xs text-muted-foreground">
                    {item.scanned_at ? format(new Date(item.scanned_at), 'HH:mm dd/MM') : '-'}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card className="p-6 space-y-6 h-fit bg-white dark:bg-card border border-border">
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">
              Transport Details
            </h3>
            <div className="bg-muted p-4 rounded-none space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Mode</span>
                <span className="font-bold flex items-center gap-2">
                  {manifest.type === 'AIR' ? (
                    <Plane className="w-4 h-4" />
                  ) : (
                    <Truck className="w-4 h-4" />
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
            <div className="space-y-2">
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
            <div>Created at: {format(new Date(manifest.created_at), 'dd MMM yyyy HH:mm')}</div>
          </div>
        </Card>
      </div>
    </div>
  );
};
