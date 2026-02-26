'use client';

/**
 * ManifestShipmentsTable Component
 * Enterprise-grade shipment table for manifest builder
 * Shows scanned shipments with search, remove, and view actions
 */

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Trash2, Search, Package, Loader2 } from 'lucide-react';

import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ManifestItemWithShipment } from '@/lib/services/manifestService';
import { ScreenBarcode } from '@/components/barcodes';

interface ManifestShipmentsTableProps {
  items: ManifestItemWithShipment[];
  isLoading?: boolean;
  isEditable?: boolean;
  onRemove?: (shipmentId: string) => void;
  onViewShipment?: (shipmentId: string) => void;
  showSummary?: boolean;
  className?: string;
}

export function ManifestShipmentsTable({
  items,
  isLoading = false,
  isEditable = true,
  onRemove,
  onViewShipment,
  showSummary = false,
  className,
}: ManifestShipmentsTableProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter items by search query (CN, consignee, consignor)
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) => {
      const shipment = item.shipment;
      if (!shipment) return false;
      return (
        shipment.cn_number?.toLowerCase().includes(query) ||
        shipment.consignee_name?.toLowerCase().includes(query) ||
        shipment.consignor_name?.toLowerCase().includes(query)
      );
    });
  }, [items, searchQuery]);

  const columns: ColumnDef<ManifestItemWithShipment>[] = React.useMemo(
    () => [
      {
        accessorKey: 'shipment.cn_number',
        header: 'CN Number',
        cell: ({ row }) => (
          <Link
            to={`/tracking?cn=${row.original.shipment?.cn_number}`}
            className="font-mono font-semibold text-foreground hover:text-primary transition-colors hover:underline"
          >
            {row.original.shipment?.cn_number || 'N/A'}
          </Link>
        ),
      },
      {
        id: 'barcode',
        header: 'Barcode',
        cell: ({ row }) => {
          const awb = row.original.shipment?.cn_number;
          if (!awb) return <span className="text-muted-foreground text-xs">—</span>;
          return (
            <div
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onViewShipment?.(row.original.shipment_id)}
              title="Click to view shipment details"
            >
              <ScreenBarcode value={awb} className="scale-75 origin-left" />
            </div>
          );
        },
      },
      {
        id: 'Consignee',
        header: 'Consignee',
        cell: ({ row }) => {
          const shipment = row.original.shipment;
          return (
            <div className="space-y-0.5">
              <div className="font-medium truncate max-w-[180px]">
                {shipment?.consignee_name || '—'}
              </div>
              {shipment?.consignee_city && (
                <div className="text-xs text-muted-foreground">{shipment.consignee_city}</div>
              )}
            </div>
          );
        },
      },
      {
        id: 'CONSIGNOR',
        header: 'CONSIGNOR',
        cell: ({ row }) => {
          const shipment = row.original.shipment;
          return (
            <div className="space-y-0.5">
              <div className="font-medium truncate max-w-[180px]">
                {shipment?.consignor_name || '—'}
              </div>
              {shipment?.consignor_city && (
                <div className="text-xs text-muted-foreground">{shipment.consignor_city}</div>
              )}
            </div>
          );
        },
      },
      {
        id: 'load',
        header: 'Load',
        cell: ({ row }) => {
          const shipment = row.original.shipment;
          return (
            <div className="text-sm">
              <div className="font-medium">
                {shipment?.package_count || shipment?.total_packages || 0} pcs
              </div>
              <div className="text-xs text-muted-foreground">
                {(shipment?.total_weight || 0).toFixed(1)} kg
              </div>
            </div>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.shipment?.status || 'UNKNOWN';
          return (
            <Badge variant="secondary" className="text-xs">
              {status}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const shipmentId = row.original.shipment_id;
          return (
            <div className="flex items-center gap-1 justify-end">
              <TooltipProvider>
                {onViewShipment && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onViewShipment(shipmentId)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View Shipment</TooltipContent>
                  </Tooltip>
                )}
                {isEditable && onRemove && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onRemove(shipmentId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove from Manifest</TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          );
        },
      },
    ],
    [isEditable, onRemove, onViewShipment]
  );

  // Calculate totals for summary
  const totals = React.useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const shipment = item.shipment;
        return {
          shipments: acc.shipments + 1,
          packages: acc.packages + (shipment?.package_count || shipment?.total_packages || 0),
          weight: acc.weight + (shipment?.total_weight || 0),
        };
      },
      { shipments: 0, packages: 0, weight: 0 }
    );
  }, [items]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-64', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-64 text-center', className)}>
        <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">No shipments yet</h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Scan CN barcodes to add shipments to this manifest
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search CN, receiver, sender..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-none border">
        <DataTable columns={columns} data={filteredItems} pageSize={50} />
      </div>

      {/* Summary Footer */}
      {showSummary && (
        <div className="mt-4 flex items-center justify-between p-3 rounded-none bg-muted/50 border">
          <div className="text-sm text-muted-foreground">
            Showing {filteredItems.length} of {items.length} shipments
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Shipments:</span>{' '}
              <span className="font-semibold">{totals.shipments}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Packages:</span>{' '}
              <span className="font-semibold">{totals.packages}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Weight:</span>{' '}
              <span className="font-semibold">{totals.weight.toFixed(1)} kg</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManifestShipmentsTable;
