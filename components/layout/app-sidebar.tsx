import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Box,
  LayoutDashboard,
  BarChart2,
  ScanLine,
  CreditCard,
  Settings,
  AlertTriangle,
  Users,
  Layers,
  ClipboardList,
  Briefcase,
  Mail,
  PackagePlus,
  ChevronRight,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuBadge,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TacLogo } from '@/components/shared/tac-logo';
import { UserProfile } from './UserProfile';
import { useStore } from '@/store';
import { useSidebarBadges } from '@/hooks/useSidebarBadges';
import { UserRole } from '@/types';

const navGroups = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, url: '/dashboard' },
      {
        label: 'Analytics',
        icon: BarChart2,
        url: '/analytics',
        roles: ['ADMIN', 'MANAGER', 'FINANCE_STAFF'],
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        label: 'Shipments',
        icon: Box,
        url: '/shipments',
        items: [
          { title: 'All Shipments', url: '/shipments' },
          { title: 'Tracking', url: '/tracking' },
        ],
      },
      {
        label: 'Bookings',
        icon: PackagePlus,
        url: '/bookings',
        badgeKey: 'pendingBookings' as const,
        roles: ['ADMIN', 'MANAGER', 'OPS_STAFF'],
      },
      {
        label: 'Manifests',
        icon: ClipboardList,
        url: '/manifests',
        badgeKey: 'openManifests' as const,
        roles: ['ADMIN', 'MANAGER', 'OPS_STAFF'],
      },
      {
        label: 'Scanning',
        icon: ScanLine,
        url: '/scanning',
        items: [
          { title: 'Terminal Scanner', url: '/scanning' },
          { title: 'Arrival Audit', url: '/arrival-audit' },
        ],
        roles: ['ADMIN', 'MANAGER', 'WAREHOUSE_STAFF'],
      },
      {
        label: 'Inventory',
        icon: Layers,
        url: '/inventory',
        roles: ['ADMIN', 'MANAGER', 'WAREHOUSE_STAFF'],
      },
      {
        label: 'Exceptions',
        icon: AlertTriangle,
        url: '/exceptions',
        badgeKey: 'openExceptions' as const,
        roles: ['ADMIN', 'MANAGER', 'OPS_STAFF', 'WAREHOUSE_STAFF'],
      },
    ],
  },
  {
    title: 'Business',
    items: [
      {
        label: 'Invoices',
        icon: CreditCard,
        url: '/finance',
        roles: ['ADMIN', 'MANAGER', 'FINANCE_STAFF'],
      },
      {
        label: 'Customers',
        icon: Users,
        url: '/customers',
        roles: ['ADMIN', 'MANAGER', 'FINANCE_STAFF', 'OPS_STAFF'],
      },
      { label: 'Management', icon: Briefcase, url: '/management', roles: ['ADMIN', 'MANAGER'] },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Messages', icon: Mail, url: '/admin/messages', roles: ['ADMIN'] },
      { label: 'Shift Report', icon: ClipboardList, url: '/shift-report' },
      { label: 'Settings', icon: Settings, url: '/settings' },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { user } = useStore();
  const { data: badges } = useSidebarBadges();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const hasAccess = (allowedRoles?: UserRole[]) => {
    if (!allowedRoles) return true;
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'MANAGER')
      return true;
    return allowedRoles.includes(user.role as UserRole);
  };

  return (
    <Sidebar collapsible="icon" {...props} className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3 h-16 flex items-center justify-center">
        <TacLogo
          size="sm"
          showSubtitle={!isCollapsed}
          collapsed={isCollapsed}
          linkTo="/dashboard"
        />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => hasAccess(item.roles as UserRole[]));
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.url);
                    const itemData = item as {
                      badgeKey?: keyof typeof badges;
                      items?: { title: string; url: string }[];
                    };
                    const badgeKey = itemData.badgeKey;
                    const badgeCount = badgeKey && badges ? badges[badgeKey] : 0;

                    if (itemData.items) {
                      return (
                        <Collapsible
                          key={item.label}
                          asChild
                          defaultOpen={isActive}
                          className="group/collapsible"
                        >
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton tooltip={item.label} isActive={isActive}>
                                {item.icon && <item.icon />}
                                <span>{item.label}</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {itemData.items.map((subItem) => {
                                  const isSubActive = location.pathname === subItem.url;
                                  return (
                                    <SidebarMenuSubItem key={subItem.title}>
                                      <SidebarMenuSubButton asChild isActive={isSubActive}>
                                        <Link to={subItem.url}>
                                          <span>{subItem.title}</span>
                                        </Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  );
                                })}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                          <Link to={item.url}>
                            {item.icon && <item.icon />}
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                        {badgeCount !== undefined && badgeCount > 0 && (
                          <SidebarMenuBadge>
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter>
        <UserProfile />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
