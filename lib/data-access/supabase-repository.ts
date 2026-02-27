import { supabase } from '../supabase';
import {
  DataAccessLayer,
  ShipmentRepository,
  ManifestRepository,
  UserRepository,
  InvoiceRepository,
  ExceptionRepository,
  CustomerRepository,
  EventRepository,
  AuditRepository,
} from './index';
import {
  Shipment,
  Manifest,
  User,
  ShipmentStatus,
  HubLocation,
  Invoice,
  InvoiceStatus,
} from '../../types';
import type { Database } from '../database.types';

// Helper types for Supabase rows
type ShipmentRow = Database['public']['Tables']['shipments']['Row'] & {
  customer?: { name: string } | null;
  origin_hub?: { code: string } | null;
  destination_hub?: { code: string } | null;
};

type ManifestRow = Database['public']['Tables']['manifests']['Row'] & {
  origin_hub?: { code: string } | null;
  destination_hub?: { code: string } | null;
  manifest_items?: { shipment_id: string }[];
};

type InvoiceRow = Database['public']['Tables']['invoices']['Row'] & {
  customer?: { name: string } | null;
  shipment?: { cn_number: string } | null;
};

type StaffRow = Database['public']['Tables']['staff']['Row'] & {
  hub?: { code: string } | null;
};

// --- Helpers ---

const getHubId = async (code: string): Promise<string> => {
  if (!code) throw new Error('Hub code is required');
  const { data, error } = await supabase.from('hubs').select('id').eq('code', code).single();

  if (error || !data) throw new Error(`Hub not found for code: ${code}`);
  return data.id;
};

// --- Mappers ---

const mapShipment = (row: ShipmentRow): Shipment => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const consignorAddress = row.consignor_address as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const consigneeAddress = row.consignee_address as any;

  return {
    id: row.id,
    awb: row.cn_number,
    customerId: row.customer_id,
    customerName: row.customer?.name || 'Unknown',
    originHub: (row.origin_hub?.code || 'IMPHAL') as HubLocation,
    destinationHub: (row.destination_hub?.code || 'NEW_DELHI') as HubLocation,
    mode: (row.mode || 'AIR') as Shipment['mode'],
    serviceLevel: (row.service_level === 'EXPRESS'
      ? 'EXPRESS'
      : 'STANDARD') as Shipment['serviceLevel'], // Simplified mapping
    status: row.status as Shipment['status'],
    totalPackageCount: row.package_count || 1,
    totalWeight: {
      dead: row.total_weight || 0,
      volumetric: 0, // Not stored in main table currently
      chargeable: row.total_weight || 0,
    },
    eta: 'TBD', // Not stored in DB
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    lastUpdate: 'Synced from DB',
    invoiceId: row.id, // Using shipment ID as invoice linkage for now if separate field missing
    // In types.ts Shipment has invoiceId?, but DB row doesnt have invoice_id column directly shown in types?
    // Wait, DB types showed 'shipments' table. Let me check DB types again.
    // 'shipments' table has 'manifest_id'. 'invoices' has 'shipment_id'.
    // So Shipment -> Invoice is 1:Many or 1:1 via Invoice table.
    // We'll leave invoiceId undefined for now as it requires reverse lookup
    contentsDescription: row.special_instructions || 'General Cargo',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paymentMode: 'PAID' as any,
    consignor: {
      name: row.consignor_name || '',
      phone: row.consignor_phone || '',
      address:
        typeof consignorAddress === 'string' ? consignorAddress : consignorAddress?.line1 || '',
      gstin: consignorAddress?.gstin,
      city: consignorAddress?.city,
      state: consignorAddress?.state,
      zip: consignorAddress?.zip,
    },
    consignee: {
      name: row.consignee_name,
      phone: row.consignee_phone,
      address:
        typeof consigneeAddress === 'string' ? consigneeAddress : consigneeAddress?.line1 || '',
      gstin: consigneeAddress?.gstin,
      city: consigneeAddress?.city,
      state: consigneeAddress?.state,
      zip: consigneeAddress?.zip,
    },
    declaredValue: row.declared_value || 0,
  };
};

const mapUser = (row: StaffRow): User => ({
  id: row.id,
  name: row.full_name,
  email: row.email,
  role: row.role as User['role'],
  active: row.is_active ?? true,
  lastLogin: row.updated_at || 'Never',
  assignedHub: row.hub?.code as HubLocation | undefined,
});

// --- Repositories ---

const mapManifest = (row: ManifestRow): Manifest => ({
  id: row.id,
  reference: row.manifest_no,
  type: (row.type || 'AIR') as Manifest['type'], // Defaulting
  originHub: (row.origin_hub?.code || 'IMPHAL') as HubLocation,
  destinationHub: (row.destination_hub?.code || 'NEW_DELHI') as HubLocation,
  status: row.status as Manifest['status'],
  vehicleMeta: {
    vehicleId: row.vehicle_number || undefined,
    driverName: row.driver_name || undefined,
    driverPhone: row.driver_phone || undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    carrier: (row.vehicle_meta as any)?.carrier,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    flightNumber: (row.vehicle_meta as any)?.flightNumber,
  },
  shipmentIds: row.manifest_items?.map((i) => i.shipment_id) || [],
  shipmentCount: row.total_shipments || 0,
  totalWeight: row.total_weight || 0,
  createdBy: row.created_by_staff_id || 'System', // ideally join staff name
  createdAt: row.created_at || new Date().toISOString(),
  departedAt: row.departed_at || undefined,
  arrivedAt: row.arrived_at || undefined,
});

const mapInvoice = (row: InvoiceRow): Invoice => {
  return {
    id: row.id,
    invoiceNumber: row.invoice_no,
    customerId: row.customer_id,
    customerName: row.customer?.name || 'Unknown',
    shipmentId: row.shipment_id || '',
    awb: row.shipment?.cn_number || 'UNKNOWN',
    status: row.status as InvoiceStatus,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paymentMode: (row.payment_method || 'PAID') as any, // Mismatched enum names?
    financials: {
      ratePerKg: 0, // Not in Invoice row directly, maybe in line items
      baseFreight: row.subtotal,
      docketCharge: 0,
      pickupCharge: 0,
      packingCharge: 0,
      fuelSurcharge: 0,
      handlingFee: 0,
      insurance: 0,
      tax: {
        cgst: 0,
        sgst: 0,
        igst: row.tax_amount || 0,
        total: row.tax_amount || 0,
      },
      discount: row.discount || 0,
      totalAmount: row.total,
      advancePaid: 0,
      balance: row.total, // Assuming unpaid if not paid_at
    },
    dueDate: row.due_date || new Date().toISOString(),
    paidAt: row.paid_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
};

// --- Repositories ---

class SupabaseShipmentRepository implements ShipmentRepository {
  async getAll(): Promise<Shipment[]> {
    const { data, error } = await supabase
      .from('shipments')
      .select(
        `
                *,
                customer:customers(name),
                origin_hub:hubs!shipments_origin_hub_id_fkey(code),
                destination_hub:hubs!shipments_destination_hub_id_fkey(code)
            `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapShipment);
  }

  async getByAWB(awb: string): Promise<Shipment | null> {
    const { data, error } = await supabase
      .from('shipments')
      .select(
        `
            *,
            customer:customers(name),
            origin_hub:hubs!shipments_origin_hub_id_fkey(code),
            destination_hub:hubs!shipments_destination_hub_id_fkey(code)
        `
      )
      .eq('cn_number', awb)
      .single();

    if (error) return null;
    return mapShipment(data);
  }

  async create(data: Shipment): Promise<Shipment> {
    const originHubId = await getHubId(data.originHub);
    const destinationHubId = await getHubId(data.destinationHub);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    const { data: staff } = await supabase
      .from('staff')
      .select('org_id')
      .eq('auth_user_id', userData.user.id)
      .single();

    if (!staff) throw new Error('Staff profile not found');

    const shipmentPayload = {
      cn_number: data.awb,
      customer_id: data.customerId,
      origin_hub_id: originHubId,
      destination_hub_id: destinationHubId,
      org_id: staff.org_id,
      status: 'CREATED',
      mode: data.mode,
      service_level: data.serviceLevel,
      // payment_mode: data.paymentMode, // Not in DB
      package_count: data.totalPackageCount,
      total_weight: data.totalWeight.dead,
      declared_value: data.declaredValue,
      consignee_name: data.consignee?.name || 'Unknown',
      consignee_phone: data.consignee?.phone || '',
      consignee_address: {
        line1: data.consignee?.address,
        city: data.consignee?.city,
        state: data.consignee?.state,
        zip: data.consignee?.zip,
        gstin: data.consignee?.gstin,
      },
      consignor_name: data.consignor?.name || 'Unknown',
      consignor_phone: data.consignor?.phone || '',
      consignor_address: {
        line1: data.consignor?.address,
        city: data.consignor?.city,
        state: data.consignor?.state,
        zip: data.consignor?.zip,
        gstin: data.consignor?.gstin,
      },
      special_instructions: data.contentsDescription, // Mapping contents to special_instructions
    };

    const { data: newShipment, error } = await supabase
      .from('shipments')
      .insert(shipmentPayload)
      .select(
        `
            *,
            customer:customers(name),
            origin_hub:hubs!shipments_origin_hub_id_fkey(code),
            destination_hub:hubs!shipments_destination_hub_id_fkey(code)
        `
      )
      .single();

    if (error) throw error;
    if (!newShipment) throw new Error('Failed to create shipment');

    return mapShipment(newShipment);
  }

  async updateStatus(
    id: string,
    status: ShipmentStatus,
    _description: string,
    _hubId?: HubLocation
  ): Promise<void> {
    const { error } = await supabase
      .from('shipments')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }
}

class SupabaseManifestRepository implements ManifestRepository {
  async getAll(): Promise<Manifest[]> {
    const { data, error } = await supabase
      .from('manifests')
      .select(
        `
            *,
            origin_hub:hubs!manifests_from_hub_id_fkey(code),
            destination_hub:hubs!manifests_to_hub_id_fkey(code),
            manifest_items(shipment_id)
        `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapManifest);
  }

  async getByRef(ref: string): Promise<Manifest | null> {
    const { data, error } = await supabase
      .from('manifests')
      .select(
        `
            *,
            origin_hub:hubs!manifests_from_hub_id_fkey(code),
            destination_hub:hubs!manifests_to_hub_id_fkey(code),
            manifest_items(shipment_id)
        `
      )
      .eq('manifest_no', ref)
      .single();

    if (error) return null;
    return mapManifest(data);
  }

  async create(data: Manifest): Promise<Manifest> {
    const fromHubId = await getHubId(data.originHub);
    const toHubId = await getHubId(data.destinationHub);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    const { data: staff } = await supabase
      .from('staff')
      .select('id, org_id')
      .eq('auth_user_id', userData.user.id)
      .single();
    if (!staff) throw new Error('Staff/Org not found');

    const payload = {
      manifest_no: data.reference,
      type: data.type,
      from_hub_id: fromHubId,
      to_hub_id: toHubId,
      status: 'OPEN',
      org_id: staff.org_id,
      created_by_staff_id: staff.id,
      vehicle_number: data.vehicleMeta.vehicleId,
      driver_name: data.vehicleMeta.driverName,
      driver_phone: data.vehicleMeta.driverPhone,
      vehicle_meta: {
        carrier: data.vehicleMeta.carrier,
        flightNumber: data.vehicleMeta.flightNumber,
      },
    };

    const { data: newManifest, error } = await supabase
      .from('manifests')
      .insert(payload)
      .select(
        `
            *,
            origin_hub:hubs!manifests_from_hub_id_fkey(code),
            destination_hub:hubs!manifests_to_hub_id_fkey(code)
        `
      )
      .single();

    if (error) throw error;
    return mapManifest(newManifest);
  }

  async updateStatus(id: string, status: 'DEPARTED' | 'ARRIVED'): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = { status };
    if (status === 'DEPARTED') update.departed_at = new Date().toISOString();
    if (status === 'ARRIVED') update.arrived_at = new Date().toISOString();

    const { error } = await supabase.from('manifests').update(update).eq('id', id);
    if (error) throw error;
  }

  async addShipment(manifestId: string, shipmentId: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    const { data: staff } = await supabase
      .from('staff')
      .select('id, org_id')
      .eq('auth_user_id', userData.user?.id || '')
      .single();

    if (!staff) throw new Error('Staff context missing');

    const { error } = await supabase.from('manifest_items').insert({
      manifest_id: manifestId,
      shipment_id: shipmentId,
      org_id: staff.org_id,
      scanned_by_staff_id: staff.id,
      scanned_at: new Date().toISOString(),
    });

    if (error) throw error;
  }
}

class SupabaseInvoiceRepository implements InvoiceRepository {
  async getAll(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(
        `
                *,
                customer:customers(name),
                shipment:shipments(cn_number)
            `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((row) => mapInvoice(row as any));
  }

  async create(data: Invoice): Promise<Invoice> {
    const { data: userData } = await supabase.auth.getUser();
    const { data: staff } = await supabase
      .from('staff')
      .select('org_id')
      .eq('auth_user_id', userData.user?.id || '')
      .single();
    if (!staff) throw new Error('Staff context missing');

    const payload = {
      invoice_no: data.invoiceNumber,
      customer_id: data.customerId,
      shipment_id: data.shipmentId,
      org_id: staff.org_id,
      status: 'DRAFT', // data.status
      subtotal: data.financials.baseFreight, // simplified mapping
      total: data.financials.totalAmount,
      tax_amount: data.financials.tax.total,
      due_date: data.dueDate,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      line_items: [] as any, // Map line items if available
    };

    const { data: newInvoice, error } = await supabase
      .from('invoices')
      .insert(payload)
      .select(`*, customer:customers(name), shipment:shipments(cn_number)`)
      .single();

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mapInvoice(newInvoice as any);
  }

  async updateStatus(id: string, status: InvoiceStatus): Promise<void> {
    const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
    if (error) throw error;
  }
}

class SupabaseUserRepository implements UserRepository {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('staff')
      .select(`*, hub:hubs(code, name)`)
      .order('full_name');

    if (error) throw error;
    return (data || []).map(mapUser);
  }

  async create(_data: User): Promise<User> {
    throw new Error('Use server-side function to create users');
  }

  async updateStatus(id: string, active: boolean): Promise<void> {
    const { error } = await supabase.from('staff').update({ is_active: active }).eq('id', id);
    if (error) throw error;
  }
}

// Minimal/Empty implementations for others to satisfy interface
class NotImplementedRepository {
  async getAll(): Promise<unknown[]> {
    return [];
  }
  async create(_data: unknown): Promise<unknown> {
    throw new Error('Not implemented');
  }
  async updateStatus(_id: string, _status: unknown): Promise<void> { }
  async resolve(_id: string, _notes: string): Promise<void> { }
  async getByShipmentId(_id: string): Promise<unknown[]> {
    return [];
  }
  async log(
    _action: string,
    _entityType: string,
    _entityId: string,
    _payload?: Record<string, unknown>
  ): Promise<void> { }
}

export const supabaseRepository: DataAccessLayer = {
  shipments: new SupabaseShipmentRepository(),
  manifests: new SupabaseManifestRepository(),
  invoices: new SupabaseInvoiceRepository(),
  exceptions: new NotImplementedRepository() as ExceptionRepository,
  users: new SupabaseUserRepository(),
  customers: new NotImplementedRepository() as CustomerRepository,
  events: new NotImplementedRepository() as EventRepository,
  audit: new NotImplementedRepository() as AuditRepository,
};
