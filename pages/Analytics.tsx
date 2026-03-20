import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';
import { useAnalyticsSummary } from '../hooks/useAnalytics';
import { Package, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/ui-core/layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AnomalyDetectorWidget } from '@/components/dashboard/AnomalyDetectorWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export const Analytics: React.FC = () => {
  const { data: summary, isLoading, isError } = useAnalyticsSummary();

  const deliveryRate = useMemo(() => {
    if (!summary) return '0.0';
    return summary.total_shipments > 0
      ? ((summary.delivered / summary.total_shipments) * 100).toFixed(1)
      : '0.0';
  }, [summary]);

  const efficiencyData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'On Track', value: summary.on_track, key: 'onTrack', color: 'var(--primary)' },
      { name: 'Delivered', value: summary.delivered, key: 'delivered', color: 'var(--primary)' },
      { name: 'Delayed', value: summary.delayed, key: 'delayed', color: 'var(--destructive)' },
      {
        name: 'Exceptions',
        value: summary.exceptions,
        key: 'exceptions',
        color: 'var(--destructive)',
      },
    ];
  }, [summary]);

  const totalEfficiency = useMemo(() => {
    return efficiencyData.reduce((acc, curr) => acc + curr.value, 0);
  }, [efficiencyData]);

  const flowData = useMemo(() => {
    if (!summary || !summary.monthly_data?.length) return [];
    
    const data = summary.monthly_data;
    const thisMonth = data[data.length - 1];
    const lastMonth = data[data.length - 2] || { inbound: 0, outbound: 0 };
    
    const inboundVariance = lastMonth.inbound ? ((thisMonth.inbound - lastMonth.inbound) / lastMonth.inbound) * 100 : 0;
    const outboundVariance = lastMonth.outbound ? ((thisMonth.outbound - lastMonth.outbound) / lastMonth.outbound) * 100 : 0;
    
    return [
      {
        id: 'inbound',
        name: 'Inbound Volume',
        lastMonth: lastMonth.inbound,
        thisMonth: thisMonth.inbound,
        variance: inboundVariance,
        history: data.map(d => ({ value: d.inbound })),
        color: 'var(--border)'
      },
      {
        id: 'outbound',
        name: 'Gross Outbound',
        lastMonth: lastMonth.outbound,
        thisMonth: thisMonth.outbound,
        variance: outboundVariance,
        history: data.map(d => ({ value: d.outbound })),
        color: 'var(--primary)'
      }
    ];
  }, [summary]);


  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Telemetry" description="Real-time macroscopic telemetry." />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-6 bg-card border border-border rounded-lg flex flex-col gap-4"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-16" />
            </div>
          ))}
        </div>
      </PageContainer>
    );
  }

  if (isError || !summary) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center p-24 text-destructive text-sm rounded-lg border border-destructive/20 bg-destructive/5">
          Failed to load analytics data. Please try again.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Analytics" description="Live operations overview" />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col justify-between group relative overflow-hidden transition hover:bg-muted/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Total Shipments</span>
            <Package
              size={16}
              strokeWidth={1.5}
              className="text-primary opacity-50 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <div className="text-2xl font-semibold text-foreground">
            {summary.total_shipments.toLocaleString()}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 flex flex-col justify-between group relative overflow-hidden transition hover:bg-muted/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Delivery Rate</span>
            <TrendingUp
              size={16}
              strokeWidth={1.5}
              className="text-primary opacity-50 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <div
            className={cn(
              'text-2xl font-semibold',
              Number(deliveryRate) > 95 ? 'text-primary' : 'text-status-warning'
            )}
          >
            {deliveryRate}
            <span className="text-lg text-muted-foreground ml-1">%</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 flex flex-col justify-between group relative overflow-hidden transition hover:bg-muted/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">On Track</span>
            <CheckCircle
              size={16}
              strokeWidth={1.5}
              className="text-primary opacity-50 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <div className="text-2xl font-semibold text-foreground">
            {summary.on_track.toLocaleString()}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 flex flex-col justify-between group relative overflow-hidden transition hover:bg-muted/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-destructive">Exceptions</span>
            <AlertTriangle
              size={16}
              strokeWidth={1.5}
              className="text-destructive opacity-50 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <div className="text-2xl font-semibold text-destructive">
            {summary.exceptions.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trajectory */}
        <div className="flex flex-col gap-4 bg-card border border-border rounded-lg p-5">
          <div className="flex items-end justify-between border-b border-border/40 pb-3 mb-2">
            <div>
              <p className="text-lg font-semibold text-foreground tracking-tight">Shipment Volume Flow</p>
              <h3 className="text-xs text-muted-foreground mt-0.5">30-day rolling variance</h3>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-b-border/40 hover:bg-transparent">
                <TableHead className="text-xs h-8 pl-0">Flow Metric</TableHead>
                <TableHead className="text-xs h-8 text-right">Prior</TableHead>
                <TableHead className="text-xs h-8 text-right">Current</TableHead>
                <TableHead className="text-xs h-8 text-right">Variance</TableHead>
                <TableHead className="text-xs h-8 text-right pr-0 w-24">Trend (6M)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flowData.map((row) => (
                <TableRow key={row.id} className="border-b-border/40 hover:bg-muted/5">
                  <TableCell className="font-medium text-xs pl-0 py-3">{row.name}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground py-3">{row.lastMonth.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-xs py-3">{row.thisMonth.toLocaleString()}</TableCell>
                  <TableCell className={cn("text-right text-xs font-medium py-3", row.variance > 0 ? "text-status-success" : row.variance < 0 ? "text-destructive" : "text-muted-foreground")}>
                    {row.variance > 0 ? '+' : ''}{row.variance.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right pr-0 py-3">
                    <div className="h-6 w-16 ml-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={row.history} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`gradient-${row.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={row.color} stopOpacity={0.3} />
                              <stop offset="100%" stopColor={row.color} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke={row.color} 
                            strokeWidth={1.5} 
                            fill={`url(#gradient-${row.id})`}
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* State Distribution */}
        <div className="flex flex-col gap-4 bg-card border border-border rounded-lg p-5">
          <div className="flex items-end justify-between border-b border-border/40 pb-3 mb-2">
            <div>
              <p className="text-lg font-semibold text-foreground tracking-tight">Status Distribution</p>
              <h3 className="text-xs text-muted-foreground mt-0.5">Current operational state breakdown</h3>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-b-border/40 hover:bg-transparent">
                <TableHead className="text-xs h-8 pl-0">Status</TableHead>
                <TableHead className="text-xs h-8 text-right">Units</TableHead>
                <TableHead className="text-xs h-8 text-right">Share</TableHead>
                <TableHead className="text-xs h-8 text-right pr-0 w-32">Distribution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {efficiencyData.map((row) => {
                const percentage = totalEfficiency > 0 ? ((row.value / totalEfficiency) * 100) : 0;
                return (
                  <TableRow key={row.key} className="border-b-border/40 hover:bg-muted/5">
                    <TableCell className="font-medium text-xs pl-0 py-3">{row.name}</TableCell>
                    <TableCell className="text-right text-xs py-3">{row.value.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground py-3">{percentage.toFixed(1)}%</TableCell>
                    <TableCell className="text-right pr-0 py-3">
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden ml-auto">
                        <div 
                          className="h-full rounded-full" 
                          style={{ width: `${percentage}%`, backgroundColor: row.color }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="pt-6 border-t border-border/40">
        <AnomalyDetectorWidget />
      </div>
    </PageContainer>
  );
};
