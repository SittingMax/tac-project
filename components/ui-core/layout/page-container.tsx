import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max width constraint: 'default' (1400px), 'narrow' (900px), 'wide' (1600px), 'full' */
  size?: 'default' | 'narrow' | 'wide' | 'full';
}

const sizeMap = {
  default: 'max-w-[1400px]',
  narrow: 'max-w-[900px]',
  wide: 'max-w-[1600px]',
  full: 'max-w-full',
} as const;

/**
 * Top-level page wrapper that provides consistent max-width,
 * horizontal padding, vertical spacing, and fade-in animation.
 *
 * Every authenticated page should be wrapped in <PageContainer>.
 */
export function PageContainer({
  size = 'default',
  className,
  children,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6',
        'animate-in fade-in slide-in-from-bottom-2 duration-500',
        sizeMap[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
