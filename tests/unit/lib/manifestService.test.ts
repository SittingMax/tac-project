/**
 * Unit Tests for Manifest Service
 * Tests for scan parsing, idempotency, and status transitions
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock the manifestService for unit testing the pure functions
const manifestServiceUtils = {
  normalizeScanToken(token: string): string {
    if (!token) return '';

    // Remove whitespace and common delimiters
    let normalized = token.trim().replace(/[\s\-_]/g, '');

    // Convert to uppercase
    normalized = normalized.toUpperCase();

    // Handle IATA AWB format (e.g., 123-12345678)
    // AWB numbers are typically 11 digits: 3-digit prefix + 8-digit serial
    const awbMatch = normalized.match(/^(\d{3})(\d{8})$/);
    if (awbMatch) {
      return `${awbMatch[1]}-${awbMatch[2]}`;
    }

    return normalized;
  },

  isValidAwbFormat(token: string): boolean {
    const normalized = this.normalizeScanToken(token);
    // IATA AWB: 3-digit airline prefix + 8-digit serial
    return /^\d{3}-?\d{8}$/.test(normalized);
  },
};

// Status transition rules
const MANIFEST_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['BUILDING', 'OPEN', 'CLOSED'],
  OPEN: ['BUILDING', 'CLOSED'],
  BUILDING: ['CLOSED', 'OPEN'],
  CLOSED: ['DEPARTED'],
  DEPARTED: ['ARRIVED'],
  ARRIVED: ['RECONCILED'],
  RECONCILED: [],
};

function isValidStatusTransition(from: string, to: string): boolean {
  return MANIFEST_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

describe('Manifest Service - Scan Token Parsing', () => {
  describe('normalizeScanToken', () => {
    it('should handle empty input', () => {
      expect(manifestServiceUtils.normalizeScanToken('')).toBe('');
      expect(manifestServiceUtils.normalizeScanToken('   ')).toBe('');
    });

    it('should convert to uppercase', () => {
      expect(manifestServiceUtils.normalizeScanToken('abc123')).toBe('ABC123');
      expect(manifestServiceUtils.normalizeScanToken('AbC123dEf')).toBe('ABC123DEF');
    });

    it('should remove whitespace', () => {
      expect(manifestServiceUtils.normalizeScanToken('ABC 123')).toBe('ABC123');
      expect(manifestServiceUtils.normalizeScanToken('  ABC  123  ')).toBe('ABC123');
      expect(manifestServiceUtils.normalizeScanToken('ABC\t123')).toBe('ABC123');
    });

    it('should remove hyphens and underscores', () => {
      expect(manifestServiceUtils.normalizeScanToken('ABC-123')).toBe('ABC123');
      expect(manifestServiceUtils.normalizeScanToken('ABC_123')).toBe('ABC123');
      expect(manifestServiceUtils.normalizeScanToken('ABC-123-DEF_456')).toBe('ABC123DEF456');
    });

    it('should format valid IATA AWB numbers (11 digits)', () => {
      // IATA AWB format: 3-digit prefix + 8-digit serial
      expect(manifestServiceUtils.normalizeScanToken('12312345678')).toBe('123-12345678');
      expect(manifestServiceUtils.normalizeScanToken('607 12345678')).toBe('607-12345678');
      expect(manifestServiceUtils.normalizeScanToken('607-12345678')).toBe('607-12345678');
    });

    it('should preserve non-AWB tokens as-is (after normalization)', () => {
      expect(manifestServiceUtils.normalizeScanToken('SHIP001')).toBe('SHIP001');
      expect(manifestServiceUtils.normalizeScanToken('PKG-12345')).toBe('PKG12345');
      expect(manifestServiceUtils.normalizeScanToken('1234567890')).toBe('1234567890'); // 10 digits, not AWB
    });
  });

  describe('isValidAwbFormat', () => {
    it('should validate correct IATA AWB format', () => {
      expect(manifestServiceUtils.isValidAwbFormat('12312345678')).toBe(true);
      expect(manifestServiceUtils.isValidAwbFormat('123-12345678')).toBe(true);
      expect(manifestServiceUtils.isValidAwbFormat('607 12345678')).toBe(true);
    });

    it('should reject invalid AWB formats', () => {
      expect(manifestServiceUtils.isValidAwbFormat('')).toBe(false);
      expect(manifestServiceUtils.isValidAwbFormat('ABC12345678')).toBe(false); // letters in prefix
      expect(manifestServiceUtils.isValidAwbFormat('1234567890')).toBe(false); // 10 digits
      expect(manifestServiceUtils.isValidAwbFormat('123456789012')).toBe(false); // 12 digits
      expect(manifestServiceUtils.isValidAwbFormat('SHIP001')).toBe(false);
    });
  });
});

describe('Manifest Service - Status Transitions', () => {
  describe('isValidStatusTransition', () => {
    it('should allow valid transitions from DRAFT', () => {
      expect(isValidStatusTransition('DRAFT', 'BUILDING')).toBe(true);
      expect(isValidStatusTransition('DRAFT', 'OPEN')).toBe(true);
      expect(isValidStatusTransition('DRAFT', 'CLOSED')).toBe(true);
    });

    it('should allow valid transitions from OPEN', () => {
      expect(isValidStatusTransition('OPEN', 'BUILDING')).toBe(true);
      expect(isValidStatusTransition('OPEN', 'CLOSED')).toBe(true);
    });

    it('should allow valid transitions from BUILDING', () => {
      expect(isValidStatusTransition('BUILDING', 'CLOSED')).toBe(true);
      expect(isValidStatusTransition('BUILDING', 'OPEN')).toBe(true);
    });

    it('should allow valid transitions from CLOSED', () => {
      expect(isValidStatusTransition('CLOSED', 'DEPARTED')).toBe(true);
    });

    it('should allow valid transitions from DEPARTED', () => {
      expect(isValidStatusTransition('DEPARTED', 'ARRIVED')).toBe(true);
    });

    it('should allow valid transitions from ARRIVED', () => {
      expect(isValidStatusTransition('ARRIVED', 'RECONCILED')).toBe(true);
    });

    it('should reject invalid transitions', () => {
      // Cannot skip states
      expect(isValidStatusTransition('DRAFT', 'DEPARTED')).toBe(false);
      expect(isValidStatusTransition('OPEN', 'ARRIVED')).toBe(false);
      expect(isValidStatusTransition('CLOSED', 'RECONCILED')).toBe(false);

      // Cannot go backwards
      expect(isValidStatusTransition('CLOSED', 'OPEN')).toBe(false);
      expect(isValidStatusTransition('DEPARTED', 'CLOSED')).toBe(false);
      expect(isValidStatusTransition('ARRIVED', 'DEPARTED')).toBe(false);
      expect(isValidStatusTransition('RECONCILED', 'ARRIVED')).toBe(false);
    });

    it('should reject transitions from terminal state RECONCILED', () => {
      expect(isValidStatusTransition('RECONCILED', 'DRAFT')).toBe(false);
      expect(isValidStatusTransition('RECONCILED', 'OPEN')).toBe(false);
      expect(isValidStatusTransition('RECONCILED', 'ARRIVED')).toBe(false);
    });

    it('should handle unknown statuses gracefully', () => {
      expect(isValidStatusTransition('UNKNOWN', 'OPEN')).toBe(false);
      expect(isValidStatusTransition('OPEN', 'UNKNOWN')).toBe(false);
    });
  });
});

describe('Manifest Service - Idempotency Logic', () => {
  // These tests simulate the idempotency behavior without actual DB calls

  interface MockManifestItem {
    id: string;
    manifest_id: string;
    shipment_id: string;
  }

  let manifestItems: MockManifestItem[];

  beforeEach(() => {
    manifestItems = [];
  });

  function addItemIdempotent(
    manifestId: string,
    shipmentId: string
  ): { success: boolean; duplicate: boolean; id?: string } {
    // Check for existing item
    const existing = manifestItems.find(
      (item) => item.manifest_id === manifestId && item.shipment_id === shipmentId
    );

    if (existing) {
      return { success: true, duplicate: true, id: existing.id };
    }

    // Add new item
    const newItem: MockManifestItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      manifest_id: manifestId,
      shipment_id: shipmentId,
    };
    manifestItems.push(newItem);

    return { success: true, duplicate: false, id: newItem.id };
  }

  it('should add item on first scan', () => {
    const result = addItemIdempotent('manifest-1', 'shipment-1');

    expect(result.success).toBe(true);
    expect(result.duplicate).toBe(false);
    expect(result.id).toBeDefined();
    expect(manifestItems.length).toBe(1);
  });

  it('should return duplicate on second scan of same shipment', () => {
    const result1 = addItemIdempotent('manifest-1', 'shipment-1');
    const result2 = addItemIdempotent('manifest-1', 'shipment-1');

    expect(result1.success).toBe(true);
    expect(result1.duplicate).toBe(false);

    expect(result2.success).toBe(true);
    expect(result2.duplicate).toBe(true);
    expect(result2.id).toBe(result1.id);

    // Should still only have one item
    expect(manifestItems.length).toBe(1);
  });

  it('should allow same shipment in different manifests', () => {
    const result1 = addItemIdempotent('manifest-1', 'shipment-1');
    const result2 = addItemIdempotent('manifest-2', 'shipment-1');

    expect(result1.success).toBe(true);
    expect(result1.duplicate).toBe(false);

    expect(result2.success).toBe(true);
    expect(result2.duplicate).toBe(false);

    expect(manifestItems.length).toBe(2);
    expect(result1.id).not.toBe(result2.id);
  });

  it('should handle multiple unique shipments in same manifest', () => {
    addItemIdempotent('manifest-1', 'shipment-1');
    addItemIdempotent('manifest-1', 'shipment-2');
    addItemIdempotent('manifest-1', 'shipment-3');

    expect(manifestItems.length).toBe(3);
    expect(manifestItems.every((item) => item.manifest_id === 'manifest-1')).toBe(true);
  });

  it('should handle rapid duplicate scans (race condition simulation)', () => {
    // Simulate 10 rapid scans of the same shipment
    const results = Array.from({ length: 10 }, () => addItemIdempotent('manifest-1', 'shipment-1'));

    // First should be new, rest should be duplicates
    expect(results[0].duplicate).toBe(false);
    expect(results.slice(1).every((r) => r.duplicate)).toBe(true);

    // Should only have one item
    expect(manifestItems.length).toBe(1);
  });
});

describe('Manifest Service - Scan Validation Rules', () => {
  interface MockShipment {
    id: string;
    status: string;
    destination_hub_id: string;
    cn_number: string;
  }

  interface MockManifest {
    id: string;
    status: string;
    to_hub_id: string;
  }

  function validateScan(
    shipment: MockShipment,
    manifest: MockManifest,
    options: { validateDestination?: boolean; validateStatus?: boolean } = {}
  ): { valid: boolean; error?: string } {
    const { validateDestination = true, validateStatus = true } = options;

    // Check manifest is editable
    if (!['OPEN', 'DRAFT', 'BUILDING'].includes(manifest.status)) {
      return { valid: false, error: 'MANIFEST_CLOSED' };
    }

    // Check destination match
    if (validateDestination && shipment.destination_hub_id !== manifest.to_hub_id) {
      return { valid: false, error: 'DESTINATION_MISMATCH' };
    }

    // Check shipment status
    const validStatuses = ['CREATED', 'PICKED_UP', 'RECEIVED_AT_ORIGIN'];
    if (validateStatus && !validStatuses.includes(shipment.status)) {
      return { valid: false, error: 'INVALID_STATUS' };
    }

    return { valid: true };
  }

  it('should pass validation for valid shipment', () => {
    const shipment: MockShipment = {
      id: 's1',
      status: 'RECEIVED_AT_ORIGIN',
      destination_hub_id: 'hub-delhi',
      cn_number: '123-12345678',
    };
    const manifest: MockManifest = {
      id: 'm1',
      status: 'BUILDING',
      to_hub_id: 'hub-delhi',
    };

    const result = validateScan(shipment, manifest);
    expect(result.valid).toBe(true);
  });

  it('should reject when manifest is closed', () => {
    const shipment: MockShipment = {
      id: 's1',
      status: 'RECEIVED_AT_ORIGIN',
      destination_hub_id: 'hub-delhi',
      cn_number: '123-12345678',
    };
    const manifest: MockManifest = {
      id: 'm1',
      status: 'CLOSED',
      to_hub_id: 'hub-delhi',
    };

    const result = validateScan(shipment, manifest);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('MANIFEST_CLOSED');
  });

  it('should reject destination mismatch when validation enabled', () => {
    const shipment: MockShipment = {
      id: 's1',
      status: 'RECEIVED_AT_ORIGIN',
      destination_hub_id: 'hub-mumbai',
      cn_number: '123-12345678',
    };
    const manifest: MockManifest = {
      id: 'm1',
      status: 'BUILDING',
      to_hub_id: 'hub-delhi',
    };

    const result = validateScan(shipment, manifest, { validateDestination: true });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('DESTINATION_MISMATCH');
  });

  it('should allow destination mismatch when validation disabled', () => {
    const shipment: MockShipment = {
      id: 's1',
      status: 'RECEIVED_AT_ORIGIN',
      destination_hub_id: 'hub-mumbai',
      cn_number: '123-12345678',
    };
    const manifest: MockManifest = {
      id: 'm1',
      status: 'BUILDING',
      to_hub_id: 'hub-delhi',
    };

    const result = validateScan(shipment, manifest, { validateDestination: false });
    expect(result.valid).toBe(true);
  });

  it('should reject invalid shipment status when validation enabled', () => {
    const shipment: MockShipment = {
      id: 's1',
      status: 'DELIVERED',
      destination_hub_id: 'hub-delhi',
      cn_number: '123-12345678',
    };
    const manifest: MockManifest = {
      id: 'm1',
      status: 'BUILDING',
      to_hub_id: 'hub-delhi',
    };

    const result = validateScan(shipment, manifest, { validateStatus: true });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('INVALID_STATUS');
  });

  it('should allow any shipment status when validation disabled', () => {
    const shipment: MockShipment = {
      id: 's1',
      status: 'DELIVERED',
      destination_hub_id: 'hub-delhi',
      cn_number: '123-12345678',
    };
    const manifest: MockManifest = {
      id: 'm1',
      status: 'BUILDING',
      to_hub_id: 'hub-delhi',
    };

    const result = validateScan(shipment, manifest, { validateStatus: false });
    expect(result.valid).toBe(true);
  });

  it('should accept all valid shipment statuses', () => {
    const validStatuses = ['CREATED', 'PICKED_UP', 'RECEIVED_AT_ORIGIN'];
    const manifest: MockManifest = {
      id: 'm1',
      status: 'BUILDING',
      to_hub_id: 'hub-delhi',
    };

    for (const status of validStatuses) {
      const shipment: MockShipment = {
        id: 's1',
        status,
        destination_hub_id: 'hub-delhi',
        cn_number: '123-12345678',
      };

      const result = validateScan(shipment, manifest);
      expect(result.valid).toBe(true);
    }
  });
});
