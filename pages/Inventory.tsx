import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CrudTable } from '@/components/crud/CrudTable';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import type { ShipmentWithRelations } from '@/hooks/useShipments';
import { Search, Warehouse, Package } from 'lucide-react';
import type { HubLocation } from '@/types';
import { HUBS } from '@/lib/constants';
import { IdBadge } from '@/components/ui-core/data/id-badge';

const INVENTORY_STATUSES = ['RECEIVED_AT_ORIGIN', 'RECEIVED_AT_DEST', 'EXCEPTION'] as const;

export const Inventory: React.FC = () => {
  const orgId = useAuthStore((s) => s.user?.orgId);
  const [filterHub, setFilterHub] = useState<HubLocation | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const selectedHubId = filterHub === 'ALL' ? undefined : HUBS[filterHub]?.uuid;
  const { data, isLoading } = useQuery({
    queryKey: ['inventory', orgId, selectedHubId, search, page, pageSize],
    queryFn: async () => {
      if (!orgId) {
        return {
          shipments: [] as ShipmentWithRelations[],
          totalCount: 0,
          criticalCount: 0,
        };
      }

      const inventorySelect = `
        id,
        org_id,
        cn_number,
        customer_id,
        origin_hub_id,
        destination_hub_id,
        mode,
        service_level,
        status,
        package_count,
        total_weight,
        declared_value,
        consignee_name,
        consignee_phone,
        consignee_address,
        consignor_name,
        consignor_phone,
        consignor_address,
        special_instructions,
        created_at,
        updated_at
      `;
      const criticalThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const hubFilter = selectedHubId
        ? `and(status.eq.RECEIVED_AT_ORIGIN,origin_hub_id.eq.${selectedHubId}),and(status.eq.EXCEPTION,origin_hub_id.eq.${selectedHubId}),and(status.eq.RECEIVED_AT_DEST,destination_hub_id.eq.${selectedHubId})`
        : null;
      const searchPattern = `%${search.trim()}%`;

      let rowsQuery = supabase
        .from('shipments')
        .select(inventorySelect, { count: 'exact' })
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .in('status', [...INVENTORY_STATUSES])
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      let criticalQuery = supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .is('deleted_at', null)
        .in('status', [...INVENTORY_STATUSES])
        .lte('created_at', criticalThreshold);

      if (hubFilter) {
        rowsQuery = rowsQuery.or(hubFilter);
        criticalQuery = criticalQuery.or(hubFilter);
      }

      if (search.trim()) {
        rowsQuery = rowsQuery.ilike('cn_number', searchPattern);
        criticalQuery = criticalQuery.ilike('cn_number', searchPattern);
      }

      const [
        { data: shipments, error: rowsError, count },
        { count: criticalCount, error: criticalError },
      ] = await Promise.all([rowsQuery, criticalQuery]);

      if (rowsError) throw rowsError;
      if (criticalError) throw criticalError;

      return {
        shipments: (shipments ?? []) as ShipmentWithRelations[],
        totalCount: count ?? 0,
        criticalCount: criticalCount ?? 0,
      };
    },
    enabled: !!orgId,
  });

  const shipments = data?.shipments ?? [];
  const stats = {
    total: data?.totalCount ?? 0,
    critical: data?.criticalCount ?? 0,
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Helper to determine bucket (client-side for display)
  const getAgingBucket = (createdAt: string) => {
    const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    if (hours < 6) return '0-6h';
    if (hours < 12) return '6-12h';
    if (hours < 24) return '12-24h';
    return '24h+';
  };

  const bucketColor = (bucket: string) => {
    switch (bucket) {
      case '0-6h':
        return 'text-status-success';
      case '6-12h':
        return 'text-status-warning';
      case '12-24h':
        return 'text-status-warning';
      case '24h+':
        return 'text-status-error font-bold';
      default:
        return 'text-muted-foreground';
    }
  };

  const getInventoryLocation = (s: {
    origin_hub_id: string;
    destination_hub_id: string;
    status: string;
  }) => {
    const getHubLocationFromId = (hubId: string): HubLocation | null => {
      const hubEntry = Object.entries(HUBS).find(([_, hub]) => hub.uuid === hubId);
      return hubEntry ? (hubEntry[0] as HubLocation) : null;
    };
    const originHubLocation = getHubLocationFromId(s.origin_hub_id);
    const destHubLocation = getHubLocationFromId(s.destination_hub_id);

    if (['CREATED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'RECEIVED_AT_ORIGIN'].includes(s.status))
      return originHubLocation;
    if (['RECEIVED_AT_DEST', 'OUT_FOR_DELIVERY'].includes(s.status)) return destHubLocation;
    if (['EXCEPTION'].includes(s.status)) return originHubLocation;
    return null;
  };

  const columns: ColumnDef<ShipmentWithRelations>[] = React.useMemo(
    () => [
      {
        accessorKey: 'cn_number',
        header: 'CN Number',
        cell: ({ row }) => (
          <IdBadge
            entity="shipment"
            idValue={row.original.id}
            cnNumber={row.original.cn_number}
            href={`/shipments/${row.original.id}`}
          />
        ),
      },
      {
        accessorKey: 'package_count',
        header: 'Packages',
        cell: ({ row }) => <span className="font-mono">{row.original.package_count}</span>,
      },
      {
        id: 'weight',
        header: 'Weight',
        cell: ({ row }) => <span className="font-mono">{row.original.total_weight} kg</span>,
      },
      {
        id: 'location',
        header: 'Location',
        cell: ({ row }) => {
          const location = getInventoryLocation(row.original);
          const hubName = location ? HUBS[location]?.name || 'Unknown' : 'Unknown';
          return (
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-muted-foreground" />
              {hubName}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.status.replace(/_/g, ' ')}</Badge>
        ),
      },
      {
        id: 'aging',
        header: 'Age',
        cell: ({ row }) => {
          const bucket = getAgingBucket(row.original.created_at);
          return <span className={`font-mono font-bold ${bucketColor(bucket)}`}>{bucket}</span>;
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-end pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time stock view across hub network
          </p>
        </div>
        <div className="flex gap-0 mt-6 md:mt-0 rounded-lg border border-border overflow-hidden">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${filterHub === 'ALL' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            onClick={() => {
              setFilterHub('ALL');
              setPage(1);
            }}
          >
            All Hubs
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-border ${filterHub === 'IMPHAL' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            onClick={() => {
              setFilterHub('IMPHAL');
              setPage(1);
            }}
          >
            Imphal
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-border ${filterHub === 'NEW_DELHI' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            onClick={() => {
              setFilterHub('NEW_DELHI');
              setPage(1);
            }}
          >
            New Delhi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6 flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-0.5">
              Inventory Backlog
            </div>
            <div className="text-2xl font-semibold text-foreground">{stats.total}</div>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="p-3 bg-status-error/10 text-status-error rounded-lg">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-destructive mb-0.5">Critical Backlog</div>
            <div className="text-2xl font-semibold text-destructive">{stats.critical}</div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-0 p-4 pb-4 border-b border-border">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by CN number..."
              className="pl-9 h-10"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <CrudTable
              columns={columns}
              data={shipments}
              isLoading={isLoading}
              pageSize={100}
              emptyMessage="No items found."
            />
          </div>
        </div>

        <div className="p-4 border-t mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) handlePageChange(page - 1);
                  }}
                  aria-disabled={page <= 1}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              <PaginationItem>
                <PaginationLink href="#" isActive>
                  {page}
                </PaginationLink>
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(page + 1);
                  }}
                  aria-disabled={page * pageSize >= stats.total}
                  className={page * pageSize >= stats.total ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Card>
    </div>
  );
};
