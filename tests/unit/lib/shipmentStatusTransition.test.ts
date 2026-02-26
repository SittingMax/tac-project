import { describe, it, expect } from 'vitest';
import {
  isValidStatusTransition,
  ShipmentStatus,
  VALID_STATUS_TRANSITIONS,
  type ShipmentStatusType,
} from '@/lib/schemas/shipment.schema';

describe('Shipment Status Transitions', () => {
  describe('isValidStatusTransition', () => {
    describe('Valid forward transitions', () => {
      it('should allow CREATED -> PICKUP_SCHEDULED', () => {
        expect(isValidStatusTransition('CREATED', 'PICKUP_SCHEDULED')).toBe(true);
      });

      it('should allow PICKUP_SCHEDULED -> PICKED_UP', () => {
        expect(isValidStatusTransition('PICKUP_SCHEDULED', 'PICKED_UP')).toBe(true);
      });

      it('should allow PICKED_UP -> RECEIVED_AT_ORIGIN', () => {
        expect(isValidStatusTransition('PICKED_UP', 'RECEIVED_AT_ORIGIN')).toBe(true);
      });

      it('should allow RECEIVED_AT_ORIGIN -> IN_TRANSIT', () => {
        expect(isValidStatusTransition('RECEIVED_AT_ORIGIN', 'IN_TRANSIT')).toBe(true);
      });

      it('should allow IN_TRANSIT -> RECEIVED_AT_DEST', () => {
        expect(isValidStatusTransition('IN_TRANSIT', 'RECEIVED_AT_DEST')).toBe(true);
      });

      it('should allow RECEIVED_AT_DEST -> OUT_FOR_DELIVERY', () => {
        expect(isValidStatusTransition('RECEIVED_AT_DEST', 'OUT_FOR_DELIVERY')).toBe(true);
      });

      it('should allow OUT_FOR_DELIVERY -> DELIVERED', () => {
        expect(isValidStatusTransition('OUT_FOR_DELIVERY', 'DELIVERED')).toBe(true);
      });
    });

    describe('Invalid backward transitions (CRITICAL)', () => {
      it('should REJECT DELIVERED -> CREATED', () => {
        expect(isValidStatusTransition('DELIVERED', 'CREATED')).toBe(false);
      });

      it('should REJECT DELIVERED -> IN_TRANSIT', () => {
        expect(isValidStatusTransition('DELIVERED', 'IN_TRANSIT')).toBe(false);
      });

      it('should REJECT IN_TRANSIT -> CREATED', () => {
        expect(isValidStatusTransition('IN_TRANSIT', 'CREATED')).toBe(false);
      });

      it('should REJECT RECEIVED_AT_DEST -> RECEIVED_AT_ORIGIN', () => {
        expect(isValidStatusTransition('RECEIVED_AT_DEST', 'RECEIVED_AT_ORIGIN')).toBe(false);
      });

      it('should REJECT OUT_FOR_DELIVERY -> PICKED_UP', () => {
        expect(isValidStatusTransition('OUT_FOR_DELIVERY', 'PICKED_UP')).toBe(false);
      });
    });

    describe('Exception status transitions', () => {
      it('should allow PICKED_UP -> EXCEPTION', () => {
        expect(isValidStatusTransition('PICKED_UP', 'EXCEPTION')).toBe(true);
      });

      it('should allow RECEIVED_AT_ORIGIN -> EXCEPTION', () => {
        expect(isValidStatusTransition('RECEIVED_AT_ORIGIN', 'EXCEPTION')).toBe(true);
      });

      it('should allow IN_TRANSIT -> EXCEPTION', () => {
        expect(isValidStatusTransition('IN_TRANSIT', 'EXCEPTION')).toBe(true);
      });

      it('should allow RECEIVED_AT_DEST -> EXCEPTION', () => {
        expect(isValidStatusTransition('RECEIVED_AT_DEST', 'EXCEPTION')).toBe(true);
      });

      it('should allow OUT_FOR_DELIVERY -> EXCEPTION', () => {
        expect(isValidStatusTransition('OUT_FOR_DELIVERY', 'EXCEPTION')).toBe(true);
      });

      it('should allow EXCEPTION -> RECEIVED_AT_ORIGIN (after resolution)', () => {
        expect(isValidStatusTransition('EXCEPTION', 'RECEIVED_AT_ORIGIN')).toBe(true);
      });

      it('should allow EXCEPTION -> RECEIVED_AT_DEST (after resolution)', () => {
        expect(isValidStatusTransition('EXCEPTION', 'RECEIVED_AT_DEST')).toBe(true);
      });

      it('should allow EXCEPTION -> CANCELLED', () => {
        expect(isValidStatusTransition('EXCEPTION', 'CANCELLED')).toBe(true);
      });
    });

    describe('Terminal states (no further transitions)', () => {
      it('should REJECT any transition from DELIVERED', () => {
        const statuses: ShipmentStatusType[] = [
          'CREATED',
          'PICKUP_SCHEDULED',
          'PICKED_UP',
          'RECEIVED_AT_ORIGIN',
          'IN_TRANSIT',
          'RECEIVED_AT_DEST',
          'OUT_FOR_DELIVERY',
          'EXCEPTION',
        ];

        statuses.forEach((status) => {
          expect(isValidStatusTransition('DELIVERED', status)).toBe(false);
        });
      });

      it('should REJECT any transition from CANCELLED', () => {
        const statuses: ShipmentStatusType[] = [
          'CREATED',
          'PICKUP_SCHEDULED',
          'PICKED_UP',
          'RECEIVED_AT_ORIGIN',
          'IN_TRANSIT',
          'RECEIVED_AT_DEST',
          'OUT_FOR_DELIVERY',
          'DELIVERED',
        ];

        statuses.forEach((status) => {
          expect(isValidStatusTransition('CANCELLED', status)).toBe(false);
        });
      });
    });

    describe('RTO (Return to Origin) transitions', () => {
      it('should allow OUT_FOR_DELIVERY -> RTO', () => {
        expect(isValidStatusTransition('OUT_FOR_DELIVERY', 'RTO')).toBe(true);
      });

      it('should allow RTO -> RECEIVED_AT_ORIGIN (re-entering flow)', () => {
        expect(isValidStatusTransition('RTO', 'RECEIVED_AT_ORIGIN')).toBe(true);
      });
    });

    describe('Cancellation transitions', () => {
      it('should allow CREATED -> CANCELLED', () => {
        expect(isValidStatusTransition('CREATED', 'CANCELLED')).toBe(true);
      });

      it('should allow PICKUP_SCHEDULED -> CANCELLED', () => {
        expect(isValidStatusTransition('PICKUP_SCHEDULED', 'CANCELLED')).toBe(true);
      });
    });

    describe('Skip transitions (invalid)', () => {
      it('should REJECT CREATED -> DELIVERED (skipping all steps)', () => {
        expect(isValidStatusTransition('CREATED', 'DELIVERED')).toBe(false);
      });

      it('should REJECT PICKED_UP -> DELIVERED (skipping steps)', () => {
        expect(isValidStatusTransition('PICKED_UP', 'DELIVERED')).toBe(false);
      });

      it('should REJECT CREATED -> IN_TRANSIT (skipping pickup steps)', () => {
        expect(isValidStatusTransition('CREATED', 'IN_TRANSIT')).toBe(false);
      });
    });
  });

  describe('VALID_STATUS_TRANSITIONS constant', () => {
    it('should have transitions defined for all statuses', () => {
      const allStatuses = ShipmentStatus.options;

      allStatuses.forEach((status) => {
        expect(VALID_STATUS_TRANSITIONS).toHaveProperty(status);
        expect(Array.isArray(VALID_STATUS_TRANSITIONS[status])).toBe(true);
      });
    });

    it('should have empty array for terminal states', () => {
      expect(VALID_STATUS_TRANSITIONS['DELIVERED']).toEqual([]);
      expect(VALID_STATUS_TRANSITIONS['CANCELLED']).toEqual([]);
    });
  });

  describe('Stress test - rapid status validation', () => {
    it('should handle 1000 rapid validations consistently', () => {
      const transitions: [ShipmentStatusType, ShipmentStatusType, boolean][] = [
        ['CREATED', 'PICKUP_SCHEDULED', true],
        ['DELIVERED', 'CREATED', false],
        ['IN_TRANSIT', 'RECEIVED_AT_DEST', true],
        ['OUT_FOR_DELIVERY', 'DELIVERED', true],
        ['CANCELLED', 'CREATED', false],
      ];

      for (let i = 0; i < 1000; i++) {
        transitions.forEach(([from, to, expected]) => {
          expect(isValidStatusTransition(from, to)).toBe(expected);
        });
      }
    });
  });
});
