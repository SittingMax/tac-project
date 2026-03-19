import * as React from 'react';
import { cn } from '@/lib/utils';

export function ActionBar({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 border-t border-border px-4 py-3 bg-background',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
