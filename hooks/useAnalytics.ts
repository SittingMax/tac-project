import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export interface AnalyticsSummary {
    total_shipments: number;
    delivered: number;
    delayed: number;
    exceptions: number;
    on_track: number;
    monthly_data: {
        month: string;
        outbound: number;
        inbound: number;
    }[];
}

export const analyticsKeys = {
    all: ['analytics'] as const,
    summary: (orgId: string) => [...analyticsKeys.all, 'summary', orgId] as const,
};

export function useAnalyticsSummary(options?: { orgId?: string }) {
    const authOrgId = useAuthStore((s) => s.user?.orgId);
    const orgId = options?.orgId || authOrgId;
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!orgId) return;

        // Subscribe to both shipments and exceptions to invalidate analytics data when they change
        const shipmentsSub = supabase
            .channel('analytics-shipments')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'shipments',
                    filter: `org_id=eq.${orgId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: analyticsKeys.summary(orgId) });
                }
            )
            .subscribe();

        const exceptionsSub = supabase
            .channel('analytics-exceptions')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'exceptions',
                    filter: `org_id=eq.${orgId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: analyticsKeys.summary(orgId) });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(shipmentsSub);
            supabase.removeChannel(exceptionsSub);
        };
    }, [orgId, queryClient]);

    return useQuery({
        queryKey: analyticsKeys.summary(orgId!),
        queryFn: async () => {
            if (!orgId) throw new Error('Organization ID is required');

            // @ts-expect-error Supabase RPC typing issue
            const { data, error } = await supabase.rpc('get_analytics_summary', {
                p_org_id: orgId,
            });

            if (error) {
                throw error;
            }

            // Return default structure if data is unexpectedly null.
            if (!data) {
                return {
                    total_shipments: 0,
                    delivered: 0,
                    delayed: 0,
                    exceptions: 0,
                    on_track: 0,
                    monthly_data: []
                } as AnalyticsSummary;
            }

            return data as unknown as AnalyticsSummary;
        },
        enabled: !!orgId,
        // Keep data relatively fresh but don't over-fetch as realtime will trigger updates
        staleTime: 5 * 60 * 1000,
    });
}
