import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { orgService } from '@/lib/services/orgService';
import { AuthError } from '@supabase/supabase-js';

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
});
