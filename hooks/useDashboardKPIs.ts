import { useQuery } from '@tanstack/react-query';
import { format, startOfDay, subDays } from 'date-fns';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

const SLA_TARGET_DAYS: Record<string, number> = {
  EXPRESS: 2,
  STANDARD: 4,
  PRIORITY: 1,
};

export interface DashboardKPIs {
  total: number;
  active: number;
  delivered: number;
  exceptions: number;
  revenue: number; // Placeholder for new KPI
  deliveryTime: number; // Placeholder
  slaCompliance: number; // Placeholder
  sparklineData: { date: string; value: number }[];
}

export function useDashboardKPIs() {
  const orgId = useAuthStore((s) => s.user?.orgId);

  return useQuery({
    queryKey: ['dashboard', 'kpis', orgId],
    queryFn: async (): Promise<DashboardKPIs> => {
      if (!orgId) throw new Error('No org ID');

      const todayStart = startOfDay(new Date());
      const sevenDaysAgo = subDays(todayStart, 7).toISOString();
      const thirtyDaysAgo = subDays(todayStart, 30).toISOString();

      const [
        totalRes,
        activeRes,
        deliveredRes,
        exceptionsRes,
        recentShipmentsRes,
        paidInvoicesRes,
        deliveredShipmentsRes,
      ] = await Promise.all([
        supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .is('deleted_at', null),
        supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .is('deleted_at', null)
          .in('status', ['RECEIVED_AT_ORIGIN', 'IN_TRANSIT', 'RECEIVED_AT_DEST']),
        supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .is('deleted_at', null)
          .eq('status', 'DELIVERED'),
        supabase
          .from('exceptions')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .eq('status', 'OPEN'),
        supabase
          .from('shipments')
          .select('created_at')
          .eq('org_id', orgId)
          .is('deleted_at', null)
          .gte('created_at', sevenDaysAgo),
        supabase
          .from('invoices')
          .select('total, paid_at')
          .eq('org_id', orgId)
          .is('deleted_at', null)
          .eq('status', 'PAID')
          .gte('paid_at', todayStart.toISOString()),
        supabase
          .from('shipments')
          .select('created_at, delivered_at, service_level')
          .eq('org_id', orgId)
          .is('deleted_at', null)
          .eq('status', 'DELIVERED')
          .not('delivered_at', 'is', null)
          .gte('delivered_at', thirtyDaysAgo),
      ]);

      // Aggregate trend data
      const trendMap = new Map<string, number>();
      for (let i = 0; i < 7; i++) {
        trendMap.set(format(subDays(todayStart, i), 'MMM dd'), 0);
      }

      const recentShipments = recentShipmentsRes.data ?? [];
      if (recentShipments) {
        recentShipments.forEach((s) => {
          if (!s.created_at) return;
          const dateStr = format(new Date(s.created_at), 'MMM dd');
          if (trendMap.has(dateStr)) {
            trendMap.set(dateStr, trendMap.get(dateStr)! + 1);
          }
        });
      }

      const sparklineData = Array.from(trendMap.entries())
        .map(([date, value]) => ({ date, value }))
        .reverse();

      const paidInvoices = paidInvoicesRes.data ?? [];
      const deliveredShipments = deliveredShipmentsRes.data ?? [];

      const revenue = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0);

      const deliveryDurations = deliveredShipments
        .map((shipment) => {
          if (!shipment.created_at || !shipment.delivered_at) return null;
          const createdAt = new Date(shipment.created_at).getTime();
          const deliveredAt = new Date(shipment.delivered_at).getTime();
          if (Number.isNaN(createdAt) || Number.isNaN(deliveredAt) || deliveredAt < createdAt) {
            return null;
          }

          return (deliveredAt - createdAt) / (1000 * 60 * 60 * 24);
        })
        .filter((duration): duration is number => duration !== null);

      const deliveryTime =
        deliveryDurations.length > 0
          ? Number(
              (
                deliveryDurations.reduce((sum, duration) => sum + duration, 0) /
                deliveryDurations.length
              ).toFixed(1)
            )
          : 0;

      const onTimeDeliveries = deliveredShipments.filter((shipment) => {
        if (!shipment.created_at || !shipment.delivered_at) return false;

        const createdAt = new Date(shipment.created_at).getTime();
        const deliveredAt = new Date(shipment.delivered_at).getTime();
        if (Number.isNaN(createdAt) || Number.isNaN(deliveredAt) || deliveredAt < createdAt) {
          return false;
        }

        const targetDays =
          SLA_TARGET_DAYS[shipment.service_level ?? 'STANDARD'] ?? SLA_TARGET_DAYS.STANDARD;
        const durationDays = (deliveredAt - createdAt) / (1000 * 60 * 60 * 24);
        return durationDays <= targetDays;
      });

      const slaCompliance =
        deliveredShipments.length > 0
          ? Number(((onTimeDeliveries.length / deliveredShipments.length) * 100).toFixed(1))
          : 0;

      return {
        total: totalRes.count || 0,
        active: activeRes.count || 0,
        delivered: deliveredRes.count || 0,
        exceptions: exceptionsRes.count || 0,
        revenue,
        deliveryTime,
        slaCompliance,
        sparklineData,
      };
    },
    enabled: !!orgId,
  });
}
