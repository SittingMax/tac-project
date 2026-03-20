/**
 * StatusBadge Component
 * Premium status badge with semantic color tokens for shipment states
 * Uses OKLCH color system defined in globals.css
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ShipmentStatus, ManifestStatus, InvoiceStatus } from '@/types';

// Extended status type for all domain entities
type StatusVariant = ShipmentStatus | ManifestStatus | InvoiceStatus | 'NEUTRAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'IN_PROGRESS' | 'RESOLVED';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-all duration-200',
  {
    variants: {
      variant: {
        // Shipment Statuses
        CREATED: 'badge--created',
        PICKUP_SCHEDULED: 'badge--created',
        PICKED_UP: 'badge--manifested',
        RECEIVED_AT_ORIGIN: 'badge--manifested',
        IN_TRANSIT: 'badge--in-transit',
        RECEIVED_AT_DEST: 'badge--arrived',
        OUT_FOR_DELIVERY: 'badge--in-transit',
        DELIVERED: 'badge--delivered',
        CANCELLED: 'badge--cancelled',
        RTO: 'badge--returned',
        EXCEPTION: 'badge--exception',

        // Manifest Statuses
        DRAFT: 'badge--neutral',
        // BUILDING: 'badge--manifested',
        OPEN: 'badge--in-transit',
        CLOSED: 'badge--arrived',
        DEPARTED: 'badge--in-transit',
        ARRIVED: 'badge--arrived',
        // RECONCILED: 'badge--delivered',

        // Exception Status & Severities
        IN_PROGRESS: 'badge--in-transit',
        RESOLVED: 'badge--delivered',
        LOW: 'badge--neutral',
        MEDIUM: 'badge--in-transit',
        HIGH: 'badge--warning',
        CRITICAL: 'badge--exception',

        // Invoice Statuses
        ISSUED: 'badge--manifested',
        PAID: 'badge--delivered',
        OVERDUE: 'badge--exception',

        // Neutral
        NEUTRAL: 'badge--neutral',
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

// Status display labels
const STATUS_LABELS: Record<StatusVariant, string> = {
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

  // Exceptions
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',

  // Invoice
  ISSUED: 'Issued',
  PAID: 'Paid',
  OVERDUE: 'Overdue',

  // Neutral
  NEUTRAL: 'Pending',
};

// Status icons mapping (using Lucide icon names as strings)
const STATUS_ICONS: Record<StatusVariant, string> = {
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

  IN_PROGRESS: 'Activity',
  RESOLVED: 'CheckCircle',
  LOW: 'ArrowDown',
  MEDIUM: 'ArrowRight',
  HIGH: 'ArrowUp',
  CRITICAL: 'AlertOctagon',
  ISSUED: 'FileText',
  PAID: 'CreditCard',
  OVERDUE: 'Clock',
  NEUTRAL: 'Minus',
};

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof statusBadgeVariants> {
  status: StatusVariant;
  showIcon?: boolean;
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
  className,
  ...props
}: StatusBadgeProps) {
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={cn(
        statusBadgeVariants({ variant: status as StatusVariant, size, animated }),
        className
      )}
      {...props}
    >
      {showIcon && <span className="size-3 shrink-0" aria-hidden="true" />}
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
