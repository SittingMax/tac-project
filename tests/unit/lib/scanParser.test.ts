import { describe, it, expect } from 'vitest';
import {
  parseScanInput,
  isValidAWB,
  generateManifestQRPayload,
  generateShipmentQRPayload,
} from '@/lib/scanParser';

describe('scanParser', () => {
  describe('parseScanInput', () => {
    describe('Raw AWB format', () => {
      it('should parse valid TAC AWB number', () => {
        const result = parseScanInput('TAC12345678');
        expect(result.type).toBe('shipment');
        expect(result.awb).toBe('TAC12345678');
        expect(result.raw).toBe('TAC12345678');
      });

      it('should handle lowercase AWB and convert to uppercase', () => {
        const result = parseScanInput('tac12345678');
        expect(result.type).toBe('shipment');
        expect(result.awb).toBe('TAC12345678');
      });

      it('should handle AWB with whitespace', () => {
        const result = parseScanInput('  TAC12345678  ');
        expect(result.type).toBe('shipment');
        expect(result.awb).toBe('TAC12345678');
      });

      it('should reject AWB with wrong prefix', () => {
        expect(() => parseScanInput('ABC12345678')).toThrow();
      });

      it('should reject AWB with too few digits (< 8)', () => {
        expect(() => parseScanInput('TAC1234567')).toThrow(); // 7 digits
      });

      it('should reject AWB with too many digits (> 11)', () => {
        expect(() => parseScanInput('TAC123456789012')).toThrow(); // 12 digits
      });

      it('should accept AWB with 9-11 digits', () => {
        expect(parseScanInput('TAC123456789').type).toBe('shipment'); // 9 digits
        expect(parseScanInput('TAC1234567890').type).toBe('shipment'); // 10 digits
        expect(parseScanInput('TAC12345678901').type).toBe('shipment'); // 11 digits
      });
    });

    describe('JSON shipment payload', () => {
      it('should parse valid JSON shipment payload', () => {
        const payload = JSON.stringify({ v: 1, awb: 'TAC12345678' });
        const result = parseScanInput(payload);
        expect(result.type).toBe('shipment');
        expect(result.awb).toBe('TAC12345678');
      });

      it('should reject invalid version', () => {
        const payload = JSON.stringify({ v: 2, awb: 'TAC12345678' });
        expect(() => parseScanInput(payload)).toThrow('Unsupported scan payload version');
      });

      it('should reject invalid AWB in payload', () => {
        const payload = JSON.stringify({ v: 1, awb: 'INVALID123' });
        expect(() => parseScanInput(payload)).toThrow('Invalid AWB format');
      });

      it('should include metadata from payload', () => {
        const payload = JSON.stringify({
          v: 1,
          awb: 'TAC12345678',
          metadata: { weight: 5.5, location: 'DEL' },
        });
        const result = parseScanInput(payload);
        expect(result.metadata).toEqual({ weight: 5.5, location: 'DEL' });
      });
    });

    describe('JSON manifest payload', () => {
      it('should parse manifest scan with id', () => {
        const payload = JSON.stringify({
          v: 1,
          type: 'manifest',
          id: 'uuid-123',
          manifestNo: 'MNF-2024-000001',
        });
        const result = parseScanInput(payload);
        expect(result.type).toBe('manifest');
        expect(result.manifestId).toBe('uuid-123');
        expect(result.manifestNo).toBe('MNF-2024-000001');
      });

      it('should parse manifest scan with route', () => {
        const payload = JSON.stringify({
          v: 1,
          type: 'manifest',
          id: 'uuid-123',
          route: 'DEL-IXI',
        });
        const result = parseScanInput(payload);
        expect(result.route).toBe('DEL-IXI');
      });

      it('should reject manifest without id or manifestNo', () => {
        const payload = JSON.stringify({ v: 1, type: 'manifest' });
        expect(() => parseScanInput(payload)).toThrow('requires id or manifestNo');
      });
    });

    describe('JSON package payload', () => {
      it('should parse package scan', () => {
        const payload = JSON.stringify({
          v: 1,
          type: 'package',
          packageId: 'PKG-001',
          awb: 'TAC12345678',
        });
        const result = parseScanInput(payload);
        expect(result.type).toBe('package');
        expect(result.packageId).toBe('PKG-001');
        expect(result.awb).toBe('TAC12345678');
      });

      it('should reject package without packageId', () => {
        const payload = JSON.stringify({ v: 1, type: 'package' });
        expect(() => parseScanInput(payload)).toThrow('requires packageId');
      });

      it('should preserve AWB case in package payload (passthrough behavior)', () => {
        const payload = JSON.stringify({
          v: 1,
          type: 'package',
          packageId: 'PKG-002',
          awb: 'tac12345678',
        });
        const result = parseScanInput(payload);
        // Note: package payloads pass through AWB as-is (no uppercase)
        expect(result.awb).toBe('tac12345678');
      });
    });

    describe('Manifest number format', () => {
      it('should parse manifest number directly', () => {
        const result = parseScanInput('MNF-2024-000001');
        expect(result.type).toBe('manifest');
        expect(result.manifestNo).toBe('MNF-2024-000001');
      });

      it('should handle lowercase manifest number', () => {
        const result = parseScanInput('mnf-2024-000001');
        expect(result.type).toBe('manifest');
        expect(result.manifestNo).toBe('MNF-2024-000001');
      });

      it('should accept legacy MAN manifest numbers', () => {
        const result = parseScanInput('MAN-2024-00001');
        expect(result.type).toBe('manifest');
        expect(result.manifestNo).toBe('MAN-2024-00001');
      });
    });

    describe('Error cases', () => {
      it('should reject empty input', () => {
        expect(() => parseScanInput('')).toThrow('Empty scan input');
      });

      it('should reject whitespace-only input', () => {
        expect(() => parseScanInput('   ')).toThrow('Empty scan input');
      });

      it('should reject invalid JSON', () => {
        expect(() => parseScanInput('{invalid}')).toThrow('Invalid JSON');
      });

      it('should reject unknown format', () => {
        expect(() => parseScanInput('RANDOM123')).toThrow('Invalid scan format');
      });
    });
  });

  describe('isValidAWB', () => {
    it('should return true for valid AWB', () => {
      expect(isValidAWB('TAC12345678')).toBe(true);
    });

    it('should return true for lowercase AWB', () => {
      expect(isValidAWB('tac12345678')).toBe(true);
    });

    it('should return false for invalid prefix', () => {
      expect(isValidAWB('ABC12345678')).toBe(false);
    });

    it('should return false for too few digits (< 8)', () => {
      expect(isValidAWB('TAC1234567')).toBe(false); // 7 digits
    });

    it('should return false for too many digits (> 11)', () => {
      expect(isValidAWB('TAC123456789012')).toBe(false); // 12 digits
    });

    it('should return true for 9-11 digit AWBs', () => {
      expect(isValidAWB('TAC123456789')).toBe(true); // 9 digits
      expect(isValidAWB('TAC1234567890')).toBe(true); // 10 digits
      expect(isValidAWB('TAC12345678901')).toBe(true); // 11 digits
    });

    it('should return false for non-numeric suffix', () => {
      expect(isValidAWB('TAC1234567A')).toBe(false);
    });
  });

  describe('generateManifestQRPayload', () => {
    it('should generate valid manifest QR payload', () => {
      const payload = generateManifestQRPayload({
        id: 'uuid-123',
        manifestNo: 'MNF-2024-000001',
        fromHubCode: 'DEL',
        toHubCode: 'IXI',
      });

      const parsed = JSON.parse(payload);
      expect(parsed.v).toBe(1);
      expect(parsed.type).toBe('manifest');
      expect(parsed.id).toBe('uuid-123');
      expect(parsed.manifestNo).toBe('MNF-2024-000001');
      expect(parsed.route).toBe('DEL-IXI');
    });
  });

  describe('generateShipmentQRPayload', () => {
    it('should generate valid shipment QR payload', () => {
      const payload = generateShipmentQRPayload('tac12345678');

      const parsed = JSON.parse(payload);
      expect(parsed.v).toBe(1);
      expect(parsed.awb).toBe('TAC12345678');
    });
  });

  describe('Idempotency scenarios', () => {
    it('should produce identical results for repeated parsing', () => {
      const input = 'TAC12345678';
      const result1 = parseScanInput(input);
      const result2 = parseScanInput(input);
      const result3 = parseScanInput(input);

      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });

    it('should produce consistent output for 100 rapid parses', () => {
      const input = 'TAC99999999';
      const results = Array.from({ length: 100 }, () => parseScanInput(input));

      // All results should be identical
      const first = results[0];
      results.forEach((result) => {
        expect(result.awb).toBe(first.awb);
        expect(result.type).toBe(first.type);
      });
    });
  });
});
