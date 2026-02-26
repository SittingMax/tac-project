import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    // Only listen if user is authenticated
    if (!user) return;

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
        (_payload) => {
          // Verify if the user has permission to see this (client-side check for UX)
          // Admins, Managers, and Ops should likely see booking notifications
          if (['ADMIN', 'MANAGER', 'OPS'].includes(user.role || '')) {
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
          // Contact messages are for Admins
          if (['ADMIN'].includes(user.role || '')) {
            const newMessage = payload.new as Record<string, string>;
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
        (_payload) => {
          if (['ADMIN', 'MANAGER', 'OPS'].includes(user.role || '')) {
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
          console.warn('[Realtime] Failed to subscribe to global notifications');
        }
      });

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  return null; // This component renders nothing, it only handles side effects
};
