export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type NotificationCategory =
  | 'invoice'
  | 'shipment'
  | 'warehouse'
  | 'payment'
  | 'auth'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string | null;
  href: string | null;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPayload {
  user_id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message?: string;
  href?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationFilters {
  is_read?: boolean;
  category?: NotificationCategory;
  type?: NotificationType;
  limit?: number;
}
