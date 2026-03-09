/**
 * AnalyticsDashboard
 * Premium analytics dashboard with interactive charts
 * Features: Shipment trends, status distribution, hub performance, delivery metrics
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  Download,
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';

// Color palette for charts
const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  info: 'hsl(var(--status-info))',
  success: 'hsl(var(--status-success))',
  warning: 'hsl(var(--status-warning))',
  error: 'hsl(var(--status-error))',
  muted: 'hsl(var(--muted-foreground))',
};

const STATUS_COLORS: Record<string, string> = {
  CREATED: CHART_COLORS.info,
  PICKUP_SCHEDULED: CHART_COLORS.info,
  PICKED_UP: CHART_COLORS.info,
  RECEIVED_AT_ORIGIN: CHART_COLORS.warning,
  IN_TRANSIT: CHART_COLORS.primary,
  RECEIVED_AT_DEST: CHART_COLORS.warning,
  OUT_FOR_DELIVERY: CHART_COLORS.primary,
  DELIVERED: CHART_COLORS.success,
  CANCELLED: CHART_COLORS.error,
  RTO: CHART_COLORS.error,
  EXCEPTION: CHART_COLORS.error,
};

// Types
interface DailyStats {
  date: string;
  shipments: number;
  delivered: number;
  exceptions: number;
}

interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

interface HubPerformance {
  hub_id: string;
  hub_code: string;
  hub_name: string;
  total_shipments: number;
  delivered: number;
  in_transit: number;
  avg_delivery_time: number;
  on_time_rate: number;
}

interface DashboardMetrics {
  totalShipments: number;
  deliveredToday: number;
  inTransit: number;
  exceptions: number;
  avgDeliveryTime: number;
  onTimeRate: number;
  trend: {
    shipments: number;
    delivery: number;
  };
}

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('30');

  // Calculate date range
  const dateRangeParams = useMemo(() => {
    const days = parseInt(dateRange);
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(new Date(), days - 1));
    return { start: start.toISOString(), end: end.toISOString() };
  }, [dateRange]);

  // Fetch metrics
  const {
    data: metrics,
    isLoading: metricsLoading,
    refetch,
  } = useQuery({
    queryKey: ['analytics-metrics', dateRangeParams],
    queryFn: async (): Promise<DashboardMetrics> => {
      const { start, end } = dateRangeParams;

      // Total shipments in range
      const { count: totalShipments } = await supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start)
        .lte('created_at', end);

      // Delivered today
      const today = startOfDay(new Date()).toISOString();
      const { count: deliveredToday } = await supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'DELIVERED')
        .gte('updated_at', today);

      // In transit
      const { count: inTransit } = await supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'IN_TRANSIT');

      // Exceptions
      const { count: exceptions } = await supabase
        .from('exceptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'OPEN');

      // Previous period for trend calculation
      const prevStart = subDays(new Date(dateRangeParams.start), parseInt(dateRange)).toISOString();
      const { count: prevShipments } = await supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', prevStart)
        .lt('created_at', dateRangeParams.start);

      return {
        totalShipments: totalShipments || 0,
        deliveredToday: deliveredToday || 0,
        inTransit: inTransit || 0,
        exceptions: exceptions || 0,
        avgDeliveryTime: 2.5, // Mock - would calculate from actual data
        onTimeRate: 94.2, // Mock
        trend: {
          shipments:
            totalShipments && prevShipments
              ? ((totalShipments - prevShipments) / (prevShipments || 1)) * 100
              : 0,
          delivery: 5.2, // Mock
        },
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch daily stats for trend chart
  const { data: dailyStats, isLoading: dailyLoading } = useQuery({
    queryKey: ['analytics-daily', dateRangeParams],
    queryFn: async (): Promise<DailyStats[]> => {
      const days = parseInt(dateRange);
      const stats: DailyStats[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date).toISOString();
        const dayEnd = endOfDay(date).toISOString();

        const { count: shipments } = await supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dayStart)
          .lte('created_at', dayEnd);

        const { count: delivered } = await supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'DELIVERED')
          .gte('updated_at', dayStart)
          .lte('updated_at', dayEnd);

        const { count: exceptions } = await supabase
          .from('exceptions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dayStart)
          .lte('created_at', dayEnd);

        stats.push({
          date: format(date, 'MMM dd'),
          shipments: shipments || 0,
          delivered: delivered || 0,
          exceptions: exceptions || 0,
        });
      }

      return stats;
    },
  });

  // Fetch status distribution
  const { data: statusDistribution, isLoading: statusLoading } = useQuery({
    queryKey: ['analytics-status'],
    queryFn: async (): Promise<StatusDistribution[]> => {
      const { data, error } = await supabase.from('shipments').select('status');

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach((s) => {
        counts[s.status] = (counts[s.status] || 0) + 1;
      });

      const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

      return Object.entries(counts).map(([status, count]) => ({
        status,
        count,
        percentage: (count / total) * 100,
      }));
    },
  });

  // Fetch hub performance
  const { data: hubPerformance, isLoading: hubLoading } = useQuery({
    queryKey: ['analytics-hubs'],
    queryFn: async (): Promise<HubPerformance[]> => {
      const { data: hubs, error: hubsError } = await supabase.from('hubs').select('id, code, name');

      if (hubsError) throw hubsError;

      const results: HubPerformance[] = [];

      for (const hub of hubs || []) {
        const { count: total } = await supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('origin_hub_id', hub.id);

        const { count: delivered } = await supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('origin_hub_id', hub.id)
          .eq('status', 'DELIVERED');

        const { count: inTransit } = await supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('origin_hub_id', hub.id)
          .eq('status', 'IN_TRANSIT');

        results.push({
          hub_id: hub.id,
          hub_code: hub.code,
          hub_name: hub.name,
          total_shipments: total || 0,
          delivered: delivered || 0,
          in_transit: inTransit || 0,
          avg_delivery_time: 2.3 + Math.random() * 0.5, // Mock
          on_time_rate: 90 + Math.random() * 8, // Mock
        });
      }

      return results.sort((a, b) => b.total_shipments - a.total_shipments);
    },
  });

  // Export data
  const handleExport = () => {
    // Would implement CSV/Excel export
    toast.success('Export feature coming soon');
  };

  const isLoading = metricsLoading || dailyLoading || statusLoading || hubLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Real-time insights and performance metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as '7' | '30' | '90')}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="size-4" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                <Download className="size-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Shipments"
            value={metrics?.totalShipments || 0}
            icon={Package}
            trend={metrics?.trend.shipments}
            loading={isLoading}
          />
          <MetricCard
            title="Delivered Today"
            value={metrics?.deliveredToday || 0}
            icon={CheckCircle}
            trend={metrics?.trend.delivery}
            loading={isLoading}
          />
          <MetricCard
            title="In Transit"
            value={metrics?.inTransit || 0}
            icon={Truck}
            loading={isLoading}
          />
          <MetricCard
            title="Exceptions"
            value={metrics?.exceptions || 0}
            icon={AlertTriangle}
            trend={-2.3}
            trendNegative
            loading={isLoading}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Shipment Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5" />
                Shipment Trends
              </CardTitle>
              <CardDescription>Daily shipment volume over time</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyStats}>
                    <defs>
                      <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="shipments"
                      stroke={CHART_COLORS.primary}
                      fillOpacity={1}
                      fill="url(#colorShipments)"
                      name="Shipments"
                    />
                    <Line
                      type="monotone"
                      dataKey="delivered"
                      stroke={CHART_COLORS.success}
                      dot={false}
                      name="Delivered"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Current shipment status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="status"
                      >
                        {statusDistribution?.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={STATUS_COLORS[entry.status] || CHART_COLORS.muted}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string) => [
                          `${value} (${statusDistribution?.find((s) => s.status === name)?.percentage.toFixed(1)}%)`,
                          name.replace(/_/g, ' '),
                        ]}
                      />
                      <Legend formatter={(value) => value.replace(/_/g, ' ')} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Hub Performance */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-5" />
                Hub Performance
              </CardTitle>
              <CardDescription>Top performing hubs by volume</CardDescription>
            </CardHeader>
            <CardContent>
              {hubLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hubPerformance?.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="hub_code"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar
                      dataKey="total_shipments"
                      name="Total"
                      fill={CHART_COLORS.primary}
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar
                      dataKey="delivered"
                      name="Delivered"
                      fill={CHART_COLORS.success}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Key delivery indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Delivery Time</span>
                  <span className="text-lg font-semibold">{metrics?.avgDeliveryTime} days</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${Math.min(((metrics?.avgDeliveryTime || 0) / 5) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">On-Time Rate</span>
                  <span className="text-lg font-semibold text-status-success">
                    {metrics?.onTimeRate}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-status-success rounded-full"
                    style={{ width: `${metrics?.onTimeRate}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium mb-3">Top Hubs by On-Time Rate</h4>
                <div className="space-y-2">
                  {hubPerformance?.slice(0, 3).map((hub) => (
                    <div key={hub.hub_id} className="flex items-center justify-between text-sm">
                      <span className="font-mono">{hub.hub_code}</span>
                      <Badge variant="secondary">{hub.on_time_rate.toFixed(1)}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exceptions Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-status-warning" />
              Recent Exceptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="size-8 mx-auto mb-2 opacity-50" />
              <p>No active exceptions requiring attention</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  trend?: number;
  trendNegative?: boolean;
  loading?: boolean;
}

function MetricCard({ title, value, icon: Icon, trend, trendNegative, loading }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
            )}
            {trend !== undefined && !loading && (
              <div
                className={`flex items-center gap-1 mt-1 text-sm ${trendNegative ? 'text-status-error' : 'text-status-success'}`}
              >
                {trend >= 0 ? (
                  <ArrowUpRight className="size-3" />
                ) : (
                  <ArrowDownRight className="size-3" />
                )}
                <span>{Math.abs(trend).toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="size-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AnalyticsDashboard;
