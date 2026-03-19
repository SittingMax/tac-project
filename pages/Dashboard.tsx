import React, { lazy, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Activity, RefreshCw } from 'lucide-react';
import { KPIGrid } from '@/components/dashboard/KPIGrid';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { LiveActivityFeed } from '@/components/dashboard/LiveActivityFeed';
import { OperationalHealth } from '@/components/dashboard/OperationalHealth';
import { DateRangeSelector } from '@/components/dashboard/DateRangeSelector';
import { Button } from '@/components/ui/button';
import { ErrorBoundary, InlineError } from '@/components/ui/error-boundary';
import type { InvoiceWithRelations } from '@/hooks/useInvoices';
import type { ShipmentWithRelations } from '@/hooks/useShipments';
import { useRealtimeDashboard } from '@/hooks/useRealtime';
import { hasRoleAccess } from '@/lib/access-control';
import { logger } from '@/lib/logger';
import { queryKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer, PageHeader } from '@/components/ui-core/layout';

// Dynamically import heavy charting components
const RealtimeCorridorActivity = lazy(() =>
  import('@/components/dashboard/RealtimeCorridorActivity').then((m) => ({
    default: m.RealtimeCorridorActivity,
  }))
);
const ShipmentTrendChart = lazy(() =>
  import('@/components/dashboard/charts/ShipmentTrendChart').then((m) => ({
    default: m.ShipmentTrendChart,
  }))
);
const StatusDistributionChart = lazy(() =>
  import('@/components/dashboard/charts/StatusDistributionChart').then((m) => ({
    default: m.StatusDistributionChart,
  }))
);
const RevenueTrendChart = lazy(() =>
  import('@/components/dashboard/charts/RevenueTrendChart').then((m) => ({
    default: m.RevenueTrendChart,
  }))
);
const HubPerformanceChart = lazy(() =>
  import('@/components/dashboard/charts/HubPerformanceChart').then((m) => ({
    default: m.HubPerformanceChart,
  }))
);

export const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canExportDashboardReport = hasRoleAccess(user?.role, ['ADMIN', 'MANAGER', 'FINANCE_STAFF']);

  // Enable realtime subscriptions
  useRealtimeDashboard();

  // Global refresh handler — invalidate all data powering dashboard components
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.manifests.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.exceptions.all });
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'kpis'] });
  };

  // Data for Report Generation
  // Removed top-level hooks to prevent fetching all data on mount (performance optimization)

  const handleDownloadReport = async () => {
    try {
      const { toast } = await import('sonner');
      if (!canExportDashboardReport) {
        toast.error('Report export is only available to finance-authorized roles.');
        return;
      }
      const { supabase } = await import('@/lib/supabase');
      if (!user?.orgId) {
        throw new Error('No organization context available');
      }
      toast.info('Generating report...');

      // Fetch data on-demand with pagination cap
      const [shipmentsResult, invoicesResult] = await Promise.all([
        supabase
          .from('shipments')
          .select(
            `
            *,
            customer:customers(name, phone),
            origin_hub:hubs!origin_hub_id(code, name),
            destination_hub:hubs!destination_hub_id(code, name)
          `
          )
          .eq('org_id', user.orgId)
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('invoices')
          .select(
            `
            *,
            customer:customers(name, phone, email),
            shipment:shipments(cn_number)
          `
          )
          .eq('org_id', user.orgId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(500),
      ]);

      if (shipmentsResult.error) throw shipmentsResult.error;
      if (invoicesResult.error) throw invoicesResult.error;

      const shipments = (shipmentsResult.data || []) as unknown as ShipmentWithRelations[];
      const invoices = (invoicesResult.data || []) as unknown as InvoiceWithRelations[];

      const { generateDashboardReport } = await import('@/lib/dashboard-report-generator');

      const inventoryCount = shipments.filter((s) =>
        ['RECEIVED_AT_ORIGIN', 'RECEIVED_AT_DEST', 'EXCEPTION'].includes(s.status)
      ).length;

      generateDashboardReport({
        shipments,
        invoices,
        inventoryCount,
      });

      toast.success('Report downloaded successfully');
    } catch (error) {
      logger.error('Dashboard', 'Report generation failed', { error });
      const { toast } = await import('sonner');
      toast.error('Failed to generate report');
    }
  };

  const userGreetingName = user?.fullName?.split(' ')[0] || 'Team';

  return (
    <PageContainer
      data-testid="dashboard-page"
      className="flex flex-col gap-6 animate-in fade-in duration-300"
    >
      {/* Vibrant SaaS Welcome Hero */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 md:p-8 text-primary-foreground shadow-lg border border-primary/20">
        <div className="relative z-10">
          <PageHeader
            title={
              <span className="text-3xl font-bold tracking-tight text-primary-foreground md:text-4xl">
                Good morning, {userGreetingName}
              </span>
            }
            description={
              <span className="max-w-2xl text-primary-foreground/80 md:text-lg font-medium">
                Real-time logistics telemetry and operations health.
                {hasRoleAccess(user?.role, ['ADMIN', 'SUPER_ADMIN'])
                  ? ' You have full administrative access.'
                  : ' Viewing operations overview.'}
              </span>
            }
            badge={
              <Activity size={16} strokeWidth={1.5} className="animate-pulse text-emerald-400" />
            }
            className="mb-0"
          >
            <DateRangeSelector />
            <Button
              data-testid="dashboard-refresh-button"
              variant="outline"
              onClick={refreshData}
              className="h-10 bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm transition shadow-sm"
            >
              <RefreshCw size={16} strokeWidth={1.5} className="sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            {canExportDashboardReport && (
              <Button
                data-testid="dashboard-download-button"
                className="h-10 bg-white text-primary hover:bg-white/90 shadow-sm transition font-semibold"
                onClick={handleDownloadReport}
              >
                <span className="hidden sm:inline">Export Report</span>
                <span className="sm:hidden">Export</span>
              </Button>
            )}
          </PageHeader>
        </div>

        {/* Abstract blur background effect */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/20 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-black/10 blur-2xl pointer-events-none"></div>
      </div>

      {/* Primary Metrics Layer */}
      <ErrorBoundary fallback={<InlineError message="Failed to load KPI data" />}>
        <KPIGrid />
      </ErrorBoundary>

      <div className="mt-2">
        <ErrorBoundary fallback={<InlineError message="Failed to load quick actions" />}>
          <QuickActions />
        </ErrorBoundary>
      </div>

      {/* Telemetry Charts Tier */}
      <div className="flex flex-col gap-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Network Telemetry
          </h2>
        </div>

        <ResizablePanelGroup
          orientation="horizontal"
          className="min-h-[600px] w-full items-stretch rounded-lg border border-border/40 bg-card overflow-hidden"
        >
          {/* Main Chart Column */}
          <ResizablePanel
            defaultSize={65}
            minSize={40}
            className="p-0 flex flex-col items-stretch h-full"
          >
            <div className="flex-1 flex flex-col gap-6 flex flex-col p-4 w-full h-full min-h-[600px] overflow-auto custom-scrollbar">
              <ErrorBoundary fallback={<InlineError message="Failed to load shipment trend" />}>
                <Suspense fallback={<ChartSkeleton height={400} title="Volume Trend" fullHeight />}>
                  <ShipmentTrendChart />
                </Suspense>
              </ErrorBoundary>
              <ErrorBoundary fallback={<InlineError message="Failed to load map" />}>
                <Suspense fallback={<ChartSkeleton height={350} title="Live Corridor" />}>
                  <RealtimeCorridorActivity />
                </Suspense>
              </ErrorBoundary>
            </div>
          </ResizablePanel>

          <ResizableHandle
            withHandle
            className="bg-border/50 hover:bg-primary/50 transition-colors w-2"
          />

          {/* Secondary Charts Column */}
          <ResizablePanel
            defaultSize={35}
            minSize={25}
            className="p-0 flex flex-col items-stretch h-full bg-muted/10 border-l border-border/40"
          >
            <div className="flex-1 flex flex-col p-4 w-full h-full min-h-[600px] overflow-auto custom-scrollbar">
              <Tabs defaultValue="status" className="flex-1 flex flex-col h-full flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <TabsList className="grid w-full grid-cols-3 bg-muted/50 border border-border/50">
                    <TabsTrigger value="status" className="text-xs">
                      Status
                    </TabsTrigger>
                    <TabsTrigger value="hub" className="text-xs">
                      Hub
                    </TabsTrigger>
                    <TabsTrigger value="revenue" className="text-xs">
                      Finance
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent
                  value="status"
                  className="flex-1 mt-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring p-0 focus-visible:ring-0"
                >
                  <div className="h-full flex flex-col w-full">
                    <ErrorBoundary
                      fallback={<InlineError message="Failed to load status distribution" />}
                    >
                      <Suspense fallback={<ChartSkeleton height={300} title="Current Breakdown" />}>
                        <StatusDistributionChart />
                      </Suspense>
                    </ErrorBoundary>
                  </div>
                </TabsContent>

                <TabsContent
                  value="hub"
                  className="flex-1 mt-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring p-0 focus-visible:ring-0"
                >
                  <div className="h-full flex flex-col w-full">
                    <ErrorBoundary
                      fallback={<InlineError message="Failed to load hub comparison" />}
                    >
                      <Suspense fallback={<ChartSkeleton height={320} title="Hub Profile" />}>
                        <HubPerformanceChart />
                      </Suspense>
                    </ErrorBoundary>
                  </div>
                </TabsContent>

                <TabsContent
                  value="revenue"
                  className="flex-1 mt-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring p-0 focus-visible:ring-0"
                >
                  <div className="h-full flex flex-col w-full">
                    <ErrorBoundary
                      fallback={<InlineError message="Failed to load billing chart" />}
                    >
                      <Suspense fallback={<ChartSkeleton height={250} title="Billing Trend" />}>
                        <RevenueTrendChart />
                      </Suspense>
                    </ErrorBoundary>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Bottom Tier: Ops & Health */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(350px,1fr)] pt-4 border-t border-border/30 mt-8">
        <div className="col-span-1 h-full">
          <ErrorBoundary fallback={<InlineError message="Failed to load recent activity" />}>
            <LiveActivityFeed />
          </ErrorBoundary>
        </div>
        <div className="col-span-1 h-full">
          <ErrorBoundary fallback={<InlineError message="Failed to load health score" />}>
            <OperationalHealth />
          </ErrorBoundary>
        </div>
      </div>
    </PageContainer>
  );
};

// Chart Skeleton Component
function ChartSkeleton({
  height,
  title,
  fullHeight,
}: {
  height: number;
  title: string;
  fullHeight?: boolean;
}) {
  return (
    <div
      className={cn(
        'bg-muted/10 border border-border/40 rounded-lg flex flex-col items-center justify-center gap-3 p-6 transition-colors duration-300',
        fullHeight && 'h-full min-h-[500px]'
      )}
      style={!fullHeight ? { height } : undefined}
    >
      <div className="w-12 h-12 bg-muted/50 rounded-lg animate-pulse border border-border/40" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/60">Loading visualization...</p>
    </div>
  );
}

export default Dashboard;
