import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { hasRoleAccess } from '@/lib/access-control';
import { useNotificationStore } from '@/lib/notifications/store';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

/**
 * GlobalNotificationListener
 *
 * Listens for realtime events from Supabase (New Bookings, New Messages)
 * and displays toast notifications to the user.
 *
 * Should be mounted inside the authenticated layout.
 */
export const GlobalNotificationListener = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    // Only listen if user is authenticated
    if (!user) return;

    const canSeeScopedRecord = (orgId: unknown, allowOrgless = false) => {
      if (user.role === 'SUPER_ADMIN') {
        return true;
      }

      if (typeof orgId !== 'string') {
        return allowOrgless;
      }

      return orgId === user.orgId;
    };

    // Create a single channel for all notifications
    const channel = supabase
      .channel('global-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          const newBooking = payload.new as Record<string, string | null>;
          if (!canSeeScopedRecord(newBooking.org_id)) {
            return;
          }

          if (hasRoleAccess(user.role, ['ADMIN', 'MANAGER', 'OPS_STAFF'])) {
            addNotification({
              user_id: user.id,
              type: 'success',
              category: 'shipment',
              title: 'New Booking Received',
              message: 'A new shipment booking has been created.',
              href: '/shipments',
              metadata: {
                bookingId: newBooking.id,
                orgId: newBooking.org_id,
              },
            });
            toast.success(`New Booking Received!`, {
              description: `A new shipment booking has been created.`,
              action: {
                label: 'View',
                onClick: () => navigate('/shipments'), // Or /bookings if that page exists, currently Shipments seems correct
              },
              duration: 5000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_messages',
        },
        (payload) => {
          if (hasRoleAccess(user.role, ['ADMIN'])) {
            const newMessage = payload.new as Record<string, string | null>;
            if (!canSeeScopedRecord(newMessage.org_id, true)) {
              return;
            }
            addNotification({
              user_id: user.id,
              type: 'info',
              category: 'system',
              title: `New Message from ${newMessage.name ?? 'Contact Form'}`,
              message: newMessage.message
                ? newMessage.message.substring(0, 80)
                : 'New contact message received.',
              href: '/admin/messages',
              metadata: {
                messageId: newMessage.id,
                orgId: newMessage.org_id,
              },
            });
            toast.info(`New Message from ${newMessage.name}`, {
              description: newMessage.message
                ? newMessage.message.substring(0, 50) + '...'
                : 'New contact message received.',
              action: {
                label: 'Read',
                onClick: () => navigate('/admin/messages'),
              },
              duration: 6000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'exceptions',
        },
        (payload) => {
          const newException = payload.new as Record<string, string | null>;
          if (!canSeeScopedRecord(newException.org_id)) {
            return;
          }

          if (hasRoleAccess(user.role, ['ADMIN', 'MANAGER', 'OPS_STAFF', 'WAREHOUSE_STAFF'])) {
            addNotification({
              user_id: user.id,
              type: 'warning',
              category: 'shipment',
              title: 'Exception Detected',
              message: 'A new shipment exception has been logged.',
              href: '/exceptions',
              metadata: {
                exceptionId: newException.id,
                orgId: newException.org_id,
              },
            });
            toast.warning(`Exception Detected!`, {
              description: `A new shipment exception has been logged.`,
              action: {
                label: 'Investigate',
                onClick: () => navigate('/exceptions'),
              },
              duration: 8000,
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          logger.warn('GlobalNotificationListener', 'Failed to subscribe to global notifications');
        }
      });

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [addNotification, user, navigate]);

  return null; // This component renders nothing, it only handles side effects
};
