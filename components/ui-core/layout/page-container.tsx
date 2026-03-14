import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max width constraint for the page content */
  maxWidth?: 'default' | 'narrow' | 'wide' | 'full';
}

const maxWidthMap = {
  default: 'max-w-[1400px]',
  narrow: 'max-w-[900px]',
  wide: 'max-w-[1600px]',
  full: 'max-w-full',
} as const;

/**
 * Top-level page wrapper that provides consistent max-width,
 * horizontal padding, vertical spacing, and entry animation.
 *
 * Every authenticated page should be wrapped in <PageContainer>.
 */
export function PageContainer({
  maxWidth = 'default',
  className,
  children,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6',
        'animate-in fade-in slide-in-from-bottom-2 duration-500',
        maxWidthMap[maxWidth],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
