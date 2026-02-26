import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useShipments } from '../hooks/useShipments';
import { Search, Warehouse, Package } from 'lucide-react';
import { HubLocation } from '../types';
import { HUBS } from '../lib/constants';
import { TableSkeleton } from '../components/ui/skeleton';

export const Inventory: React.FC = () => {
  const [filterHub, setFilterHub] = useState<HubLocation | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Determine hub UUID for filtering (origin OR destination hub)
  const selectedHubId = filterHub === 'ALL' ? undefined : HUBS[filterHub]?.uuid;

  const { data: shipments = [], isLoading } = useShipments({
    page,
    pageSize,
    search: search || undefined,
    hubId: selectedHubId,
  });

  // Calculate stats (Note: Total stats would need a separate query if we want accurate global counts with pagination)
  // For now, we'll display counts of *loaded* items or maybe we should fetch stats separately.
  // We'll keep the UI for stats but maybe hide values or show "Showing X items" if we don't have total count.
  const stats = {
    total: shipments.length, // This is just current page count, ideally we need total count from API
    critical: shipments.filter((s) => {
      const hours = (Date.now() - new Date(s.created_at).getTime()) / (1000 * 60 * 60);
      return hours >= 24;
    }).length,
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

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-border/40 pb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground flex items-center gap-2.5">
            Network Inventory<span className="text-primary">.</span>
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-2">
            Real-time stock view across hub network
          </p>
        </div>
        <div className="flex gap-1 mt-6 md:mt-0 bg-background p-1 border border-border/40">
          <button
            className={`px-4 py-2 font-mono uppercase tracking-widest text-[10px] transition-colors ${filterHub === 'ALL' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/10'}`}
            onClick={() => {
              setFilterHub('ALL');
              setPage(1);
            }}
          >
            All Hubs
          </button>
          <button
            className={`px-4 py-2 font-mono uppercase tracking-widest text-[10px] transition-colors ${filterHub === 'IMPHAL' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/10'}`}
            onClick={() => {
              setFilterHub('IMPHAL');
              setPage(1);
            }}
          >
            Imphal
          </button>
          <button
            className={`px-4 py-2 font-mono uppercase tracking-widest text-[10px] transition-colors ${filterHub === 'NEW_DELHI' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/10'}`}
            onClick={() => {
              setFilterHub('NEW_DELHI');
              setPage(1);
            }}
          >
            New Delhi
          </button>
        </div>
      </div>

      <Card className="grid grid-cols-2 gap-px bg-border/40 border-y border-border/40 rounded-none shadow-none my-8">
        {/* Stats are strictly for current page now, which is a trade-off until we implement aggregate API */}
        <div className="p-6 flex items-center gap-4 bg-background">
          <div className="p-3 bg-primary/10 text-primary rounded-none">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest mb-1">
              Items on Page
            </div>
            <div className="text-3xl font-black text-foreground tracking-tighter leading-none">
              {stats.total}
            </div>
          </div>
        </div>
        <div className="p-6 flex items-center gap-4 bg-background">
          <div className="p-3 bg-status-error/10 text-status-error rounded-none">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-semibold text-destructive uppercase tracking-widest mb-1">
              Critical on Page
            </div>
            <div className="text-3xl font-black text-destructive tracking-tighter leading-none">
              {stats.critical}
            </div>
          </div>
        </div>
      </Card>

      <Card className="rounded-none border-border shadow-none">
        <div className="flex justify-between items-center mb-0 p-4 pb-4 border-b border-border/40">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="QUERY CN..."
              className="pl-9 h-10 rounded-none font-mono text-xs uppercase"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/5">
              <TableRow className="border-b-2 border-border/40 hover:bg-transparent">
                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-4">
                  cn_number
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-4">
                  PKG_COUNT
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-4">
                  WEIGHT_KG
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-4">
                  NODE_LOCATION
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-4">
                  SYSTEM_STATUS
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-4">
                  AGING_INDEX
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <TableSkeleton rows={5} columns={6} />
                  </TableCell>
                </TableRow>
              ) : shipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No items found.
                  </TableCell>
                </TableRow>
              ) : (
                shipments.map((s) => {
                  const location = getInventoryLocation(s);
                  const hubName = location ? HUBS[location].name : 'Unknown';
                  const bucket = getAgingBucket(s.created_at);

                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <span className="font-mono text-foreground font-bold">{s.cn_number}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">{s.package_count}</span>
                      </TableCell>
                      <TableCell className="font-mono">{s.total_weight} kg</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Warehouse className="w-4 h-4 text-muted-foreground" />
                          {hubName}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          variant="outline"
                          className="rounded-none font-mono text-[9px] uppercase tracking-widest border-border/60"
                        >
                          {s.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-mono font-bold ${bucketColor(bucket)}`}>
                          {bucket}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 border-t">
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
                  // Disable next if we have fewer items than page size (simple check)
                  aria-disabled={shipments.length < pageSize}
                  className={shipments.length < pageSize ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Card>
    </div>
  );
};
