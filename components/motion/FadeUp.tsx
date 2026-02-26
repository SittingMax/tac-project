'use client';

import { motion, useInView, type Variants } from '@/lib/motion';
import { useRef } from 'react';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { MOTION_TOKENS } from '@/lib/animation-tokens';

interface FadeUpProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
  threshold?: number;
  once?: boolean;
}

export function FadeUp({
  children,
  className = '',
  delay = 0,
  duration = MOTION_TOKENS.duration.normal,
  y = MOTION_TOKENS.distance.small,
  threshold = 0.1,
  once = true,
}: FadeUpProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });
  const shouldReduceMotion = useReducedMotion();

  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : y,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration,
        delay,
        ease: MOTION_TOKENS.ease.default,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
