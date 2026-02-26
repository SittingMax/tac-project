import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Shipment Creation Flow Tests
 * Tests form validation, volumetric calculation, AWB format, and edge cases
 */

// Form schema matching CreateShipmentForm.tsx
const shipmentFormSchema = z
  .object({
    customerId: z.string().min(1, 'Customer is required'),
    originHub: z.enum(['IMPHAL', 'NEW_DELHI']),
    destinationHub: z.enum(['IMPHAL', 'NEW_DELHI']),
    mode: z.enum(['AIR', 'TRUCK']),
    serviceLevel: z.enum(['STANDARD', 'EXPRESS']),
    packageCount: z.number().min(1),
    weightDead: z.number().min(0.1),
    dimL: z.number().min(1),
    dimW: z.number().min(1),
    dimH: z.number().min(1),
  })
  .refine((data) => data.originHub !== data.destinationHub, {
    message: 'Origin and Destination cannot be the same',
    path: ['destinationHub'],
  });

// Volumetric weight calculation
function calculateChargeableWeight(
  deadWeight: number,
  length: number,
  width: number,
  height: number,
  mode: 'AIR' | 'TRUCK'
): number {
  const divisor = mode === 'AIR' ? 5000 : 4000;
  const volWeight = (length * width * height) / divisor;
  return Math.max(deadWeight, volWeight);
}

// AWB format validation
function isValidAwbFormat(awb: string): boolean {
  // TAC + YYYY + 6 digits OR TAC + timestamp
  return /^TAC\d{10,}$/.test(awb);
}

// Generate fallback AWB
function generateFallbackAwb(): string {
  return `TAC${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;
}

describe('Shipment Creation Flow', () => {
  describe('Form Validation', () => {
    it('should require customer ID', () => {
      const result = shipmentFormSchema.safeParse({
        customerId: '',
        originHub: 'IMPHAL',
        destinationHub: 'NEW_DELHI',
        mode: 'AIR',
        serviceLevel: 'STANDARD',
        packageCount: 1,
        weightDead: 1.0,
        dimL: 10,
        dimW: 10,
        dimH: 10,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('customerId');
      }
    });

    it('should prevent same origin and destination', () => {
      const result = shipmentFormSchema.safeParse({
        customerId: 'cust-123',
        originHub: 'IMPHAL',
        destinationHub: 'IMPHAL', // Same as origin
        mode: 'AIR',
        serviceLevel: 'STANDARD',
        packageCount: 1,
        weightDead: 1.0,
        dimL: 10,
        dimW: 10,
        dimH: 10,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Origin and Destination cannot be the same');
      }
    });

    it('should accept valid form data', () => {
      const result = shipmentFormSchema.safeParse({
        customerId: 'cust-123',
        originHub: 'IMPHAL',
        destinationHub: 'NEW_DELHI',
        mode: 'AIR',
        serviceLevel: 'EXPRESS',
        packageCount: 2,
        weightDead: 5.5,
        dimL: 30,
        dimW: 20,
        dimH: 15,
      });

      expect(result.success).toBe(true);
    });

    it('should require minimum package count of 1', () => {
      const result = shipmentFormSchema.safeParse({
        customerId: 'cust-123',
        originHub: 'IMPHAL',
        destinationHub: 'NEW_DELHI',
        mode: 'AIR',
        serviceLevel: 'STANDARD',
        packageCount: 0, // Invalid
        weightDead: 1.0,
        dimL: 10,
        dimW: 10,
        dimH: 10,
      });

      expect(result.success).toBe(false);
    });

    it('should require minimum weight of 0.1kg', () => {
      const result = shipmentFormSchema.safeParse({
        customerId: 'cust-123',
        originHub: 'IMPHAL',
        destinationHub: 'NEW_DELHI',
        mode: 'AIR',
        serviceLevel: 'STANDARD',
        packageCount: 1,
        weightDead: 0, // Invalid
        dimL: 10,
        dimW: 10,
        dimH: 10,
      });

      expect(result.success).toBe(false);
    });

    it('should require positive dimensions', () => {
      const result = shipmentFormSchema.safeParse({
        customerId: 'cust-123',
        originHub: 'IMPHAL',
        destinationHub: 'NEW_DELHI',
        mode: 'AIR',
        serviceLevel: 'STANDARD',
        packageCount: 1,
        weightDead: 1.0,
        dimL: 0, // Invalid
        dimW: 10,
        dimH: 10,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Volumetric Weight Calculation', () => {
    it('should use divisor 5000 for AIR mode', () => {
      // 50 x 40 x 30 = 60,000 / 5000 = 12kg volumetric
      const chargeable = calculateChargeableWeight(5, 50, 40, 30, 'AIR');
      expect(chargeable).toBe(12); // Volumetric > dead weight
    });

    it('should use divisor 4000 for TRUCK mode', () => {
      // 50 x 40 x 30 = 60,000 / 4000 = 15kg volumetric
      const chargeable = calculateChargeableWeight(5, 50, 40, 30, 'TRUCK');
      expect(chargeable).toBe(15); // Volumetric > dead weight
    });

    it('should return dead weight when higher than volumetric', () => {
      // 10 x 10 x 10 = 1,000 / 5000 = 0.2kg volumetric
      const chargeable = calculateChargeableWeight(5, 10, 10, 10, 'AIR');
      expect(chargeable).toBe(5); // Dead weight > volumetric
    });

    it('should handle small packages correctly', () => {
      // 5 x 5 x 5 = 125 / 5000 = 0.025kg volumetric
      const chargeable = calculateChargeableWeight(0.5, 5, 5, 5, 'AIR');
      expect(chargeable).toBe(0.5); // Dead weight > volumetric
    });

    it('should handle large packages correctly', () => {
      // 100 x 100 x 100 = 1,000,000 / 5000 = 200kg volumetric
      const chargeable = calculateChargeableWeight(50, 100, 100, 100, 'AIR');
      expect(chargeable).toBe(200); // Volumetric > dead weight
    });

    it('should return exact max when weights are equal', () => {
      // Dead weight equals volumetric weight
      // 50 x 40 x 25 = 50,000 / 5000 = 10kg volumetric
      const chargeable = calculateChargeableWeight(10, 50, 40, 25, 'AIR');
      expect(chargeable).toBe(10);
    });
  });

  describe('AWB Number Format', () => {
    it('should validate correct AWB format', () => {
      expect(isValidAwbFormat('TAC2026001234')).toBe(true);
      expect(isValidAwbFormat('TAC20261234567890')).toBe(true);
    });

    it('should reject invalid AWB formats', () => {
      expect(isValidAwbFormat('ABC2026001234')).toBe(false); // Wrong prefix
      expect(isValidAwbFormat('TAC')).toBe(false); // No numbers
      expect(isValidAwbFormat('TAC123')).toBe(false); // Too short
      expect(isValidAwbFormat('')).toBe(false); // Empty
    });

    it('should generate valid fallback AWB', () => {
      const awb = generateFallbackAwb();
      expect(awb).toMatch(/^TAC\d{10}$/);
      expect(awb.startsWith('TAC2026')).toBe(true); // Current year
    });

    it('should generate AWBs with timestamp-based suffix', () => {
      const awb1 = generateFallbackAwb();
      const awb2 = generateFallbackAwb();

      // Both should be valid format
      expect(isValidAwbFormat(awb1)).toBe(true);
      expect(isValidAwbFormat(awb2)).toBe(true);

      // NOTE: Fallback AWB generation can have collisions in fast loops
      // This is a KNOWN GAP - DB RPC should be used in production
      // The test documents this limitation
    });
  });

  describe('Edge Cases', () => {
    it('should handle floating point weight precision', () => {
      // 33.33 x 33.33 x 33.33 = 37,025.926... / 5000 = 7.405...
      const chargeable = calculateChargeableWeight(7.4, 33.33, 33.33, 33.33, 'AIR');
      expect(chargeable).toBeCloseTo(7.405, 2);
    });

    it('should handle very small volumetric weights', () => {
      // 1 x 1 x 1 = 1 / 5000 = 0.0002kg volumetric
      const chargeable = calculateChargeableWeight(0.1, 1, 1, 1, 'AIR');
      expect(chargeable).toBe(0.1); // Dead weight wins
    });

    it('should handle boundary dimension values', () => {
      // Minimum valid: 1 x 1 x 1
      const result = shipmentFormSchema.safeParse({
        customerId: 'cust-123',
        originHub: 'IMPHAL',
        destinationHub: 'NEW_DELHI',
        mode: 'AIR',
        serviceLevel: 'STANDARD',
        packageCount: 1,
        weightDead: 0.1,
        dimL: 1,
        dimW: 1,
        dimH: 1,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Mode and Service Level Combinations', () => {
    const validModes = ['AIR', 'TRUCK'] as const;
    const validServiceLevels = ['STANDARD', 'EXPRESS'] as const;

    validModes.forEach((mode) => {
      validServiceLevels.forEach((serviceLevel) => {
        it(`should accept ${mode} + ${serviceLevel} combination`, () => {
          const result = shipmentFormSchema.safeParse({
            customerId: 'cust-123',
            originHub: 'IMPHAL',
            destinationHub: 'NEW_DELHI',
            mode,
            serviceLevel,
            packageCount: 1,
            weightDead: 1.0,
            dimL: 10,
            dimW: 10,
            dimH: 10,
          });
          expect(result.success).toBe(true);
        });
      });
    });

    it('should reject invalid mode', () => {
      const result = shipmentFormSchema.safeParse({
        customerId: 'cust-123',
        originHub: 'IMPHAL',
        destinationHub: 'NEW_DELHI',
        mode: 'SHIP', // Invalid
        serviceLevel: 'STANDARD',
        packageCount: 1,
        weightDead: 1.0,
        dimL: 10,
        dimW: 10,
        dimH: 10,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid service level', () => {
      const result = shipmentFormSchema.safeParse({
        customerId: 'cust-123',
        originHub: 'IMPHAL',
        destinationHub: 'NEW_DELHI',
        mode: 'AIR',
        serviceLevel: 'PREMIUM', // Invalid
        packageCount: 1,
        weightDead: 1.0,
        dimL: 10,
        dimW: 10,
        dimH: 10,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('CreateShipmentInput Validation', () => {
  // Schema matching the hook's CreateShipmentInput interface
  const createShipmentInputSchema = z.object({
    customer_id: z.string().uuid(),
    origin_hub_id: z.string().uuid(),
    destination_hub_id: z.string().uuid(),
    mode: z.enum(['AIR', 'TRUCK']),
    service_level: z.enum(['STANDARD', 'EXPRESS']),
    package_count: z.number().int().positive(),
    total_weight: z.number().positive(),
    declared_value: z.number().optional(),
    consignee_name: z.string().min(1),
    consignee_phone: z.string().min(10),
    consignee_address: z.object({
      line1: z.string(),
      city: z.string(),
    }),
    special_instructions: z.string().optional(),
  });

  it('should validate complete shipment input', () => {
    const input = {
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      origin_hub_id: '550e8400-e29b-41d4-a716-446655440001',
      destination_hub_id: '550e8400-e29b-41d4-a716-446655440002',
      mode: 'AIR' as const,
      service_level: 'EXPRESS' as const,
      package_count: 2,
      total_weight: 5.5,
      consignee_name: 'John Doe',
      consignee_phone: '9876543210',
      consignee_address: { line1: '123 Main St', city: 'Imphal' },
    };

    const result = createShipmentInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should require valid UUID for customer_id', () => {
    const input = {
      customer_id: 'not-a-uuid',
      origin_hub_id: '550e8400-e29b-41d4-a716-446655440001',
      destination_hub_id: '550e8400-e29b-41d4-a716-446655440002',
      mode: 'AIR' as const,
      service_level: 'EXPRESS' as const,
      package_count: 2,
      total_weight: 5.5,
      consignee_name: 'John Doe',
      consignee_phone: '9876543210',
      consignee_address: { line1: '123 Main St', city: 'Imphal' },
    };

    const result = createShipmentInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should require consignee_name', () => {
    const input = {
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      origin_hub_id: '550e8400-e29b-41d4-a716-446655440001',
      destination_hub_id: '550e8400-e29b-41d4-a716-446655440002',
      mode: 'AIR' as const,
      service_level: 'EXPRESS' as const,
      package_count: 2,
      total_weight: 5.5,
      consignee_name: '', // Empty
      consignee_phone: '9876543210',
      consignee_address: { line1: '123 Main St', city: 'Imphal' },
    };

    const result = createShipmentInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should require valid phone number', () => {
    const input = {
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      origin_hub_id: '550e8400-e29b-41d4-a716-446655440001',
      destination_hub_id: '550e8400-e29b-41d4-a716-446655440002',
      mode: 'AIR' as const,
      service_level: 'EXPRESS' as const,
      package_count: 2,
      total_weight: 5.5,
      consignee_name: 'John Doe',
      consignee_phone: '123', // Too short
      consignee_address: { line1: '123 Main St', city: 'Imphal' },
    };

    const result = createShipmentInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
