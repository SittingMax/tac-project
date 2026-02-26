'use client';

import { motion } from '@/lib/motion';
import { useScrollProgress } from '@/lib/hooks/useScrollProgress';

export function ScrollProgress() {
  const scaleX = useScrollProgress();

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-primary z-50 origin-left"
      style={{ scaleX }}
    />
  );
}
