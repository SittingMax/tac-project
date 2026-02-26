/**
 * Realtime Subscription Hooks
 * Subscribe to Supabase realtime changes for live updates
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import { isFeatureEnabled } from '@/config/features';
import { logger } from '@/lib/logger';

/**
 * Subscribe to realtime changes for shipments
 * Uses ref to prevent duplicate subscriptions during React Strict Mode
 */
export function useRealtimeShipments() {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!isFeatureEnabled('realtimeTracking')) return;

    // Prevent duplicate subscriptions
    if (isSubscribedRef.current) return;

    const setupSubscription = () => {
      isSubscribedRef.current = true;

      const channel = supabase
        .channel('shipments-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shipments',
          },
          (payload) => {
            logger.debug('[Realtime] Shipment changed', { eventType: payload.eventType });

            // Invalidate shipments queries
            queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all });

            // If it's a specific shipment, invalidate that too
            const newRecord = payload.new as Record<string, unknown> | null;
            if (newRecord?.id && typeof newRecord.id === 'string') {
              queryClient.invalidateQueries({
                queryKey: queryKeys.shipments.detail(newRecord.id),
              });
            }
          }
        )
        .subscribe((status) => {
          logger.debug('[Realtime] Shipments subscription', { status });
        });

      channelRef.current = channel;
    };

    // Debounce subscription to handle Strict Mode
    const timeoutId = setTimeout(setupSubscription, 100);

    return () => {
      clearTimeout(timeoutId);
      isSubscribedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient]);
}

/**
 * Subscribe to realtime changes for manifests
 * Uses ref to prevent duplicate subscriptions during React Strict Mode
 */
export function useRealtimeManifests() {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!isFeatureEnabled('realtimeTracking')) return;

    // Prevent duplicate subscriptions
    if (isSubscribedRef.current) return;

    const setupSubscription = () => {
      isSubscribedRef.current = true;

      const channel = supabase
        .channel('manifests-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'manifests',
          },
          (payload) => {
            logger.debug('[Realtime] Manifest changed', { eventType: payload.eventType });
            queryClient.invalidateQueries({ queryKey: queryKeys.manifests.all });
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    // Debounce subscription to handle Strict Mode
    const timeoutId = setTimeout(setupSubscription, 100);

    return () => {
      clearTimeout(timeoutId);
      isSubscribedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient]);
}

/**
 * Subscribe to realtime changes for tracking events
 * Uses ref to prevent duplicate subscriptions during React Strict Mode
 */
export function useRealtimeTracking(awb?: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const currentAwbRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!isFeatureEnabled('realtimeTracking') || !awb) return;

    // Clean up previous channel if AWB changed
    if (currentAwbRef.current !== awb && channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    // Prevent duplicate subscriptions
    if (isSubscribedRef.current && currentAwbRef.current === awb) return;

    const setupSubscription = () => {
      isSubscribedRef.current = true;
      currentAwbRef.current = awb;

      const channel = supabase
        .channel(`tracking-${awb}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'tracking_events',
            filter: `cn_number=eq.${awb}`,
          },
          () => {
            logger.debug('[Realtime] New tracking event', { awb });
            queryClient.invalidateQueries({ queryKey: queryKeys.tracking.byCN(awb) });
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    // Debounce subscription to handle Strict Mode
    const timeoutId = setTimeout(setupSubscription, 100);

    return () => {
      clearTimeout(timeoutId);
      isSubscribedRef.current = false;
      currentAwbRef.current = undefined;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient, awb]);
}

/**
 * Subscribe to realtime changes for exceptions
 * Uses ref to prevent duplicate subscriptions during React Strict Mode
 */
export function useRealtimeExceptions() {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!isFeatureEnabled('realtimeTracking')) return;

    // Prevent duplicate subscriptions
    if (isSubscribedRef.current) return;

    const setupSubscription = () => {
      isSubscribedRef.current = true;

      const channel = supabase
        .channel('exceptions-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'exceptions',
          },
          (payload) => {
            logger.debug('[Realtime] Exception changed', { eventType: payload.eventType });
            queryClient.invalidateQueries({ queryKey: queryKeys.exceptions.all });
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    // Debounce subscription to handle Strict Mode
    const timeoutId = setTimeout(setupSubscription, 100);

    return () => {
      clearTimeout(timeoutId);
      isSubscribedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient]);
}

/**
 * Combined hook for dashboard - subscribes to all important tables
 */
export function useRealtimeDashboard() {
  useRealtimeShipments();
  useRealtimeManifests();
  useRealtimeExceptions();
}
