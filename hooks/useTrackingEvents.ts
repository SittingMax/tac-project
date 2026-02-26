import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

import type { Database } from '../lib/database.types';

type Json = Database['public']['Tables']['tracking_events']['Row']['meta'];

export interface TrackingEvent {
  id: string;
  org_id: string;
  shipment_id: string;
  cn_number: string;
  event_code: string;
  event_time: string;
  hub_id: string | null;
  actor_staff_id: string | null;
  source: 'SCAN' | 'MANUAL' | 'SYSTEM' | 'API';
  meta: Json;
  created_at: string;
  hub?: { code: string; name: string };
  location?: string | null;
  notes?: string | null;
}

export function useTrackingEvents(awbNumber: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tracking-events', awbNumber],
    queryFn: async () => {
      // Use the public view for fetching events to adhere to security policies
      const { data, error } = await supabase
        .from('public_tracking_events')
        .select('*')
        .eq('cn_number', awbNumber!)
        .order('event_time', { ascending: false });

      if (error) throw error;

      // Map view result to TrackingEvent shape if needed (view flattens hub details)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((event: any) => ({
        ...event,
        hub: event.hub_code ? { code: event.hub_code, name: event.hub_name } : undefined,
      })) as TrackingEvent[];
    },
    enabled: !!awbNumber,
  });

  // Realtime subscription for tracking events
  useEffect(() => {
    if (!awbNumber) return;

    const channel = supabase
      .channel(`tracking:${awbNumber}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tracking_events',
          filter: `cn_number=eq.${awbNumber}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['tracking-events', awbNumber] });
          toast.info(`New tracking event: ${payload.new.event_code}`);
        }
      )
      .subscribe();

    return () => {
      // Use removeChannel for proper cleanup - prevents subscription churn and UI blocking
      supabase.removeChannel(channel);
    };
  }, [awbNumber, queryClient]);

  return query;
}

export function useCreateTrackingEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: {
      shipment_id: string;
      cn_number: string;
      event_code: string;
      hub_id?: string;
      source: 'SCAN' | 'MANUAL' | 'SYSTEM' | 'API';
      meta?: Json;
    }) => {
      // Get org_id from the first org
      const { data: org } = await supabase.from('orgs').select('id').single();
      if (!org) throw new Error('No organization found');

      const { data, error } = await supabase
        .from('tracking_events')
        .insert({
          ...event,
          org_id: org.id,
          event_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as TrackingEvent;
    },
    onSuccess: (data: TrackingEvent) => {
      queryClient.invalidateQueries({ queryKey: ['tracking-events', data.cn_number] });
    },
    onError: (error) => {
      toast.error(`Failed to create tracking event: ${error.message}`);
    },
  });
}
