import { z } from 'zod';

/**
 * Shipment validation schemas
 * Based on tac-code-reviewer skill requirements
 */

// AWB pattern validation
export const AWB_PATTERN = /^(TAC|WEE)\d{8,11}$/i;

// Shipment status enum
export const ShipmentStatus = z.enum([
  'CREATED',
  'PICKUP_SCHEDULED',
  'PICKED_UP',
  'RECEIVED_AT_ORIGIN',
  'IN_TRANSIT',
  'RECEIVED_AT_DEST',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RTO',
  'EXCEPTION',
]);

export type ShipmentStatusType = z.infer<typeof ShipmentStatus>;

// Package dimensions schema
export const packageDimensionsSchema = z.object({
  length: z.number().positive('Length must be positive'),
  width: z.number().positive('Width must be positive'),
  height: z.number().positive('Height must be positive'),
  weight: z.number().positive('Weight must be positive'),
});

// Address schema
export const addressSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
});

// Create shipment schema
export const createShipmentSchema = z
  .object({
    cn_number: z
      .string()
      .regex(AWB_PATTERN, 'CN must match format WGS + 8-11 digits (e.g., WGS12345678)'),

    // Consignor Details
    consignor_name: z.string().min(2, 'Consignor Name required'),
    consignor_phone: z.string().min(10, 'Consignor Phone required'),
    consignor_address: z.string().min(5, 'Consignor address required'),

    // Consignee Details
    consignee_name: z.string().min(2, 'Consignee Name required'),
    consignee_phone: z.string().min(10, 'Consignee Phone required'),
    consignee_address: z.string().min(5, 'Consignee address required'),

    // Package details
    total_packages: z.number().int().positive('At least 1 package required'),
    total_weight: z.number().positive('Weight must be positive'),
    declared_value: z.number().nonnegative('Declared value cannot be negative'),

    // Payment
    payment_mode: z.enum(['PREPAID', 'COD', 'TBB']),
    cod_amount: z.number().nonnegative().optional(),

    // Service type
    service_type: z.enum(['STANDARD', 'EXPRESS', 'ECONOMY']).default('STANDARD'),

    // Optional
    contents_description: z.string().optional(),
    special_instructions: z.string().optional(),
  })
  .refine(
    (data) => {
      // COD amount required if payment mode is COD
      if (data.payment_mode === 'COD') {
        return data.cod_amount !== undefined && data.cod_amount > 0;
      }
      return true;
    },
    {
      message: 'COD amount is required when payment mode is COD',
      path: ['cod_amount'],
    }
  );

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;

// Update shipment status schema
export const updateShipmentStatusSchema = z.object({
  shipment_id: z.string().uuid('Invalid shipment ID'),
  status: ShipmentStatus,
  notes: z.string().optional(),
  location: z.string().optional(),
});

export type UpdateShipmentStatusInput = z.infer<typeof updateShipmentStatusSchema>;

// Shipment search/filter schema
export const shipmentFilterSchema = z.object({
  search: z.string().optional(),
  status: ShipmentStatus.optional(),
  from_date: z.date().optional(),
  to_date: z.date().optional(),
  payment_mode: z.enum(['PREPAID', 'COD', 'TBB']).optional(),
  page: z.number().int().positive().default(1),
  page_size: z.number().int().min(1).max(100).default(20),
});

export type ShipmentFilterInput = z.infer<typeof shipmentFilterSchema>;

/**
 * Validate CN Number format
 */
export function isValidAWB(awb: string): boolean {
  return AWB_PATTERN.test(awb);
}

/**
 * Valid status transitions based on TAC business rules
 */
export const VALID_STATUS_TRANSITIONS: Record<ShipmentStatusType, ShipmentStatusType[]> = {
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

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: ShipmentStatusType,
  newStatus: ShipmentStatusType
): boolean {
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
  return allowedTransitions.includes(newStatus);
}
