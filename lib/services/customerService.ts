/**
 * Customer Service
 * All customer CRUD operations
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase client requires any for complex operations */

import { supabase } from '@/lib/supabase';
import { mapSupabaseError } from '@/lib/errors';
import { orgService } from './orgService';
import type { Database } from '@/lib/database.types';

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export interface CustomerFilters {
  type?: string;
  search?: string;
  limit?: number;
}

export const customerService = {
  async list(filters?: CustomerFilters): Promise<Customer[]> {
    const orgId = orgService.getCurrentOrgId();

    let query = supabase
      .from('customers')
      .select('*')
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .order('name');

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,customer_code.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
      );
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw mapSupabaseError(error);
    return (data ?? []) as Customer[];
  },

  async getById(id: string): Promise<Customer> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error) throw mapSupabaseError(error);
    return data as Customer;
  },

  async getByCode(code: string): Promise<Customer | null> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('customer_code', code)
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) throw mapSupabaseError(error);
    return data as Customer | null;
  },

  async create(customer: Omit<CustomerInsert, 'org_id'>): Promise<Customer> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await supabase
      .from('customers')
      .insert({
        ...customer,
        org_id: orgId,
      } as any)
      .select()
      .single();

    if (error) throw mapSupabaseError(error);
    return data as Customer;
  },

  async update(id: string, updates: CustomerUpdate): Promise<Customer> {
    const orgId = orgService.getCurrentOrgId();

    const { data, error } = await (supabase.from('customers') as any)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw mapSupabaseError(error);
    return data as Customer;
  },

  async delete(id: string): Promise<void> {
    const orgId = orgService.getCurrentOrgId();

    const { error } = await (supabase.from('customers') as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw mapSupabaseError(error);
  },

  async search(term: string): Promise<Customer[]> {
    return this.list({ search: term, limit: 20 });
  },
};
