/**
 * Organization Service
 * Handles org-level operations and context
 */

import { supabase } from '@/lib/supabase';
import { mapSupabaseError } from '@/lib/errors';
import type { Database } from '@/lib/database.types';

type Org = Database['public']['Tables']['orgs']['Row'];
type Hub = Database['public']['Tables']['hubs']['Row'];

// Cache for org context
let currentOrgId: string | null = null;

export const orgService = {
  setCurrentOrg(orgId: string) {
    currentOrgId = orgId;
  },

  clearCurrentOrg() {
    currentOrgId = null;
  },

  getCurrentOrgId(): string {
    if (!currentOrgId) {
      throw new Error('Organization context not set. Call setCurrentOrg first.');
    }
    return currentOrgId;
  },

  /**
   * Safe version that returns null instead of throwing
   */
  tryGetCurrentOrgId(): string | null {
    return currentOrgId;
  },

  async getOrgs(): Promise<Org[]> {
    const { data, error } = await supabase.from('orgs').select('*').order('name');

    if (error) throw mapSupabaseError(error);
    return data ?? [];
  },

  async getOrg(id: string): Promise<Org> {
    const { data, error } = await supabase.from('orgs').select('*').eq('id', id).single();

    if (error) throw mapSupabaseError(error);
    return data;
  },

  async getHubs(): Promise<Hub[]> {
    const { data, error } = await supabase
      .from('hubs')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw mapSupabaseError(error);
    return data ?? [];
  },

  async getHub(id: string): Promise<Hub> {
    const { data, error } = await supabase.from('hubs').select('*').eq('id', id).single();

    if (error) throw mapSupabaseError(error);
    return data;
  },

  async getHubByCode(code: 'IMPHAL' | 'NEW_DELHI'): Promise<Hub> {
    const { data, error } = await supabase.from('hubs').select('*').eq('code', code).single();

    if (error) throw mapSupabaseError(error);
    return data;
  },
};
