'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { useCallback, useEffect, useState } from 'react';
import { Building2, Shield, Bell, User, Truck, MapPin, Moon, Sun, Monitor } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { CrudTable } from '@/components/crud/CrudTable';
import { HUBS, SHIPMENT_MODES, SERVICE_LEVELS, PAYMENT_MODES } from '@/lib/constants';

import { SectionHeader, FieldLabel, SelectField } from '@/components/settings/SettingsComponents';
import { AuditLogsTab } from '@/components/settings/AuditLogsTab';
import { settingsService } from '@/lib/services/settingsService';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const DEFAULT_NOTIFICATIONS = {
  shipment_delays: true,
  new_orders: true,
  system_alerts: true,
  driver_updates: false,
};

const hubColumns: ColumnDef<(typeof HUBS)[keyof typeof HUBS]>[] = [
  {
    accessorKey: 'name',
    header: 'Hub Name',
    cell: ({ row }) => (
      <span className="font-bold text-foreground font-mono">{row.original.name}</span>
    ),
  },
  {
    accessorKey: 'code',
    header: 'Code',
    cell: ({ row }) => <Badge variant="outline">{row.original.code}</Badge>,
  },
  {
    accessorKey: 'sortCode',
    header: 'Sort Code',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{row.original.sortCode}</span>
    ),
  },
  {
    accessorKey: 'address',
    header: 'Address',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground max-w-xs">{row.original.address}</span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: () => (
      <Badge
        variant="default"
        className="bg-status-success/10 text-status-success border-status-success/30"
      >
        Active
      </Badge>
    ),
  },
];

export const Settings = () => {
  const { user, session } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'SECURITY' | 'AUDIT'>('GENERAL');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  // Organization Settings
  const [terminalName, setTerminalName] = useState('MAIN HUB - MUMBAI');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('INR');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');

  // Operational Defaults
  const [defaultMode, setDefaultMode] = useState('TRUCK');
  const [defaultServiceLevel, setDefaultServiceLevel] = useState('STANDARD');
  const [defaultPaymentMode, setDefaultPaymentMode] = useState('PAID');
  const [exportFormat, setExportFormat] = useState('CSV');

  // Notification Toggles
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);

  const loadSettings = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [{ name, settings }, userSettings] = await Promise.all([
        settingsService.getOrgSettings(),
        settingsService.getUserSettings(user.id),
      ]);

      const orgSettings = settings as Record<string, unknown>;
      const notificationTypes = Array.isArray(userSettings.notifications?.types)
        ? userSettings.notifications.types
        : null;

      setTerminalName(name || 'MAIN HUB - MUMBAI');
      setTimezone(typeof orgSettings.timezone === 'string' ? orgSettings.timezone : 'Asia/Kolkata');
      setCurrency(typeof orgSettings.currency === 'string' ? orgSettings.currency : 'INR');
      setDateFormat(
        typeof orgSettings.dateFormat === 'string' ? orgSettings.dateFormat : 'DD/MM/YYYY'
      );
      setDefaultMode(
        typeof orgSettings.defaultMode === 'string' ? orgSettings.defaultMode : 'TRUCK'
      );
      setDefaultServiceLevel(
        typeof orgSettings.defaultServiceLevel === 'string'
          ? orgSettings.defaultServiceLevel
          : 'STANDARD'
      );
      setDefaultPaymentMode(
        typeof orgSettings.defaultPaymentMode === 'string' ? orgSettings.defaultPaymentMode : 'PAID'
      );
      setExportFormat(
        typeof orgSettings.exportFormat === 'string' ? orgSettings.exportFormat : 'CSV'
      );
      setTheme(userSettings.theme ?? 'system');
      setNotifications(
        notificationTypes
          ? {
              shipment_delays: notificationTypes.includes('shipment_delays'),
              new_orders: notificationTypes.includes('new_orders'),
              system_alerts: notificationTypes.includes('system_alerts'),
              driver_updates: notificationTypes.includes('driver_updates'),
            }
          : DEFAULT_NOTIFICATIONS
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleSaveGeneral = useCallback(async () => {
    setIsLoading(true);
    try {
      await settingsService.updateOrgSettings(terminalName, {
        timezone,
        currency,
        dateFormat,
        defaultMode,
        defaultServiceLevel,
        defaultPaymentMode,
        exportFormat,
      });
      toast.success('Configuration saved successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setIsLoading(false);
    }
  }, [
    currency,
    dateFormat,
    defaultMode,
    defaultPaymentMode,
    defaultServiceLevel,
    exportFormat,
    terminalName,
    timezone,
  ]);

  const handleSaveSecurity = useCallback(async () => {
    if (!user?.id) {
      toast.error('User profile unavailable');
      return;
    }

    setIsLoading(true);
    try {
      await settingsService.updateUserSettings(user.id, {
        theme,
        notifications: {
          types: Object.entries(notifications)
            .filter(([, enabled]) => enabled)
            .map(([key]) => key),
        },
      });
      toast.success('Preferences saved successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  }, [notifications, theme, user?.id]);

  const toggleNotification = (id: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24">
      <div className="flex justify-between items-end pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage organization settings, security, and audit logs
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'GENERAL' | 'SECURITY' | 'AUDIT')}
      >
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-border pb-4">
          <div className="flex gap-0 rounded-lg border border-border overflow-hidden">
            {[
              { id: 'GENERAL', label: 'General' },
              { id: 'SECURITY', label: 'Security' },
              { id: 'AUDIT', label: 'Audit Logs' },
            ].map((tab) => (
              <button
                key={tab.id}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'px-6 py-2 text-sm font-medium transition-all duration-200 border-l first:border-l-0 border-border',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ============= GENERAL TAB ============= */}
        <TabsContent value="GENERAL" className="mt-6">
          <Accordion
            type="multiple"
            defaultValue={['item-1', 'item-2', 'item-3']}
            className="w-full space-y-4"
          >
            <AccordionItem
              value="item-1"
              className="border-none bg-card rounded-lg border border-border"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors rounded-t-lg">
                <SectionHeader icon={Building2} title="Organization Profile" className="mb-0" />
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2">
                <div className="space-y-6">
                  <div>
                    <FieldLabel>Terminal Name</FieldLabel>
                    <Input
                      value={terminalName}
                      onChange={(e) => setTerminalName(e.target.value)}
                      disabled={isLoading}
                      className="h-11 bg-transparent hover:border-ring/50 transition-colors border-input"
                    />
                  </div>
                  <div>
                    <FieldLabel>Timezone</FieldLabel>
                    <SelectField
                      value={timezone}
                      onChange={setTimezone}
                      options={[
                        { value: 'UTC', label: 'UTC' },
                        { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
                        { value: 'America/New_York', label: 'America/New_York (EST)' },
                        { value: 'Europe/London', label: 'Europe/London (GMT)' },
                        { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
                        { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
                      ]}
                    />
                  </div>
                  <div className="space-y-6">
                    <div>
                      <FieldLabel>Currency</FieldLabel>
                      <SelectField
                        value={currency}
                        onChange={setCurrency}
                        options={[
                          { value: 'INR', label: '₹ INR' },
                          { value: 'USD', label: '$ USD' },
                          { value: 'EUR', label: '€ EUR' },
                          { value: 'GBP', label: '£ GBP' },
                        ]}
                      />
                    </div>
                    <div>
                      <FieldLabel>Date Format</FieldLabel>
                      <SelectField
                        value={dateFormat}
                        onChange={setDateFormat}
                        options={[
                          { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                          { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                          { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-2"
              className="border-none bg-card rounded-lg border border-border"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors rounded-t-lg">
                <SectionHeader icon={Truck} title="Operational Defaults" className="mb-0" />
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2">
                <div className="space-y-6">
                  <div>
                    <FieldLabel>Default Shipment Mode</FieldLabel>
                    <SelectField
                      value={defaultMode}
                      onChange={setDefaultMode}
                      options={SHIPMENT_MODES.map((m) => ({ value: m.id, label: m.label }))}
                    />
                  </div>
                  <div>
                    <FieldLabel>Default Service Level</FieldLabel>
                    <SelectField
                      value={defaultServiceLevel}
                      onChange={setDefaultServiceLevel}
                      options={SERVICE_LEVELS.map((s) => ({ value: s.id, label: s.label }))}
                    />
                  </div>
                  <div>
                    <FieldLabel>Default Payment Mode</FieldLabel>
                    <RadioGroup
                      value={defaultPaymentMode}
                      onValueChange={setDefaultPaymentMode}
                      className="flex space-x-4 mt-2"
                    >
                      {PAYMENT_MODES.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center space-x-2 bg-muted/30 border border-border px-4 py-2 rounded-md"
                        >
                          <RadioGroupItem value={p.id} id={`payment-${p.id}`} />
                          <Label
                            htmlFor={`payment-${p.id}`}
                            className="cursor-pointer font-normal text-sm"
                          >
                            {p.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div>
                    <FieldLabel>Export Format</FieldLabel>
                    <SelectField
                      value={exportFormat}
                      onChange={setExportFormat}
                      options={[
                        { value: 'CSV', label: 'CSV (Spreadsheet)' },
                        { value: 'PDF', label: 'PDF (Document)' },
                        { value: 'XLSX', label: 'Excel (XLSX)' },
                      ]}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-3"
              className="border-none bg-card rounded-lg border border-border"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors rounded-t-lg">
                <SectionHeader
                  icon={MapPin}
                  title="Hub Network"
                  color="text-primary"
                  className="mb-0"
                />
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2">
                <CrudTable
                  columns={hubColumns}
                  data={Object.values(HUBS)}
                  pageSize={100}
                  enableColumnVisibility={false}
                />
                <p className="text-xs text-muted-foreground mt-4">
                  Hub configuration is managed at the infrastructure level. Contact support to add
                  or modify hubs.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Save Button — Full width */}
            <div className="md:col-span-2 p-8 bg-background flex justify-end">
              <Button onClick={handleSaveGeneral} disabled={isLoading} size="lg">
                {isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ============= SECURITY & NOTIFICATIONS TAB ============= */}
        <TabsContent value="SECURITY" className="mt-6">
          <Accordion
            type="multiple"
            defaultValue={['item-1', 'item-2', 'item-3', 'item-4']}
            className="w-full space-y-4"
          >
            <AccordionItem
              value="item-1"
              className="border-none bg-card rounded-lg border border-border"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors rounded-t-lg">
                <SectionHeader icon={User} title="User Profile" className="mb-0" />
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2">
                <div className="space-y-6">
                  <div className="flex items-center gap-6 p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-2xl">
                      {user?.fullName
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || '??'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-semibold text-foreground truncate">
                        {user?.fullName || 'Unknown'}
                      </div>
                      <div className="text-sm text-muted-foreground truncate mt-0.5">
                        {user?.email || '—'}
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 border-primary/30 text-primary">
                      {user?.role || '—'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Primary Hub</div>
                      <div className="text-sm font-medium text-foreground">
                        {user?.hubCode || 'All Hubs'}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Account Status</div>
                      <div className="text-sm font-medium">
                        {user?.isActive ? (
                          <span className="text-status-success">Active</span>
                        ) : (
                          <span className="text-status-error">Inactive</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-2"
              className="border-none bg-card rounded-lg border border-border"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors rounded-t-lg">
                <SectionHeader icon={Moon} title="Appearance" className="mb-0" />
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2">
                <div className="space-y-6">
                  <div>
                    <FieldLabel>Theme Mode</FieldLabel>
                    <div className="grid grid-cols-3 rounded-lg border border-border overflow-hidden">
                      {[
                        { id: 'light' as const, icon: Sun, label: 'Light' },
                        { id: 'dark' as const, icon: Moon, label: 'Dark' },
                        { id: 'system' as const, icon: Monitor, label: 'System' },
                      ].map(({ id, icon: ThemeIcon, label }) => (
                        <button
                          key={id}
                          onClick={() => setTheme(id)}
                          className={`flex flex-col items-center justify-center p-4 transition-all duration-200 ${theme === id ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted border-l first:border-l-0 border-border'}`}
                        >
                          <ThemeIcon className="w-4 h-4 mb-2" />
                          <span className="text-xs font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-6 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-4">Session Details</div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center rounded-md bg-muted/30 p-3 px-4">
                        <span className="text-xs text-muted-foreground">Last Sign-In</span>
                        <span className="text-xs text-foreground font-medium">
                          {session?.user?.last_sign_in_at
                            ? new Date(session.user.last_sign_in_at).toLocaleTimeString()
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center rounded-md bg-muted/30 p-3 px-4">
                        <span className="text-xs text-muted-foreground">User ID</span>
                        <span className="font-mono text-xs text-foreground font-medium truncate max-w-[160px]">
                          {session?.user?.id?.slice(0, 12) || '—'}…
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-3"
              className="border-none bg-card rounded-lg border border-border"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors rounded-t-lg">
                <SectionHeader icon={Bell} title="Notifications" className="mb-0" />
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2">
                <div className="rounded-lg border border-border overflow-hidden">
                  {[
                    {
                      id: 'shipment_delays',
                      label: 'Delay Alerts',
                    },
                    {
                      id: 'new_orders',
                      label: 'New Bookings & Orders',
                    },
                    {
                      id: 'system_alerts',
                      label: 'System Alerts',
                    },
                    {
                      id: 'driver_updates',
                      label: 'Driver & Vehicle Updates',
                    },
                  ].map((item, idx) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between px-4 py-3 ${idx > 0 ? 'border-t border-border' : ''}`}
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                      <Switch
                        checked={notifications[item.id as keyof typeof notifications]}
                        onCheckedChange={() =>
                          toggleNotification(item.id as keyof typeof notifications)
                        }
                        aria-label={`Toggle ${item.label}`}
                      />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-4"
              className="border-none bg-card rounded-lg border border-border"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors rounded-t-lg">
                <SectionHeader icon={Shield} title="Security" className="mb-0" />
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 rounded-lg border border-border bg-muted/30">
                    <div className="min-w-0 pr-4">
                      <div className="text-sm font-medium text-foreground">MFA Infrastructure</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Identity Provider Managed
                      </div>
                    </div>
                    <Badge variant="outline">Managed</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg border border-border bg-muted/30">
                    <div className="min-w-0 pr-4">
                      <div className="text-sm font-medium text-foreground">API Access Gateway</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Privileged access only
                      </div>
                    </div>
                    <Badge variant="outline">Restricted</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg border border-border bg-muted/30">
                    <div className="min-w-0 pr-4">
                      <div className="text-sm font-medium text-foreground">Policy Enforcement</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        8+ Chars / Leak Protection
                      </div>
                    </div>
                    <Badge
                      variant="default"
                      className="bg-status-success/10 text-status-success border-status-success/30"
                    >
                      Active
                    </Badge>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="md:col-span-2 p-8 bg-background flex justify-end">
              <Button onClick={handleSaveSecurity} disabled={isLoading || !user?.id} size="lg">
                {isLoading ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ============= AUDIT LOGS TAB ============= */}
        <TabsContent value="AUDIT" className="mt-6">
          <AuditLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
