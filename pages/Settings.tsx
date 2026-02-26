'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  Building2,
  Shield,
  Bell,
  User,
  Truck,
  MapPin,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { HUBS, SHIPMENT_MODES, SERVICE_LEVELS, PAYMENT_MODES } from '@/lib/constants';

import {
  SectionHeader,
  FieldLabel,
  SelectField,
  ToggleSwitch,
} from '@/components/settings/SettingsComponents';
import { AuditLogsTab } from '@/components/settings/AuditLogsTab';
import { cn } from '@/lib/utils';

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
  const [defaultMode, setDefaultMode] = useState('TRUCK_LINEHAUL');
  const [defaultServiceLevel, setDefaultServiceLevel] = useState('STANDARD');
  const [defaultPaymentMode, setDefaultPaymentMode] = useState('PREPAID');
  const [exportFormat, setExportFormat] = useState('CSV');

  // Notification Toggles
  const [notifications, setNotifications] = useState({
    shipment_delays: true,
    new_orders: true,
    system_alerts: true,
    driver_updates: false,
  });



  const handleSaveGeneral = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Configuration saved successfully');
    }, 1000);
  };

  const toggleNotification = (id: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };



  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-24">
      <div className="flex justify-between items-end border-b border-border/40 pb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground flex items-center gap-2.5">
            System Config<span className="text-primary">.</span>
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-2">
            Manage organization settings, security, and audit logs
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'GENERAL' | 'SECURITY' | 'AUDIT')}
      >
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-border/20 pb-4">
          <div className="flex gap-0 border border-border/40">
            {[
              { id: 'GENERAL', label: 'GENERAL_CONFIG' },
              { id: 'SECURITY', label: 'SECURITY_AUTH' },
              { id: 'AUDIT', label: 'AUDIT_STREAM' },
            ].map((tab) => (
              <button
                key={tab.id}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'px-8 py-3 text-[10px] font-mono uppercase tracking-widest transition-all duration-300 border-l first:border-l-0 border-border/40',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted/10'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ============= GENERAL TAB ============= */}
        <TabsContent value="GENERAL" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/40 border border-border/40">
            {/* Organization Profile */}
            <Card className="p-8 rounded-none border-0 shadow-none bg-background">
              <SectionHeader icon={Building2} title="Organization Profile" />
              <div className="space-y-6">
                <div>
                  <FieldLabel>Terminal Name</FieldLabel>
                  <Input
                    value={terminalName}
                    onChange={(e) => setTerminalName(e.target.value)}
                    disabled={isLoading}
                    className="rounded-none font-mono text-xs uppercase h-10"
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
                <div className="grid grid-cols-2 gap-4">
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
            </Card>

            {/* Operational Defaults */}
            <Card className="p-8 rounded-none border-0 shadow-none bg-background">
              <SectionHeader icon={Truck} title="Operational Defaults" />
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
                  <SelectField
                    value={defaultPaymentMode}
                    onChange={setDefaultPaymentMode}
                    options={PAYMENT_MODES.map((p) => ({ value: p.id, label: p.label }))}
                  />
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
            </Card>

            {/* Hub Network — Full width */}
            <Card className="p-8 rounded-none border-0 shadow-none md:col-span-2 bg-background">
              <SectionHeader icon={MapPin} title="Hub Network" color="text-primary" />
              <div className="border border-border/40 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/5 font-mono text-xs uppercase tracking-widest">
                      <TableHead>Hub Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Sort Code</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(HUBS).map(([key, hub]) => (
                      <TableRow key={key}>
                        <TableCell className="font-bold text-foreground font-mono">{hub.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono rounded-none tracking-widest text-[10px]">
                            {hub.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {hub.sortCode}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs font-mono">
                          {hub.address}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="default"
                            className="bg-status-success/10 text-status-success border-status-success/30 rounded-none font-mono tracking-widest text-[10px]"
                          >
                            ACTIVE
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-4">
                Hub configuration is managed at the infrastructure level. Contact support to add or modify hubs.
              </p>
            </Card>

            {/* Save Button — Full width */}
            <div className="md:col-span-2 p-8 bg-background flex justify-end">
              <Button onClick={handleSaveGeneral} disabled={isLoading} size="lg" className="rounded-none font-mono text-xs uppercase tracking-widest px-12 h-14">
                {isLoading ? 'Saving...' : 'Execute Changes'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ============= SECURITY & NOTIFICATIONS TAB ============= */}
        <TabsContent value="SECURITY" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/40 border border-border/40">
            {/* User Profile */}
            <Card className="p-8 rounded-none border-0 shadow-none bg-background">
              <SectionHeader icon={User} title="User Profile" />
              <div className="space-y-6">
                <div className="flex items-center gap-6 p-4 bg-muted/5 border border-border/40">
                  <div className="w-16 h-16 bg-primary/10 flex items-center justify-center text-primary font-black text-2xl border border-primary/20">
                    {user?.fullName
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xl font-black text-foreground uppercase tracking-tighter truncate">
                      {user?.fullName || 'Unknown'}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest truncate mt-1">
                      {user?.email || '—'}
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 rounded-none font-mono text-[10px] uppercase tracking-widest border-primary/30 text-primary">
                    {user?.role || '—'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-px bg-border/40 border border-border/40">
                  <div className="p-4 bg-background">
                    <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-1.5 opacity-50">
                      Primary Hub
                    </div>
                    <div className="text-xs font-black text-foreground font-mono uppercase tracking-widest">
                      {user?.hubCode || 'All Hubs'}
                    </div>
                  </div>
                  <div className="p-4 bg-background border-l border-border/40">
                    <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-1.5 opacity-50">
                      Status
                    </div>
                    <div className="text-xs font-black uppercase tracking-widest">
                      {user?.isActive ? (
                        <span className="text-status-success">System Online</span>
                      ) : (
                        <span className="text-status-error">System Offline</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Appearance */}
            <Card className="p-8 rounded-none border-0 shadow-none bg-background">
              <SectionHeader icon={Moon} title="Appearance" />
              <div className="space-y-6">
                <div>
                  <FieldLabel>Theme Mode</FieldLabel>
                  <div className="grid grid-cols-3 border border-border/40">
                    {[
                      { id: 'light' as const, icon: Sun, label: 'Light' },
                      { id: 'dark' as const, icon: Moon, label: 'Dark' },
                      { id: 'system' as const, icon: Monitor, label: 'System' },
                    ].map(({ id, icon: ThemeIcon, label }) => (
                      <button
                        key={id}
                        onClick={() => setTheme(id)}
                        className={`flex flex-col items-center justify-center p-4 transition-all duration-300 ${theme === id ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted/10 border-l first:border-l-0 border-border/40'}`}
                      >
                        <ThemeIcon className="w-4 h-4 mb-2" />
                        <span className="text-[10px] font-mono uppercase tracking-widest">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-6 border-t border-border/40">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4 opacity-50">
                    Session Identity
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-muted/5 p-2 px-3 border border-border/20">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        Last Active Request
                      </span>
                      <span className="font-mono text-[10px] text-foreground font-bold">
                        {session?.user?.last_sign_in_at
                          ? new Date(session.user.last_sign_in_at).toLocaleTimeString()
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-muted/5 p-2 px-3 border border-border/20">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        Cryptographic ID
                      </span>
                      <span className="font-mono text-[10px] text-foreground font-bold truncate max-w-[120px]">
                        {session?.user?.id?.slice(0, 12) || '—'}…
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Notification Parameters */}
            <Card className="p-8 rounded-none border-0 shadow-none bg-background">
              <SectionHeader icon={Bell} title="Notifications" />
              <div className="border border-border/40">
                {[
                  {
                    id: 'shipment_delays',
                    label: 'Delay Alerts',
                  },
                  {
                    id: 'new_orders',
                    label: 'Ingress Events',
                  },
                  {
                    id: 'system_alerts',
                    label: 'Kernel Notifications',
                  },
                  {
                    id: 'driver_updates',
                    label: 'Asset Streams',
                  },
                ].map((item, idx) => (
                  <div key={item.id} className={idx > 0 ? 'border-t border-border/40' : ''}>
                    <ToggleSwitch
                      checked={notifications[item.id as keyof typeof notifications]}
                      onToggle={() => toggleNotification(item.id as keyof typeof notifications)}
                      label={item.label}
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* Security Architecture */}
            <Card className="p-8 rounded-none border-0 shadow-none bg-background">
              <SectionHeader icon={Shield} title="Security" />
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border border-border/40 bg-muted/5">
                  <div className="min-w-0 pr-4">
                    <div className="text-[10px] font-mono font-black text-foreground uppercase tracking-widest">
                      MFA Infrastructure
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase mt-1">
                      Identity Provider Managed
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-none font-mono text-[10px] uppercase tracking-widest h-8" disabled>
                    Config
                  </Button>
                </div>
                <div className="flex justify-between items-center p-4 border border-border/40 bg-muted/5">
                  <div className="min-w-0 pr-4">
                    <div className="text-[10px] font-mono font-black text-foreground uppercase tracking-widest">
                      API Access Gateway
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase mt-1">
                      Privileged access only
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-none font-mono text-[10px] uppercase tracking-widest h-8">
                    Manage
                  </Button>
                </div>
                <div className="flex justify-between items-center p-4 border border-border/40 bg-muted/5">
                  <div className="min-w-0 pr-4">
                    <div className="text-[10px] font-mono font-black text-foreground uppercase tracking-widest">
                      Policy Enforcement
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase mt-1">
                      8+ Chars / Leak Protection
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-status-success/10 text-status-success border-status-success/40 rounded-none font-mono text-[10px] uppercase tracking-widest">
                    ACTIVE
                  </Badge>
                </div>
              </div>
            </Card>
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
