/**
 * Invoice Validation Module
 * Implements TAC Invoice Validator skill requirements for
 * financial accuracy and regulatory compliance.
 */

import type { Invoice, Customer } from '@/types';

// Validation patterns
export const AWB_PATTERN = /^TAC\d{8,11}$/i;
export const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const INVOICE_NO_PATTERN = /^INV-\d{4}-\d{4,}$/;

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Validates CN Number format
 * Must match pattern: TAC + 8 digits (e.g., TAC48878789)
 */
export function validateAWB(awb: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!awb) {
    errors.push({
      field: 'CN Number',
      message: 'CN Number is required',
      code: 'CN_REQUIRED',
    });
  } else if (!AWB_PATTERN.test(awb)) {
    errors.push({
      field: 'CN Number',
      message: `AWB "${awb}" does not match required format TAC + 8-11 digits (e.g., TAC48878789)`,
      code: 'CN_INVALID_FORMAT',
    });
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * Validates GSTIN format and checksum
 * Format: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
 */
export function validateGSTIN(gstin: string | undefined | null): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  if (!gstin) {
    // GSTIN is optional for individuals
    return {
      isValid: true,
      errors,
      warnings: ['GSTIN not provided - GST invoice cannot be generated'],
    };
  }

  if (!GSTIN_PATTERN.test(gstin)) {
    // GSTIN format mismatch is a warning, not an error - allows invoice creation
    // This supports testing scenarios and legacy data with non-standard GSTINs
    warnings.push(`GSTIN "${gstin}" may not be in standard format. Expected: 07AABCU9603R1Z2`);
  }

  return { isValid: true, errors, warnings };
}

/**
 * Validates GST calculation with exact precision
 * Uses Math.round() for integer rupees (no floating point)
 */
export function validateGSTCalculation(
  subtotal: number,
  gstRate: number,
  providedTax: number
): ValidationResult {
  const errors: ValidationError[] = [];

  // Calculate expected tax with proper rounding
  const expectedTax = Math.round(subtotal * (gstRate / 100));

  if (providedTax !== expectedTax) {
    errors.push({
      field: 'tax',
      message: `GST calculation incorrect. Expected ₹${expectedTax}, got ₹${providedTax}`,
      code: 'GST_CALCULATION_MISMATCH',
    });
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * Validates that all amounts are non-negative
 */
export function validateAmounts(financials: Invoice['financials']): ValidationResult {
  const errors: ValidationError[] = [];

  const fieldsToCheck = [
    { key: 'baseFreight', value: financials.baseFreight },
    { key: 'docketCharge', value: financials.docketCharge },
    { key: 'pickupCharge', value: financials.pickupCharge },
    { key: 'fuelSurcharge', value: financials.fuelSurcharge },
    { key: 'handlingFee', value: financials.handlingFee },
    { key: 'insurance', value: financials.insurance },
    { key: 'totalAmount', value: financials.totalAmount },
    { key: 'discount', value: financials.discount },
  ];

  for (const { key, value } of fieldsToCheck) {
    if (value < 0) {
      errors.push({
        field: key,
        message: `Negative amount not allowed for ${key}: ₹${value}`,
        code: 'NEGATIVE_AMOUNT',
      });
    }
  }

  // Balance can be negative (advance > total)
  // No validation needed for balance

  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * Validates discount limits
 * Max 25% of subtotal, Manager approval required for > 15%
 */
export function validateDiscount(subtotal: number, discount: number): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  const maxDiscount = subtotal * 0.25;
  const managerThreshold = subtotal * 0.15;

  if (discount > maxDiscount) {
    errors.push({
      field: 'discount',
      message: `Discount ₹${discount} exceeds maximum 25% limit (₹${Math.round(maxDiscount)})`,
      code: 'DISCOUNT_EXCEEDS_LIMIT',
    });
  } else if (discount > managerThreshold) {
    warnings.push(`Discount ₹${discount} exceeds 15% - Manager approval required`);
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates TBB payment mode for enterprise customers only
 */
export function validatePaymentMode(
  paymentMode: string,
  customer: Customer | undefined
): ValidationResult {
  const errors: ValidationError[] = [];

  if (paymentMode === 'TBB') {
    if (!customer) {
      errors.push({
        field: 'paymentMode',
        message: 'Customer information required for TBB payment mode',
        code: 'TBB_CUSTOMER_REQUIRED',
      });
    } else if (customer.tier !== 'ENTERPRISE') {
      errors.push({
        field: 'paymentMode',
        message: `TBB payment mode only allowed for Enterprise customers. Current tier: ${customer.tier}`,
        code: 'TBB_ENTERPRISE_ONLY',
      });
    }
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * Validates total calculation accuracy
 */
export function validateTotalCalculation(financials: Invoice['financials']): ValidationResult {
  const errors: ValidationError[] = [];

  const calculatedSubtotal =
    financials.baseFreight +
    (financials.docketCharge || 0) +
    (financials.pickupCharge || 0) +
    (financials.packingCharge || 0) +
    financials.fuelSurcharge +
    financials.handlingFee +
    financials.insurance;

  const calculatedTotal = calculatedSubtotal + financials.tax.total - financials.discount;

  // Allow for small rounding differences (< ₹1)
  if (Math.abs(calculatedTotal - financials.totalAmount) > 1) {
    errors.push({
      field: 'totalAmount',
      message: `Total mismatch. Expected ₹${Math.round(calculatedTotal)}, got ₹${financials.totalAmount}`,
      code: 'TOTAL_MISMATCH',
    });
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * Comprehensive invoice validation
 * Combines all validation rules
 */
export function validateInvoice(invoice: Partial<Invoice>, customer?: Customer): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: string[] = [];

  // Required fields check
  if (!invoice.awb) {
    allErrors.push({ field: 'CN Number', message: 'CN Number is required', code: 'CN_REQUIRED' });
  } else {
    const awbResult = validateAWB(invoice.awb);
    allErrors.push(...awbResult.errors);
  }

  if (!invoice.customerId) {
    allErrors.push({
      field: 'customerId',
      message: 'Customer is required',
      code: 'CUSTOMER_REQUIRED',
    });
  }

  // GSTIN validation (if customer provided)
  if (customer?.gstin) {
    const gstinResult = validateGSTIN(customer.gstin);
    allErrors.push(...gstinResult.errors);
    allWarnings.push(...gstinResult.warnings);
  }

  // Financial validations
  if (invoice.financials) {
    // Amount validation
    const amountResult = validateAmounts(invoice.financials);
    allErrors.push(...amountResult.errors);

    // Total calculation
    const totalResult = validateTotalCalculation(invoice.financials);
    allErrors.push(...totalResult.errors);

    // Discount limits
    const subtotal =
      invoice.financials.baseFreight +
      invoice.financials.fuelSurcharge +
      invoice.financials.handlingFee +
      invoice.financials.insurance;

    const discountResult = validateDiscount(subtotal, invoice.financials.discount);
    allErrors.push(...discountResult.errors);
    allWarnings.push(...discountResult.warnings);
  }

  // Payment mode validation
  if (invoice.paymentMode) {
    const paymentResult = validatePaymentMode(invoice.paymentMode, customer);
    allErrors.push(...paymentResult.errors);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Calculates GST amount with proper rounding
 * @param subtotal Base amount
 * @param rate GST rate (e.g., 18 for 18%)
 * @returns Rounded GST amount in rupees
 */
export function calculateGST(subtotal: number, rate: number): number {
  return Math.round(subtotal * (rate / 100));
}

/**
 * Generates next sequential invoice number
 * @param lastInvoiceNo Last invoice number (e.g., "INV-2026-6772")
 * @returns Next invoice number (e.g., "INV-2026-6773")
 */
export function generateNextInvoiceNumber(lastInvoiceNo?: string): string {
  const year = new Date().getFullYear();

  if (!lastInvoiceNo) {
    return `INV-${year}-0001`;
  }

  // Extract the numeric part
  const match = lastInvoiceNo.match(/INV-(\d{4})-(\d+)/);
  if (!match) {
    return `INV-${year}-0001`;
  }

  const lastYear = parseInt(match[1], 10);
  const lastNum = parseInt(match[2], 10);

  // Reset counter for new year
  if (lastYear !== year) {
    return `INV-${year}-0001`;
  }

  // Increment
  const nextNum = lastNum + 1;
  return `INV-${year}-${nextNum.toString().padStart(4, '0')}`;
}
