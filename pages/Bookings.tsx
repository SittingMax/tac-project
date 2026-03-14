import React, { useState } from 'react';
import { PageHeader } from '@/components/ui-core/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, PackageSearch, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookingDialog } from '@/components/bookings/BookingDialog';
import { useBookings } from '@/hooks/useBookings';
import { Skeleton } from '@/components/ui/skeleton';
import { CrudTable } from '@/components/crud/CrudTable';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { format } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import { Booking } from '@/types';
import { IdBadge } from '@/components/ui-core/data/id-badge';

export const Bookings: React.FC = () => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const { data: bookings = [], isLoading } = useBookings();

  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = bookings.filter((b) => new Date(b.created_at) >= today).length;

  const columns: ColumnDef<Booking>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <IdBadge entity="booking" idValue={row.getValue('id')} />,
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
          <div className="text-xs text-muted-foreground">
            {row.original.whatsapp_number || row.original.consignor_details.phone}
          </div>
        </div>
      ),
    },
    {
      id: 'destination',
      header: 'Destination',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.consignee_details.city}, {row.original.consignee_details.state}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <PageHeader
        title="Bookings"
        description="View, manage, and track all incoming logistics bookings"
      >
        <Button onClick={() => setIsBookingModalOpen(true)}>
          <Plus data-icon="inline-start" />
          New Booking
        </Button>
      </PageHeader>

      <BookingDialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Bookings
            </CardTitle>
            <CalendarDays className="size-4 text-status-warning" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-semibold text-foreground">{pendingCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Created Today
            </CardTitle>
            <PackageSearch className="size-4 text-status-success" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-semibold text-foreground">{todayCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Bookings received today</p>
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
