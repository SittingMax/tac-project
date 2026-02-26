import { useRef, useEffect } from 'react';

/**
 * Hook to track the previous value of a state/prop
 * Useful for comparing current vs previous values for animations
 *
 * @param value - The value to track
 * @returns Previous value (undefined on first render)
 *
 * @example
 * const [count, setCount] = useState(0);
 * const previousCount = usePrevious(count);
 * const isIncreasing = count > (previousCount ?? 0);
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
