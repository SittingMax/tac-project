import React from 'react';
import { formatDateTime } from '@/lib/formatters';
import { useManifests } from '../../hooks/useManifests';
import { Button } from '../ui/button';
import { PageHeader } from '@/components/ui-core/layout';
import { CrudTable } from '@/components/crud/CrudTable';
import type { ColumnDef } from '@tanstack/react-table';
import { FileText, Plane, Truck, ArrowRight, Loader } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { StatusBadge } from '@/components/domain/status-badge';
import { type ManifestWithRelations } from '@/hooks/useManifests';
import { IdBadge } from '@/components/ui-core/data/id-badge';

export const ManifestList: React.FC = () => {
  const { data: manifests, isLoading, error } = useManifests();
  const navigate = useNavigate();

  const columns: ColumnDef<ManifestWithRelations>[] = React.useMemo(
    () => [
      {
        accessorKey: 'manifest_no',
        header: 'MANIFEST NO',
        cell: ({ row }) => (
          <IdBadge
            entity="manifest"
            idValue={row.original.id}
            cnNumber={row.original.manifest_no}
            href={`/manifests/${row.original.id}`}
          />
        ),
      },
      {
        id: 'route',
        header: 'ROUTE',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold">{row.original.from_hub?.code}</span>
            <ArrowRight size={12} strokeWidth={1.5} className="text-muted-foreground" />
            <span className="font-bold">{row.original.to_hub?.code}</span>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'MODE',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.type === 'AIR' ? (
              <Plane size={12} strokeWidth={1.5} className="text-feature-air" />
            ) : (
              <Truck size={12} strokeWidth={1.5} className="text-feature-ground" />
            )}
            <span className="text-xs">{row.original.type}</span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'STATUS',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'load',
        header: 'LOAD',
        cell: ({ row }) => (
          <div className="text-right text-xs">
            <div>{row.original.total_shipments} Shipments</div>
            <div className="text-muted-foreground">{row.original.total_weight} kg</div>
          </div>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'CREATED',
        cell: ({ row }) => (
          <div className="text-right text-xs text-muted-foreground">
            {formatDateTime(row.original.created_at)}
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="text-right">
            <Link
              to={`/manifests/${row.original.id}`}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-muted transition-colors"
            >
              <ArrowRight size={16} strokeWidth={1.5} className="text-muted-foreground hover:text-primary transition-colors" />
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  if (isLoading)
    return (
      <div className="p-10 flex justify-center">
        <Loader className="animate-spin text-primary" />
      </div>
    );
  if (error) return <div className="text-destructive">Error loading manifests</div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24">
      <PageHeader title="Linehaul Manifests" description="Manage hub-to-hub transport">
        <Button onClick={() => navigate('/manifests/create')}>
          <FileText size={16} strokeWidth={1.5} className="mr-2" />
          Create Manifest
        </Button>
      </PageHeader>

      <CrudTable columns={columns} data={manifests || []} pageSize={10} />
    </div>
  );
};
