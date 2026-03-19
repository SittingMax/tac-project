import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart2,
  Box,
  PackagePlus,
  ClipboardList,
  ScanLine,
  Layers,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Users,
  Briefcase,
  Mail,
  Settings as SettingsIcon,
  LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { hasRoleAccess } from '@/lib/access-control';
import { cn } from '@/lib/utils';
import { useSidebarBadges, SidebarBadges } from '@/hooks/useSidebarBadges';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';

interface NavItem {
  label: string;
  icon: LucideIcon;
  to: string;
  roles?: UserRole[];
  badgeKey?: keyof SidebarBadges;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const DomainOverview: React.FC = () => {
  const navigate = useNavigate();
  const { data: badges } = useSidebarBadges();
  const userRole = useAuthStore((state) => state.user?.role);

  const groups: NavGroup[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
        {
          label: 'Analytics',
          icon: BarChart2,
          to: '/analytics',
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
          to: '/shipments?status=IN_TRANSIT',
          badgeKey: 'inTransitShipments',
        },
        {
          label: 'Delivered Today',
          icon: CheckCircle,
          to: '/shipments?status=DELIVERED&delivered=today',
          badgeKey: 'deliveredToday',
        },
        {
          label: 'Bookings',
          icon: PackagePlus,
          to: '/bookings',
          roles: ['ADMIN', 'MANAGER', 'OPS_STAFF'],
          badgeKey: 'pendingBookings',
        },
        {
          label: 'Manifests',
          icon: ClipboardList,
          to: '/manifests',
          roles: ['ADMIN', 'MANAGER', 'OPS_STAFF'],
          badgeKey: 'openManifests',
        },
        {
          label: 'Scanning',
          icon: ScanLine,
          to: '/scanning',
          roles: ['ADMIN', 'MANAGER', 'WAREHOUSE_STAFF'],
        },
        {
          label: 'Inventory',
          icon: Layers,
          to: '/inventory',
          roles: ['ADMIN', 'MANAGER', 'WAREHOUSE_STAFF'],
          badgeKey: 'inventoryBacklog',
        },
        {
          label: 'Exceptions',
          icon: AlertTriangle,
          to: '/exceptions',
          roles: ['ADMIN', 'MANAGER', 'OPS_STAFF', 'WAREHOUSE_STAFF'],
          badgeKey: 'openExceptions',
        },
      ],
    },
    {
      title: 'Business',
      items: [
        {
          label: 'Invoices',
          icon: CreditCard,
          to: '/finance',
          roles: ['ADMIN', 'MANAGER', 'FINANCE_STAFF'],
        },
        {
          label: 'Customers',
          icon: Users,
          to: '/customers',
          roles: ['ADMIN', 'MANAGER', 'FINANCE_STAFF', 'OPS_STAFF'],
        },
        { label: 'Management', icon: Briefcase, to: '/management', roles: ['ADMIN', 'MANAGER'] },
      ],
    },
    {
      title: 'System',
      items: [
        {
          label: 'Messages',
          icon: Mail,
          to: '/admin/messages?status=unread',
          roles: ['ADMIN'],
          badgeKey: 'unreadMessages',
        },
        { label: 'Shift Report', icon: ClipboardList, to: '/shift-report' },
        { label: 'Settings', icon: SettingsIcon, to: '/settings' },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6" data-testid="domain-overview">
      {groups.map((group) => {
        const visibleItems = group.items.filter((i) => hasRoleAccess(userRole, i.roles));
        if (visibleItems.length === 0) return null;

        return (
          <div key={group.title} className="flex flex-col gap-3">
            <h3 className="text-xs text-muted-foreground">{group.title}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const count = item.badgeKey && badges ? badges[item.badgeKey] : 0;
                const showBadge = typeof count === 'number' && count > 0;

                return (
                  <Card
                    key={item.label}
                    className={cn(
                      'relative overflow-hidden group transition-colors duration-300',
                      'border border-border/40 bg-background hover:bg-muted/50 rounded-md'
                    )}
                  >
                    {showBadge && (
                      <div className="absolute top-2 right-2 z-10 text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-primary/15 text-primary border border-primary/20">
                        {count > 99 ? '99+' : count}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate(item.to)}
                      className="w-full text-left"
                      aria-label={item.label}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-sm bg-primary/10 text-primary">
                          <Icon size={16} strokeWidth={1.5} />
                        </div>
                        <div className="flex-col">
                          <span className="text-sm font-semibold text-foreground">
                            {item.label}
                          </span>
                          <span className="text-[11px] text-muted-foreground tracking-wider uppercase">
                            Open
                          </span>
                        </div>
                      </CardContent>
                    </button>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DomainOverview;
