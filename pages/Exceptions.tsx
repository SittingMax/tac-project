import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { AlertCircle, CheckCircle, Plus, ShieldAlert, Clock, X } from 'lucide-react';
import { AppIcon } from '@/components/ui-core';
import { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/domain/status-badge';
import { StatCard } from '@/components/ui-core';
import { EmptyExceptions } from '@/components/ui/empty-state';
import { CrudTable } from '@/components/crud/CrudTable';
import { IdBadge } from '@/components/ui-core/data/id-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader, PageContainer, SectionCard } from '@/components/ui-core/layout';
import { FieldGroup } from '@/components/ui-core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

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
            {formatDateTime(row.getValue('created_at'))}
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
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedException(ex); }}>
                View
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
    <PageContainer>
      <PageHeader title="Exceptions" description="Track and resolve shipment anomalies">
        <Button variant="destructive" onClick={() => setIsRaiseModalOpen(true)}>
          <AppIcon icon={Plus} size={16} data-icon="inline-start" /> Raise Exception
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Open Exceptions" value={openCount} icon={AlertCircle} iconColor="error" />
        <StatCard
          title="Critical Issues"
          value={criticalCount}
          icon={ShieldAlert}
          iconColor="error"
        />
        <StatCard title="Total Exceptions" value={exceptions.length} icon={Clock} />
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        <div className={cn("flex-1 w-full transition-all duration-300", selectedException ? "xl:max-w-[calc(100%-424px)]" : "")}>
          <SectionCard>
            <CrudTable
              columns={columns}
              data={exceptions}
              isLoading={isLoading}
              searchKey="exceptions"
              searchPlaceholder="Search by CN..."
              toolbar={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => updateFilterParam('status', value)}
                  >
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
                  <Select
                    value={severityFilter}
                    onValueChange={(value) => updateFilterParam('severity', value)}
                  >
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
              emptyState={<EmptyExceptions />}
              emptyMessage="No exceptions found."
              onRowClick={setSelectedException}
              density="compact"
            />
          </SectionCard>
        </div>

        {selectedException && (
          <div className="w-full xl:w-[400px] flex-shrink-0 animate-in slide-in-from-right-8 duration-300 sticky top-6">
            <Card className="flex flex-col h-full min-h-[500px] border-border/50 shadow-md relative overflow-hidden bg-card">
              <div className="p-4 border-b border-border/50 bg-muted/10 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-base tracking-tight flex items-center gap-2">
                  <AppIcon icon={AlertCircle} className="text-primary" size={16} /> 
                  Exception Details
                </h3>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50" onClick={() => setSelectedException(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <IdBadge entity="exception" idValue={selectedException.id} className="text-xs" />
                    <StatusBadge status={selectedException.status} />
                    <StatusBadge status={selectedException.severity} />
                  </div>
                  
                  {selectedException.shipment && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shipment CN</span>
                      <span className="font-mono text-base font-bold text-foreground">
                        {selectedException.shipment.cn_number}
                      </span>
                    </div>
                  )}

                  <div className="bg-muted/20 p-4 rounded-xl border border-border/40 flex flex-col gap-3">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Type</span>
                      <span className="text-sm font-medium">{selectedException.type}</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Description</span>
                      <span className="text-sm text-foreground/90 leading-relaxed">{selectedException.description}</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Reported At</span>
                      <span className="text-sm text-muted-foreground">{formatDateTime(selectedException.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 mt-auto">
                  {selectedException.status === 'OPEN' ? (
                    <form onSubmit={handleSubmitResolve(onResolveSubmit)} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <label htmlFor="resolve-note" className="text-sm font-medium text-foreground">
                          Resolution Note
                        </label>
                        <Textarea
                          id="resolve-note"
                          {...registerResolve('note')}
                          placeholder="Explain how this exception was resolved..."
                          rows={4}
                          className="resize-none text-sm bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                        />
                      </div>
                      <Button type="submit" disabled={resolveMutation.isPending} className="w-full font-medium">
                        {resolveMutation.isPending ? 'Resolving Case...' : 'Resolve Exception'}
                      </Button>
                    </form>
                  ) : (
                    <div className="bg-success/5 border border-success/20 px-4 py-4 rounded-xl text-sm flex flex-col gap-2">
                      <div className="font-semibold text-success flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> Exception Resolved
                      </div>
                      <div className="text-foreground/80 leading-relaxed">
                        {selectedException.resolution || 'Resolved without specific notes.'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Raise Modal */}
      <Dialog open={isRaiseModalOpen} onOpenChange={setIsRaiseModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Raise New Exception</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitRaise(onRaiseSubmit)} className="flex flex-col gap-6 py-4">
            <FieldGroup label="CN Number" htmlFor="raise-awb">
              <Input
                id="raise-awb"
                {...registerRaise('awb')}
                placeholder="Scan or type CN Number"
                className="h-8 px-3 text-sm bg-transparent hover:border-ring/50 transition-colors font-mono"
              />
            </FieldGroup>
            <div className="grid grid-cols-2 gap-6">
              <FieldGroup label="Type">
                <Controller
                  control={controlRaise}
                  name="type"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-8 px-3 text-sm bg-transparent hover:border-ring/50 transition-colors">
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
              </FieldGroup>
              <FieldGroup label="Severity">
                <Controller
                  control={controlRaise}
                  name="severity"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-8 px-3 text-sm bg-transparent hover:border-ring/50 transition-colors">
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
              </FieldGroup>
            </div>
            <FieldGroup label="Description" htmlFor="raise-description">
              <Textarea
                id="raise-description"
                {...registerRaise('description')}
                placeholder="Details of the issue..."
                rows={4}
                className="min-h-[100px] bg-transparent hover:border-ring/50 transition-colors resize-y text-sm"
              />
            </FieldGroup>
            <Button
              type="submit"
              variant="destructive"
              className="w-full h-8 text-xs font-bold mt-2"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Reporting...' : 'Report Exception'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>


    </PageContainer>
  );
};
