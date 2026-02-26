import * as React from 'react';
import { motion } from '@/lib/motion';
import { Plane, Wifi, Battery, Signal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FlightCardProps {
  imageUrl: string;
  airline: string;
  flightCode: string;
  flightClass: string;
  departureCode: string;
  departureCity: string;
  departureTime: string;
  arrivalCode: string;
  arrivalCity: string;
  arrivalTime: string;
  duration: string;
  className?: string;
}

export const FlightCard = React.forwardRef<HTMLDivElement, FlightCardProps>(
  (
    {
      imageUrl,
      airline,
      flightCode,
      flightClass,
      departureCode,
      departureCity,
      departureTime,
      arrivalCode,
      arrivalCity,
      arrivalTime,
      duration,
      className,
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'w-full max-w-xl font-sans rounded-none overflow-hidden shadow-2xl bg-card/40 dark:bg-black/40 border border-border/50 backdrop-blur-md relative group',
          className
        )}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Neon Glow Effect - Enhanced */}
        <div className="absolute -inset-[1px] bg-gradient-to-br from-primary/30 via-transparent to-primary/10 rounded-none opacity-50 blur-lg group-hover:opacity-100 transition-opacity duration-1000" />

        {/* Main Content Wrapper - Darker Glass */}
        <div className="relative bg-background/40 dark:bg-black/40 h-full rounded-none overflow-hidden border border-border/50 backdrop-blur-lg">
          {/* Header / Image Area */}
          <div className="relative h-72 w-full overflow-hidden">
            {/* Replaced Next.js Image with standard img */}
            <img
              src={imageUrl}
              alt="Flight View"
              className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 group-hover:scale-110 transition-transform duration-[20s] sepia-[0.5] hue-rotate-[190deg]"
            />

            {/* Tech Overlays - Scanlines & Vignette */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:4px_4px] z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-0" />

            {/* Status Bar - Premium Pill */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20">
              <div className="flex gap-2">
                <div className="pl-2 pr-3 py-1.5 rounded-none bg-background/80 dark:bg-black/60 border border-status-live/30 text-status-live text-xs font-mono font-bold flex items-center gap-2 backdrop-blur-md shadow-[0_0_15px_color-mix(in_oklch,var(--color-status-live)_20%,transparent)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-status-live opacity-75"></span>
                    <span className="relative inline-flex rounded-none h-2 w-2 bg-status-live shadow-[0_0_5px_var(--color-status-live)]"></span>
                  </span>
                  LIVE TRACKING
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-mono">
                  <Wifi className="h-3 w-3" />
                  <Battery className="h-3 w-3" />
                  <Signal className="h-3 w-3" />
                  <span>SYS_OK</span>
                </div>
              </div>
            </div>

            {/* Flight Path Visual */}
            <div className="absolute bottom-0 left-0 right-0 h-32 px-8 flex items-end justify-between pb-8">
              <div className="text-left z-10">
                <div className="text-xs text-muted-foreground font-mono mb-1">
                  {departureTime} - DEPART
                </div>
                <div className="text-6xl font-bold text-foreground tracking-tighter drop-shadow-lg">
                  {departureCode}
                </div>
                <div className="text-sm font-medium text-primary uppercase tracking-widest">
                  {departureCity}
                </div>
              </div>

              {/* Center Graphic */}
              <div className="flex-1 flex flex-col items-center justify-center pb-4 px-4">
                <div className="w-full flex items-center gap-3 opacity-80">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-foreground/50 to-transparent" />
                  <Plane className="h-6 w-6 text-foreground rotate-90 mx-auto" />
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-foreground/50 to-transparent" />
                </div>
                <div className="mt-2 text-xs font-mono text-muted-foreground bg-background/40 px-2 py-1 rounded-none border border-border backdrop-blur-sm">
                  {duration}
                </div>
              </div>

              <div className="text-right z-10">
                <div className="text-xs text-muted-foreground font-mono mb-1">
                  ARRIVE - {arrivalTime}
                </div>
                <div className="text-6xl font-bold text-foreground tracking-tighter drop-shadow-lg">
                  {arrivalCode}
                </div>
                <div className="text-sm font-medium text-primary uppercase tracking-widest">
                  {arrivalCity}
                </div>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-8 pt-6 bg-card/60 relative">
            {/* Separator */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="grid grid-cols-3 gap-4 text-center">
              <InfoBlock label="AIRCRAFT" value={airline} sub="BOEING 747-8F" />
              <InfoBlock label="PAYLOAD" value={flightCode} sub="5,420 KG" highlight />
              <InfoBlock label="CLASS" value={flightClass} sub="SECURE CRATE" />
            </div>

            {/* Footer Action */}
            <div className="mt-8 pt-6 border-t border-dashed border-border flex justify-between items-center opacity-70 group-hover:opacity-100 transition-opacity">
              <div className="text-[10px] font-mono text-muted-foreground">ID: 99482-ADX-22</div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-1 w-8 bg-foreground/10 rounded-none" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

FlightCard.displayName = 'FlightCard';

const InfoBlock = ({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) => (
  <div className="flex flex-col items-center group/item hover:bg-foreground/5 p-2 rounded-none transition-colors cursor-default">
    <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2 opacity-70">
      {label}
    </span>
    <span
      className={cn(
        'text-lg font-bold font-mono mb-1',
        highlight ? 'text-primary' : 'text-foreground'
      )}
    >
      {value}
    </span>
    <span className="text-[10px] text-muted-foreground/60">{sub}</span>
  </div>
);
