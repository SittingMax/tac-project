import React from 'react';
import { useManifests } from '../../hooks/useManifests';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { CrudTable } from '@/components/crud/CrudTable';
import type { ColumnDef } from '@tanstack/react-table';
import { FileText, Plane, Truck, ArrowRight, Loader } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { StatusBadge } from '../domain/StatusBadge';
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
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
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
              <Plane className="w-3 h-3 text-feature-air" />
            ) : (
              <Truck className="w-3 h-3 text-feature-ground" />
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
            {format(new Date(row.original.created_at), 'dd MMM HH:mm')}
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
              <ArrowRight className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
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
    <Card className="p-6 bg-white dark:bg-card border border-border">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Linehaul Manifests
          </h2>
          <p className="text-xs text-muted-foreground">Manage hub-to-hub transport</p>
        </div>
        <Button onClick={() => navigate('/manifests/create')}>
          <FileText className="w-4 h-4 mr-2" />
          Create Manifest
        </Button>
      </div>

      <div className="border border-border/40 bg-card rounded-xl overflow-hidden shadow-xs">
        <CrudTable columns={columns} data={manifests || []} pageSize={10} />
      </div>
    </Card>
  );
};
