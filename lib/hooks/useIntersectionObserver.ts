import { useState, useEffect, useRef, useCallback } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

interface IntersectionObserverResult {
  ref: (node: Element | null) => void;
  isIntersecting: boolean;
  entry?: IntersectionObserverEntry;
}

/**
 * Hook for observing element visibility in viewport
 * Useful for lazy loading, animations on scroll, and analytics
 *
 * @param options - IntersectionObserver options
 * @returns Object with ref callback and intersection state
 *
 * @example
 * const { ref, isIntersecting } = useIntersectionObserver({
 *   threshold: 0.1,
 *   freezeOnceVisible: true
 * });
 *
 * return (
 *   <div ref={ref}>
 *     {isIntersecting && <ExpensiveComponent />}
 *   </div>
 * );
 */
export function useIntersectionObserver({
  threshold = 0,
  root = null,
  rootMargin = '0px',
  freezeOnceVisible = false,
}: UseIntersectionObserverOptions = {}): IntersectionObserverResult {
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const [node, setNode] = useState<Element | null>(null);
  const frozen = useRef(false);

  const isIntersecting = entry?.isIntersecting ?? false;

  // Freeze if visible and freezeOnceVisible is true
  if (freezeOnceVisible && isIntersecting) {
    frozen.current = true;
  }

  const ref = useCallback((newNode: Element | null) => {
    setNode(newNode);
  }, []);

  useEffect(() => {
    // Skip if already frozen or no node
    if (frozen.current || !node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
      },
      { threshold, root, rootMargin }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [node, threshold, root, rootMargin]);

  return {
    ref,
    isIntersecting: frozen.current ? true : isIntersecting,
    entry,
  };
}
