/**
 * NotificationCenter Component
 * Real-time notifications with Supabase Realtime
 * Features: Categories, mark as read, preferences, push integration
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Bell,
  Package,
  Truck,
  AlertTriangle,
  Settings,
  CheckCheck,
  Filter,
  X,
  Loader2,
  BellRing,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

// Types
export interface Notification {
  id: string;
  type: 'shipment' | 'manifest' | 'exception' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
}

export interface NotificationCenterProps {
  userId?: string;
  maxVisible?: number;
  showPreferences?: boolean;
  className?: string;
}

// Notification type config
const NOTIFICATION_CONFIG = {
  shipment: { icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
  manifest: { icon: Truck, color: 'text-status-info', bg: 'bg-status-info/10' },
  exception: { icon: AlertTriangle, color: 'text-status-warning', bg: 'bg-status-warning/10' },
  system: { icon: Bell, color: 'text-muted-foreground', bg: 'bg-muted' },
};

export function NotificationCenter({
  userId,
  maxVisible = 10,
  showPreferences = true,
  className,
}: NotificationCenterProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async (): Promise<Notification[]> => {
      // For demo, return mock notifications
      // In production, would fetch from notifications table
      return [
        {
          id: '1',
          type: 'shipment',
          title: 'Shipment Delivered',
          message: 'TAC2026000001 has been delivered successfully',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          data: { cnNumber: 'TAC2026000001' },
        },
        {
          id: '2',
          type: 'manifest',
          title: 'Manifest Departed',
          message: 'MFT20260001 has departed from IMF hub',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: '3',
          type: 'exception',
          title: 'Delivery Exception',
          message: 'Shipment TAC2026000042 requires attention',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: '4',
          type: 'system',
          title: 'System Maintenance',
          message: 'Scheduled maintenance tonight at 2 AM IST',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
      ];
    },
    refetchInterval: 30000,
  });

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          queryClient.setQueryData<Notification[]>(['notifications', userId], (old) => [
            newNotification,
            ...(old || []),
          ]);

          // Show toast for new notification
          toast.info(newNotification.title, {
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      // In production, would update database
      // await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
      return notificationId;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Notification[]>(['notifications', userId], (old) =>
        old?.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // In production, would update database
      // await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
    },
    onSuccess: () => {
      queryClient.setQueryData<Notification[]>(['notifications', userId], (old) =>
        old?.map((n) => ({ ...n, read: true }))
      );
      toast.success('All notifications marked as read');
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      // In production, would delete from database
      // await supabase.from('notifications').delete().eq('id', notificationId);
      return notificationId;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Notification[]>(['notifications', userId], (old) =>
        old?.filter((n) => n.id !== id)
      );
    },
  });

  // Filtered notifications
  const filteredNotifications = notifications?.filter((n) =>
    filter === 'unread' ? !n.read : true
  );

  // Unread count
  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  // Handle mark as read
  const handleMarkAsRead = useCallback(
    (id: string) => {
      markAsReadMutation.mutate(id);
    },
    [markAsReadMutation]
  );

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  // Handle delete
  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn('relative', className)}>
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 size-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <Card className="border-0 shadow-lg">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BellRing className="size-4" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {unreadCount} new
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
                className="h-7 px-2 text-xs"
              >
                <Filter className="size-3 mr-1" />
                {filter === 'all' ? 'Unread' : 'All'}
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="h-7 px-2 text-xs"
                >
                  <CheckCheck className="size-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>

          <Separator />

          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredNotifications && filteredNotifications.length > 0 ? (
              <div className="divide-y divide-border">
                {filteredNotifications.slice(0, maxVisible).map((notification) => {
                  const config = NOTIFICATION_CONFIG[notification.type];
                  const Icon = config.icon;

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-3 hover:bg-muted/50 transition-colors cursor-pointer',
                        !notification.read && 'bg-primary/5'
                      )}
                      onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <div
                          className={cn(
                            'size-8 rounded-full flex items-center justify-center shrink-0',
                            config.bg
                          )}
                        >
                          <Icon className={cn('size-4', config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                'text-sm font-medium',
                                !notification.read && 'text-foreground'
                              )}
                            >
                              {notification.title}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notification.id);
                              }}
                              className="shrink-0 opacity-0 group-hover:opacity-100"
                            >
                              <X className="size-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="size-2 rounded-full bg-primary shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                <Bell className="size-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No notifications</p>
                {filter === 'unread' && (
                  <p className="text-xs text-muted-foreground/70 mt-1">All caught up!</p>
                )}
              </div>
            )}
          </ScrollArea>

          {showPreferences && (
            <>
              <Separator />
              <div className="p-2">
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                  <Settings className="size-4" />
                  Notification Preferences
                </Button>
              </div>
            </>
          )}
        </Card>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationCenter;
