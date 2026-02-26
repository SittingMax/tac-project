'use client';

import { motion } from '@/lib/motion';
import { Plane, Wifi, Battery, Signal, Calendar, MapPin, Truck, LucideIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrackingData } from '@/lib/tracking-service';

interface TrackingResultCardProps {
  data: TrackingData;
  className?: string;
  onClose?: () => void;
}

export function TrackingResultCard({ data, className, onClose }: TrackingResultCardProps) {
  const { shipment, events } = data;
  const latestEvent = events[0];

  return (
    <motion.div
      className={cn(
        'w-full font-sans rounded-none overflow-hidden shadow-2xl bg-card dark:bg-black/40 border border-border dark:border-border/50 backdrop-blur-lg relative group',
        className
      )}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Neon Glow Effect */}
      <div className="absolute -inset-[1px] bg-gradient-to-br from-primary/30 via-transparent to-secondary/10 rounded-none opacity-50 blur-lg pointer-events-none" />

      {/* Main Content Wrapper */}
      <div className="relative h-full rounded-none overflow-hidden border border-border/20 bg-card/10">
        {/* Header Status Bar */}
        <div className="absolute top-0 left-0 right-0 h-16 border-b border-border/20 flex justify-between items-center px-6 bg-muted/20 dark:bg-black/20 z-20">
          <div className="flex gap-2">
            <div className="pl-2 pr-3 py-1 rounded-none bg-status-live/10 border border-status-live/20 text-status-live text-[10px] font-mono font-bold flex items-center gap-2 backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-status-live opacity-75"></span>
                <span className="relative inline-flex rounded-none h-1.5 w-1.5 bg-status-live"></span>
              </span>
              LIVE_TRACKING
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground/50 text-[10px] font-mono">
              <Wifi className="h-3 w-3" />
              <Battery className="h-3 w-3" />
              <Signal className="h-3 w-3" />
              <span>SYS_OK</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Map Visualization Area (Abstract) */}
        <div className="relative h-48 w-full overflow-hidden bg-muted/20 dark:bg-black/40 mt-16">
          {/* Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

          {/* Flight Path Graphic */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full px-12 flex items-center justify-between opacity-80">
              <div className="flex flex-col items-center gap-2">
                <div className="w-3 h-3 rounded-none bg-muted-foreground/50" />
                <span className="text-[10px] font-mono text-muted-foreground">
                  {shipment.origin}
                </span>
              </div>
              <div className="flex-1 h-[2px] bg-gradient-to-r from-muted-foreground/20 via-primary to-muted-foreground/20 relative mx-4">
                <motion.div
                  initial={{ x: '-40%' }}
                  animate={{ x: '40%' }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute top-1/2 -translate-y-1/2 left-1/2"
                >
                  {shipment.mode === 'AIR' ? (
                    <Plane className="w-5 h-5 text-primary fill-primary/20 rotate-90" />
                  ) : (
                    <Truck className="w-5 h-5 text-primary fill-primary/20" />
                  )}
                </motion.div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-3 h-3 rounded-none bg-primary shadow-[0_0_10px_var(--primary)]" />
                <span className="text-[10px] font-mono text-primary font-bold">
                  {shipment.destination}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="p-6 relative">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <InfoBlock label="CN REF" value={shipment.reference} />
            <InfoBlock label="STATUS" value={shipment.status.replace(/_/g, ' ')} highlight />
            <InfoBlock label="DESTINATION" value={shipment.destination} icon={Calendar} />
            <InfoBlock
              label="CARRIER"
              value={shipment.mode === 'AIR' ? 'WGS Air Freight' : 'WGS Surface Express'}
              icon={shipment.mode === 'AIR' ? Plane : Truck}
            />
          </div>

          {/* Latest Event */}
          <div className="rounded-none bg-muted/20 dark:bg-white/5 border border-border/20 dark:border-white/5 p-4">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] uppercase text-muted-foreground font-mono">
                Latest Event
              </span>
              <span className="text-[10px] text-muted-foreground/70">
                {latestEvent ? new Date(latestEvent.created_at).toLocaleString() : 'No updates'}
              </span>
            </div>
            <div className="text-sm font-medium text-foreground">{latestEvent?.description}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" /> {shipment.consignee_city || 'In Transit'}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const InfoBlock = ({
  label,
  value,
  highlight,
  icon: Icon,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  icon?: LucideIcon;
}) => (
  <div className="flex flex-col">
    <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1 font-bold">
      {label}
    </span>
    <div
      className={cn(
        'text-sm font-bold font-mono flex items-center gap-2',
        highlight ? 'text-primary' : 'text-foreground'
      )}
    >
      {Icon && <Icon className="w-3 h-3 opacity-70" />}
      {value}
    </div>
  </div>
);
