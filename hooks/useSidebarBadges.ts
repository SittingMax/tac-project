import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { startOfDay } from 'date-fns';

export interface SidebarBadges {
  pendingBookings: number;
  openExceptions: number;
  openManifests: number;
  inTransitShipments: number;
  deliveredToday: number;
  unreadMessages: number;
  inventoryBacklog: number;
}

export function useSidebarBadges() {
  const orgId = useAuthStore((s) => s.user?.orgId);

  return useQuery({
    queryKey: ['sidebar-badges', orgId],
    queryFn: async (): Promise<SidebarBadges> => {
      if (!orgId)
        return {
          pendingBookings: 0,
          openExceptions: 0,
          openManifests: 0,
          inTransitShipments: 0,
          deliveredToday: 0,
          unreadMessages: 0,
          inventoryBacklog: 0,
        };

      const todayStartISO = startOfDay(new Date()).toISOString();

      const [
        bookingsRes,
        exceptionsRes,
        manifestsRes,
        inTransitRes,
        deliveredTodayRes,
        unreadMessagesRes,
        inventoryBacklogRes,
      ] = await Promise.all([
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
        supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .is('deleted_at', null)
          .eq('status', 'IN_TRANSIT'),
        supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .is('deleted_at', null)
          .eq('status', 'DELIVERED')
          .gte('delivered_at', todayStartISO),
        supabase
          .from('contact_messages')
          .select('*', { count: 'exact', head: true })
          .or(`org_id.eq.${orgId},org_id.is.null`)
          .eq('status', 'unread')
          .eq('archived', false),
        supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .is('deleted_at', null)
          .in('status', ['RECEIVED_AT_ORIGIN', 'RECEIVED_AT_DEST', 'EXCEPTION']),
      ]);

      return {
        pendingBookings: bookingsRes.count || 0,
        openExceptions: exceptionsRes.count || 0,
        openManifests: manifestsRes.count || 0,
        inTransitShipments: inTransitRes.count || 0,
        deliveredToday: deliveredTodayRes.count || 0,
        unreadMessages: unreadMessagesRes.count || 0,
        inventoryBacklog: inventoryBacklogRes.count || 0,
      };
    },
    enabled: !!orgId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
