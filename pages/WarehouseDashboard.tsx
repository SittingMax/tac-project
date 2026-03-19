/**
 * WarehouseDashboard Page
 * Premium warehouse operations dashboard with scan panel, metrics, and real-time updates
 */

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PageContainer, PageHeader, SectionCard } from '@/components/ui-core/layout';
import { StatCard } from '@/components/ui-core';
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
import { HUBS } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';

// Dashboard metrics
interface DashboardMetrics {
  todayScans: number;
  pendingDispatch: number;
  inTransit: number;
  exceptions: number;
}

export function WarehouseDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Get current hub from user context (simplified for demo)
  const currentHubEntry =
    Object.values(HUBS).find((hub) => hub.uuid === user?.hubId || hub.code === user?.hubCode) ??
    null;
  const currentHub = currentHubEntry?.code ?? user?.hubCode ?? 'UNASSIGNED';
  const hubName = currentHubEntry?.name ?? user?.hubCode ?? 'Unassigned Hub';
  const currentHubId = currentHubEntry?.uuid ?? user?.hubId ?? null;
  const hasAssignedHub = Boolean(currentHubId);

  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['warehouse-metrics', user?.orgId, currentHubId],
    queryFn: async (): Promise<DashboardMetrics> => {
      if (!user?.orgId || !currentHubId) {
        return {
          todayScans: 0,
          pendingDispatch: 0,
          inTransit: 0,
          exceptions: 0,
        };
      }

      // Get today's scans count
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let todayScansQuery = supabase
        .from('tracking_events')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', user.orgId)
        .gte('created_at', today.toISOString());

      if (currentHubId) {
        todayScansQuery = todayScansQuery.eq('hub_id', currentHubId);
      }

      const { count: todayScans } = await todayScansQuery;

      // Get pending dispatch count
      let pendingDispatchQuery = supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', user.orgId)
        .is('deleted_at', null)
        .eq('status', 'RECEIVED_AT_ORIGIN');

      if (currentHubId) {
        pendingDispatchQuery = pendingDispatchQuery.eq('origin_hub_id', currentHubId);
      }

      const { count: pendingDispatch } = await pendingDispatchQuery;
      const hubScopeFilter = `origin_hub_id.eq.${currentHubId},destination_hub_id.eq.${currentHubId},current_hub_id.eq.${currentHubId}`;

      // Get in transit count
      const { count: inTransit } = await supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', user.orgId)
        .is('deleted_at', null)
        .eq('status', 'IN_TRANSIT')
        .or(hubScopeFilter);

      const { data: hubShipments } = await supabase
        .from('shipments')
        .select('id')
        .eq('org_id', user.orgId)
        .is('deleted_at', null)
        .or(hubScopeFilter);

      const hubShipmentIds = (hubShipments ?? []).map((shipment) => shipment.id);

      // Get exceptions count
      let exceptions = 0;
      if (hubShipmentIds.length > 0) {
        const { count } = await supabase
          .from('exceptions')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', user.orgId)
          .eq('status', 'OPEN')
          .in('shipment_id', hubShipmentIds);
        exceptions = count || 0;
      }

      return {
        todayScans: todayScans || 0,
        pendingDispatch: pendingDispatch || 0,
        inTransit: inTransit || 0,
        exceptions: exceptions || 0,
      };
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  // Scan mutation
  const scanMutation = useMutation({
    mutationFn: async (code: string): Promise<ScanResult> => {
      if (!user?.orgId) {
        throw new Error('No organization context available for warehouse scanning.');
      }

      if (!currentHubId) {
        throw new Error('Assign a hub to your staff profile before using warehouse scanning.');
      }

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
        .eq('org_id', user.orgId)
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
        .update({ status: newStatus, current_hub_id: currentHubId })
        .eq('id', shipment.id)
        .eq('org_id', user.orgId);

      if (updateError) throw updateError;

      // Create tracking event
      await supabase.from('tracking_events').insert({
        org_id: user.orgId,
        shipment_id: shipment.id,
        cn_number: shipment.cn_number,
        event_code: newStatus,
        event_time: new Date().toISOString(),
        hub_id: currentHubId,
        actor_staff_id: user.id,
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
    <PageContainer>
      <PageHeader
        title={hubName}
        description={
          hasAssignedHub
            ? 'Warehouse Operations Dashboard'
            : 'Assign a hub to enable warehouse scanning and hub-scoped metrics'
        }
      >
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries()}
          className="gap-2"
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-6">
        {!hasAssignedHub && (
          <SectionCard
            title={
              <span className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-status-warning" />
                Hub assignment required
              </span>
            }
            className="border-status-warning/30 bg-status-warning/10"
          >
            <p className="text-sm text-muted-foreground">
              This workspace is not linked to a hub yet. Warehouse metrics stay at zero and scanning
              is disabled until your staff profile is assigned to a real hub.
            </p>
          </SectionCard>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Today's Scans"
            value={metricsLoading ? <Skeleton className="h-8 w-16" /> : (metrics?.todayScans ?? 0)}
            icon={Activity}
            iconColor="primary"
          />
          <StatCard
            title="Pending Dispatch"
            value={
              metricsLoading ? <Skeleton className="h-8 w-16" /> : (metrics?.pendingDispatch ?? 0)
            }
            icon={Truck}
            iconColor="warning"
          />
          <StatCard
            title="In Transit"
            value={metricsLoading ? <Skeleton className="h-8 w-16" /> : (metrics?.inTransit ?? 0)}
            icon={TrendingUp}
            iconColor="primary"
          />
          <StatCard
            title="Exceptions"
            value={metricsLoading ? <Skeleton className="h-8 w-16" /> : (metrics?.exceptions ?? 0)}
            icon={AlertTriangle}
            iconColor="error"
          />
        </div>

        {/* Scan Panel */}
        {hasAssignedHub ? (
          <WarehouseScanPanel
            onScan={handleScan}
            hubName={hubName}
            hubCode={currentHub}
            showRecentScans
            recentScans={recentScans}
            onClearRecentScans={handleClearRecentScans}
            autoFocus
          />
        ) : (
          <SectionCard title="Scan Panel">
            <p className="text-sm text-muted-foreground">
              Warehouse scanning becomes available after a hub assignment is added to your staff
              account.
            </p>
          </SectionCard>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <SectionCard title="Quick Actions" contentClassName="pt-0">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => navigate('/shipments?new=true')}
              >
                <Package className="size-4" />
                New Shipment
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => navigate('/manifests')}
              >
                <Truck className="size-4" />
                Create Manifest
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => navigate('/arrival-audit')}
              >
                <CheckCircle className="size-4" />
                Verify Arrival
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => navigate('/shift-report')}
              >
                <Clock className="size-4" />
                Shift Report
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Recent Activity" contentClassName="pt-0">
            <div className="flex flex-col gap-2">
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
          </SectionCard>
        </div>
      </div>
    </PageContainer>
  );
}

export default WarehouseDashboard;
