import { describe, expect, it } from 'vitest';
import { useDebounce as canonicalUseDebounce } from '@/lib/hooks/useDebounce';
import { useDebounce as legacyUseDebounce } from '@/hooks/useDebounce';

describe('hooks/useDebounce compatibility', () => {
  it('re-exports the canonical debounce hook', () => {
    expect(legacyUseDebounce).toBe(canonicalUseDebounce);
  });
});
