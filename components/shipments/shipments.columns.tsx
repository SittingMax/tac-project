'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { CrudRowActions } from '@/components/crud/CrudRowActions';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { Plane, Truck, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HUBS } from '@/lib/constants';
import { ShipmentWithRelations } from '@/hooks/useShipments';
import { TableBarcode } from '@/components/barcodes';

export interface ShipmentsColumnsParams {
  onView: (row: ShipmentWithRelations) => void;
  onEdit: (row: ShipmentWithRelations) => void;
  onDelete?: (row: ShipmentWithRelations) => void;
}

/**
 * Generate column definitions for the shipments table.
 * Includes callbacks for view, edit, and delete actions.
 */
export function getShipmentsColumns(
  params: ShipmentsColumnsParams
): ColumnDef<ShipmentWithRelations>[] {
  return [
    {
      accessorKey: 'cn_number',
      header: 'CN Number',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.mode === 'AIR' ? (
            <Plane className="w-4 h-4 text-feature-air" />
          ) : (
            <Truck className="w-4 h-4 text-feature-ground" />
          )}
          <Link
            to={`/tracking?cn=${row.original.cn_number}`}
            className="font-mono font-bold text-primary hover:underline hover:text-primary/80 transition-colors"
          >
            {row.original.cn_number}
          </Link>
        </div>
      ),
    },
    {
      id: 'barcode',
      header: 'Barcode',
      cell: ({ row }) => (
        <div
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => params.onView(row.original)}
          title="Click to view shipment details"
        >
          <TableBarcode value={row.original.cn_number} />
        </div>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-foreground">{row.original.customer?.name || '—'}</div>
          <div className="text-xs text-muted-foreground">{row.original.customer?.phone || ''}</div>
        </div>
      ),
    },
    {
      id: 'route',
      header: 'Route',
      cell: ({ row }) => {
        const originCode =
          row.original.origin_hub?.code ||
          (HUBS as Record<string, { code: string }>)[row.original.origin_hub_id]?.code ||
          row.original.origin_hub_id;
        const destCode =
          row.original.destination_hub?.code ||
          (HUBS as Record<string, { code: string }>)[row.original.destination_hub_id]?.code ||
          row.original.destination_hub_id;

        return (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="font-semibold">{originCode}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-semibold">{destCode}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'service_level',
      header: 'Service',
      cell: ({ row }) => (
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-none ${
            row.original.service_level === 'EXPRESS'
              ? 'bg-status-warning/20 text-status-warning'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {row.original.service_level?.substring(0, 3) || 'STD'}
        </span>
      ),
    },
    {
      accessorKey: 'package_count',
      header: 'Pkgs',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.package_count}</span>,
    },
    {
      accessorKey: 'total_weight',
      header: 'Weight',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.total_weight?.toFixed(1)} kg</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => params.onView(row.original)}>
            <Eye className="w-4 h-4 mr-1" /> View
          </Button>

          {params.onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => params.onDelete!(row.original)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Delete Permanently"
            >
              <div className="w-4 h-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" x2="10" y1="11" y2="17" />
                  <line x1="14" x2="14" y1="11" y2="17" />
                </svg>
              </div>
            </Button>
          )}

          <CrudRowActions
            onEdit={() => params.onEdit(row.original)}
            // keep onDelete in dropdown too if desired, or remove it.
            // I will keep it for consistency with Invoices.
            onDelete={params.onDelete ? () => params.onDelete!(row.original) : undefined}
          />
        </div>
      ),
    },
  ];
}
