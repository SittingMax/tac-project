import React, { useState, useMemo, useEffect } from 'react';
import { startOfDay } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { Download, Plus, ChevronDown, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Table as TanStackTable } from '@tanstack/react-table';

// UI Components
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader, PageContainer, SectionCard, SizedDialog } from '@/components/ui-core';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { CrudTable } from '@/components/crud/CrudTable';
import { CrudDeleteDialog } from '@/components/crud/CrudDeleteDialog';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';

// Domain Components
import { CreateShipmentForm } from '@/components/shipments/CreateShipmentForm';
import { ShipmentDetails } from '@/components/shipments/ShipmentDetails';

// Hooks & Data
import {
  useShipments,
  useHardDeleteShipment,
  useUpdateShipmentStatus,
  ShipmentWithRelations,
} from '@/hooks/useShipments';
import { getShipmentsColumns } from '@/components/shipments/shipments.columns';
import { useAuthStore } from '@/store/authStore';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

// Types
import { adaptToShipment } from '@/lib/utils/shipment-adapter';
import { VALID_STATUS_TRANSITIONS, type ShipmentStatusType } from '@/lib/schemas/shipment.schema';
import { formatDate } from '@/lib/formatters';

const formatStatusLabel = (status: ShipmentStatusType) => status.replaceAll('_', ' ');

export const Shipments: React.FC = () => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const queryClient = useQueryClient();

  // Search state
  // Search state synced with URL
  const [searchParams, setSearchParams] = useSearchParams();
  const querySearch = searchParams.get('search') || '';
  const queryStatus = searchParams.get('status') || '';
  const deliveredFilter = searchParams.get('delivered') || '';
  const shouldOpenCreateModal = searchParams.get('new') === 'true';
  const [searchTerm, setSearchTerm] = useState(querySearch);
  const debouncedSearch = useDebounce(searchTerm, 500);
  const deliveredSince =
    deliveredFilter === 'today' ? startOfDay(new Date()).toISOString() : undefined;

  // Sync URL -> State (External navigation)
  useEffect(() => {
    if (querySearch !== searchTerm) {
      setSearchTerm(querySearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [querySearch]);

  // Sync State -> URL (User typing)
  useEffect(() => {
    if (debouncedSearch !== querySearch) {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          if (debouncedSearch) newParams.set('search', debouncedSearch);
          else newParams.delete('search');
          return newParams;
        },
        { replace: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Data fetching
  const {
    data: shipments,
    isLoading,
    error,
    refetch,
  } = useShipments({
    search: debouncedSearch,
    status: queryStatus || undefined,
    deliveredSince,
  }); // Support status deep links

  // Only Super Admin can delete
  const hardDeleteMutation = useHardDeleteShipment();
  const updateShipmentStatusMutation = useUpdateShipmentStatus();

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentWithRelations | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<ShipmentWithRelations | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const handleBulkStatusUpdate = async (
    status: ShipmentStatusType,
    selectedRows: Array<{ original: ShipmentWithRelations }>
  ) => {
    if (selectedRows.length === 0) return;

    setIsBulkUpdating(true);

    const results = await Promise.allSettled(
      selectedRows.map((row) =>
        updateShipmentStatusMutation.mutateAsync({
          id: row.original.id,
          status,
          silent: true,
          skipInvalidation: true,
        })
      )
    );

    const successCount = results.filter((result) => result.status === 'fulfilled').length;
    const failureCount = results.length - successCount;

    if (successCount > 0) {
      toast.success(
        `${successCount} shipment${successCount === 1 ? '' : 's'} updated to ${formatStatusLabel(status)}`
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all });
    }

    if (failureCount > 0) {
      const firstFailure = results.find(
        (result): result is PromiseRejectedResult => result.status === 'rejected'
      );
      const errorMessage =
        firstFailure?.reason instanceof Error ? firstFailure.reason.message : 'Unknown error';

      toast.error(
        `Failed to update ${failureCount} shipment${failureCount === 1 ? '' : 's'}: ${errorMessage}`
      );
    }

    setIsBulkUpdating(false);
  };

  // Table columns with callbacks
  const columns = useMemo(
    () =>
      getShipmentsColumns({
        onView: (row) => setSelectedShipment(row),
        onEdit: (row) => {
          // For now, open view modal - edit form could be added later
          setSelectedShipment(row);
        },
        onDelete: isSuperAdmin
          ? (row) => {
              setRowToDelete(row);
              setDeleteOpen(true);
            }
          : undefined,
      }),
    [isSuperAdmin]
  );

  // Handlers
  useEffect(() => {
    if (shouldOpenCreateModal) {
      setIsCreateModalOpen(true);
    }
  }, [shouldOpenCreateModal]);

  const handleCreateModalChange = (open: boolean) => {
    setIsCreateModalOpen(open);

    if (!open && searchParams.get('new') === 'true') {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('new');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const handleDelete = async () => {
    if (!rowToDelete) return;

    if (isSuperAdmin) {
      await hardDeleteMutation.mutateAsync(rowToDelete.id);
    }
    // No fallback call for regular users as they shouldn't reach here

    setRowToDelete(null);
    setDeleteOpen(false);
  };

  return (
    <PageContainer>
      <PageHeader title="Shipments" description="Manage and track all consignment notes" />

      <SectionCard>
        {/* Table with CRUD */}
        <CrudTable
          columns={columns}
          data={shipments ?? []}
          isLoading={isLoading}
          searchKey="shipments"
          searchPlaceholder="Search by CN, Invoice, Name, Phone..."
          searchValue={searchTerm}
          onSearch={setSearchTerm}
          enableRowSelection
          bulkActions={(table) => (
            <ShipmentBulkActions
              table={table}
              isBulkUpdating={isBulkUpdating}
              handleBulkStatusUpdate={handleBulkStatusUpdate}
            />
          )}
          toolbar={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  if (shipments) {
                    import('@/lib/export').then(({ exportToCSV }) => {
                      const dataToExport = shipments.map((s) => ({
                        awb: s.cn_number,
                        Customer: s.customer?.name,
                        Origin: s.origin_hub?.code || s.origin_hub_id,
                        Destination: s.destination_hub?.code || s.destination_hub_id,
                        Status: s.status,
                        Mode: s.mode,
                        Packages: s.package_count,
                        Weight: s.total_weight,
                        Created: formatDate(s.created_at),
                      }));
                      exportToCSV(
                        dataToExport,
                        `shipments-${new Date().toISOString().split('T')[0]}`
                      );
                    });
                  }
                }}
                disabled={!shipments || shipments.length === 0}
              >
                <Download size={16} strokeWidth={1.5} className="mr-2" /> Export
              </Button>
              <Button onClick={() => setIsCreateModalOpen(true)} data-testid="new-shipment-button">
                <Plus size={16} strokeWidth={1.5} className="mr-2" /> New Shipment
              </Button>
            </>
          }
          emptyState={
            error ? (
              <ErrorState
                title="Unable to load shipments"
                description="The system could not retrieve shipment data. Please retry."
                onRetry={() => refetch()}
              />
            ) : (
              <EmptyState
                title="No shipments found"
                description={
                  searchTerm || debouncedSearch
                    ? 'No shipments match the selected filters.'
                    : 'Shipments will appear here once created or imported.'
                }
                actionLabel={searchTerm || debouncedSearch ? undefined : 'Create shipment'}
                onAction={
                  searchTerm || debouncedSearch ? undefined : () => setIsCreateModalOpen(true)
                }
              />
            )
          }
        />
      </SectionCard>

      {/* Create Wizard Modal */}
      <SizedDialog
        open={isCreateModalOpen}
        onOpenChange={handleCreateModalChange}
        size="5xl"
        title="Create New Shipment"
      >
        <CreateShipmentForm
          onSuccess={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </SizedDialog>

      {/* Details Modal */}
      <Dialog
        open={!!selectedShipment}
        onOpenChange={(open) => {
          if (!open) setSelectedShipment(null);
        }}
      >
        <DialogContent className="sm:max-w-4xl w-[95vw] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Shipment Details</DialogTitle>
          </DialogHeader>
          {selectedShipment && (
            <ShipmentDetails
              shipment={adaptToShipment(selectedShipment)}
              onClose={() => setSelectedShipment(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <CrudDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={isSuperAdmin ? 'Permanently Delete Shipment?' : 'Archive Shipment?'}
        description={
          isSuperAdmin
            ? `This will PERMANENTLY delete shipment "${rowToDelete?.cn_number ?? ''}" and all related data. This action cannot be undone.`
            : `This will remove shipment "${rowToDelete?.cn_number ?? ''}" from your view.`
        }
        onConfirm={handleDelete}
        confirmLabel={isSuperAdmin ? 'Delete Permanently' : 'Archive'}
      />
    </PageContainer>
  );
};

const getCommonNextStatuses = (selectedRows: Array<{ original: ShipmentWithRelations }>) => {
  const sharedStatuses = selectedRows.reduce<ShipmentStatusType[] | null>((accumulator, row) => {
    const currentStatus = row.original.status as ShipmentStatusType;
    const allowedStatuses = VALID_STATUS_TRANSITIONS[currentStatus] ?? [];

    if (accumulator === null) {
      return [...allowedStatuses];
    }

    return accumulator.filter((status) => allowedStatuses.includes(status));
  }, null);

  return sharedStatuses ?? [];
};

function ShipmentBulkActions({
  table,
  isBulkUpdating,
  handleBulkStatusUpdate,
}: {
  table: TanStackTable<ShipmentWithRelations>;
  isBulkUpdating: boolean;
  handleBulkStatusUpdate: (
    status: ShipmentStatusType,
    selectedRows: Array<{ original: ShipmentWithRelations }>
  ) => void;
}) {
  const selectedRows = table.getSelectedRowModel().rows as unknown as Array<{
    original: ShipmentWithRelations;
  }>;

  if (selectedRows.length === 0) return null;
  const commonNextStatuses = getCommonNextStatuses(selectedRows);

  return (
    <div className="flex items-center gap-2 mr-4 border-r border-border pr-4">
      <span className="text-sm text-primary font-medium">{selectedRows.length} selected</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className="h-8" disabled={isBulkUpdating}>
            Bulk Actions <ChevronDown size={16} strokeWidth={1.5} className="ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Shipment Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {commonNextStatuses.length > 0 ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={isBulkUpdating}>
                <CheckCircle size={16} strokeWidth={1.5} className="mr-2" />
                Update Status
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {commonNextStatuses.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => {
                      void handleBulkStatusUpdate(status, selectedRows);
                      table.setRowSelection({});
                    }}
                    disabled={isBulkUpdating}
                  >
                    {formatStatusLabel(status)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : (
            <DropdownMenuItem disabled>No shared status transition</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
