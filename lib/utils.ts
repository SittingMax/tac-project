import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ShipmentStatus, ShipmentMode, ServiceLevel } from '../types';

/**
 * Merges Tailwind CSS classes with clsx and tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a currency amount for INR.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a date string to a readable enterprise format.
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculates Freight Charges based on logic.
 */
export function calculateFreight(weight: number, mode: ShipmentMode, service: ServiceLevel) {
  let ratePerKg = mode === 'AIR' ? 120 : 40; // Base rates
  if (service === 'EXPRESS') ratePerKg *= 1.5;

  // Minimum weights
  const chargeableWeight = Math.max(weight, mode === 'AIR' ? 1 : 10);

  const baseFreight = Math.round(chargeableWeight * ratePerKg);
  const fuelSurcharge = Math.round(baseFreight * 0.1); // 10%
  const handlingFee = 50;
  const insurance = Math.round(baseFreight * 0.02); // 2%

  // New Standard Charges
  const docketCharge = 80;
  const pickupCharge = 100;
  const packingCharge = 50;

  const subtotal =
    baseFreight +
    fuelSurcharge +
    handlingFee +
    insurance +
    docketCharge +
    pickupCharge +
    packingCharge;
  const igst = Math.round(subtotal * 0.18); // 18% GST
  const totalAmount = subtotal + igst;

  return {
    ratePerKg,
    baseFreight,
    fuelSurcharge,
    handlingFee,
    insurance,
    docketCharge,
    pickupCharge,
    packingCharge,
    tax: { cgst: 0, sgst: 0, igst, total: igst },
    discount: 0,
    totalAmount,
    advancePaid: 0,
    balance: totalAmount,
  };
}

/**
 * Validates Shipment State Transitions (Strict Mode)
 */
export function isValidTransition(current: ShipmentStatus, next: ShipmentStatus): boolean {
  const FLOW: Record<ShipmentStatus, ShipmentStatus[]> = {
    CREATED: ['PICKUP_SCHEDULED', 'CANCELLED'],
    PICKUP_SCHEDULED: ['PICKED_UP', 'CANCELLED'],
    PICKED_UP: ['RECEIVED_AT_ORIGIN', 'EXCEPTION'],
    RECEIVED_AT_ORIGIN: ['IN_TRANSIT', 'EXCEPTION'],
    IN_TRANSIT: ['RECEIVED_AT_DEST', 'EXCEPTION'],
    RECEIVED_AT_DEST: ['OUT_FOR_DELIVERY', 'EXCEPTION'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'RTO', 'EXCEPTION'],
    DELIVERED: [], // Terminal state
    CANCELLED: [], // Terminal state
    RTO: ['RECEIVED_AT_ORIGIN'], // Can re-enter flow
    EXCEPTION: ['RECEIVED_AT_ORIGIN', 'RECEIVED_AT_DEST', 'CANCELLED'],
  };

  // Allow forcing EXCEPTION from almost anywhere
  if (next === 'EXCEPTION') return true;
  if (next === 'CANCELLED') return true;

  // Check strict flow
  return FLOW[current]?.includes(next) || false;
}
