/**
 * Unit Tests for useDebounce Hook
 * Based on tac-testing-engineer skill patterns
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/lib/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500));
    expect(result.current).toBe('hello');
  });

  it('does not update value before delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'hello' },
    });

    rerender({ value: 'world' });
    expect(result.current).toBe('hello'); // Still old value

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('hello'); // Still old value at 300ms
  });

  it('updates value after delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'hello' },
    });

    rerender({ value: 'world' });
    expect(result.current).toBe('hello'); // Still old value

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('world'); // Now updated
  });

  it('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'a' },
    });

    // Rapid changes
    rerender({ value: 'ab' });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: 'abc' });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: 'abcd' });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Still showing initial value because timer keeps resetting
    expect(result.current).toBe('a');

    // Wait full delay
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('abcd');
  });

  it('handles empty string', () => {
    const { result } = renderHook(() => useDebounce('', 500));
    expect(result.current).toBe('');
  });

  it('handles different delay values', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: 'fast' },
    });

    rerender({ value: 'slow' });

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('slow');
  });

  it('handles zero delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 0), {
      initialProps: { value: 'instant' },
    });

    rerender({ value: 'updated' });

    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current).toBe('updated');
  });

  it('cleans up timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { unmount, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'test' },
    });

    rerender({ value: 'changed' });
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('works with number values', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 0 },
    });

    rerender({ value: 42 });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe(42);
  });

  it('works with object values', () => {
    const initialObj = { name: 'test' };
    const newObj = { name: 'updated' };

    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: initialObj },
    });

    rerender({ value: newObj });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toEqual({ name: 'updated' });
  });
});
