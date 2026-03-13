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
import { hasRoleAccess } from '@/lib/access-control';
import { UserProfile } from './UserProfile';
import { useAuthStore } from '@/store/authStore';
import { useSidebarBadges } from '@/hooks/useSidebarBadges';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';

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
        badgeKey: 'inventoryBacklog' as const,
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
      {
        label: 'Messages',
        icon: Mail,
        url: '/admin/messages?status=unread',
        badgeKey: 'unreadMessages' as const,
        roles: ['ADMIN'],
      },
      { label: 'Shift Report', icon: ClipboardList, url: '/shift-report' },
      { label: 'Settings', icon: Settings, url: '/settings' },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const userRole = useAuthStore((state) => state.user?.role);
  const { data: badges } = useSidebarBadges();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" {...props} className="border-r-0 shadow-sm z-50">
      <SidebarHeader className="border-b border-sidebar-border/50 px-4 py-3 h-16 flex items-center justify-center bg-sidebar/50">
        <TacLogo
          size="sm"
          showSubtitle={!isCollapsed}
          collapsed={isCollapsed}
          linkTo="/dashboard"
        />
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-4 gap-4">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) =>
            hasRoleAccess(userRole, item.roles as UserRole[])
          );
          if (visibleItems.length === 0) return null;

          return (
            <Collapsible key={group.title} defaultOpen className="group/nav-group">
              <SidebarGroup className="p-0">
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="h-8 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold transition-colors hover:text-foreground cursor-pointer group-data-[collapsible=icon]:hidden px-2 mb-1">
                    {group.title}
                    <ChevronRight className="ml-auto w-3 h-3 transition-transform duration-200 group-data-[state=open]/nav-group:rotate-90 opacity-50" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="gap-1.5">
                      {visibleItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.url.split('?')[0]);
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
                                  <SidebarMenuButton 
                                    tooltip={item.label} 
                                    isActive={isActive}
                                    className={cn(
                                      "h-9 px-3 text-sm font-medium transition-all group-data-[collapsible=icon]:px-0",
                                      isActive 
                                        ? "bg-primary/10 text-primary border-l-2 border-primary rounded-none rounded-r-md font-semibold"
                                        : "hover:bg-accent/50 hover:text-accent-foreground text-muted-foreground border-l-2 border-transparent"
                                    )}
                                  >
                                    {item.icon && <item.icon className="w-4 h-4 shrink-0" strokeWidth={2} />}
                                    <span>{item.label}</span>
                                    <ChevronRight className="ml-auto w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 opacity-50" />
                                  </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <SidebarMenuSub className="border-sidebar-border ml-5 mt-1 border-l">
                                    {itemData.items.map((subItem) => {
                                      const isSubActive = location.pathname === subItem.url;
                                      return (
                                        <SidebarMenuSubItem key={subItem.title}>
                                          <SidebarMenuSubButton 
                                            asChild 
                                            isActive={isSubActive}
                                            className={cn(
                                              "h-8 text-xs font-medium transition-all group-data-[collapsible=icon]:hidden",
                                              isSubActive 
                                                ? "text-primary font-bold" 
                                                : "text-muted-foreground hover:text-foreground"
                                            )}
                                          >
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

                        // Single Item
                        return (
                          <SidebarMenuItem key={item.label}>
                            <SidebarMenuButton 
                              asChild 
                              isActive={isActive} 
                              tooltip={item.label}
                              className={cn(
                                "h-9 px-3 text-sm font-medium transition-all group-data-[collapsible=icon]:px-0",
                                isActive 
                                  ? "bg-primary/10 text-primary border-l-2 border-primary rounded-none rounded-r-md font-semibold"
                                  : "hover:bg-accent/50 hover:text-accent-foreground text-muted-foreground border-l-2 border-transparent"
                              )}
                            >
                              <Link to={item.url}>
                                {item.icon && <item.icon className="w-4 h-4 shrink-0" strokeWidth={2} />}
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuButton>
                            {badgeCount !== undefined && badgeCount > 0 && (
                              <SidebarMenuBadge className={cn(
                                "text-[10px] w-5 h-5 flex items-center justify-center rounded-md font-bold mt-2",
                                isActive ? "bg-primary text-primary-foreground" : "bg-destructive/10 text-destructive"
                              )}>
                                {badgeCount > 99 ? '99+' : badgeCount}
                              </SidebarMenuBadge>
                            )}
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50 p-4">
        <UserProfile />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
