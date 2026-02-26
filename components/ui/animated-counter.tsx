import { useEffect, useState } from 'react';
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver.ts';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}

/**
 * Animated counter component with intersection observer
 * Only starts animation when element is in viewport
 *
 * @example
 * <AnimatedCounter value={2500} suffix="+" />
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  suffix = '',
  prefix = '',
  duration = 2000,
  decimals = 0,
  className = '',
}) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true,
  });

  useEffect(() => {
    // Only animate once when first visible
    if (!isIntersecting || hasAnimated) return;

    setHasAnimated(true);

    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setCount(value);
        clearInterval(timer);
      } else {
        // Easing function for smooth animation
        const progress = currentStep / steps;
        const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
        setCount(Math.floor(value * easeOut));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isIntersecting, value, duration, hasAnimated]);

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  );
};

/**
 * Pre-configured counter variants for common use cases
 */
export const ShipmentCounter: React.FC<{ value: number }> = ({ value }) => (
  <AnimatedCounter value={value} suffix="+" className="text-4xl font-bold" />
);

export const PercentageCounter: React.FC<{ value: number }> = ({ value }) => (
  <AnimatedCounter value={value} suffix="%" decimals={1} className="text-4xl font-bold" />
);

export const CurrencyCounter: React.FC<{ value: number }> = ({ value }) => (
  <AnimatedCounter value={value} prefix="₹" className="text-4xl font-bold" />
);

export default AnimatedCounter;
