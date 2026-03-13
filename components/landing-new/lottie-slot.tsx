import { useEffect, useRef, useState, type ReactNode } from 'react';
import Lottie from 'lottie-react';

interface LottieSlotProps {
  /** Path to the Lottie JSON file in /public, e.g. "/lottie/plane.json" */
  src: string;
  /** Fallback icon to display while loading or if the file fails */
  fallbackIcon?: ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
  /** Whether the animation should loop (default: true) */
  loop?: boolean;
  /** Playback speed multiplier (default: 1) */
  speed?: number;
}

/**
 * Reusable Lottie animation slot.
 *
 * - Lazy-loads and starts animation only when the element enters the viewport
 * - Falls back to an icon or skeleton if the JSON fails to load
 * - Respects `prefers-reduced-motion`: shows first frame only
 */
export function LottieSlot({
  src,
  fallbackIcon,
  className = '',
  loop = true,
  speed = 1,
}: LottieSlotProps) {
  const [animationData, setAnimationData] = useState<unknown>(null);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // IntersectionObserver → only load when visible
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Fetch JSON when visible
  useEffect(() => {
    if (!isVisible) return;

    let cancelled = false;

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: unknown) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isVisible, src]);

  return (
    <div ref={containerRef} className={`flex items-center justify-center ${className}`}>
      {animationData ? (
        <Lottie
          animationData={animationData}
          loop={prefersReducedMotion ? false : loop}
          autoplay={!prefersReducedMotion}
          className="w-full h-full"
          rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
          style={{ animationPlayState: prefersReducedMotion ? 'paused' : 'running' }}
          data-speed={speed}
        />
      ) : hasError && fallbackIcon ? (
        <div className="flex items-center justify-center opacity-50">{fallbackIcon}</div>
      ) : (
        /* Skeleton pulse while loading */
        <div className="w-full h-full rounded-sm bg-muted/20 animate-pulse" />
      )}
    </div>
  );
}
