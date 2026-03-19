'use client';

import { useState } from 'react';
import { PageContainer, PageHeader, SectionCard } from '@/components/ui-core/layout';
import { cn } from '@/lib/utils';
import {
  Settings as SettingsIcon,
  Building2,
  Truck,
  Receipt,
  Shield,
  Users,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { hasRoleAccess } from '@/lib/access-control';

// Tab Content
import { GeneralTab } from '@/components/settings/tabs/GeneralTab';
import { OperationsTab } from '@/components/settings/tabs/OperationsTab';
import { BillingTab } from '@/components/settings/tabs/BillingTab';
import { SecurityTab } from '@/components/settings/tabs/SecurityTab';
import { UsersTab } from '@/components/settings/tabs/UsersTab';
import { AuditTab } from '@/components/settings/tabs/AuditTab';

type TabId = 'general' | 'operations' | 'billing' | 'security' | 'users' | 'audit';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ElementType;
  description: string;
  roles?: Array<
    'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'OPS_STAFF' | 'WAREHOUSE_STAFF' | 'FINANCE_STAFF'
  >;
}

const TABS: TabConfig[] = [
  {
    id: 'general',
    label: 'General',
    icon: Building2,
    description: 'Organization profile and regional settings',
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: Truck,
    description: 'Shipment defaults and automation rules',
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: Receipt,
    description: 'Invoice configuration and tax settings',
    roles: ['ADMIN', 'MANAGER', 'FINANCE_STAFF'],
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    description: 'Password policy and session controls',
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    description: 'Team members and access control',
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    icon: Activity,
    description: 'System activity and change history',
    roles: ['ADMIN', 'MANAGER'],
  },
];

function SidebarNav({
  activeTab,
  onTabChange,
  visibleTabs,
}: {
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
  visibleTabs: TabConfig[];
}) {
  return (
    <nav className="flex flex-col gap-1">
      {visibleTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition text-left',
              'hover:bg-muted/60',
              isActive
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted-foreground border border-transparent'
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export const Settings = () => {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const user = useAuthStore((s) => s.user);

  // Filter tabs based on role access
  const visibleTabs = TABS.filter((tab) => hasRoleAccess(user?.role, tab.roles));

  // Ensure active tab is visible
  const currentTab = visibleTabs.find((t) => t.id === activeTab) || visibleTabs[0];
  const CurrentTabIcon = currentTab?.icon;

  return (
    <PageContainer maxWidth="wide" className="py-8">
      <PageHeader
        icon={<SettingsIcon className="size-5" />}
        title="Settings"
        description="Configure your organization, operations, and security preferences"
      />

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        {/* Sidebar Navigation */}
        <aside className="shrink-0">
          <SectionCard className="lg:sticky lg:top-6" contentClassName="p-2">
            <SidebarNav
              activeTab={currentTab.id}
              onTabChange={setActiveTab}
              visibleTabs={visibleTabs}
            />
          </SectionCard>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {currentTab && (
            <SectionCard
              title={
                <div className="flex items-center gap-2">
                  {CurrentTabIcon && <CurrentTabIcon className="size-4 text-muted-foreground" />}
                  <span>{currentTab.label}</span>
                </div>
              }
              description={currentTab.description}
              contentClassName="max-w-3xl"
            >
              {currentTab.id === 'general' && <GeneralTab />}
              {currentTab.id === 'operations' && <OperationsTab />}
              {currentTab.id === 'billing' && <BillingTab />}
              {currentTab.id === 'security' && <SecurityTab />}
              {currentTab.id === 'users' && <UsersTab />}
              {currentTab.id === 'audit' && <AuditTab />}
            </SectionCard>
          )}
        </main>
      </div>
    </PageContainer>
  );
};
