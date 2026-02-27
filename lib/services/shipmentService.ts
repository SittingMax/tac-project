/**
 * Shipment Service
 * All shipment CRUD operations
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase client requires any for complex insert/update operations */

import { supabase } from '@/lib/supabase';
import { mapSupabaseError, ValidationError } from '@/lib/errors';
import { orgService } from './orgService';
import { isValidStatusTransition, type ShipmentStatusType } from '@/lib/schemas/shipment.schema';
import type { Database } from '@/lib/database.types';

type Shipment = Database['public']['Tables']['shipments']['Row'];
type ShipmentInsert = Database['public']['Tables']['shipments']['Insert'];
type ShipmentUpdate = Database['public']['Tables']['shipments']['Update'];

export interface ShipmentWithRelations extends Shipment {
  customer?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
  origin_hub?: {
    id: string;
    code: string;
    name: string;
  };
  destination_hub?: {
    id: string;
    code: string;
    name: string;
  };
  invoice?: {
    id: string;
    invoice_no: string;
    status: string;
    total: number;
  }[];
}

export interface ShipmentFilters {
  status?: string;
  originHubId?: string;
  destinationHubId?: string;
  customerId?: string;
  search?: string;
  limit?: number;
}

export const shipmentService = {
  async list(filters?: ShipmentFilters): Promise<ShipmentWithRelations[]> {
    const orgId = orgService.getCurrentOrgId();

    let query = supabase
      .from('shipments')
      .select(
        `
        *,
        customer:customers(id, name, phone, email),
        origin_hub:hubs!shipments_origin_hub_id_fkey(id, code, name),
        destination_hub:hubs!shipments_destination_hub_id_fkey(id, code, name),
        invoice:invoices(id, invoice_no, status, total)
      `
      )
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.originHubId) {
      query = query.eq('origin_hub_id', filters.originHubId);
    }
    if (filters?.destinationHubId) {
      query = query.eq('destination_hub_id', filters.destinationHubId);
    }
    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }
    if (filters?.search) {
      query = query.or(
        `cn_number.ilike.%${filters.search}%,consignee_name.ilike.%${filters.search}%,consignor_name.ilike.%${filters.search}%`
      );
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw mapSupabaseError(error);
    return (data ?? []) as unknown as ShipmentWithRelations[];
  },

  async getById(id: string): Promise<ShipmentWithRelations> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await supabase
      .from('shipments')
      .select(
        `
        *,
        customer:customers(id, name, phone, email),
        origin_hub:hubs!shipments_origin_hub_id_fkey(id, code, name),
        destination_hub:hubs!shipments_destination_hub_id_fkey(id, code, name),
        invoice:invoices(id, invoice_no, status, total)
      `
      )
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error) throw mapSupabaseError(error);
    return data as unknown as ShipmentWithRelations;
  },

  async getByAwb(awb: string): Promise<ShipmentWithRelations | null> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await supabase
      .from('shipments')
      .select(
        `
        *,
        customer:customers(id, name, phone, email),
        origin_hub:hubs!shipments_origin_hub_id_fkey(id, code, name),
        destination_hub:hubs!shipments_destination_hub_id_fkey(id, code, name),
        invoice:invoices(id, invoice_no, status, total)
      `
      )
      .eq('cn_number', awb)
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) throw mapSupabaseError(error);
    return data as unknown as ShipmentWithRelations | null;
  },

  async create(shipment: Omit<ShipmentInsert, 'org_id'>): Promise<Shipment> {
    const orgId = orgService.getCurrentOrgId();

    // Generate AWB if not provided
    let awbNumber = shipment.cn_number;
    if (!awbNumber) {
      const { data: awbData, error: awbError } = await (supabase.rpc as any)('generate_cn_number', {
        p_org_id: orgId,
      });
      if (awbError) throw mapSupabaseError(awbError);
      if (typeof awbData !== 'string' || !awbData) {
        throw new Error('AWB service unavailable');
      }
      awbNumber = awbData;
    }

    const { data, error } = await (supabase.from('shipments') as any)
      .insert({
        ...shipment,
        org_id: orgId,
        cn_number: awbNumber,
      })
      .select()
      .single();

    if (error) throw mapSupabaseError(error);

    return data as Shipment;
  },

  async update(id: string, updates: ShipmentUpdate): Promise<Shipment> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await (supabase.from('shipments') as any)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw mapSupabaseError(error);
    return data as Shipment;
  },

  async updateStatus(
    id: string,
    status: Shipment['status'],
    meta?: { description?: string; hubId?: string }
  ): Promise<Shipment> {
    const orgId = orgService.getCurrentOrgId();

    // Fetch current shipment to validate status transition
    const { data: current, error: fetchError } = await supabase
      .from('shipments')
      .select('status, cn_number')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (fetchError) throw mapSupabaseError(fetchError);

    // Validate status transition using business rules
    const currentStatus = current.status as ShipmentStatusType;
    const newStatus = status as ShipmentStatusType;

    if (!isValidStatusTransition(currentStatus, newStatus)) {
      throw new ValidationError(`Invalid status transition from ${currentStatus} to ${newStatus}`, {
        currentStatus,
        newStatus,
        shipmentId: id,
      });
    }

    const { data, error } = await (supabase.from('shipments') as any)
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw mapSupabaseError(error);

    // Create tracking event for audit trail
    await (supabase.from('tracking_events') as any).insert({
      org_id: orgId,
      shipment_id: id,
      cn_number: current.cn_number,
      event_code: status,
      hub_id: meta?.hubId,
      source: 'SYSTEM',
      meta: {
        description: meta?.description,
        previous_status: currentStatus,
      },
    });

    return data as Shipment;
  },

  async delete(id: string): Promise<void> {
    const orgId = orgService.getCurrentOrgId();

    const { error } = await (supabase.from('shipments') as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw mapSupabaseError(error);
  },

  async getStats(): Promise<{
    total: number;
    inTransit: number;
    delivered: number;
    exceptions: number;
  }> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await (supabase.from('shipments') as any)
      .select('status')
      .eq('org_id', orgId)
      .is('deleted_at', null);

    if (error) throw mapSupabaseError(error);

    const shipments = (data || []) as { status: string }[];
    const stats = {
      total: shipments.length,
      inTransit: shipments.filter((s) => s.status === 'IN_TRANSIT').length,
      delivered: shipments.filter((s) => s.status === 'DELIVERED').length,
      exceptions: shipments.filter((s) => s.status === 'EXCEPTION').length,
    };

    return stats;
  },
};
