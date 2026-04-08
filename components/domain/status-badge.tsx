/**
 * StatusBadge Component
 * Premium status badge with semantic color tokens for shipment states
 * Uses OKLCH color system defined in globals.css
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ShipmentStatus, ManifestStatus, InvoiceStatus, ExceptionSeverity } from '@/types';

// Extended status type for all domain entities
export type StatusVariant =
  | ShipmentStatus
  | ManifestStatus
  | InvoiceStatus
  | ExceptionSeverity
  | 'INVESTIGATING'
  | 'NEUTRAL'
  | 'PRIMARY';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition duration-200',
  {
    variants: {
      variant: {
        // Shipment Statuses
        CREATED: 'bg-status-success/15 text-status-success border border-status-success/35',
        PICKUP_SCHEDULED:
          'bg-status-success/15 text-status-success border border-status-success/35',
        PICKED_UP: 'bg-status-info/15 text-status-info border border-status-info/35',
        RECEIVED_AT_ORIGIN: 'bg-status-info/15 text-status-info border border-status-info/35',
        IN_TRANSIT: 'bg-status-info/15 text-status-info border border-status-info/35',
        RECEIVED_AT_DEST:
          'bg-status-success/15 text-status-success border border-status-success/35',
        OUT_FOR_DELIVERY: 'bg-status-info/15 text-status-info border border-status-info/35',
        DELIVERED: 'bg-status-success/15 text-status-success border border-status-success/35',
        CANCELLED: 'bg-muted-foreground/15 text-muted-foreground border border-muted-foreground/35',
        RTO: 'bg-status-warning/15 text-status-warning border border-status-warning/35',
        EXCEPTION: 'bg-status-error/15 text-status-error border border-status-error/35',

        // Manifest Statuses
        DRAFT: 'bg-muted/30 text-muted-foreground border border-border/30',
        OPEN: 'bg-status-info/15 text-status-info border border-status-info/35',
        CLOSED: 'bg-status-success/15 text-status-success border border-status-success/35',
        DEPARTED: 'bg-status-info/15 text-status-info border border-status-info/35',
        ARRIVED: 'bg-status-success/15 text-status-success border border-status-success/35',

        // Invoice Statuses
        ISSUED: 'bg-status-info/15 text-status-info border border-status-info/35',
        PAID: 'bg-status-success/15 text-status-success border border-status-success/35',
        OVERDUE: 'bg-status-error/15 text-status-error border border-status-error/35',

        // Neutral
        NEUTRAL: 'bg-muted/30 text-muted-foreground border border-border/30',

        // Exception Severities
        LOW: 'bg-muted-foreground/15 text-muted-foreground border border-muted-foreground/35',
        MEDIUM: 'bg-status-info/15 text-status-info border border-status-info/35',
        HIGH: 'bg-status-error/15 text-status-error border border-status-error/35',
        CRITICAL: 'bg-status-error/15 text-status-error border border-status-error/35',

        // Exception & Manifest extra statuses
        INVESTIGATING: 'bg-status-info/15 text-status-info border border-status-info/35',
        BUILDING: 'bg-status-info/15 text-status-info border border-status-info/35',
        RECONCILED: 'bg-status-success/15 text-status-success border border-status-success/35',
        RESOLVED: 'bg-status-success/15 text-status-success border border-status-success/35',
        PRIMARY: 'bg-primary/15 text-primary border border-primary/35',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
        lg: 'text-sm px-3 py-1.5',
      },
      animated: {
        true: 'animate-pulse',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'NEUTRAL',
      size: 'md',
      animated: false,
    },
  }
);

// Animate-pulse statuses
const ANIMATED_STATUSES = new Set([
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'HIGH',
  'CRITICAL',
  'INVESTIGATING',
  'BUILDING',
  'OVERDUE',
]);

// Status display labels
const STATUS_LABELS: Record<string, string> = {
  // Shipment
  CREATED: 'Created',
  PICKUP_SCHEDULED: 'Pickup Scheduled',
  PICKED_UP: 'Picked Up',
  RECEIVED_AT_ORIGIN: 'At Origin',
  IN_TRANSIT: 'In Transit',
  RECEIVED_AT_DEST: 'At Destination',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RTO: 'Returned',
  EXCEPTION: 'Exception',

  // Manifest
  DRAFT: 'Draft',
  // BUILDING: 'Building',
  OPEN: 'Open',
  CLOSED: 'Closed',
  DEPARTED: 'Departed',
  ARRIVED: 'Arrived',
  // RECONCILED: 'Reconciled',

  // Invoice
  ISSUED: 'Issued',
  PAID: 'Paid',
  OVERDUE: 'Overdue',

  // Neutral
  NEUTRAL: 'Pending',

  // Exception Severities
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',

  // Extra manifest/exception statuses
  INVESTIGATING: 'Investigating',
  BUILDING: 'Building',
  RECONCILED: 'Reconciled',
  RESOLVED: 'Resolved',
};

// Status icons mapping (using Lucide icon names as strings)
const STATUS_ICONS: Record<string, string> = {
  CREATED: 'Plus',
  PICKUP_SCHEDULED: 'Calendar',
  PICKED_UP: 'Package',
  RECEIVED_AT_ORIGIN: 'Warehouse',
  IN_TRANSIT: 'Truck',
  RECEIVED_AT_DEST: 'MapPin',
  OUT_FOR_DELIVERY: 'Truck',
  DELIVERED: 'CheckCircle',
  CANCELLED: 'XCircle',
  RTO: 'RotateCcw',
  EXCEPTION: 'AlertTriangle',
  DRAFT: 'FileText',
  // BUILDING: 'Hammer',
  OPEN: 'FolderOpen',
  CLOSED: 'Folder',
  DEPARTED: 'Plane',
  ARRIVED: 'PlaneLanding',
  // RECONCILED: 'CheckSquare',
  ISSUED: 'FileText',
  PAID: 'CreditCard',
  OVERDUE: 'Clock',
  NEUTRAL: 'Minus',
};

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof statusBadgeVariants> {
  status: StatusVariant | string;
  showIcon?: boolean;
  /** showDot for backward compat with old StatusBadge.tsx */
  showDot?: boolean;
  iconClassName?: string;
}

/**
 * StatusBadge - Premium status indicator with semantic colors
 *
 * @example
 * <StatusBadge status={ShipmentStatus.IN_TRANSIT} />
 * <StatusBadge status={ShipmentStatus.DELIVERED} size="lg" showIcon />
 */
export function StatusBadge({
  status,
  size,
  animated,
  showIcon = false,
  showDot = false,
  className,
  ...props
}: StatusBadgeProps) {
  const label = (STATUS_LABELS as Record<string, string>)[status] ?? status.replace(/_/g, ' ');
  const isAnimated = animated ?? ANIMATED_STATUSES.has(status);

  return (
    <span
      className={cn(
        statusBadgeVariants({ variant: status as StatusVariant, size, animated: isAnimated }),
        className
      )}
      {...props}
    >
      {(showDot || showIcon) && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full bg-current shrink-0',
            isAnimated && 'animate-pulse'
          )}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
}

// Utility function to get badge class for a status
export function getStatusBadgeClass(status: StatusVariant): string {
  const variant = statusBadgeVariants({ variant: status as StatusVariant });
  return cn(variant);
}

// Utility function to get status label
export function getStatusLabel(status: StatusVariant): string {
  return STATUS_LABELS[status] || status;
}

export { statusBadgeVariants, STATUS_LABELS, STATUS_ICONS };
