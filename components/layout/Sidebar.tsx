import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart2,
  ScanLine,
  CreditCard,
  Settings,
  Box,
  AlertTriangle,
  Users,
  Layers,
  ClipboardList,
  Briefcase,
  Mail,
  ChevronRight,
  PackagePlus,
} from 'lucide-react';
import { useStore } from '../../store';
import { UserRole } from '../../types';
import { UserProfile } from './UserProfile';
import { useSidebarBadges } from '@/hooks/useSidebarBadges';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItemDef {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  roles?: UserRole[]; // If undefined, accessible by all
  badgeKey?: 'pendingBookings' | 'openExceptions' | 'openManifests'; // Key to look up in useSidebarBadges
  subItems?: Omit<NavItemDef, 'icon' | 'subItems' | 'badgeKey'>[]; // For collapsible menus
}

interface NavGroupDef {
  title: string;
  items: NavItemDef[];
}

const NAV_GROUPS: NavGroupDef[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      {
        label: 'Analytics',
        icon: BarChart2,
        path: '/analytics',
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
        subItems: [
          { label: 'All Shipments', path: '/shipments' },
          { label: 'Tracking', path: '/tracking' },
        ],
      },
      {
        label: 'Bookings',
        icon: PackagePlus,
        path: '/bookings',
        badgeKey: 'pendingBookings',
        roles: ['ADMIN', 'MANAGER', 'OPS_STAFF'],
      },
      {
        label: 'Manifests',
        icon: ClipboardList,
        path: '/manifests',
        badgeKey: 'openManifests',
        roles: ['ADMIN', 'MANAGER', 'OPS_STAFF'],
      },
      {
        label: 'Scanning',
        icon: ScanLine,
        subItems: [
          { label: 'Terminal Scanner', path: '/scanning' },
          { label: 'Arrival Audit', path: '/arrival-audit' },
        ],
        roles: ['ADMIN', 'MANAGER', 'WAREHOUSE_STAFF'],
      },
      {
        label: 'Inventory',
        icon: Layers,
        path: '/inventory',
        roles: ['ADMIN', 'MANAGER', 'WAREHOUSE_STAFF'],
      },
      {
        label: 'Exceptions',
        icon: AlertTriangle,
        path: '/exceptions',
        badgeKey: 'openExceptions',
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
        path: '/finance',
        roles: ['ADMIN', 'MANAGER', 'FINANCE_STAFF'],
      },
      {
        label: 'Customers',
        icon: Users,
        path: '/customers',
        roles: ['ADMIN', 'MANAGER', 'FINANCE_STAFF', 'OPS_STAFF'],
      },
      { label: 'Management', icon: Briefcase, path: '/management', roles: ['ADMIN', 'MANAGER'] },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Messages', icon: Mail, path: '/admin/messages', roles: ['ADMIN'] },
      { label: 'Shift Report', icon: ClipboardList, path: '/shift-report' },
      { label: 'Settings', icon: Settings, path: '/settings' },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen, user } = useStore();
  const location = useLocation();
  const { data: badges } = useSidebarBadges();

  // Track expanded state for nested menus
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, setMobileSidebarOpen]);

  // Expand parent menus if a child is active initially
  useEffect(() => {
    NAV_GROUPS.forEach((group) => {
      group.items.forEach((item) => {
        if (item.subItems) {
          const isChildActive = item.subItems.some((sub) =>
            location.pathname.startsWith(sub.path!)
          );
          if (isChildActive) {
            setExpandedMenus((prev) => ({ ...prev, [item.label]: true }));
          }
        }
      });
    });
  }, [location.pathname]);

  const hasAccess = (allowedRoles?: UserRole[]) => {
    if (!allowedRoles) return true;
    if (!user) return false;
    // ADMIN and MANAGER have access to everything
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'MANAGER')
      return true;
    return allowedRoles.includes(user.role);
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 z-50 flex flex-col',
          sidebarCollapsed ? 'w-20' : 'w-64',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-5 border-b border-sidebar-border bg-sidebar/50">
          <div className="flex items-center justify-center shrink-0">
            <div className="relative flex h-8 w-8 items-center justify-center bg-primary/15 transition-colors duration-300 rounded-none shadow-sm">
              <Box className="h-4 w-4 text-primary fill-primary/20" />
            </div>
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3 flex flex-col">
              <span className="text-foreground text-lg font-sans font-bold tracking-tight leading-none transition-colors duration-300">
                TAC
              </span>
              <span className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase mt-0.5">
                Tapan Associate Cargo
              </span>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto hidden-scrollbar">
          {NAV_GROUPS.map((group, groupIndex) => {
            const visibleItems = group.items.filter((item) => hasAccess(item.roles));

            if (visibleItems.length === 0) return null;

            return (
              <div key={groupIndex} className="space-y-1">
                {!sidebarCollapsed && group.title && (
                  <div className="px-4 mb-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    {group.title}
                  </div>
                )}
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const badgeCount = item.badgeKey && badges ? badges[item.badgeKey] : 0;
                    const hasSubItems = !!item.subItems?.length;
                    const isExpanded = expandedMenus[item.label];

                    // Standard explicit route match
                    let isActive = false;
                    if (item.path) {
                      isActive = location.pathname.startsWith(item.path);
                    } else if (hasSubItems) {
                      isActive = item.subItems!.some((sub) =>
                        location.pathname.startsWith(sub.path!)
                      );
                    }

                    // A parent wrapper container (button or link)
                    const ItemWrapper = ({
                      children,
                      className,
                    }: {
                      children: React.ReactNode;
                      className?: string;
                    }) => {
                      if (hasSubItems) {
                        return (
                          <button
                            onClick={() => toggleMenu(item.label)}
                            className={cn('w-full text-left outline-none', className)}
                          >
                            {children}
                          </button>
                        );
                      }
                      return (
                        <NavLink
                          to={item.path!}
                          title={sidebarCollapsed ? item.label : ''}
                          data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                          aria-label={item.label}
                          className={className}
                        >
                          {children}
                        </NavLink>
                      );
                    };

                    return (
                      <div key={item.label}>
                        <ItemWrapper
                          className={cn(
                            'flex items-center px-3 py-2 text-sm transition-all duration-200 group relative rounded-none',
                            isActive
                              ? 'bg-primary/15 text-primary font-semibold shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)]'
                              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground font-medium'
                          )}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="active-nav-indicator"
                              className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-none"
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                          )}

                          <item.icon
                            className={cn(
                              'w-4 h-4 shrink-0 transition-colors duration-200',
                              sidebarCollapsed ? 'mx-auto' : 'mr-3',
                              isActive
                                ? 'text-primary'
                                : 'text-muted-foreground group-hover:text-foreground'
                            )}
                            aria-hidden="true"
                          />

                          {!sidebarCollapsed && (
                            <div className="flex flex-1 items-center justify-between truncate">
                              <span className="truncate">{item.label}</span>

                              <div className="flex items-center gap-2">
                                {/* Badges */}
                                {badgeCount !== undefined && badgeCount > 0 && (
                                  <span
                                    className={cn(
                                      'flex h-5 items-center justify-center rounded-none px-2 text-[10px] font-bold',
                                      isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-destructive/10 text-destructive'
                                    )}
                                  >
                                    {badgeCount > 99 ? '99+' : badgeCount}
                                  </span>
                                )}

                                {/* Expand/Collapse Icon */}
                                {hasSubItems && (
                                  <ChevronRight
                                    className={cn(
                                      'w-4 h-4 transition-transform duration-200',
                                      isExpanded ? 'rotate-90' : ''
                                    )}
                                  />
                                )}
                              </div>
                            </div>
                          )}

                          {/* Minified badges for collapsed state */}
                          {sidebarCollapsed && badgeCount !== undefined && badgeCount > 0 && (
                            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-none bg-destructive animate-pulse" />
                          )}
                        </ItemWrapper>

                        {/* Collapsible Sub-menu */}
                        {!sidebarCollapsed && hasSubItems && (
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-1 space-y-1 relative before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-border">
                                  {item.subItems!.map((subItem) => {
                                    const isSubActive = location.pathname === subItem.path;
                                    return (
                                      <NavLink
                                        key={subItem.label}
                                        to={subItem.path!}
                                        className={cn(
                                          'flex items-center pl-10 pr-3 py-2 text-sm transition-colors rounded-none group relative',
                                          isSubActive
                                            ? 'text-foreground font-semibold bg-muted/30'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                                        )}
                                      >
                                        <div
                                          className={cn(
                                            'absolute left-[18px] w-1.5 h-1.5 rounded-none border border-current bg-background transition-colors',
                                            isSubActive
                                              ? 'border-primary bg-primary'
                                              : 'border-muted-foreground group-hover:border-foreground'
                                          )}
                                        />
                                        {subItem.label}
                                      </NavLink>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer / User */}
        <div className="p-4 border-t border-border bg-sidebar/30">
          <UserProfile collapsed={sidebarCollapsed} />
        </div>
      </aside>
    </>
  );
};
