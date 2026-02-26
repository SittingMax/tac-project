import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
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
  Filter,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useNotificationStore } from '../lib/notifications/store';
import type {
  Notification,
  NotificationCategory,
  NotificationType,
} from '../lib/notifications/types';
import { cn } from '../lib/utils';

const CATEGORY_ICONS: Record<NotificationCategory, React.ElementType> = {
  invoice: FileText,
  shipment: Package,
  warehouse: Package,
  payment: CreditCard,
  auth: Shield,
  system: Settings,
};

// Type colors using semantic status tokens
const TYPE_COLORS: Record<NotificationType, string> = {
  success: 'bg-status-success',
  error: 'bg-status-error',
  warning: 'bg-status-warning',
  info: 'bg-status-info',
};

// Type badge styles using semantic badge classes
const TYPE_BADGE_STYLES: Record<NotificationType, string> = {
  success: 'badge--delivered',
  error: 'badge--exception',
  warning: 'badge--in-transit',
  info: 'badge--created',
};

function groupNotificationsByDate(notifications: Notification[]) {
  const groups: { label: string; items: Notification[] }[] = [];
  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const earlier: Notification[] = [];

  notifications.forEach((n) => {
    const date = new Date(n.created_at);
    if (isToday(date)) {
      today.push(n);
    } else if (isYesterday(date)) {
      yesterday.push(n);
    } else {
      earlier.push(n);
    }
  });

  if (today.length > 0) groups.push({ label: 'Today', items: today });
  if (yesterday.length > 0) groups.push({ label: 'Yesterday', items: yesterday });
  if (earlier.length > 0) groups.push({ label: 'Earlier', items: earlier });

  return groups;
}

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, deleteNotification, clearAll, unreadCount } =
    useNotificationStore();

  const [activeTab, setActiveTab] = useState<'unread' | 'all'>('unread');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const count = unreadCount();

  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    if (activeTab === 'unread') {
      result = result.filter((n) => !n.is_read);
    }

    if (categoryFilter !== 'all') {
      result = result.filter((n) => n.category === categoryFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter((n) => n.type === typeFilter);
    }

    return result.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [notifications, activeTab, categoryFilter, typeFilter]);

  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(filteredNotifications),
    [filteredNotifications]
  );

  const handleDelete = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      deleteNotification(id);
    },
    [deleteNotification]
  );

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      markAsRead(notification.id);
      if (notification.href) {
        navigate(notification.href);
      }
    },
    [markAsRead, navigate]
  );

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-border/40 pb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground flex items-center gap-2.5">
            System Alerts<span className="text-primary">.</span>
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-2">
            Invoices, Shipments, and Event Streams
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono border border-border px-2 py-0.5">
            {count} UNREAD
          </span>
          <Button
            variant="default"
            size="sm"
            className="rounded-none font-mono uppercase text-[10px] tracking-widest"
            onClick={() => markAllAsRead()}
            disabled={count === 0}
          >
            <CheckCheck className="w-3 h-3 mr-2" />
            Ack All
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-none font-mono uppercase text-[10px] tracking-widest"
            onClick={() => clearAll()}
            disabled={notifications.length === 0}
          >
            <Trash2 className="w-3 h-3 mr-2" />
            Purge
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-border/20 pb-4">
        {/* Tabs */}
        <div className="flex gap-0 border border-border">
          <button
            onClick={() => setActiveTab('unread')}
            className={cn(
              'px-6 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors',
              activeTab === 'unread'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted/10'
            )}
          >
            UNREAD ({notifications.filter((n) => !n.is_read).length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-6 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors border-l border-border',
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted/10'
            )}
          >
            ALL ({notifications.length})
          </button>
        </div>

        {/* Dropdowns */}
        <div className="flex gap-2 items-center">
          <Filter className="w-4 h-4 text-muted-foreground opacity-50" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded-none px-3 py-2 text-sm bg-background"
          >
            <option value="all">All Categories</option>
            <option value="invoice">Invoice</option>
            <option value="shipment">Shipment</option>
            <option value="warehouse">Warehouse</option>
            <option value="payment">Payment</option>
            <option value="auth">Auth</option>
            <option value="system">System</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border rounded-none px-3 py-2 text-sm bg-background"
          >
            <option value="all">All Types</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Notification List */}
      <div className="bg-background border border-border p-6 shadow-none rounded-none">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-none bg-muted flex items-center justify-center mb-4">
              {activeTab === 'unread' ? (
                <Check className="w-8 h-8 text-muted-foreground" />
              ) : (
                <Bell className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">
              {activeTab === 'unread' ? 'All caught up!' : 'No notifications yet'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'unread'
                ? 'You have no unread notifications.'
                : 'Notifications will appear here when you receive them.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedNotifications.map((group) => (
              <div key={group.label}>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  {group.label}
                </h3>
                <div className="space-y-2">
                  {group.items.map((notification) => {
                    const Icon = CATEGORY_ICONS[notification.category] || Info;
                    const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                    });

                    return (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          'w-full text-left rounded-none p-4 border transition-all hover:shadow-md',
                          notification.is_read
                            ? 'bg-transparent border-border opacity-70'
                            : 'bg-accent/20 border-accent/30'
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-none flex items-center justify-center flex-shrink-0',
                              notification.is_read ? 'bg-muted' : 'bg-primary/10'
                            )}
                          >
                            <Icon
                              className={cn(
                                'w-5 h-5',
                                notification.is_read ? 'text-muted-foreground' : 'text-primary'
                              )}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      'font-medium',
                                      !notification.is_read && 'text-foreground'
                                    )}
                                  >
                                    {notification.title}
                                  </span>
                                  {!notification.is_read && (
                                    <span
                                      className={cn(
                                        'h-2 w-2 rounded-none',
                                        TYPE_COLORS[notification.type]
                                      )}
                                    />
                                  )}
                                </div>

                                {notification.message && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                )}

                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-xs text-muted-foreground">{timeAgo}</span>
                                  <Badge variant="outline" className="text-[10px]">
                                    {notification.category}
                                  </Badge>
                                  <Badge
                                    className={cn(
                                      'text-[10px]',
                                      TYPE_BADGE_STYLES[notification.type]
                                    )}
                                  >
                                    {notification.type}
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {notification.href && (
                                  <span className="text-xs text-primary underline">View →</span>
                                )}
                                <button
                                  onClick={(e) => handleDelete(notification.id, e)}
                                  className="p-1 rounded-none hover:bg-muted transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
