/* eslint-disable @typescript-eslint/no-explicit-any -- Label generation requires any for dynamic form/invoice data */
import { LabelData, ServiceLevel, TransportMode } from '@/components/domain/LabelGenerator';
import { HUBS } from '@/lib/constants';
import { HubLocation, Shipment } from '@/types';

type LabelShipmentLike = Omit<Partial<Shipment>, 'originHub' | 'destinationHub'> & {
  originHub?: string | null;
  destinationHub?: string | null;
};

const getTextValue = (value?: string | null): string =>
  typeof value === 'string' ? value.trim() : '';

const resolveHubRecord = (value?: string | null) => {
  if (!value) return null;
  const hubKey = value as HubLocation;
  const direct = HUBS[hubKey];
  if (direct) return direct;
  return (
    Object.values(HUBS).find(
      (hub) => hub.code === value || hub.id === value || hub.uuid === value
    ) ?? null
  );
};

const resolveHubCode = (value?: string | null): string => {
  if (!value) return '';
  return resolveHubRecord(value)?.code || value;
};

const resolveHubName = (value?: string | null): string => {
  if (!value) return '';
  return resolveHubRecord(value)?.name || value;
};

const resolveHubAddress = (value?: string | null): string => {
  return resolveHubRecord(value)?.address || '';
};

const normalizeServiceLevel = (value?: string | null): ServiceLevel => {
  if (!value) return 'STANDARD';
  const upper = value.toUpperCase();
  if (upper === 'EXPRESS' || upper === 'PRIORITY' || upper === 'STANDARD') {
    return upper as ServiceLevel;
  }
  return 'STANDARD';
};

export const generateLabelFromShipment = (
  shipment: LabelShipmentLike,
  invoiceData?: any
): LabelData => {
  const serviceLevel = normalizeServiceLevel(shipment.serviceLevel);

  const modeInput = String(shipment.mode || '')
    .toUpperCase()
    .trim();
  const transportMode: TransportMode =
    modeInput === 'AIR' || modeInput === 'AIR CARGO' ? 'AIR' : 'TRUCK';

  const serviceLevelCode: Record<ServiceLevel, string> = {
    STANDARD: 'STD',
    EXPRESS: 'EXP',
    PRIORITY: 'PRI',
  };

  const originCode = resolveHubCode(shipment.originHub || '') || 'UNK';
  const destinationCode = resolveHubCode(shipment.destinationHub || '') || 'UNK';
  const destinationName = resolveHubName(shipment.destinationHub || '');
  const recipientCity =
    getTextValue(shipment.consignee?.city) || destinationName.replace(' Hub', '');
  const recipientZip = getTextValue(shipment.consignee?.zip);
  const cityLine = [recipientCity, recipientZip].filter(Boolean).join(' ');

  return {
    awb: shipment.awb || 'TAC-PENDING',
    transportMode,
    serviceLevel,
    serviceName: `${serviceLevel} ${transportMode === 'AIR' ? 'AIR' : 'SURFACE'}`,
    serviceCode: serviceLevelCode[serviceLevel],
    weight: Number(shipment.totalWeight?.chargeable || shipment.totalWeight?.dead || 0),
    weightUnit: 'kg',
    paymentMode: shipment.paymentMode || 'TO PAY',
    recipient: {
      name: shipment.consignee?.name || shipment.customerName || 'CONSIGNEE',
      address:
        shipment.consignee?.address || resolveHubAddress(shipment.destinationHub || '') || '',
      city: cityLine,
      state: shipment.consignee?.state,
    },
    routing: {
      origin: originCode,
      destination: destinationCode,
      deliveryStation: destinationCode,
      originSort: originCode,
      destSort: destinationCode,
    },
    dates: {
      shipDate: shipment.bookingDate
        ? new Date(shipment.bookingDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
      invoiceDate: invoiceData?.createdAt
        ? new Date(invoiceData.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
    },
    gstNumber: shipment.consignee?.gstin || invoiceData?.gstNumber,
  };
};

export const generateLabelFromFormData = (formData: any): LabelData => {
  const serviceLevel = normalizeServiceLevel(formData.serviceLevel);
  const modeInput = String(formData.transportMode || '')
    .toUpperCase()
    .trim();
  const transportMode: TransportMode =
    modeInput === 'AIR' || modeInput === 'AIR CARGO' ? 'AIR' : 'TRUCK';
  const serviceLevelCode: Record<ServiceLevel, string> = {
    STANDARD: 'STD',
    EXPRESS: 'EXP',
    PRIORITY: 'PRI',
  };

  const recipientCity = getTextValue(formData.consigneeCity);
  const recipientZip = getTextValue(formData.consigneeZip);
  const cityLine = [recipientCity, recipientZip].filter(Boolean).join(' ');

  // Resolve hub codes from consignor/consignee city instead of hardcoding
  const resolveCodeFromCity = (city: string, fallback: string): string => {
    if (!city) return fallback;
    const c = city.toLowerCase();
    if (c.includes('imphal') || c.includes('manipur')) return HUBS.IMPHAL.code;
    if (c.includes('delhi') || c.includes('new delhi')) return HUBS.NEW_DELHI.code;
    return fallback;
  };

  const originCode = resolveCodeFromCity(getTextValue(formData.consignorCity), 'UNK');
  const destCode = resolveCodeFromCity(recipientCity, 'UNK');

  return {
    awb: formData.awb || 'TAC-PENDING',
    transportMode,
    serviceLevel,
    serviceName: `${serviceLevel} ${transportMode === 'AIR' ? 'AIR' : 'SURFACE'}`,
    serviceCode: serviceLevelCode[serviceLevel],
    weight: Number(formData.chargedWeight || formData.actualWeight || 0),
    weightUnit: 'kg',
    paymentMode: formData.paymentMode || 'TO PAY',
    recipient: {
      name: formData.consigneeName || 'CONSIGNEE',
      address: formData.consigneeAddress || '',
      city: cityLine,
      state: formData.consigneeState,
    },
    routing: {
      origin: originCode,
      destination: destCode,
      deliveryStation: destCode,
      originSort: originCode,
      destSort: destCode,
    },
    dates: {
      shipDate: formData.bookingDate
        ? new Date(formData.bookingDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
      invoiceDate: formData.bookingDate
        ? new Date(formData.bookingDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
    },
    gstNumber: formData.consigneeGstin || formData.gstNumber,
  };
};
