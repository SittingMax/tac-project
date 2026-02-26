/**
 * Empty State Components
 * Displays when lists or data are empty
 */

import {
  Package,
  FileText,
  Truck,
  Users,
  AlertTriangle,
  Search,
  Inbox,
  LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center animate-[fadeIn_0.3s_ease-out]',
        className
      )}
    >
      <div className="w-20 h-20 rounded-none bg-muted/50 flex items-center justify-center mb-6 animate-[scaleIn_0.3s_ease-out]">
        <Icon className="w-10 h-10 text-muted-foreground" />
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>

      {description && <p className="text-muted-foreground max-w-md mb-6">{description}</p>}

      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}

// Pre-configured empty states for common scenarios

export function EmptyShipments({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={Package}
      title="No shipments yet"
      description="Create your first shipment to get started with cargo tracking"
      action={onCreate ? { label: 'Create Shipment', onClick: onCreate } : undefined}
    />
  );
}

export function EmptyManifests({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No manifests found"
      description="Manifests group shipments for transport between hubs"
      action={onCreate ? { label: 'Create Manifest', onClick: onCreate } : undefined}
    />
  );
}

export function EmptyInvoices({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No invoices yet"
      description="Invoices are automatically created when shipments are booked"
      action={onCreate ? { label: 'View Shipments', onClick: onCreate } : undefined}
    />
  );
}

export function EmptyCustomers({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No customers yet"
      description="Add customers to start booking shipments"
      action={onCreate ? { label: 'Add Customer', onClick: onCreate } : undefined}
    />
  );
}

export function EmptyExceptions() {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="No exceptions"
      description="All shipments are running smoothly without any issues"
    />
  );
}

export function EmptySearchResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={
        query
          ? `No matches found for "${query}". Try a different search term.`
          : "Try adjusting your search or filters to find what you're looking for."
      }
    />
  );
}

export function EmptyTrackingEvents() {
  return (
    <EmptyState
      icon={Truck}
      title="No tracking events"
      description="Tracking events will appear here as your shipment moves through the network"
    />
  );
}
