import { MapPin } from 'lucide-react';
import { SummaryCard } from './summary-card';

interface RouteCardProps {
  origin: string;
  destination: string;
  mode?: string;
  flightNumber?: string;
}

/**
 * Standardized card for displaying shipment/manifest routing.
 */
export function RouteCard({ origin, destination, mode, flightNumber }: RouteCardProps) {
  return (
    <SummaryCard title="Route" icon={MapPin}>
      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="text-center flex-1">
          <div className="text-2xl font-bold tracking-tight">{origin}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
            Origin
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 text-muted-foreground text-xs">
          <div className="h-px w-10 bg-border" />
          {mode && <span className="text-[10px] font-medium tracking-wide">{mode}</span>}
          {flightNumber && <span className="text-[10px] font-mono">{flightNumber}</span>}
        </div>
        <div className="text-center flex-1">
          <div className="text-2xl font-bold tracking-tight">{destination}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
            Destination
          </div>
        </div>
      </div>
    </SummaryCard>
  );
}
