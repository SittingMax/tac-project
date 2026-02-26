/* eslint-disable @typescript-eslint/no-explicit-any -- Data mapping between Supabase and UI types */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LabelData, LabelGenerator } from '../components/domain/LabelGenerator';
import { generateLabelFromShipment } from '../lib/utils/label-utils';
import { Shipment, HubLocation, ShipmentMode, ServiceLevel, PaymentMode } from '../types';
import { HUBS } from '../lib/constants';
import { logger } from '../lib/logger';
import { supabase } from '../lib/supabase';
import { sanitizeString } from '../lib/utils/sanitize';

const getAddressValue = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const normalizeAddress = (address: unknown) => {
  if (!address || typeof address !== 'object' || Array.isArray(address)) return {};
  const record = address as Record<string, unknown>;
  return {
    line1: getAddressValue(
      record.line1 ??
      record.line_1 ??
      record.street ??
      record.address ??
      record.addr1 ??
      record.address1
    ),
    line2: getAddressValue(
      record.line2 ?? record.line_2 ?? record.street2 ?? record.address2 ?? record.addr2
    ),
    city: getAddressValue(record.city),
    state: getAddressValue(record.state),
    zip: getAddressValue(
      record.zip ?? record.postal_code ?? record.postalCode ?? record.pincode ?? record.pin
    ),
  };
};

const formatAddress = (address: unknown): string => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  const normalized = normalizeAddress(address);
  return [normalized.line1, normalized.line2, normalized.city, normalized.state, normalized.zip]
    .filter(Boolean)
    .join(', ');
};

const resolveAddressParts = (address: unknown) => {
  if (!address || typeof address === 'string') return {};
  return normalizeAddress(address);
};

const resolveHubLocation = (row: any, type: 'origin' | 'destination'): HubLocation => {
  const hubId = type === 'origin' ? row.origin_hub_id : row.destination_hub_id;
  const hubCode = type === 'origin' ? row.origin_hub?.code : row.destination_hub?.code;
  const byUuid = Object.values(HUBS).find((hub) => hub.uuid === hubId)?.id;
  const byCode = Object.values(HUBS).find((hub) => hub.code === hubCode)?.id;
  return (byUuid || byCode || 'IMPHAL') as HubLocation;
};

const resolveMode = (value?: string | null): ShipmentMode => {
  if (!value) return 'TRUCK';
  return value.toUpperCase() === 'AIR' ? 'AIR' : 'TRUCK';
};

const resolveServiceLevel = (value?: string | null): ServiceLevel => {
  if (!value) return 'STANDARD';
  const upper = value.toUpperCase();
  if (upper === 'EXPRESS' || upper === 'PRIORITY' || upper === 'STANDARD') {
    return upper as ServiceLevel;
  }
  return 'STANDARD';
};

const mapShipmentRowToShipment = (row: any): Shipment => {
  const originHub = resolveHubLocation(row, 'origin');
  const destinationHub = resolveHubLocation(row, 'destination');
  const weight = Number(row.total_weight ?? row.totalWeight ?? 0);
  // Prioritize explicit mode field for transport mode, fallback to service type
  const modeValue = row.mode || row.transport_mode || row.service_level || row.service_type;
  // Service level should look at service fields first
  const serviceValue = row.service_level || row.service_type || row.mode;
  const consignorAddressParts = resolveAddressParts(row.consignor_address);
  const consigneeAddressParts = resolveAddressParts(row.consignee_address);

  return {
    id: row.id,
    awb: row.cn_number || row.awb,
    customerId: row.customer_id,
    customerName: row.customer?.name || row.consignee_name || 'Unknown',
    originHub,
    destinationHub,
    mode: resolveMode(modeValue),
    serviceLevel: resolveServiceLevel(serviceValue),
    totalPackageCount: row.total_packages ?? row.package_count ?? 1,
    totalWeight: {
      dead: weight,
      volumetric: 0,
      chargeable: weight,
    },
    status: row.status ?? 'CREATED',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
    eta: 'TBD',
    consignor: {
      name: row.consignor_name || 'CONSIGNOR',
      phone: row.consignor_phone || '',
      address: formatAddress(row.consignor_address),
      city: consignorAddressParts.city || row.consignor_city || row.consignorCity,
      state: consignorAddressParts.state || row.consignor_state || row.consignorState,
      zip: consignorAddressParts.zip || row.consignor_zip || row.consignorZip || row.consignor_pincode,
    },
    consignee: {
      name: row.consignee_name || 'CONSIGNEE',
      phone: row.consignee_phone || '',
      address: formatAddress(row.consignee_address),
      city: consigneeAddressParts.city || row.consignee_city || row.consigneeCity,
      state: consigneeAddressParts.state || row.consignee_state || row.consigneeState,
      zip: consigneeAddressParts.zip || row.consignee_zip || row.consigneeZip || row.consignee_pincode,
    },
    contentsDescription: row.contents || 'General Cargo',
    paymentMode: (row.payment_mode as PaymentMode) || 'TO_PAY',
  };
};

const fetchShipmentByAwb = async (awb?: string) => {
  if (!awb) return null;
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
    .maybeSingle();

  if (error) {
    logger.error('[PrintLabel] Shipment fetch error', { message: error.message });
    return null;
  }

  return data as any;
};

// Validate shipment has required fields for label generation
const validateShipmentForLabel = (shipment: unknown): shipment is Shipment => {
  if (!shipment || typeof shipment !== 'object') return false;
  const s = shipment as Record<string, unknown>;
  return !!(s.awb && typeof s.awb === 'string' && s.destinationHub && s.originHub && s.totalWeight);
};

export const PrintLabel: React.FC = () => {
  const { awb } = useParams();
  const [data, setData] = useState<LabelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const payload = event.data as { type?: string; shipment?: Shipment };
      if (payload?.type !== 'TAC_LABEL_PAYLOAD' || !payload.shipment) return;
      if (!validateShipmentForLabel(payload.shipment)) return;

      const perAwbKey = `print_shipping_label_${payload.shipment.awb}`;
      sessionStorage.setItem(perAwbKey, JSON.stringify(payload.shipment));
      setError(null);
      setData(generateLabelFromShipment(payload.shipment));
      logger.debug('[PrintLabel] Payload received via postMessage');
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadShipmentData = async () => {
      try {
        if (!awb) {
          if (isMounted) setError('missing CN for label generation.');
          return;
        }
        // Try per-AWB key first (new format), then fallback to legacy key
        const perAwbKey = `print_shipping_label_${awb}`;
        const legacyKey = 'print_shipping_label';

        logger.debug('[PrintLabel] Attempt', { attempt: retryCount + 1, awb });

        // Prefer sessionStorage for this tab; fall back to localStorage (Firefox ETP may block localStorage)
        const sessionValue = sessionStorage.getItem(perAwbKey);
        const localValue = localStorage.getItem(perAwbKey);
        let stored = sessionValue || localValue;
        let usedKey = perAwbKey;
        let usedStorage: 'localStorage' | 'sessionStorage' = sessionValue
          ? 'sessionStorage'
          : localValue
            ? 'localStorage'
            : 'sessionStorage';

        logger.debug('[PrintLabel] Per-AWB key result', { found: !!stored, storage: usedStorage });

        if (!stored) {
          const legacySession = sessionStorage.getItem(legacyKey);
          const legacyLocal = localStorage.getItem(legacyKey);
          stored = legacySession || legacyLocal;
          usedKey = legacyKey;
          usedStorage = legacySession
            ? 'sessionStorage'
            : legacyLocal
              ? 'localStorage'
              : 'sessionStorage';
          logger.debug('[PrintLabel] Legacy key result', { found: !!stored, storage: usedStorage });
        }

        // Debug: List all storage keys containing 'label'
        const localKeys = Object.keys(localStorage).filter((k) => k.includes('label'));
        const sessionKeys = Object.keys(sessionStorage).filter((k) => k.includes('label'));
        logger.debug('[PrintLabel] Storage keys', { localKeys, sessionKeys });

        if (!stored && typeof window.name === 'string' && window.name.startsWith('TAC_LABEL:')) {
          stored = window.name.replace('TAC_LABEL:', '');
          usedStorage = 'window.name' as typeof usedStorage;
          logger.debug('[PrintLabel] window.name payload used', { storage: usedStorage });
        }

        if (!stored) {
          // Retry briefly to handle storage race, then fall back to DB fetch.
          if (retryCount < 2) {
            logger.debug('[PrintLabel] Data not found, retrying in 300ms');
            setTimeout(() => setRetryCount((c) => c + 1), 300);
            return;
          }

          logger.debug('[PrintLabel] Falling back to DB fetch', { awb });
          const fetched = await fetchShipmentByAwb(awb);
          if (fetched) {
            const shipment = mapShipmentRowToShipment(fetched);
            if (isMounted) {
              sessionStorage.setItem(perAwbKey, JSON.stringify(shipment));
              setData(generateLabelFromShipment(shipment));
            }
            return;
          }

          if (isMounted) {
            setError('No shipment data found. Please generate label from Invoices dashboard.');
          }
          return;
        }

        const parsed = JSON.parse(stored);
        logger.debug('[PrintLabel] Parsed data', { awb: parsed.awb });

        // Persist payload in this tab's sessionStorage to survive StrictMode remounts
        sessionStorage.setItem(perAwbKey, stored);

        // Validate shipment data before processing
        if (!validateShipmentForLabel(parsed)) {
          logger.warn('[PrintLabel] Validation failed', {
            awb: parsed.awb,
            originHub: parsed.originHub,
            destinationHub: parsed.destinationHub,
            totalWeight: parsed.totalWeight,
          });
          setError('Invalid shipment data. Missing required fields (AWB, hubs, or weight).');
          return;
        }

        const shipment = parsed as Shipment;

        // CRITICAL: If the CN in storage doesn't match the URL, don't use stale data.
        // Fall back to a fresh database fetch for the correct AWB.
        if (shipment.awb !== awb) {
          logger.warn('[PrintLabel] AWB mismatch — storage has stale data', {
            urlCN: awb,
            storedCN: shipment.awb,
          });
          // Clear stale storage entry
          localStorage.removeItem(usedKey);
          sessionStorage.removeItem(usedKey);

          // Fetch the correct shipment from DB instead
          const fetched = await fetchShipmentByAwb(awb);
          if (fetched) {
            const correctShipment = mapShipmentRowToShipment(fetched);
            if (isMounted) {
              sessionStorage.setItem(perAwbKey, JSON.stringify(correctShipment));
              setData(generateLabelFromShipment(correctShipment));
            }
          } else if (isMounted) {
            setError(`Shipment data for ${awb} not found. Stored data was for a different AWB.`);
          }
          return;
        }

        if (isMounted) {
          setData(generateLabelFromShipment(shipment));
        }

        // Clean up localStorage after reading to prevent PII lingering
        localStorage.removeItem(usedKey);
      } catch (e) {
        console.error('Failed to load shipment:', e);
        if (isMounted) {
          setError('Failed to parse shipment data. Please try generating the label again.');
        }
      }
    };

    loadShipmentData();
    return () => {
      isMounted = false;
    };
  }, [awb, retryCount]);

  // Set document title for printing
  useEffect(() => {
    if (data) {
      const titleName = data.recipient?.name || data.awb || 'Label';
      document.title = `LABEL-${data.awb}-${sanitizeString(titleName)}`;
    }
    return () => {
      document.title = 'WGS Portal';
    };
  }, [data]);

  // Auto print when loaded - MUST be before any conditional returns!
  useEffect(() => {
    if (data) {
      setTimeout(() => {
        // window.print();
        // User might want to preview first.
      }, 500);
    }
  }, [data]);

  if (error) {
    return <div className="p-8 text-destructive font-bold">{error}</div>;
  }

  if (!data) {
    return <div className="p-8">Loading label...</div>;
  }

  return (
    <div className="min-h-screen bg-muted flex justify-center">
      <LabelGenerator data={data} />
    </div>
  );
};
