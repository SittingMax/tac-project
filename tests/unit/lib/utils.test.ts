/**
 * Unit Tests for Utility Functions
 * Tests core utility functions used across the application
 */

import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (className utility)', () => {
  it('should merge class names correctly', () => {
    const result = cn('base-class', 'additional-class');
    expect(result).toBe('base-class additional-class');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toBe('base active');
  });

  it('should filter out falsy values', () => {
    const result = cn('base', false, null, undefined, 'valid');
    expect(result).toBe('base valid');
  });

  it('should handle Tailwind merge conflicts', () => {
    // tailwind-merge should handle conflicting classes
    const result = cn('p-4', 'p-6');
    expect(result).toBe('p-6');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle object syntax', () => {
    const result = cn({
      'base-class': true,
      'disabled-class': false,
      'active-class': true,
    });
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
    expect(result).not.toContain('disabled-class');
  });
});
