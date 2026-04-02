'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { flushSync } from 'react-dom';

import { cn } from '@/lib/utils';

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<'button'> {
  className?: string;
  duration?: number;
  onThemeChange?: (theme: 'dark' | 'light') => void;
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  onThemeChange,
  ...props
}: AnimatedThemeTogglerProps) => {
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return;

    setIsAnimating(true);

    const performThemeChange = () => {
      const newTheme = !isDark;
      setIsDark(newTheme);
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(newTheme ? 'dark' : 'light');
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      onThemeChange?.(newTheme ? 'dark' : 'light');
    };

    // Check if View Transitions API is supported
    if (document.startViewTransition) {
      try {
        await document.startViewTransition(() => {
          flushSync(performThemeChange);
        }).ready;

        const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
        const x = left + width / 2;
        const y = top + height / 2;
        const maxRadius = Math.hypot(
          Math.max(left, window.innerWidth - left),
          Math.max(top, window.innerHeight - top)
        );

        document.documentElement.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`],
          },
          {
            duration,
            easing: 'ease-in-out',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      } catch {
        // Fallback if View Transition fails
        performThemeChange();
      }
    } else {
      // Fallback for browsers without View Transitions API
      performThemeChange();
    }

    setTimeout(() => setIsAnimating(false), duration);
  }, [isDark, duration, onThemeChange]);

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        className
      )}
      {...props}
    >
      <div
        className={cn('relative transition', isAnimating && 'animate-spin')}
        style={{
          animationDuration: `${duration}ms`,
          animationTimingFunction: 'ease-in-out',
        }}
      >
        {isDark ? (
          <Sun
            className={cn(
              'h-4 w-4 transition duration-300',
              isAnimating ? 'scale-110 text-status-warning' : 'scale-100'
            )}
            strokeWidth={1.5}
          />
        ) : (
          <Moon
            className={cn(
              'h-4 w-4 transition duration-300',
              isAnimating ? 'scale-110 text-primary' : 'scale-100'
            )}
            strokeWidth={1.5}
          />
        )}
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};
