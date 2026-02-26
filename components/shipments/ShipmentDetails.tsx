import React from 'react';
import { Shipment } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useTrackingEvents } from '../../hooks/useTrackingEvents';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { STATUS_COLORS } from '../../lib/design-tokens';
import {
  Printer,
  X,
  Clock,
  MapPin,
  Package,
  Scale,
  Truck,
  Plane,
  User,
  Phone,
  Map,
  FileText,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { HUBS } from '../../lib/constants';
import { toast } from 'sonner';
import { NotesPanel } from '../domain/NotesPanel';
import { UniversalBarcodePreset } from '../barcodes';
import { ShipmentStepper } from './ShipmentStepper';

interface Props {
  shipment: Shipment;
  onClose: () => void;
}

// Helper to reliably find hub info
const getHubDetails = (identifier: string) => {
  const hubList = Object.values(HUBS);
  const found = hubList.find(
    (h) => h.code === identifier || h.uuid === identifier || h.id === identifier
  );
  return found || { code: identifier, name: 'External / Unknown', address: '' };
};

export const ShipmentDetails: React.FC<Props> = ({ shipment, onClose }) => {
  const { data: trackingEvents = [] } = useTrackingEvents(shipment.awb);
  const { user } = useAuthStore();

  const handlePrintLabel = () => {
    try {
      const storageKey = `print_shipping_label_${shipment.awb}`;
      localStorage.setItem(storageKey, JSON.stringify(shipment));
      const width = 440;
      const height = 650;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      const popup = window.open(
        `/print/label/${shipment.awb}`,
        'PrintLabel',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
      if (!popup) {
        toast.error('Popup blocked. Please allow popups.');
        return;
      }
      setTimeout(() => localStorage.removeItem(storageKey), 30000);
    } catch (error) {
      console.error('Label error:', error);
      toast.error('Failed to open label');
    }
  };

  const origin = getHubDetails(shipment.originHub);
  const dest = getHubDetails(shipment.destinationHub);
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border p-6 rounded-none shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-none">
            {shipment.mode === 'AIR' ? (
              <Plane className="w-8 h-8 text-primary" />
            ) : (
              <Truck className="w-8 h-8 text-primary" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black tracking-tight font-mono text-foreground">
                {shipment.awb}
              </h2>
              <Badge className={`${STATUS_COLORS[shipment.status]} px-3 py-1 text-xs shadow-sm`}>
                {shipment.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Ref: {shipment.id.slice(0, 8)}...
              </span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Created:{' '}
                {new Date(shipment.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <Button
            onClick={() => navigate(`/tracking?cn=${shipment.awb}`)}
            variant="default"
            className="flex-1 md:flex-none gap-2 shadow-sm"
          >
            <Activity className="w-4 h-4" /> Track Shipment
          </Button>
          <Button
            onClick={handlePrintLabel}
            variant="outline"
            className="flex-1 md:flex-none gap-2 hover:bg-primary/5 hover:text-primary transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Label
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Barcode Section - Scannable for quick identification */}
      <Card className="overflow-hidden border-border/60 shadow-sm">
        <div className="p-6 flex flex-col items-center">
          <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Barcode Scan
          </div>
          <UniversalBarcodePreset value={shipment.awb} preset="screenLarge" className="mb-2" />
          <p className="text-xs text-muted-foreground text-center">
            Scan this barcode to quickly identify and track this shipment
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Route & Tracking */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route Card */}
          <Card className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="p-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                <Map className="w-4 h-4" /> Transit Route
              </h3>

              <div className="relative flex items-center justify-between px-4 py-8">
                {/* Connecting Line */}
                <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20 -translate-y-1/2 z-0" />

                {/* Origin */}
                <div className="relative z-10 text-center bg-card px-4">
                  <div className="w-4 h-4 rounded-none bg-primary ring-4 ring-primary/20 mx-auto mb-4" />
                  <div className="text-2xl font-bold text-foreground">{origin.code}</div>
                  <div className="text-xs font-medium text-muted-foreground mt-1 max-w-[120px] mx-auto truncate">
                    {origin.name}
                  </div>
                </div>

                {/* Mode Icon (Center) */}
                <div className="relative z-10 bg-card px-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-none bg-muted border border-border text-xs font-medium text-foreground shadow-sm">
                    {shipment.mode === 'AIR' ? (
                      <Plane className="w-3.5 h-3.5" />
                    ) : (
                      <Truck className="w-3.5 h-3.5" />
                    )}
                    <span>{shipment.serviceLevel}</span>
                  </div>
                </div>

                {/* Destination */}
                <div className="relative z-10 text-center bg-card px-4">
                  <div className="w-4 h-4 rounded-none bg-foreground ring-4 ring-foreground/10 mx-auto mb-4" />
                  <div className="text-2xl font-bold text-foreground">{dest.code}</div>
                  <div className="text-xs font-medium text-muted-foreground mt-1 max-w-[120px] mx-auto truncate">
                    {dest.name}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-muted/30">
              <div className="p-4 flex flex-col items-center">
                <span className="text-xs text-muted-foreground mb-1">Weight</span>
                <div className="flex items-center gap-1.5 font-mono font-semibold">
                  <Scale className="w-4 h-4 text-primary" />
                  {shipment.totalWeight.chargeable} kg
                </div>
              </div>
              <div className="p-4 flex flex-col items-center">
                <span className="text-xs text-muted-foreground mb-1">Packages</span>
                <div className="flex items-center gap-1.5 font-mono font-semibold">
                  <Package className="w-4 h-4 text-primary" />
                  {shipment.totalPackageCount}
                </div>
              </div>
              <div className="p-4 flex flex-col items-center">
                <span className="text-xs text-muted-foreground mb-1">ETA</span>
                <div className="font-mono font-semibold text-foreground">
                  {shipment.eta || 'TBD'}
                </div>
              </div>
            </div>
          </Card>

          {/* Horizontal Stepper Timeline */}
          <Card className="border-border/60 shadow-sm overflow-hidden p-2">
            <ShipmentStepper currentStatus={shipment.status} events={trackingEvents} />
          </Card>

          {/* Tracking History */}
          <Card className="border-border/60 shadow-sm">
            <div className="p-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Tracking & Events
              </h3>

              <div className="relative pl-2 space-y-8 before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-border/50 before:to-transparent">
                {trackingEvents.length > 0 ? (
                  trackingEvents.map((evt, idx) => (
                    <div key={evt.id} className="relative pl-8 group">
                      <div
                        className={`absolute left-0 top-1.5 w-5 h-5 rounded-none border-2 border-card shadow-sm z-10 
                        ${idx === 0 ? 'bg-primary ring-4 ring-primary/20' : 'bg-muted-foreground/30'}`}
                      />
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                        <span
                          className={`font-semibold text-base ${idx === 0 ? 'text-primary' : 'text-foreground'}`}
                        >
                          {evt.event_code.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {new Date(evt.event_time).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {((evt.meta as Record<string, unknown>)?.description as string) ||
                          'Event recorded'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground bg-muted/50 w-fit px-2 py-1 rounded-none">
                        <MapPin className="w-3 h-3" />
                        {evt.hub?.name || 'Transit'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-none">
                    <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>No tracking events recorded yet.</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Customer & Notes */}
        <div className="space-y-6 overflow-hidden min-w-0">
          {/* Customer Info */}
          <Card className="border-border/60 shadow-sm">
            <div className="p-5 border-b border-border bg-muted/20">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Customer Details
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Name</span>
                <div className="font-medium text-lg text-foreground">{shipment.customerName}</div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Contact
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-mono">{shipment.consignor?.phone || 'N/A'}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Destination Address
                </span>
                <div className="flex items-start gap-2 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {typeof shipment.consignee?.address === 'string'
                      ? shipment.consignee.address
                      : JSON.stringify(shipment.consignee?.address) || 'No address provided'}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-muted/30 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full text-xs h-8">
                View Full Profile <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </Card>

          {/* Notes */}
          <NotesPanel
            entityType="SHIPMENT"
            entityId={shipment.id}
            title="Internal Notes"
            currentUserId={user?.id || 'System'}
            maxHeight="350px"
            className="bg-card border border-border/60 shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};
