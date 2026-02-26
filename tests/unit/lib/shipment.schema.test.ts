import { describe, it, expect } from 'vitest';
import {
  createShipmentSchema,
  updateShipmentStatusSchema,
  shipmentFilterSchema,
  isValidAWB,
  isValidStatusTransition,
  AWB_PATTERN,
} from '@/lib/schemas/shipment.schema';

describe('Shipment Schema Validation', () => {
  describe('AWB Validation', () => {
    it('validates correct AWB format', () => {
      expect(isValidAWB('TAC12345678')).toBe(true);
      expect(isValidAWB('TAC00000001')).toBe(true);
      expect(isValidAWB('TAC99999999')).toBe(true);
    });

    it('accepts 9-11 digit AWBs', () => {
      expect(isValidAWB('TAC123456789')).toBe(true); // 9 digits
      expect(isValidAWB('TAC1234567890')).toBe(true); // 10 digits
      expect(isValidAWB('TAC12345678901')).toBe(true); // 11 digits
    });

    it('accepts lowercase AWB (case-insensitive)', () => {
      expect(isValidAWB('tac12345678')).toBe(true);
    });

    it('rejects invalid AWB formats', () => {
      expect(isValidAWB('TAC1234567')).toBe(false); // Too short (7 digits)
      expect(isValidAWB('TAC123456789012')).toBe(false); // Too long (12 digits)
      expect(isValidAWB('ABC12345678')).toBe(false); // Wrong prefix
      expect(isValidAWB('TAC1234567A')).toBe(false); // Contains letter
      expect(isValidAWB('')).toBe(false); // Empty
    });

    it('AWB_PATTERN regex matches expected format', () => {
      expect(AWB_PATTERN.test('TAC48878789')).toBe(true);
      expect(AWB_PATTERN.test('TAC00000000')).toBe(true);
    });
  });

  describe('createShipmentSchema', () => {
    const validShipment = {
      cn_number: 'TAC12345678',
      consignor_name: 'John Doe',
      consignor_phone: '9876543210',
      consignor_address: '123 Main St, City',
      consignee_name: 'Jane Doe',
      consignee_phone: '9876543211',
      consignee_address: '456 Oak Ave, Town',
      total_packages: 1,
      total_weight: 5.5,
      declared_value: 1000,
      payment_mode: 'PREPAID' as const,
      service_type: 'STANDARD' as const,
    };

    it('validates a correct shipment', () => {
      const result = createShipmentSchema.safeParse(validShipment);
      expect(result.success).toBe(true);
    });

    it('rejects invalid AWB format', () => {
      const result = createShipmentSchema.safeParse({
        ...validShipment,
        cn_number: 'INVALID',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('cn_number');
      }
    });

    it('rejects negative weight', () => {
      const result = createShipmentSchema.safeParse({
        ...validShipment,
        total_weight: -1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects zero packages', () => {
      const result = createShipmentSchema.safeParse({
        ...validShipment,
        total_packages: 0,
      });
      expect(result.success).toBe(false);
    });

    it('requires COD amount when payment mode is COD', () => {
      const result = createShipmentSchema.safeParse({
        ...validShipment,
        payment_mode: 'COD',
        cod_amount: undefined,
      });
      expect(result.success).toBe(false);
    });

    it('accepts COD with valid amount', () => {
      const result = createShipmentSchema.safeParse({
        ...validShipment,
        payment_mode: 'COD',
        cod_amount: 500,
      });
      expect(result.success).toBe(true);
    });

    it('rejects COD with zero amount', () => {
      const result = createShipmentSchema.safeParse({
        ...validShipment,
        payment_mode: 'COD',
        cod_amount: 0,
      });
      expect(result.success).toBe(false);
    });

    it('validates all payment modes', () => {
      ['PREPAID', 'COD', 'TBB'].forEach((mode) => {
        const data = {
          ...validShipment,
          payment_mode: mode,
          cod_amount: mode === 'COD' ? 500 : undefined,
        };
        const result = createShipmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('validates all service types', () => {
      ['STANDARD', 'EXPRESS', 'ECONOMY'].forEach((type) => {
        const result = createShipmentSchema.safeParse({
          ...validShipment,
          service_type: type,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('updateShipmentStatusSchema', () => {
    it('validates valid status update', () => {
      const result = updateShipmentStatusSchema.safeParse({
        shipment_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'IN_TRANSIT',
        notes: 'Departed from hub',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid UUID', () => {
      const result = updateShipmentStatusSchema.safeParse({
        shipment_id: 'not-a-uuid',
        status: 'IN_TRANSIT',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid status', () => {
      const result = updateShipmentStatusSchema.safeParse({
        shipment_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'INVALID_STATUS',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('shipmentFilterSchema', () => {
    it('applies defaults for pagination', () => {
      const result = shipmentFilterSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.page_size).toBe(20);
      }
    });

    it('validates page size limits', () => {
      const tooLarge = shipmentFilterSchema.safeParse({ page_size: 200 });
      expect(tooLarge.success).toBe(false);

      const valid = shipmentFilterSchema.safeParse({ page_size: 50 });
      expect(valid.success).toBe(true);
    });
  });

  describe('Status Transitions', () => {
    it('allows valid transitions from CREATED', () => {
      expect(isValidStatusTransition('CREATED', 'PICKUP_SCHEDULED')).toBe(true);
      expect(isValidStatusTransition('CREATED', 'CANCELLED')).toBe(true);
    });

    it('rejects invalid transitions from CREATED', () => {
      expect(isValidStatusTransition('CREATED', 'DELIVERED')).toBe(false);
      expect(isValidStatusTransition('CREATED', 'IN_TRANSIT')).toBe(false);
    });

    it('allows valid transitions through delivery flow', () => {
      expect(isValidStatusTransition('PICKUP_SCHEDULED', 'PICKED_UP')).toBe(true);
      expect(isValidStatusTransition('PICKED_UP', 'RECEIVED_AT_ORIGIN')).toBe(true);
      expect(isValidStatusTransition('RECEIVED_AT_ORIGIN', 'IN_TRANSIT')).toBe(true);
      expect(isValidStatusTransition('IN_TRANSIT', 'RECEIVED_AT_DEST')).toBe(true);
      expect(isValidStatusTransition('RECEIVED_AT_DEST', 'OUT_FOR_DELIVERY')).toBe(true);
      expect(isValidStatusTransition('OUT_FOR_DELIVERY', 'DELIVERED')).toBe(true);
    });

    it('prevents transitions from terminal states', () => {
      expect(isValidStatusTransition('DELIVERED', 'IN_TRANSIT')).toBe(false);
      expect(isValidStatusTransition('CANCELLED', 'CREATED')).toBe(false);
    });

    it('allows exception handling', () => {
      expect(isValidStatusTransition('IN_TRANSIT', 'EXCEPTION')).toBe(true);
      expect(isValidStatusTransition('EXCEPTION', 'RECEIVED_AT_ORIGIN')).toBe(true);
      expect(isValidStatusTransition('EXCEPTION', 'CANCELLED')).toBe(true);
    });

    it('allows RTO flow', () => {
      expect(isValidStatusTransition('OUT_FOR_DELIVERY', 'RTO')).toBe(true);
      expect(isValidStatusTransition('RTO', 'RECEIVED_AT_ORIGIN')).toBe(true);
    });
  });
});
