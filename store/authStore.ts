/**
 * Auth Store with Supabase Authentication
 * Role-based authentication for Admin and Employee users
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { orgService } from '@/lib/services/orgService';
import type { Session } from '@supabase/supabase-js';
import type { UserRole } from '@/types';

// Singleton state to prevent concurrent initialization (React StrictMode fix)
let initializationPromise: Promise<() => void> | null = null;
let currentAbortController: AbortController | null = null;

// Staff table types are defined in lib/database.types.ts
// Using the properly typed supabase client

export interface StaffUser {
  id: string;
  authUserId: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: UserRole;
  hubId: string | null;
  hubCode: string | null;
  orgId: string;
  isActive: boolean;
}

interface AuthState {
  // State
  session: Session | null;
  user: StaffUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<() => void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<StaffUser>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      updateProfile: async (profile) => {
        const currentUser = get().user;
        if (!currentUser) return;

        try {
          // Optimistic update
          set({ user: { ...currentUser, ...profile } });

          const updates: Record<string, string | null> = {};
          if (profile.fullName) updates.full_name = profile.fullName;
          if (profile.avatarUrl !== undefined) updates.avatar_url = profile.avatarUrl;

          if (Object.keys(updates).length > 0) {
            const { error } = await supabase.from('staff').update(updates).eq('id', currentUser.id);

            if (error) throw error;
          }
        } catch (error) {
          console.error('[Auth] Update profile error:', error);
          // Revert on error
          set({ user: currentUser });
          throw error;
        }
      },

      initialize: async () => {
        // Return existing promise if initialization is already in progress (React StrictMode fix)
        if (initializationPromise) {
          return initializationPromise;
        }

        // Abort any previous initialization that might be stale
        if (currentAbortController) {
          currentAbortController.abort();
        }
        currentAbortController = new AbortController();
        const signal = currentAbortController.signal;

        initializationPromise = (async () => {
          try {
            set({ isLoading: true, error: null });

            // Safety timeout to prevent infinite loading
            const timeoutId = setTimeout(() => {
              if (get().isLoading && !signal.aborted) {
                console.error('[Auth] Initialization timed out');
                set({
                  isLoading: false,
                  isAuthenticated: false,
                  error: 'Connection timed out. Please check your internet connection.',
                });
              }
            }, 15000); // 15 seconds timeout

            // Check if aborted before making request
            if (signal.aborted) {
              clearTimeout(timeoutId);
              return () => {};
            }

            // Get current session
            const {
              data: { session },
              error: sessionError,
            } = await supabase.auth.getSession();

            // Check if aborted after request
            if (signal.aborted) {
              clearTimeout(timeoutId);
              return () => {};
            }

            if (sessionError) {
              // Don't log AbortError as it's expected during navigation/remounts
              if (
                sessionError.message?.includes('AbortError') ||
                sessionError.message?.includes('aborted')
              ) {
                clearTimeout(timeoutId);
                return () => {};
              }
              console.error('[Auth] Session error:', sessionError);
              clearTimeout(timeoutId);
              set({ isLoading: false, isAuthenticated: false, session: null, user: null });
              return () => {};
            }

            if (!session) {
              clearTimeout(timeoutId);
              set({ isLoading: false, isAuthenticated: false, session: null, user: null });
              return () => {};
            }

            // Check if aborted before staff fetch
            if (signal.aborted) {
              clearTimeout(timeoutId);
              return () => {};
            }

            // Fetch staff record linked to this auth user
            const staffUser = await fetchStaffByAuthId(session.user.id, signal);

            // Check if aborted after staff fetch
            if (signal.aborted) {
              clearTimeout(timeoutId);
              return () => {};
            }

            if (!staffUser) {
              console.warn('[Auth] No staff record found for user:', session.user.email);
              clearTimeout(timeoutId);
              set({ isLoading: false, isAuthenticated: false, session: null, user: null });
              return () => {};
            }

            if (!staffUser.isActive) {
              console.warn('[Auth] Staff account is deactivated:', staffUser.email);
              await supabase.auth.signOut();
              clearTimeout(timeoutId);
              set({
                isLoading: false,
                isAuthenticated: false,
                session: null,
                user: null,
                error: 'Your account has been deactivated. Please contact an administrator.',
              });
              return () => {};
            }

            // Set organization context for services
            orgService.setCurrentOrg(staffUser.orgId);

            clearTimeout(timeoutId);
            set({
              session,
              user: staffUser,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // Set up auth state change listener
            const {
              data: { subscription },
            } = supabase.auth.onAuthStateChange(async (event, newSession) => {
              try {
                if (event === 'SIGNED_OUT' || !newSession) {
                  console.warn('[AuthStore] onAuthStateChange: SIGNED_OUT or no session', {
                    event,
                  });
                  orgService.clearCurrentOrg();
                  set({ session: null, user: null, isAuthenticated: false });
                  return;
                }

                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                  const staff = await fetchStaffByAuthId(newSession.user.id);
                  if (staff && staff.isActive) {
                    orgService.setCurrentOrg(staff.orgId);
                    set({
                      session: newSession,
                      user: staff,
                      isAuthenticated: true,
                    });
                  }
                }
              } catch (error) {
                // Handle AbortError gracefully - expected during navigation
                if (
                  error instanceof Error &&
                  (error.name === 'AbortError' || error.message?.includes('aborted'))
                ) {
                  return;
                }
                console.error('[Auth] Error in auth state change handler:', error);
              }
            });

            // Return cleanup function
            return () => {
              subscription.unsubscribe();
            };
          } catch (error) {
            // Silently ignore AbortError - expected during navigation or StrictMode remounts
            if (
              error instanceof Error &&
              (error.name === 'AbortError' || error.message?.includes('aborted'))
            ) {
              return () => {};
            }
            console.error('[Auth] Initialize error:', error);
            set({
              isLoading: false,
              isAuthenticated: false,
              error: 'Failed to initialize authentication',
            });
            return () => {};
          } finally {
            // Clear the singleton promise when done (success or error)
            initializationPromise = null;
          }
        })();

        return initializationPromise;
      },

      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          // Authenticate with Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (authError) {
            console.error('[Auth] Sign in error:', authError);
            set({
              isLoading: false,
              error:
                authError.message === 'Invalid login credentials'
                  ? 'Invalid email or password'
                  : authError.message,
            });
            return { success: false, error: authError.message };
          }

          if (!authData.session || !authData.user) {
            set({ isLoading: false, error: 'Authentication failed' });
            return { success: false, error: 'Authentication failed' };
          }

          // Fetch staff record
          const staffUser = await fetchStaffByAuthId(authData.user.id);

          if (!staffUser) {
            // No staff record - sign out and show error
            await supabase.auth.signOut();
            set({
              isLoading: false,
              error: 'No staff account linked to this email. Please contact an administrator.',
            });
            return { success: false, error: 'No staff account found' };
          }

          if (!staffUser.isActive) {
            await supabase.auth.signOut();
            set({
              isLoading: false,
              error: 'Your account has been deactivated. Please contact an administrator.',
            });
            return { success: false, error: 'Account deactivated' };
          }

          // Update last login time
          await supabase
            .from('staff')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', staffUser.id);

          // Set organization context for services
          orgService.setCurrentOrg(staffUser.orgId);

          set({
            session: authData.session,
            user: staffUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error) {
          console.error('[Auth] Sign in error:', error);
          const message = error instanceof Error ? error.message : 'Sign in failed';
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      signOut: async () => {
        try {
          set({ isLoading: true });

          // Clear sensitive localStorage data (Issue #23 - GDPR compliance)
          const sensitiveKeyPrefixes = ['invoice_draft', 'shipment_', 'print_', 'label_', 'tac-'];
          Object.keys(localStorage).forEach((key) => {
            if (sensitiveKeyPrefixes.some((prefix) => key.startsWith(prefix))) {
              localStorage.removeItem(key);
            }
          });

          await supabase.auth.signOut();
          console.warn('[AuthStore] Signed out by user action');
          orgService.clearCurrentOrg();
          set({
            session: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('[Auth] Sign out error:', error);
          orgService.clearCurrentOrg();
          // Force clear state even on error - also clear localStorage
          Object.keys(localStorage).forEach((key) => {
            if (
              key.startsWith('invoice_draft') ||
              key.startsWith('shipment_') ||
              key.startsWith('print_') ||
              key.startsWith('label_') ||
              key.startsWith('tac-')
            ) {
              localStorage.removeItem(key);
            }
          });
          set({
            session: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'tac-auth',
      partialize: (state) => ({
        // Only persist minimal auth state - session will be restored from Supabase
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);

/**
 * Fetch staff record by Supabase Auth user ID
 * @param authUserId - The auth user ID to look up
 * @param signal - Optional AbortSignal for cancellation
 */
async function fetchStaffByAuthId(
  authUserId: string,
  signal?: AbortSignal
): Promise<StaffUser | null> {
  try {
    // Check if already aborted before making request
    if (signal?.aborted) {
      return null;
    }

    // Build query with optional abort signal
    const baseQuery = supabase
      .from('staff')
      .select(
        `
                id,
                auth_user_id,
                email,
                full_name,
                avatar_url,
                role,
                hub_id,
                org_id,
                is_active,
                hub:hubs(code)
            `
      )
      .eq('auth_user_id', authUserId);

    // Add abort signal before .single() if provided
    const query = signal ? baseQuery.abortSignal(signal).single() : baseQuery.single();

    const { data, error } = await query;

    // Check if aborted after request
    if (signal?.aborted) {
      return null;
    }

    if (error || !data) {
      // Don't log AbortError as it's expected during navigation/remounts
      if (error && (error.message?.includes('AbortError') || error.message?.includes('aborted'))) {
        return null;
      }
      console.error('[Auth] Failed to fetch staff:', error);
      return null;
    }

    return {
      id: data.id,
      authUserId: data.auth_user_id ?? '',
      email: data.email,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      role: data.role as UserRole,
      hubId: data.hub_id,
      hubCode: data.hub?.code || null,
      orgId: data.org_id,
      isActive: data.is_active ?? true,
    };
  } catch (error) {
    // Silently ignore AbortError
    if (
      error instanceof Error &&
      (error.name === 'AbortError' || error.message?.includes('aborted'))
    ) {
      return null;
    }
    console.error('[Auth] fetchStaffByAuthId error:', error);
    return null;
  }
}

/**
 * Hook to check if current user has specific role(s)
 */
export function useHasRole(roles: UserRole | UserRole[]): boolean {
  const user = useAuthStore((state) => state.user);
  if (!user) return false;

  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role);
}

/**
 * Hook to check if current user can access a module
 */
export function useCanAccessModule(module: string): boolean {
  const user = useAuthStore((state) => state.user);
  if (!user) return false;

  const moduleAccess: Record<UserRole, string[]> = {
    ADMIN: ['*'],
    SUPER_ADMIN: ['*'],
    MANAGER: ['*'],
    OPS: ['shipments', 'manifests', 'tracking', 'customers', 'exceptions'],
    OPS_STAFF: ['shipments', 'manifests', 'tracking', 'customers', 'exceptions'],
    WAREHOUSE_IMPHAL: ['scanning', 'inventory', 'shipments', 'exceptions'],
    WAREHOUSE_DELHI: ['scanning', 'inventory', 'shipments', 'exceptions'],
    WAREHOUSE_STAFF: ['scanning', 'inventory', 'shipments', 'exceptions'],
    INVOICE: ['finance', 'customers', 'shipments'],
    FINANCE_STAFF: ['finance', 'customers', 'shipments'],
    SUPPORT: ['shipments', 'tracking', 'customers'],
  };

  const allowedModules = moduleAccess[user.role] || [];
  return allowedModules.includes('*') || allowedModules.includes(module);
}
