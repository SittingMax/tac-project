import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { TrackingEvent, HubLocation } from '@/types';
import {
  Package,
  Truck,
  MapPin,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  Building2,
} from 'lucide-react';

interface TrackingTimelineProps {
  events: TrackingEvent[];
  className?: string;
}

const EVENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CREATED: Package,
  PICKUP_SCHEDULED: Clock,
  PICKED_UP: Truck,
  RECEIVED_AT_ORIGIN: Building2,
  IN_TRANSIT: Truck,
  RECEIVED_AT_DEST: Building2,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: AlertTriangle,
  RTO: ArrowRight,
  EXCEPTION: AlertTriangle,
  DEFAULT: Clock,
};

/**
 * Event colors using semantic status tokens from globals.css
 * These reference CSS custom properties for consistent theming
 */
const EVENT_COLORS: Record<string, string> = {
  CREATED: 'bg-status-created',
  PICKUP_SCHEDULED: 'bg-status-created',
  PICKED_UP: 'bg-status-manifested',
  RECEIVED_AT_ORIGIN: 'bg-status-manifested',
  IN_TRANSIT: 'bg-status-in-transit',
  RECEIVED_AT_DEST: 'bg-status-arrived',
  OUT_FOR_DELIVERY: 'bg-status-in-transit',
  DELIVERED: 'bg-status-delivered',
  CANCELLED: 'bg-status-exception',
  RTO: 'bg-status-exception',
  EXCEPTION: 'bg-status-exception',
  DEFAULT: 'bg-muted',
};

const HUB_NAMES: Record<HubLocation, string> = {
  IMPHAL: 'Imphal Hub',
  NEW_DELHI: 'New Delhi Hub',
};

export function TrackingTimeline({ events, className }: TrackingTimelineProps) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className={cn('space-y-0', className)}>
      {sortedEvents.map((event, index) => {
        const Icon = EVENT_ICONS[event.eventCode] || EVENT_ICONS.DEFAULT;
        const color = EVENT_COLORS[event.eventCode] || EVENT_COLORS.DEFAULT;
        const isFirst = index === 0;
        const isLast = index === sortedEvents.length - 1;

        return (
          <div key={event.id} className="relative flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-none flex items-center justify-center z-10 border-2 border-background',
                  color,
                  isFirst && 'ring-4 ring-opacity-30',
                  isFirst && color.replace('bg-', 'ring-')
                )}
              >
                <Icon className="w-5 h-5 text-primary-foreground" />
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 bg-gradient-to-b from-border to-muted min-h-[40px]" />
              )}
            </div>

            {/* Event content */}
            <div className={cn('flex-1 pb-8', isFirst && 'pt-0', !isFirst && 'pt-1')}>
              <div
                className={cn(
                  'rounded-none p-4 transition-all',
                  isFirst ? 'bg-card border border-white/10' : 'bg-transparent'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p
                      className={cn(
                        'font-semibold',
                        isFirst ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {event.description || event.eventCode.replace(/_/g, ' ')}
                    </p>
                    {event.hubId && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {HUB_NAMES[event.hubId]}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.timestamp), 'dd MMM yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {format(new Date(event.timestamp), 'HH:mm')}
                    </p>
                  </div>
                </div>

                {event.meta && Object.keys(event.meta).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <p className="text-xs text-muted-foreground">{JSON.stringify(event.meta)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
