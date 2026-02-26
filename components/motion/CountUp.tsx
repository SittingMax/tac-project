'use client';

import { useRef } from 'react';
import { useInView } from '@/lib/motion';
import { useGSAP, gsap } from '@/lib/gsap';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export function CountUp({
  to,
  from = 0,
  duration = 2,
  delay = 0,
  className = '',
  suffix = '',
  prefix = '',
  decimals = 0,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const shouldReduceMotion = useReducedMotion();
  const hasAnimated = useRef(false);

  useGSAP(() => {
    if (!isInView || hasAnimated.current || !ref.current || shouldReduceMotion) return;

    hasAnimated.current = true;

    gsap.fromTo(
      ref.current,
      { textContent: from },
      {
        textContent: to,
        duration,
        delay,
        ease: 'power2.out',
        // Only snap to integer if no decimals are required, otherwise let it float roughly and format in onUpdate
        snap: decimals === 0 ? { textContent: 1 } : undefined,
        onUpdate: function () {
          if (ref.current) {
            const value = parseFloat(this.targets()[0].textContent || '0');
            ref.current.textContent =
              prefix +
              value.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              }) +
              suffix;
          }
        },
      }
    );
  }, [isInView, shouldReduceMotion]);

  // Initial render state
  const initialValue = shouldReduceMotion ? to : from;
  const formattedInitial =
    prefix +
    initialValue.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) +
    suffix;

  return (
    <span ref={ref} className={className}>
      {formattedInitial}
    </span>
  );
}
