import { cn } from '@/lib/utils';
import { ShipmentStatus, ManifestStatus, InvoiceStatus, ExceptionSeverity } from '@/types';

type StatusType = ShipmentStatus | ManifestStatus | InvoiceStatus | ExceptionSeverity | string;

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showDot?: boolean;
}

/**
 * Status to CSS badge class mapping
 * Uses semantic status tokens from globals.css
 */
const STATUS_CLASS_MAP: Record<string, { class: string; animate?: boolean }> = {
  // Shipment Statuses (canonical)
  CREATED: { class: 'badge--created' },
  PICKUP_SCHEDULED: { class: 'badge--created' },
  PICKED_UP: { class: 'badge--manifested' },
  RECEIVED_AT_ORIGIN: { class: 'badge--manifested' },
  IN_TRANSIT: { class: 'badge--in-transit', animate: true },
  RECEIVED_AT_DEST: { class: 'badge--arrived' },
  OUT_FOR_DELIVERY: { class: 'badge--in-transit', animate: true },
  DELIVERED: { class: 'badge--delivered' },
  CANCELLED: { class: 'badge--cancelled' },
  RTO: { class: 'badge--returned' },
  EXCEPTION: { class: 'badge--exception', animate: true },

  // Manifest Statuses
  DRAFT: { class: 'badge--created' },
  BUILDING: { class: 'badge--manifested', animate: true },
  OPEN: { class: 'badge--created' },
  CLOSED: { class: 'badge--manifested' },
  DEPARTED: { class: 'badge--in-transit', animate: true },
  ARRIVED: { class: 'badge--arrived' },
  RECONCILED: { class: 'badge--delivered' },

  // Invoice Statuses
  ISSUED: { class: 'badge--manifested' },
  PAID: { class: 'badge--delivered' },
  OVERDUE: { class: 'badge--exception', animate: true },

  // Exception Statuses
  INVESTIGATING: { class: 'badge--in-transit' },
  RESOLVED: { class: 'badge--delivered' },

  // Exception Severities
  LOW: { class: 'badge--cancelled' },
  MEDIUM: { class: 'badge--in-transit' },
  HIGH: { class: 'badge--exception' },
  CRITICAL: { class: 'badge--exception', animate: true },

  // Default fallback
  DEFAULT: { class: 'badge--cancelled' },
};

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export function StatusBadge({ status, size = 'md', className, showDot = true }: StatusBadgeProps) {
  const config = STATUS_CLASS_MAP[status] || STATUS_CLASS_MAP.DEFAULT;
  const displayText = status.replace(/_/g, ' ');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-none font-medium',
        config.class,
        SIZE_CLASSES[size],
        className
      )}
    >
      {showDot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-none bg-current', config.animate && 'animate-pulse')}
        />
      )}
      <span className="capitalize">{displayText.toLowerCase()}</span>
    </span>
  );
}
