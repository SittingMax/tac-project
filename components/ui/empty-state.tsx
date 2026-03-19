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
        'relative flex flex-col items-center justify-center p-16 text-center animate-[fadeIn_0.3s_ease-out] overflow-hidden rounded-md border border-border/40 bg-card/50',
        className
      )}
    >
      <div className="absolute inset-0 bg-grain opacity-5 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="relative z-10 w-20 h-20 rounded-none bg-muted/50 flex items-center justify-center mb-8 border border-border/50 shadow-sm animate-[scaleIn_0.3s_ease-out]">
        <Icon size={40} strokeWidth={1.5} className="text-muted-foreground/80" />
      </div>

      <h3 className="relative z-10 text-2xl font-bold tracking-tight text-foreground mb-3">
        {title}
      </h3>

      {description && (
        <p className="relative z-10 text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">
          {description}
        </p>
      )}

      {action && (
        <div className="relative z-10">
          <Button onClick={action.onClick} className="rounded-none shadow-sm shadow-primary/20">
            {action.label}
          </Button>
        </div>
      )}
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
