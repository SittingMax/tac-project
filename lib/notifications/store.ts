import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification, NotificationPayload, NotificationFilters } from './types';

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;

  // Computed
  unreadCount: () => number;

  // CRUD Operations
  getNotifications: (filters?: NotificationFilters) => Notification[];
  addNotification: (payload: NotificationPayload) => Notification;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;

  // State management
  setNotifications: (notifications: Notification[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const generateId = () => `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      isLoading: false,
      error: null,

      unreadCount: () => get().notifications.filter((n) => !n.is_read).length,

      getNotifications: (filters?: NotificationFilters) => {
        let result = [...get().notifications];

        if (filters?.is_read !== undefined) {
          result = result.filter((n) => n.is_read === filters.is_read);
        }
        if (filters?.category) {
          result = result.filter((n) => n.category === filters.category);
        }
        if (filters?.type) {
          result = result.filter((n) => n.type === filters.type);
        }

        // Sort by created_at descending
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        if (filters?.limit) {
          result = result.slice(0, filters.limit);
        }

        return result;
      },

      addNotification: (payload: NotificationPayload) => {
        const newNotification: Notification = {
          id: generateId(),
          user_id: payload.user_id,
          type: payload.type,
          category: payload.category,
          title: payload.title,
          message: payload.message ?? null,
          href: payload.href ?? null,
          metadata: payload.metadata ?? {},
          is_read: false,
          created_at: new Date().toISOString(),
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 100), // Keep max 100
        }));

        return newNotification;
      },

      markAsRead: (id: string) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, is_read: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        }));
      },

      deleteNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
      },

      setNotifications: (notifications: Notification[]) => {
        set({ notifications });
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
    }),
    {
      name: 'tac-notifications-storage',
      version: 1,
    }
  )
);

export default useNotificationStore;
