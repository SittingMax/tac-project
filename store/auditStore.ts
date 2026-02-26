import { create } from 'zustand';
import { AuditLog } from '../types';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

// Properly typed Supabase rows
type AuditLogRow = Database['public']['Tables']['audit_logs']['Row'];
type StaffRow = Database['public']['Tables']['staff']['Row'];

interface AuditLogWithStaff extends AuditLogRow {
  staff: Pick<StaffRow, 'full_name' | 'email'> | null;
}

interface AuditState {
  logs: AuditLog[];
  isLoading: boolean;
  fetchLogs: () => Promise<void>;
}

export const useAuditStore = create<AuditState>((set) => ({
  logs: [],
  isLoading: false,

  fetchLogs: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(
          `
                    *,
                    staff:staff(full_name, email)
                `
        )
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Failed to fetch audit logs:', error);
        set({ isLoading: false });
        return;
      }

      // Map to legacy AuditLog format for compatibility
      const mappedLogs: AuditLog[] = ((data as AuditLogWithStaff[] | null) || []).map((log) => ({
        id: log.id,
        actorId: log.actor_staff_id ?? '',
        action: log.action,
        entityType: log.entity_type as AuditLog['entityType'],
        entityId: log.entity_id ?? '',
        timestamp: log.created_at ?? new Date().toISOString(),
        payload: log.after
          ? typeof log.after === 'object'
            ? (log.after as Record<string, unknown>)
            : undefined
          : undefined,
      }));

      set({ logs: mappedLogs, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      set({ isLoading: false });
    }
  },
}));
