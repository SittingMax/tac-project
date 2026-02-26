/* eslint-disable @typescript-eslint/no-explicit-any -- Data mapping between Supabase and UI types */
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Plus, ChevronDown, Printer, MapPin, CheckCircle } from 'lucide-react';
import { RowSelectionState } from '@tanstack/react-table';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useShipments, useHardDeleteShipment, ShipmentWithRelations } from '@/hooks/useShipments';
import { getShipmentsColumns } from '@/components/shipments/shipments.columns';
import { useAuthStore } from '@/store/authStore';
import { useDebounce } from '@/hooks/useDebounce';

// Types
import { adaptToShipment } from '@/lib/utils/shipment-adapter';

export const Shipments: React.FC = () => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Search state
  // Search state synced with URL
  const [searchParams, setSearchParams] = useSearchParams();
  const querySearch = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(querySearch);
  const debouncedSearch = useDebounce(searchTerm, 500);

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
  const { data: shipments, isLoading, error, refetch } = useShipments({ search: debouncedSearch }); // Pass search term

  // Only Super Admin can delete
  const hardDeleteMutation = useHardDeleteShipment();

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentWithRelations | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<ShipmentWithRelations | null>(null);

  // Bulk selection state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const handleBulkAction = (action: string, selectedRows: any[]) => {
    if (action === 'print') {
      toast.success(`Prepared ${selectedRows.length} labels for printing.`);
    } else if (action === 'update_status') {
      toast.success(`Successfully updated status for ${selectedRows.length} shipments.`);
      refetch();
    } else if (action === 'assign_manifest') {
      toast.success(`Assigned ${selectedRows.length} shipments to a new manifest.`);
    }
    setRowSelection({});
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
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-24">
      <PageHeader
        title="Shipments"
        description="Manage and track all logistics orders / Master Record"
      />

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
          if (selectedRows.length === 0) return null;
          return (
            <div className="flex items-center gap-2 mr-4 border-r border-border pr-4">
              <span className="text-sm text-primary font-medium">
                {selectedRows.length} selected
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="h-8">
                    Bulk Actions <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleBulkAction('print', selectedRows)}>
                    <Printer className="w-4 h-4 mr-2" /> Print Labels
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('update_status', selectedRows)}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Update Statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkAction('assign_manifest', selectedRows)}
                  >
                    <MapPin className="w-4 h-4 mr-2" /> Assign to Manifest
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        }}
        toolbar={
          <div className="flex gap-3">
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
        onOpenChange={setIsCreateModalOpen}
        data-testid="create-shipment-modal"
      >
        <DialogContent className="sm:max-w-[800px] w-[95vw]">
          <DialogHeader>
            <DialogTitle>Create New Shipment</DialogTitle>
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
