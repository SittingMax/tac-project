import { cn } from '@/lib/utils';
import { Shipment } from '@/types';
import { StatusBadge } from '@/components/domain/status-badge';
import { formatDateShort } from '@/lib/formatters';
import { Package, Plane, Truck, Ship, Clock, ArrowRight, Weight, ChevronRight } from 'lucide-react';

interface ShipmentCardProps {
  shipment: Shipment;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}

const MODE_ICONS: Record<Shipment['mode'], typeof Plane> = {
  AIR: Plane,
  TRUCK: Truck,
  OCEAN: Ship,
};

// Map hub codes to display names (handles both old string format and new code format)
const HUB_CODE_MAP: Record<string, { code: string; name: string }> = {
  // Old string format
  IMPHAL: { code: 'IMF', name: 'Imphal' },
  NEW_DELHI: { code: 'DEL', name: 'New Delhi' },
  // New code format from database
  IMF: { code: 'IMF', name: 'Imphal' },
  DEL: { code: 'DEL', name: 'Delhi' },
  GAU: { code: 'GAU', name: 'Guwahati' },
  CCU: { code: 'CCU', name: 'Kolkata' },
};

const DEFAULT_HUB = { code: 'UNK', name: 'Unknown' };

// Helper to resolve hub display info from various input formats
function getHubDisplay(hub: string | undefined | null): { code: string; name: string } {
  if (!hub) return DEFAULT_HUB;
  return HUB_CODE_MAP[hub] || { code: hub.substring(0, 3).toUpperCase(), name: hub };
}

export function ShipmentCard({ shipment, onClick, className, compact = false }: ShipmentCardProps) {
  const ModeIcon = MODE_ICONS[shipment.mode] || Truck;
  const origin = getHubDisplay(shipment.originHub);
  const dest = getHubDisplay(shipment.destinationHub);

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'flex items-center gap-4 p-4 rounded-md border border-white/5 bg-card/50 hover:bg-card hover:border-primary/30 transition cursor-pointer group',
          className
        )}
      >
        <div className="p-2 rounded-md bg-primary/10">
          <Package size={16} strokeWidth={1.5} className="text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-foreground text-sm">{shipment.awb}</span>
            <StatusBadge status={shipment.status} size="sm" />
          </div>
          <p className="text-xs text-muted-foreground truncate">{shipment.customerName}</p>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-medium">{origin.code}</span>
          <ArrowRight size={12} strokeWidth={1.5} />
          <span className="font-medium">{dest.code}</span>
        </div>

        <ChevronRight size={16} strokeWidth={1.5} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-md border border-white/10 bg-card/80 backdrop-blur-sm p-4 transition hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer group',
        className
      )}
    >
      {/* Mode indicator strip */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1',
          shipment.mode === 'AIR' ? 'bg-primary' : 'bg-status-in-transit'
        )}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'p-2.5 rounded-md',
              shipment.mode === 'AIR' ? 'bg-primary/10' : 'bg-status-in-transit/20'
            )}
          >
            <ModeIcon
              className={cn(
                'w-5 h-5',
                shipment.mode === 'AIR' ? 'text-primary' : 'text-status-in-transit'
              )}
            />
          </div>
          <div>
            <h3 className="font-mono font-bold text-foreground text-lg tracking-wide">
              {shipment.awb}
            </h3>
            <p className="text-sm text-muted-foreground">{shipment.customerName}</p>
          </div>
        </div>
        <StatusBadge status={shipment.status} />
      </div>

      {/* Route */}
      <div className="flex items-center justify-between bg-card/50 rounded-md p-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{origin.code}</p>
          <p className="text-xs text-muted-foreground">{origin.name}</p>
        </div>

        <div className="flex-1 flex items-center justify-center gap-2 px-4">
          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
          <ModeIcon size={16} strokeWidth={1.5} className="text-muted-foreground" />
          <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
        </div>

        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{dest.code}</p>
          <p className="text-xs text-muted-foreground">{dest.name}</p>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Package size={16} strokeWidth={1.5} className="text-muted-foreground" />
          <span className="text-muted-foreground">
            {shipment.totalPackageCount} {shipment.totalPackageCount === 1 ? 'pkg' : 'pkgs'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Weight size={16} strokeWidth={1.5} className="text-muted-foreground" />
          <span className="text-muted-foreground">{shipment.totalWeight.chargeable} kg</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} strokeWidth={1.5} className="text-muted-foreground" />
          <span className="text-muted-foreground">
            {formatDateShort(shipment.createdAt)}
          </span>
        </div>
      </div>

      {/* Service Level Badge */}
      <div className="absolute top-4 right-4">
        <span
          className={cn(
            'text-xs font-bold px-2 py-0.5 rounded-md',
            shipment.serviceLevel === 'EXPRESS' ? 'IN_TRANSIT' : 'bg-muted text-muted-foreground'
          )}
        >
          {shipment.serviceLevel}
        </span>
      </div>
    </div>
  );
}
