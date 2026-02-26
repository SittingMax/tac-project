/**
 * Audit Service
 * Handles audit log operations
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase client requires any for complex operations */

import { supabase } from '@/lib/supabase';
import { mapSupabaseError } from '@/lib/errors';
import { orgService } from './orgService';
import type { Database } from '@/lib/database.types';

type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

export interface AuditLogWithRelations extends AuditLog {
  actor?: {
    id: string;
    full_name: string;
    role: string;
  };
}

export interface AuditLogFilters {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export const auditService = {
  async list(filters?: AuditLogFilters): Promise<AuditLogWithRelations[]> {
    const orgId = orgService.getCurrentOrgId();

    let query = supabase
      .from('audit_logs')
      .select(
        `
        *,
        actor:staff(id, full_name, role)
      `
      )
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (filters?.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }
    if (filters?.entityId) {
      query = query.eq('entity_id', filters.entityId);
    }
    if (filters?.actorId) {
      query = query.eq('actor_staff_id', filters.actorId);
    }
    if (filters?.action) {
      query = query.eq('action', filters.action);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw mapSupabaseError(error);
    return (data ?? []) as unknown as AuditLogWithRelations[];
  },

  async getByEntity(entityType: string, entityId: string): Promise<AuditLogWithRelations[]> {
    return this.list({ entityType, entityId, limit: 100 });
  },

  async create(log: Omit<AuditLogInsert, 'org_id'>): Promise<AuditLog> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        ...log,
        org_id: orgId,
      } as any)
      .select()
      .single();

    if (error) throw mapSupabaseError(error);
    return data as AuditLog;
  },

  async logAction(
    action: string,
    entityType: string,
    entityId: string,
    staffId?: string,
    before?: any,
    after?: any
  ): Promise<AuditLog> {
    return this.create({
      action,
      entity_type: entityType,
      entity_id: entityId,
      actor_staff_id: staffId,
      before: before ?? null,
      after: after ?? null,
    });
  },

  // Helper methods for common actions
  async logCreate(
    entityType: string,
    entityId: string,
    staffId: string,
    data: any
  ): Promise<AuditLog> {
    return this.logAction('CREATE', entityType, entityId, staffId, null, data);
  },

  async logUpdate(
    entityType: string,
    entityId: string,
    staffId: string,
    before: any,
    after: any
  ): Promise<AuditLog> {
    return this.logAction('UPDATE', entityType, entityId, staffId, before, after);
  },

  async logDelete(
    entityType: string,
    entityId: string,
    staffId: string,
    data: any
  ): Promise<AuditLog> {
    return this.logAction('DELETE', entityType, entityId, staffId, data, null);
  },

  async logStatusChange(
    entityType: string,
    entityId: string,
    staffId: string,
    oldStatus: string,
    newStatus: string
  ): Promise<AuditLog> {
    return this.logAction(
      'STATUS_CHANGE',
      entityType,
      entityId,
      staffId,
      { status: oldStatus },
      { status: newStatus }
    );
  },
};
