import React, { useState } from 'react';
import { PageHeader, PageContainer, SectionCard } from '@/components/ui-core/layout';
import { StatCard } from '@/components/ui-core';
import { CalendarDays, PackageSearch, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookingDialog } from '@/components/bookings/BookingDialog';
import { useBookings } from '@/hooks/useBookings';
import { Skeleton } from '@/components/ui/skeleton';
import { CrudTable } from '@/components/crud/CrudTable';
import { StatusBadge } from '@/components/domain/status-badge';
import { formatDateTime } from '@/lib/formatters';
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
        <span className="text-sm">{formatDateTime(row.getValue('created_at'))}</span>
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
    <PageContainer>
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
        <StatCard
          title="Pending Bookings"
          value={isLoading ? <Skeleton className="h-8 w-16" /> : pendingCount}
          subtitle="Requires attention"
          icon={CalendarDays}
          iconColor="warning"
        />
        <StatCard
          title="Created Today"
          value={isLoading ? <Skeleton className="h-8 w-16" /> : todayCount}
          subtitle="Bookings received today"
          icon={PackageSearch}
          iconColor="success"
        />
      </div>

      <SectionCard
        title="Incoming Bookings"
        description="Review and track submitted booking requests"
      >
        <CrudTable
          columns={columns}
          data={bookings}
          searchKey="status"
          searchPlaceholder="Filter by status..."
          isLoading={isLoading}
          emptyMessage="No bookings loaded yet."
          density="compact"
        />
      </SectionCard>
    </PageContainer>
  );
};
