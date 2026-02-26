import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect } from 'react';

// Register plugins globally
gsap.registerPlugin(ScrollTrigger);

// Export configured gsap instance
export { gsap, ScrollTrigger };

/**
 * Hook to safely use GSAP with React Strict Mode
 * Handles cleanup automatically
 */
export function useGSAP(
  callback: (context: gsap.Context, contextSafe?: gsap.ContextSafeFunc) => void | gsap.ContextFunc,
  dependencies: React.DependencyList = []
) {
  useLayoutEffect(() => {
    const ctx = gsap.context(callback);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
