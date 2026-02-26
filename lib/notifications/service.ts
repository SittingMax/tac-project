import { toast } from 'sonner';
import { useNotificationStore } from './store';
import type { NotificationPayload, NotificationCategory, NotificationType } from './types';

// Helper to get toast function by type
const getToastFn = (type: NotificationType) =>
  ({ success: toast.success, error: toast.error, warning: toast.warning, info: toast.info })[
    type
  ] || toast;

/**
 * Smart toast rules - determines if a notification should show a toast
 */
function shouldShowToast(category: NotificationCategory, type: NotificationType): boolean {
  // Never toast for system info notifications
  if (category === 'system' && type === 'info') return false;

  // Always toast for errors and warnings
  if (type === 'error' || type === 'warning') return true;

  // Toast for success on user actions
  if (type === 'success') return true;

  // Don't toast for general info
  if (type === 'info') return false;

  return true;
}

/**
 * Create a notification and optionally show a toast
 */
export function notify(payload: NotificationPayload): void {
  const { addNotification } = useNotificationStore.getState();
  addNotification(payload);

  // Smart toast rule
  if (shouldShowToast(payload.category, payload.type)) {
    const toastFn = getToastFn(payload.type);

    toastFn(payload.title, {
      description: payload.message ?? undefined,
      action: payload.href
        ? {
            label: 'View',
            onClick: () => {
              window.location.hash = payload.href!;
            },
          }
        : undefined,
    });
  }
}

/**
 * Show a toast without persisting to notifications
 */
export function showToast(
  type: NotificationType,
  title: string,
  options?: {
    description?: string;
    action?: { label: string; onClick: () => void };
    duration?: number;
  }
): void {
  const toastFn = getToastFn(type);

  toastFn(title, {
    description: options?.description,
    action: options?.action,
    duration: options?.duration,
  });
}

/**
 * Promise-based toast for async operations (login, form submit, etc.)
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
): Promise<T> {
  toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  });
  return promise;
}

/**
 * Notification helpers for common events
 */
// Helper to get current user ID from auth context
const getCurrentUserId = (): string => {
  // In a real app, this would read from auth context/store
  // For now, return a placeholder that should be overridden by callers
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'getCurrentUserId: Using fallback "system" user ID. Pass userId parameter to notification helpers.'
    );
  }
  return 'system';
};

export const notifications = {
  // Invoice notifications
  invoiceCreated: (invoiceNumber: string, href?: string, userId?: string) => {
    notify({
      user_id: userId ?? getCurrentUserId(),
      type: 'success',
      category: 'invoice',
      title: 'Invoice Created',
      message: `Invoice ${invoiceNumber} has been created successfully.`,
      href: href ?? `/finance`,
      metadata: { invoiceNumber },
    });
  },

  invoicePaid: (invoiceNumber: string, userId?: string) => {
    notify({
      user_id: userId ?? getCurrentUserId(),
      type: 'success',
      category: 'payment',
      title: 'Payment Received',
      message: `Payment for invoice ${invoiceNumber} has been confirmed.`,
      metadata: { invoiceNumber },
    });
  },

  // Shipment notifications
  shipmentCreated: (awb: string, href?: string, userId?: string) => {
    notify({
      user_id: userId ?? getCurrentUserId(),
      type: 'success',
      category: 'shipment',
      title: 'Shipment Created',
      message: `Shipment ${awb} has been created.`,
      href: href ?? `/shipments`,
      metadata: { awb },
    });
  },

  shipmentStatusUpdate: (awb: string, status: string, userId?: string) => {
    notify({
      user_id: userId ?? getCurrentUserId(),
      type: 'info',
      category: 'shipment',
      title: 'Shipment Update',
      message: `Shipment ${awb} is now ${status.replace(/_/g, ' ').toLowerCase()}.`,
      href: `/tracking?awb=${awb}`,
      metadata: { awb, status },
    });
  },

  shipmentDelivered: (awb: string, userId?: string) => {
    notify({
      user_id: userId ?? getCurrentUserId(),
      type: 'success',
      category: 'shipment',
      title: 'Shipment Delivered',
      message: `Shipment ${awb} has been delivered successfully.`,
      metadata: { awb },
    });
  },

  // Auth notifications
  loginSuccess: (userName?: string) => {
    showToast('success', 'Welcome back!', {
      description: userName ? `Logged in as ${userName}` : undefined,
    });
  },

  loginError: (message: string) => {
    showToast('error', 'Login Failed', {
      description: message,
    });
  },

  logoutSuccess: () => {
    showToast('info', 'Logged out successfully');
  },

  // System notifications
  networkError: () => {
    showToast('error', 'Network Error', {
      description: 'Please check your connection and try again.',
    });
  },

  saveSuccess: (itemName?: string) => {
    showToast('success', itemName ? `${itemName} saved` : 'Saved successfully');
  },

  deleteSuccess: (itemName?: string) => {
    showToast('success', itemName ? `${itemName} deleted` : 'Deleted successfully');
  },

  permissionDenied: () => {
    showToast('error', 'Permission Denied', {
      description: 'You do not have permission to perform this action.',
    });
  },
};

export default notifications;
