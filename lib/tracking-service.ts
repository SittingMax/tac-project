import { supabase } from './supabase';
import type { Database, Json } from './database.types';
import { logger } from '@/lib/logger';

export interface TrackingData {
  shipment: {
    reference: string;
    status: string;
    consignee_name: string | null;
    consignee_city: string | null;
    origin: string;
    destination: string;
    mode: 'AIR' | 'TRUCK';
  };
  events: Array<{
    status: string;
    description: string | null;
    created_at: string;
  }>;
}

type PublicTrackingEventRow = {
  status: string;
  description?: string | null;
  created_at: string;
};

type PublicTrackingRpcRow =
  Database['public']['Functions']['get_public_shipment_by_cn']['Returns'][number];

const mapPublicTrackingEvents = (value: Json): PublicTrackingEventRow[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return [];
    }

    const status = typeof item.status === 'string' ? item.status : null;
    const createdAt = typeof item.created_at === 'string' ? item.created_at : null;
    if (!status || !createdAt) {
      return [];
    }

    return [
      {
        status,
        description: typeof item.description === 'string' ? item.description : null,
        created_at: createdAt,
      },
    ];
  });
};

/**
 * Public tracking API - fetches shipment info by CN Number from Supabase.
 * This is used by the landing page tracking feature.
 */
export const getTrackingInfo = async (
  trackingNumber: string
): Promise<{ success: boolean; data?: TrackingData; error?: string }> => {
  const ref = trackingNumber.trim().toUpperCase();

  try {
    const { data: shipment, error } = await supabase.rpc('get_public_shipment_by_cn', {
      cn_code: ref,
    });

    if (error) throw error;
    const shipmentRows: PublicTrackingRpcRow[] = shipment ?? [];

    if (shipmentRows.length > 0) {
      const s = shipmentRows[0];
      return {
        success: true,
        data: {
          shipment: {
            reference: s.cn_number,
            status: s.status,
            consignee_name: 'Consignee',
            consignee_city: null,
            origin: s.origin_hub_name || 'Origin Hub',
            destination: s.destination_hub_name || 'Destination Hub',
            mode: s.mode === 'AIR' ? 'AIR' : 'TRUCK',
          },
          events: mapPublicTrackingEvents(s.events).map((e) => ({
            status: e.status,
            description: e.description || '',
            created_at: e.created_at,
          })),
        },
      };
    }

    return { success: false, error: 'Shipment not found. Please check the CN Number.' };
  } catch (error) {
    logger.error('TrackingService', 'Tracking lookup error', { error });
    return { success: false, error: 'Failed to fetch tracking information. Please try again.' };
  }
};
