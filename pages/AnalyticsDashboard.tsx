/**
 * AnalyticsDashboard
 * Premium analytics dashboard with interactive charts
 * Features: Shipment trends, status distribution, hub performance, delivery metrics
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { exportToCSV } from '@/lib/export';
import { useAuthStore } from '@/store/authStore';
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

const EXCEPTION_SEVERITY_CLASSNAMES: Record<string, string> = {
  LOW: 'border-status-info/30 bg-status-info/10 text-status-info',
  MEDIUM: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
  HIGH: 'border-status-error/30 bg-status-error/10 text-status-error',
  CRITICAL: 'border-status-error/30 bg-status-error/10 text-status-error',
};

const SLA_TARGET_DAYS: Record<string, number> = {
  EXPRESS: 2,
  STANDARD: 4,
  PRIORITY: 1,
};

const getDeliveryDurationDays = (createdAt: string | null, deliveredAt: string | null) => {
  if (!createdAt || !deliveredAt) return null;

  const createdAtTime = new Date(createdAt).getTime();
  const deliveredAtTime = new Date(deliveredAt).getTime();

  if (
    Number.isNaN(createdAtTime) ||
    Number.isNaN(deliveredAtTime) ||
    deliveredAtTime < createdAtTime
  ) {
    return null;
  }

  return (deliveredAtTime - createdAtTime) / (1000 * 60 * 60 * 24);
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

interface RecentExceptionItem {
  id: string;
  created_at: string;
  type: string;
  severity: string;
  status: string;
  shipment?: { cn_number: string } | null;
}

interface AnalyticsExportRow {
  section: string;
  dimension: string;
  metric: string;
  value: number | string;
  value_secondary: number | string;
  value_tertiary: number | string;
  notes: string;
}

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('30');
  const orgId = useAuthStore((state) => state.user?.orgId);

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
    queryKey: ['analytics-metrics', orgId, dateRangeParams],
    queryFn: async (): Promise<DashboardMetrics> => {
      if (!orgId) {
        return {
          totalShipments: 0,
          deliveredToday: 0,
          inTransit: 0,
          exceptions: 0,
          avgDeliveryTime: 0,
          onTimeRate: 0,
          trend: {
            shipments: 0,
            delivery: 0,
          },
        };
      }

      const { start, end } = dateRangeParams;
      const previousPeriodStart = subDays(new Date(start), parseInt(dateRange)).toISOString();

      const [
        totalShipmentsRes,
        deliveredTodayRes,
        inTransitRes,
        exceptionsRes,
        prevShipmentsRes,
        deliveredInRangeRes,
        previousDeliveredRes,
      ] = await Promise.all([
        supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .is('deleted_at', null)
          .gte('created_at', start)
          .lte('created_at', end),
        supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .is('deleted_at', null)
          .eq('status', 'DELIVERED')
          .gte('delivered_at', startOfDay(new Date()).toISOString()),
        supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .is('deleted_at', null)
          .eq('status', 'IN_TRANSIT'),
        supabase
          .from('exceptions')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .eq('status', 'OPEN'),
        supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .is('deleted_at', null)
          .gte('created_at', previousPeriodStart)
          .lt('created_at', start),
        supabase
          .from('shipments')
          .select('created_at, delivered_at, service_level')
          .eq('org_id', orgId)
          .is('deleted_at', null)
          .eq('status', 'DELIVERED')
          .not('delivered_at', 'is', null)
          .gte('delivered_at', start)
          .lte('delivered_at', end),
        supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .is('deleted_at', null)
          .eq('status', 'DELIVERED')
          .gte('delivered_at', previousPeriodStart)
          .lt('delivered_at', start),
      ]);

      const deliveredInRange = deliveredInRangeRes.data ?? [];
      const deliveryDurations = deliveredInRange
        .map((shipment) => getDeliveryDurationDays(shipment.created_at, shipment.delivered_at))
        .filter((duration): duration is number => duration !== null);

      const avgDeliveryTime =
        deliveryDurations.length > 0
          ? Number(
              (
                deliveryDurations.reduce((sum, duration) => sum + duration, 0) /
                deliveryDurations.length
              ).toFixed(1)
            )
          : 0;

      const onTimeDeliveries = deliveredInRange.filter((shipment) => {
        const durationDays = getDeliveryDurationDays(shipment.created_at, shipment.delivered_at);

        if (durationDays === null) {
          return false;
        }

        const targetDays =
          SLA_TARGET_DAYS[shipment.service_level ?? 'STANDARD'] ?? SLA_TARGET_DAYS.STANDARD;

        return durationDays <= targetDays;
      });

      const onTimeRate =
        deliveredInRange.length > 0
          ? Number(((onTimeDeliveries.length / deliveredInRange.length) * 100).toFixed(1))
          : 0;

      const totalShipments = totalShipmentsRes.count ?? 0;
      const prevShipments = prevShipmentsRes.count ?? 0;
      const deliveredToday = deliveredTodayRes.count ?? 0;
      const previousDelivered = previousDeliveredRes.count ?? 0;

      return {
        totalShipments,
        deliveredToday,
        inTransit: inTransitRes.count || 0,
        exceptions: exceptionsRes.count || 0,
        avgDeliveryTime,
        onTimeRate,
        trend: {
          shipments:
            totalShipments || prevShipments
              ? Number(
                  (((totalShipments - prevShipments) / Math.max(prevShipments, 1)) * 100).toFixed(1)
                )
              : 0,
          delivery:
            deliveredInRange.length || previousDelivered
              ? Number(
                  (
                    ((deliveredInRange.length - previousDelivered) /
                      Math.max(previousDelivered, 1)) *
                    100
                  ).toFixed(1)
                )
              : 0,
        },
      };
    },
    refetchInterval: 60000, // Refresh every minute
    enabled: !!orgId,
  });

  // Fetch daily stats for trend chart
  const { data: dailyStats, isLoading: dailyLoading } = useQuery({
    queryKey: ['analytics-daily', orgId, dateRangeParams],
    queryFn: async (): Promise<DailyStats[]> => {
      if (!orgId) {
        return [];
      }

      const days = parseInt(dateRange);
      const stats: DailyStats[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date).toISOString();
        const dayEnd = endOfDay(date).toISOString();

        const { count: shipments } = await supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .is('deleted_at', null)
          .gte('created_at', dayStart)
          .lte('created_at', dayEnd);

        const { count: delivered } = await supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .is('deleted_at', null)
          .eq('status', 'DELIVERED')
          .gte('delivered_at', dayStart)
          .lte('delivered_at', dayEnd);

        const { count: exceptions } = await supabase
          .from('exceptions')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
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
    enabled: !!orgId,
  });

  // Fetch status distribution
  const { data: statusDistribution, isLoading: statusLoading } = useQuery({
    queryKey: ['analytics-status', orgId],
    queryFn: async (): Promise<StatusDistribution[]> => {
      if (!orgId) {
        return [];
      }

      const { data, error } = await supabase
        .from('shipments')
        .select('status')
        .eq('org_id', orgId)
        .is('deleted_at', null);

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
    enabled: !!orgId,
  });

  // Fetch hub performance
  const { data: hubPerformance, isLoading: hubLoading } = useQuery({
    queryKey: ['analytics-hubs', orgId, dateRangeParams],
    queryFn: async (): Promise<HubPerformance[]> => {
      if (!orgId) {
        return [];
      }

      const { start, end } = dateRangeParams;
      const { data: hubs, error: hubsError } = await supabase.from('hubs').select('id, code, name');

      if (hubsError) throw hubsError;

      const results: HubPerformance[] = [];

      for (const hub of hubs || []) {
        const [totalRes, deliveredRes, inTransitRes] = await Promise.all([
          supabase
            .from('shipments')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .is('deleted_at', null)
            .eq('origin_hub_id', hub.id)
            .gte('created_at', start)
            .lte('created_at', end),
          supabase
            .from('shipments')
            .select('created_at, delivered_at, service_level')
            .eq('org_id', orgId)
            .is('deleted_at', null)
            .eq('origin_hub_id', hub.id)
            .eq('status', 'DELIVERED')
            .not('delivered_at', 'is', null)
            .gte('delivered_at', start)
            .lte('delivered_at', end),
          supabase
            .from('shipments')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .is('deleted_at', null)
            .eq('origin_hub_id', hub.id)
            .eq('status', 'IN_TRANSIT')
            .gte('created_at', start)
            .lte('created_at', end),
        ]);

        const deliveredShipments = deliveredRes.data ?? [];
        const hubDurations = deliveredShipments
          .map((shipment) => getDeliveryDurationDays(shipment.created_at, shipment.delivered_at))
          .filter((duration): duration is number => duration !== null);

        const avgDeliveryTime =
          hubDurations.length > 0
            ? Number(
                (
                  hubDurations.reduce((sum, duration) => sum + duration, 0) / hubDurations.length
                ).toFixed(1)
              )
            : 0;

        const onTimeDeliveries = deliveredShipments.filter((shipment) => {
          const durationDays = getDeliveryDurationDays(shipment.created_at, shipment.delivered_at);

          if (durationDays === null) {
            return false;
          }

          const targetDays =
            SLA_TARGET_DAYS[shipment.service_level ?? 'STANDARD'] ?? SLA_TARGET_DAYS.STANDARD;

          return durationDays <= targetDays;
        });

        const onTimeRate =
          deliveredShipments.length > 0
            ? Number(((onTimeDeliveries.length / deliveredShipments.length) * 100).toFixed(1))
            : 0;

        results.push({
          hub_id: hub.id,
          hub_code: hub.code,
          hub_name: hub.name,
          total_shipments: totalRes.count || 0,
          delivered: deliveredShipments.length,
          in_transit: inTransitRes.count || 0,
          avg_delivery_time: avgDeliveryTime,
          on_time_rate: onTimeRate,
        });
      }

      return results.sort((a, b) => b.total_shipments - a.total_shipments);
    },
    enabled: !!orgId,
  });

  const { data: recentExceptions, isLoading: recentExceptionsLoading } = useQuery({
    queryKey: ['analytics-recent-exceptions', orgId],
    queryFn: async (): Promise<RecentExceptionItem[]> => {
      if (!orgId) {
        return [];
      }

      const { data, error } = await supabase
        .from('exceptions')
        .select(
          `
            id,
            created_at,
            type,
            severity,
            status,
            shipment:shipments(cn_number)
          `
        )
        .eq('org_id', orgId)
        .in('status', ['OPEN', 'IN_PROGRESS'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      return (data ?? []) as RecentExceptionItem[];
    },
    enabled: !!orgId,
  });

  // Export data
  const handleExport = () => {
    if (isLoading) {
      toast.info('Analytics data is still loading. Please try again in a moment.');
      return;
    }

    if (!metrics && !dailyStats?.length && !statusDistribution?.length && !hubPerformance?.length) {
      toast.error('No analytics data available to export.');
      return;
    }

    const exportRows: AnalyticsExportRow[] = [
      {
        section: 'summary',
        dimension: `${dateRange} days`,
        metric: 'total_shipments',
        value: metrics?.totalShipments ?? 0,
        value_secondary: metrics?.trend.shipments ?? 0,
        value_tertiary: 0,
        notes: 'secondary_value=trend_percent',
      },
      {
        section: 'summary',
        dimension: `${dateRange} days`,
        metric: 'delivered_today',
        value: metrics?.deliveredToday ?? 0,
        value_secondary: metrics?.trend.delivery ?? 0,
        value_tertiary: 0,
        notes: 'secondary_value=trend_percent',
      },
      {
        section: 'summary',
        dimension: `${dateRange} days`,
        metric: 'in_transit',
        value: metrics?.inTransit ?? 0,
        value_secondary: 0,
        value_tertiary: 0,
        notes: '',
      },
      {
        section: 'summary',
        dimension: `${dateRange} days`,
        metric: 'open_exceptions',
        value: metrics?.exceptions ?? 0,
        value_secondary: 0,
        value_tertiary: 0,
        notes: '',
      },
      {
        section: 'summary',
        dimension: `${dateRange} days`,
        metric: 'avg_delivery_time_days',
        value: metrics?.avgDeliveryTime ?? 0,
        value_secondary: metrics?.onTimeRate ?? 0,
        value_tertiary: 0,
        notes: 'secondary_value=on_time_rate_percent',
      },
      ...(dailyStats ?? []).map((entry) => ({
        section: 'daily_stats',
        dimension: entry.date,
        metric: 'shipments_delivered_exceptions',
        value: entry.shipments,
        value_secondary: entry.delivered,
        value_tertiary: entry.exceptions,
        notes: 'value=shipments,secondary_value=delivered,tertiary_value=exceptions',
      })),
      ...(statusDistribution ?? []).map((entry) => ({
        section: 'status_distribution',
        dimension: entry.status,
        metric: 'count_percentage',
        value: entry.count,
        value_secondary: Number(entry.percentage.toFixed(2)),
        value_tertiary: 0,
        notes: 'secondary_value=percentage',
      })),
      ...(hubPerformance ?? []).map((entry) => ({
        section: 'hub_performance',
        dimension: entry.hub_code,
        metric: 'volume_delivery_transit',
        value: entry.total_shipments,
        value_secondary: entry.delivered,
        value_tertiary: entry.in_transit,
        notes: `hub_name=${entry.hub_name}; avg_delivery_time=${entry.avg_delivery_time.toFixed(2)}; on_time_rate=${entry.on_time_rate.toFixed(2)}%`,
      })),
    ];

    exportToCSV(exportRows, `analytics-${dateRange}d-${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success('Analytics snapshot exported successfully.');
  };

  const isLoading =
    metricsLoading || dailyLoading || statusLoading || hubLoading || recentExceptionsLoading;

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
            {recentExceptions && recentExceptions.length > 0 ? (
              <div className="space-y-3">
                {recentExceptions.map((exception) => (
                  <div
                    key={exception.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">
                          {exception.shipment?.cn_number ?? 'Unknown CN'}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            EXCEPTION_SEVERITY_CLASSNAMES[exception.severity] ??
                            'border-border bg-muted/40 text-foreground'
                          }
                        >
                          {exception.severity}
                        </Badge>
                      </div>
                      <div className="text-sm text-foreground">
                        {exception.type.replaceAll('_', ' ')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(exception.created_at), 'MMM d, yyyy HH:mm')}
                      </div>
                    </div>
                    <Badge variant={exception.status === 'OPEN' ? 'default' : 'secondary'}>
                      {exception.status.replaceAll('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="size-8 mx-auto mb-2 opacity-50" />
                <p>No active exceptions requiring attention</p>
              </div>
            )}
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
