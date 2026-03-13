import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useExceptions,
  useCreateException,
  useResolveException,
  ExceptionWithRelations,
} from '@/hooks/useExceptions';
import { useFindShipmentByCN } from '@/hooks/useShipments';
import { useRealtimeExceptions } from '@/hooks/useRealtime';
import { AlertCircle, CheckCircle, Plus, ShieldAlert, Clock } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { KPICard } from '@/components/domain/KPICard';
import { EmptyExceptions } from '@/components/ui/empty-state';
import { CrudTable } from '@/components/crud/CrudTable';
import { IdBadge } from '@/components/ui-core/data/id-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';

const raiseSchema = z.object({
  awb: z.string().min(1, 'CN Required'),
  type: z.enum([
    'DAMAGE',
    'SHORTAGE',
    'MISROUTE',
    'DELAY',
    'CUSTOMER_REFUSAL',
    'ADDRESS_ISSUE',
    'OTHER',
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  description: z.string().min(5, 'Description required'),
});

const resolveSchema = z.object({
  note: z.string().min(5, 'Resolution note required'),
});

type RaiseFormData = z.infer<typeof raiseSchema>;
type ResolveFormData = z.infer<typeof resolveSchema>;

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
] as const;

const SEVERITY_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Severities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
] as const;

export const Exceptions: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') ?? 'ALL';
  const severityFilter = searchParams.get('severity') ?? 'ALL';

  const { data: exceptions = [], isLoading } = useExceptions({
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    severity: severityFilter !== 'ALL' ? severityFilter : undefined,
  });
  const createMutation = useCreateException();
  const resolveMutation = useResolveException();
  const findShipment = useFindShipmentByCN();
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [selectedException, setSelectedException] = useState<ExceptionWithRelations | null>(null);

  useRealtimeExceptions();

  const {
    register: registerRaise,
    handleSubmit: handleSubmitRaise,
    reset: resetRaise,
    control: controlRaise,
  } = useForm<RaiseFormData>({
    resolver: zodResolver(raiseSchema),
    defaultValues: { type: 'DAMAGE', severity: 'MEDIUM' },
  });

  const {
    register: registerResolve,
    handleSubmit: handleSubmitResolve,
    reset: resetResolve,
  } = useForm<ResolveFormData>({ resolver: zodResolver(resolveSchema) });

  const columns: ColumnDef<ExceptionWithRelations>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <IdBadge entity="exception" idValue={row.getValue('id')} />,
      },
      {
        id: 'cn_number',
        header: 'CN Number',
        accessorFn: (row) => row.shipment?.cn_number ?? '',
        cell: ({ row }) => (
          <span className="font-mono font-bold text-primary">
            {row.getValue('cn_number') || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <span className="font-medium">{row.getValue('type')}</span>,
      },
      {
        accessorKey: 'severity',
        header: 'Severity',
        cell: ({ row }) => <StatusBadge status={row.getValue('severity')} />,
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <span className="max-w-xs truncate block">{row.getValue('description')}</span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Reported',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {format(new Date(row.getValue('created_at')), 'dd MMM HH:mm')}
          </span>
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
          const ex = row.original;
          if (ex.status === 'OPEN') {
            return (
              <Button variant="outline" size="sm" onClick={() => setSelectedException(ex)}>
                <CheckCircle className="size-4" data-icon="inline-start" /> Resolve
              </Button>
            );
          }
          return null;
        },
      },
    ],
    []
  );

  const openCount = exceptions.filter((e) => e.status === 'OPEN').length;
  const criticalCount = exceptions.filter(
    (e) => e.severity === 'CRITICAL' && e.status === 'OPEN'
  ).length;

  const onRaiseSubmit = async (data: RaiseFormData) => {
    const shipmentData = await findShipment.mutateAsync(data.awb);
    if (!shipmentData) {
      toast.error('Shipment not found for the given CN Number.');
      return;
    }
    await createMutation.mutateAsync({
      shipment_id: shipmentData.id,
      cn_number: data.awb,
      type: data.type as ExceptionWithRelations['type'],
      severity: data.severity as ExceptionWithRelations['severity'],
      description: data.description,
    });
    setIsRaiseModalOpen(false);
    resetRaise();
  };

  const onResolveSubmit = async (data: ResolveFormData) => {
    if (selectedException) {
      await resolveMutation.mutateAsync({ id: selectedException.id, resolution: data.note });
      setSelectedException(null);
      resetResolve();
    }
  };

  const updateFilterParam = (key: 'status' | 'severity', value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === 'ALL') {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    setSearchParams(nextParams);
  };

  const clearFilters = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('status');
    nextParams.delete('severity');
    setSearchParams(nextParams);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24">
      <PageHeader
        title="Exceptions"
        description="Track and resolve shipment anomalies"
      >
        <Button variant="destructive" onClick={() => setIsRaiseModalOpen(true)}>
          <Plus data-icon="inline-start" /> Raise Exception
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Open Exceptions"
          value={openCount}
          icon={<AlertCircle className="size-5" />}
          trend={openCount > 0 ? 'down' : 'neutral'}
        />
        <KPICard
          title="Critical Issues"
          value={criticalCount}
          icon={<ShieldAlert className="size-5" />}
          trend={criticalCount > 0 ? 'down' : 'neutral'}
        />
        <KPICard
          title="Total Exceptions"
          value={exceptions.length}
          icon={<Clock className="size-5" />}
        />
      </div>

      <CrudTable
        columns={columns}
        data={exceptions}
        searchKey="cn_number"
        searchPlaceholder="Search by CN..."
        isLoading={isLoading}
        emptyState={<EmptyExceptions />}
        emptyMessage="No exceptions found."
        toolbar={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={statusFilter} onValueChange={(value) => updateFilterParam('status', value)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={(value) => updateFilterParam('severity', value)}>
              <SelectTrigger className="w-full sm:w-[170px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(statusFilter !== 'ALL' || severityFilter !== 'ALL') && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        }
      />

      {/* Raise Modal */}
      <Dialog open={isRaiseModalOpen} onOpenChange={setIsRaiseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise New Exception</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitRaise(onRaiseSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="raise-awb">CN Number</Label>
              <Input
                id="raise-awb"
                {...registerRaise('awb')}
                placeholder="Scan or type CN Number"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Controller
                  control={controlRaise}
                  name="type"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAMAGE">Damage</SelectItem>
                        <SelectItem value="SHORTAGE">Shortage</SelectItem>
                        <SelectItem value="MISROUTE">Misroute</SelectItem>
                        <SelectItem value="DELAY">Delay</SelectItem>
                        <SelectItem value="CUSTOMER_REFUSAL">Customer Refusal</SelectItem>
                        <SelectItem value="ADDRESS_ISSUE">Address Issue</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Severity</Label>
                <Controller
                  control={controlRaise}
                  name="severity"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="raise-description">Description</Label>
              <Textarea
                id="raise-description"
                {...registerRaise('description')}
                placeholder="Details of the issue..."
                rows={3}
              />
            </div>
            <Button
              type="submit"
              variant="destructive"
              className="w-full"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Reporting...' : 'Report Exception'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Resolve Modal */}
      <Dialog
        open={!!selectedException}
        onOpenChange={(open) => { if (!open) setSelectedException(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Exception</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitResolve(onResolveSubmit)} className="flex flex-col gap-4">
            <div className="bg-muted/50 p-4 rounded-md text-sm border border-border">
              <div className="font-medium text-foreground">Exception: {selectedException?.type}</div>
              <div className="text-muted-foreground mt-1">{selectedException?.description}</div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="resolve-note">Resolution Note</Label>
              <Textarea
                id="resolve-note"
                {...registerResolve('note')}
                placeholder="How was this resolved?"
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full" disabled={resolveMutation.isPending}>
              {resolveMutation.isPending ? 'Resolving...' : 'Confirm Resolution'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
