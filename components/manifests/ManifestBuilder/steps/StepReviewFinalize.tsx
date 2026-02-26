import { format } from 'date-fns';
import {
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
  Package,
  Plane,
  Truck,
  User,
  Phone,
  Hash,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ManifestSettingsValues } from './StepManifestSetup';
import type { HubOption } from '../manifest-builder.types';

// Define shape based on manifestService usage
interface ShipmentSummary {
  id: string;
  cn_number: string;
  consignee_name: string;
  consignor_name?: string;
  total_weight: number;
  package_count: number;
  total_packages?: number;
}

interface StepReviewFinalizeProps {
  setupData: ManifestSettingsValues;
  shipments: (ShipmentSummary | undefined)[];
  hubs: HubOption[];
}

export function StepReviewFinalize({ setupData, shipments, hubs }: StepReviewFinalizeProps) {
  const validShipments = shipments.filter((s): s is ShipmentSummary => !!s);
  const originHub = hubs.find((h) => h.id === setupData.fromHubId);
  const destinationHub = hubs.find((h) => h.id === setupData.toHubId);

  const totalWeight = validShipments.reduce((sum, s) => sum + (s.total_weight || 0), 0);
  const totalPieces = validShipments.reduce(
    (sum, s) => sum + (s.package_count || s.total_packages || 0),
    0
  );

  const formatTime = (h?: string, m?: string, p?: string) => {
    if (!h || !m) return '---';
    return p ? `${h}:${m} ${p}` : `${h}:${m}`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Route Summary */}
        <Card className="border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Route
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-center flex-1">
                <p className="text-2xl font-bold text-primary">{originHub?.code || '---'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {originHub?.name || 'Origin'}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="text-center flex-1">
                <p className="text-2xl font-bold text-primary">{destinationHub?.code || '---'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {destinationHub?.name || 'Destination'}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-center gap-2">
              {setupData.type === 'AIR' ? (
                <Badge className="bg-status-info/20 text-status-info border-status-info/30">
                  <Plane className="mr-1 h-3 w-3" />
                  Air Cargo
                </Badge>
              ) : (
                <Badge className="bg-status-warning/20 text-status-warning border-status-warning/30">
                  <Truck className="mr-1 h-3 w-3" />
                  Truck
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dispatch Schedule */}
        <Card className="border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {setupData.type === 'AIR' ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-none bg-primary/10 border border-primary/20">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {setupData.flightDate
                        ? format(setupData.flightDate, 'MMM dd, yyyy')
                        : 'Date not set'}
                    </p>
                    <p className="text-xs text-muted-foreground">Flight Date</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-none bg-primary/10 border border-primary/20">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {formatTime(setupData.etdHour, setupData.etdMinute, setupData.etdPeriod)}
                    </p>
                    <p className="text-xs text-muted-foreground">ETD</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-none bg-primary/10 border border-primary/20">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {setupData.dispatchDate
                        ? format(setupData.dispatchDate, 'MMM dd, yyyy')
                        : 'Date not set'}
                    </p>
                    <p className="text-xs text-muted-foreground">Dispatch Date</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-none bg-primary/10 border border-primary/20">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {formatTime(
                        setupData.dispatchHour,
                        setupData.dispatchMinute,
                        setupData.dispatchPeriod
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Dispatch Time</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Totals Summary */}
        <Card className="border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              Manifest Totals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-primary">{shipments.length}</p>
                <p className="text-xs text-muted-foreground">Shipments</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{totalPieces}</p>
                <p className="text-xs text-muted-foreground">Pieces</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{totalWeight.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Weight (kg)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transport Details */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            {setupData.type === 'AIR' ? (
              <Plane className="h-4 w-4" />
            ) : (
              <Truck className="h-4 w-4" />
            )}
            {setupData.type === 'AIR' ? 'Flight Details' : 'Vehicle Details'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {setupData.type === 'AIR' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-none bg-status-info/10 border border-status-info/20">
                  <Plane className="h-5 w-5 text-status-info" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {setupData.airlineCode || '---'} {setupData.flightNumber || '---'}
                  </p>
                  <p className="text-xs text-muted-foreground">Flight</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-none bg-secondary border border-border">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {formatTime(setupData.etdHour, setupData.etdMinute, setupData.etdPeriod)}
                  </p>
                  <p className="text-xs text-muted-foreground">ETD</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-none bg-secondary border border-border">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {formatTime(setupData.etaHour, setupData.etaMinute, setupData.etaPeriod)}
                  </p>
                  <p className="text-xs text-muted-foreground">ETA</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-none bg-status-warning/10 border border-status-warning/20">
                  <Hash className="h-5 w-5 text-status-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium">{setupData.vehicleNumber || '---'}</p>
                  <p className="text-xs text-muted-foreground">Vehicle</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-none bg-secondary border border-border">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{setupData.driverName || '---'}</p>
                  <p className="text-xs text-muted-foreground">Driver</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-none bg-secondary border border-border">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{setupData.driverPhone || '---'}</p>
                  <p className="text-xs text-muted-foreground">Phone</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ready State Notice */}
      <div className="rounded-none bg-primary/10 border border-primary/20 p-4">
        <div className="flex items-start gap-3">
          <Package className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-primary">Ready to Create Manifest</p>
            <p className="text-sm text-muted-foreground mt-1">
              Review all details above. Click &quot;Create Manifest&quot; to save as OPEN, or
              &quot;Close Manifest&quot; to finalize immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
