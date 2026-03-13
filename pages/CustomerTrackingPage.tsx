/**
 * CustomerTrackingPage
 * Public-facing tracking page with clean URL: /track/[cn_number]
 * Features: Timeline, QR code, share, print-friendly view
 */

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/domain/status-badge';
import { ShipmentTimeline } from '@/components/domain/shipment-timeline';
import { QRCodeSVG } from 'qrcode.react';
import {
  Package,
  Search,
  MapPin,
  Truck,
  Plane,
  ArrowRight,
  Clock,
  Weight,
  Hash,
  Share2,
  Printer,
  Download,
  Calendar,
  Phone,
  Mail,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { ShipmentStatus } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TrackingData {
  shipment: {
    id: string;
    cn_number: string;
    status: ShipmentStatus;
    service_level: string;
    mode: string;
    package_count: number;
    total_weight: number;
    origin_hub: { code: string; name: string } | null;
    destination_hub: { code: string; name: string } | null;
    created_at: string;
  };
  events: Array<{
    id: string;
    event_code: string;
    event_time: string | null;
    hub: { code: string; name: string } | null;
    location: string | null;
    created_at: string;
  }>;
  estimated_delivery?: string;
}

export function CustomerTrackingPage() {
  const { cnNumber } = useParams<{ cnNumber: string }>();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(cnNumber || '');
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Fetch tracking data
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-tracking', cnNumber],
    queryFn: async (): Promise<TrackingData | null> => {
      if (!cnNumber) return null;

      // Fetch shipment from public view
      const { data: shipment, error: shipmentError } = await supabase
        .from('public_shipment_tracking')
        .select(
          `*
        `
        )
        .eq('cn_number', cnNumber)
        .maybeSingle();

      if (shipmentError) throw shipmentError;
      if (!shipment) return null;

      // Fetch hub info separately
      let originHub = null;
      let destinationHub = null;

      if (shipment.origin_hub_id) {
        const { data: hub } = await supabase
          .from('hubs')
          .select('code, name')
          .eq('id', shipment.origin_hub_id)
          .single();
        originHub = hub;
      }

      if (shipment.destination_hub_id) {
        const { data: hub } = await supabase
          .from('hubs')
          .select('code, name')
          .eq('id', shipment.destination_hub_id)
          .single();
        destinationHub = hub;
      }

      // Fetch tracking events
      const { data: events, error: eventsError } = await supabase
        .from('public_tracking_events')
        .select(
          `
          *,
          hub:hubs(code, name)
        `
        )
        .eq('cn_number', cnNumber)
        .order('event_time', { ascending: false });

      if (eventsError) throw eventsError;

      // Calculate estimated delivery (simplified)
      const estimatedDelivery = calculateEstimatedDelivery(
        (shipment.status || 'CREATED') as ShipmentStatus,
        shipment.created_at || new Date().toISOString(),
        shipment.service_level || 'STANDARD'
      );

      return {
        shipment: {
          id: shipment.id!,
          cn_number: shipment.cn_number!,
          status: (shipment.status || 'CREATED') as ShipmentStatus,
          service_level: shipment.service_level || 'STANDARD',
          mode: shipment.mode || 'SURFACE',
          package_count: shipment.package_count || 0,
          total_weight: shipment.total_weight || 0,
          origin_hub: originHub,
          destination_hub: destinationHub,
          created_at: shipment.created_at || new Date().toISOString(),
        },
        events: (events || []) as TrackingData['events'],
        estimated_delivery: estimatedDelivery,
      };
    },
    enabled: !!cnNumber,
  });

  // Copy tracking URL
  const handleCopyLink = () => {
    const url = `${window.location.origin}/track/${cnNumber}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Share functionality
  const handleShare = async () => {
    const url = `${window.location.origin}/track/${cnNumber}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Track Shipment ${cnNumber}`,
          text: `Track your shipment ${cnNumber} with TAC Cargo`,
          url,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      handleCopyLink();
    }
  };

  // Print functionality
  const handlePrint = () => {
    window.print();
  };

  // Get transport icon
  const TransportIcon = data?.shipment.mode === 'AIR' ? Plane : Truck;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10 print:static">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Package className="size-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">TAC Cargo</h1>
                <p className="text-xs text-muted-foreground">Shipment Tracking</p>
              </div>
            </Link>

            {/* Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchInput.trim()) {
                  navigate(`/track/${encodeURIComponent(searchInput.trim())}`);
                }
              }}
              className="hidden sm:flex items-center gap-2"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter CN Number"
                  className="pl-9 w-48"
                />
              </div>
              <Button type="submit" size="sm">
                Track
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 print:py-4">
        {/* Loading State */}
        {isLoading && (
          <Card className="p-12 text-center">
            <div className="animate-spin size-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading tracking information...</p>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-12 text-center">
            <AlertTriangle className="size-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Tracking</h2>
            <p className="text-muted-foreground mb-4">
              There was an error loading the tracking information.
            </p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </Card>
        )}

        {/* Not Found State */}
        {!isLoading && !error && !data && cnNumber && (
          <Card className="p-12 text-center">
            <Package className="size-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Shipment Not Found</h2>
            <p className="text-muted-foreground mb-4">
              We couldn't find a shipment with CN Number{' '}
              <span className="font-mono font-bold">{cnNumber}</span>
            </p>
            <p className="text-sm text-muted-foreground/70 mb-6">
              Please check the CN Number and try again, or contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter CN Number"
                className="max-w-xs"
              />
              <Button
                onClick={() => {
                  if (searchInput.trim()) {
                    navigate(`/track/${encodeURIComponent(searchInput.trim())}`);
                  }
                }}
              >
                Track
              </Button>
            </div>
          </Card>
        )}

        {/* No CN Number State */}
        {!cnNumber && (
          <Card className="p-12 text-center">
            <Search className="size-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Track Your Shipment</h2>
            <p className="text-muted-foreground mb-6">
              Enter your CN Number to track your shipment in real-time.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchInput.trim()) {
                  navigate(`/track/${encodeURIComponent(searchInput.trim())}`);
                }
              }}
              className="flex flex-col sm:flex-row gap-2 justify-center max-w-md mx-auto"
            >
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter CN Number (e.g., TAC2026000001)"
                className="flex-1"
              />
              <Button type="submit">Track Shipment</Button>
            </form>
          </Card>
        )}

        {/* Tracking Results */}
        {data && (
          <div className="space-y-6">
            {/* Shipment Header */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Consignment Number
                    </p>
                    <h2 className="text-3xl font-mono font-bold text-foreground">
                      {data.shipment.cn_number}
                    </h2>
                  </div>
                  <StatusBadge status={data.shipment.status} size="lg" showIcon />
                </div>

                {/* Route */}
                <div className="flex items-center gap-4 mt-6 p-4 bg-background/50 rounded-lg">
                  <div className="text-center flex-1">
                    <MapPin className="size-6 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold">{data.shipment.origin_hub?.code || '---'}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.shipment.origin_hub?.name || 'Origin'}
                    </p>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-0.5 flex-1 bg-border" />
                    <TransportIcon className="size-6 text-primary mx-2" />
                    <ArrowRight className="size-4 text-muted-foreground" />
                    <div className="h-0.5 flex-1 bg-border" />
                  </div>
                  <div className="text-center flex-1">
                    <MapPin className="size-6 text-status-success mx-auto mb-1" />
                    <p className="text-lg font-bold">
                      {data.shipment.destination_hub?.code || '---'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {data.shipment.destination_hub?.name || 'Destination'}
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <Hash className="size-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-lg font-semibold">{data.shipment.package_count}</p>
                    <p className="text-xs text-muted-foreground">Packages</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <Weight className="size-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-lg font-semibold">{data.shipment.total_weight} kg</p>
                    <p className="text-xs text-muted-foreground">Weight</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <Truck className="size-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-lg font-semibold">{data.shipment.mode}</p>
                    <p className="text-xs text-muted-foreground">Mode</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <Clock className="size-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-lg font-semibold">{data.shipment.service_level}</p>
                    <p className="text-xs text-muted-foreground">Service</p>
                  </div>
                </div>

                {/* Estimated Delivery */}
                {data.estimated_delivery && (
                  <div className="mt-4 p-4 bg-status-success/10 border border-status-success/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="size-5 text-status-success" />
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                        <p className="font-semibold text-status-success">
                          {format(new Date(data.estimated_delivery), 'EEEE, MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-5" />
                  Tracking History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ShipmentTimeline
                  events={data.events.map((e) => ({
                    id: e.id,
                    event_code: e.event_code,
                    event_time: e.event_time,
                    location: e.hub?.name || e.location || null,
                    notes: null,
                    source: 'SCAN',
                    created_at: e.created_at,
                  }))}
                  currentStatus={data.shipment.status}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="print:hidden">
              <CardContent className="py-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button variant="outline" onClick={handleCopyLink} className="gap-2">
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                  <Button variant="outline" onClick={handleShare} className="gap-2">
                    <Share2 className="size-4" />
                    Share
                  </Button>
                  <Button variant="outline" onClick={() => setShowQR(!showQR)} className="gap-2">
                    <Download className="size-4" />
                    QR Code
                  </Button>
                  <Button variant="outline" onClick={handlePrint} className="gap-2">
                    <Printer className="size-4" />
                    Print
                  </Button>
                </div>

                {/* QR Code */}
                {showQR && (
                  <div className="mt-4 flex justify-center">
                    <div className="p-4 bg-white rounded-lg">
                      <QRCodeSVG
                        value={`${window.location.origin}/track/${cnNumber}`}
                        size={150}
                        level="H"
                      />
                      <p className="text-center text-xs text-muted-foreground mt-2">
                        Scan to track
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Support Card */}
            <Card>
              <CardContent className="py-6">
                <div className="text-center">
                  <h3 className="font-semibold mb-2">Need Help?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    For complete shipment details or assistance, contact our support team.
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <a
                      href="tel:+911234567890"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Phone className="size-4" />
                      +91 12345 67890
                    </a>
                    <a
                      href="mailto:support@tac-cargo.com"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Mail className="size-4" />
                      support@tac-cargo.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6 print:hidden">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TAC Cargo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Helper function to estimate delivery date
function calculateEstimatedDelivery(
  status: ShipmentStatus,
  createdAt: string,
  serviceLevel: string
): string | undefined {
  if (status === 'DELIVERED') return undefined;

  const created = new Date(createdAt);
  const daysToAdd = serviceLevel === 'EXPRESS' ? 2 : serviceLevel === 'STANDARD' ? 5 : 3;
  const estimated = new Date(created);
  estimated.setDate(estimated.getDate() + daysToAdd);

  return estimated.toISOString();
}

export default CustomerTrackingPage;
