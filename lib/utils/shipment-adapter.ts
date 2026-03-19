import { ShipmentWithRelations } from '@/hooks/useShipments';
import { HubLocation, Shipment } from '@/types';

/**
 * Adapter: Convert ShipmentWithRelations (Supabase) to Shipment type (UI)
 */
export function adaptToShipment(s: ShipmentWithRelations): Shipment {
  return {
    id: s.id,
    awb: s.cn_number,
    customerId: s.customer_id,
    customerName: s.customer?.name || '',
    originHub: (s.origin_hub?.code || s.origin_hub_id) as HubLocation,
    destinationHub: (s.destination_hub?.code || s.destination_hub_id) as HubLocation,
    mode: s.mode as Shipment['mode'],
    serviceLevel: s.service_level as Shipment['serviceLevel'],
    status: s.status as Shipment['status'],
    totalPackageCount: s.package_count,
    totalWeight: {
      dead: s.total_weight,
      volumetric: 0,
      chargeable: s.total_weight,
    },
    eta: '',
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    consignor: {
      name: s.consignor_name || '',
      phone: s.consignor_phone || '',
      address: typeof s.consignor_address === 'string' ? s.consignor_address : '',
    },
    consignee: {
      name: s.consignee_name || '',
      phone: s.consignee_phone || '',
      address: typeof s.consignee_address === 'string' ? s.consignee_address : '',
    },
    declaredValue: s.declared_value ?? undefined,
    contentsDescription: s.special_instructions || 'General Cargo',
    bookingDate: s.created_at,
  };
}
