/**
 * Tracking Service
 * Handles tracking events and shipment status updates
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase client requires any for complex operations */

import { supabase } from '@/lib/supabase';
import { mapSupabaseError } from '@/lib/errors';
import { orgService } from './orgService';
import type { Database } from '@/lib/database.types';

type TrackingEvent = Database['public']['Tables']['tracking_events']['Row'];
type TrackingEventInsert = Database['public']['Tables']['tracking_events']['Insert'];

export interface TrackingEventWithRelations extends TrackingEvent {
  hub?: { id: string; code: string; name: string };
  actor?: { id: string; full_name: string };
}

export const trackingService = {
  async getByShipmentId(shipmentId: string): Promise<TrackingEventWithRelations[]> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await supabase
      .from('tracking_events')
      .select(
        `
        *,
        hub:hubs(id, code, name),
        actor:staff(id, full_name)
      `
      )
      .eq('shipment_id', shipmentId)
      .eq('org_id', orgId)
      .order('event_time', { ascending: false });

    if (error) throw mapSupabaseError(error);
    return (data ?? []) as TrackingEventWithRelations[];
  },

  async getByAwb(awb: string): Promise<TrackingEventWithRelations[]> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await supabase
      .from('tracking_events')
      .select(
        `
        *,
        hub:hubs(id, code, name),
        actor:staff(id, full_name)
      `
      )
      .eq('cn_number', awb)
      .eq('org_id', orgId)
      .order('event_time', { ascending: false });

    if (error) throw mapSupabaseError(error);
    return (data ?? []) as TrackingEventWithRelations[];
  },

  async create(event: Omit<TrackingEventInsert, 'org_id'>): Promise<TrackingEvent> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await supabase
      .from('tracking_events')
      .insert({
        ...event,
        org_id: orgId,
      } as any)
      .select()
      .single();

    if (error) throw mapSupabaseError(error);
    return data as TrackingEvent;
  },

  async createScanEvent(
    shipmentId: string,
    awb: string,
    eventCode: string,
    hubId: string,
    staffId: string,
    meta?: Record<string, any>
  ): Promise<TrackingEvent> {
    return this.create({
      shipment_id: shipmentId,
      cn_number: awb,
      event_code: eventCode,
      hub_id: hubId,
      actor_staff_id: staffId,
      source: 'SCAN',
      meta: meta ?? {},
    });
  },

  async getRecentEvents(limit: number = 50): Promise<TrackingEventWithRelations[]> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await supabase
      .from('tracking_events')
      .select(
        `
        *,
        hub:hubs(id, code, name),
        actor:staff(id, full_name)
      `
      )
      .eq('org_id', orgId)
      .order('event_time', { ascending: false })
      .limit(limit);

    if (error) throw mapSupabaseError(error);
    return (data ?? []) as TrackingEventWithRelations[];
  },
};
