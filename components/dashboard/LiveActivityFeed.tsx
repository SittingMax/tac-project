import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { useShipments } from '@/hooks/useShipments';
import { useBookings } from '@/hooks/useBookings';
import { useExceptions } from '@/hooks/useExceptions';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Box, PackagePlus, AlertTriangle, ChevronRight, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/design-tokens';
import { Skeleton } from '../ui/skeleton';

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
    const { data: exceptions = [], isLoading: isLoadingExceptions } = useExceptions({ status: 'OPEN' });

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
                colorClass: STATUS_COLORS[s.status as keyof typeof STATUS_COLORS] || 'text-muted-foreground',
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
                colorClass: e.severity === 'CRITICAL' || e.severity === 'HIGH' ? 'text-status-error' : 'text-status-warning',
                link: `/exceptions`,
            });
        });

        // Sort by newest first
        return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [shipments, bookings, exceptions]);

    const filteredItems = useMemo(() => {
        if (filter === 'ALL') return feedItems;
        if (filter === 'SHIPMENTS') return feedItems.filter(i => i.type === 'SHIPMENT');
        if (filter === 'BOOKINGS') return feedItems.filter(i => i.type === 'BOOKING');
        if (filter === 'EXCEPTIONS') return feedItems.filter(i => i.type === 'EXCEPTION');
        return feedItems;
    }, [feedItems, filter]);

    return (
        <Card className="col-span-1 border-border/50 flex flex-col h-[420px]">
            <div className="p-5 pb-3 border-b border-border/50">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">Operations Stream</h3>
                        <span className="flex h-2 w-2 relative ml-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-status-success opacity-75"></span>
                            <span className="relative inline-flex rounded-none h-2 w-2 bg-status-success"></span>
                        </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/shipments')} className="text-xs">
                        View Console
                    </Button>
                </div>

                <Tabs defaultValue="ALL" onValueChange={(v) => setFilter(v as FeedType)}>
                    <TabsList className="grid grid-cols-4 w-full h-8">
                        <TabsTrigger value="ALL" className="text-xs">All</TabsTrigger>
                        <TabsTrigger value="SHIPMENTS" className="text-xs hidden sm:block">Shipments</TabsTrigger>
                        <TabsTrigger value="SHIPMENTS" className="text-xs sm:hidden">Ship</TabsTrigger>
                        <TabsTrigger value="BOOKINGS" className="text-xs">Book</TabsTrigger>
                        <TabsTrigger value="EXCEPTIONS" className="text-xs">Alerts</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <ScrollArea className="flex-1 p-5">
                <div className="space-y-6">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex gap-4 items-start pl-6 relative">
                                <Skeleton className="w-4 h-4 rounded-full absolute left-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                            </div>
                        ))
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            <Activity className="w-8 h-8 opacity-20 mx-auto mb-3" />
                            No recent activity found.
                        </div>
                    ) : (
                        filteredItems.map((item, index) => (
                            <div
                                key={item.id}
                                className="relative pl-6 group cursor-pointer"
                                onClick={() => navigate(item.link)}
                            >
                                {/* Timeline line */}
                                {index !== filteredItems.length - 1 && (
                                    <div className="absolute left-[7px] top-6 bottom-[-24px] w-px bg-border group-hover:bg-primary/30 transition-colors" />
                                )}

                                {/* Timeline node */}
                                <div className="absolute left-0 top-1">
                                    <CircleDot className={cn("w-4 h-4 bg-background", item.colorClass)} />
                                </div>

                                {/* Content block */}
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                                                {item.title}
                                            </span>
                                            <Badge variant="outline" className={cn("text-[10px] h-4 px-1 border-current opacity-70", item.colorClass)}>
                                                {item.status.replace(/_/g, ' ')}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                            {item.description}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
};
