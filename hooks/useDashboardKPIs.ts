import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { subDays, format, startOfDay } from 'date-fns';

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

            // Execute optimized count queries
            const [totalRes, activeRes, deliveredRes, exceptionsRes] = await Promise.all([
                supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('org_id', orgId).is('deleted_at', null),
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
            ]);

            // Fetch basic trend data for the last 7 days for the sparkline
            const sevenDaysAgo = subDays(startOfDay(new Date()), 7).toISOString();
            const { data: recentShipments } = await supabase
                .from('shipments')
                .select('created_at')
                .eq('org_id', orgId)
                .is('deleted_at', null)
                .gte('created_at', sevenDaysAgo);

            // Aggregate trend data
            const trendMap = new Map<string, number>();
            for (let i = 0; i < 7; i++) {
                trendMap.set(format(subDays(startOfDay(new Date()), i), 'MMM dd'), 0);
            }

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

            return {
                total: totalRes.count || 0,
                active: activeRes.count || 0,
                delivered: deliveredRes.count || 0,
                exceptions: exceptionsRes.count || 0,
                revenue: 124500, // Mocked new KPI
                deliveryTime: 2.4, // Mocked new KPI
                slaCompliance: 98.2, // Mocked new KPI
                sparklineData,
            };
        },
        enabled: !!orgId,
    });
}
