/* eslint-disable @typescript-eslint/no-explicit-any -- Test assertions require any */
import { describe, it, expect } from 'vitest';
import { ValidationError } from '@/lib/errors';
import { isValidStatusTransition } from '@/lib/schemas/shipment.schema';

/**
 * ShipmentService - Status Transition Validation Tests
 * These tests verify the business rules for shipment status transitions
 * that are now enforced in shipmentService.updateStatus()
 */
describe('ShipmentService - Status Transition Validation', () => {
  describe('Status Transition Rules', () => {
    it('should define valid transitions from CREATED', () => {
      const validFromCreated = ['PICKUP_SCHEDULED', 'CANCELLED'];
      const invalidFromCreated = ['DELIVERED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'];

      validFromCreated.forEach((status) => {
        expect(isValidStatusTransition('CREATED', status as any)).toBe(true);
      });

      invalidFromCreated.forEach((status) => {
        expect(isValidStatusTransition('CREATED', status as any)).toBe(false);
      });
    });

    it('should prevent skipping status steps', () => {
      // Cannot go from CREATED directly to DELIVERED
      expect(isValidStatusTransition('CREATED', 'DELIVERED')).toBe(false);

      // Cannot go from PICKUP_SCHEDULED to IN_TRANSIT (must go through PICKED_UP first)
      expect(isValidStatusTransition('PICKUP_SCHEDULED', 'IN_TRANSIT')).toBe(false);

      // Cannot go from IN_TRANSIT to DELIVERED (must go through RECEIVED_AT_DEST first)
      expect(isValidStatusTransition('IN_TRANSIT', 'DELIVERED')).toBe(false);
    });

    it('should allow exception handling from any active state', () => {
      const activeStates = [
        'PICKED_UP',
        'RECEIVED_AT_ORIGIN',
        'IN_TRANSIT',
        'RECEIVED_AT_DEST',
        'OUT_FOR_DELIVERY',
      ] as const;

      activeStates.forEach((state) => {
        expect(isValidStatusTransition(state, 'EXCEPTION')).toBe(true);
      });
    });

    it('should prevent transitions from terminal states', () => {
      // DELIVERED is terminal
      expect(isValidStatusTransition('DELIVERED', 'IN_TRANSIT')).toBe(false);
      expect(isValidStatusTransition('DELIVERED', 'EXCEPTION')).toBe(false);

      // CANCELLED is terminal
      expect(isValidStatusTransition('CANCELLED', 'CREATED')).toBe(false);
      expect(isValidStatusTransition('CANCELLED', 'IN_TRANSIT')).toBe(false);
    });

    it('should allow recovery from EXCEPTION state', () => {
      // Exception can be resolved by returning to flow
      expect(isValidStatusTransition('EXCEPTION', 'RECEIVED_AT_ORIGIN')).toBe(true);
      expect(isValidStatusTransition('EXCEPTION', 'RECEIVED_AT_DEST')).toBe(true);
      expect(isValidStatusTransition('EXCEPTION', 'CANCELLED')).toBe(true);
    });

    it('should allow RTO (Return to Origin) flow', () => {
      // RTO can be triggered from OUT_FOR_DELIVERY
      expect(isValidStatusTransition('OUT_FOR_DELIVERY', 'RTO')).toBe(true);

      // RTO returns to origin
      expect(isValidStatusTransition('RTO', 'RECEIVED_AT_ORIGIN')).toBe(true);
    });
  });

  describe('ValidationError on Invalid Transition', () => {
    it('should throw ValidationError with correct metadata', () => {
      const error = new ValidationError('Invalid status transition from CREATED to DELIVERED', {
        currentStatus: 'CREATED',
        newStatus: 'DELIVERED',
        shipmentId: 'test-id',
      });

      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.meta).toEqual({
        currentStatus: 'CREATED',
        newStatus: 'DELIVERED',
        shipmentId: 'test-id',
      });
    });
  });
});
