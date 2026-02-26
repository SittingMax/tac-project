import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { StatusBadge } from '../components/domain/StatusBadge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { BookingForm } from '../components/portal/BookingForm';
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

interface ShipmentRecord {
  cn_number: string;
  status: string;
  service_level: string;
  mode?: string;
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

export function PublicTracking() {
  const { awb } = useParams<{ awb?: string }>();
  const navigate = useNavigate();
  const [searchAwb, setSearchAwb] = useState(awb || '');

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-tracking', awb],
    queryFn: async (): Promise<TrackingData | null> => {
      if (!awb) return null;

      // Fetch shipment via secure public view (excludes PII)
      const { data: shipment, error: shipmentError } = await (supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('public_shipment_tracking' as any)
        .select(
          `
          *,
          origin_hub:hubs!public_shipment_tracking_origin_hub_id_fkey(code, name),
          destination_hub:hubs!public_shipment_tracking_destination_hub_id_fkey(code, name)
        `
        )
        .eq('cn_number', awb)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .single() as any);

      if (shipmentError) throw shipmentError;

      // Fetch tracking events via secure public view (excludes actor_staff_id, notes, meta)
      const { data: events, error: eventsError } = await (supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('public_tracking_events' as any)
        .select(
          `
          *,
          hub:hubs(code, name)
        `
        )
        .eq('cn_number', awb)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .order('event_time', { ascending: false }) as any);

      if (eventsError) throw eventsError;

      return {
        shipment: shipment as unknown as ShipmentRecord,
        events: (events || []) as unknown as TrackingEventRecord[],
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-gradient-to-br from-status-info to-status-success flex items-center justify-center">
              <Package className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">TAC Cargo</h1>
              <p className="text-xs text-muted-foreground">Track, Book, and Manage Shipments</p>
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
              <Search className="w-4 h-4 mr-2" /> Track
            </TabsTrigger>
            <TabsTrigger
              value="book"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Package className="w-4 h-4 mr-2" /> Book
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <UserCircle className="w-4 h-4 mr-2" /> Account
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="track"
            className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            {/* Search Form */}
            <Card className="p-6 bg-card/50 border-border">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
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
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-none mx-auto mb-4" />
                <p className="text-muted-foreground">Loading tracking information...</p>
              </Card>
            )}

            {/* Error State */}
            {error && (
              <Card className="p-8 text-center bg-card/50 border-border">
                <Package className="w-12 h-12 text-destructive mx-auto mb-4" />
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
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Track Your Shipment</h3>
                <p className="text-muted-foreground">
                  Enter your CN Number above to track your shipment in real-time.
                </p>
              </Card>
            )}

            {/* Tracking Results */}
            {data?.shipment && (
              <div className="space-y-6">
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
                    <StatusBadge status={data.shipment.status} />
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-4 p-4 rounded-none bg-muted/50 mb-6">
                    <div className="text-center">
                      <MapPin className="w-6 h-6 text-status-info mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">
                        {data.shipment.origin_hub?.code || 'IMPHAL'}
                      </p>
                      <p className="text-xs text-muted-foreground">Origin</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="h-0.5 flex-1 bg-border" />
                      {data.shipment.service_level === 'EXPRESS' ? (
                        <Plane className="w-6 h-6 text-status-info mx-2" />
                      ) : (
                        <Truck className="w-6 h-6 text-status-info mx-2" />
                      )}
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="h-0.5 flex-1 bg-border" />
                    </div>
                    <div className="text-center">
                      <MapPin className="w-6 h-6 text-status-success mx-auto mb-1" />
                      <p className="text-lg font-bold text-foreground">
                        {data.shipment.destination_hub?.code || 'NEW_DELHI'}
                      </p>
                      <p className="text-xs text-muted-foreground">Destination</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-none bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Packages</p>
                      <p className="text-lg font-semibold text-foreground">
                        {data.shipment.package_count}
                      </p>
                    </div>
                    <div className="p-3 rounded-none bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Weight</p>
                      <p className="text-lg font-semibold text-foreground">
                        {data.shipment.total_weight} kg
                      </p>
                    </div>
                    <div className="p-3 rounded-none bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Mode</p>
                      <p className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        {data.shipment.mode}
                      </p>
                    </div>
                    <div className="p-3 rounded-none bg-muted/50">
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
                    <Clock className="w-5 h-5 text-status-info" />
                    Tracking History
                  </h3>

                  {data.events.length > 0 ? (
                    <div className="space-y-4">
                      {data.events.map((e, idx) => (
                        <div key={e.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-3 h-3 rounded-none ${idx === 0 ? 'bg-primary' : 'bg-muted-foreground'}`}
                            />
                            {idx < data.events.length - 1 && (
                              <div className="w-0.5 flex-1 bg-border mt-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="font-semibold text-foreground">
                              {e.event_code.replace(/_/g, ' ')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {e.hub?.name || 'System'}
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                              {e.event_time ? new Date(e.event_time).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No tracking events recorded yet.
                    </p>
                  )}
                </Card>

                {/* Support Card - No PII displayed */}
                <Card className="p-6 bg-card/80 border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Need More Details?</h3>
                  <p className="text-muted-foreground mb-4">
                    For complete shipment details including delivery contact information, please
                    contact our support team with your CN Number.
                  </p>
                  <div className="flex items-center gap-2 text-status-info">
                    <Package className="w-4 h-4" />
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
              <div className="w-16 h-16 rounded-none bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Customer Account Access</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Sign in to view your invoice history, manage saved addresses, and download monthly
                statements.
              </p>
              <div className="max-w-xs mx-auto space-y-4">
                <Input placeholder="Customer ID or Email" className="bg-background" />
                <Input type="password" placeholder="Password" className="bg-background" />
                <Button className="w-full">Sign In to Dashboard</Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Need an account?{' '}
                  <a href="#" className="text-primary hover:underline">
                    Contact Sales
                  </a>
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
