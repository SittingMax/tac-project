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
  success: 'DELIVERED',
  error: 'EXCEPTION',
  warning: 'IN_TRANSIT',
  info: 'CREATED',
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
            <CheckCheck size={12} strokeWidth={1.5} className="mr-2" />
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
            <Trash2 size={12} strokeWidth={1.5} className="mr-2" />
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
            <Filter size={16} strokeWidth={1.5} className="text-muted-foreground opacity-50" />
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
        <div className="rounded-lg">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4">
                {activeTab === 'unread' ? (
                  <Check size={32} strokeWidth={1.5} className="text-muted-foreground" />
                ) : (
                  <Bell size={32} strokeWidth={1.5} className="text-muted-foreground" />
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
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    {group.label}
                  </h3>
                  <div className="flex flex-col gap-2">
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
                            'w-full text-left rounded-lg p-4 border transition hover:shadow-md',
                            notification.is_read
                              ? 'bg-transparent border-border opacity-70'
                              : 'bg-accent/20 border-accent/30'
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
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
                              <div className="flex items-start justify-between gap-4">
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
                                          'h-2 w-2 rounded-full',
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

                                  <div className="flex items-center gap-4 mt-2">
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
                                    className="p-1 rounded-md hover:bg-muted transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} strokeWidth={1.5} className="text-muted-foreground hover:text-destructive" />
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
      </SectionCard>
    </PageContainer>
  );
};

export default Notifications;
