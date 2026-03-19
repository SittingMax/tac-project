import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useAnalyticsSummary } from '../hooks/useAnalytics';
import { Package, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/ui-core/layout';
import { AnomalyDetectorWidget } from '@/components/dashboard/AnomalyDetectorWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export const Analytics: React.FC = () => {
  const { data: summary, isLoading, isError } = useAnalyticsSummary();

  const tooltipStyle = {
    backgroundColor: 'var(--background)',
    borderColor: 'var(--border)',
    color: 'var(--foreground)',
    borderRadius: '8px',
    boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.1)',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    fontSize: '11px',
    padding: '12px',
    border: '1px solid var(--border)',
  };

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

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Telemetry" description="Real-time macroscopic telemetry." />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 bg-card border border-border rounded-lg flex flex-col gap-4">
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
            <Package size={16} strokeWidth={1.5} className="text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-2xl font-semibold text-foreground">
            {summary.total_shipments.toLocaleString()}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 flex flex-col justify-between group relative overflow-hidden transition hover:bg-muted/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Delivery Rate</span>
            <TrendingUp size={16} strokeWidth={1.5} className="text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
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
            <CheckCircle size={16} strokeWidth={1.5} className="text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-2xl font-semibold text-foreground">
            {summary.on_track.toLocaleString()}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 flex flex-col justify-between group relative overflow-hidden transition hover:bg-muted/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-destructive">Exceptions</span>
            <AlertTriangle size={16} strokeWidth={1.5} className="text-destructive opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-2xl font-semibold text-destructive">
            {summary.exceptions.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trajectory */}
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-xs text-muted-foreground">Shipment Volume</h3>
              <p className="text-lg font-semibold text-foreground mt-1">6-Month Overview</p>
            </div>
          </div>

          <div className="h-[350px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={summary.monthly_data}
                margin={{ left: -20, right: 0, top: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorOutboundGarde" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInboundGarde" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--border)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--border)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="2 2"
                  stroke="var(--border)"
                  opacity={0.4}
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={16}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'monospace' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'monospace' }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />

                <Area
                  dataKey="inbound"
                  name="Inbound"
                  type="step"
                  fill="url(#colorInboundGarde)"
                  stroke="var(--muted-foreground)"
                  strokeWidth={1}
                />
                <Area
                  dataKey="outbound"
                  name="Gross Vol."
                  type="step"
                  fill="url(#colorOutboundGarde)"
                  stroke="var(--primary)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* State Distribution */}
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-xs text-muted-foreground">Status Distribution</h3>
              <p className="text-lg font-semibold text-foreground mt-1">Current Breakdown</p>
            </div>
          </div>

          <div className="h-[350px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={efficiencyData}
                layout="vertical"
                margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
              >
                <CartesianGrid
                  horizontal={true}
                  vertical={false}
                  strokeDasharray="2 2"
                  stroke="var(--border)"
                  opacity={0.4}
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'monospace' }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={100}
                  tick={{
                    fill: 'var(--foreground)',
                    fontSize: 11,
                    fontFamily: 'Inter',
                    fontWeight: 600,
                  }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                />
                <Bar
                  dataKey="value"
                  name="Units"
                  fill="var(--primary)"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-border/40">
        <AnomalyDetectorWidget />
      </div>
    </PageContainer>
  );
};
