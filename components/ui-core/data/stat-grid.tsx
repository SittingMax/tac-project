import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const statGridVariants = cva('grid gap-4 md:gap-6', {
  variants: {
    columns: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    },
  },
  defaultVariants: {
    columns: 4,
  },
});

interface StatGridProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof statGridVariants> {}

export function StatGrid({ columns, className, children, ...props }: StatGridProps) {
  return (
    <div className={cn(statGridVariants({ columns, className }))} {...props}>
      {children}
    </div>
  );
}
