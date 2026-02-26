'use client';

import { motion, useScroll, useTransform, useSpring } from '@/lib/motion';
import { useRef, useEffect, useState } from 'react';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

interface ParallaxLayerProps {
  children: React.ReactNode;
  className?: string;
  depth?: number; // 0 to 1, higher is faster
  direction?: 'normal' | 'reverse';
  offset?: number; // max offset in pixels
}

export function ParallaxLayer({
  children,
  className = '',
  depth = 0.2,
  direction = 'normal',
  offset = 50,
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [elementTop, setElementTop] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);

  const { scrollY } = useScroll();

  // Calculate the y-transform based on scroll position
  // We want the element to be at 0 offset when it's in the center of the viewport
  // and move up or down as we scroll

  useEffect(() => {
    if (!ref.current) return;

    const onResize = () => {
      const rect = ref.current?.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setElementTop((rect?.top || 0) + scrollTop);
      setClientHeight(window.innerHeight);
    };

    onResize();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize); // Recalculate on scroll to ensure accuracy if layout shifts

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize);
    };
  }, []);

  const initial = elementTop - clientHeight;
  const final = elementTop + clientHeight;

  // Transform scroll range [initial, final] to output range [-offset, offset]
  // If direction is reverse, range is [offset, -offset]
  const yRange =
    direction === 'normal' ? [-offset * depth, offset * depth] : [offset * depth, -offset * depth];

  const y = useTransform(scrollY, [initial, final], yRange);

  const springY = useSpring(y, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div ref={ref} className={className} style={{ y: springY }}>
      {children}
    </motion.div>
  );
}
