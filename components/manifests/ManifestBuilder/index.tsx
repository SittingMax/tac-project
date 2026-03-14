/**
 * ManifestBuilder Component
 * Premium drag-and-drop manifest building interface
 * Supports shipment assignment, container management, and weight calculations
 */

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/domain/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Truck,
  Plane,
  Weight,
  Hash,
  Plus,
  X,
  GripVertical,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Loader2,
  Printer,
} from 'lucide-react';
import { ShipmentStatus, ManifestStatus } from '@/types';
import { toast } from 'sonner';

// Types
interface ShipmentItem {
  id: string;
  cn_number: string;
  status: ShipmentStatus;
  total_weight: number;
  package_count: number;
  consignee_name: string;
  destination_hub?: { code: string; name: string } | null;
}

interface ManifestData {
  id: string;
  manifest_no: string;
  status: ManifestStatus;
  type: string;
  from_hub_id: string;
  to_hub_id: string;
  vehicle_number?: string;
  driver_name?: string;
  driver_phone?: string;
  flight_number?: string;
  flight_date?: string;
  etd?: string;
  eta?: string;
  total_shipments: number;
  total_packages: number;
  total_weight: number;
  from_hub?: { code: string; name: string } | null;
  to_hub?: { code: string; name: string } | null;
}

interface ManifestBuilderProps {
  manifestId?: string;
  hubId: string;
  onCreateNew?: () => void;
  onSave?: (manifest: ManifestData) => void;
  onDispatch?: (manifest: ManifestData) => void;
  className?: string;
}

export function ManifestBuilder({ manifestId, hubId, className }: ManifestBuilderProps) {
  const queryClient = useQueryClient();
  const [selectedShipments, setSelectedShipments] = React.useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState('');
  const [destinationHubId, setDestinationHubId] = React.useState<string>('');
  const [transportType, setTransportType] = React.useState<'SURFACE' | 'AIR'>('SURFACE');
  const [vehicleNumber, setVehicleNumber] = React.useState('');
  const [driverName, setDriverName] = React.useState('');
  const [driverPhone, setDriverPhone] = React.useState('');
  const [flightNumber, setFlightNumber] = React.useState('');
  const [flightDate, setFlightDate] = React.useState('');
  const [draggedItem, setDraggedItem] = React.useState<string | null>(null);

  // Fetch hubs for destination selection
  const { data: hubs } = useQuery({
    queryKey: ['hubs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hubs').select('id, code, name').order('code');
      if (error) throw error;
      return data as { id: string; code: string; name: string }[];
    },
  });

  // Fetch manifest if editing
  const { data: manifest, isLoading: manifestLoading } = useQuery({
    queryKey: ['manifest', manifestId],
    queryFn: async (): Promise<ManifestData | null> => {
      if (!manifestId) return null;
      const { data, error } = await supabase
        .from('manifests')
        .select(
          `
          *,
          from_hub:hubs!manifests_from_hub_id_fkey(code, name),
          to_hub:hubs!manifests_to_hub_id_fkey(code, name)
        `
        )
        .eq('id', manifestId)
        .single();
      if (error) throw error;
      return data as ManifestData;
    },
    enabled: !!manifestId,
  });

  // Fetch available shipments (at origin hub, ready for manifest)
  const { data: availableShipments, isLoading: shipmentsLoading } = useQuery({
    queryKey: ['available-shipments', hubId],
    queryFn: async (): Promise<ShipmentItem[]> => {
      const { data, error } = await supabase
        .from('shipments')
        .select(
          `
          id,
          cn_number,
          status,
          total_weight,
          package_count,
          consignee_name,
          destination_hub:hubs!shipments_destination_hub_id_fkey(code, name)
        `
        )
        .eq('origin_hub_id', hubId)
        .eq('status', 'RECEIVED_AT_ORIGIN')
        .is('manifest_id', null)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ShipmentItem[];
    },
    enabled: !!hubId,
  });

  // Fetch shipments already in manifest
  const { data: manifestShipments } = useQuery({
    queryKey: ['manifest-shipments', manifestId],
    queryFn: async (): Promise<ShipmentItem[]> => {
      if (!manifestId) return [];
      const { data, error } = await supabase
        .from('shipments')
        .select(
          `
          id,
          cn_number,
          status,
          total_weight,
          package_count,
          consignee_name,
          destination_hub:hubs!shipments_destination_hub_id_fkey(code, name)
        `
        )
        .eq('manifest_id', manifestId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ShipmentItem[];
    },
    enabled: !!manifestId,
  });

  // Create manifest mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!destinationHubId) throw new Error('Destination hub required');
      if (selectedShipments.size === 0) throw new Error('No shipments selected');

      // Create manifest using direct insert (manifest_no auto-generated)
      const insertData = {
        type: transportType,
        from_hub_id: hubId,
        to_hub_id: destinationHubId,
        vehicle_number: transportType === 'SURFACE' ? vehicleNumber : null,
        driver_name: transportType === 'SURFACE' ? driverName : null,
        driver_phone: transportType === 'SURFACE' ? driverPhone : null,
        flight_number: transportType === 'AIR' ? flightNumber : null,
        flight_date: transportType === 'AIR' ? flightDate : null,
        status: 'BUILDING',
        total_shipments: selectedShipments.size,
      };
      const { data: newManifest, error: manifestError } = await (
        supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Auto-generated fields handled by DB
          .from('manifests') as any
      )
        .insert(insertData)
        .select()
        .single();

      if (manifestError) throw manifestError;

      const createdManifest = newManifest as { id: string };

      // Assign shipments to manifest
      const { error: updateError } = await supabase
        .from('shipments')
        .update({ manifest_id: createdManifest.id, status: 'IN_TRANSIT' })
        .in('id', Array.from(selectedShipments));

      if (updateError) throw updateError;

      return newManifest;
    },
    onSuccess: () => {
      toast.success('Manifest created successfully');
      setSelectedShipments(new Set());
      queryClient.invalidateQueries({ queryKey: ['manifests'] });
      queryClient.invalidateQueries({ queryKey: ['available-shipments'] });
    },
    onError: (error) => {
      toast.error(`Failed to create manifest: ${error.message}`);
    },
  });

  // Add shipment to existing manifest
  const addShipmentMutation = useMutation({
    mutationFn: async (shipmentId: string) => {
      if (!manifestId) throw new Error('No manifest selected');

      const { error } = await supabase
        .from('shipments')
        .update({ manifest_id: manifestId, status: 'IN_TRANSIT' })
        .eq('id', shipmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Shipment added to manifest');
      queryClient.invalidateQueries({ queryKey: ['manifest-shipments', manifestId] });
      queryClient.invalidateQueries({ queryKey: ['available-shipments'] });
    },
  });

  // Remove shipment from manifest
  const removeShipmentMutation = useMutation({
    mutationFn: async (shipmentId: string) => {
      const { error } = await supabase
        .from('shipments')
        .update({ manifest_id: null, status: 'RECEIVED_AT_ORIGIN' })
        .eq('id', shipmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Shipment removed from manifest');
      queryClient.invalidateQueries({ queryKey: ['manifest-shipments', manifestId] });
      queryClient.invalidateQueries({ queryKey: ['available-shipments'] });
    },
  });

  // Close manifest mutation
  const closeMutation = useMutation({
    mutationFn: async () => {
      if (!manifestId) throw new Error('No manifest selected');

      const { error } = await supabase
        .from('manifests')
        .update({ status: 'CLOSED', closed_at: new Date().toISOString() })
        .eq('id', manifestId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Manifest closed');
      queryClient.invalidateQueries({ queryKey: ['manifest', manifestId] });
    },
  });

  // Toggle shipment selection
  const toggleShipment = (shipmentId: string) => {
    setSelectedShipments((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(shipmentId)) {
        next.delete(shipmentId);
      } else {
        next.add(shipmentId);
      }
      return next;
    });
  };

  // Select all shipments
  const selectAll = () => {
    if (availableShipments) {
      setSelectedShipments(new Set(availableShipments.map((s) => s.id)));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedShipments(new Set());
  };

  // Calculate totals for selected shipments
  const selectedTotals = React.useMemo(() => {
    const shipments = availableShipments?.filter((s) => selectedShipments.has(s.id)) || [];
    return {
      count: shipments.length,
      weight: shipments.reduce((sum, s) => sum + Number(s.total_weight), 0),
      packages: shipments.reduce((sum, s) => sum + s.package_count, 0),
    };
  }, [availableShipments, selectedShipments]);

  // Filter shipments by search
  const filteredShipments = React.useMemo(() => {
    if (!searchQuery) return availableShipments;
    const query = searchQuery.toLowerCase();
    return availableShipments?.filter(
      (s) =>
        s.cn_number.toLowerCase().includes(query) || s.consignee_name.toLowerCase().includes(query)
    );
  }, [availableShipments, searchQuery]);

  // Drag handlers
  const handleDragStart = (shipmentId: string) => {
    setDraggedItem(shipmentId);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDrop = (targetArea: 'available' | 'manifest') => {
    if (!draggedItem) return;

    if (targetArea === 'manifest' && manifestId) {
      addShipmentMutation.mutate(draggedItem);
    } else if (targetArea === 'available') {
      removeShipmentMutation.mutate(draggedItem);
    }

    setDraggedItem(null);
  };

  const isLoading = manifestLoading || shipmentsLoading;

  return (
    <div className={cn('grid lg:grid-cols-3 gap-6', className)}>
      {/* Left Panel: Available Shipments */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="size-5" />
                Available Shipments
                {availableShipments && (
                  <Badge variant="secondary" className="ml-2">
                    {availableShipments.length}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Search */}
            <div className="mb-4">
              <Input
                placeholder="Search by CN number or consignee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {/* Shipments List */}
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredShipments && filteredShipments.length > 0 ? (
                <div className="space-y-2">
                  {filteredShipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      draggable
                      onDragStart={() => handleDragStart(shipment.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => toggleShipment(shipment.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                        'hover:border-primary/50 hover:bg-muted/30',
                        selectedShipments.has(shipment.id) && 'border-primary bg-primary/5',
                        draggedItem === shipment.id && 'opacity-50'
                      )}
                    >
                      <GripVertical className="size-4 text-muted-foreground shrink-0" />
                      <input
                        type="checkbox"
                        checked={selectedShipments.has(shipment.id)}
                        onChange={() => toggleShipment(shipment.id)}
                        className="size-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{shipment.cn_number}</span>
                          <StatusBadge status={shipment.status} size="sm" />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Weight className="size-3" />
                            {shipment.total_weight}kg
                          </span>
                          <span className="flex items-center gap-1">
                            <Hash className="size-3" />
                            {shipment.package_count} pkgs
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {shipment.destination_hub?.code || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Package className="size-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No shipments available</p>
                  <p className="text-sm text-muted-foreground/70">
                    All shipments have been assigned to manifests
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel: Manifest Details */}
      <div className="space-y-4">
        {/* Manifest Info */}
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              {transportType === 'AIR' ? (
                <Plane className="size-5" />
              ) : (
                <Truck className="size-5" />
              )}
              {manifest ? `Manifest ${manifest.manifest_no}` : 'New Manifest'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {manifest ? (
              <>
                {/* Route Display */}
                <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-bold">{manifest.from_hub?.code}</p>
                    <p className="text-xs text-muted-foreground">Origin</p>
                  </div>
                  <ArrowRight className="size-5 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-lg font-bold">{manifest.to_hub?.code}</p>
                    <p className="text-xs text-muted-foreground">Destination</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <StatusBadge status={manifest.status} />
                </div>

                {/* Totals */}
                <Separator />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{manifest.total_shipments}</p>
                    <p className="text-xs text-muted-foreground">Shipments</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{manifest.total_packages}</p>
                    <p className="text-xs text-muted-foreground">Packages</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{manifest.total_weight}</p>
                    <p className="text-xs text-muted-foreground">Weight (kg)</p>
                  </div>
                </div>

                {/* Actions */}
                <Separator />
                <div className="flex flex-col gap-2">
                  {manifest.status === ('BUILDING' as ManifestStatus) && (
                    <Button
                      onClick={() => closeMutation.mutate()}
                      disabled={closeMutation.isPending}
                      className="w-full"
                    >
                      <CheckCircle2 className="size-4 mr-2" />
                      Close Manifest
                    </Button>
                  )}
                  <Button variant="outline" className="w-full">
                    <Printer className="size-4 mr-2" />
                    Print Manifest
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Transport Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Transport Type</Label>
                  <Select
                    value={transportType}
                    onValueChange={(v) => setTransportType(v as 'SURFACE' | 'AIR')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SURFACE">Surface (Truck)</SelectItem>
                      <SelectItem value="AIR">Air (Flight)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Destination Hub */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Destination Hub</Label>
                  <Select value={destinationHubId} onValueChange={setDestinationHubId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination..." />
                    </SelectTrigger>
                    <SelectContent>
                      {hubs
                        ?.filter((h) => h.id !== hubId)
                        .map((hub) => (
                          <SelectItem key={hub.id} value={hub.id}>
                            {hub.code} - {hub.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Surface Transport Details */}
                {transportType === 'SURFACE' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Vehicle Number</Label>
                      <Input
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        placeholder="MN01AB1234"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Driver Name</Label>
                        <Input
                          value={driverName}
                          onChange={(e) => setDriverName(e.target.value)}
                          placeholder="Driver name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Driver Phone</Label>
                        <Input
                          value={driverPhone}
                          onChange={(e) => setDriverPhone(e.target.value)}
                          placeholder="Phone"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Air Transport Details */}
                {transportType === 'AIR' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Flight Number</Label>
                      <Input
                        value={flightNumber}
                        onChange={(e) => setFlightNumber(e.target.value)}
                        placeholder="AI123"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Flight Date</Label>
                      <Input
                        type="date"
                        value={flightDate}
                        onChange={(e) => setFlightDate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Selected Totals */}
                <Separator />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{selectedTotals.count}</p>
                    <p className="text-xs text-muted-foreground">Selected</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{selectedTotals.packages}</p>
                    <p className="text-xs text-muted-foreground">Packages</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{selectedTotals.weight.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Weight (kg)</p>
                  </div>
                </div>

                {/* Create Button */}
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={
                    createMutation.isPending || selectedShipments.size === 0 || !destinationHubId
                  }
                  className="w-full"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="size-4 mr-2" />
                  )}
                  Create Manifest ({selectedShipments.size} shipments)
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Shipments in Manifest (if editing) */}
        {manifestId && manifestShipments && manifestShipments.length > 0 && (
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Shipments in Manifest ({manifestShipments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[200px]">
                <div
                  className="space-y-2"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop('manifest')}
                >
                  {manifestShipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      draggable
                      onDragStart={() => handleDragStart(shipment.id)}
                      onDragEnd={handleDragEnd}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/30 text-sm"
                    >
                      <GripVertical className="size-3 text-muted-foreground" />
                      <span className="font-mono flex-1">{shipment.cn_number}</span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeShipmentMutation.mutate(shipment.id)}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default ManifestBuilder;
