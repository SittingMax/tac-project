import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookingDialog } from '@/components/bookings/BookingDialog';
import { useBookings } from '@/hooks/useBookings';
import { Skeleton } from '@/components/ui/skeleton';
import { CrudTable } from '@/components/crud/CrudTable';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { format } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import { Booking } from '@/types';

export const Bookings: React.FC = () => {
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const { data: bookings = [], isLoading } = useBookings();

    const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;

    // Count bookings created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = bookings.filter((b) => new Date(b.created_at) >= today).length;

    const columns: ColumnDef<Booking>[] = [
        {
            accessorKey: 'id',
            header: 'ID',
            cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('id')}</span>,
        },
        {
            accessorKey: 'created_at',
            header: 'Created',
            cell: ({ row }) => (
                <span className="text-sm">
                    {format(new Date(row.getValue('created_at')), 'dd MMM yyyy, HH:mm')}
                </span>
            ),
        },
        {
            id: 'customer',
            header: 'Customer',
            cell: ({ row }) => (
                <div className="font-medium text-foreground">
                    {row.original.consignor_details.name}
                    <div className="text-xs text-muted-foreground">{row.original.whatsapp_number || row.original.consignor_details.phone}</div>
                </div>
            ),
        },
        {
            id: 'destination',
            header: 'Destination',
            cell: ({ row }) => (
                <span className="text-sm">{row.original.consignee_details.city}, {row.original.consignee_details.state}</span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
        },
    ];

    return (
        <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Bookings Management"
                    description="View, manage, and track all incoming logistics bookings."
                />
                <Button
                    onClick={() => setIsBookingModalOpen(true)}
                    className="font-mono text-xs uppercase tracking-widest px-8 rounded-none"
                >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    New Booking
                </Button>
                <BookingDialog
                    open={isBookingModalOpen}
                    onOpenChange={setIsBookingModalOpen}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-none border-border/40 shadow-sm backdrop-blur-lg bg-card/80">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Pending Bookings</CardTitle>
                        <CalendarDays className="h-4 w-4 text-status-warning" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-16" /> : (
                            <>
                                <div className="text-3xl font-black text-foreground">{pendingCount}</div>
                                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-1">Requires attention</p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card className="rounded-none border-border/40 shadow-sm backdrop-blur-lg bg-card/80">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Created Today</CardTitle>
                        <PackageSearch className="h-4 w-4 text-status-success" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-16" /> : (
                            <>
                                <div className="text-3xl font-black text-foreground">{todayCount}</div>
                                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-1">Total volume</p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <CrudTable
                columns={columns}
                data={bookings}
                searchKey="status"
                searchPlaceholder="Filter by status..."
                isLoading={isLoading}
                emptyMessage="No bookings loaded yet."
            />
        </div>
    );
};
