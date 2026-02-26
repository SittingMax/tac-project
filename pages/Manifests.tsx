/* eslint-disable @typescript-eslint/no-explicit-any -- Data mapping between Supabase and UI types */
import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DataTable } from '../components/ui/data-table';
import { StatusBadge } from '../components/domain/StatusBadge';
import { KPICard } from '../components/domain/KPICard';
import { ColumnDef } from '@tanstack/react-table';
import {
  useManifests,
  useUpdateManifestStatus,
  useHardDeleteManifest,
  ManifestWithRelations,
} from '../hooks/useManifests';
import { useRealtimeManifests } from '../hooks/useRealtime';
import { ManifestBuilderWizard } from '../components/manifests/ManifestBuilder/ManifestBuilderWizard';
import {
  Truck,
  Plane,
  Play,
  CheckCircle,
  Package,
  Weight,
  Scan,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { CrudDeleteDialog } from '@/components/crud/CrudDeleteDialog';

export const Manifests: React.FC = () => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const { data: manifests = [], isLoading, isError, error } = useManifests();
  const updateStatusMutation = useUpdateManifestStatus();
  const hardDeleteMutation = useHardDeleteManifest();

  const [isEnterpriseOpen, setIsEnterpriseOpen] = useState(false);
  const [selectedManifestId, setSelectedManifestId] = useState<string | null>(null);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [manifestToDelete, setManifestToDelete] = useState<ManifestWithRelations | null>(null);

  // Enable realtime updates
  useRealtimeManifests();

  const handleStatusChange = useCallback(
    async (id: string, newStatus: 'DEPARTED' | 'ARRIVED') => {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
    },
    [updateStatusMutation]
  );

  const handleEditManifest = useCallback((id: string) => {
    setSelectedManifestId(id);
    setIsEnterpriseOpen(true);
  }, []);

  const handleDeleteClick = useCallback((manifest: ManifestWithRelations) => {
    setManifestToDelete(manifest);
    setDeleteOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!manifestToDelete) return;
    await hardDeleteMutation.mutateAsync(manifestToDelete.id);
    setManifestToDelete(null);
    setDeleteOpen(false);
  };

  const columns: ColumnDef<ManifestWithRelations>[] = useMemo(
    () => [
      {
        accessorKey: 'manifest_no',
        header: 'Reference',
        cell: ({ row }) => (
          <span className="font-mono font-bold text-foreground">{row.getValue('manifest_no')}</span>
        ),
      },
      {
        id: 'transport',
        header: 'Transport',
        cell: ({ row }) => {
          const meta = row.original.vehicle_meta as any;
          const flightLabel =
            row.original.flight_number ?? meta?.flight_no ?? meta?.flightNumber ?? 'N/A';
          const carrierLabel = row.original.airline_code ?? meta?.carrier ?? '';
          const vehicleLabel =
            row.original.vehicle_number ?? meta?.vehicle_no ?? meta?.vehicleId ?? 'N/A';
          const driverLabel =
            row.original.driver_name ?? meta?.driver_name ?? meta?.driverName ?? 'N/A';
          return (
            <div className="flex items-center gap-2">
              {row.original.type === 'AIR' ? (
                <Plane className="w-4 h-4 text-feature-air" />
              ) : (
                <Truck className="w-4 h-4 text-feature-ground" />
              )}
              <div>
                <span className="font-medium text-foreground">
                  {row.original.type === 'AIR' ? flightLabel : driverLabel}
                </span>
                <div className="text-xs text-muted-foreground">
                  {row.original.type === 'AIR' ? carrierLabel : vehicleLabel}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: 'route',
        header: 'Route',
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.from_hub?.code || '?'} → {row.original.to_hub?.code || '?'}
          </span>
        ),
      },
      {
        id: 'load',
        header: 'Load',
        cell: ({ row }) => (
          <div>
            <div className="font-semibold">{row.original.total_shipments} shipments</div>
            <div className="text-xs text-muted-foreground">{row.original.total_weight} kg</div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div className="flex items-center gap-1">
              {m.status === 'CLOSED' && (
                <Button size="sm" onClick={() => handleStatusChange(m.id, 'DEPARTED')}>
                  <Play className="w-3 h-3 mr-1" /> Depart
                </Button>
              )}
              {m.status === 'DEPARTED' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleStatusChange(m.id, 'ARRIVED')}
                >
                  <CheckCircle className="w-3 h-3 mr-1" /> Arrive
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => handleEditManifest(m.id)}>
                View
              </Button>

              {isSuperAdmin && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteClick(m)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [handleStatusChange, handleEditManifest, handleDeleteClick, isSuperAdmin]
  );

  const openCount = manifests.filter((m) =>
    ['DRAFT', 'OPEN', 'BUILDING'].includes(m.status)
  ).length;
  const transitCount = manifests.filter((m) => m.status === 'DEPARTED').length;
  const transitWeight = manifests
    .filter((m) => m.status === 'DEPARTED')
    .reduce((acc, m) => acc + (m.total_weight || 0), 0);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fleet Manifests</h1>
            <p className="text-muted-foreground text-sm">Manage linehaul movements between hubs.</p>
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Card className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64" />
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fleet Manifests</h1>
            <p className="text-muted-foreground text-sm">Manage linehaul movements between hubs.</p>
          </div>
        </div>
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium text-foreground">Failed to load manifests</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-24">
      <div className="flex justify-between items-end border-b border-border/40 pb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground flex items-center gap-2.5">Fleet Manifests<span className="text-primary">.</span></h1>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-2">Manage linehaul movements between hubs</p>
        </div>
        <Button
          onClick={() => {
            setSelectedManifestId(null);
            setIsEnterpriseOpen(true);
          }}
          variant="default"
          className="rounded-none font-mono text-xs uppercase tracking-widest px-8"
          data-testid="create-manifest-button"
        >
          <Scan className="w-4 h-4 mr-2" /> Init Manifest
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/40 border-y border-border/40">
        <KPICard
          title="Open Manifests"
          value={openCount}
          icon={<Package className="w-5 h-5 opacity-50" />}
          trend="neutral"
        />
        <KPICard
          title="In Transit"
          value={transitCount}
          icon={<Truck className="w-5 h-5 opacity-50" />}
          trend="up"
        />
        <KPICard
          title="Transit Weight"
          value={`${transitWeight} kg`}
          icon={<Weight className="w-5 h-5 opacity-50" />}
        />
      </div>

      {/* Empty state */}
      {manifests.length === 0 ? (
        <Card className="p-12 rounded-none border-border bg-muted/5 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-1 bg-primary/20 mb-8"></div>
          <h3 className="text-xl font-black uppercase tracking-tighter text-foreground mb-2">No manifests yet</h3>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-8">
            Create your first manifest to start managing linehaul movements
          </p>
          <Button
            variant="default"
            className="rounded-none font-mono text-xs uppercase tracking-widest px-8"
            onClick={() => {
              setSelectedManifestId(null);
              setIsEnterpriseOpen(true);
            }}
            data-testid="create-manifest-button-empty"
          >
            <Scan className="w-4 h-4 mr-2" /> Init Manifest
          </Button>
        </Card>
      ) : (
        <Card className="rounded-none border-0 shadow-none bg-transparent">
          <DataTable
            columns={columns}
            data={manifests}
            searchKey="manifest_no"
            searchPlaceholder="Search manifests..."
            pageSize={10}
          />
        </Card>
      )}

      <ManifestBuilderWizard
        open={isEnterpriseOpen}
        onOpenChange={setIsEnterpriseOpen}
        initialManifestId={selectedManifestId}
        onComplete={() => {
          // Manifest creation complete - refresh handled by query invalidation
          setIsEnterpriseOpen(false);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <CrudDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Permanently Delete Manifest?"
        description={`This will PERMANENTLY delete manifest "${manifestToDelete?.manifest_no ?? ''}" and all related items. Shipments will be released back to 'Available' status. This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        confirmLabel="Delete Permanently"
      />
    </div>
  );
};
