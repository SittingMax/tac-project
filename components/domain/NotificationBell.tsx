'use client';

import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  FileText,
  Package,
  CreditCard,
  Shield,
  Settings,
  Info,
} from 'lucide-react';
import { useNotificationStore } from '@/lib/notifications/store';
import type { Notification, NotificationCategory } from '@/lib/notifications/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

const CATEGORY_ICONS: Record<NotificationCategory, React.ElementType> = {
  invoice: FileText,
  shipment: Package,
  warehouse: Package,
  payment: CreditCard,
  auth: Shield,
  system: Settings,
};

const TYPE_COLORS: Record<string, string> = {
  success: 'bg-status-success',
  error: 'bg-status-error',
  warning: 'bg-status-warning',
  info: 'bg-status-info',
};

interface NotificationRowProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onNavigate: (href: string | null) => void;
}

const NotificationRow: React.FC<NotificationRowProps> = ({
  notification,
  onMarkRead,
  onNavigate,
}) => {
  const Icon = CATEGORY_ICONS[notification.category] || Info;
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  const handleClick = () => {
    onMarkRead(notification.id);
    if (notification.href) {
      onNavigate(notification.href);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left rounded-none p-3 mb-2 border transition-all hover:bg-accent/50',
        notification.is_read ? 'opacity-60 border-transparent' : 'bg-accent/20 border-accent/30'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-8 h-8 rounded-none flex items-center justify-center flex-shrink-0',
            notification.is_read ? 'bg-muted' : 'bg-primary/10'
          )}
        >
          <Icon
            className={cn(
              'w-4 h-4',
              notification.is_read ? 'text-muted-foreground' : 'text-primary'
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('font-medium text-sm', !notification.is_read && 'text-foreground')}>
              {notification.title}
            </span>
            {!notification.is_read && (
              <span className={cn('h-2 w-2 rounded-none', TYPE_COLORS[notification.type])} />
            )}
          </div>

          {notification.message && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {notification.message}
            </p>
          )}

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {notification.category}
            </Badge>
          </div>
        </div>
      </div>
    </button>
  );
};

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotificationStore();
  const count = unreadCount();

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.is_read).slice(0, 20),
    [notifications]
  );

  const allNotifications = useMemo(() => notifications.slice(0, 30), [notifications]);

  const handleMarkRead = useCallback(
    (id: string) => {
      markAsRead(id);
    },
    [markAsRead]
  );

  const handleNavigate = useCallback(
    (href: string | null) => {
      if (href) {
        navigate(href);
      }
    },
    [navigate]
  );

  const handleMarkAllRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleViewAll = useCallback(() => {
    navigate('/notifications');
  }, [navigate]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative rounded-none p-2 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
              <Badge
                className={cn('h-5 min-w-[20px] px-1.5 text-xs font-bold', count > 9 && 'px-1')}
              >
                {count > 99 ? '99+' : count}
              </Badge>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-[380px] p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Notifications</span>
            {count > 0 && (
              <Badge variant="secondary" className="text-xs">
                {count} new
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={count === 0}
            className="h-8 text-xs"
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
            Mark all read
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="unread" className="w-full">
          <div className="px-3 py-2 border-b">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="unread" className="text-xs">
                Unread ({unreadNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs">
                All
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="unread" className="m-0">
            <ScrollArea className="h-[350px]">
              <div className="p-3">
                {unreadNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 rounded-none bg-muted flex items-center justify-center mb-3">
                      <Check className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
                    <p className="text-xs text-muted-foreground mt-1">No new notifications</p>
                  </div>
                ) : (
                  unreadNotifications.map((n) => (
                    <NotificationRow
                      key={n.id}
                      notification={n}
                      onMarkRead={handleMarkRead}
                      onNavigate={handleNavigate}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="all" className="m-0">
            <ScrollArea className="h-[350px]">
              <div className="p-3">
                {allNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 rounded-none bg-muted flex items-center justify-center mb-3">
                      <Bell className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      No notifications yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You&apos;ll see updates here
                    </p>
                  </div>
                ) : (
                  allNotifications.map((n) => (
                    <NotificationRow
                      key={n.id}
                      notification={n}
                      onMarkRead={handleMarkRead}
                      onNavigate={handleNavigate}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <Separator />
        <div className="p-2">
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={handleViewAll}>
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
