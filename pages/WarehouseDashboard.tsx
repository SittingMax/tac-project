/**
 * WarehouseDashboard Page
 * Premium warehouse operations dashboard with scan panel, metrics, and real-time updates
 */

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  WarehouseScanPanel,
  type ScanResult,
  type RecentScan,
} from '@/components/domain/warehouse-scan-panel';
import { StatusBadge } from '@/components/domain/status-badge';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { ShipmentStatus } from '@/types';

// Dashboard metrics
interface DashboardMetrics {
  todayScans: number;
  pendingDispatch: number;
  inTransit: number;
  exceptions: number;
  avgProcessingTime: number;
}

export function WarehouseDashboard() {
  const queryClient = useQueryClient();
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Get current hub from user context (simplified for demo)
  const currentHub = 'IMF'; // Imphal Hub
  const hubName = 'Imphal Hub';

  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['warehouse-metrics', currentHub],
    queryFn: async (): Promise<DashboardMetrics> => {
      // Get today's scans count
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: todayScans } = await supabase
        .from('tracking_events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Get pending dispatch count
      const { count: pendingDispatch } = await supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'RECEIVED_AT_ORIGIN');

      // Get in transit count
      const { count: inTransit } = await supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'IN_TRANSIT');

      // Get exceptions count
      const { count: exceptions } = await supabase
        .from('exceptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'OPEN');

      return {
        todayScans: todayScans || 0,
        pendingDispatch: pendingDispatch || 0,
        inTransit: inTransit || 0,
        exceptions: exceptions || 0,
        avgProcessingTime: 2.5, // Mock data
      };
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  // Scan mutation
  const scanMutation = useMutation({
    mutationFn: async (code: string): Promise<ScanResult> => {
      // Try to find shipment
      const { data: shipment, error } = await supabase
        .from('shipments')
        .select(
          `
          id,
          cn_number,
          status,
          total_weight,
          package_count,
          consignee_name,
          consignee_phone,
          origin_hub:hubs!shipments_origin_hub_id_fkey(name),
          destination_hub:hubs!shipments_destination_hub_id_fkey(name)
        `
        )
        .eq('cn_number', code)
        .maybeSingle();

      if (error) throw error;

      if (!shipment) {
        return {
          status: 'error',
          message: `Shipment ${code} not found`,
        };
      }

      // Determine next status based on current status
      const statusFlow: Record<string, ShipmentStatus> = {
        CREATED: 'RECEIVED_AT_ORIGIN',
        PICKUP_SCHEDULED: 'RECEIVED_AT_ORIGIN',
        PICKED_UP: 'RECEIVED_AT_ORIGIN',
        RECEIVED_AT_ORIGIN: 'IN_TRANSIT',
        IN_TRANSIT: 'RECEIVED_AT_DEST',
        RECEIVED_AT_DEST: 'OUT_FOR_DELIVERY',
        OUT_FOR_DELIVERY: 'DELIVERED',
      };

      const newStatus = statusFlow[shipment.status as ShipmentStatus];

      if (!newStatus) {
        return {
          status: 'warning',
          message: `Shipment is in terminal state: ${shipment.status}`,
          shipment: {
            id: shipment.id,
            cn_number: shipment.cn_number,
            status: shipment.status as ShipmentStatus,
            origin: (shipment.origin_hub as { name: string })?.name || 'Unknown',
            destination: (shipment.destination_hub as { name: string })?.name || 'Unknown',
            consignee_name: shipment.consignee_name,
            consignee_phone: shipment.consignee_phone,
            total_weight: shipment.total_weight,
            package_count: shipment.package_count,
          },
        };
      }

      // Update shipment status
      const { error: updateError } = await supabase
        .from('shipments')
        .update({ status: newStatus, current_hub_id: '00000000-0000-0000-0000-000000000010' })
        .eq('id', shipment.id);

      if (updateError) throw updateError;

      // Create tracking event
      await supabase.from('tracking_events').insert({
        org_id: '00000000-0000-0000-0000-000000000001',
        shipment_id: shipment.id,
        cn_number: shipment.cn_number,
        event_code: newStatus,
        event_time: new Date().toISOString(),
        hub_id: '00000000-0000-0000-0000-000000000010',
        source: 'SCAN',
        location: hubName,
      });

      return {
        status: 'success',
        message: `Status updated to ${newStatus.replace(/_/g, ' ')}`,
        shipment: {
          id: shipment.id,
          cn_number: shipment.cn_number,
          status: shipment.status as ShipmentStatus,
          origin: (shipment.origin_hub as { name: string })?.name || 'Unknown',
          destination: (shipment.destination_hub as { name: string })?.name || 'Unknown',
          consignee_name: shipment.consignee_name,
          consignee_phone: shipment.consignee_phone,
          total_weight: shipment.total_weight,
          package_count: shipment.package_count,
        },
        newStatus,
      };
    },
    onSuccess: (result) => {
      // Add to recent scans
      if (
        result.shipment &&
        (result.status === 'success' || result.status === 'warning' || result.status === 'error')
      ) {
        setRecentScans((prev) => [
          {
            id: result.shipment!.id,
            cn_number: result.shipment!.cn_number,
            timestamp: new Date(),
            status: result.status as 'success' | 'warning' | 'error',
            newStatus: result.newStatus,
          },
          ...prev.slice(0, 9), // Keep last 10
        ]);
      }

      // Refresh metrics
      queryClient.invalidateQueries({ queryKey: ['warehouse-metrics'] });
    },
  });

  // Handle scan
  const handleScan = useCallback(
    async (code: string): Promise<ScanResult> => {
      return scanMutation.mutateAsync(code);
    },
    [scanMutation]
  );

  // Clear recent scans
  const handleClearRecentScans = useCallback(() => {
    setRecentScans([]);
  }, []);

  // Listen for online/offline
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{hubName}</h1>
                <p className="text-xs text-muted-foreground">Warehouse Operations Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
                  isOnline
                    ? 'bg-status-success/10 text-status-success'
                    : 'bg-status-error/10 text-status-error'
                )}
              >
                {isOnline ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
                {isOnline ? 'Online' : 'Offline'}
              </div>

              {/* Refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries()}
                className="gap-2"
              >
                <RefreshCw className="size-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Today's Scans"
            value={metrics?.todayScans ?? 0}
            icon={Activity}
            color="text-primary"
            bgColor="bg-primary/10"
            loading={metricsLoading}
          />
          <MetricCard
            title="Pending Dispatch"
            value={metrics?.pendingDispatch ?? 0}
            icon={Truck}
            color="text-status-warning"
            bgColor="bg-status-warning/10"
            loading={metricsLoading}
          />
          <MetricCard
            title="In Transit"
            value={metrics?.inTransit ?? 0}
            icon={TrendingUp}
            color="text-status-info"
            bgColor="bg-status-info/10"
            loading={metricsLoading}
          />
          <MetricCard
            title="Exceptions"
            value={metrics?.exceptions ?? 0}
            icon={AlertTriangle}
            color="text-status-error"
            bgColor="bg-status-error/10"
            loading={metricsLoading}
          />
        </div>

        {/* Scan Panel */}
        <WarehouseScanPanel
          onScan={handleScan}
          hubName={hubName}
          hubCode={currentHub}
          showRecentScans
          recentScans={recentScans}
          onClearRecentScans={handleClearRecentScans}
          autoFocus
        />

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-start gap-2">
                  <Package className="size-4" />
                  New Shipment
                </Button>
                <Button variant="outline" className="justify-start gap-2">
                  <Truck className="size-4" />
                  Create Manifest
                </Button>
                <Button variant="outline" className="justify-start gap-2">
                  <CheckCircle className="size-4" />
                  Verify Arrival
                </Button>
                <Button variant="outline" className="justify-start gap-2">
                  <Clock className="size-4" />
                  Shift Report
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {recentScans.length > 0 ? (
                  recentScans.slice(0, 5).map((scan) => (
                    <div
                      key={scan.id}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{scan.cn_number}</span>
                      </div>
                      {scan.newStatus && <StatusBadge status={scan.newStatus} size="sm" />}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-4">No recent scans</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  loading?: boolean;
}

function MetricCard({ title, value, icon: Icon, color, bgColor, loading }: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
            {loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1" />
            ) : (
              <p className={cn('text-2xl font-bold mt-1', color)}>{value.toLocaleString()}</p>
            )}
          </div>
          <div className={cn('size-10 rounded-lg flex items-center justify-center', bgColor)}>
            <Icon className={cn('size-5', color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Utility function
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default WarehouseDashboard;
