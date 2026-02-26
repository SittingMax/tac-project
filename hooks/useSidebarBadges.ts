import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export interface SidebarBadges {
    pendingBookings: number;
    openExceptions: number;
    openManifests: number;
}

export function useSidebarBadges() {
    const orgId = useAuthStore((s) => s.user?.orgId);

    return useQuery({
        queryKey: ['sidebar-badges', orgId],
        queryFn: async (): Promise<SidebarBadges> => {
            if (!orgId) return { pendingBookings: 0, openExceptions: 0, openManifests: 0 };

            const [bookingsRes, exceptionsRes, manifestsRes] = await Promise.all([
                supabase
                    .from('bookings')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'PENDING'),
                supabase
                    .from('exceptions')
                    .select('*', { count: 'exact', head: true })
                    .eq('org_id', orgId)
                    .eq('status', 'OPEN'),
                supabase
                    .from('manifests')
                    .select('*', { count: 'exact', head: true })
                    .eq('org_id', orgId)
                    .eq('status', 'OPEN'),
            ]);

            return {
                pendingBookings: bookingsRes.count || 0,
                openExceptions: exceptionsRes.count || 0,
                openManifests: manifestsRes.count || 0,
            };
        },
        enabled: !!orgId,
        refetchInterval: 30000, // Refresh every 30 seconds
    });
}
