import type { Json } from '@/lib/database.types';
import type { CustomerAddress } from '@/hooks/useCustomers';

/**
 * Ensures a value is a trimmed string
 */
export const getAddressValue = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

/**
 * Parses a raw address string into structured components (line1, city, state, zip)
 */
export const parseAddressString = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return {};

  // Extract 6-digit Indian PIN code
  const zipMatch = trimmed.match(/\b(\d{6})\b/);
  const zip = zipMatch?.[1] || '';

  const withoutZip = zip ? trimmed.replace(zip, '').replace(/[\s,]+$/, '') : trimmed;
  const parts = withoutZip
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  let line1 = '';
  let line2 = '';
  let city = '';
  let state = '';

  if (parts.length >= 3) {
    state = parts.pop() || '';
    city = parts.pop() || '';
    line1 = parts.shift() || '';
    line2 = parts.join(', ');
  } else if (parts.length === 2) {
    line1 = parts[0];
    city = parts[1];
  } else {
    line1 = withoutZip;
  }

  return { line1, line2, city, state, zip };
};

/**
 * Normalizes any supported address format (string, Json object, or structured object)
 * into a consistent structure.
 */
export const normalizeCustomerAddress = (
  address: CustomerAddress | Json | string | null | undefined
) => {
  if (!address) return {};
  if (typeof address === 'string') return parseAddressString(address);
  if (typeof address !== 'object' || Array.isArray(address)) return {};

  const record = address as Record<string, unknown>;
  const line1 = getAddressValue(
    record.line1 ??
      record.line_1 ??
      record.street ??
      record.address ??
      record.addr1 ??
      record.address1
  );
  const line2 = getAddressValue(
    record.line2 ?? record.line_2 ?? record.street2 ?? record.address2 ?? record.addr2
  );
  const city = getAddressValue(record.city);
  const state = getAddressValue(record.state);
  const zip = getAddressValue(
    record.zip ?? record.postal_code ?? record.postalCode ?? record.pincode ?? record.pin
  );

  return { line1, line2, city, state, zip };
};

/**
 * Formats a normalized address back into a human-readable single string representation.
 */
export const formatCustomerAddress = (
  address: CustomerAddress | Json | string | null | undefined
): string => {
  if (!address) return '';
  if (typeof address === 'string') return address;

  const normalized = normalizeCustomerAddress(address);
  // Prefer the specific street address lines
  const streetLine = [normalized.line1, normalized.line2].filter(Boolean).join(', ');
  if (streetLine) return streetLine;

  // Fallback to city/state/zip if line1 is missing
  return [normalized.city, normalized.state, normalized.zip].filter(Boolean).join(', ');
};
