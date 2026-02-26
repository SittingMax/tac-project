import { Hub, HubLocation, ShipmentMode } from '../types';

export type DashboardTimeRange = '7d' | '30d' | '90d';

export const DEFAULT_DASHBOARD_TIME_RANGE: DashboardTimeRange = '7d';

export const HUBS: Record<HubLocation, Hub & { uuid: string }> = {
  IMPHAL: {
    id: 'IMPHAL',
    name: 'Imphal Hub',
    code: 'IMF',
    address: 'Tulihal Airport Road, Imphal, Manipur 795001',
    sortCode: 'SUR',
    uuid: '00000000-0000-0000-0000-000000000010',
  },
  NEW_DELHI: {
    id: 'NEW_DELHI',
    name: 'New Delhi Hub',
    code: 'DEL',
    address: 'Cargo Terminal 3, IGI Airport, New Delhi 110037',
    sortCode: 'GAUA',
    uuid: '00000000-0000-0000-0000-000000000011',
  },
};

export const SHIPMENT_MODES: { id: ShipmentMode; label: string }[] = [
  { id: 'AIR', label: 'Air Cargo' },
  { id: 'TRUCK', label: 'Truck Linehaul' },
];

export const SERVICE_LEVELS = [
  {
    id: 'STANDARD',
    label: 'Standard (3-5 Days)',
    code: 'STD',
    description: 'Regular delivery service',
  },
  { id: 'EXPRESS', label: 'Express (1-2 Days)', code: 'EXP', description: 'Fast delivery service' },
  {
    id: 'PRIORITY',
    label: 'Priority (Same Day)',
    code: 'PRI',
    description: 'Urgent same-day delivery',
  },
];

export const PAYMENT_MODES = [
  { id: 'PAID', label: 'Paid (Prepaid)' },
  { id: 'TO_PAY', label: 'To Pay (Collect)' },
  { id: 'TBB', label: 'TBB (To Be Billed)' },
];

export const INDIAN_STATES = [
  'Manipur',
  'Delhi', // Priority States
];

export const POPULAR_CITIES = ['Imphal', 'New Delhi'];

/** Default address/zip/state prefills for known hub cities */
export const HUB_PREFILL: Record<string, { address: string; zip: string; state: string }> = {
  Imphal: { address: 'Singjamei Hub', zip: '795001', state: 'Manipur' },
  'New Delhi': { address: 'Kotla Hub', zip: '110003', state: 'Delhi' },
};

export const CONTENT_TYPES = [
  'Personal Effects',
  'Documents',
  'Electronics',
  'Clothing/Garments',
  'Auto Parts',
  'Medicines/Pharma',
  'Perishables (Dry)',
  'Household Goods',
  'Books/Stationery',
  'Handicrafts',
  'Machinery Parts',
  'Sports Goods',
];

export const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const GSTIN_ERROR_MESSAGE = 'Invalid GSTIN. Format: 27ABCDE1234F1Z5';
