'use client';

import { motion, useInView, type Variants } from '@/lib/motion';
import { useRef } from 'react';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { MOTION_TOKENS } from '@/lib/animation-tokens';

interface StaggerChildrenProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
  threshold?: number;
  once?: boolean;
}

export function StaggerChildren({
  children,
  className = '',
  staggerDelay = MOTION_TOKENS.stagger.normal,
  initialDelay = 0,
  threshold = 0.1,
  once = true,
}: StaggerChildrenProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });
  const shouldReduceMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
        delayChildren: initialDelay,
      },
    },
  };

  // We export a default child variant for convenience,
  // but children can use their own variants if they match the hidden/visible keys
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Helper variant for standard fade-up children
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_TOKENS.duration.normal,
      ease: MOTION_TOKENS.ease.default,
    },
  },
};
