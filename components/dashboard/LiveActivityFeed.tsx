import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { useShipments } from '@/hooks/useShipments';
import { useBookings } from '@/hooks/useBookings';
import { useExceptions } from '@/hooks/useExceptions';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Box, PackagePlus, AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/design-tokens';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

type FeedType = 'ALL' | 'SHIPMENTS' | 'BOOKINGS' | 'EXCEPTIONS';

interface FeedItem {
  id: string;
  type: 'SHIPMENT' | 'BOOKING' | 'EXCEPTION';
  timestamp: string;
  title: string;
  description: string;
  status: string;
  icon: React.ElementType;
  colorClass: string;
  link: string;
}

export const LiveActivityFeed: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FeedType>('ALL');

  // Fetch recent data streams (queries automatically run in parallel)
  const { data: shipments = [], isLoading: isLoadingShipments } = useShipments({ limit: 10 });
  const { data: bookings = [], isLoading: isLoadingBookings } = useBookings({ limit: 5 });
  const { data: exceptions = [], isLoading: isLoadingExceptions } = useExceptions({
    status: 'OPEN',
  });

  const isLoading = isLoadingShipments || isLoadingBookings || isLoadingExceptions;

  // Merge and sort
  const feedItems: FeedItem[] = useMemo(() => {
    const items: FeedItem[] = [];

    shipments.forEach((s) => {
      items.push({
        id: `ship-${s.id}`,
        type: 'SHIPMENT',
        timestamp: s.created_at,
        title: `Shipment ${s.cn_number}`,
        description: `${s.origin_hub?.name || 'Origin'} → ${s.destination_hub?.name || 'Dest'}`,
        status: s.status,
        icon: Box,
        colorClass:
          STATUS_COLORS[s.status as keyof typeof STATUS_COLORS] || 'text-muted-foreground',
        link: `/tracking?cn=${s.cn_number}`,
      });
    });

    bookings.forEach((b) => {
      items.push({
        id: `book-${b.id}`,
        type: 'BOOKING',
        timestamp: b.created_at,
        title: `Booking Request`,
        description: `${b.consignor_details.name} to ${b.consignee_details.name}`,
        status: b.status,
        icon: PackagePlus,
        colorClass: b.status === 'APPROVED' ? 'text-status-success' : 'text-primary',
        link: `/bookings`,
      });
    });

    exceptions.forEach((e) => {
      items.push({
        id: `exc-${e.id}`,
        type: 'EXCEPTION',
        timestamp: e.created_at,
        title: `Exception reported`,
        description: e.description,
        status: e.severity,
        icon: AlertTriangle,
        colorClass:
          e.severity === 'CRITICAL' || e.severity === 'HIGH'
            ? 'text-status-error'
            : 'text-status-warning',
        link: `/exceptions`,
      });
    });

    // Sort by newest first
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [shipments, bookings, exceptions]);

  const filteredItems = useMemo(() => {
    if (filter === 'ALL') return feedItems;
    if (filter === 'SHIPMENTS') return feedItems.filter((i) => i.type === 'SHIPMENT');
    if (filter === 'BOOKINGS') return feedItems.filter((i) => i.type === 'BOOKING');
    if (filter === 'EXCEPTIONS') return feedItems.filter((i) => i.type === 'EXCEPTION');
    return feedItems;
  }, [feedItems, filter]);

  const columns: ColumnDef<FeedItem>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Stream',
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          const Icon = item.icon;
          return (
            <div className="flex items-center gap-3">
              <Icon className={cn('w-4 h-4 flex-shrink-0', item.colorClass)} />
              <span className="font-medium text-sm text-foreground whitespace-nowrap">
                {item.title}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'description',
        header: 'Details',
        enableSorting: false,
        cell: ({ row }) => {
          return (
            <span className="text-xs text-muted-foreground line-clamp-1">
              {row.original.description}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] h-5 px-2.5 rounded-full border-transparent bg-muted/40 font-medium tracking-wide whitespace-nowrap',
                item.colorClass
              )}
            >
              {item.status.replace(/_/g, ' ')}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'timestamp',
        header: 'Time',
        enableSorting: false,
        cell: ({ row }) => {
          return (
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(row.original.timestamp), { addSuffix: true })}
            </span>
          );
        },
      },
      {
        id: 'actions',
        enableSorting: false,
        cell: ({ row }) => {
          return (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors hover:bg-primary/10 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                navigate(row.original.link);
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          );
        },
      },
    ],
    [navigate]
  );

  return (
    <Card className="col-span-1 border-border/50 flex flex-col h-[500px]">
      <div className="p-4 pb-0 border-b border-border/50">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Operations Stream
            </h3>
            <span className="flex h-2 w-2 relative ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success"></span>
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/shipments')}
            className="text-xs shadow-sm bg-background/50 hover:bg-background/80"
          >
            View Console
          </Button>
        </div>

        <Tabs defaultValue="ALL" onValueChange={(v) => setFilter(v as FeedType)}>
          <TabsList className="flex w-full h-auto bg-transparent p-0 gap-6 justify-start rounded-none">
            <TabsTrigger
              value="ALL"
              className="text-xs font-medium text-muted-foreground data-[state=active]:text-foreground bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-none"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="SHIPMENTS"
              className="text-xs font-medium text-muted-foreground data-[state=active]:text-foreground bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-none hidden sm:block"
            >
              Shipments
            </TabsTrigger>
            <TabsTrigger
              value="SHIPMENTS"
              className="text-xs font-medium text-muted-foreground data-[state=active]:text-foreground bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-none sm:hidden"
            >
              Ship
            </TabsTrigger>
            <TabsTrigger
              value="BOOKINGS"
              className="text-xs font-medium text-muted-foreground data-[state=active]:text-foreground bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-none"
            >
              Book
            </TabsTrigger>
            <TabsTrigger
              value="EXCEPTIONS"
              className="text-xs font-medium text-muted-foreground data-[state=active]:text-foreground bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-none"
            >
              Alerts
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4 flex-1 overflow-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="w-8 h-8 rounded-none bg-muted animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-1/3 bg-muted animate-pulse rounded-none" />
                  <div className="h-3 w-2/3 bg-muted animate-pulse rounded-none" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredItems}
            enableSelection={false}
            enableRowDrag={false}
            pageSize={10}
            className="flex-1 flex flex-col min-h-0 border-none shadow-none bg-transparent pt-2 px-4"
          />
        )}
      </div>
    </Card>
  );
};
