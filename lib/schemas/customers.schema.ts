import { z } from 'zod';
import { GSTIN_PATTERN, GSTIN_ERROR_MESSAGE } from '../constants';

/**
 * Zod schema for customer upsert operations (create/update).
 * Validates form input before sending to the database.
 */
export const customerUpsertSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  companyName: z.string().optional(),
  type: z.enum(['INDIVIDUAL', 'BUSINESS']),
  phone: z.string().min(8, 'Phone must be at least 8 characters'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  tier: z.enum(['STANDARD', 'PRIORITY', 'ENTERPRISE']),
  gstin: z.string().regex(GSTIN_PATTERN, GSTIN_ERROR_MESSAGE).optional().or(z.literal('')),
});

export type CustomerUpsertInput = z.infer<typeof customerUpsertSchema>;

/**
 * Customer row type as returned from the database.
 * Includes all fields including system-generated ones.
 */
export interface CustomerRow {
  id: string;
  created_at: string;
  updated_at: string | null;
  name: string;
  company_name: string | null;
  type: 'INDIVIDUAL' | 'BUSINESS';
  phone: string;
  email: string;
  address: string;
  tier: 'STANDARD' | 'PRIORITY' | 'ENTERPRISE';
  gstin: string | null;
  is_active: boolean;
}

/**
 * Filter options for customer queries.
 */
export interface CustomerFilters {
  search?: string;
  tier?: 'STANDARD' | 'PRIORITY' | 'ENTERPRISE';
  type?: 'INDIVIDUAL' | 'BUSINESS';
  page?: number;
  pageSize?: number;
}

/**
 * Default values for creating a new customer.
 */
export const defaultCustomerValues: CustomerUpsertInput = {
  name: '',
  companyName: '',
  type: 'BUSINESS',
  phone: '',
  email: '',
  address: '',
  tier: 'STANDARD',
  gstin: '',
};

/**
 * Convert a CustomerRow to form default values for editing.
 */
export function customerRowToFormValues(row: CustomerRow): CustomerUpsertInput {
  return {
    name: row.name,
    companyName: row.company_name ?? '',
    type: row.type,
    phone: row.phone,
    email: row.email,
    address: row.address,
    tier: row.tier,
    gstin: row.gstin ?? '',
  };
}
