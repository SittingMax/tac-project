import React, { lazy, Suspense } from 'react';
import { useStore } from '@/store';
import { ShipmentWithRelations } from '@/hooks/useShipments';
import { InvoiceWithRelations } from '@/hooks/useInvoices';
import { KPIGrid } from '../components/dashboard/KPIGrid';

// Dynamically import heavy charting components to reduce initial bundle size
const DashboardCharts = lazy(() => import('../components/dashboard/Charts').then(m => ({ default: m.DashboardCharts })));
const RealtimeCorridorActivity = lazy(() => import('../components/dashboard/RealtimeCorridorActivity').then(m => ({ default: m.RealtimeCorridorActivity })));
const ChartBarInteractive = lazy(() => import('../components/dashboard/charts/ChartBarInteractive').then(m => ({ default: m.ChartBarInteractive })));
const ChartRadialGrid = lazy(() => import('../components/dashboard/charts/ChartRadialGrid').then(m => ({ default: m.ChartRadialGrid })));
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { RefreshCw } from 'lucide-react';
import { QuickActions } from '../components/dashboard/QuickActions';

import { LiveActivityFeed } from '../components/dashboard/LiveActivityFeed';
import { OperationalHealth } from '../components/dashboard/OperationalHealth';
import { DateRangeSelector } from '../components/dashboard/DateRangeSelector';

import { ErrorBoundary, InlineError } from '../components/ui/error-boundary';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { useRealtimeDashboard } from '../hooks/useRealtime';

export const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useStore();

  // Enable realtime subscriptions for live dashboard updates
  useRealtimeDashboard();

  // Global refresh handler — invalidate all data powering dashboard components
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.manifests.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.exceptions.all });
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  };

  // Data for Report Generation
  // Removed top-level hooks to prevent fetching all data on mount (performance optimization)

  const handleDownloadReport = async () => {
    try {
      const { toast } = await import('sonner');
      const { supabase } = await import('../lib/supabase');
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
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(500),
      ]);

      if (shipmentsResult.error) throw shipmentsResult.error;
      if (invoicesResult.error) throw invoicesResult.error;

      const shipments = (shipmentsResult.data || []) as unknown as ShipmentWithRelations[];
      const invoices = (invoicesResult.data || []) as unknown as InvoiceWithRelations[];

      const { generateDashboardReport } = await import('../lib/dashboard-report-generator');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inventoryCount = shipments.filter((s: any) =>
        ['RECEIVED_AT_ORIGIN', 'RECEIVED_AT_DEST', 'EXCEPTION'].includes(s.status)
      ).length;

      generateDashboardReport({
        shipments,
        invoices,
        inventoryCount,
      });

      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Report generation failed:', error);
      const { toast } = await import('sonner');
      toast.error('Failed to generate report');
    }
  };

  return (
    <div data-testid="dashboard-page" className="space-y-4 animate-[fadeIn_0.2s_ease-out] pb-8">
      <PageHeader
        title="Mission Control"
        description="Real-time logistics overview and operations."
      >
        <Button data-testid="dashboard-refresh-button" variant="ghost" onClick={refreshData}>
          <RefreshCw className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        <DateRangeSelector />
        <Button
          data-testid="dashboard-download-button"
          variant="secondary"
          onClick={handleDownloadReport}
        >
          <span className="hidden sm:inline">Download Report</span>
          <span className="sm:hidden">Report</span>
        </Button>
      </PageHeader>

      {/* Vibrant SaaS Welcome Hero */}
      <div className="relative overflow-hidden rounded-none bg-gradient-to-br from-primary via-primary/90 to-primary/60 p-8 text-primary-foreground shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Good morning, {user?.name?.split(' ')[0] || 'Team'}</h2>
            <p className="text-primary-foreground/80 text-lg max-w-xl">
              Here is what's happening with your logistics operations today. You have {user?.role === 'SUPER_ADMIN' ? 'full access' : 'limited access'} to system features.
            </p>
          </div>
          <div className="mt-6 md:mt-0 hidden md:block">
            {/* Decorative Element */}
            <div className="flex gap-4">
              <div className="h-16 w-32 rounded-none bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                <span className="text-2xl font-bold">98%</span>
              </div>
            </div>
          </div>
        </div>
        {/* Abstract blur background effect */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-none bg-white/20 blur-3xl pointer-events-none"></div>
      </div>

      <ErrorBoundary fallback={<InlineError message="Failed to load quick actions" />}>
        <QuickActions />
      </ErrorBoundary>

      <ErrorBoundary fallback={<InlineError message="Failed to load KPI data" />}>
        <KPIGrid />
      </ErrorBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <div className="flex flex-col gap-4">
          <ErrorBoundary fallback={<InlineError message="Failed to load map" />}>
            <Suspense fallback={<div className="h-[300px] bg-muted/20 animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">Loading Map...</div>}>
              <RealtimeCorridorActivity />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary fallback={<InlineError message="Failed to load shipments chart" />}>
            <Suspense fallback={<div className="h-[300px] bg-muted/20 animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">Loading Charts...</div>}>
              <ChartBarInteractive />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary fallback={<InlineError message="Failed to load efficiency index" />}>
            <Suspense fallback={<div className="h-[300px] bg-muted/20 animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">Loading Indexes...</div>}>
              <ChartRadialGrid />
            </Suspense>
          </ErrorBoundary>
        </div>

        <ErrorBoundary fallback={<InlineError message="Failed to load charts" />}>
          <Suspense fallback={<div className="h-[full] min-h-[500px] bg-muted/20 animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">Loading Dashboard Charts...</div>}>
            <DashboardCharts />
          </Suspense>
        </ErrorBoundary>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-1 lg:col-span-2">
          <ErrorBoundary fallback={<InlineError message="Failed to load recent activity" />}>
            <LiveActivityFeed />
          </ErrorBoundary>
        </div>
        <div className="col-span-1">
          <ErrorBoundary fallback={<InlineError message="Failed to load health score" />}>
            <OperationalHealth />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};
