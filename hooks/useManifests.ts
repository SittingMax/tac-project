/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase client requires any for complex operations */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { Json } from '../lib/database.types';
import { getOrCreateDefaultOrg } from '../lib/org-helper';

// Type helper - removed unused db

export interface ManifestItemWithRelations {
  id: string;
  manifest_id: string;
  shipment_id: string;
  shipment: {
    id: string;
    cn_number: string;
    consignee_name: string;
    consignee_phone?: string;
    consignor_name?: string;
    destination_hub_id: string;
    package_count: number;
    total_weight: number;
    special_instructions?: string;
  };
  scanned_at?: string;
  scanned_by_staff_id?: string;
}

type ManifestListFilters = { limit?: number; status?: string };
export type ManifestStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'BUILDING'
  | 'CLOSED'
  | 'DEPARTED'
  | 'ARRIVED'
  | 'RECONCILED';

export interface AvailableShipment {
  id: string;
  cn_number: string;
  package_count: number;
  total_weight: number;
  service_level: string;
  created_at: string | null;
}

export const manifestKeys = {
  all: ['manifests'] as const,
  lists: () => [...manifestKeys.all, 'list'] as const,
  list: (filters?: ManifestListFilters) => [...manifestKeys.lists(), filters] as const,
  details: () => [...manifestKeys.all, 'detail'] as const,
  detail: (id: string) => [...manifestKeys.details(), id] as const,
  items: (manifestId: string) => [...manifestKeys.all, 'items', manifestId] as const,
  availableShipments: (origin: string, dest: string) =>
    [...manifestKeys.all, 'available', origin, dest] as const,
};

export interface ManifestWithRelations {
  id: string;
  org_id: string;
  manifest_no: string;
  type: 'AIR' | 'TRUCK';
  from_hub_id: string;
  to_hub_id: string;
  status: ManifestStatus;
  vehicle_meta: Json;
  flight_number?: string | null;
  flight_date?: string | null;
  airline_code?: string | null;
  etd?: string | null;
  eta?: string | null;
  vehicle_number?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  dispatch_at?: string | null;
  total_shipments: number;
  total_packages: number;
  total_weight: number;
  created_by_staff_id: string;
  created_at: string;
  updated_at: string;
  from_hub?: { code: string; name: string };
  to_hub?: { code: string; name: string };
  creator?: { full_name: string };
}

export function useManifests(options?: ManifestListFilters) {
  return useQuery({
    queryKey: manifestKeys.list(options),
    queryFn: async () => {
      let query = supabase
        .from('manifests')
        .select(
          `
          *,
          from_hub:hubs!manifests_from_hub_id_fkey(code, name),
          to_hub:hubs!manifests_to_hub_id_fkey(code, name),
          creator:staff!manifests_created_by_staff_id_fkey(full_name)
        `
        )
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ManifestWithRelations[];
    },
  });
}

export function useManifest(id: string) {
  return useQuery({
    queryKey: manifestKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manifests')
        .select(
          `
          *,
          from_hub:hubs!manifests_from_hub_id_fkey(code, name),
          to_hub:hubs!manifests_to_hub_id_fkey(code, name),
          creator:staff!manifests_created_by_staff_id_fkey(full_name)
        `
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as ManifestWithRelations;
    },
    enabled: !!id,
  });
}

export function useManifestItems(manifestId: string) {
  return useQuery({
    queryKey: manifestKeys.items(manifestId),
    queryFn: async () => {
      // Join with shipments to get details
      const { data, error } = await supabase
        .from('manifest_items')
        .select(
          `
          *,
          shipment:shipments(*)
        `
        )
        .eq('manifest_id', manifestId);

      if (error) throw error;
      return (data ?? []) as unknown as ManifestItemWithRelations[];
    },
    enabled: !!manifestId,
  });
}

export function useAvailableShipments(originHubId: string, destinationHubId: string) {
  return useQuery({
    queryKey: manifestKeys.availableShipments(originHubId, destinationHubId),
    queryFn: async (): Promise<AvailableShipment[]> => {
      if (!originHubId || !destinationHubId) return [];

      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('origin_hub_id', originHubId)
        .eq('destination_hub_id', destinationHubId)
        .is('manifest_id', null)
        .neq('status', 'CANCELLED')
        .neq('status', 'DELIVERED');

      if (error) throw error;
      return (data ?? []) as AvailableShipment[];
    },
    enabled: !!originHubId && !!destinationHubId,
  });
}

interface CreateManifestInput {
  type: 'AIR' | 'TRUCK';
  from_hub_id: string;
  to_hub_id: string;
  vehicle_meta: Json;
  shipment_ids: string[];
}

export function useCreateManifest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateManifestInput) => {
      const orgId = await getOrCreateDefaultOrg();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      // Try to find staff ID
      let staffId;
      if (user?.id) {
        const { data: staff } = await (supabase.from('staff') as any)
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        staffId = staff?.id;
      }

      // Fallback to System Admin or first available admin if not found
      if (!staffId) {
        const { data: defaultStaff } = await (supabase.from('staff') as any)
          .select('id')
          .eq('role', 'ADMIN')
          .limit(1)
          .maybeSingle();
        staffId = defaultStaff?.id;
      }

      if (!staffId)
        throw new Error('Staff profile not found for current user and no default admin available');

      // Calculate totals
      const { data: shipments, error: shipmentsError } = await (supabase.from('shipments') as any)
        .select('package_count, total_weight')
        .in('id', input.shipment_ids);

      if (shipmentsError) throw shipmentsError;
      if (!shipments || shipments.length !== input.shipment_ids.length) {
        throw new Error('Some shipments were not found or are not accessible');
      }

      const totalShipments = shipments.length;
      const totalPackages = shipments.reduce(
        (sum: number, s: { package_count: number }) => sum + (s.package_count || 0),
        0
      );
      const totalWeight = shipments.reduce(
        (sum: number, s: { total_weight: number }) => sum + (s.total_weight || 0),
        0
      );

      // Create Manifest (manifest_no generated by DB trigger)
      const { data: manifest, error: manifestError } = await (supabase.from('manifests') as any)
        .insert({
          org_id: orgId,
          type: input.type,
          from_hub_id: input.from_hub_id,
          to_hub_id: input.to_hub_id,
          status: 'OPEN',
          vehicle_meta: input.vehicle_meta,
          total_shipments: totalShipments,
          total_packages: totalPackages,
          total_weight: totalWeight,
          created_by_staff_id: staffId,
        })
        .select()
        .single();

      if (manifestError) throw manifestError;

      // Create Manifest Items
      if (input.shipment_ids.length > 0) {
        const items = input.shipment_ids.map((sid) => ({
          org_id: orgId,
          manifest_id: manifest.id,
          shipment_id: sid,
          scanned_by_staff_id: staffId,
          scanned_at: new Date().toISOString(),
        }));

        const { error: itemsError } = await (supabase.from('manifest_items') as any).insert(items);
        if (itemsError) throw itemsError;

        // Update Shipments
        const { error: shipmentsError } = await (supabase.from('shipments') as any)
          .update({ manifest_id: manifest.id, status: 'IN_TRANSIT' })
          .in('id', input.shipment_ids);
        if (shipmentsError) throw shipmentsError;
      }

      return manifest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: manifestKeys.all });
      toast.success(`Manifest ${data.manifest_no} created successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create manifest: ${error.message}`);
    },
  });
}

export function useUpdateManifestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ManifestStatus }) => {
      const updatePayload: Record<string, string> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'DEPARTED') updatePayload.departed_at = new Date().toISOString();
      if (status === 'ARRIVED') updatePayload.arrived_at = new Date().toISOString();
      if (status === 'CLOSED') updatePayload.closed_at = new Date().toISOString();

      const { error } = await (supabase.from('manifests') as any)
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: manifestKeys.all });
      queryClient.invalidateQueries({ queryKey: manifestKeys.detail(id) });
    },
  });
}

// Find manifest by ID or manifest_no (for scanning operations)
export interface ManifestLookupResult {
  id: string;
  manifest_no: string;
  from_hub_id: string;
  to_hub_id: string;
  status: ManifestStatus;
}

export function useFindManifestByCode() {
  return useMutation({
    mutationFn: async (code: string): Promise<ManifestLookupResult | null> => {
      // Try to find by ID or manifest_no
      const { data, error } = await (supabase.from('manifests') as any)
        .select('id, manifest_no, from_hub_id, to_hub_id, status')
        .or(`id.eq.${code},manifest_no.eq.${code}`)
        .maybeSingle();

      if (error) throw error;
      return data as ManifestLookupResult | null;
    },
  });
}

// Add shipment to manifest (for LOAD_MANIFEST scan mode)
// CRITICAL: Includes idempotency check to prevent duplicate scans
export function useAddManifestItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { manifest_id: string; shipment_id: string }) => {
      const orgId = await getOrCreateDefaultOrg();

      // IDEMPOTENCY CHECK: Prevent duplicate manifest items
      const { data: existing } = await supabase
        .from('manifest_items')
        .select('id')
        .eq('manifest_id', input.manifest_id)
        .eq('shipment_id', input.shipment_id)
        .maybeSingle();

      if (existing) {
        // Already exists - idempotent success (no duplicate created)
        toast.info('Shipment already in manifest');
        return existing;
      }

      const { data, error } = await (supabase.from('manifest_items') as any)
        .insert({
          org_id: orgId,
          manifest_id: input.manifest_id,
          shipment_id: input.shipment_id,
          scanned_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, { manifest_id }) => {
      queryClient.invalidateQueries({ queryKey: manifestKeys.items(manifest_id) });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add shipment to manifest: ${error.message}`);
    },
  });
}

// Check if shipment is in manifest (for VERIFY_MANIFEST scan mode)
export function useCheckManifestItem() {
  return useMutation({
    mutationFn: async (input: { manifest_id: string; shipment_id: string }): Promise<boolean> => {
      const { data, error } = await (supabase.from('manifest_items') as any)
        .select('id')
        .eq('manifest_id', input.manifest_id)
        .eq('shipment_id', input.shipment_id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
  });
}

/**
 * Hook to permanently delete a manifest (hard delete).
 * ONLY FOR SUPER ADMINS.
 */
export function useHardDeleteManifest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('manifests').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: manifestKeys.lists() });
      toast.success('Manifest permanently deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete manifest: ${error.message}`);
    },
  });
}
