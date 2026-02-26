/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase client requires any for complex operations */
import { create } from 'zustand';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface ManagementState {
  users: User[];
  isLoading: boolean;

  fetchUsers: () => Promise<void>;
  addUser: (user: Partial<User>) => Promise<void>;
  toggleUserStatus: (id: string, currentStatus: boolean) => Promise<void>;
}

interface StaffRecord {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  updated_at: string | null;
  hub?: { code: string; name: string } | null;
}

export const useManagementStore = create<ManagementState>((set) => ({
  users: [],
  isLoading: false,

  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('staff')
        .select(
          `
                    *,
                    hub:hubs(code, name)
                `
        )
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Failed to fetch staff:', error);
        set({ isLoading: false });
        return;
      }

      // Map to legacy User format for compatibility
      const staffData = (data ?? []) as unknown as StaffRecord[];
      const mappedUsers: User[] = staffData.map((staff) => ({
        id: staff.id,
        name: staff.full_name,
        email: staff.email,
        role: staff.role as UserRole,
        active: staff.is_active,
        lastLogin: staff.updated_at ?? 'Never',
        assignedHub: staff.hub?.code as User['assignedHub'],
      }));

      set({ users: mappedUsers, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      set({ isLoading: false });
    }
  },

  addUser: async (userData) => {
    set({ isLoading: true });
    try {
      const { data: orgData } = await (supabase.from('orgs').select('id').single() as any);
      if (!orgData) throw new Error('No organization found');

      // Map hub code to hub_id
      let hubId: string | null = null;
      if (userData.assignedHub) {
        const { data: hubData } = await (supabase
          .from('hubs')
          .select('id')
          .eq('code', userData.assignedHub)
          .single() as any);
        hubId = hubData?.id ?? null;
      }

      const insertPayload = {
        org_id: orgData.id,
        email: userData.email ?? '',
        full_name: userData.name ?? '',
        role: userData.role ?? 'OPS',
        hub_id: hubId,
        is_active: true,
      };

      const { data, error } = await (supabase.from('staff') as any)
        .insert(insertPayload)
        .select(`*, hub:hubs(code, name)`)
        .single();

      if (error) throw error;

      const staffData = data as unknown as StaffRecord;
      const newUser: User = {
        id: staffData.id,
        name: staffData.full_name,
        email: staffData.email,
        role: staffData.role as UserRole,
        active: staffData.is_active,
        lastLogin: 'Never',
        assignedHub: staffData.hub?.code as User['assignedHub'],
      };

      set((state) => ({
        users: [newUser, ...state.users],
        isLoading: false,
      }));

      toast.success(`User ${newUser.name} added successfully`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to add user:', error);
      toast.error(`Failed to add user: ${errorMessage}`);
      set({ isLoading: false });
    }
  },

  toggleUserStatus: async (id, currentStatus) => {
    // Optimistic update
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, active: !currentStatus } : u)),
    }));

    try {
      const { error } = await (supabase.from('staff') as any)
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Revert on failure
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, active: currentStatus } : u)),
      }));
      toast.error(`Failed to update status: ${errorMessage}`);
    }
  },
}));
