import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { GSTIN_PATTERN, GSTIN_ERROR_MESSAGE } from '../../../lib/constants';

// Create a simple schema to test the regex
const schema = z.string().regex(GSTIN_PATTERN, GSTIN_ERROR_MESSAGE);

describe('GSTIN Validation Logic', () => {
  it('should validate correct GSTIN formats', () => {
    const validGSTINs = [
      '27ABCDE1234F1Z5', // Standard format
      '07AABCU9603R1Z2', // Delhi example
      '08ABCDE9999F1Z8', // Rajasthan example
      '29AAACH7409R1ZX', // Karnataka example
      '33AAPCA2602M1Z2', // Tamil Nadu example
    ];

    validGSTINs.forEach((gstin) => {
      expect(() => schema.parse(gstin)).not.toThrow();
    });
  });

  it('should reject invalid GSTIN formats', () => {
    const invalidGSTINs = [
      '27AAA', // Too short
      '27ABCDE1234F1Z55', // Too long
      '27ABCDE1234F1Z', // Missing character
      'ZZABCDE1234F1Z5', // Invalid state code (letters)
      '27123451234F1Z5', // Invalid PAN (numbers where letters should be)
      '27ABCDEAAAAF1Z5', // Invalid PAN (letters where numbers should be)
      '27ABCDE1234F1Y5', // 14th char not Z (default is Z)
      '27ABCDE1234F1Z', // Missing checksum
      '27ABCDE123451Z5', // Invalid PAN length
    ];

    invalidGSTINs.forEach((gstin) => {
      expect(() => schema.parse(gstin)).toThrow(GSTIN_ERROR_MESSAGE);
    });
  });

  it('should validate specific parts of the structure', () => {
    // State code must be digits
    expect(() => schema.parse('AAABCDE1234F1Z5')).toThrow();

    // PAN must be 5 chars, 4 digits, 1 char
    expect(() => schema.parse('27123451234F1Z5')).toThrow(); // First 5 chars of PAN are digits

    // 14th char must be Z
    expect(() => schema.parse('27ABCDE1234F1X5')).toThrow();
  });
});
