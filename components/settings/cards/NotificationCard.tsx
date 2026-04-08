'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { settingsService } from '@/lib/services/settingsService';
import { useAuthStore } from '@/store/authStore';

const NOTIFICATION_ITEMS = [
  {
    id: 'shipment_delays',
    label: 'Delay Alerts',
    description: 'Notified when active shipments are behind schedule',
    defaultOn: true,
  },
  {
    id: 'new_orders',
    label: 'New Bookings',
    description: 'Alerts for newly created bookings and orders',
    defaultOn: true,
  },
  {
    id: 'driver_updates',
    label: 'Driver & Vehicle Updates',
    description: 'Status changes for assigned drivers and vehicles',
    defaultOn: false,
  },
  {
    id: 'billing_alerts',
    label: 'Billing & Invoice',
    description: 'Failed payments or auto-generated invoices',
    defaultOn: true,
  },
  {
    id: 'security_alerts',
    label: 'Security Notices',
    description: 'New device sign-ins or role/permission changes',
    defaultOn: true,
  },
  {
    id: 'system_alerts',
    label: 'System Maintenance',
    description: 'Platform events and scheduled maintenance windows',
    defaultOn: true,
  },
] as const;

type NotifId = (typeof NOTIFICATION_ITEMS)[number]['id'];

interface NotificationSettings {
  types?: NotifId[];
}

export function NotificationCard() {
  const [state, setState] = useState<Record<NotifId, boolean>>(
    Object.fromEntries(NOTIFICATION_ITEMS.map((i) => [i.id, i.defaultOn])) as Record<
      NotifId,
      boolean
    >
  );
  const [isBusy, setIsBusy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const user = useAuthStore((s) => s.user);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const settings = (await settingsService.getUserSettings(user.id)) as NotificationSettings;
      if (settings?.types) {
        const newState = Object.fromEntries(
          NOTIFICATION_ITEMS.map((i) => [i.id, i.defaultOn])
        ) as Record<NotifId, boolean>;
        settings.types.forEach((id) => {
          if (id in newState) {
            newState[id] = true;
          }
        });
        setState(newState);
      }
    } catch {
      // Use defaults on error
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (id: NotifId) => setState((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSave = async () => {
    if (!user?.id) return;
    setIsBusy(true);
    try {
      const enabledTypes = Object.entries(state)
        .filter(([, enabled]) => enabled)
        .map(([id]) => id as NotifId);
      await settingsService.updateUserSettings(user.id, {
        types: enabledTypes,
      });
      toast.success('Notification preferences saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-muted-foreground" />
          <CardTitle className="text-base">Alerts & Notifications</CardTitle>
        </div>
        <CardDescription>Choose which operational events send you notifications</CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} strokeWidth={1.5} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          NOTIFICATION_ITEMS.map((item, idx) => (
            <div key={item.id}>
              {idx > 0 && <Separator />}
              <div className={cn('flex items-center justify-between px-6 py-4')}>
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor={`notif-${item.id}`} className="cursor-pointer">
                    {item.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Switch
                  id={`notif-${item.id}`}
                  checked={state[item.id]}
                  onCheckedChange={() => toggle(item.id)}
                  aria-label={`Toggle ${item.label}`}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>

      <CardFooter className="border-t border-border/40 pt-4 flex justify-end">
        <Button onClick={handleSave} disabled={isBusy}>
          {isBusy ? 'Saving…' : 'Save Preferences'}
        </Button>
      </CardFooter>
    </Card>
  );
}
