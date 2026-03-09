/**
 * ShipmentTimeline Component
 * Premium vertical timeline showing shipment tracking events
 * Designed for customer-facing tracking page and internal dashboard
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ShipmentStatus } from '@/types';
import {
  Package,
  Warehouse,
  Truck,
  MapPin,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Plane,
  Clock,
} from 'lucide-react';

// Timeline event from database
export interface TimelineEvent {
  id: string;
  event_code: string;
  event_time: string | null;
  location: string | null;
  notes: string | null;
  source: string;
  meta?: Record<string, unknown>;
  created_at: string;
}

// Timeline status configuration
interface TimelineStepConfig {
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
}

const TIMELINE_CONFIG: Record<string, TimelineStepConfig> = {
  CREATED: {
    icon: Package,
    label: 'Shipment Created',
    color: 'text-status-info',
    bgColor: 'bg-status-info/15',
  },
  PICKUP_SCHEDULED: {
    icon: Clock,
    label: 'Pickup Scheduled',
    color: 'text-status-info',
    bgColor: 'bg-status-info/15',
  },
  PICKED_UP: {
    icon: Package,
    label: 'Picked Up',
    color: 'text-status-info',
    bgColor: 'bg-status-info/15',
  },
  RECEIVED_AT_ORIGIN: {
    icon: Warehouse,
    label: 'Received at Origin Hub',
    color: 'text-status-info',
    bgColor: 'bg-status-info/15',
  },
  IN_TRANSIT: {
    icon: Truck,
    label: 'In Transit',
    color: 'text-status-warning',
    bgColor: 'bg-status-warning/15',
  },
  MANIFEST_ASSIGNED: {
    icon: Plane,
    label: 'Added to Manifest',
    color: 'text-status-info',
    bgColor: 'bg-status-info/15',
  },
  DEPARTED: {
    icon: Plane,
    label: 'Departed',
    color: 'text-status-warning',
    bgColor: 'bg-status-warning/15',
  },
  ARRIVED: {
    icon: MapPin,
    label: 'Arrived at Destination',
    color: 'text-status-warning',
    bgColor: 'bg-status-warning/15',
  },
  RECEIVED_AT_DEST: {
    icon: Warehouse,
    label: 'Received at Destination Hub',
    color: 'text-status-warning',
    bgColor: 'bg-status-warning/15',
  },
  OUT_FOR_DELIVERY: {
    icon: Truck,
    label: 'Out for Delivery',
    color: 'text-status-warning',
    bgColor: 'bg-status-warning/15',
  },
  DELIVERED: {
    icon: CheckCircle,
    label: 'Delivered',
    color: 'text-status-success',
    bgColor: 'bg-status-success/15',
  },
  CANCELLED: {
    icon: XCircle,
    label: 'Cancelled',
    color: 'text-status-error',
    bgColor: 'bg-status-error/15',
  },
  RTO: {
    icon: RotateCcw,
    label: 'Return to Origin',
    color: 'text-status-warning',
    bgColor: 'bg-status-warning/15',
  },
  EXCEPTION: {
    icon: AlertTriangle,
    label: 'Exception',
    color: 'text-status-error',
    bgColor: 'bg-status-error/15',
  },
  SCAN: {
    icon: Package,
    label: 'Scanned',
    color: 'text-status-info',
    bgColor: 'bg-status-info/15',
  },
};

export interface ShipmentTimelineProps {
  events: TimelineEvent[];
  currentStatus?: ShipmentStatus;
  className?: string;
  compact?: boolean;
  showSource?: boolean;
}

/**
 * ShipmentTimeline - Premium vertical timeline for tracking events
 *
 * @example
 * <ShipmentTimeline events={trackingEvents} currentStatus={ShipmentStatus.IN_TRANSIT} />
 */
export function ShipmentTimeline({
  events,
  currentStatus: _currentStatus,
  className,
  compact = false,
  showSource = false,
}: ShipmentTimelineProps) {
  // Sort events by time (newest first for timeline display)
  const sortedEvents = React.useMemo(() => {
    return [...events].sort((a, b) => {
      const timeA = a.event_time
        ? new Date(a.event_time).getTime()
        : new Date(a.created_at).getTime();
      const timeB = b.event_time
        ? new Date(b.event_time).getTime()
        : new Date(b.created_at).getTime();
      return timeB - timeA;
    });
  }, [events]);

  if (sortedEvents.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center">
            <Package className="size-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">No tracking events available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Timeline line */}
      <div className="absolute left-[15px] top-6 bottom-6 w-px bg-border" aria-hidden="true" />

      {/* Events */}
      <div className="space-y-0">
        {sortedEvents.map((event, index) => {
          const config = TIMELINE_CONFIG[event.event_code] || TIMELINE_CONFIG.SCAN;
          const Icon = config.icon;
          const isLatest = index === 0;
          const isTerminal = ['DELIVERED', 'CANCELLED', 'RTO'].includes(event.event_code);

          const eventDate = event.event_time
            ? new Date(event.event_time)
            : new Date(event.created_at);

          return (
            <div
              key={event.id}
              className={cn('relative flex gap-4 pb-6 last:pb-0', compact && 'pb-4 last:pb-0')}
            >
              {/* Icon */}
              <div
                className={cn(
                  'relative z-10 flex items-center justify-center size-8 shrink-0',
                  'rounded-full border-2 border-background',
                  config.bgColor,
                  isLatest && 'ring-2 ring-ring ring-offset-2 ring-offset-background'
                )}
              >
                <Icon className={cn('size-4', config.color, isTerminal && 'animate-none')} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p
                      className={cn(
                        'font-semibold text-foreground',
                        compact ? 'text-sm' : 'text-base'
                      )}
                    >
                      {config.label}
                    </p>
                    {event.location && (
                      <p className="text-muted-foreground text-sm mt-0.5">{event.location}</p>
                    )}
                    {event.notes && (
                      <p className="text-muted-foreground text-xs mt-1 italic">{event.notes}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
                      {formatDate(eventDate)}
                    </p>
                    <p className="text-muted-foreground text-xs">{formatTime(eventDate)}</p>
                    {showSource && (
                      <p className="text-muted-foreground/60 text-[10px] uppercase mt-1">
                        {event.source}
                      </p>
                    )}
                  </div>
                </div>

                {/* Latest indicator */}
                {isLatest && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                      Current Status
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper functions
function formatDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default ShipmentTimeline;
