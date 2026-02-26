import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NavItem, User } from '../types';

export { useNoteStore } from './noteStore';

interface AppState {
  user: User | null;
  currentNav: NavItem;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  isAuthenticated: boolean;
  theme: 'dark' | 'light' | 'system';
  login: (user: User) => void;
  logout: () => void;
  setNav: (nav: NavItem) => void;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      currentNav: NavItem.DASHBOARD,
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      isAuthenticated: false, // Set to true to bypass login for dev if needed
      theme: 'dark',
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setNav: (nav) => set({ currentNav: nav }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'tac-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
