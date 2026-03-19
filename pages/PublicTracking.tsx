import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import { HUBS } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/domain/status-badge';
import { ShipmentTimeline } from '@/components/domain/shipment-timeline';
import { ShipmentStatus } from '@/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BookingForm } from '@/components/portal/BookingForm';
import {
  Package,
  Search,
  MapPin,
  Truck,
  Plane,
  Clock,
  ArrowRight,
  UserCircle,
  Receipt,
} from 'lucide-react';
import { AppIcon } from '@/components/ui-core';

interface ShipmentRecord {
  cn_number: string;
  status: string;
  service_level: string;
  mode?: string;
  origin_hub_id?: string | null;
  destination_hub_id?: string | null;
  package_count: number;
  total_weight: number;
  // PII removed: consignee_name, consignee_phone are not exposed in public view
  origin_hub?: { code: string; name: string } | null;
  destination_hub?: { code: string; name: string } | null;
}

interface TrackingEventRecord {
  id: string;
  event_code: string;
  event_time: string | null;
  hub?: { code: string; name: string } | null;
}

interface TrackingData {
  shipment: ShipmentRecord;
  events: TrackingEventRecord[];
}

type PublicHubRecord = {
  code: string | null;
  name: string | null;
};

type PublicHubRelation = PublicHubRecord[] | PublicHubRecord | null;

type PublicShipmentViewRow = Database['public']['Views']['public_shipment_tracking']['Row'] & {
  origin_hub?: PublicHubRelation;
  destination_hub?: PublicHubRelation;
};

type PublicTrackingEventViewRow = Database['public']['Views']['public_tracking_events']['Row'] & {
  hub?: PublicHubRelation;
};

const mapPublicHub = (hub?: PublicHubRelation): { code: string; name: string } | null => {
  const normalizedHub = Array.isArray(hub) ? hub[0] : hub;
  if (!normalizedHub?.code) {
    return null;
  }

  return {
    code: normalizedHub.code,
    name: normalizedHub.name ?? normalizedHub.code,
  };
};

const mapShipmentRecord = (shipment: PublicShipmentViewRow): ShipmentRecord => ({
  cn_number: shipment.cn_number ?? '',
  status: shipment.status ?? 'CREATED',
  service_level: shipment.service_level ?? 'STANDARD',
  mode: shipment.mode ?? undefined,
  origin_hub_id: shipment.origin_hub_id,
  destination_hub_id: shipment.destination_hub_id,
  package_count: shipment.package_count ?? 0,
  total_weight: shipment.total_weight ?? 0,
  origin_hub: mapPublicHub(shipment.origin_hub),
  destination_hub: mapPublicHub(shipment.destination_hub),
});

const mapTrackingEventRecord = (event: PublicTrackingEventViewRow): TrackingEventRecord => ({
  id: event.id ?? '',
  event_code: event.event_code ?? '',
  event_time: event.event_time,
  hub: mapPublicHub(event.hub),
});

const resolveHubCode = (hub?: { code: string; name: string } | null, hubId?: string | null) => {
  if (hub?.code) {
    return hub.code;
  }

  if (!hubId) {
    return 'UNKNOWN';
  }

  const matchedHub = Object.values(HUBS).find(
    (entry) => entry.uuid === hubId || entry.id === hubId
  );
  return matchedHub?.code ?? 'UNKNOWN';
};

export function PublicTracking() {
  const { awb } = useParams<{ awb?: string }>();
  const navigate = useNavigate();
  const [searchAwb, setSearchAwb] = useState(awb || '');

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-tracking', awb],
    queryFn: async (): Promise<TrackingData | null> => {
      if (!awb) return null;

      // Fetch shipment via secure public view (excludes PII)
      const shipmentQuery = supabase
        .from('public_shipment_tracking')
        .select(
          `
          *,
          origin_hub:hubs!public_shipment_tracking_origin_hub_id_fkey(code, name),
          destination_hub:hubs!public_shipment_tracking_destination_hub_id_fkey(code, name)
        `
        )
        .eq('cn_number', awb)
        .limit(1);
      const { data: shipmentData, error: shipmentError } = await shipmentQuery.maybeSingle();

      if (shipmentError) throw shipmentError;
      if (!shipmentData) return null;

      const shipment = shipmentData as PublicShipmentViewRow;

      // Fetch tracking events via secure public view (excludes actor_staff_id, notes, meta)
      const eventsQuery = supabase
        .from('public_tracking_events')
        .select(
          `
          *,
          hub:hubs(code, name)
        `
        )
        .eq('cn_number', awb)
        .order('event_time', { ascending: false });
      const { data: eventsData, error: eventsError } = await eventsQuery;

      if (eventsError) throw eventsError;
      const events = (eventsData ?? []) as PublicTrackingEventViewRow[];

      return {
        shipment: mapShipmentRecord(shipment),
        events: events.map(mapTrackingEventRecord),
      };
    },
    enabled: !!awb,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAwb.trim()) {
      navigate(`/track/${searchAwb.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background dark">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-status-info to-status-success flex items-center justify-center">
              <AppIcon icon={Package} size={24} className="text-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">TAC Cargo</h1>
              <p className="text-xs text-muted-foreground">
                Track shipments, request bookings, and reach support
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue={awb ? 'track' : 'book'} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8 bg-card/50 border border-border">
            <TabsTrigger
              value="track"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <AppIcon icon={Search} size={16} className="mr-2" /> Track
            </TabsTrigger>
            <TabsTrigger
              value="book"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <AppIcon icon={Package} size={16} className="mr-2" /> Book
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <AppIcon icon={UserCircle} size={16} className="mr-2" /> Account
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="track"
            className="mt-0 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            {/* Search Form */}
            <Card className="p-6 bg-card/50 border-border">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1 relative">
                  <AppIcon
                    icon={Search}
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    value={searchAwb}
                    onChange={(e) => setSearchAwb(e.target.value)}
                    placeholder="Enter CN Number (e.g., TAC2026000001)"
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Track
                </Button>
              </form>
            </Card>

            {/* Loading State */}
            {isLoading && (
              <Card className="p-8 text-center bg-card/50 border-border">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Loading tracking information...</p>
              </Card>
            )}

            {/* Error State */}
            {error && (
              <Card className="p-8 text-center bg-card/50 border-border">
                <AppIcon
                  icon={Package}
                  size={32}
                  className="text-destructive mx-auto w-12 h-12 mb-4"
                />
                <h3 className="text-lg font-semibold text-foreground mb-2">Shipment Not Found</h3>
                <p className="text-muted-foreground">
                  We couldn't find a shipment with AWB:{' '}
                  <span className="font-mono text-primary">{awb}</span>
                </p>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  Please check the CN Number and try again.
                </p>
              </Card>
            )}

            {/* No AWB State */}
            {!awb && !isLoading && (
              <Card className="p-8 text-center bg-card/50 border-border">
                <AppIcon
                  icon={Search}
                  size={32}
                  className="text-muted-foreground mx-auto w-12 h-12 mb-4"
                />
                <h3 className="text-lg font-semibold text-foreground mb-2">Track Your Shipment</h3>
                <p className="text-muted-foreground">
                  Enter your CN Number above to track your shipment in real-time.
                </p>
              </Card>
            )}

            {/* Tracking Results */}
            {data?.shipment && (
              <div className="flex flex-col gap-6">
                {/* Shipment Overview */}
                <Card className="p-6 bg-card/80 border-border">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        CN Number
                      </p>
                      <h2 className="text-2xl font-mono font-bold text-status-info">
                        {data.shipment.cn_number}
                      </h2>
                    </div>
                    <StatusBadge status={data.shipment.status as ShipmentStatus} />
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-4 p-4 rounded-md bg-muted/50 mb-6">
                    <div className="text-center">
                      <AppIcon icon={MapPin} size={24} className="text-status-info mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">
                        {resolveHubCode(data.shipment.origin_hub, data.shipment.origin_hub_id)}
                      </p>
                      <p className="text-xs text-muted-foreground">Origin</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="h-0.5 flex-1 bg-border" />
                      {data.shipment.service_level === 'EXPRESS' ? (
                        <AppIcon icon={Plane} size={24} className="text-status-info mx-2" />
                      ) : (
                        <AppIcon icon={Truck} size={24} className="text-status-info mx-2" />
                      )}
                      <AppIcon icon={ArrowRight} size={16} className="text-muted-foreground" />
                      <div className="h-0.5 flex-1 bg-border" />
                    </div>
                    <div className="text-center">
                      <AppIcon
                        icon={MapPin}
                        size={24}
                        className="text-status-success mx-auto mb-1"
                      />
                      <p className="text-lg font-bold text-foreground">
                        {resolveHubCode(
                          data.shipment.destination_hub,
                          data.shipment.destination_hub_id
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">Destination</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Packages</p>
                      <p className="text-lg font-semibold text-foreground">
                        {data.shipment.package_count}
                      </p>
                    </div>
                    <div className="p-4 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Weight</p>
                      <p className="text-lg font-semibold text-foreground">
                        {data.shipment.total_weight} kg
                      </p>
                    </div>
                    <div className="p-4 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Mode</p>
                      <p className="text-lg font-semibold text-foreground flex items-center gap-2">
                        {String(data.shipment.mode || '')
                          .toUpperCase()
                          .includes('AIR') ? (
                          <AppIcon icon={Plane} size={16} />
                        ) : (
                          <AppIcon icon={Truck} size={16} />
                        )}
                        {data.shipment.mode}
                      </p>
                    </div>
                    <div className="p-4 rounded-md bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Service</p>
                      <p className="text-lg font-semibold text-foreground">
                        {data.shipment.service_level}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Tracking Timeline */}
                <Card className="p-6 bg-card/80 border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <AppIcon icon={Clock} size={20} className="text-status-info" />
                    Tracking History
                  </h3>

                  <ShipmentTimeline
                    events={data.events.map((e) => ({
                      id: e.id,
                      event_code: e.event_code,
                      event_time: e.event_time,
                      location: e.hub?.name || null,
                      notes: null,
                      source: 'SCAN',
                      created_at: e.event_time || new Date().toISOString(),
                    }))}
                    currentStatus={data.shipment.status as ShipmentStatus}
                    compact={false}
                  />
                </Card>

                {/* Support Card - No PII displayed */}
                <Card className="p-6 bg-card/80 border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Need More Details?</h3>
                  <p className="text-muted-foreground mb-4">
                    For complete shipment details including delivery contact information, please
                    contact our support team with your CN Number.
                  </p>
                  <div className="flex items-center gap-2 text-status-info">
                    <AppIcon icon={Package} size={16} />
                    <span className="font-mono">{data.shipment.cn_number}</span>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="book"
            className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <BookingForm />
          </TabsContent>

          <TabsContent
            value="account"
            className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <Card className="p-12 text-center bg-card/50 border-border">
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <AppIcon icon={Receipt} size={32} className="text-primary w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Portal Access & Support</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Dashboard sign-in is available for TAC operations staff. For invoice history,
                statements, or account assistance, contact our team and share your CN Number.
              </p>
              <div className="max-w-xs mx-auto flex flex-col gap-3">
                <Button className="w-full" onClick={() => navigate('/login')}>
                  Sign In to Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    window.location.assign('/#contact');
                  }}
                >
                  Contact Sales
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Use tracking and booking above for public self-service workflows.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© 2026 TAC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
