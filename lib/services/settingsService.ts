import { supabase } from '@/lib/supabase';
import { mapSupabaseError } from '@/lib/errors';
import { orgService } from '@/lib/services/orgService';
import type { Json } from '@/lib/database.types';

type OrgSettings = {
  timezone?: string;
  dateFormat?: string;
  currency?: string;
  theme?: 'light' | 'dark' | 'system';
  [key: string]: unknown;
};

type UserSettings = {
  notifications?: {
    email?: boolean;
    push?: boolean;
    types?: string[];
  };
  theme?: 'light' | 'dark' | 'system';
  [key: string]: unknown;
};

export const settingsService = {
  /**
   * Get Organization Settings
   */
  async getOrgSettings() {
    const orgId = orgService.getCurrentOrgId();
    const { data, error } = await supabase
      .from('orgs')
      .select('name, settings')
      .eq('id', orgId)
      .single();

    if (error) throw mapSupabaseError(error);

    return {
      name: data.name,
      settings: (data.settings as OrgSettings) || {},
    };
  },

  /**
   * Update Organization Settings
   */
  async updateOrgSettings(name: string, settings: OrgSettings) {
    const orgId = orgService.getCurrentOrgId();

    // Create log entry for audit trail handled by triggers/middleware

    const { error } = await supabase
      .from('orgs')
      .update({
        name,
        settings: settings as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId);

    if (error) throw mapSupabaseError(error);
  },

  /**
   * Get User Settings
   */
  async getUserSettings(userId: string) {
    const { data, error } = await supabase
      .from('staff')
      .select('settings')
      .eq('id', userId)
      .single();

    if (error) throw mapSupabaseError(error);

    return (data.settings as UserSettings) || {};
  },

  /**
   * Update User Settings
   */
  async updateUserSettings(userId: string, settings: UserSettings) {
    const { error } = await supabase
      .from('staff')
      .update({
        settings: settings as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw mapSupabaseError(error);
  },
};
