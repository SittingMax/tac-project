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
import { PageHeader } from '@/components/ui/page-header';
import { AnomalyDetectorWidget } from '@/components/dashboard/AnomalyDetectorWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export const Analytics: React.FC = () => {
  const { data: summary, isLoading, isError } = useAnalyticsSummary();

  const tooltipStyle = {
    backgroundColor: 'var(--background)',
    borderColor: 'var(--border)',
    color: 'var(--foreground)',
    borderRadius: '0px',
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
      <div className="space-y-12 animate-in fade-in duration-500">
        <PageHeader title="Telemetry" description="Real-time macroscopic telemetry." />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-border/50 border border-border/50">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-8 bg-background flex flex-col gap-4">
              <Skeleton className="h-4 w-24 rounded-none" />
              <Skeleton className="h-10 w-16 rounded-none" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="flex items-center justify-center p-24 text-destructive font-mono uppercase text-sm tracking-widest border border-destructive/20 bg-destructive/5">
        Telemetry Malfunction: Failed to retrieve analytics matrix.
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
          Telemetry<span className="text-primary">.</span>
        </h1>
        <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase">
          Live operations matrix / Realtime sync active
        </p>
      </div>

      {/* Avant-Garde KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-border/40 border-y border-border/40">
        <div className="bg-background p-8 flex flex-col justify-between group relative overflow-hidden transition-all hover:bg-muted/10">
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Gross Volume
            </span>
            <Package className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-5xl font-black tracking-tighter">
            {summary.total_shipments.toLocaleString()}
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
        </div>

        <div className="bg-background p-8 flex flex-col justify-between group relative overflow-hidden transition-all hover:bg-muted/10">
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Delivery Rate
            </span>
            <TrendingUp className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div
            className={cn(
              'text-5xl font-black tracking-tighter',
              Number(deliveryRate) > 95 ? 'text-primary' : 'text-status-warning'
            )}
          >
            {deliveryRate}
            <span className="text-2xl text-muted-foreground ml-1">%</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
        </div>

        <div className="bg-background p-8 flex flex-col justify-between group relative overflow-hidden transition-all hover:bg-muted/10">
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              On Track
            </span>
            <CheckCircle className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-5xl font-black tracking-tighter">
            {summary.on_track.toLocaleString()}
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
        </div>

        <div className="bg-background p-8 flex flex-col justify-between group relative overflow-hidden transition-all hover:bg-muted/10">
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs font-mono text-destructive uppercase tracking-widest">
              Anomalies
            </span>
            <AlertTriangle className="w-4 h-4 text-destructive opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-5xl font-black tracking-tighter text-destructive">
            {summary.exceptions.toLocaleString()}
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-destructive transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Trajectory */}
        <div className="space-y-6">
          <div className="flex items-end justify-between border-b border-border/40 pb-4">
            <div>
              <h3 className="text-xl font-bold uppercase tracking-tight">Flow Trajectory</h3>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mt-1">
                6-Month historical macro-view
              </p>
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
        <div className="space-y-6">
          <div className="flex items-end justify-between border-b border-border/40 pb-4">
            <div>
              <h3 className="text-xl font-bold uppercase tracking-tight">Status Distribution</h3>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mt-1">
                Current state architecture
              </p>
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
                <Bar dataKey="value" name="Units" fill="var(--primary)" radius={0} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="pt-12 border-t border-border/40">
        <AnomalyDetectorWidget />
      </div>
    </div>
  );
};
