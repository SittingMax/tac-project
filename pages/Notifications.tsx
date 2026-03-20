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
import { AppIcon } from '@/components/ui-core';
import { Button } from '@/components/ui/button';
import { PageContainer, PageHeader, SectionCard } from '@/components/ui-core/layout';
import { StatCard } from '@/components/ui-core';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotificationStore } from '@/lib/notifications/store';
import { useAuthStore } from '@/store/authStore';
import type {
  Notification,
  NotificationCategory,
  NotificationType,
} from '@/lib/notifications/types';
import { cn } from '@/lib/utils';

import type { LucideIcon } from 'lucide-react';

const CATEGORY_ICONS: Record<NotificationCategory, LucideIcon> = {
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
  error: 'badge--cancelled',
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
  const user = useAuthStore((state) => state.user);
  const { notifications, markAsRead, markAllAsRead, deleteNotification, clearAll, unreadCount } =
    useNotificationStore();

  const [activeTab, setActiveTab] = useState<'unread' | 'all'>('unread');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const userNotifications = useMemo(
    () => notifications.filter((n) => n.user_id === user?.id),
    [notifications, user?.id]
  );
  const count = unreadCount(user?.id);
  const unreadTabCount = userNotifications.filter((n) => !n.is_read).length;

  const filteredNotifications = useMemo(() => {
    let result = [...userNotifications];

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
  }, [userNotifications, activeTab, categoryFilter, typeFilter]);

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
    <PageContainer>
      <PageHeader title="Notifications" description="Alerts captured for your account">
        <div className="flex items-center gap-3">
          <Badge variant="outline">{count} unread</Badge>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              if (user?.id) {
                markAllAsRead(user.id);
              }
            }}
            disabled={count === 0}
          >
            <AppIcon icon={CheckCheck} size={16} className="mr-2" />
            Mark All Read
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (user?.id) {
                clearAll(user.id);
              }
            }}
            disabled={userNotifications.length === 0}
          >
            <AppIcon icon={Trash2} size={16} className="mr-2" />
            Clear All
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Unread" value={count} icon={CheckCheck} />
        <StatCard
          title="Visible"
          value={filteredNotifications.length}
          icon={Filter}
          iconColor="muted"
        />
        <StatCard
          title="Total Alerts"
          value={userNotifications.length}
          icon={Bell}
          iconColor="primary"
        />
      </div>

      <SectionCard
        title="Activity Feed"
        description="Filter and review alerts captured for your account."
        contentClassName="flex flex-col gap-6"
      >
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-border pb-4">
          {/* Tabs */}
          <div className="flex gap-0 rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setActiveTab('unread')}
              className={cn(
                'px-5 py-2 text-sm font-medium transition-colors',
                activeTab === 'unread'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              )}
            >
              Unread ({unreadTabCount})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-5 py-2 text-sm font-medium transition-colors border-l border-border',
                activeTab === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              )}
            >
              All ({userNotifications.length})
            </button>
          </div>

          {/* Dropdowns */}
          <div className="flex gap-2 items-center">
            <AppIcon icon={Filter} size={16} className="text-muted-foreground opacity-50" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="shipment">Shipment</SelectItem>
                <SelectItem value="warehouse">Warehouse</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="auth">Auth</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notification List */}
        <div className="rounded-lg border border-border/40 overflow-hidden bg-card">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4">
                {activeTab === 'unread' ? (
                  <AppIcon icon={Check} size={32} className="text-muted-foreground" />
                ) : (
                  <AppIcon icon={Bell} size={32} className="text-muted-foreground" />
                )}
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                {activeTab === 'unread' ? 'All caught up!' : 'No notifications yet'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'unread'
                  ? 'You have no unread notifications.'
                  : 'Captured alerts will appear here as new events arrive.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {groupedNotifications.map((group) => (
                <div key={group.label}>
                  <div className="bg-muted/20 px-4 py-2 border-b border-border/40">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </h3>
                  </div>
                  <div className="flex flex-col">
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
                            'group w-full text-left py-4 px-4 border-b border-border/40 last:border-b-0 transition-colors hover:bg-muted/30 flex items-start gap-4',
                            notification.is_read ? 'opacity-70' : 'bg-primary/5'
                          )}
                        >
                          <div
                            className={cn(
                              'w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5',
                              notification.is_read ? 'bg-muted' : 'bg-primary/10'
                            )}
                          >
                            <AppIcon
                              icon={Icon}
                              size={16}
                              className={cn(
                                notification.is_read ? 'text-muted-foreground' : 'text-primary'
                              )}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      'text-sm font-medium group-hover:text-primary transition-colors',
                                      !notification.is_read && 'text-foreground'
                                    )}
                                  >
                                    {notification.title}
                                  </span>
                                  {!notification.is_read && (
                                    <span
                                      className={cn(
                                        'h-1.5 w-1.5 rounded-full',
                                        TYPE_COLORS[notification.type]
                                      )}
                                    />
                                  )}
                                </div>

                                {notification.message && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1 pr-8">
                                    {notification.message}
                                  </p>
                                )}

                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-[10px] font-mono text-muted-foreground">{timeAgo}</span>
                                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 uppercase tracking-wider">
                                    {notification.category}
                                  </Badge>
                                  <Badge
                                    className={cn(
                                      'text-[9px] h-4 px-1.5 uppercase tracking-wider',
                                      TYPE_BADGE_STYLES[notification.type]
                                    )}
                                  >
                                    {notification.type}
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => handleDelete(notification.id, e)}
                                  className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                                  title="Delete"
                                >
                                  <AppIcon icon={Trash2} size={16} />
                                </button>
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
      </SectionCard>
    </PageContainer>
  );
};

export default Notifications;
