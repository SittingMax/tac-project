/**
 * Exception Service
 * Handles exception management for shipments
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase client requires any for complex operations */

import { supabase } from '@/lib/supabase';
import { mapSupabaseError } from '@/lib/errors';
import { orgService } from './orgService';
import type { Database } from '@/lib/database.types';

type Exception = Database['public']['Tables']['exceptions']['Row'];
type ExceptionInsert = Database['public']['Tables']['exceptions']['Insert'];
type ExceptionUpdate = Database['public']['Tables']['exceptions']['Update'];

export interface ExceptionWithRelations extends Exception {
  shipment?: {
    id: string;
    cn_number: string;
    consignee_name: string;
    status: string;
  };
  assigned_to?: {
    id: string;
    full_name: string;
  };
}

export interface ExceptionFilters {
  status?: string;
  type?: string;
  severity?: string;
  shipmentId?: string;
  assignedToId?: string;
  limit?: number;
}

export const exceptionService = {
  async list(filters?: ExceptionFilters): Promise<ExceptionWithRelations[]> {
    const orgId = orgService.getCurrentOrgId();

    let query = supabase
      .from('exceptions')
      .select(
        `
        *,
        shipment:shipments(id, cn_number, consignee_name, status),
        assigned_to:staff(id, full_name)
      `
      )
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters?.shipmentId) {
      query = query.eq('shipment_id', filters.shipmentId);
    }
    if (filters?.assignedToId) {
      query = query.eq('assigned_to_staff_id', filters.assignedToId);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw mapSupabaseError(error);
    return (data ?? []) as ExceptionWithRelations[];
  },

  async getById(id: string): Promise<ExceptionWithRelations> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await supabase
      .from('exceptions')
      .select(
        `
        *,
        shipment:shipments(id, cn_number, consignee_name, status),
        assigned_to:staff(id, full_name)
      `
      )
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error) throw mapSupabaseError(error);
    return data as ExceptionWithRelations;
  },

  async getByShipment(shipmentId: string): Promise<ExceptionWithRelations[]> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await supabase
      .from('exceptions')
      .select(
        `
        *,
        shipment:shipments(id, cn_number, consignee_name, status),
        assigned_to:staff(id, full_name)
      `
      )
      .eq('shipment_id', shipmentId)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw mapSupabaseError(error);
    return (data ?? []) as ExceptionWithRelations[];
  },

  async create(exception: Omit<ExceptionInsert, 'org_id'>): Promise<Exception> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await supabase
      .from('exceptions')
      .insert({
        ...exception,
        org_id: orgId,
      } as any)
      .select()
      .single();

    if (error) throw mapSupabaseError(error);

    // Update shipment status to EXCEPTION
    await (supabase.from('shipments') as any)
      .update({ status: 'EXCEPTION', updated_at: new Date().toISOString() })
      .eq('id', exception.shipment_id);

    return data as Exception;
  },

  async update(id: string, updates: ExceptionUpdate): Promise<Exception> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await (supabase.from('exceptions') as any)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw mapSupabaseError(error);
    return data as Exception;
  },

  async assign(id: string, staffId: string): Promise<Exception> {
    return this.update(id, {
      assigned_to_staff_id: staffId,
      status: 'IN_PROGRESS',
    });
  },

  async resolve(id: string, resolution: string): Promise<Exception> {
    const exception = await this.update(id, {
      status: 'RESOLVED',
      resolution,
      resolved_at: new Date().toISOString(),
    });

    // Update shipment status back to previous state or RECEIVED
    await (supabase.from('shipments') as any)
      .update({ status: 'RECEIVED', updated_at: new Date().toISOString() })
      .eq('id', exception.shipment_id);

    return exception;
  },

  async close(id: string): Promise<Exception> {
    return this.update(id, { status: 'CLOSED' });
  },

  async getStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    bySeverity: { LOW: number; MEDIUM: number; HIGH: number; CRITICAL: number };
  }> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await supabase
      .from('exceptions')
      .select('status, severity')
      .eq('org_id', orgId);

    if (error) throw mapSupabaseError(error);

    const exceptions = data as Array<{ status: string; severity: string }>;
    const stats = {
      total: exceptions.length,
      open: exceptions.filter((e) => e.status === 'OPEN').length,
      inProgress: exceptions.filter((e) => e.status === 'IN_PROGRESS').length,
      resolved: exceptions.filter((e) => e.status === 'RESOLVED').length,
      bySeverity: {
        LOW: exceptions.filter((e) => e.severity === 'LOW').length,
        MEDIUM: exceptions.filter((e) => e.severity === 'MEDIUM').length,
        HIGH: exceptions.filter((e) => e.severity === 'HIGH').length,
        CRITICAL: exceptions.filter((e) => e.severity === 'CRITICAL').length,
      },
    };

    return stats;
  },
};
