import React, { useState, useMemo, useEffect } from 'react';
import { startOfDay } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { Download, Plus, ChevronDown, CheckCircle } from 'lucide-react';
import { RowSelectionState } from '@tanstack/react-table';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui-core/layout';
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

// CRUD Components
import { CrudTable } from '@/components/crud/CrudTable';
import { CrudDeleteDialog } from '@/components/crud/CrudDeleteDialog';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { TableSkeleton } from '@/components/states/TableSkeleton';

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

// Types
import { adaptToShipment } from '@/lib/utils/shipment-adapter';
import { VALID_STATUS_TRANSITIONS, type ShipmentStatusType } from '@/lib/schemas/shipment.schema';

const formatStatusLabel = (status: ShipmentStatusType) => status.replaceAll('_', ' ');

export const Shipments: React.FC = () => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

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

  // Bulk selection state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

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
        })
      )
    );

    const successCount = results.filter((result) => result.status === 'fulfilled').length;
    const failureCount = results.length - successCount;

    if (successCount > 0) {
      toast.success(
        `${successCount} shipment${successCount === 1 ? '' : 's'} updated to ${formatStatusLabel(status)}`
      );
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

    setRowSelection({});
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24">
      <PageHeader title="Shipments" description="Manage and track all consignment notes" />

      {/* Table with CRUD */}
      <CrudTable
        columns={columns}
        data={shipments ?? []}
        searchKey="cn_number" // Keep for prop requirement, but onSearch overrides behavior
        searchPlaceholder="Search by CN, Invoice, Name, Phone..."
        onSearch={setSearchTerm} // Pass handleSearch
        searchValue={searchTerm} // Sync input value
        isLoading={isLoading}
        loadingState={<TableSkeleton />}
        emptyState={({ isFiltered }) =>
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
                isFiltered || debouncedSearch
                  ? 'No shipments match the selected filters.'
                  : 'Shipments will appear here once created or imported.'
              }
              actionLabel={isFiltered || debouncedSearch ? undefined : 'Create shipment'}
              onAction={
                isFiltered || debouncedSearch ? undefined : () => setIsCreateModalOpen(true)
              }
            />
          )
        }
        enableRowSelection={true}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        bulkActions={(table) => {
          const selectedRows = table.getSelectedRowModel().rows;
          const commonNextStatuses = getCommonNextStatuses(selectedRows);

          if (selectedRows.length === 0) return null;
          return (
            <div className="flex items-center gap-2 mr-4 border-r border-border pr-4">
              <span className="text-sm text-primary font-medium">
                {selectedRows.length} selected
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="h-8" disabled={isBulkUpdating}>
                    Bulk Actions <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Shipment Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {commonNextStatuses.length > 0 ? (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger disabled={isBulkUpdating}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Update Status
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {commonNextStatuses.map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => void handleBulkStatusUpdate(status, selectedRows)}
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
        }}
        toolbar={
          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                if (shipments) {
                  import('@/lib/export').then(({ exportToCSV }) => {
                    // Flatten data for export
                    const dataToExport = shipments.map((s) => ({
                      awb: s.cn_number,
                      Customer: s.customer?.name,
                      Origin: s.origin_hub?.code || s.origin_hub_id,
                      Destination: s.destination_hub?.code || s.destination_hub_id,
                      Status: s.status,
                      Mode: s.mode,
                      Packages: s.package_count,
                      Weight: s.total_weight,
                      Created: new Date(s.created_at).toLocaleDateString(),
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
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)} data-testid="new-shipment-button">
              <Plus className="w-4 h-4 mr-2" /> New Shipment
            </Button>
          </div>
        }
      />

      {/* Create Wizard Modal */}
      <Dialog
        open={isCreateModalOpen}
        onOpenChange={handleCreateModalChange}
        data-testid="create-shipment-modal"
      >
        <DialogContent className="sm:max-w-5xl w-[95vw] overflow-y-auto max-h-[90vh] p-0 gap-0 rounded-xl overflow-x-hidden shadow-2xl">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-semibold tracking-tight">
              Create New Shipment
            </DialogTitle>
          </DialogHeader>
          <CreateShipmentForm
            onSuccess={() => setIsCreateModalOpen(false)}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

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
    </div>
  );
};
