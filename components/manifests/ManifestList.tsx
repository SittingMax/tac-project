import React from 'react';
import { useManifests } from '../../hooks/useManifests';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Table, TableHead as Th, TableCell as Td } from '../ui/table';
import { FileText, Plane, Truck, ArrowRight, Loader } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { StatusBadge } from '../domain/StatusBadge';

export const ManifestList: React.FC = () => {
  const { data: manifests, isLoading, error } = useManifests();
  const navigate = useNavigate();

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

      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Th>MANIFEST NO</Th>
              <Th>ROUTE</Th>
              <Th>MODE</Th>
              <Th>STATUS</Th>
              <Th>LOAD</Th>
              <Th>CREATED</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {manifests?.map((manifest) => (
              <tr key={manifest.id} className="group hover:bg-muted transition-colors">
                <Td className="font-mono text-primary font-bold">
                  <Link
                    to={`/manifests/${manifest.id}`}
                    className="hover:underline block w-full h-full"
                  >
                    {manifest.manifest_no}
                  </Link>
                </Td>
                <Td>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold">{manifest.from_hub?.code}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="font-bold">{manifest.to_hub?.code}</span>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    {manifest.type === 'AIR' ? (
                      <Plane className="w-3 h-3" />
                    ) : (
                      <Truck className="w-3 h-3" />
                    )}
                    <span className="text-xs">{manifest.type}</span>
                  </div>
                </Td>
                <Td>
                  <StatusBadge status={manifest.status} />
                </Td>
                <Td className="text-right">
                  <div className="text-xs">
                    <div>{manifest.total_shipments} Shipments</div>
                    <div className="text-muted-foreground">{manifest.total_weight} kg</div>
                  </div>
                </Td>
                <Td className="text-right text-xs text-muted-foreground">
                  {format(new Date(manifest.created_at), 'dd MMM HH:mm')}
                </Td>
                <Td className="text-right">
                  <Link
                    to={`/manifests/${manifest.id}`}
                    className="inline-flex items-center justify-center p-2 rounded-none hover:bg-muted transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                </Td>
              </tr>
            ))}
            {(!manifests || manifests.length === 0) && (
              <tr>
                <Td className="text-center py-8 text-muted-foreground">
                  No manifests found (ColSpan not supported in Td wrapper properly, checked
                  manually)
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </Card>
  );
};
