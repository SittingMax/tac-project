import { AuthError } from '@supabase/supabase-js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clearSensitiveStorage, getPersistedAuthState, useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { orgService } from '@/lib/services/orgService';
import { UserRole } from '@/types/domain';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          maybeSingle: vi.fn(),
        })),
        single: vi.fn(),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}));

vi.mock('@/lib/services/orgService', () => ({
  orgService: {
    setCurrentOrg: vi.fn(),
    clearCurrentOrg: vi.fn(),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('sets loading state during sign in', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockImplementation(() => new Promise(() => {}));
    useAuthStore.getState().signIn('test@example.com', 'password');
    expect(useAuthStore.getState().isLoading).toBe(true);
    // await the promise to avoid open handles, though we mocked it to hang, so maybe ignore
  });

  it('handles sign in error', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: null, user: null },
      error: new AuthError('Invalid credentials'),
    });

    const result = await useAuthStore.getState().signIn('test@example.com', 'password');

    expect(result.success).toBe(false);
    expect(useAuthStore.getState().error).toBe('Invalid credentials');
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('clears session on sign out', async () => {
    // Set initial state
    useAuthStore.setState({
      // @ts-expect-error -- partial session mock for testing sign out behavior
      session: { user: { id: '123' } },
      isAuthenticated: true,
    });

    await useAuthStore.getState().signOut();

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(orgService.clearCurrentOrg).toHaveBeenCalled();
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('persists only minimal auth state', () => {
    useAuthStore.setState({
      user: {
        id: 'staff-1',
        authUserId: 'auth-1',
        email: 'agent@example.com',
        fullName: 'Agent Name',
        avatarUrl: 'https://example.com/avatar.png',
        role: UserRole.ADMIN,
        hubId: 'hub-1',
        hubCode: 'IMF',
        orgId: 'org-1',
        isActive: true,
      },
      isAuthenticated: true,
    });

    const persisted = getPersistedAuthState(useAuthStore.getState());

    expect(persisted).toEqual({ isAuthenticated: true });
    expect(persisted).not.toHaveProperty('user');
    expect(JSON.stringify(persisted)).not.toContain('agent@example.com');
    expect(JSON.stringify(persisted)).not.toContain('Agent Name');
  });

  it('clears sensitive auth-related storage keys only', () => {
    const storageData = new Map<string, string>([
      ['tac-auth', 'auth'],
      ['shipment_cache', 'shipment'],
      ['invoice_draft_1', 'draft'],
      ['safe_key', 'keep'],
    ]);

    const storage = {
      get length() {
        return storageData.size;
      },
      clear: () => storageData.clear(),
      getItem: (key: string) => storageData.get(key) ?? null,
      key: (index: number) => Array.from(storageData.keys())[index] ?? null,
      removeItem: (key: string) => {
        storageData.delete(key);
      },
      setItem: (key: string, value: string) => {
        storageData.set(key, value);
      },
    } as Storage;

    clearSensitiveStorage(storage);

    expect(storage.getItem('tac-auth')).toBeNull();
    expect(storage.getItem('shipment_cache')).toBeNull();
    expect(storage.getItem('invoice_draft_1')).toBeNull();
    expect(storage.getItem('safe_key')).toBe('keep');
  });
});
