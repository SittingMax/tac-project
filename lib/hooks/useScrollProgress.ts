import { useScroll, useSpring } from '@/lib/motion';

/**
 * Hook to track scroll progress with a smooth spring animation
 * @returns MotionValue representing scroll progress (0-1)
 */
export function useScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return scaleX;
}
