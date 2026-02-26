import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { TrackingTimeline } from '../components/domain/TrackingTimeline';
import { StatusBadge } from '../components/domain/StatusBadge';
import { ShipmentCard } from '../components/domain/ShipmentCard';
import { Search, MapPin, Truck, Package, Plane } from 'lucide-react';
import { useShipmentByAWB } from '../hooks/useShipments';
import { useTrackingEvents } from '../hooks/useTrackingEvents';
import { useRealtimeTracking } from '../hooks/useRealtime';
import { Shipment, TrackingEvent } from '../types';
import { HUBS } from '../lib/constants';

export const Tracking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [trackId, setTrackId] = useState('');
  const [searchAwb, setSearchAwb] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Supabase queries
  const {
    data: shipmentData,
    isLoading: shipmentLoading,
    error: shipmentError,
  } = useShipmentByAWB(searchAwb);
  const { data: eventsData, isLoading: eventsLoading } = useTrackingEvents(searchAwb);

  // Enable realtime updates for this AWB
  useRealtimeTracking(searchAwb ?? undefined);

  // Map Supabase data to legacy format for existing components
  const result = shipmentData
    ? {
        shipment: {
          id: shipmentData.id,
          awb: shipmentData.cn_number,
          status: shipmentData.status,
          mode: shipmentData.mode,
          originHub: shipmentData.origin_hub?.code || 'ORIGIN',
          destinationHub: shipmentData.destination_hub?.code || 'DEST',
          eta: 'TBD',
          consigneeName: shipmentData.consignee_name,
          consigneePhone: shipmentData.consignee_phone,
          weight: shipmentData.total_weight,
          pieces: shipmentData.package_count,
        } as unknown as Shipment,
        events: (eventsData || []).map((e) => ({
          id: e.id,
          shipmentId: e.shipment_id,
          awb: shipmentData?.cn_number || '',
          timestamp: e.event_time || e.created_at,
          status: e.event_code,
          eventCode: e.event_code,
          location: e.hub?.name || e.location || '',
          description: e.notes || `Status: ${e.event_code}`,
          actorId: e.actor_staff_id || '',
        })) as unknown as TrackingEvent[],
      }
    : null;

  const handleTrack = () => {
    if (trackId.trim()) {
      setError('');
      setSearchAwb(trackId.trim().toUpperCase());
    }
  };

  useEffect(() => {
    if (shipmentError) {
      setError('Shipment not found. Please check the CN.');
    }
  }, [shipmentError]);

  useEffect(() => {
    const awbParam =
      searchParams.get('cn') || searchParams.get('awb') || searchParams.get('CN Number');
    if (awbParam) {
      setTrackId(awbParam);
      setSearchAwb(awbParam.toUpperCase());
    }
  }, [searchParams]);

  const isLoading = shipmentLoading || eventsLoading;
  void isLoading; // Used in UI below

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-24">
      <div className="flex justify-between items-end border-b border-border/40 pb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground flex items-center gap-2.5">
            Live Tracking<span className="text-primary">.</span>
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-2">
            Public visibility portal
          </p>
        </div>
      </div>

      {/* Search Area */}
      <Card className="max-w-3xl mx-auto p-12 rounded-none border-border bg-background">
        <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4 block flex items-center gap-2">
          <Search className="w-3 h-3" />
          Query Reference ID
        </label>
        <div className="flex gap-0">
          <div className="relative flex-1">
            <Input
              placeholder="ENTER CN (E.G., TAC2026...)"
              className="h-14 text-lg font-mono uppercase rounded-none border-r-0"
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
            />
          </div>
          <Button
            size="lg"
            className="px-12 rounded-none font-mono uppercase text-xs tracking-widest"
            onClick={handleTrack}
          >
            Execute
          </Button>
        </div>
        {error && (
          <div className="text-status-error mt-4 text-left text-xs font-mono uppercase tracking-widest bg-status-error/10 p-2 border border-status-error/20 inline-block">
            {error}
          </div>
        )}
      </Card>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline */}
          <Card className="lg:col-span-1 p-8 rounded-none border-border">
            <div className="mb-12">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4">
                Current Status
              </div>
              <StatusBadge status={result.shipment.status} size="lg" />
            </div>

            <h3 className="text-xl font-bold uppercase tracking-tight text-foreground mb-8">
              Journey Audit
            </h3>
            <TrackingTimeline events={result.events} />
          </Card>

          {/* Map & Shipment Details */}
          <Card className="lg:col-span-2 relative overflow-hidden min-h-[400px] bg-background">
            <div className="absolute inset-0 opacity-20 tracking-map-pattern"></div>

            {/* Route Visualization */}
            <div className="absolute inset-0">
              <div className="absolute top-1/2 left-1/4 -translate-y-1/2 text-center">
                <div className="w-6 h-6 rounded-none bg-status-info mx-auto mb-2 flex items-center justify-center">
                  <Package className="w-3 h-3 text-primary-foreground" />
                </div>
                <span className="text-xs font-bold text-foreground bg-background/70 backdrop-blur-sm px-2 py-1 rounded-none">
                  {HUBS[result.shipment.originHub]?.code || 'ORIGIN'}
                </span>
              </div>

              <div className="absolute top-1/2 right-1/4 -translate-y-1/2 text-center">
                <div className="w-6 h-6 rounded-none bg-status-success mx-auto mb-2 flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-primary-foreground" />
                </div>
                <span className="text-xs font-bold text-foreground bg-background/70 backdrop-blur-sm px-2 py-1 rounded-none">
                  {HUBS[result.shipment.destinationHub]?.code || 'DEST'}
                </span>
              </div>

              {/* Route line */}
              <div className="absolute top-1/2 left-[28%] right-[28%] h-1 rounded-none tracking-route-gradient"></div>

              {/* Moving vehicle indicator */}
              {result.shipment.status === 'IN_TRANSIT' && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-card border-2 border-primary p-3 rounded-none shadow-lg animate-pulse">
                  <div className="flex items-center gap-2">
                    {result.shipment.mode === 'AIR' ? (
                      <Plane className="w-5 h-5 text-status-info" />
                    ) : (
                      <Truck className="w-5 h-5 text-status-warning" />
                    )}
                    <div>
                      <span className="text-sm font-bold text-foreground font-mono">
                        {result.shipment.awb}
                      </span>
                      <div className="text-xs text-muted-foreground">In Transit</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ETA Badge */}
            <div className="absolute top-4 right-4 text-right">
              <div className="bg-background/70 backdrop-blur px-3 py-2 rounded-none border border-border">
                <div className="text-xs text-muted-foreground">Estimated Arrival</div>
                <div className="text-lg font-bold text-foreground font-mono">
                  {result.shipment.eta}
                </div>
              </div>
            </div>

            {/* Shipment Summary */}
            <div className="absolute bottom-4 left-4 right-4">
              <ShipmentCard shipment={result.shipment} compact />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
