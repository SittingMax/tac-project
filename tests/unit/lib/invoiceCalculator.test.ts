/**
 * Unit Tests for Invoice Calculator
 * Based on tac-testing-engineer skill patterns
 * Tests critical invoice calculation logic - requires 100% coverage
 */

import { describe, it, expect } from 'vitest';

// Invoice calculation types
interface InvoiceInput {
  weight: number;
  ratePerKg: number;
  gstRate: number;
  pickupCharge?: number;
  discount?: number;
  gstApplicable?: boolean;
}

interface InvoiceResult {
  baseFreight: number;
  pickupCharge: number;
  discount: number;
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Calculate GST amount
 * Rounds to nearest rupee as per Indian tax regulations
 */
function calculateGST(subtotal: number, gstRate: number): number {
  if (subtotal <= 0 || gstRate <= 0) return 0;
  return Math.round((subtotal * gstRate) / 100);
}

/**
 * Validate AWB number format
 * Format: TAC followed by 8-11 digits
 */
function validateAWB(awb: string): boolean {
  return /^TAC\d{8,11}$/i.test(awb);
}

/**
 * Calculate complete invoice
 * Applies discount before GST as per accounting standards
 */
function calculateInvoice(input: InvoiceInput): InvoiceResult {
  const baseFreight = input.weight * input.ratePerKg;
  const pickupCharge = input.pickupCharge ?? 0;
  const discount = input.discount ?? 0;

  const subtotal = baseFreight + pickupCharge - discount;
  const gstApplicable = input.gstApplicable ?? true;
  const tax = gstApplicable ? calculateGST(subtotal, input.gstRate) : 0;
  const total = subtotal + tax;

  return {
    baseFreight,
    pickupCharge,
    discount,
    subtotal,
    tax,
    total,
  };
}

describe('calculateGST', () => {
  it('calculates 18% GST correctly', () => {
    expect(calculateGST(1000, 18)).toBe(180);
  });

  it('calculates 12% GST correctly', () => {
    expect(calculateGST(1000, 12)).toBe(120);
  });

  it('calculates 5% GST correctly', () => {
    expect(calculateGST(1000, 5)).toBe(50);
  });

  it('rounds to nearest rupee (up)', () => {
    // 999 * 0.18 = 179.82 -> rounds to 180
    expect(calculateGST(999, 18)).toBe(180);
  });

  it('rounds to nearest rupee (down)', () => {
    // 997 * 0.18 = 179.46 -> rounds to 179
    expect(calculateGST(997, 18)).toBe(179);
  });

  it('handles zero subtotal', () => {
    expect(calculateGST(0, 18)).toBe(0);
  });

  it('handles zero rate', () => {
    expect(calculateGST(1000, 0)).toBe(0);
  });

  it('handles negative subtotal', () => {
    expect(calculateGST(-100, 18)).toBe(0);
  });

  it('handles negative rate', () => {
    expect(calculateGST(1000, -18)).toBe(0);
  });

  it('handles large amounts', () => {
    expect(calculateGST(1000000, 18)).toBe(180000);
  });

  it('handles decimal amounts', () => {
    // 1234.56 * 0.18 = 222.22 -> rounds to 222
    expect(calculateGST(1234.56, 18)).toBe(222);
  });
});

describe('validateAWB', () => {
  it('accepts valid AWB format', () => {
    expect(validateAWB('TAC12345678')).toBe(true);
  });

  it('accepts AWB with all zeros', () => {
    expect(validateAWB('TAC00000000')).toBe(true);
  });

  it('accepts AWB with all nines', () => {
    expect(validateAWB('TAC99999999')).toBe(true);
  });

  it('accepts lowercase prefix (case-insensitive)', () => {
    expect(validateAWB('tac12345678')).toBe(true);
  });

  it('accepts mixed case prefix (case-insensitive)', () => {
    expect(validateAWB('Tac12345678')).toBe(true);
  });

  it('rejects wrong prefix', () => {
    expect(validateAWB('ABC12345678')).toBe(false);
  });

  it('rejects too few digits', () => {
    expect(validateAWB('TAC1234567')).toBe(false);
  });

  it('accepts 9-11 digit AWBs', () => {
    expect(validateAWB('TAC123456789')).toBe(true); // 9 digits
    expect(validateAWB('TAC1234567890')).toBe(true); // 10 digits
    expect(validateAWB('TAC12345678901')).toBe(true); // 11 digits
  });

  it('rejects too many digits (> 11)', () => {
    expect(validateAWB('TAC123456789012')).toBe(false); // 12 digits
  });

  it('rejects letters in digit portion', () => {
    expect(validateAWB('TAC1234567A')).toBe(false);
  });

  it('rejects special characters', () => {
    expect(validateAWB('TAC1234567-')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateAWB('')).toBe(false);
  });

  it('rejects whitespace', () => {
    expect(validateAWB('TAC 12345678')).toBe(false);
  });
});

describe('calculateInvoice', () => {
  const baseInput: InvoiceInput = {
    weight: 10,
    ratePerKg: 100,
    gstRate: 18,
    pickupCharge: 50,
    discount: 0,
  };

  it('calculates complete invoice correctly', () => {
    const result = calculateInvoice(baseInput);

    expect(result.baseFreight).toBe(1000); // 10 * 100
    expect(result.pickupCharge).toBe(50);
    expect(result.discount).toBe(0);
    expect(result.subtotal).toBe(1050); // 1000 + 50
    expect(result.tax).toBe(189); // 1050 * 0.18 = 189
    expect(result.total).toBe(1239); // 1050 + 189
  });

  it('applies discount before GST', () => {
    const result = calculateInvoice({ ...baseInput, discount: 100 });

    expect(result.subtotal).toBe(950); // 1000 + 50 - 100
    expect(result.tax).toBe(171); // 950 * 0.18 = 171
    expect(result.total).toBe(1121); // 950 + 171
  });

  it('handles zero weight', () => {
    const result = calculateInvoice({ ...baseInput, weight: 0 });

    expect(result.baseFreight).toBe(0);
    expect(result.subtotal).toBe(50); // Only pickup charge
    expect(result.tax).toBe(9); // 50 * 0.18 = 9
    expect(result.total).toBe(59);
  });

  it('handles no pickup charge', () => {
    const result = calculateInvoice({ ...baseInput, pickupCharge: 0 });

    expect(result.subtotal).toBe(1000);
    expect(result.tax).toBe(180);
    expect(result.total).toBe(1180);
  });

  it('handles GST not applicable', () => {
    const result = calculateInvoice({ ...baseInput, gstApplicable: false });

    expect(result.subtotal).toBe(1050);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(1050);
  });

  it('handles large weights', () => {
    const result = calculateInvoice({ ...baseInput, weight: 1000 });

    expect(result.baseFreight).toBe(100000);
    expect(result.subtotal).toBe(100050);
    expect(result.tax).toBe(18009); // 100050 * 0.18 = 18009
    expect(result.total).toBe(118059);
  });

  it('handles decimal weights', () => {
    const result = calculateInvoice({ ...baseInput, weight: 10.5 });

    expect(result.baseFreight).toBe(1050); // 10.5 * 100
    expect(result.subtotal).toBe(1100); // 1050 + 50
    expect(result.tax).toBe(198); // 1100 * 0.18 = 198
    expect(result.total).toBe(1298);
  });

  it('handles different GST rates', () => {
    const result12 = calculateInvoice({ ...baseInput, gstRate: 12 });
    expect(result12.tax).toBe(126); // 1050 * 0.12 = 126

    const result5 = calculateInvoice({ ...baseInput, gstRate: 5 });
    expect(result5.tax).toBe(53); // 1050 * 0.05 = 52.5 -> 53
  });

  it('defaults optional fields', () => {
    const minimalInput: InvoiceInput = {
      weight: 10,
      ratePerKg: 100,
      gstRate: 18,
    };

    const result = calculateInvoice(minimalInput);

    expect(result.pickupCharge).toBe(0);
    expect(result.discount).toBe(0);
    expect(result.subtotal).toBe(1000);
    expect(result.tax).toBe(180);
    expect(result.total).toBe(1180);
  });
});
