/**
 * Staff Service
 * Handles staff/user operations
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase client requires any for complex operations */

import { supabase } from '@/lib/supabase';
import { mapSupabaseError } from '@/lib/errors';
import { orgService } from './orgService';
import type { Database } from '@/lib/database.types';

type Staff = Database['public']['Tables']['staff']['Row'];
type StaffInsert = Database['public']['Tables']['staff']['Insert'];
type StaffUpdate = Database['public']['Tables']['staff']['Update'];

export interface StaffWithRelations extends Staff {
  hub?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface StaffFilters {
  role?: string;
  hubId?: string;
  isActive?: boolean;
  search?: string;
  limit?: number;
}

// Cache for current staff
let currentStaff: Staff | null = null;

export const staffService = {
  setCurrentStaff(staff: Staff) {
    currentStaff = staff;
  },

  getCurrentStaff(): Staff | null {
    return currentStaff;
  },

  getCurrentStaffId(): string | null {
    return currentStaff?.id ?? null;
  },

  async list(filters?: StaffFilters): Promise<StaffWithRelations[]> {
    const orgId = orgService.getCurrentOrgId();

    let query = supabase
      .from('staff')
      .select(
        `
        *,
        hub:hubs(id, code, name)
      `
      )
      .eq('org_id', orgId)
      .order('full_name');

    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    if (filters?.hubId) {
      query = query.eq('hub_id', filters.hubId);
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters?.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw mapSupabaseError(error);
    return (data ?? []) as unknown as StaffWithRelations[];
  },

  async getById(id: string): Promise<StaffWithRelations> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await supabase
      .from('staff')
      .select(
        `
        *,
        hub:hubs(id, code, name)
      `
      )
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error) throw mapSupabaseError(error);
    return data as unknown as StaffWithRelations;
  },

  async getByAuthUserId(authUserId: string): Promise<StaffWithRelations | null> {
    const { data, error } = await supabase
      .from('staff')
      .select(
        `
        *,
        hub:hubs(id, code, name)
      `
      )
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error) throw mapSupabaseError(error);
    return data as unknown as StaffWithRelations | null;
  },

  async getByEmail(email: string): Promise<StaffWithRelations | null> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await supabase
      .from('staff')
      .select(
        `
        *,
        hub:hubs(id, code, name)
      `
      )
      .eq('email', email)
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) throw mapSupabaseError(error);
    return data as unknown as StaffWithRelations | null;
  },

  async create(staff: Omit<StaffInsert, 'org_id'>): Promise<Staff> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await supabase
      .from('staff')
      .insert({
        ...staff,
        org_id: orgId,
      } as any)
      .select()
      .single();

    if (error) throw mapSupabaseError(error);
    return data as Staff;
  },

  async update(id: string, updates: StaffUpdate): Promise<Staff> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await (supabase.from('staff') as any)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw mapSupabaseError(error);
    return data as Staff;
  },

  async activate(id: string): Promise<Staff> {
    return this.update(id, { is_active: true });
  },

  async deactivate(id: string): Promise<Staff> {
    return this.update(id, { is_active: false });
  },

  async updateRole(id: string, role: Staff['role']): Promise<Staff> {
    return this.update(id, { role });
  },
};
