import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShipments } from '@/hooks/useShipments';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Package,
  LayoutDashboard,
  Truck,
  ScanLine,
  FileText,
  Users,
  Settings,
  BarChart3,
  AlertTriangle,
  Warehouse,
  Search,
  Plus,
  Clock,
} from 'lucide-react';

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const NAVIGATION_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, shortcut: '⌘D' },
  { name: 'Shipments', path: '/shipments', icon: Package, shortcut: '⌘S' },
  { name: 'Scanning', path: '/scanning', icon: ScanLine, shortcut: '⌘K' },
  { name: 'Manifests', path: '/manifests', icon: Truck },
  { name: 'Tracking', path: '/tracking', icon: Search },
  { name: 'Inventory', path: '/inventory', icon: Warehouse },
  { name: 'Invoices', path: '/finance', icon: FileText },
  { name: 'Exceptions', path: '/exceptions', icon: AlertTriangle },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const QUICK_ACTIONS = [
  { name: 'Create Shipment', action: 'create-shipment', icon: Plus },
  { name: 'Scan Package', action: 'scan-package', icon: ScanLine },
  { name: 'Create Invoice', action: 'create-invoice', icon: FileText },
  { name: 'New Manifest', action: 'new-manifest', icon: Truck },
];

export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const navigate = useNavigate();
  const { data: shipments = [] } = useShipments();

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, setOpen]);

  const handleSelect = useCallback(
    (value: string) => {
      setOpen(false);

      // Check if it's a navigation path
      if (value.startsWith('/')) {
        navigate(value);
        return;
      }

      // Handle quick actions
      switch (value) {
        case 'create-shipment':
          navigate('/shipments?action=create');
          break;
        case 'scan-package':
          navigate('/scanning');
          break;
        case 'create-invoice':
          navigate('/finance?action=create');
          break;
        case 'new-manifest':
          navigate('/manifests?action=create');
          break;
        default:
          // If it looks like a CN, navigate to tracking
          if (value.startsWith('WGS') || value.match(/^[A-Z]{2,3}\d+/)) {
            navigate(`/tracking?awb=${value}`);
          }
      }
    },
    [navigate, setOpen]
  );

  // Get recent shipments for quick access
  const recentShipments = shipments.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl max-w-2xl">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
          <CommandInput placeholder="Search shipments, actions, or navigate..." />
          <CommandList>
            <CommandEmpty>
              <div className="py-6 text-center">
                <Search className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No results found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try searching for a CN or action
                </p>
              </div>
            </CommandEmpty>

            {recentShipments.length > 0 && (
              <CommandGroup heading="Recent Shipments">
                {recentShipments.map((shipment) => (
                  <CommandItem
                    key={shipment.id}
                    value={shipment.cn_number}
                    onSelect={() => handleSelect(shipment.cn_number)}
                  >
                    <Package className="mr-2 h-4 w-4 text-primary" />
                    <span className="font-mono">{shipment.cn_number}</span>
                    <span className="ml-2 text-muted-foreground text-sm">
                      {shipment.customer?.name || 'Unknown Customer'}
                    </span>
                    <CommandShortcut>
                      <Clock className="h-3 w-3" />
                    </CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandSeparator />

            <CommandGroup heading="Quick Actions">
              {QUICK_ACTIONS.map((action) => (
                <CommandItem
                  key={action.action}
                  value={action.action}
                  onSelect={() => handleSelect(action.action)}
                >
                  <action.icon className="mr-2 h-4 w-4 text-status-success" />
                  <span>{action.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Navigation">
              {NAVIGATION_ITEMS.map((item) => (
                <CommandItem
                  key={item.path}
                  value={item.path}
                  onSelect={() => handleSelect(item.path)}
                >
                  <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{item.name}</span>
                  {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

// Hook for programmatic control
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);

  return { open, setOpen, toggle, show, hide };
}
